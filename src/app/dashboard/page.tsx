import { redirect } from "next/navigation";
import { isDatabaseConnectionError } from "@/server/auth/identity";
import { charactersForAccount } from "@/server/game/characters";
import { formatPlayed } from "@/server/game/wow";
import { currentSession, sessionsForUser } from "@/server/session/database";

export default async function DashboardPage() {
  const session = await currentSession();
  if (!session) redirect("/login");

  let characterLookup: { ok: true; characters: Awaited<ReturnType<typeof charactersForAccount>> } | { ok: false; characters: [] };

  try {
    characterLookup = { ok: true, characters: await charactersForAccount(session.user.id) };
  } catch (error) {
    if (!isDatabaseConnectionError(error)) throw error;

    console.error("Dashboard character lookup failed because the characters database is unavailable or rejected access.", error);
    characterLookup = { ok: false, characters: [] };
  }

  const sessions = await sessionsForUser(session.user.id);

  return (
    <main className="dashboard-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Account</p>
          <h1>{session.user.username}</h1>
          <p>{session.user.email}</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button type="submit">Sign out</button>
        </form>
      </section>

      <section className="dashboard-section">
        <h2>Characters</h2>
        {!characterLookup.ok ? (
          <p className="dashboard-warning">
            Character data is temporarily unavailable. Check that the configured characters database user has SELECT access to the
            AzerothCore characters database.
          </p>
        ) : characterLookup.characters.length > 0 ? (
          <div className="character-list">
            {characterLookup.characters.map((character) => {
              const played = formatPlayed(character.totaltime);

              return (
                <article key={character.guid}>
                  <div>
                    <strong>{character.name}</strong>
                    <span>
                      Level {character.level} {character.raceName} {character.className}
                    </span>
                  </div>
                  <dl>
                    <div>
                      <dt>Status</dt>
                      <dd>{character.online ? "Online" : "Offline"}</dd>
                    </div>
                    <div>
                      <dt>Faction</dt>
                      <dd>{character.faction}</dd>
                    </div>
                    <div>
                      <dt>Played</dt>
                      <dd>
                        {played.days}d {played.hours}h {played.minutes}m
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        ) : (
          <p>No characters were found for this account.</p>
        )}
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2>Web Sessions</h2>
          {sessions.length > 1 ? (
            <form action="/api/auth/sessions/revoke-others" method="post">
              <button type="submit">Revoke others</button>
            </form>
          ) : null}
        </div>
        <div className="session-list">
          {sessions.map((webSession) => (
            <article key={webSession.id}>
              <div>
                <strong>{webSession.id === session.id ? "Current session" : "Other session"}</strong>
                <span>{webSession.ip_address ?? "Unknown IP"}</span>
              </div>
              <div>
                <span>{webSession.user_agent ?? "Unknown browser"}</span>
                <time dateTime={new Date(webSession.last_activity * 1000).toISOString()}>
                  Last active {new Date(webSession.last_activity * 1000).toLocaleString()}
                </time>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
