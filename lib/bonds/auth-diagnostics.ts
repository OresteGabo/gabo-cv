import "server-only";
import { fileOwnerMode } from "./auth-mode";

// Log only known diagnostic codes and configuration presence. Database errors
// can contain credentials, SQL values, or connection URLs in their messages.
export function reportAuthFailure(operation: string, stage: string, error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  const reasons: Record<string, string> = {
    "42P01": "missing_table",
    "42703": "missing_column",
    "42501": "insufficient_database_permissions",
    "28P01": "database_credentials_rejected",
    "3D000": "database_not_found",
    ECONNREFUSED: "connection_refused",
    ETIMEDOUT: "connection_timeout",
    ENOTFOUND: "database_host_not_found",
    ENOENT: "missing_private_runtime_file",
  };
  const databaseConfigured = Boolean(process.env.BONDS_DATABASE_URL?.trim());
  console.error("[bonds-auth]", {
    operation,
    stage,
    reason: !databaseConfigured && process.env.NODE_ENV === "production" && !fileOwnerMode()
      ? "missing_BONDS_DATABASE_URL"
      : typeof code === "string" && Object.hasOwn(reasons, code) ? reasons[code] : "unclassified_server_error",
    databaseConfigured,
    ownerEmailConfigured: Boolean(process.env.BONDS_ADMIN_EMAIL?.trim()),
    ownerPasswordHashConfigured: Boolean(process.env.BONDS_ADMIN_PASSWORD_HASH?.trim()),
  });
}
