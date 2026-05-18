import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDb() {
  if (dbInstance) return dbInstance;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }

  // 防止热重载时创建多个连接
  const globalForDb = globalThis as unknown as {
    conn: postgres.Sql | undefined;
  };

  const conn =
    globalForDb.conn ?? postgres(connectionString, { prepare: false });
  if (process.env.NODE_ENV !== "production") globalForDb.conn = conn;

  dbInstance = drizzle(conn, { schema });
  return dbInstance;
}

// 导出 proxy 对象，延迟初始化
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return getDb()[prop as keyof typeof dbInstance];
  },
});
