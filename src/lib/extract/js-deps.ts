/**
 * Discover nested remote module / asset URLs inside JS and CSS bundles.
 * Kept strict to avoid exploding on minified false positives.
 */
export function discoverUrlsInText(text: string, baseUrl: string): string[] {
  const found = new Set<string>();

  const patterns: RegExp[] = [
    /import\s*\(\s*["']([^"']+)["']\s*\)/g,
    /from\s+["'](https?:\/\/[^"']+)["']/g,
    /import\s+["'](https?:\/\/[^"']+)["']/g,
    /export\s+\*\s+from\s+["'](https?:\/\/[^"']+)["']/g,
    /new\s+URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url\s*\)/g,
    /["'](https?:\/\/(?:[^"'\\\s]+)\.(?:m?js|cjs|css|woff2?|ttf|otf|png|jpe?g|gif|webp|avif|svg|mp4|webm)(?:\?[^"']*)?)["']/gi,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const raw = match[1];
      if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) continue;
      // Skip relative non-http imports that aren't clearly resolvable modules
      if (
        !raw.startsWith("http://") &&
        !raw.startsWith("https://") &&
        !raw.startsWith("/") &&
        !raw.startsWith("./") &&
        !raw.startsWith("../")
      ) {
        continue;
      }
      try {
        const absolute = new URL(raw, baseUrl);
        if (!["http:", "https:"].includes(absolute.protocol)) continue;
        found.add(absolute.toString());
      } catch {
        // ignore
      }
    }
  }

  return [...found];
}

export function rewriteTextUrls(
  text: string,
  map: Map<string, string>,
  fromFilePath: string,
): string {
  let next = text;
  const sorted = [...map.entries()].sort((a, b) => b[0].length - a[0].length);
  const depth = fromFilePath.split("/").length - 1;
  const prefix = depth > 0 ? "../".repeat(depth) : "./";

  for (const [remote, local] of sorted) {
    const relative = prefix + local;
    next = next.split(remote).join(relative);
    try {
      const pathname = new URL(remote).pathname;
      if (pathname.length > 4) {
        next = next.split(`"${pathname}"`).join(`"${relative}"`);
        next = next.split(`'${pathname}'`).join(`'${relative}'`);
      }
    } catch {
      // ignore
    }
  }
  return next;
}
