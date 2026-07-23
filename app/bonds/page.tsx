import { BondLanding } from "@/component/bonds/BondLanding";

export const dynamic = "force-dynamic";

export default async function BondsPage({
  searchParams,
}: {
  searchParams: Promise<{ rseRefresh?: string }>;
}) {
  const { rseRefresh } = await searchParams;
  return <BondLanding forceMarketRefresh={Boolean(rseRefresh)} />;
}
