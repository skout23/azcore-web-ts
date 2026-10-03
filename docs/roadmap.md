# Product Roadmap

This guide captures the current state of the AzerothCore web app and proposes
the next slices to build. The main design goal should stay the same: keep
AzerothCore's own databases mostly read-only, keep app-owned state in `azweb`,
and make every write path explicit, auditable, and easy to disable.

## Current Baseline

The project is a solid deployment-ready skeleton:

| Area | Current status |
| --- | --- |
| Docker deployment | Working Compose setup with Dockhand, network, and Traefik notes. |
| Web database | `sessions`, `account_profiles`, and `account_operations` migrations exist in the app-owned web database. |
| AzerothCore auth | SRP6 login and registration are implemented against `acore_auth.account`; registration enforces unique username/email but does not send verification mail. |
| Sessions | Redis has been removed. Sessions are stored in `azweb.sessions`. |
| Admin access | `/admin` is protected by AzerothCore `account_access` GM level. |
| Admin dashboard | Shows database reachability, account/session/character counts, and feature gates. |
| Player dashboard | Shows account profile, web sessions, and character list when the characters database is readable. |
| Public pages | Home page is functional; characters, guilds, auctions, and leaderboard are placeholders. |
| Setup page | Generates `.env` and SQL snippets in-browser, but is too dense and too operationally noisy for normal use. |
| Game data assets | Item, icon, talent, achievement, mount, skill, area, and model-viewer assets are present, but most are not wired into routes yet. |

## Guiding Principles

- Prefer read-only access for `acore_auth`, `acore_characters`, and
  `acore_world` wherever possible.
- Make writes rare, named, logged in `account_operations`, and gated behind env
  flags or GM permissions.
- Use AzerothCore-native concepts for security: `account_access.gmlevel`,
  `RealmID`, account lock/mute/ban state, and SOAP commands where appropriate.
- Avoid changing AzerothCore schemas. Add app-only tables to `azweb` when the
  website needs extra workflow state.
- Keep setup friendly for Dockhand users, but do not bake a specific domain,
  host, or Traefik deployment into app behavior.

## Recommended Next Sequence

### 1. Clean Up Setup And Diagnostics

This should be the next feature because it reduces deployment friction before
more database and admin features add complexity.

Scope:

- Replace the single large `/setup` form with a step-based installer:
  1. Deployment mode: local Docker, Dockhand network, or Traefik.
  2. App settings: `APP_URL`, secret, session cookie settings.
  3. Database connectivity: web/auth/characters/world.
  4. Feature choices: registration, public community pages, character actions.
  5. Generated output: env, SQL grants, and next commands.
- Collapse advanced fields by default.
- Add short "what this controls" helper text for each step.
- Add copy buttons per block and a "show only changed values" mode.
- Add a `/api/setup/check` endpoint that can test configured DB reachability
  without exposing passwords back to the browser.
- Show clear status for common Docker mistakes:
  - host points to `localhost` from inside a container.
  - web DB user cannot create/index tables.
  - auth user can read but not insert while registration is enabled.
  - characters/world read-only user lacks `SELECT`.

Acceptance criteria:

- A new deployer can complete Dockhand setup without reading the full deployment
  doc first.
- The setup page does not show all SQL and env output until the final step.
- Existing `.env`-provided values are reflected as "already configured" where
  safe to show.

### 2. Password Change For Players

This is the highest-value player self-service feature and the implementation is
small because SRP6 verifier generation already exists. It should be an
authenticated password-change flow only; the app is not expected to send email
or provide SMTP-backed account recovery.

Scope:

- Add `/dashboard/security` or a security panel on `/dashboard`.
- Require the current password, new password, and confirmation.
- Re-authenticate the current password before changing anything.
- Generate a new SRP6 `salt` and `verifier`.
- Update only `acore_auth.account.salt` and `acore_auth.account.verifier`.
- Destroy other web sessions after a successful password change.
- Insert an `account_operations` row with action `password`.

Database grants:

```sql
GRANT UPDATE (salt, verifier) ON acore_auth.account TO 'azweb_auth'@'%';
```

Acceptance criteria:

- A player can change their password and immediately log in with the new one.
- The old password no longer works.
- Other web sessions are revoked.
- No other AzerothCore account columns are changed.

### 3. Admin Foundation

Before exposing powerful GM actions, build the admin framework around audit,
permissions, and low-risk read views.

Scope:

- Add admin navigation under `/admin`.
- Add read-only account search:
  - username, email, account id.
  - account status, expansion, locked/muted flags, last login, online state.
  - characters belonging to the account.
- Add read-only character lookup:
  - name/guid/account/race/class/level/zone/online.
  - basic inventory/equipment summary once armory queries land.
- Add an admin operation log view backed by `account_operations`.
- Add a helper for per-action authorization:
  - global min GM level for viewing admin.
  - stricter env-controlled levels for writes.
  - optional realm scoping via `ADMIN_REALM_ID`.

Acceptance criteria:

- Admins can investigate common account/character issues without writing to
  AzerothCore.
- Every admin write feature has a clear planned audit event before it ships.

### 4. Account Admin Actions

These are useful and relatively safe when each write is narrow and logged.

Candidate actions:

| Action | Mechanism | Risk | Notes |
| --- | --- | --- | --- |
| Reset password directly | Update SRP6 columns | High | Admin-only, log actor/account/IP. |
| Lock or unlock account | Update `account.locked` or ban table if used by realm | High | Need to match the server's ban policy. |
| Mute account | Update muting fields or use SOAP command | Medium | Prefer AzerothCore command semantics if available. |
| Force logout/kick | SOAP command | Medium | Needs SOAP credentials and command allowlist. |
| Grant expansion | Update `account.expansion` | Medium | Narrow update, useful for WotLK realms. |

Recommendation:

- Start with read-only admin search and operation log.
- Then add "force logout" through SOAP as the first write-like admin action.
- Add direct DB writes only after the permission/audit framework is proven.

### 5. Character Armory MVP

This is the most visible product feature. Build it in layers.

MVP scope:

- Public `/characters` search with server-side pagination.
- Character detail route, for example `/characters/[guid]` or
  `/characters/[name]`.
- Basic identity:
  - name, race, class, level, faction, guild if available.
  - played time, last logout, current map/zone.
- Equipment panel:
  - read equipped item guids from `character_inventory`.
  - read item instances from `item_instance`.
  - enrich display with checked-in item/icon data.
- Privacy:
  - obey `WOW_COMMUNITY_PUBLIC`.
  - allow logged-in users to see their own characters even when public browsing
    is disabled.

Likely schema additions:

- `CharacterDatabase.character_inventory`
- `CharacterDatabase.item_instance`
- `CharacterDatabase.guild`
- `CharacterDatabase.guild_member`

Acceptance criteria:

- Character pages work with only `SELECT` on `acore_characters`.
- Missing item metadata degrades to item IDs instead of crashing.
- The UI works without the 3D model viewer first.

### 6. Armory Equipment, Inventory, Bank, And Visuals

After the MVP, expand the armory to feel like a real character page.

Scope:

- Equipment slots with icons, quality colors, enchants, gems, and item links.
- Bag and bank tabs:
  - distinguish equipped inventory, bags, bank slots, and bank bags.
  - include empty slot rendering using existing inventory-slot assets.
- Item tooltips:
  - use local item data where possible.
  - optionally link out to configured `WOW_TOOLTIP_URL`.
- Character model:
  - use the existing model-viewer vendor asset only after equipment display IDs
    are correctly decoded.
  - ship this after the equipment data is trustworthy.
- Talents, glyphs, professions, mounts, achievements:
  - many source data files are already present.
  - add these as separate tabs rather than one giant page.

Acceptance criteria:

- Equipment/inventory/bank views are accurate enough for player trust.
- The page remains useful when model assets or display mappings are incomplete.

### 7. Player Character Actions

The app already has action labels and command builders for unstuck, rename, and
customize. These should come after account security and basic armory.

Scope:

- Add action buttons to the logged-in character view.
- Gate each action with existing env flags:
  - `WOW_UNSTUCK_ENABLED`
  - `WOW_RENAME_ENABLED`
  - `WOW_CUSTOMIZE_ENABLED`
- Enforce cooldowns using `account_operations`.
- Execute through SOAP where possible, using an allowlisted command builder.
- For rename/customize, use `at_login` flags only if that is the selected
  server-compatible path.

Acceptance criteria:

- Actions only apply to characters owned by the signed-in account.
- Cooldowns are enforced server-side.
- Every attempt is logged with status and context.

### 8. Community Pages

These can share the same pagination/search patterns as armory.

Recommended order:

1. Leaderboard:
   - online players, top level, played time, achievement points if available.
   - easiest public read-only page.
2. Guilds:
   - guild search, roster, ranks, leader, member count.
3. Auctions:
   - requires world item enrichment and auction schema details.
   - likely more work than leaderboard/guilds.

Acceptance criteria:

- All community pages honor `WOW_COMMUNITY_PUBLIC`.
- Queries are paginated and index-friendly.
- Pages degrade clearly when a required DB grant is missing.

## Database Access Plan

Keep the grants explicit by feature:

| Feature | Database writes needed |
| --- | --- |
| Login | None; reads `acore_auth.account`, writes `azweb.sessions`. |
| Registration | Inserts into `acore_auth.account`, writes `azweb.account_profiles`; email is stored for uniqueness/display only. |
| Password change | Updates only `acore_auth.account.salt` and `verifier`. |
| Admin read views | None outside `azweb.sessions` cleanup and read-only AzerothCore queries. |
| Armory | None; reads `acore_characters` and local game data. |
| Player character actions | Prefer SOAP; writes `azweb.account_operations`. |
| Direct account admin changes | Narrow updates to specific `acore_auth.account` columns, plus audit log. |

## Suggested Milestones

| Milestone | Name | Outcome |
| --- | --- | --- |
| M1 | Setup polish | Cleaner install page, active diagnostics, fewer deployment surprises. |
| M2 | Account security | Player password change, session controls, audit trail. |
| M3 | Admin read console | Staff can search accounts/characters and inspect operation logs. |
| M4 | Armory MVP | Character search and equipment detail using read-only character DB access. |
| M5 | Character actions | Unstuck/rename/customize through audited, gated flows. |
| M6 | Full armory | Inventory, bank, talents, achievements, mounts, and optional model viewer. |
| M7 | Community | Leaderboards, guilds, auctions, and realm browsing. |

## Good First Implementation Tasks

- Split `/setup` into steps and hide generated output until the final step.
- Add a shared `DatabaseStatusPanel` component used by `/setup` and `/admin`.
- Add `changeAccountPassword` to `src/server/auth/accounts.ts`.
- Add `POST /api/account/password` and tests for SRP6 password replacement.
- Extend `CharacterDatabase` with `character_inventory` and `item_instance`.
- Build a read-only character detail query that returns identity plus equipped
  item instance IDs.
- Add `/characters/[guid]` with a plain equipment grid before attempting 3D
  rendering.

## Open Questions

- Which admin actions should be SOAP-only versus direct DB updates?
- Should public armory pages be enabled by default or opt-in only?
- Do you want account-level privacy controls in `azweb.account_profiles`?
- Should the app support multiple realms soon, or keep `REALM_DEFAULT_ID` as
  the only target until the first armory/admin flows are stable?
- Which AzerothCore version/schema variants should be tested against before
  calling armory complete?
