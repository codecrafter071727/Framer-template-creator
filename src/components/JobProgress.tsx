"use client";

import type { PolledJob } from "@/lib/hooks/useJobPoller";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function JobProgress({
  job,
  error,
}: {
  job: PolledJob | null;
  error?: string | null;
}) {
  if (!job && !error) return null;

  const percent = job?.progress.percent ?? 0;
  const completeness = job?.manifest?.completeness;

  return (
    <div className="progress-panel">
      {error ? <p className="error-text">{error}</p> : null}
      {job ? (
        <>
          <div className="progress-meta">
            <span className="mono">{job.id.slice(0, 8)}</span>
            <span className={`status status-${job.status}`}>{job.status}</span>
          </div>
          <div className="progress-track" aria-hidden>
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <p className="progress-detail">
            {job.progress.step}
            {job.progress.detail ? ` — ${job.progress.detail}` : ""}
          </p>
          {job.error ? <p className="error-text">{job.error}</p> : null}
          {job.status === "completed" ? (
            <a
              className="download-link"
              href={`/api/jobs/${job.id}/download`}
              download={job.downloadName || undefined}
            >
              Download {job.downloadName || "zip"}
            </a>
          ) : null}
          {job.manifest ? (
            <p className="progress-detail">
              {job.manifest.pageCount} pages · {job.manifest.assetCount} assets
              {completeness
                ? ` · ${completeness.engine} · ${formatBytes(completeness.totalBytes)}`
                : ""}
            </p>
          ) : null}
          {completeness?.byType ? (
            <p className="progress-detail">
              {Object.entries(completeness.byType)
                .map(([key, value]) => `${key}:${value}`)
                .join(" · ")}
            </p>
          ) : null}
          {completeness?.accuracy ? (
            <p className="progress-detail">
              Accuracy {completeness.accuracy.grade} ({completeness.accuracy.overall}/100)
              {completeness.accuracy.checklist?.[0]
                ? ` · ${completeness.accuracy.checklist[0]}`
                : ""}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
