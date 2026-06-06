import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Rwanda Treasury Bond Planner | Gabo",
  description:
    "Model Rwanda Treasury Bond contributions, net coupons, reinvestment, milestones, and long-term passive income.",
  metadataBase: new URL("https://bonds.orestegabo.dev"),
  manifest: "/bonds/manifest.webmanifest",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Rwanda Treasury Bond Planner",
    description:
      "A transparent, mobile-first simulator for long-term Rwanda Treasury Bond portfolios.",
    url: "https://bonds.orestegabo.dev",
    siteName: "Rwanda Treasury Bond Planner",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#071812",
  colorScheme: "dark",
};

export default function BondsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
