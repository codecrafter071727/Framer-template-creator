import { promises as fs } from "node:fs";
import { requireSession } from "@/lib/auth/session";
import { readJob } from "@/lib/jobs/store";
import { jobZipPath } from "@/lib/paths";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireSession(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const job = await readJob(id);
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status !== "completed") {
    return Response.json(
      { error: "Job is not ready for download", status: job.status },
      { status: 409 },
    );
  }

  if (job.resultBlobUrl) {
    return Response.redirect(job.resultBlobUrl, 302);
  }

  const zipPath = job.resultPath || jobZipPath(id);
  try {
    const bytes = await fs.readFile(zipPath);
    const filename = job.downloadName || `job-${id}.zip`;
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json({ error: "Zip file missing" }, { status: 404 });
  }
}
