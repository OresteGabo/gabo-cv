import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      name: "Rwanda Treasury Bond Lab",
      short_name: "Bond Lab",
      description:
        "Learn, simulate, and privately track Rwanda Treasury Bonds.",
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
          name: "Bond education",
          short_name: "Education",
          url: "/education",
        },
        {
          name: "BNR issuance calendar",
          short_name: "Calendar",
          url: "/calendar",
        },
        {
          name: "Bond simulator",
          short_name: "Simulator",
          url: "/simulator",
        },
        {
          name: "Private portfolio",
          short_name: "Portfolio",
          url: "/portfolio",
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
