import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { authDb, webDb } from "@/server/db/connections";
import { isDuplicateAccountError, normalizeAccountIdentity } from "./identity";
import { computeSrp6Verifier } from "./srp6";

function normalizeIdentity(value: string): string {
  return normalizeAccountIdentity(value);
}

function toBuffer(value: Buffer | string | null): Buffer | null {
  if (value === null) return null;
  return Buffer.isBuffer(value) ? value : Buffer.from(value, "binary");
}

export { isDuplicateAccountError, normalizeAccountIdentity };

export async function findActiveAccountByUsername(username: string) {
  return authDb
    .selectFrom("account")
    .select([
      "account.id",
      "account.username",
      "account.email",
      "account.salt",
      "account.verifier"
    ])
    .where("account.username", "=", normalizeIdentity(username))
    .executeTakeFirst();
}

export async function verifyAccountPassword(username: string, password: string): Promise<boolean> {
  return (await authenticateAccount(username, password)) !== null;
}

export async function authenticateAccount(username: string, password: string) {
  const account = await findActiveAccountByUsername(username);
  const salt = toBuffer(account?.salt ?? null);
  const verifier = toBuffer(account?.verifier ?? null);

  if (!account || !salt || !verifier) return null;

  const candidate = await computeSrp6Verifier(account.username, password, salt);
  if (candidate.length !== verifier.length || !timingSafeEqual(candidate, verifier)) return null;

  return account;
}

export async function createAccount(input: {
  username: string;
  email: string;
  password: string;
  ipAddress?: string | null;
}) {
  const username = normalizeIdentity(input.username);
  const email = normalizeIdentity(input.email);
  const salt = randomBytes(32);
  const verifier = await computeSrp6Verifier(username, input.password, salt);

  const account = await authDb
    .insertInto("account")
    .values({
      username,
      salt,
      verifier,
      email,
      reg_mail: email,
      joindate: new Date(),
      last_ip: input.ipAddress ?? null,
      last_attempt_ip: input.ipAddress ?? null,
      expansion: 2,
      locale: 0,
      online: 0
    })
    .executeTakeFirstOrThrow();

  const accountId = Number(account.insertId);
  await webDb
    .insertInto("account_profiles")
    .values({
      account_id: accountId,
      pending_email: email
    })
    .executeTakeFirst();

  return { id: accountId, username, email };
}

export async function accountExists(username: string, email: string): Promise<boolean> {
  const normalizedUsername = normalizeIdentity(username);
  const normalizedEmail = normalizeIdentity(email);

  const account = await authDb
    .selectFrom("account")
    .select("id")
    .where((eb) => eb.or([eb("username", "=", normalizedUsername), eb("email", "=", normalizedEmail), eb("reg_mail", "=", normalizedEmail)]))
    .executeTakeFirst();

  return Boolean(account);
}
