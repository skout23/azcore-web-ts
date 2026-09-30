import { redirect } from "next/navigation";
import { charactersForAccount } from "@/server/game/characters";
import { formatPlayed } from "@/server/game/wow";
import { currentSession, sessionsForUser } from "@/server/session/database";

export default async function DashboardPage() {
  const session = await currentSession();
  if (!session) redirect("/login");

  const characters = await charactersForAccount(session.user.id);
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
        {characters.length > 0 ? (
          <div className="character-list">
            {characters.map((character) => {
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
