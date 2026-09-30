import { webDb } from "@/server/db/connections";
import { up } from "@/server/db/migrations/001_auth_web_tables";

await up(webDb);
await webDb.destroy();

console.log("Database migrations completed.");
