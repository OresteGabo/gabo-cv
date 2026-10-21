import { NextRequest } from "next/server";

type JsonBodyResult =
  | { ok: true; data: unknown }
  | { ok: false; status: number; error: string };

export function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    // Next can normalize its internal URL to localhost. Use the actual Host,
    // never a caller-supplied forwarded-host header, unless pinned by config.
    const host = request.headers.get("host") || request.nextUrl.host;
    const expected = process.env.BONDS_APP_ORIGIN || `${request.nextUrl.protocol}//${host}`;
    return new URL(origin).origin === new URL(expected).origin;
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
  if (!/^application\/json(?:\s*;|$)/i.test(contentType.trim())) {
    return { ok: false, status: 415, error: "Expected a JSON request body." };
  }

  let raw = "";
  const reader = request.body?.getReader();
  if (!reader) return { ok: false, status: 400, error: "Invalid request." };
  let total = 0;
  const decoder = new TextDecoder("utf-8", { fatal: true });
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return { ok: false, status: 413, error: "Request body is too large." };
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
  } catch {
    return { ok: false, status: 400, error: "Invalid request." };
  } finally { reader.releaseLock(); }

  try {
    return { ok: true, data: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, status: 400, error: "Invalid request." };
  }
}
