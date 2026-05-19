import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not defined");
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false });

async function clearUsers() {
  console.log("正在清空用户数据...");

  // 按外键依赖顺序清空：先子表，再主表
  await sql`DELETE FROM "email_recall_logs"`;
  console.log("✓ email_recall_logs 表已清空");

  await sql`DELETE FROM "files"`;
  console.log("✓ files 表已清空");

  await sql`DELETE FROM "messages"`;
  console.log("✓ messages 表已清空");

  await sql`DELETE FROM "user_memories"`;
  console.log("✓ user_memories 表已清空");

  await sql`DELETE FROM "character_memories"`;
  console.log("✓ character_memories 表已清空");

  await sql`DELETE FROM "user_character_relationships"`;
  console.log("✓ user_character_relationships 表已清空");

  await sql`DELETE FROM "user_profiles"`;
  console.log("✓ user_profiles 表已清空");

  await sql`DELETE FROM "session"`;
  console.log("✓ session 表已清空");

  await sql`DELETE FROM "account"`;
  console.log("✓ account 表已清空");

  await sql`DELETE FROM "verification"`;
  console.log("✓ verification 表已清空");

  await sql`DELETE FROM "user"`;
  console.log("✓ user 表已清空");

  console.log("\n所有用户数据已清空完成！");
  await sql.end();
}

clearUsers().catch((err) => {
  console.error("清空失败:", err);
  process.exit(1);
});
