import { NextResponse } from "next/server";
import { getBondSession } from "@/lib/bonds/auth";

export async function GET() {
  const session = await getBondSession();
  return NextResponse.json({
    authenticated: Boolean(session),
  });
}
