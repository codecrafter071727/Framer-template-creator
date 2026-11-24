"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type FramelyContextValue = {
  sourceUrl: string;
  setSourceUrl: (url: string) => void;
  extractJobId: string | null;
  convertJobId: string | null;
  completedExtractJobId: string | null;
  startingExtract: boolean;
  extractError: string | null;
  startExtract: (url?: string) => Promise<string | null>;
  setConvertJobId: (id: string | null) => void;
  markExtractCompleted: (jobId: string) => void;
  clearExtractError: () => void;
};

const FramelyContext = createContext<FramelyContextValue | null>(null);

export function FramelyProvider({ children }: { children: ReactNode }) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [extractJobId, setExtractJobId] = useState<string | null>(null);
  const [convertJobId, setConvertJobId] = useState<string | null>(null);
  const [completedExtractJobId, setCompletedExtractJobId] = useState<
    string | null
  >(null);
  const [startingExtract, setStartingExtract] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const markExtractCompleted = useCallback((jobId: string) => {
    setCompletedExtractJobId(jobId);
  }, []);

  const clearExtractError = useCallback(() => setExtractError(null), []);

  const startExtract = useCallback(async (url?: string) => {
    const target = (url ?? sourceUrl).trim();
    if (!target) {
      setExtractError("Paste a published Framer URL first.");
      return null;
    }

    setSourceUrl(target);
    setExtractError(null);
    setStartingExtract(true);
    setCompletedExtractJobId(null);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target, maxPages: 15 }),
      });
      const data = (await response.json()) as { jobId?: string; error?: string };
      if (!response.ok || !data.jobId) {
        throw new Error(data.error || "Extract failed to start");
      }
      setExtractJobId(data.jobId);
      return data.jobId;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Extract failed";
      setExtractError(message);
      return null;
    } finally {
      setStartingExtract(false);
    }
  }, [sourceUrl]);

  const value = useMemo(
    () => ({
      sourceUrl,
      setSourceUrl,
      extractJobId,
      convertJobId,
      completedExtractJobId,
      startingExtract,
      extractError,
      startExtract,
      setConvertJobId,
      markExtractCompleted,
      clearExtractError,
    }),
    [
      sourceUrl,
      extractJobId,
      convertJobId,
      completedExtractJobId,
      startingExtract,
      extractError,
      startExtract,
      markExtractCompleted,
      clearExtractError,
    ],
  );

  return (
    <FramelyContext.Provider value={value}>{children}</FramelyContext.Provider>
  );
}

export function useFramely() {
  const ctx = useContext(FramelyContext);
  if (!ctx) {
    throw new Error("useFramely must be used within FramelyProvider");
  }
  return ctx;
}
