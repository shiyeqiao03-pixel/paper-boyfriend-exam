import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }),
  characterId: uuid("character_id"),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  sourceType: varchar("source_type", { length: 50 }).notNull(),
  r2Key: varchar("r2_key", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: integer("file_size"),
  durationSeconds: integer("duration_seconds"),
  width: integer("width"),
  height: integer("height"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
