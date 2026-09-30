import { NextResponse } from "next/server";
import { authenticateAccount } from "@/server/auth/accounts";
import { formValue } from "@/server/http/forms";
import { createDatabaseSession, sessionCookieName, sessionCookieOptions } from "@/server/session/database";

export async function POST(request: Request) {
  const formData = await request.formData();
  const username = formValue(formData, "username");
  const password = formValue(formData, "password");

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 422 });
  }

  const account = await authenticateAccount(username, password);
  if (!account) {
    return NextResponse.json({ error: "These credentials do not match our records." }, { status: 401 });
  }

  const sessionId = await createDatabaseSession(account.id, request);
  const response = NextResponse.redirect(new URL("/dashboard", request.url), { status: 303 });
  response.cookies.set(sessionCookieName, sessionId, sessionCookieOptions);

  return response;
}
