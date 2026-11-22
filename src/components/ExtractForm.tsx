"use client";

import { FormEvent, useEffect, useState } from "react";
import { JobProgress } from "@/components/JobProgress";
import { useJobPoller } from "@/lib/hooks/useJobPoller";

export function ExtractForm({
  onExtracted,
}: {
  onExtracted: (jobId: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { job, error } = useJobPoller(jobId);

  useEffect(() => {
    if (job?.status === "completed" && jobId) {
      onExtracted(jobId);
    }
  }, [job?.status, jobId, onExtracted]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, maxPages: 15 }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Extract failed to start");
      }
      setJobId(data.jobId);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Extract failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <p className="step">Step 1</p>
        <h2>Extract Framer template</h2>
        <p className="lede">
          Paste a published Framer URL. Production CDP capture saves every network
          file the site loads (HTML, JS, CSS, fonts, images, media, JSON), backfills
          anything missed, then ships a gated high-accuracy zip.
        </p>
      </div>
      <form className="stack" onSubmit={onSubmit}>
        <label className="field">
          <span>Framer URL</span>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://your-template.framer.website"
            required
            type="url"
          />
        </label>
        <button className="primary" type="submit" disabled={submitting || !url}>
          {submitting ? "Capturing every asset…" : "Extract production-complete zip"}
        </button>
        {formError ? <p className="error-text">{formError}</p> : null}
      </form>
      <JobProgress job={job} error={error} />
    </section>
  );
}
