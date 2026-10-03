import { Kysely, MysqlDialect } from "kysely";
import mysql from "mysql2";
import { up } from "@/server/db/migrations/001_auth_web_tables";
import type { WebDatabase } from "@/server/db/schema";

const webDb = new Kysely<WebDatabase>({
  dialect: new MysqlDialect({
    pool: mysql.createPool({
      host: process.env.DB_WEB_HOST ?? "host.docker.internal",
      port: Number(process.env.DB_WEB_PORT ?? 3306),
      database: process.env.DB_WEB_DATABASE ?? "azweb",
      user: process.env.DB_WEB_USERNAME ?? "azweb",
      password: process.env.DB_WEB_PASSWORD ?? "",
      waitForConnections: true,
      connectionLimit: 1,
      namedPlaceholders: true,
      timezone: "Z"
    })
  })
});

await up(webDb);
await webDb.destroy();

console.log("Database migrations completed.");
