export type JobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed";

export type JobKind = "extract" | "convert";

export type Framework = "nextjs" | "react";

export interface JobProgress {
  step: string;
  percent: number;
  detail?: string;
}

export interface AssetRecord {
  url: string;
  localPath: string;
  contentType: string | null;
  bytes: number;
  resourceType?: string;
}

export interface CompletenessReport {
  engine: "playwright" | "playwright-cdp" | "fetch-fallback";
  pagesCaptured: number;
  assetsSaved: number;
  totalBytes: number;
  byType: Record<string, number>;
  missingFromRewrite: string[];
  ignoredNonEssentialUrls?: string[];
  nestedDiscovered: number;
  notes: string[];
  accuracy?: {
    overall: number;
    grade: "A" | "B" | "C" | "D" | "A+";
    assetCoverage: number;
    contentRichness: number;
    structureFidelity: number;
    styleCoverage: number;
    visualReference: number;
    conversionReadiness?: number;
    checklist: string[];
  };
}

export interface ExtractManifest {
  sourceUrl: string;
  fetchedAt: string;
  pages: Array<{
    url: string;
    localPath: string;
    title: string;
    renderedLocalPath?: string;
    animatedLocalPath?: string;
  }>;
  assets: AssetRecord[];
  notes: string[];
  completeness?: CompletenessReport;
}

export interface JobRecord {
  id: string;
  kind: JobKind;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  sourceUrl?: string;
  prompt?: string;
  framework?: Framework;
  sourceJobId?: string;
  progress: JobProgress;
  error?: string;
  resultPath?: string;
  resultBlobUrl?: string;
  manifest?: ExtractManifest;
  downloadName?: string;
}
