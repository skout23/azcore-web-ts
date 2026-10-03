import { NextResponse } from "next/server";
import { redirectUrl } from "@/server/http/urls";
import { currentSession, destroyOtherDatabaseSessions } from "@/server/session/database";

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.redirect(redirectUrl(request, "/login"), { status: 303 });
  }

  await destroyOtherDatabaseSessions(session.user.id, session.id);

  return NextResponse.redirect(redirectUrl(request, "/dashboard"), { status: 303 });
}
