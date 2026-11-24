"use client";

import { FormEvent, useState } from "react";
import { JobProgress } from "@/components/JobProgress";
import { useFramely } from "@/lib/framely-context";
import { useJobPoller } from "@/lib/hooks/useJobPoller";

export function ConvertForm() {
  const { completedExtractJobId, convertJobId, setConvertJobId } = useFramely();
  const [prompt, setPrompt] = useState(
    "Build a clean Next.js App Router project with reusable components and Tailwind. Keep the Framer layout and motion cues.",
  );
  const [framework, setFramework] = useState<"nextjs" | "react">("nextjs");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { job, error } = useJobPoller(convertJobId);

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
        if (completedExtractJobId) form.set("sourceJobId", completedExtractJobId);
        response = await fetch("/api/convert", { method: "POST", body: form });
      } else {
        response = await fetch("/api/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceJobId: completedExtractJobId,
            prompt,
            framework,
          }),
        });
      }

      const data = (await response.json()) as { jobId?: string; error?: string };
      if (!response.ok || !data.jobId) {
        throw new Error(data.error || "Convert failed to start");
      }
      setConvertJobId(data.jobId);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Convert failed");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    Boolean(file || completedExtractJobId) && prompt.trim().length >= 8;

  return (
    <section className="panel" id="convert" tabIndex={-1}>
      <div className="panel-head">
        <p className="step">Step 2</p>
        <h2 className="panel-title">Convert</h2>
        <p className="lede">
          Use the extract from Step 1 or upload a zip, then describe the project
          you want.
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
            <option value="nextjs">Next.js</option>
            <option value="react">React</option>
          </select>
        </label>
        <label className="field">
          <span>Prompt</span>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={4}
            required
            minLength={8}
          />
        </label>
        <label className="field">
          <span>Upload zip (optional)</span>
          <input
            type="file"
            accept=".zip,application/zip"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </label>
        {completedExtractJobId ? (
          <p className="hint">
            Using extract <span className="mono">{completedExtractJobId.slice(0, 8)}</span>
          </p>
        ) : (
          <p className="hint">Finish extract or upload a zip.</p>
        )}
        <button className="primary" type="submit" disabled={submitting || !canSubmit}>
          {submitting ? "Converting…" : `Convert to ${framework}`}
        </button>
        {formError ? <p className="error-text">{formError}</p> : null}
      </form>
      <JobProgress job={job} error={error} />
    </section>
  );
}
