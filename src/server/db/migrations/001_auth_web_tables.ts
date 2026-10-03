import { sql, type Kysely } from "kysely";
import type { WebDatabase } from "../schema";

async function createIndexIfMissing(
  db: Kysely<WebDatabase>,
  tableName: string,
  indexName: string,
  createIndex: () => Promise<void>
): Promise<void> {
  const result = await sql<{ count: number | string }>`
    select count(*) as count
    from information_schema.statistics
    where table_schema = database()
      and table_name = ${tableName}
      and index_name = ${indexName}
  `.execute(db);

  if (Number(result.rows[0]?.count ?? 0) === 0) {
    await createIndex();
  }
}

export async function up(db: Kysely<WebDatabase>): Promise<void> {
  await db.schema
    .createTable("account_profiles")
    .ifNotExists()
    .addColumn("account_id", "integer", (col) => col.unsigned().primaryKey())
    .addColumn("remember_token", "varchar(100)")
    .addColumn("deactivated_at", "timestamp")
    .addColumn("deactivation_ban_date", "integer", (col) => col.unsigned())
    .execute();

  await db.schema
    .createTable("account_operations")
    .ifNotExists()
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("account_id", "integer", (col) => col.unsigned().notNull())
    .addColumn("realm_id", "integer", (col) => col.unsigned())
    .addColumn("character_guid", "integer", (col) => col.unsigned())
    .addColumn("character_name", "varchar(48)")
    .addColumn("action", "varchar(24)", (col) => col.notNull())
    .addColumn("status", "varchar(16)", (col) => col.notNull().defaultTo("completed"))
    .addColumn("context", "json")
    .addColumn("created_at", "timestamp", (col) => col.notNull())
    .addColumn("updated_at", "timestamp", (col) => col.notNull())
    .execute();

  await createIndexIfMissing(db, "account_operations", "account_operations_account_created_idx", () =>
    db.schema
      .createIndex("account_operations_account_created_idx")
      .on("account_operations")
      .columns(["account_id", "created_at"])
      .execute()
  );

  await createIndexIfMissing(db, "account_operations", "account_operations_character_idx", () =>
    db.schema
      .createIndex("account_operations_character_idx")
      .on("account_operations")
      .columns(["realm_id", "character_guid"])
      .execute()
  );

  await db.schema
    .createTable("sessions")
    .ifNotExists()
    .addColumn("id", "varchar(255)", (col) => col.primaryKey())
    .addColumn("user_id", "integer", (col) => col.unsigned())
    .addColumn("ip_address", "varchar(45)")
    .addColumn("user_agent", "text")
    .addColumn("payload", sql`longtext`, (col) => col.notNull())
    .addColumn("last_activity", "integer", (col) => col.notNull())
    .execute();

  await createIndexIfMissing(db, "sessions", "sessions_user_id_idx", () =>
    db.schema.createIndex("sessions_user_id_idx").on("sessions").column("user_id").execute()
  );
  await createIndexIfMissing(db, "sessions", "sessions_last_activity_idx", () =>
    db.schema.createIndex("sessions_last_activity_idx").on("sessions").column("last_activity").execute()
  );
}

export async function down(db: Kysely<WebDatabase>): Promise<void> {
  await db.schema.dropTable("sessions").ifExists().execute();
  await db.schema.dropTable("account_operations").ifExists().execute();
  await db.schema.dropTable("account_profiles").ifExists().execute();
}
