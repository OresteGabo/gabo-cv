import "server-only";

export function fileOwnerMode() {
  return process.env.NODE_ENV === "production" && !process.env.BONDS_DATABASE_URL?.trim()
    && process.env.BONDS_PORTFOLIO_DATABASE !== "database";
}
