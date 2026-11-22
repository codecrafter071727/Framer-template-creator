import path from "node:path";
import os from "node:os";

const ROOT =
  process.env.DATA_DIR ||
  (process.env.VERCEL
    ? path.join(os.tmpdir(), "framer-converter")
    : path.join(process.cwd(), ".data"));

export function dataRoot() {
  return ROOT;
}

export function jobsDir() {
  return path.join(ROOT, "jobs");
}

export function jobDir(jobId: string) {
  return path.join(jobsDir(), jobId);
}

export function jobMetaPath(jobId: string) {
  return path.join(jobDir(jobId), "job.json");
}

export function jobWorkspace(jobId: string) {
  return path.join(jobDir(jobId), "workspace");
}

export function jobZipPath(jobId: string) {
  return path.join(jobDir(jobId), "output.zip");
}
