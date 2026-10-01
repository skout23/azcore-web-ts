import "server-only";
import { env } from "@/server/config/env";
import { authDb } from "@/server/db/connections";

export async function accountSecurityLevel(accountId: number): Promise<number> {
  const access = await authDb
    .selectFrom("account_access")
    .select(({ fn }) => fn.max<number>("gmlevel").as("gmlevel"))
    .where("id", "=", accountId)
    .where((eb) => eb.or([eb("RealmID", "=", env.ADMIN_REALM_ID), eb("RealmID", "=", -1)]))
    .executeTakeFirst();

  return Number(access?.gmlevel ?? 0);
}

export async function isAdminAccount(accountId: number): Promise<boolean> {
  return (await accountSecurityLevel(accountId)) >= env.ADMIN_MIN_GMLEVEL;
}
