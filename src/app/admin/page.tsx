import { notFound, redirect } from "next/navigation";
import { accountSecurityLevel, isAdminAccount } from "@/server/admin/access";
import { adminStats } from "@/server/admin/stats";
import { env } from "@/server/config/env";
import { wowConfig } from "@/server/config/wow";
import { currentSession } from "@/server/session/database";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await currentSession();
  if (!session) redirect("/login");
  if (!(await isAdminAccount(session.user.id))) notFound();

  const gmlevel = await accountSecurityLevel(session.user.id);
  const stats = await adminStats();

  return (
    <main className="dashboard-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Operations</h1>
          <p>
            Signed in as {session.user.username}. GM level {gmlevel}.
          </p>
        </div>
        <a className="admin-link-button" href="/setup">
          Setup guide
        </a>
      </section>

      <section className="dashboard-section">
        <h2>Service Status</h2>
        <div className="status-grid compact">
          {stats.databases.map((database) => (
            <article key={database.label}>
              <span>{database.label}</span>
              <strong>{database.available ? "Reachable" : "Unavailable"}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Realm Snapshot</h2>
        <div className="status-grid compact">
          {stats.counts.map((stat) => (
            <article key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.available ? stat.value : "Unavailable"}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Feature Gates</h2>
        <div className="config-list">
          <div>
            <span>Registration</span>
            <strong>{wowConfig.registrationEnabled ? "Enabled" : "Disabled"}</strong>
          </div>
          <div>
            <span>Community pages</span>
            <strong>{wowConfig.communityPublic ? "Public" : "Private"}</strong>
          </div>
          <div>
            <span>Secure session cookies</span>
            <strong>{env.SESSION_SECURE_COOKIE ? "Enabled" : "Disabled"}</strong>
          </div>
          <div>
            <span>Minimum admin GM level</span>
            <strong>{env.ADMIN_MIN_GMLEVEL}</strong>
          </div>
          <div>
            <span>Admin realm scope</span>
            <strong>{env.ADMIN_REALM_ID === -1 ? "All realms" : env.ADMIN_REALM_ID}</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
