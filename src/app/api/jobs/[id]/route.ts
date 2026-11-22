import { readJob } from "@/lib/jobs/store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const job = await readJob(id);
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  return Response.json({
    id: job.id,
    kind: job.kind,
    status: job.status,
    progress: job.progress,
    error: job.error,
    sourceUrl: job.sourceUrl,
    framework: job.framework,
    prompt: job.prompt,
    sourceJobId: job.sourceJobId,
    downloadName: job.downloadName,
    resultBlobUrl: job.resultBlobUrl,
    manifest: job.manifest
      ? {
          sourceUrl: job.manifest.sourceUrl,
          fetchedAt: job.manifest.fetchedAt,
          pageCount: job.manifest.pages.length,
          assetCount: job.manifest.assets.length,
          notes: job.manifest.notes.slice(0, 20),
          completeness: job.manifest.completeness
            ? {
                engine: job.manifest.completeness.engine,
                pagesCaptured: job.manifest.completeness.pagesCaptured,
                assetsSaved: job.manifest.completeness.assetsSaved,
                totalBytes: job.manifest.completeness.totalBytes,
                byType: job.manifest.completeness.byType,
                nestedDiscovered: job.manifest.completeness.nestedDiscovered,
                missingCount:
                  job.manifest.completeness.missingFromRewrite.length,
                accuracy: job.manifest.completeness.accuracy,
              }
            : undefined,
        }
      : undefined,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  });
}
