import { NextRequest, NextResponse } from "next/server";

const BONDS_HOST = "bonds.orestegabo.dev";

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0];
  const { pathname } = request.nextUrl;

  if (hostname !== BONDS_HOST) {
    return NextResponse.next();
  }

  const shouldRewrite =
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api/bonds") &&
    !pathname.startsWith("/bonds") &&
    !/\.[a-z0-9]+$/i.test(pathname);
  const response = shouldRewrite
    ? NextResponse.rewrite(
        new URL(`/bonds${pathname === "/" ? "" : pathname}`, request.url),
      )
    : NextResponse.next();

  if (!pathname.startsWith("/_next")) {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=()",
    );
    if (process.env.NODE_ENV === "production") {
      response.headers.set(
        "Content-Security-Policy",
        "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; upgrade-insecure-requests",
      );
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
