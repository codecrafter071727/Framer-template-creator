"use client";

import { useCallback, useEffect, useState } from "react";

export type PolledJob = {
  id: string;
  kind: "extract" | "convert";
  status: "queued" | "running" | "completed" | "failed";
  progress: { step: string; percent: number; detail?: string };
  error?: string;
  downloadName?: string;
  resultBlobUrl?: string;
  sourceUrl?: string;
  framework?: "nextjs" | "react";
  sourceJobId?: string;
  manifest?: {
    sourceUrl: string;
    fetchedAt: string;
    pageCount: number;
    assetCount: number;
    notes: string[];
    completeness?: {
      engine: "playwright" | "playwright-cdp" | "fetch-fallback";
      pagesCaptured: number;
      assetsSaved: number;
      totalBytes: number;
      byType: Record<string, number>;
      nestedDiscovered: number;
      missingCount: number;
      accuracy?: {
        overall: number;
        grade: "A" | "B" | "C" | "D";
        checklist: string[];
      };
    };
  };
};

export function useJobPoller(jobId: string | null) {
  const [job, setJob] = useState<PolledJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!jobId) return;
    const response = await fetch(`/api/jobs/${jobId}`);
    if (!response.ok) {
      setError("Failed to load job status");
      return;
    }
    const data = (await response.json()) as PolledJob;
    setJob(data);
    setError(null);
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) throw new Error("status failed");
        const data = (await response.json()) as PolledJob;
        if (cancelled) return;
        setJob(data);
        setError(null);
        if (data.status === "queued" || data.status === "running") {
          timer = setTimeout(tick, 1200);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to poll job status");
          timer = setTimeout(tick, 2500);
        }
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId]);

  return { job, error, refresh };
}
