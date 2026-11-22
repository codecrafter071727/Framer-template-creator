/**
 * Classify leftover absolute URLs after rewrite.
 * Gate/accuracy should only fail on essential site assets that affect offline replay.
 */

const IGNORE_HOST_SNIPPETS = [
  "schema.org",
  "w3.org",
  "twitter.com",
  "x.com/",
  "linkedin.com",
  "instagram.com",
  "facebook.com",
  "fb.com",
  "threads.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "crunchbase.com",
  "wikidata.org",
  "wikipedia.org",
  "doubleclick.net",
  "googletagmanager.com",
  "google-analytics.com",
  "googleadservices.com",
  "googlesyndication.com",
  "facebook.net",
  "hotjar.com",
  "segment.com",
  "segment.io",
  "sentry.io",
  "cookiebot.com",
  "onetrust.com",
  "hubspot.com",
  "hs-scripts.com",
  "hs-analytics",
  "hsforms",
  "intercom.io",
  "intercomcdn.com",
  "openai.com",
  "bzr.openai.com",
  "cct.google",
  "shopify.com",
  "myshopify.com",
  "discord.com",
  "discord.gg",
  "reddit.com",
  "medium.com",
  "substack.com",
  "notion.so",
  "notion.site",
  "github.com",
  "gitlab.com",
  "producthunt.com",
  "webflow.com",
  "figma.com",
  "dribbble.com",
  "behance.net",
];

const ESSENTIAL_HOST_SNIPPETS = [
  "framerusercontent.com",
  "framerstatic.com",
  "app.framerstatic.com",
  "events.framer.com",
  "jspm.io",
  "esm.sh",
  "unpkg.com",
  "cdn.jsdelivr.net",
  "fonts.gstatic.com",
  "fonts.googleapis.com",
];

const ASSET_EXT =
  /\.(?:m?js|cjs|css|woff2?|ttf|otf|eot|png|jpe?g|gif|webp|avif|svg|ico|mp4|webm|mov|m4v|mp3|wav|ogg|json|map|wasm)(?:\?|#|$)/i;

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function pathnameOf(url: string): string {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return "/";
  }
}

/** Bare hosts / marketing links / trackers that must not fail the production gate. */
export function isNonEssentialRemoteUrl(
  raw: string,
  sourceOrigin?: string,
): boolean {
  const url = raw.replace(/&amp;/g, "&").replace(/[),.;`]+$/, "");
  if (!/^https?:\/\//i.test(url)) return true;
  if (url.includes("${") || url.includes("{")) return true;

  const host = hostnameOf(url);
  if (!host) return true;

  const lower = url.toLowerCase();
  if (IGNORE_HOST_SNIPPETS.some((s) => lower.includes(s))) return true;

  // Bare origin or path-less host (page link, not an asset)
  const path = pathnameOf(url);
  if (path === "/" || path === "") {
    // fonts.gstatic.com/ with no file is junk
    if (!ASSET_EXT.test(url)) return true;
  }

  // External article / blog / random page links (no asset extension, not Framer CDN)
  const isEssentialHost = ESSENTIAL_HOST_SNIPPETS.some((s) =>
    lower.includes(s),
  );
  let sameSite = false;
  if (sourceOrigin) {
    try {
      sameSite = new URL(url).origin === new URL(sourceOrigin).origin;
    } catch {
      sameSite = false;
    }
  }

  if (!ASSET_EXT.test(url) && !isEssentialHost && !sameSite) {
    return true;
  }

  // Analytics beacons on framer events without script payload
  if (lower.includes("events.framer.com/anonymous")) return true;
  if (lower.includes("events.framer.com/track")) return true;

  return false;
}

/** URLs that matter for offline visual/runtime fidelity. */
export function isEssentialSiteAsset(
  raw: string,
  sourceOrigin?: string,
): boolean {
  return !isNonEssentialRemoteUrl(raw, sourceOrigin);
}

export function partitionMissingUrls(
  urls: string[],
  sourceOrigin?: string,
): { essential: string[]; ignored: string[] } {
  const essential: string[] = [];
  const ignored: string[] = [];
  for (const url of [...new Set(urls)]) {
    if (isEssentialSiteAsset(url, sourceOrigin)) essential.push(url);
    else ignored.push(url);
  }
  return { essential, ignored };
}
