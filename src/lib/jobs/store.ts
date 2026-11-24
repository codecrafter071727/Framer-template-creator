import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { list, put } from "@vercel/blob";
import type { JobKind, JobProgress, JobRecord } from "@/lib/types";
import { jobDir, jobMetaPath, jobsDir } from "@/lib/paths";

async function ensureJobsRoot() {
  await fs.mkdir(jobsDir(), { recursive: true });
}

function blobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN || undefined;
}

async function persistJobToBlob(job: JobRecord) {
  const token = blobToken();
  if (!token) return;
  try {
    await put(`jobs/${job.id}/job.json`, JSON.stringify(job, null, 2), {
      access: "public",
      token,
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (error) {
    // Keep local disk jobs working when Blob is unavailable/suspended.
    console.warn(
      "[framely] blob persist skipped:",
      error instanceof Error ? error.message : error,
    );
  }
}

async function readJobFromBlob(id: string): Promise<JobRecord | null> {
  const token = blobToken();
  if (!token) return null;
  try {
    const result = await list({
      prefix: `jobs/${id}/job.json`,
      token,
      limit: 10,
    });
    const meta = result.blobs.find((blob) =>
      blob.pathname.endsWith(`jobs/${id}/job.json`),
    ) || result.blobs[0];
    if (!meta?.url) return null;
    const response = await fetch(meta.url, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as JobRecord;
  } catch {
    return null;
  }
}

export async function createJob(
  kind: JobKind,
  seed: Partial<JobRecord> = {},
): Promise<JobRecord> {
  await ensureJobsRoot();
  const id = randomUUID();
  const now = new Date().toISOString();
  const job: JobRecord = {
    id,
    kind,
    status: "queued",
    createdAt: now,
    updatedAt: now,
    progress: { step: "queued", percent: 0 },
    ...seed,
  };

  await fs.mkdir(jobDir(id), { recursive: true });
  await writeJob(job);
  return job;
}

export async function writeJob(job: JobRecord): Promise<void> {
  job.updatedAt = new Date().toISOString();
  await fs.mkdir(jobDir(job.id), { recursive: true });
  await fs.writeFile(jobMetaPath(job.id), JSON.stringify(job, null, 2), "utf8");
  await persistJobToBlob(job);
}

export async function readJob(id: string): Promise<JobRecord | null> {
  try {
    const raw = await fs.readFile(jobMetaPath(id), "utf8");
    return JSON.parse(raw) as JobRecord;
  } catch {
    return readJobFromBlob(id);
  }
}

export async function updateJob(
  id: string,
  patch: Partial<JobRecord> & { progress?: JobProgress },
): Promise<JobRecord> {
  const current = await readJob(id);
  if (!current) {
    throw new Error(`Job ${id} not found`);
  }
  const next: JobRecord = {
    ...current,
    ...patch,
    progress: patch.progress ?? current.progress,
  };
  await writeJob(next);
  return next;
}

export async function listJobFiles(id: string): Promise<string[]> {
  const dir = jobDir(id);
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.map((entry) => path.join(dir, entry.name));
  } catch {
    return [];
  }
}
