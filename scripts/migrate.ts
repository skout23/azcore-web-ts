import { Kysely, MysqlDialect } from "kysely";
import mysql from "mysql2";
import { up } from "@/server/db/migrations/001_auth_web_tables";
import type { WebDatabase } from "@/server/db/schema";

const config = {
  host: process.env.DB_WEB_HOST ?? "host.docker.internal",
  port: Number(process.env.DB_WEB_PORT ?? 3306),
  database: process.env.DB_WEB_DATABASE ?? "azweb",
  user: process.env.DB_WEB_USERNAME ?? "azweb",
  password: process.env.DB_WEB_PASSWORD ?? ""
};

const webDb = new Kysely<WebDatabase>({
  dialect: new MysqlDialect({
    pool: mysql.createPool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      waitForConnections: true,
      connectionLimit: 1,
      namedPlaceholders: true,
      timezone: "Z"
    })
  })
});

try {
  console.log(`Running web migrations against ${config.user}@${config.host}:${config.port}/${config.database}`);
  await up(webDb);
  console.log("Database migrations completed.");
} catch (error) {
  console.error(`Database migration failed for ${config.user}@${config.host}:${config.port}/${config.database}.`);
  if (error && typeof error === "object" && "code" in error && error.code === "ER_ACCESS_DENIED_ERROR") {
    console.error("MySQL rejected the DB_WEB_USERNAME/DB_WEB_PASSWORD credentials.");
    console.error("Create or update the MySQL user for the host MySQL sees from Docker, usually 'user'@'%'.");
  } else {
    console.error("If this ran in Docker, DB_WEB_HOST must be reachable from inside the app container.");
    console.error("Use the MySQL service name on a shared Docker network, or host.docker.internal for host MySQL.");
  }
  throw error;
} finally {
  await webDb.destroy();
}
