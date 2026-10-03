import { describe, expect, it } from "vitest";
import { isDatabaseConnectionError, isDuplicateAccountError, normalizeAccountIdentity } from "@/server/auth/identity";

describe("account helpers", () => {
  it("normalizes AzerothCore account identities", () => {
    expect(normalizeAccountIdentity("  rinrintin  ")).toBe("RINRINTIN");
    expect(normalizeAccountIdentity("user@example.com")).toBe("USER@EXAMPLE.COM");
  });

  it("recognizes duplicate MySQL account errors", () => {
    expect(isDuplicateAccountError({ code: "ER_DUP_ENTRY" })).toBe(true);
    expect(isDuplicateAccountError({ errno: 1062 })).toBe(true);
    expect(isDuplicateAccountError({ code: "ER_NO_SUCH_TABLE" })).toBe(false);
    expect(isDuplicateAccountError(null)).toBe(false);
  });

  it("recognizes database connection errors", () => {
    expect(isDatabaseConnectionError({ code: "ER_ACCESS_DENIED_ERROR" })).toBe(true);
    expect(isDatabaseConnectionError({ errno: 1045 })).toBe(true);
    expect(isDatabaseConnectionError({ code: "ECONNREFUSED" })).toBe(true);
    expect(isDatabaseConnectionError({ code: "ER_DUP_ENTRY" })).toBe(false);
  });
});
