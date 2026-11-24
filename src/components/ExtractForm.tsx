"use client";

import { FormEvent, useEffect } from "react";
import { JobProgress } from "@/components/JobProgress";
import { useFramely } from "@/lib/framely-context";
import { useJobPoller } from "@/lib/hooks/useJobPoller";

export function ExtractForm() {
  const {
    sourceUrl,
    setSourceUrl,
    extractJobId,
    startExtract,
    startingExtract,
    extractError,
    clearExtractError,
    markExtractCompleted,
  } = useFramely();
  const { job, error } = useJobPoller(extractJobId);
  const busy = job?.status === "running" || job?.status === "queued";

  useEffect(() => {
    if (job?.status === "completed" && extractJobId) {
      markExtractCompleted(extractJobId);
    }
  }, [job?.status, extractJobId, markExtractCompleted]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    clearExtractError();
    await startExtract(sourceUrl);
  }

  return (
    <section className="panel" id="extract" tabIndex={-1}>
      <div className="panel-head">
        <p className="step">Step 1</p>
        <h2 className="panel-title">Extract</h2>
        <p className="lede">
          Paste a published Framer URL. Framely captures HTML, JS, CSS, fonts,
          images, and media into one zip.
        </p>
      </div>
      <form className="stack" onSubmit={onSubmit}>
        <label className="field">
          <span>Framer URL</span>
          <input
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            placeholder="https://your-site.framer.website"
            required
            type="url"
          />
        </label>
        <button
          className="primary"
          type="submit"
          disabled={startingExtract || !sourceUrl.trim() || busy}
        >
          {startingExtract || busy ? "Extracting…" : "Start extract"}
        </button>
        {extractError ? <p className="error-text">{extractError}</p> : null}
      </form>
      <JobProgress job={job} error={error} />
    </section>
  );
}
