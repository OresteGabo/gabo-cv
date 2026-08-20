import { NextResponse } from "next/server";
import { getBondSession } from "@/lib/bonds/auth";
import { documentSummary, listBondDocuments } from "@/lib/bonds/documents";

export async function GET() {
  if (!(await getBondSession())) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    documents: listBondDocuments().map(documentSummary),
  });
}
