import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "fs";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

async function tableExists(tableName: string): Promise<boolean> {
  const result = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${tableName}
    )
  `;
  return result[0]?.exists === true;
}

async function main() {
  // Drop old users table if exists (legacy, not used by Better Auth)
  await sql`DROP TABLE IF EXISTS users CASCADE`;
  console.log("Dropped old users table");

  const migrationSql = readFileSync("./drizzle/0000_fuzzy_hiroim.sql", "utf-8");
  const statements = migrationSql.split("--> statement-breakpoint");

  for (const statement of statements) {
    const trimmed = statement.trim();
    if (!trimmed) continue;

    // Skip CREATE TABLE for existing tables
    const tableMatch = trimmed.match(/CREATE TABLE\s+"([^"]+)"/i);
    if (tableMatch) {
      const tableName = tableMatch[1];
      if (await tableExists(tableName)) {
        console.log(`Skipping "${tableName}": already exists`);
        continue;
      }
    }

    console.log("Executing:", trimmed.substring(0, 60) + "...");
    try {
      await sql.unsafe(trimmed);
    } catch (err: any) {
      // Skip "already exists" errors (table or constraint)
      if (err.code === "42P07" || err.code === "42710") {
        console.log("Already exists, skipping");
        continue;
      }
      throw err;
    }
  }

  console.log("Migration applied successfully!");
  await sql.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
