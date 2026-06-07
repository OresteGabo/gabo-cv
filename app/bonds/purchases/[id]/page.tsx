import { BondPurchaseDetails } from "@/component/bonds/BondPurchaseDetails";

export default async function BondPurchasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BondPurchaseDetails purchaseId={id} />;
}
