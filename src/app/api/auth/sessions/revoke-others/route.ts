import { NextResponse } from "next/server";
import { currentSession, destroyOtherDatabaseSessions } from "@/server/session/database";

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  await destroyOtherDatabaseSessions(session.user.id, session.id);

  return NextResponse.redirect(new URL("/dashboard", request.url), { status: 303 });
}
