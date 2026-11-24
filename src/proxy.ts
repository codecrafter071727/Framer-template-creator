import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PAGE_SLUGS = new Set([
  "manifesto",
  "contact",
  "privacy",
  "terms",
  "changelog",
  "404",
]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const passthrough =
    pathname.startsWith("/api/") ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/site/") ||
    pathname.startsWith("/brand/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/framely-bridge.js" ||
    pathname === "/framely-replacements.json" ||
    pathname === "/favicon.ico" ||
    pathname === "/favicon.png" ||
    pathname === "/icon.png" ||
    pathname === "/apple-icon.png";

  let response: NextResponse;

  if (passthrough) {
    response = NextResponse.next();
  } else if (pathname === "/" || pathname === "") {
    response = NextResponse.rewrite(new URL("/site/index.html", request.url));
  } else {
    const slug = pathname.replace(/^\/|\/$/g, "");
    if (slug === "pricing" || slug === "careers") {
      response = NextResponse.redirect(new URL("/", request.url));
    } else if (PAGE_SLUGS.has(slug)) {
      response = NextResponse.rewrite(
        new URL(`/site/${slug}/index.html`, request.url),
      );
    } else {
      response = NextResponse.next();
    }
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
