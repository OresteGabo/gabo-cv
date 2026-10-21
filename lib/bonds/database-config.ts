import "server-only";

export function bondsDatabaseUrl() {
  return process.env.BONDS_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim() || null;
}
