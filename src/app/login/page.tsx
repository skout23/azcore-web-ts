export default function LoginPage() {
  return (
    <main className="auth-page">
      <form className="auth-form" action="/api/auth/login" method="post">
        <h1>Sign in</h1>
        <label>
          Username
          <input name="username" autoComplete="username" maxLength={17} required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button type="submit">Sign in</button>
      </form>
    </main>
  );
}
