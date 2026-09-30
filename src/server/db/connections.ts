import "server-only";
import { Kysely, MysqlDialect } from "kysely";
import mysql from "mysql2";
import { env } from "@/server/config/env";
import type { AuthDatabase, CharacterDatabase, WebDatabase } from "./schema";

function createPool(config: {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}) {
  return mysql.createPool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    timezone: "Z"
  });
}

const globalForDb = globalThis as unknown as {
  authDb?: Kysely<AuthDatabase>;
  webDb?: Kysely<WebDatabase>;
  charactersDb?: Kysely<CharacterDatabase>;
};

export const authDb =
  globalForDb.authDb ??
  new Kysely<AuthDatabase>({
    dialect: new MysqlDialect({
      pool: createPool({
        host: env.DB_AUTH_HOST,
        port: env.DB_AUTH_PORT,
        database: env.DB_AUTH_DATABASE,
        user: env.DB_AUTH_USERNAME,
        password: env.DB_AUTH_PASSWORD
      })
    })
  });

export const webDb =
  globalForDb.webDb ??
  new Kysely<WebDatabase>({
    dialect: new MysqlDialect({
      pool: createPool({
        host: env.DB_WEB_HOST,
        port: env.DB_WEB_PORT,
        database: env.DB_WEB_DATABASE,
        user: env.DB_WEB_USERNAME,
        password: env.DB_WEB_PASSWORD
      })
    })
  });

export const charactersDb =
  globalForDb.charactersDb ??
  new Kysely<CharacterDatabase>({
    dialect: new MysqlDialect({
      pool: createPool({
        host: env.DB_CHAR_HOST,
        port: env.DB_CHAR_PORT,
        database: env.DB_CHAR_DATABASE,
        user: env.DB_CHAR_USERNAME,
        password: env.DB_CHAR_PASSWORD
      })
    })
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.authDb = authDb;
  globalForDb.webDb = webDb;
  globalForDb.charactersDb = charactersDb;
}
