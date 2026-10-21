import { after, NextRequest, NextResponse } from "next/server";
import { getBondQuotes, getEquityQuotes } from "@/lib/bonds/rse-quotes";
import { recordEquityQuotes } from "@/lib/bonds/equity-observations";

export const maxDuration = 40;
export async function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get("kind");
  if (kind !== "bonds" && kind !== "equities") return NextResponse.json({ error: "Choose bonds or equities." }, { status: 400 });
  if (kind === "bonds") return NextResponse.json(await getBondQuotes());
  const data = await getEquityQuotes();
  after(() => recordEquityQuotes(data).catch(() => undefined));
  return NextResponse.json(data);
}
