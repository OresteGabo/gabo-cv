import { NextResponse } from "next/server";
import { getBondSession } from "@/lib/bonds/auth";
import { documentSummary, listBondDocuments } from "@/lib/bonds/documents";

export async function GET() {
  const session = await getBondSession();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    documents: session.isOwner ? listBondDocuments().map(documentSummary) : [],
  });
}
