function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function parseAdminEmailAllowlist(rawAllowlist?: string) {
  if (!rawAllowlist) {
    return [];
  }

  return [...new Set(rawAllowlist.split(",").map(normalizeEmail).filter(Boolean))];
}

export function isAdminEmailAllowed(email: string, allowlist: string[]) {
  return allowlist.includes(normalizeEmail(email));
}
