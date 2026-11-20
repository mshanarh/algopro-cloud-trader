/**
 * Accounts that skip the admin approval queue and land straight in the portal.
 * Add or remove addresses here — nothing else needs to change.
 */
export const AUTO_APPROVED_EMAILS = ["biyasentobeko222@gmail.com"];

export function isAutoApprovedEmail(email?: string | null): boolean {
  if (!email) return false;
  return AUTO_APPROVED_EMAILS.includes(email.trim().toLowerCase());
}

/** Reads the email claim from the Supabase auth context. */
export function claimEmail(claims: unknown): string | undefined {
  const email = (claims as { email?: unknown } | undefined)?.email;
  return typeof email === "string" ? email : undefined;
}
