import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      name: "Rwanda Treasury Bond Planner",
      short_name: "Bond Planner",
      description:
        "Simulate Rwanda Treasury Bond growth and track a private portfolio.",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#f7f5ef",
      theme_color: "#f7f5ef",
      icons: [
        {
          src: "/apple-icon.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
