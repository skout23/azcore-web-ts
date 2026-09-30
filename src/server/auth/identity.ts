export function normalizeAccountIdentity(value: string): string {
  return value.trim().toUpperCase();
}

export function isDuplicateAccountError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const candidate = error as { code?: unknown; errno?: unknown };
  return candidate.code === "ER_DUP_ENTRY" || candidate.errno === 1062;
}
