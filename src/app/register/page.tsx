import { notFound } from "next/navigation";
import { wowConfig } from "@/server/config/wow";

export default function RegisterPage() {
  if (!wowConfig.registrationEnabled) notFound();

  return (
    <main className="auth-page">
      <form className="auth-form" action="/api/auth/register" method="post">
        <h1>Create account</h1>
        <label>
          Username
          <input name="username" autoComplete="username" maxLength={17} pattern="[A-Za-z0-9]+" required />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="new-password" maxLength={16} required />
        </label>
        <label>
          Confirm password
          <input name="password_confirmation" type="password" autoComplete="new-password" maxLength={16} required />
        </label>
        <button type="submit">Create account</button>
      </form>
    </main>
  );
}
