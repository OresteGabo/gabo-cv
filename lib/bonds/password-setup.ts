// Shared format for the browser-generated verifier and server verification.
export const PASSWORD_SETUP_ITERATIONS = 600_000;
export const PASSWORD_SETUP_PREFIX = `pbkdf2-sha256:${PASSWORD_SETUP_ITERATIONS}:`;

export async function createBrowserPasswordHash(password: string): Promise<string> {
  if (password.length < 15 || password.length > 128) throw new Error("Use a password between 15 and 128 characters.");
  if (!globalThis.crypto?.subtle) throw new Error("Open this page over HTTPS to create your password hash.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: PASSWORD_SETUP_ITERATIONS }, key, 256);
  const hex = (value: Uint8Array) => Array.from(value, byte => byte.toString(16).padStart(2, "0")).join("");
  return `${PASSWORD_SETUP_PREFIX}${hex(salt)}:${hex(new Uint8Array(bits))}`;
}
