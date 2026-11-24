import { randomBytes } from "node:crypto";
import {
  OAUTH_STATE_COOKIE,
  appOrigin,
  googleRedirectUri,
  isAuthConfigured,
} from "@/lib/auth/config";
import { googleAuthUrl } from "@/lib/auth/google";

function safeReturnTo(raw: string | null, origin: string): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export async function GET(request: Request) {
  if (!isAuthConfigured()) {
    return Response.json(
      { error: "Google sign-in is not configured" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const returnTo = safeReturnTo(url.searchParams.get("returnTo"), appOrigin(request));
  const state = randomBytes(24).toString("hex");
  const redirectUri = googleRedirectUri(request);

  const statePayload = Buffer.from(
    JSON.stringify({ state, returnTo }),
    "utf8",
  ).toString("base64url");

  const secure = process.env.NODE_ENV === "production";
  const oauthStateCookie = [
    `${OAUTH_STATE_COOKIE}=${statePayload}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=600",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

  const location = googleAuthUrl({ redirectUri, state });

  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      "Set-Cookie": oauthStateCookie,
    },
  });
}