import { isAuthConfigured, requireAuthForExtract } from "@/lib/auth/config";
import { getSessionFromRequest } from "@/lib/auth/session";

export async function GET(request: Request) {
  if (!requireAuthForExtract()) {
    return Response.json({
      configured: false,
      required: false,
      user: null,
    });
  }

  if (!isAuthConfigured()) {
    return Response.json({
      configured: false,
      required: true,
      user: null,
      error: "Google sign-in is not configured on this server",
    });
  }

  const user = await getSessionFromRequest(request);
  return Response.json({
    configured: true,
    required: true,
    user: user
      ? {
          email: user.email,
          name: user.name ?? null,
          picture: user.picture ?? null,
        }
      : null,
  });
}