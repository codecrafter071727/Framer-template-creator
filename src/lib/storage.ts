import { promises as fs } from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";

export async function persistZip(
  jobId: string,
  zipPath: string,
  downloadName: string,
): Promise<{ localPath: string; blobUrl?: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return { localPath: zipPath };
  }

  const bytes = await fs.readFile(zipPath);
  const blob = await put(`jobs/${jobId}/${downloadName}`, bytes, {
    access: "public",
    token,
    contentType: "application/zip",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return { localPath: zipPath, blobUrl: blob.url };
}

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function writeBinary(filePath: string, data: Buffer) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, data);
}

export async function writeText(filePath: string, data: string) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, data, "utf8");
}
