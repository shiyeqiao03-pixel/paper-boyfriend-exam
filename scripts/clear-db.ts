import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

async function main() {
  const client = postgres(DATABASE_URL!, { max: 1 });

  console.log("正在清空用户相关数据...");

  await client`
    TRUNCATE TABLE
      messages,
      user_memories,
      user_character_relationships,
      "session",
      account,
      user_profiles,
      "user",
      verification
    CASCADE;
  `;

  console.log("✅ 已清空所有用户数据");

  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("清空失败:", err);
  process.exit(1);
});
