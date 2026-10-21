import { NextRequest } from "next/server";
import { expiredSessionCookie, revokeSession } from "@/lib/bonds/auth";
import { authJson } from "@/lib/bonds/auth-http";
import { isSameOriginRequest } from "@/lib/bonds/request";
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return authJson({ error: "Invalid request origin." }, 403);
  try {
    await revokeSession();
    const response = authJson({ authenticated: false });
    response.cookies.set(expiredSessionCookie);
    return response;
  } catch { return authJson({ error: "Sign-out could not be completed. Please try again." }, 503); }
}
