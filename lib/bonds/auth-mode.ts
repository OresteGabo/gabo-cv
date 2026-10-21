import "server-only";
import { bondsDatabaseUrl } from "./database-config";

export function fileOwnerMode() {
  return process.env.NODE_ENV === "production" && !bondsDatabaseUrl()
    && process.env.BONDS_PORTFOLIO_DATABASE !== "database";
}
