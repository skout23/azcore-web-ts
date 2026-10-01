import { Activity, Download, Server } from "lucide-react";
import { charactersDb } from "@/server/db/connections";
import { env } from "@/server/config/env";
import { realmName, wowConfig } from "@/server/config/wow";

export const dynamic = "force-dynamic";

async function getRealmStatus() {
  try {
    const online = await charactersDb
      .selectFrom("characters")
      .select(({ fn }) => fn.count<number>("guid").as("count"))
      .where("online", "=", 1)
      .executeTakeFirst();

    return { available: true, onlineCount: Number(online?.count ?? 0) };
  } catch {
    return { available: false, onlineCount: 0 };
  }
}

export default async function HomePage() {
  const status = await getRealmStatus();

  return (
    <main className="home-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">{wowConfig.expansion}</p>
          <h1>{realmName()}</h1>
          <p>{env.SITE_DESCRIPTION ?? "Account management, community browsing, and character armory for AzerothCore WotLK realms."}</p>
          <div className="hero-actions">
            {!env.APP_SECRET ? <a href="/setup">Complete setup</a> : null}
            <a href="/register">Create account</a>
            <a className="secondary" href="/login">Sign in</a>
          </div>
        </div>
      </section>

      <section className="status-grid" aria-label="Realm status">
        <article>
          <Server />
          <span>Realm</span>
          <strong>{status.available ? "Online" : "Unavailable"}</strong>
        </article>
        <article>
          <Activity />
          <span>Players online</span>
          <strong>{status.onlineCount}</strong>
        </article>
        <article>
          <Download />
          <span>Realmlist</span>
          <strong>{wowConfig.realmlist}</strong>
        </article>
      </section>

      <section className="rates">
        <h2>Realm Rates</h2>
        <dl>
          {Object.entries(wowConfig.rates).map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
