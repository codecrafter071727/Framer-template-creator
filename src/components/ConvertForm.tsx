"use client";

import { FormEvent, useState } from "react";
import { JobProgress } from "@/components/JobProgress";
import { useJobPoller } from "@/lib/hooks/useJobPoller";

export function ConvertForm({ sourceJobId }: { sourceJobId: string | null }) {
  const [prompt, setPrompt] = useState(
    "Convert into a clean Next.js App Router project with reusable components, Tailwind, and accessible markup. Keep the visual hierarchy close to the original.",
  );
  const [framework, setFramework] = useState<"nextjs" | "react">("nextjs");
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { job, error } = useJobPoller(jobId);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      let response: Response;
      if (file) {
        const form = new FormData();
        form.set("file", file);
        form.set("prompt", prompt);
        form.set("framework", framework);
        if (sourceJobId) form.set("sourceJobId", sourceJobId);
        response = await fetch("/api/convert", { method: "POST", body: form });
      } else {
        response = await fetch("/api/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceJobId,
            prompt,
            framework,
          }),
        });
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Convert failed to start");
      }
      setJobId(data.jobId);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Convert failed");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = Boolean(file || sourceJobId) && prompt.trim().length >= 8;

  return (
    <section className="panel">
      <div className="panel-head">
        <p className="step">Step 2</p>
        <h2>Convert with a prompt</h2>
        <p className="lede">
          Use the extract from Step 1, or upload a zip, then describe how you want
          the Next.js or React project shaped.
        </p>
      </div>
      <form className="stack" onSubmit={onSubmit}>
        <label className="field">
          <span>Framework</span>
          <select
            value={framework}
            onChange={(event) =>
              setFramework(event.target.value as "nextjs" | "react")
            }
          >
            <option value="nextjs">Next.js (App Router)</option>
            <option value="react">React (Vite)</option>
          </select>
        </label>
        <label className="field">
          <span>Prompt</span>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={5}
            required
            minLength={8}
          />
        </label>
        <label className="field">
          <span>Or upload extract zip</span>
          <input
            type="file"
            accept=".zip,application/zip"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </label>
        {sourceJobId ? (
          <p className="hint">
            Using extract job <span className="mono">{sourceJobId.slice(0, 8)}</span>
          </p>
        ) : (
          <p className="hint">No extract yet — upload a zip to continue.</p>
        )}
        <button className="primary" type="submit" disabled={submitting || !canSubmit}>
          {submitting ? "Starting…" : `Generate ${framework} zip`}
        </button>
        {formError ? <p className="error-text">{formError}</p> : null}
      </form>
      <JobProgress job={job} error={error} />
    </section>
  );
}
