import { NextResponse } from "next/server";
import { authenticateAccount, isDatabaseConnectionError } from "@/server/auth/accounts";
import { formValue } from "@/server/http/forms";
import { redirectUrl } from "@/server/http/urls";
import { createDatabaseSession, sessionCookieName, sessionCookieOptions } from "@/server/session/database";

export async function POST(request: Request) {
  const formData = await request.formData();
  const username = formValue(formData, "username");
  const password = formValue(formData, "password");

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 422 });
  }

  let account;
  try {
    account = await authenticateAccount(username, password);
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      console.error("Login failed because the auth database is unavailable or rejected credentials.", error);
      return NextResponse.json({ error: "Authentication database is unavailable." }, { status: 503 });
    }

    throw error;
  }

  if (!account) {
    return NextResponse.json({ error: "These credentials do not match our records." }, { status: 401 });
  }

  const sessionId = await createDatabaseSession(account.id, request);
  const response = NextResponse.redirect(redirectUrl(request, "/dashboard"), { status: 303 });
  response.cookies.set(sessionCookieName, sessionId, sessionCookieOptions);

  return response;
}
