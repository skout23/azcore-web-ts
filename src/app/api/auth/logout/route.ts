import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { destroyDatabaseSession, sessionCookieName, sessionCookieOptions } from "@/server/session/database";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(sessionCookieName)?.value;

  if (sessionId) {
    await destroyDatabaseSession(sessionId);
  }

  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  response.cookies.set(sessionCookieName, "", { ...sessionCookieOptions, maxAge: 0 });

  return response;
}
