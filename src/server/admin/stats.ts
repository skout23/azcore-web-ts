import "server-only";
import { sql } from "kysely";
import { authDb, charactersDb, webDb } from "@/server/db/connections";

async function safeCount(label: string, count: () => Promise<number>) {
  try {
    return { label, available: true, value: await count() };
  } catch {
    return { label, available: false, value: null };
  }
}

export async function adminStats() {
  const [accounts, webSessions, characters, onlineCharacters] = await Promise.all([
    safeCount("Accounts", async () => {
      const row = await authDb.selectFrom("account").select(({ fn }) => fn.count<number>("id").as("count")).executeTakeFirst();
      return Number(row?.count ?? 0);
    }),
    safeCount("Web sessions", async () => {
      const row = await webDb.selectFrom("sessions").select(({ fn }) => fn.count<number>("id").as("count")).executeTakeFirst();
      return Number(row?.count ?? 0);
    }),
    safeCount("Characters", async () => {
      const row = await charactersDb.selectFrom("characters").select(({ fn }) => fn.count<number>("guid").as("count")).executeTakeFirst();
      return Number(row?.count ?? 0);
    }),
    safeCount("Online characters", async () => {
      const row = await charactersDb
        .selectFrom("characters")
        .select(({ fn }) => fn.count<number>("guid").as("count"))
        .where("online", "=", 1)
        .executeTakeFirst();
      return Number(row?.count ?? 0);
    })
  ]);

  const deepHealth = await Promise.all([
    safeCount("Auth database", async () => Number((await authDb.selectNoFrom(sql<number>`1`.as("ok")).executeTakeFirst())?.ok ?? 0)),
    safeCount("Web database", async () => Number((await webDb.selectNoFrom(sql<number>`1`.as("ok")).executeTakeFirst())?.ok ?? 0)),
    safeCount("Characters database", async () => Number((await charactersDb.selectNoFrom(sql<number>`1`.as("ok")).executeTakeFirst())?.ok ?? 0))
  ]);

  return {
    counts: [accounts, webSessions, characters, onlineCharacters],
    databases: deepHealth
  };
}
