import { after } from "next/server";
import { createJob, updateJob } from "@/lib/jobs/store";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { assertSafeUrl } from "@/lib/ssrf";
import { extractRequestSchema } from "@/lib/validation";

export const maxDuration = 300;

export async function POST(request: Request) {
  const limited = rateLimit(`extract:${clientKey(request)}`, 6, 60_000);
  if (!limited.ok) {
    return Response.json(
      { error: "Rate limit exceeded", retryAfterSec: limited.retryAfterSec },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = extractRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await assertSafeUrl(parsed.data.url);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "URL failed safety checks",
      },
      { status: 400 },
    );
  }

  const job = await createJob("extract", {
    sourceUrl: parsed.data.url,
  });

  after(async () => {
    try {
      const { runExtraction } = await import("@/lib/extract/crawler");
      await runExtraction(job.id, parsed.data.url, parsed.data.maxPages);
    } catch (error) {
      await updateJob(job.id, {
        status: "failed",
        error: error instanceof Error ? error.message : "Extraction failed",
        progress: { step: "failed", percent: 100 },
      });
    }
  });

  return Response.json({
    jobId: job.id,
    status: job.status,
  });
}
