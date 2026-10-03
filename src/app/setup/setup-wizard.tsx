"use client";

import { useMemo, useState } from "react";

type SetupState = {
  appUrl: string;
  appSecret: string;
  adminMinGmLevel: string;
  adminRealmId: string;
  networkName: string;
  dbHost: string;
  authDatabase: string;
  authUsername: string;
  authPassword: string;
  webDatabase: string;
  webUsername: string;
  webPassword: string;
  charDatabase: string;
  charUsername: string;
  charPassword: string;
  worldDatabase: string;
  registrationEnabled: boolean;
  secureCookie: boolean;
};

const initialState: SetupState = {
  appUrl: "https://accounts.example.com",
  appSecret: "",
  adminMinGmLevel: "3",
  adminRealmId: "-1",
  networkName: "azerothcore_default",
  dbHost: "mysql",
  authDatabase: "acore_auth",
  authUsername: "azweb_auth",
  authPassword: "",
  webDatabase: "azweb",
  webUsername: "azweb",
  webPassword: "",
  charDatabase: "acore_characters",
  charUsername: "azweb_ro",
  charPassword: "",
  worldDatabase: "acore_world",
  registrationEnabled: true,
  secureCookie: true
};

function envValue(value: string): string {
  return value.includes(" ") || value.includes("#") ? JSON.stringify(value) : value;
}

function sqlString(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "''");
}

function buildEnv(state: SetupState): string {
  const webPassword = state.webPassword || "change-me";
  const authPassword = state.authPassword || "change-me";
  const charPassword = state.charPassword || "change-me";

  return [
    'APP_NAME="AzerothCore"',
    "APP_ENV=production",
    `APP_SECRET=${envValue(state.appSecret || "generate-a-long-random-secret")}`,
    `ADMIN_MIN_GMLEVEL=${envValue(state.adminMinGmLevel)}`,
    `ADMIN_REALM_ID=${envValue(state.adminRealmId)}`,
    `APP_URL=${envValue(state.appUrl)}`,
    "",
    "HTTP_BIND=127.0.0.1",
    "HTTP_PORT=8080",
    "",
    `AC_NETWORK_NAME=${envValue(state.networkName)}`,
    "",
    `DB_AUTH_HOST=${envValue(state.dbHost)}`,
    "DB_AUTH_PORT=3306",
    `DB_AUTH_DATABASE=${envValue(state.authDatabase)}`,
    `DB_AUTH_USERNAME=${envValue(state.authUsername)}`,
    `DB_AUTH_PASSWORD=${envValue(authPassword)}`,
    `DB_WEB_HOST=${envValue(state.dbHost)}`,
    "DB_WEB_PORT=3306",
    `DB_WEB_DATABASE=${envValue(state.webDatabase)}`,
    `DB_WEB_USERNAME=${envValue(state.webUsername)}`,
    `DB_WEB_PASSWORD=${envValue(webPassword)}`,
    `DB_CHAR_HOST=${envValue(state.dbHost)}`,
    "DB_CHAR_PORT=3306",
    `DB_CHAR_DATABASE=${envValue(state.charDatabase)}`,
    `DB_CHAR_USERNAME=${envValue(state.charUsername)}`,
    `DB_CHAR_PASSWORD=${envValue(charPassword)}`,
    `DB_WORLD_DATABASE=${envValue(state.worldDatabase)}`,
    "",
    "SESSION_LIFETIME=120",
    `SESSION_SECURE_COOKIE=${state.secureCookie ? "true" : "false"}`,
    "SESSION_SAME_SITE=lax",
    "",
    `WOW_REGISTRATION_ENABLED=${state.registrationEnabled ? "true" : "false"}`
  ].join("\n");
}

function buildSql(state: SetupState): string {
  const statements = [
    `CREATE DATABASE IF NOT EXISTS \`${state.webDatabase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    "",
    `CREATE USER IF NOT EXISTS '${sqlString(state.webUsername)}'@'%' IDENTIFIED BY '${sqlString(state.webPassword || "change-me")}';`,
    `GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX, ALTER ON \`${state.webDatabase}\`.* TO '${sqlString(state.webUsername)}'@'%';`,
    "",
    `CREATE USER IF NOT EXISTS '${sqlString(state.charUsername)}'@'%' IDENTIFIED BY '${sqlString(state.charPassword || "change-me")}';`,
    `GRANT SELECT ON \`${state.authDatabase}\`.* TO '${sqlString(state.charUsername)}'@'%';`,
    `GRANT SELECT ON \`${state.charDatabase}\`.* TO '${sqlString(state.charUsername)}'@'%';`,
    `GRANT SELECT ON \`${state.worldDatabase}\`.* TO '${sqlString(state.charUsername)}'@'%';`
  ];

  if (state.registrationEnabled) {
    statements.push(
      "",
      `CREATE USER IF NOT EXISTS '${sqlString(state.authUsername)}'@'%' IDENTIFIED BY '${sqlString(state.authPassword || "change-me")}';`,
      `GRANT SELECT ON \`${state.authDatabase}\`.* TO '${sqlString(state.authUsername)}'@'%';`,
      `GRANT INSERT ON \`${state.authDatabase}\`.account TO '${sqlString(state.authUsername)}'@'%';`
    );
  }

  statements.push("", "FLUSH PRIVILEGES;");
  return statements.join("\n");
}

export function SetupWizard() {
  const [state, setState] = useState(initialState);
  const envOutput = useMemo(() => buildEnv(state), [state]);
  const sqlOutput = useMemo(() => buildSql(state), [state]);

  function update<K extends keyof SetupState>(key: K, value: SetupState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="setup-shell">
      <section className="setup-hero">
        <p className="eyebrow">Install</p>
        <h1>Configure AzerothCore Web</h1>
        <p>
          Fill in the deployment values below to generate SQL grants and an environment file. Values stay in your
          browser; this page does not save or submit database passwords.
        </p>
        <p>
          Admin access uses AzerothCore&apos;s `account_access` GM levels. Level 3 is administrator, and realm `-1`
          applies to all realms.
        </p>
      </section>

      <section className="setup-grid">
        <form className="setup-form">
          <fieldset>
            <legend>Application</legend>
            <label>
              Public URL
              <input value={state.appUrl} onChange={(event) => update("appUrl", event.target.value)} />
            </label>
            <label>
              App secret
              <input value={state.appSecret} onChange={(event) => update("appSecret", event.target.value)} placeholder="generate a long random secret" />
            </label>
            <label>
              Admin minimum GM level
              <input value={state.adminMinGmLevel} onChange={(event) => update("adminMinGmLevel", event.target.value)} />
            </label>
            <label>
              Admin realm ID
              <input value={state.adminRealmId} onChange={(event) => update("adminRealmId", event.target.value)} />
            </label>
            <label>
              Dockhand network
              <input value={state.networkName} onChange={(event) => update("networkName", event.target.value)} />
            </label>
          </fieldset>

          <fieldset>
            <legend>Database Services</legend>
            <label>
              DB host/service
              <input value={state.dbHost} onChange={(event) => update("dbHost", event.target.value)} />
            </label>
            <label>
              Web database
              <input value={state.webDatabase} onChange={(event) => update("webDatabase", event.target.value)} />
            </label>
            <label>
              Web username
              <input value={state.webUsername} onChange={(event) => update("webUsername", event.target.value)} />
            </label>
            <label>
              Web password
              <input type="password" value={state.webPassword} onChange={(event) => update("webPassword", event.target.value)} />
            </label>
          </fieldset>

          <fieldset>
            <legend>AzerothCore</legend>
            <label>
              Auth database
              <input value={state.authDatabase} onChange={(event) => update("authDatabase", event.target.value)} />
            </label>
            <label>
              Auth write username
              <input value={state.authUsername} onChange={(event) => update("authUsername", event.target.value)} />
            </label>
            <label>
              Auth write password
              <input type="password" value={state.authPassword} onChange={(event) => update("authPassword", event.target.value)} />
            </label>
            <label>
              Characters database
              <input value={state.charDatabase} onChange={(event) => update("charDatabase", event.target.value)} />
            </label>
            <label>
              Read-only username
              <input value={state.charUsername} onChange={(event) => update("charUsername", event.target.value)} />
            </label>
            <label>
              Read-only password
              <input type="password" value={state.charPassword} onChange={(event) => update("charPassword", event.target.value)} />
            </label>
            <label>
              World database
              <input value={state.worldDatabase} onChange={(event) => update("worldDatabase", event.target.value)} />
            </label>
          </fieldset>

          <fieldset className="toggle-group">
            <legend>Features</legend>
            <label>
              <input type="checkbox" checked={state.registrationEnabled} onChange={(event) => update("registrationEnabled", event.target.checked)} />
              Enable website registration
            </label>
            <label>
              <input type="checkbox" checked={state.secureCookie} onChange={(event) => update("secureCookie", event.target.checked)} />
              Secure session cookies
            </label>
          </fieldset>
        </form>

        <aside className="setup-output">
          <section>
            <div className="section-heading">
              <h2>.env</h2>
              <button type="button" onClick={() => navigator.clipboard.writeText(envOutput)}>
                Copy
              </button>
            </div>
            <textarea readOnly value={envOutput} />
          </section>

          <section>
            <div className="section-heading">
              <h2>SQL Grants</h2>
              <button type="button" onClick={() => navigator.clipboard.writeText(sqlOutput)}>
                Copy
              </button>
            </div>
            <textarea readOnly value={sqlOutput} />
          </section>
        </aside>
      </section>
    </main>
  );
}
