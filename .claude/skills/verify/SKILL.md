---
name: verify
description: Verify azweb-ts through its Next.js browser UI and HTTP routes, using the local server, health checks, captured responses, and configured AzerothCore databases when a journey needs authentication or persistence.
---

# Verify azweb-ts

Use this skill when a change affects the AzerothCore account and armory web app. The primary surface is the Next.js browser UI. The repository also exposes HTTP API routes and server-rendered pages; use those only as the same user path's transport, not as substitutes for a UI journey.

## Launch

The default verification server is an isolated Next.js dev process on `127.0.0.1:18080`. It does not create a local database. It expects an AzerothCore-compatible MySQL setup through the variables in `.env.example` when driving deep health, registration, login, dashboard, characters, guilds, auctions, or admin journeys.

From the repository root, run:

```sh
./scripts/verify-web.sh start
```

The helper starts `npm run dev -- --hostname 127.0.0.1` with `PORT=18080`, writes its PID and logs under `.artifacts/verify/`, and waits for `GET /api/health` to return `{ "ok": true }`. A ready process is not enough for database-backed work. Run the doctor and require `GET /api/health?deep=1` to return HTTP 200 before claiming an authenticated or persistent journey is runnable.

To use a different server, set `VERIFY_BASE_URL` and launch the app yourself with the matching `PORT`; the helper will inspect that URL but will not own a process it did not start.

## Doctor

Run this before driving whenever startup, auth, or ports look suspicious:

```sh
./scripts/verify-web.sh doctor
```

The doctor checks the shallow health response, the login and registration routes, the expected Next.js response, and the deep database health response. It reports `deep databases unavailable` instead of treating that as a frontend failure. Do not drive a database-backed feature until deep health passes.

## Drive

Use a real browser for visual and form journeys. The stable handles are the route paths, visible headings, form labels, input `name` values, and button text. The app currently has no Playwright or Cypress harness, so use browser automation when available and capture the corresponding HTTP response only as supporting evidence.

For a public smoke journey:

1. Open `/`.
2. Confirm the page shows a realm status section with `Realm`, `Players online`, and `Realmlist`.
3. Follow `Sign in` to `/login` and confirm the `Sign in` heading, `username` input, `password` input, and `Sign in` button.
4. Follow `Create account` to `/register` and confirm the `Create account` heading plus the `username`, `email`, `password`, and `password_confirmation` inputs.

For registration or login, use the browser form, not a direct database insert. Use a disposable AzerothCore account and a unique username/email. Observe the redirect and resulting signed-in page. Never log passwords or include them in evidence. A failed deep-health check is a prerequisite failure, not a reason to weaken the journey.

The HTTP companion for the public smoke journey is:

```sh
./scripts/verify-web.sh capture-public
```

It saves the landing page, login page, registration page, and health response into the current evidence directory without mutating application state.

## Evidence

Every proof must capture the action and resulting state. Keep evidence in `.artifacts/verify/<run-id>/`; cleanup preserves this directory. For browser work, save screenshots after the landing page, login page, and resulting state. For HTTP work, save response headers and bodies. For registration or login, also record the final URL and a redacted browser transcript, then verify the corresponding session or account effect through the UI or an authorized read-only database check.

Do not call internal setters, seed test-only endpoints, or claim success from a final screenshot alone. Mocks are acceptable only for an external production boundary that already isolates the dependency. The app's deep health check is not a substitute for the feature journey.

## Cleanup

After every run, including a failed run, execute:

```sh
./scripts/verify-web.sh cleanup
```

Cleanup reads the PID recorded by `start`, verifies that PID is the owned verification process, sends it a normal termination signal, waits briefly, and removes only the helper's PID file. It does not kill by process name and does not remove logs, screenshots, response bodies, or other evidence. If the app was launched manually, stop the exact process you started and leave the evidence directory intact.

## Helpers

The executable helper is `scripts/verify-web.sh`.

```sh
./scripts/verify-web.sh start
./scripts/verify-web.sh doctor
./scripts/verify-web.sh capture-public
./scripts/verify-web.sh cleanup
```

The helper uses `VERIFY_BASE_URL` when set. Its default is `http://127.0.0.1:18080`. It stores the current run path in `.artifacts/verify/current` and keeps proof files under the run-specific directory.

## Checksec

Run the security gate after dependency or filesystem changes and before declaring verification complete:

```sh
mise install
npm run checksec
```

The gate runs `trivy fs` through the pinned tool in `mise.toml` and `npm audit --audit-level=high`. It scans the repository while excluding Git metadata, installed dependencies, Next.js build output, and prior evidence. Reports are written to `.artifacts/checksec/<run-id>/trivy.json` and `npm-audit.json`.

When npm reports vulnerabilities, apply the repository's declared remediation workflow and re-run the gate:

```sh
npm run checksec:fix
npm run checksec
```

The fix mode runs `npm audit fix`, then `npm audit fix --force` only when high-severity findings remain. Review the resulting package and lockfile changes and run the full project checks because forced repairs can change major versions. Trivy findings do not have a blanket safe fix command; inspect its report and make the smallest targeted code, dependency, or configuration change, then re-run `npm run checksec`.
