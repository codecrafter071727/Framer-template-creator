import { after } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { createJob, readJob, updateJob } from "@/lib/jobs/store";
import { runConversion } from "@/lib/convert/pipeline";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { convertRequestSchema } from "@/lib/validation";
import { jobWorkspace, jobZipPath } from "@/lib/paths";
import { writeBinary, writeText } from "@/lib/storage";
import type { ExtractManifest } from "@/lib/types";

export const maxDuration = 300;

async function ingestUploadedZip(jobId: string, file: File): Promise<void> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const zipPath = jobZipPath(jobId);
  await writeBinary(zipPath, buffer);

  const zip = await JSZip.loadAsync(buffer);
  const workspace = jobWorkspace(jobId);
  await fs.mkdir(workspace, { recursive: true });

  const entries = Object.values(zip.files);
  for (const entry of entries) {
    if (entry.dir) continue;
    const target = path.join(workspace, entry.name);
    const data = Buffer.from(await entry.async("nodebuffer"));
    await writeBinary(target, data);
  }

  if (!zip.file("manifest.json")) {
    const htmlFiles = entries
      .filter((entry) => !entry.dir && /\.html?$/i.test(entry.name))
      .slice(0, 10);

    const manifest: ExtractManifest = {
      sourceUrl: "uploaded://zip",
      fetchedAt: new Date().toISOString(),
      pages: await Promise.all(
        htmlFiles.map(async (entry) => ({
          url: `uploaded://${entry.name}`,
          localPath: entry.name,
          title: entry.name,
        })),
      ),
      assets: [],
      notes: ["Manifest synthesized from uploaded zip"],
    };
    await writeText(
      path.join(workspace, "manifest.json"),
      JSON.stringify(manifest, null, 2),
    );
  }
}

export async function POST(request: Request) {
  const limited = rateLimit(`convert:${clientKey(request)}`, 4, 60_000);
  if (!limited.ok) {
    return Response.json(
      { error: "Rate limit exceeded", retryAfterSec: limited.retryAfterSec },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const contentType = request.headers.get("content-type") || "";
  let sourceJobId: string | undefined;
  let prompt: string | undefined;
  let framework: "nextjs" | "react" = "nextjs";
  let upload: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    sourceJobId = String(form.get("sourceJobId") || "") || undefined;
    prompt = String(form.get("prompt") || "") || undefined;
    const fw = String(form.get("framework") || "nextjs");
    framework = fw === "react" ? "react" : "nextjs";
    const file = form.get("file");
    if (file instanceof File && file.size > 0) {
      const maxBytes = 45 * 1024 * 1024;
      if (file.size > maxBytes) {
        return Response.json(
          { error: "Zip upload exceeds 45MB limit" },
          { status: 413 },
        );
      }
      if (
        !file.name.toLowerCase().endsWith(".zip") &&
        file.type !== "application/zip" &&
        file.type !== "application/x-zip-compressed"
      ) {
        return Response.json(
          { error: "Only .zip uploads are supported" },
          { status: 400 },
        );
      }
      upload = file;
    }
  } else {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = convertRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    sourceJobId = parsed.data.sourceJobId;
    prompt = parsed.data.prompt;
    framework = parsed.data.framework;
  }

  const parsed = convertRequestSchema.safeParse({
    sourceJobId,
    prompt,
    framework,
  });
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!upload && !parsed.data.sourceJobId) {
    return Response.json(
      { error: "Provide sourceJobId or upload a zip file" },
      { status: 400 },
    );
  }

  if (parsed.data.sourceJobId) {
    const source = await readJob(parsed.data.sourceJobId);
    if (!source || source.kind !== "extract" || source.status !== "completed") {
      return Response.json(
        { error: "sourceJobId must reference a completed extract job" },
        { status: 400 },
      );
    }
  }

  const job = await createJob("convert", {
    prompt: parsed.data.prompt,
    framework: parsed.data.framework,
    sourceJobId: parsed.data.sourceJobId,
  });

  after(async () => {
    try {
      let effectiveSourceId = parsed.data.sourceJobId;
      if (upload) {
        const extractJob = await createJob("extract", {
          sourceUrl: `upload://${upload.name}`,
        });
        await updateJob(extractJob.id, {
          status: "running",
          progress: { step: "ingest-upload", percent: 20 },
        });
        await ingestUploadedZip(extractJob.id, upload);
        await updateJob(extractJob.id, {
          status: "completed",
          progress: { step: "done", percent: 100 },
          resultPath: jobZipPath(extractJob.id),
          downloadName: upload.name,
        });
        effectiveSourceId = extractJob.id;
        await updateJob(job.id, { sourceJobId: extractJob.id });
      }

      if (!effectiveSourceId) {
        throw new Error("Missing source extract");
      }

      await runConversion({
        jobId: job.id,
        sourceJobId: effectiveSourceId,
        prompt: parsed.data.prompt,
        framework: parsed.data.framework,
      });
    } catch (error) {
      await updateJob(job.id, {
        status: "failed",
        error: error instanceof Error ? error.message : "Conversion failed",
        progress: { step: "failed", percent: 100 },
      });
    }
  });

  return Response.json({
    jobId: job.id,
    status: job.status,
  });
}
