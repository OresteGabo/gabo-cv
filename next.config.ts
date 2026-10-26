import type { NextConfig } from "next";

import { portfolioApiOrigin } from "./lib/portfolio-api-origin";

const springOrigin = portfolioApiOrigin();

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingExcludes: {
    "/*": ["./.data/**/*", "./private/bonds/**/*"],
  },
  poweredByHeader: false,
  reactCompiler: true,
  async rewrites() {
    return {
      beforeFiles: [{ source: "/api/bonds/:path*", destination: `${springOrigin}/api/bonds/:path*` }],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    const productionSecurityHeaders =
      process.env.NODE_ENV === "production"
        ? [
            {
              key: "Content-Security-Policy",
              value:
                "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: blob:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; upgrade-insecure-requests",
            },
            {
              key: "Strict-Transport-Security",
              value: "max-age=31536000; includeSubDomains; preload",
            },
          ]
        : [];
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=()",
      },
      ...productionSecurityHeaders,
    ];

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/bonds/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
