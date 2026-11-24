export const SESSION_COOKIE = "framely_session";
export const OAUTH_STATE_COOKIE = "framely_oauth_state";

export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.AUTH_SECRET,
  );
}

export function requireAuthForExtract(): boolean {
  if (process.env.FRAMELY_EXTRACT_OPEN === "1") return false;
  // Sign-in UI + API gate unless explicitly opened for local dev
  return true;
}

export function googleRedirectUri(request: Request): string {
  const fromEnv = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv;
  const url = new URL(request.url);
  url.pathname = "/api/auth/google/callback";
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function appOrigin(request: Request): string {
  const fromEnv = process.env.AUTH_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const url = new URL(request.url);
  return url.origin;
}