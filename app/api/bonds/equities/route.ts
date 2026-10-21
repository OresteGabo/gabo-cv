import { NextResponse } from "next/server";
import { getBondSession } from "@/lib/bonds/auth";
import { listEquityHoldings } from "@/lib/bonds/equities";

export async function GET() {
  const session = await getBondSession();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  return NextResponse.json({ holdings: session.isOwner ? listEquityHoldings() : [] });
}
