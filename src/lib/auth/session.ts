import { SignJWT, jwtVerify } from "jose";
import {
  SESSION_COOKIE,
  isAuthConfigured,
  requireAuthForExtract,
} from "@/lib/auth/config";

export type SessionUser = {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
};

function secretKey() {
  const raw = process.env.AUTH_SECRET;
  if (!raw) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(raw);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    sub: user.sub,
    email: user.email,
    name: user.name,
    picture: user.picture,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
  .sign(secretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub || !payload.email) return null;
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      name: payload.name ? String(payload.name) : undefined,
      picture: payload.picture ? String(payload.picture) : undefined,
    };
  } catch {
    return null;
  }
}

export function sessionCookieHeader(token: string, maxAgeSec = 60 * 60 * 24 * 7) {
  const secure = process.env.NODE_ENV === "production";
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSec}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookieHeader() {
  const secure = process.env.NODE_ENV === "production";
  const parts = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function getSessionFromRequest(
  request: Request,
): Promise<SessionUser | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(
  request: Request,
): Promise<SessionUser | Response> {
  if (!requireAuthForExtract()) {
    return {
      sub: "anonymous",
      email: "anonymous@local",
      name: "Guest",
    };
  }
  if (!isAuthConfigured()) {
    return Response.json(
      {
        error: "Sign-in is not configured on this server",
        code: "auth_not_configured",
      },
      { status: 503 },
    );
  }
  const user = await getSessionFromRequest(request);
  if (!user) {
    return Response.json(
      { error: "Sign in with Google to extract", code: "auth_required" },
      { status: 401 },
    );
  }
  return user;
}