import { NextResponse } from "next/server";
import { getBondSession } from "@/lib/bonds/auth";
import { listEquityHoldings } from "@/lib/bonds/equities";

export async function GET() {
  if (!(await getBondSession())) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  return NextResponse.json({ holdings: listEquityHoldings() });
}
