import { NextRequest, NextResponse } from "next/server";
import { expiredSessionCookie } from "@/lib/bonds/auth";
import { isSameOriginRequest } from "@/lib/bonds/request";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(expiredSessionCookie);
  return response;
}
