# azweb-ts

A TypeScript rewrite of the AzerothCore account and armory web app.

This project is a TypeScript, Next.js, Kysely, and Docker Compose rewrite of
https://github.com/assada/dead-azerothcore-web.

The app is designed to run beside an existing AzerothCore deployment. It keeps
its own web tables in a separate `azweb` database and does not alter
AzerothCore's existing `auth`, `characters`, or `world` schemas.

## Development

```sh
npm install
cp .env.example .env
npm run dev
```

Useful local checks:

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

## Docker

Create and edit `.env` first:

```sh
cp .env.example .env
```

Create the web database and app-owned tables before starting production traffic.
The migration targets `DB_WEB_DATABASE`; do not point `DB_WEB_DATABASE` at an
AzerothCore database.

```sh
docker compose build app
docker compose run --rm app npm run db:migrate
docker compose up -d
```

The default app URL is `http://localhost:8080`.

See [docs/deployment.md](docs/deployment.md) for production Docker Compose and
Dockhand/AzerothCore network deployment notes, including SQL grants for
read-only AzerothCore access and registration-enabled auth writes.

## Database Model

- `DB_WEB_*`: app-owned tables such as sessions, account profiles, password
  reset tokens, and operation logs. The app migration creates these tables.
- `DB_AUTH_*`: AzerothCore `auth` database. Read-only is enough unless website
  registration or password-management features are enabled.
- `DB_CHAR_*`: AzerothCore `characters` database. Intended to be read-only.
- `DB_WORLD_DATABASE`: AzerothCore `world` database name used for world-backed
  features. Intended to be read-only when those features are implemented.

## Setup And Admin

- `/setup` provides a browser-only install helper that generates `.env` and SQL
  grant snippets. It does not save database passwords or write files.
- `/admin` is available only to logged-in AzerothCore staff accounts from the
  `account_access` table.
- `ADMIN_MIN_GMLEVEL=3` matches AzerothCore's `SEC_ADMINISTRATOR` level.
- `ADMIN_REALM_ID=-1` checks the global/all-realms staff grant.

## Parity Scope

- AzerothCore SRP6 login and registration.
- Email verification, password reset, profile management, account deactivation, session management.
- Character armory with equipment, stats, talents, achievements, reputation, skills, mounts, PvP, and model viewer assets.
- Guilds, leaderboards, auctions, and community visibility controls.
- Character actions through the world SOAP console: unstuck, rename, and appearance customization.
