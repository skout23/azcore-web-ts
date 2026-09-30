import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/server/config/env";
import { authDb, webDb } from "@/server/db/connections";
import { clientIp } from "@/server/http/forms";

export const sessionCookieName = "azweb_session";

export const sessionCookieOptions = {
  httpOnly: true,
  maxAge: env.SESSION_LIFETIME * 60,
  path: "/",
  sameSite: env.SESSION_SAME_SITE,
  secure: env.SESSION_SECURE_COOKIE
} as const;

function nowInSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function sessionCutoff(): number {
  return nowInSeconds() - env.SESSION_LIFETIME * 60;
}

export async function createDatabaseSession(accountId: number, request: Request): Promise<string> {
  const id = randomBytes(32).toString("hex");
  const now = nowInSeconds();

  await webDb.deleteFrom("sessions").where("last_activity", "<", sessionCutoff()).execute();

  await webDb
    .insertInto("sessions")
    .values({
      id,
      user_id: accountId,
      ip_address: clientIp(request.headers),
      user_agent: request.headers.get("user-agent"),
      payload: JSON.stringify({ userId: accountId }),
      last_activity: now
    })
    .executeTakeFirst();

  return id;
}

export async function destroyDatabaseSession(id: string): Promise<void> {
  await webDb.deleteFrom("sessions").where("id", "=", id).execute();
}

export async function destroyOtherDatabaseSessions(userId: number, currentSessionId: string): Promise<void> {
  await webDb.deleteFrom("sessions").where("user_id", "=", userId).where("id", "!=", currentSessionId).execute();
}

export async function sessionsForUser(userId: number) {
  await webDb.deleteFrom("sessions").where("last_activity", "<", sessionCutoff()).execute();

  return webDb
    .selectFrom("sessions")
    .select(["id", "ip_address", "user_agent", "last_activity"])
    .where("user_id", "=", userId)
    .orderBy("last_activity", "desc")
    .execute();
}

export async function currentSession() {
  const cookieStore = await cookies();
  const id = cookieStore.get(sessionCookieName)?.value;
  if (!id) return null;

  const session = await webDb
    .selectFrom("sessions")
    .select(["id", "user_id", "last_activity"])
    .where("sessions.id", "=", id)
    .executeTakeFirst();

  if (!session?.user_id) return null;

  if (session.last_activity < sessionCutoff()) {
    await destroyDatabaseSession(id);
    return null;
  }

  const account = await authDb
    .selectFrom("account")
    .select(["id", "username", "email"])
    .where("id", "=", session.user_id)
    .executeTakeFirst();

  if (!account) {
    await destroyDatabaseSession(id);
    return null;
  }

  await webDb.updateTable("sessions").set({ last_activity: nowInSeconds() }).where("id", "=", id).execute();

  return {
    id: session.id,
    user: {
      id: account.id,
      username: account.username,
      email: account.email
    }
  };
}
