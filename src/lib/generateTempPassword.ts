import crypto from "node:crypto";

// Not "server-only": prisma/seed.ts runs under plain tsx/Node (outside
// Next's build), and server-only throws unconditionally if imported there.
// This has no Next-specific dependency, so it's fine to share as-is.

/**
 * A short, URL-safe random password for a freshly created account — paired
 * with mustChangePassword, so it only ever needs to survive one login.
 */
export function generateTempPassword(): string {
  return crypto.randomBytes(9).toString("base64url"); // 12 url-safe chars
}
