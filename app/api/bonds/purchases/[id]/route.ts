import { NextRequest, NextResponse } from "next/server";
import { getBondSession } from "@/lib/bonds/auth";
import { deletePurchase, getPurchase, updatePurchase } from "@/lib/bonds/db";
import { isSameOriginRequest, readBoundedJsonBody } from "@/lib/bonds/request";
import { parsePurchase } from "@/lib/bonds/validation";

function validPurchaseId(id: string) {
  return /^[0-9a-f-]{36}$/i.test(id);
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await getBondSession())) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  if (!validPurchaseId(id)) {
    return NextResponse.json({ error: "Invalid purchase id." }, { status: 400 });
  }

  try {
    const purchase = await getPurchase(id);
    return purchase
      ? NextResponse.json({ purchase })
      : NextResponse.json({ error: "Purchase not found." }, { status: 404 });
  } catch {
    return NextResponse.json(
      { error: "The purchase could not be loaded." },
      { status: 503 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  if (!(await getBondSession())) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  if (!validPurchaseId(id)) {
    return NextResponse.json({ error: "Invalid purchase id." }, { status: 400 });
  }

  try {
    const deleted = await deletePurchase(id);
    return deleted
      ? NextResponse.json({ deleted: true })
      : NextResponse.json({ error: "Purchase not found." }, { status: 404 });
  } catch {
    return NextResponse.json(
      { error: "The purchase could not be deleted." },
      { status: 503 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  if (!(await getBondSession())) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  if (!validPurchaseId(id)) {
    return NextResponse.json({ error: "Invalid purchase id." }, { status: 400 });
  }

  const bodyResult = await readBoundedJsonBody(request, 32_768);
  if (!bodyResult.ok) {
    return NextResponse.json(
      { error: bodyResult.error },
      { status: bodyResult.status },
    );
  }
  const purchase = parsePurchase(bodyResult.data);
  if (!purchase) {
    return NextResponse.json(
      { error: "Check the transaction details and try again." },
      { status: 400 },
    );
  }

  try {
    const updated = await updatePurchase(id, purchase);
    return updated
      ? NextResponse.json({ purchase: updated })
      : NextResponse.json({ error: "Purchase not found." }, { status: 404 });
  } catch {
    return NextResponse.json(
      { error: "The transaction could not be updated." },
      { status: 503 },
    );
  }
}
