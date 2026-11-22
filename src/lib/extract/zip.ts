import { promises as fs } from "node:fs";
import path from "node:path";
import JSZip from "jszip";

async function addDirectory(zip: JSZip, dir: string, prefix = "") {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const zipPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      await addDirectory(zip, fullPath, zipPath);
    } else {
      const data = await fs.readFile(fullPath);
      zip.file(zipPath, data);
    }
  }
}

export async function zipDirectory(
  sourceDir: string,
  outPath: string,
): Promise<number> {
  const zip = new JSZip();
  await addDirectory(zip, sourceDir);
  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, buffer);
  return buffer.byteLength;
}
