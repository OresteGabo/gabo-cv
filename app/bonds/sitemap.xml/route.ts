import { NextResponse } from "next/server";

const pages = ["", "/calendar", "/education", "/simulator"];

export function GET() {
  const urls = pages
    .map(
      (path) =>
        `<url><loc>https://bonds.orestegabo.dev${path || "/"}</loc></url>`,
    )
    .join("");

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { "Content-Type": "application/xml" } },
  );
}
