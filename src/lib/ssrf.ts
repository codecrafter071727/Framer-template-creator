import dns from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google",
]);

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function isPrivateIpv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  return (
    (n >= ipv4ToInt("10.0.0.0") && n <= ipv4ToInt("10.255.255.255")) ||
    (n >= ipv4ToInt("127.0.0.0") && n <= ipv4ToInt("127.255.255.255")) ||
    (n >= ipv4ToInt("169.254.0.0") && n <= ipv4ToInt("169.254.255.255")) ||
    (n >= ipv4ToInt("172.16.0.0") && n <= ipv4ToInt("172.31.255.255")) ||
    (n >= ipv4ToInt("192.168.0.0") && n <= ipv4ToInt("192.168.255.255")) ||
    (n >= ipv4ToInt("0.0.0.0") && n <= ipv4ToInt("0.255.255.255"))
  );
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80")
  );
}

export function isPrivateIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return isPrivateIpv4(ip);
  if (version === 6) return isPrivateIpv6(ip);
  return true;
}

export async function assertSafeUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http and https URLs are allowed");
  }

  const hostname = url.hostname.toLowerCase();
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("Hostname is not allowed");
  }

  if (net.isIP(hostname) && isPrivateIp(hostname)) {
    throw new Error("Private IP addresses are not allowed");
  }

  const records = await dns.lookup(hostname, { all: true });
  if (!records.length) {
    throw new Error("Could not resolve hostname");
  }

  for (const record of records) {
    if (isPrivateIp(record.address)) {
      throw new Error("URL resolves to a private network address");
    }
  }

  return url;
}

export function isAllowedAssetHost(assetUrl: URL, pageOrigin: string): boolean {
  const page = new URL(pageOrigin);
  if (assetUrl.origin === page.origin) return true;

  const host = assetUrl.hostname.toLowerCase();
  const allowSuffixes = [
    "framer.com",
    "framerusercontent.com",
    "framercdn.com",
    "framer.website",
    "framer.app",
    "framerstatic.com",
    "framesites.com",
    "fonts.googleapis.com",
    "fonts.gstatic.com",
    "cdn.sanity.io",
    "images.unsplash.com",
    "cdn.prod.website-files.com",
    "i.vimeocdn.com",
    "player.vimeo.com",
    "www.youtube.com",
    "youtube.com",
    "youtu.be",
    "img.youtube.com",
    "cdnjs.cloudflare.com",
    "unpkg.com",
    "jsdelivr.net",
    "esm.sh",
    "ga.jspm.io",
    "jspm.io",
    "cloudfront.net",
    "amazonaws.com",
    "googleusercontent.com",
    "gstatic.com",
    "googleapis.com",
    "typekit.net",
    "use.typekit.net",
  ];

  return allowSuffixes.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
}

/** Production max-accuracy mode: keep any non-private http(s) asset the page loaded. */
export async function isPublicHttpUrl(raw: string): Promise<boolean> {
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return false;
    }
    if (net.isIP(hostname)) return !isPrivateIp(hostname);
    const records = await dns.lookup(hostname, { all: true });
    return records.length > 0 && records.every((r) => !isPrivateIp(r.address));
  } catch {
    return false;
  }
}
