import path from "node:path";
import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import { isAllowedAssetHost } from "@/lib/ssrf";

const ASSET_ATTRS = [
  "src",
  "href",
  "poster",
  "data-src",
  "data-image",
  "data-framer-src",
  "data-srcset",
] as const;

export function collectUrlsFromHtml(
  html: string,
  pageUrl: string,
  options?: { allowAnyPublicHost?: boolean },
): { urls: string[]; links: string[] } {
  const $ = cheerio.load(html);
  const urls = new Set<string>();
  const links = new Set<string>();
  const page = new URL(pageUrl);
  const allowAny = options?.allowAnyPublicHost ?? false;

  const pushAsset = (raw: string | undefined) => {
    if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) return;
    try {
      const absolute = new URL(raw, pageUrl);
      if (!["http:", "https:"].includes(absolute.protocol)) return;
      if (!allowAny && !isAllowedAssetHost(absolute, page.origin)) return;
      urls.add(absolute.toString());
    } catch {
      // ignore invalid
    }
  };

  for (const attr of ASSET_ATTRS) {
    $(`[${attr}]`).each((_, el) => {
      pushAsset($(el).attr(attr));
    });
  }

  $("[srcset], [data-srcset]").each((_, el) => {
    const srcset = $(el).attr("srcset") || $(el).attr("data-srcset") || "";
    for (const part of srcset.split(",")) {
      pushAsset(part.trim().split(/\s+/)[0]);
    }
  });

  $("style").each((_, el) => {
    const css = $(el).html() || "";
    for (const match of css.matchAll(/url\((['"]?)([^'")]+)\1\)/gi)) {
      pushAsset(match[2]);
    }
  });

  $("[style]").each((_, el) => {
    const style = $(el).attr("style") || "";
    for (const match of style.matchAll(/url\((['"]?)([^'")]+)\1\)/gi)) {
      pushAsset(match[2]);
    }
  });

  // Capture modulepreload / preload / prefetch hints used heavily by Framer
  $('link[rel="modulepreload"], link[rel="preload"], link[rel="prefetch"], link[rel="stylesheet"]').each(
    (_, el) => {
      pushAsset($(el).attr("href"));
    },
  );

  $("script[src], script[data-src]").each((_, el) => {
    pushAsset($(el).attr("src") || $(el).attr("data-src"));
  });

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return;
    }
    try {
      const absolute = new URL(href, pageUrl);
      if (absolute.origin === page.origin) {
        links.add(absolute.toString().split("#")[0]);
      }
    } catch {
      // ignore
    }
  });

  return { urls: [...urls], links: [...links] };
}

export function collectUrlsFromCss(
  css: string,
  cssUrl: string,
  pageOrigin: string,
  options?: { allowAnyPublicHost?: boolean },
) {
  const urls = new Set<string>();
  const allowAny = options?.allowAnyPublicHost ?? false;
  for (const match of css.matchAll(/url\((['"]?)([^'")]+)\1\)/gi)) {
    const raw = match[2];
    if (!raw || raw.startsWith("data:")) continue;
    try {
      const absolute = new URL(raw, cssUrl);
      if (!["http:", "https:"].includes(absolute.protocol)) continue;
      if (!allowAny && !isAllowedAssetHost(absolute, pageOrigin)) continue;
      urls.add(absolute.toString());
    } catch {
      // ignore
    }
  }
  return [...urls];
}

export function extensionFor(
  url: string,
  contentType: string | null,
  resourceType?: string,
): string {
  const parsed = new URL(url);
  const fromPath = path.extname(parsed.pathname).toLowerCase();
  if (fromPath && fromPath.length <= 5) return fromPath;

  const type = (contentType || "").toLowerCase();
  if (type.includes("text/html")) return ".html";
  if (type.includes("text/css")) return ".css";
  if (type.includes("javascript") || type.includes("ecmascript")) return ".js";
  if (type.includes("json")) return ".json";
  if (type.includes("font-woff2") || type.includes("woff2")) return ".woff2";
  if (type.includes("font-woff") || type.includes("woff")) return ".woff";
  if (type.includes("font-ttf") || type.includes("ttf")) return ".ttf";
  if (type.includes("image/svg")) return ".svg";
  if (type.includes("image/png")) return ".png";
  if (type.includes("image/jpeg")) return ".jpg";
  if (type.includes("image/webp")) return ".webp";
  if (type.includes("image/avif")) return ".avif";
  if (type.includes("image/gif")) return ".gif";
  if (type.includes("video/mp4")) return ".mp4";
  if (type.includes("video/webm")) return ".webm";

  if (resourceType === "stylesheet") return ".css";
  if (resourceType === "script") return ".js";
  if (resourceType === "image") return ".bin";
  if (resourceType === "font") return ".woff2";
  if (resourceType === "document") return ".html";
  return ".bin";
}

export function localPathForUrl(
  assetUrl: string,
  kind: "page" | "asset",
  contentType: string | null = null,
  resourceType?: string,
): string {
  const url = new URL(assetUrl);
  const hash = createHash("sha1").update(assetUrl).digest("hex").slice(0, 12);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) pathname += "index.html";
  if (kind === "page" && !path.extname(pathname)) pathname += "/index.html";

  const ext =
    path.extname(pathname) || extensionFor(assetUrl, contentType, resourceType);
  const base = path
    .basename(pathname, path.extname(pathname))
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .slice(0, 80);

  if (kind === "page") {
    const dir = path
      .dirname(pathname)
      .replace(/^\//, "")
      .replace(/[^a-zA-Z0-9/_-]+/g, "-");
    return path.posix.join(
      "pages",
      dir === "." ? "" : dir,
      `${base || "index"}${ext || ".html"}`,
    );
  }

  const folder = folderForExt(ext, resourceType, contentType);
  const host = url.hostname.replace(/[^a-zA-Z0-9.-]+/g, "-");
  return path.posix.join("assets", folder, host, `${base || "file"}-${hash}${ext}`);
}

function folderForExt(
  ext: string,
  resourceType?: string,
  contentType?: string | null,
): string {
  const e = ext.toLowerCase();
  const type = (contentType || "").toLowerCase();
  if (e === ".css" || resourceType === "stylesheet" || type.includes("text/css")) {
    return "css";
  }
  if (
    [".js", ".mjs", ".cjs"].includes(e) ||
    resourceType === "script" ||
    type.includes("javascript")
  ) {
    return "js";
  }
  if ([".woff", ".woff2", ".ttf", ".otf", ".eot"].includes(e) || resourceType === "font") {
    return "fonts";
  }
  if (
    [".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg", ".ico"].includes(e) ||
    resourceType === "image" ||
    type.startsWith("image/")
  ) {
    return "images";
  }
  if ([".mp4", ".webm", ".mov"].includes(e) || type.startsWith("video/")) {
    return "video";
  }
  if ([".json"].includes(e) || type.includes("json")) return "data";
  if (e === ".html" || type.includes("text/html")) return "html";
  return "misc";
}

export function rewriteHtml(
  html: string,
  pageUrl: string,
  map: Map<string, string>,
): string {
  let next = html;
  const sorted = [...map.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [remote, local] of sorted) {
    next = next.split(remote).join(local);
    try {
      const asPath = new URL(remote).pathname + new URL(remote).search;
      if (asPath.length > 3) {
        next = next.split(asPath).join(local);
      }
    } catch {
      // ignore
    }
  }

  const pageLocal = map.get(pageUrl);
  if (pageLocal) {
    const depth = pageLocal.split("/").length - 1;
    const prefix = depth > 0 ? "../".repeat(depth) : "./";
    for (const [, local] of sorted) {
      if (local.startsWith("assets/")) {
        next = next.split(local).join(prefix + local);
      }
    }
  }

  return next;
}
