import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Rwanda Treasury Bonds | Gabo",
  description:
    "Learn how Rwanda Treasury Bonds work, model long-term strategies, and privately track real purchases.",
  metadataBase: new URL("https://bonds.orestegabo.dev"),
  manifest: "/bonds/manifest.webmanifest",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Rwanda Treasury Bonds",
    description:
      "Clear information, transparent simulations, and private tracking for Rwanda Treasury Bonds.",
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
