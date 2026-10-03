import { NextResponse } from "next/server";
import { accountExists, createAccount, isDatabaseConnectionError, isDuplicateAccountError } from "@/server/auth/accounts";
import { wowConfig } from "@/server/config/wow";
import { clientIp, formValue } from "@/server/http/forms";
import { redirectUrl } from "@/server/http/urls";

const usernamePattern = /^[A-Za-z0-9]{1,17}$/;

export async function POST(request: Request) {
  if (!wowConfig.registrationEnabled) {
    return NextResponse.json({ error: "Registration is disabled." }, { status: 404 });
  }

  const formData = await request.formData();
  const username = formValue(formData, "username");
  const email = formValue(formData, "email");
  const password = formValue(formData, "password");
  const confirmation = formValue(formData, "password_confirmation");

  if (!usernamePattern.test(username)) {
    return NextResponse.json({ error: "Username must be alphanumeric and at most 17 characters." }, { status: 422 });
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 422 });
  }

  if (!password || password.length > 16 || password !== confirmation) {
    return NextResponse.json({ error: "Password confirmation does not match or exceeds 16 characters." }, { status: 422 });
  }

  try {
    if (await accountExists(username, email)) {
      return NextResponse.json({ error: "An account with that username or email already exists." }, { status: 409 });
    }

    await createAccount({
      username,
      email,
      password,
      ipAddress: clientIp(request.headers)
    });
  } catch (error) {
    if (isDuplicateAccountError(error)) {
      return NextResponse.json({ error: "An account with that username or email already exists." }, { status: 409 });
    }

    if (isDatabaseConnectionError(error)) {
      console.error("Registration failed because the auth database is unavailable or rejected credentials.", error);
      return NextResponse.json({ error: "Authentication database is unavailable." }, { status: 503 });
    }

    throw error;
  }

  return NextResponse.redirect(redirectUrl(request, "/login"), { status: 303 });
}
