import { NextRequest, NextResponse } from "next/server";
import { getBondSession } from "@/lib/bonds/auth";
import { isSameOriginRequest, readBoundedJsonBody } from "@/lib/bonds/request";
import { listMissingStatementItems, parseStatementItems, reconcileStatementItems } from "@/lib/bonds/statement-items";
export async function GET() {
  const session=await getBondSession();
  if (!session) return NextResponse.json({error:"Authentication required."},{status:401});
  try { return NextResponse.json({items:await listMissingStatementItems(session.userId)}); }
  catch { return NextResponse.json({error:"Missing documents could not be loaded."},{status:503}); }
}
export async function POST(request:NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({error:"Invalid request origin."},{status:403});
  const session=await getBondSession();
  if (!session) return NextResponse.json({error:"Authentication required."},{status:401});
  const body=await readBoundedJsonBody(request,131072);
  if (!body.ok) return NextResponse.json({error:body.error},{status:body.status});
  const items=parseStatementItems((body.data as {items?:unknown})?.items);
  if (!items) return NextResponse.json({error:"Could not verify this BK Capital statement."},{status:400});
  try { return NextResponse.json({rows:await reconcileStatementItems(session.userId,items)}); }
  catch { return NextResponse.json({error:"The statement could not be checked. Please try again."},{status:503}); }
}
