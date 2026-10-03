# Deployment

This app is intended to run as a single Next.js container alongside an existing
AzerothCore deployment. It does not run MySQL or AzerothCore itself.

The app keeps its own tables in a separate web database, configured with
`DB_WEB_*`. Migrations create only app-owned tables in that web database. They
do not alter AzerothCore's existing `auth`, `characters`, or `world` schemas.

## Prerequisites

- Docker with the Compose plugin.
- An existing AzerothCore database server.
- A database user for the app-owned web database.
- Read access to the AzerothCore `auth`, `characters`, and `world` databases.
- Optional write access to AzerothCore `auth.account` only when registration,
  password-change, or admin account-management features are enabled.

## Database Setup

The safest deployment uses a dedicated database for web-app state:

```sql
CREATE DATABASE IF NOT EXISTS azweb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'azweb'@'%' IDENTIFIED BY 'change-me';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX, ALTER
  ON azweb.* TO 'azweb'@'%';
```

Run this project's migration against `azweb`:

```sh
docker compose run --rm app npm run db:migrate
```

That migration creates app-owned tables such as `sessions`,
`account_profiles`, and `account_operations`.

It does not create or modify AzerothCore's base tables.

For read-only browsing, armory, dashboard character lists, guilds,
leaderboards, and auction views, create a read-only AzerothCore user:

```sql
CREATE USER IF NOT EXISTS 'azweb_ro'@'%' IDENTIFIED BY 'change-me';
GRANT SELECT ON acore_auth.* TO 'azweb_ro'@'%';
GRANT SELECT ON acore_characters.* TO 'azweb_ro'@'%';
GRANT SELECT ON acore_world.* TO 'azweb_ro'@'%';
```

If website registration is enabled, the app must insert rows into
`acore_auth.account`. Use the narrowest write grant that supports the enabled
account features:

```sql
CREATE USER IF NOT EXISTS 'azweb_auth'@'%' IDENTIFIED BY 'change-me';
GRANT SELECT ON acore_auth.* TO 'azweb_auth'@'%';
GRANT INSERT ON acore_auth.account TO 'azweb_auth'@'%';
```

Player password-change or admin password-management features will also need
`UPDATE` on `acore_auth.account` for the SRP6 credential columns when those
features are implemented. Do not grant it until you enable those flows.

## Environment

Create an environment file from the example and edit it for the deployment:

```sh
cp .env.example .env
```

Required production settings:

```env
APP_ENV=production
APP_URL=https://accounts.example.com
APP_SECRET=change-me
ADMIN_MIN_GMLEVEL=3
ADMIN_REALM_ID=-1

DB_AUTH_HOST=host.docker.internal
DB_AUTH_PORT=3306
DB_AUTH_DATABASE=acore_auth
DB_AUTH_USERNAME=azweb_auth
DB_AUTH_PASSWORD=change-me

DB_WEB_HOST=host.docker.internal
DB_WEB_PORT=3306
DB_WEB_DATABASE=azweb
DB_WEB_USERNAME=azweb
DB_WEB_PASSWORD=change-me

DB_CHAR_HOST=host.docker.internal
DB_CHAR_PORT=3306
DB_CHAR_DATABASE=acore_characters
DB_CHAR_USERNAME=azweb_ro
DB_CHAR_PASSWORD=change-me
DB_WORLD_DATABASE=acore_world

SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
```

Set `SESSION_SECURE_COOKIE=true` when serving the app over HTTPS. If a reverse
proxy terminates TLS, keep the public `APP_URL` as `https://...` and expose the
container only on an internal interface.

## Docker Compose

Build the container:

```sh
docker compose build app
```

Run the web-table migration:

```sh
docker compose run --rm app npm run db:migrate
```

The migration targets `DB_WEB_DATABASE`. It should not be pointed at
`acore_auth`, `acore_characters`, or `acore_world`.

Start the app:

```sh
docker compose up -d
```

The default app URL is `http://localhost:8080`. Change `HTTP_BIND` and
`HTTP_PORT` in `.env` to control the host binding:

```env
HTTP_BIND=127.0.0.1
HTTP_PORT=8080
```

For a public deployment, keep `HTTP_BIND=127.0.0.1` when a local reverse proxy
such as Caddy, Nginx, or Traefik forwards traffic to the app. Use
`HTTP_BIND=0.0.0.0` only when the Docker host should expose the port directly.

## Dockhand / AzerothCore Network Deployment

When AzerothCore is managed by Dockhand or another Compose stack, the app can
join the existing Docker network instead of using `host.docker.internal`.

In Dockhand, leave **Additional env file** blank. This repository's Compose file
does not require a checked-in `.env` file. Put the variables in Dockhand's
**Environment variables** editor instead; Compose passes them through to the
container.

Set the external network name and database service names:

```env
AC_NETWORK_NAME=azerothcore_default
DB_AUTH_HOST=mysql
DB_WEB_HOST=mysql
DB_CHAR_HOST=mysql
```

If Dockhand shows `env file .../.env not found`, the stack is running an older
Compose revision. Pull the latest repository version, confirm the Compose file no
longer contains `env_file: .env`, and keep Dockhand's **Additional env file**
field empty.

Use the network overlay file with every Compose command:

```sh
docker compose -f docker-compose.yml -f docker-compose.network.yml build app
docker compose -f docker-compose.yml -f docker-compose.network.yml run --rm app npm run db:migrate
docker compose -f docker-compose.yml -f docker-compose.network.yml up -d
```

Replace `azerothcore_default` and `mysql` with the network and database service
name used by the Dockhand/AzerothCore stack. You can list Docker networks with:

```sh
docker network ls
```

You can inspect a network to confirm the database service name:

```sh
docker network inspect azerothcore_default
```

## Traefik Routing

Compose labels can use Dockhand/Compose environment variables. Use
`docker-compose.traefik.yml` when the app should be routed by Traefik:

```sh
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d
```

Set these variables in Dockhand's environment editor:

```env
TRAEFIK_HOST=accounts.example.com
TRAEFIK_ROUTER=azweb
TRAEFIK_SERVICE=azweb
TRAEFIK_NETWORK=proxy
TRAEFIK_HTTP_ENTRYPOINT=web
TRAEFIK_HTTPS_ENTRYPOINT=websecure
TRAEFIK_CERT_RESOLVER=myresolver
```

The Traefik overlay attaches the app to the external network named by
`TRAEFIK_NETWORK` and routes to the container's internal port `8080`.

If Dockhand only accepts one Compose file path, either configure it to include
both Compose files or copy the labels and `proxy` network block from
`docker-compose.traefik.yml` into a Dockhand-specific Compose file in your
deployment branch.

## Updating

After pulling new code:

```sh
docker compose build app
docker compose run --rm app npm run db:migrate
docker compose up -d
```

For Dockhand/network deployments, include the network overlay in each command:

```sh
docker compose -f docker-compose.yml -f docker-compose.network.yml build app
docker compose -f docker-compose.yml -f docker-compose.network.yml run --rm app npm run db:migrate
docker compose -f docker-compose.yml -f docker-compose.network.yml up -d
```

## Troubleshooting

### Migration connects to 127.0.0.1 or ::1

If `npm run db:migrate` fails with `ECONNREFUSED 127.0.0.1:3306` or
`ECONNREFUSED ::1:3306`, the app container is trying to connect to MySQL on
itself. Set `DB_WEB_HOST` to a host that is reachable from inside the container:

- MySQL is another Compose service on the same Docker network: use that service
  name, commonly `mysql`.
- MySQL is installed on the Docker host: use `host.docker.internal`, and make
  sure MySQL listens on an address reachable from Docker, not only
  `127.0.0.1`.
- MySQL is on another machine: use that machine's DNS name or IP address.

Check what Compose is passing into the container:

```sh
docker compose config | grep DB_WEB_HOST
```

You can override just the migration run while testing:

```sh
docker compose run --rm -e DB_WEB_HOST=mysql app npm run db:migrate
```

### Migration says access denied for `azweb`

If the migration reaches MySQL but fails with `ER_ACCESS_DENIED_ERROR`, verify
the web database user and password. The error message includes the host MySQL
matched, for example `azweb`@`ip-172-20-0-2...`. The simplest Docker-friendly
grant is `azweb`@`%`:

```sql
CREATE DATABASE IF NOT EXISTS azweb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'azweb'@'%' IDENTIFIED BY 'change-me';
ALTER USER 'azweb'@'%' IDENTIFIED BY 'change-me';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX, ALTER ON azweb.* TO 'azweb'@'%';
FLUSH PRIVILEGES;
```

Then make sure Compose is passing the same password:

```sh
docker compose config | grep -E 'DB_WEB_(HOST|DATABASE|USERNAME|PASSWORD)'
```

If your MySQL server also has a more specific `azweb` host entry with a
different password, MySQL may choose that instead of `azweb`@`%`. Inspect the
matching users:

```sql
SELECT user, host FROM mysql.user WHERE user = 'azweb';
SHOW GRANTS FOR 'azweb'@'%';
```

### Browser cannot reach `host:8080`

If the container is healthy but the browser shows `ERR_CONNECTION_REFUSED`,
inspect the port mapping. A mapping like this is loopback-only:

```text
127.0.0.1:8080 -> 8080/tcp
```

That is reachable from the Docker host itself, but not from another computer.
For direct remote access on port 8080, set:

```env
HTTP_BIND=0.0.0.0
HTTP_PORT=8080
```

Then recreate the container because port bindings are applied at container
creation:

```sh
docker compose up -d --force-recreate app
```

Also make sure the host firewall or cloud security group allows inbound TCP
8080.

If Traefik is handling public traffic, keep `HTTP_BIND=127.0.0.1` or remove
direct public exposure, attach the app to the Traefik network, and browse via
the Traefik hostname instead of `:8080`.

### Dashboard says character data is unavailable

If login succeeds but `/dashboard` logs
`ER_DBACCESS_DENIED_ERROR` for `acore_characters`, the app can read the auth
database but the configured characters database user lacks access to the
characters database. Grant read access to the user in `DB_CHAR_USERNAME`:

```sql
GRANT SELECT ON acore_characters.* TO 'azweb_ro'@'%';
FLUSH PRIVILEGES;
```

If you are temporarily reusing the built-in AzerothCore `acore` account from a
container, that user also needs a Docker-reachable host grant:

```sql
CREATE USER IF NOT EXISTS 'acore'@'%' IDENTIFIED BY 'same-password';
GRANT SELECT ON acore_auth.* TO 'acore'@'%';
GRANT SELECT ON acore_characters.* TO 'acore'@'%';
FLUSH PRIVILEGES;
```

Prefer a dedicated read-only user such as `azweb_ro` for production, and set
`DB_CHAR_USERNAME` / `DB_CHAR_PASSWORD` to that user.

## Operational Notes

- `/setup` generates SQL and `.env` snippets in the browser. It does not save
  secrets or write configuration files.
- `/admin` requires a logged-in account with an AzerothCore `account_access`
  `gmlevel` greater than or equal to `ADMIN_MIN_GMLEVEL`. AzerothCore documents
  level 3 as `SEC_ADMINISTRATOR`; use `ADMIN_REALM_ID=-1` for the global staff
  grant.
- Redis is not required. Web sessions are stored in the `sessions` table created
  by `npm run db:migrate` in `DB_WEB_DATABASE`.
- The app migration creates app-owned tables only. It does not change any
  existing AzerothCore table.
- The app does not create AzerothCore's base tables or databases. Run
  AzerothCore's own database setup before running this app.
- `/api/health` verifies that the web process is responding. Use
  `/api/health?deep=1` when you also want to check web, auth, and characters
  database connectivity.
- Registration writes to the AzerothCore `account` table. Keep registration
  disabled with `WOW_REGISTRATION_ENABLED=false` until the database user and
  public session settings are ready.
- Email addresses are used only for account uniqueness and display. The app
  does not send SMTP traffic or perform email verification.
