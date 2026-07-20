import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Private Rwanda Bond Portfolio | Gabo",
  description:
    "Privately track Rwanda Treasury Bond purchases, coupon dates, BNR issuance calendar events, and long-term portfolio income.",
  metadataBase: new URL("https://bonds.orestegabo.dev"),
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Private Rwanda Bond Portfolio",
    description:
      "Private portfolio tracking and calendar planning for Rwanda Treasury Bonds.",
    url: "https://bonds.orestegabo.dev",
    siteName: "Rwanda Treasury Bond Planner",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff9ee" },
    { media: "(prefers-color-scheme: dark)", color: "#15130b" },
  ],
  colorScheme: "light dark",
};

export default function BondsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
