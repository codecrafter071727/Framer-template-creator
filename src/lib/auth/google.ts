import type { SessionUser } from "@/lib/auth/session";

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
): Promise<SessionUser> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured");
  }

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${text.slice(0, 200)}`);
  }

  const tokenJson = (await tokenRes.json()) as GoogleTokenResponse;
  if (!tokenJson.access_token) {
    throw new Error("Google did not return an access token");
  }

  const userRes = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    },
  );

  if (!userRes.ok) {
    const text = await userRes.text();
    throw new Error(`Google userinfo failed: ${text.slice(0, 200)}`);
  }

  const profile = (await userRes.json()) as GoogleUserInfo;
  if (!profile.sub || !profile.email) {
    throw new Error("Google profile missing email");
  }
  if (profile.email_verified === false) {
    throw new Error("Google email is not verified");
  }

  return {
    sub: profile.sub,
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
  };
}

export function googleAuthUrl(params: {
  redirectUri: string;
  state: string;
}): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not set");

  const q = new URLSearchParams({
    client_id: clientId,
    redirect_uri: params.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    include_granted_scopes: "true",
    prompt: "select_account",
    state: params.state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q.toString()}`;
}