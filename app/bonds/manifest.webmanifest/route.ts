import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      name: "Rwanda Treasury Bond Lab",
      short_name: "Bond Portfolio",
      description:
        "Privately track Rwanda Treasury Bonds and BNR issuance dates.",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#fff9ee",
      theme_color: "#6d5e0f",
      icons: [
        {
          src: "/apple-icon.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
      shortcuts: [
        {
          name: "BNR issuance calendar",
          short_name: "Calendar",
          url: "/calendar",
        },
        {
          name: "Private portfolio",
          short_name: "Portfolio",
          url: "/",
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
