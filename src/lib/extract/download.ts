import { isPublicHttpUrl } from "@/lib/ssrf";

const MAX_ASSET_BYTES = 50 * 1024 * 1024;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 FramerForge/3.0";

export async function fetchBufferWithRetry(
  url: string,
  retries = 3,
): Promise<{ buffer: Buffer; contentType: string | null; finalUrl: string }> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (!(await isPublicHttpUrl(url))) {
        throw new Error("Blocked non-public URL");
      }

      const response = await fetch(url, {
        headers: {
          "user-agent": USER_AGENT,
          accept: "*/*",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentLength = Number(response.headers.get("content-length") || 0);
      if (contentLength > MAX_ASSET_BYTES) {
        throw new Error("Asset too large");
      }

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > MAX_ASSET_BYTES) {
        throw new Error("Asset too large");
      }

      return {
        buffer: Buffer.from(arrayBuffer),
        contentType: response.headers.get("content-type"),
        finalUrl: response.url || url,
      };
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 250 * attempt));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to download asset");
}
