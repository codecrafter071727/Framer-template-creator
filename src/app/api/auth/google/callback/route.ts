import {
  OAUTH_STATE_COOKIE,
  appOrigin,
  googleRedirectUri,
  isAuthConfigured,
} from "@/lib/auth/config";
import { exchangeGoogleCode } from "@/lib/auth/google";
import { createSessionToken, sessionCookieHeader } from "@/lib/auth/session";

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function GET(request: Request) {
  const origin = appOrigin(request);

  if (!isAuthConfigured()) {
    return Response.redirect(`${origin}/?auth_error=not_configured`);
  }

  const url = new URL(request.url);
  const err = url.searchParams.get("error");
  if (err) {
    return Response.redirect(`${origin}/?auth_error=${encodeURIComponent(err)}`);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return Response.redirect(`${origin}/?auth_error=missing_code`);
  }

  const stateCookieRaw = readCookie(request, OAUTH_STATE_COOKIE);
  if (!stateCookieRaw) {
    return Response.redirect(`${origin}/?auth_error=state_missing`);
  }

  let returnTo = "/";
  try {
    const parsed = JSON.parse(
      Buffer.from(stateCookieRaw, "base64url").toString("utf8"),
    ) as { state?: string; returnTo?: string };
    if (!parsed.state || parsed.state !== state) {
      return Response.redirect(`${origin}/?auth_error=state_mismatch`);
    }
    if (
      parsed.returnTo &&
      parsed.returnTo.startsWith("/") &&
      !parsed.returnTo.startsWith("//")
    ) {
      returnTo = parsed.returnTo;
    }
  } catch {
    return Response.redirect(`${origin}/?auth_error=state_invalid`);
  }

  try {
    const user = await exchangeGoogleCode(code, googleRedirectUri(request));
    const token = await createSessionToken(user);

    const joiner = returnTo.includes("?") ? "&" : "?";
    const destination = `${origin}${returnTo}${joiner}signed_in=1`;

    const secure = process.env.NODE_ENV === "production";
    const clearState = [
      `${OAUTH_STATE_COOKIE}=`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      "Max-Age=0",
      secure ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");

    const headers = new Headers();
    headers.set("Location", destination);
    headers.append("Set-Cookie", sessionCookieHeader(token));
    headers.append("Set-Cookie", clearState);
    return new Response(null, { status: 302, headers });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "google_callback_failed";
    return Response.redirect(
      `${origin}/?auth_error=${encodeURIComponent(message.slice(0, 120))}`,
    );
  }
}