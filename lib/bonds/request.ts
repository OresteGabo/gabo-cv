import { NextRequest } from "next/server";

type JsonBodyResult =
  | { ok: true; data: unknown }
  | { ok: false; status: number; error: string };

export function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function readBoundedJsonBody(
  request: NextRequest,
  maxBytes: number,
): Promise<JsonBodyResult> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { ok: false, status: 413, error: "Request body is too large." };
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return { ok: false, status: 415, error: "Expected a JSON request body." };
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return { ok: false, status: 400, error: "Invalid request." };
  }

  if (Buffer.byteLength(raw, "utf8") > maxBytes) {
    return { ok: false, status: 413, error: "Request body is too large." };
  }

  try {
    return { ok: true, data: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, status: 400, error: "Invalid request." };
  }
}
