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
