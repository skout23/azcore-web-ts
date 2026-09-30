import { NextResponse } from "next/server";
import { sql } from "kysely";
import { authDb, charactersDb, webDb } from "@/server/db/connections";

async function pingDatabases() {
  await authDb.selectNoFrom(sql<number>`1`.as("ok")).executeTakeFirstOrThrow();
  await webDb.selectNoFrom(sql<number>`1`.as("ok")).executeTakeFirstOrThrow();
  await charactersDb.selectNoFrom(sql<number>`1`.as("ok")).executeTakeFirstOrThrow();
}

export async function GET(request: Request) {
  const deep = new URL(request.url).searchParams.get("deep");

  if (deep !== "1" && deep !== "true") {
    return NextResponse.json({ ok: true });
  }

  try {
    await pingDatabases();
    return NextResponse.json({ ok: true, databases: true });
  } catch {
    return NextResponse.json({ ok: false, databases: false }, { status: 503 });
  }
}
