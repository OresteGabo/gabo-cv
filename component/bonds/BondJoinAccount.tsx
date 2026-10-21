"use client";

import { BondAccountAccess } from "./BondAccountAccess";
import { BondThemeToggle, GaboBrand } from "./BondSiteChrome";
import { useRouter } from "next/navigation";

export function BondJoinAccount() {
  const router = useRouter();
  return <main className="bond-app min-h-screen bg-background px-4 pb-16 text-on-background">
    <header className="mx-auto flex max-w-3xl items-center justify-between py-6"><GaboBrand /><BondThemeToggle /></header>
    <section className="mx-auto mt-8 max-w-lg">
      <h1 className="text-3xl font-black tracking-tight">Your own bond portfolio</h1>
      <p className="mt-3 text-sm leading-6 text-on-surface-variant">Create your account using your invitation. You can then import bond PDFs, manage your purchases, and use your real bonds in the simulator. Your portfolio is separate from the owner’s.</p>
      <BondAccountAccess onAuthenticated={() => router.replace(window.location.pathname.startsWith("/bonds/") ? "/bonds/portfolio" : "/portfolio")} />
    </section>
  </main>;
}
