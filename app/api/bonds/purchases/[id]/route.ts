import { NextRequest, NextResponse } from "next/server";
import { getBondSession } from "@/lib/bonds/auth";
import { deletePurchase } from "@/lib/bonds/db";
import { isSameOriginRequest } from "@/lib/bonds/request";

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
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
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
