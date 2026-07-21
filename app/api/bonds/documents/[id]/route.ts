import { NextResponse } from "next/server";
import { getBondSession } from "@/lib/bonds/auth";
import { getBondDocument, readBondDocumentFile } from "@/lib/bonds/documents";

function downloadFileName(value: string) {
  return value.replace(/["\\\r\n]/g, "_");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await getBondSession())) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const document = getBondDocument(id);
  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  try {
    const file = await readBondDocumentFile(document);
    return new NextResponse(file, {
      headers: {
        "Content-Type": document.contentType,
        "Content-Disposition": `attachment; filename="${downloadFileName(
          document.originalFileName,
        )}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "The document could not be loaded." },
      { status: 503 },
    );
  }
}
