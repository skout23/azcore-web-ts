export function normalizeAccountIdentity(value: string): string {
  return value.trim().toUpperCase();
}

export function isDuplicateAccountError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const candidate = error as { code?: unknown; errno?: unknown };
  return candidate.code === "ER_DUP_ENTRY" || candidate.errno === 1062;
}

export function isDatabaseConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const candidate = error as { code?: unknown; errno?: unknown };
  return (
    candidate.code === "ER_ACCESS_DENIED_ERROR" ||
    candidate.code === "ER_DBACCESS_DENIED_ERROR" ||
    candidate.code === "ECONNREFUSED" ||
    candidate.code === "ENOTFOUND" ||
    candidate.code === "ETIMEDOUT" ||
    candidate.errno === 1044 ||
    candidate.errno === 1045
  );
}
