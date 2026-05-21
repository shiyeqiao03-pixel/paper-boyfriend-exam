import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { characters } from "./characters";

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  characterId: uuid("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  senderType: varchar("sender_type", { length: 50 }).notNull(),
  messageType: varchar("message_type", { length: 50 }).notNull(),
  contentText: text("content_text"),
  fileId: uuid("file_id"),
  sttText: text("stt_text"),
  imageDescription: text("image_description"),
  duration: integer("duration"),
  replyGroupId: uuid("reply_group_id"),
  status: varchar("status", { length: 50 }).notNull().default("sent"),
  errorCode: varchar("error_code", { length: 100 }),
  retryCount: integer("retry_count").notNull().default(0),
  memoryProcessStatus: varchar("memory_process_status", { length: 50 })
    .notNull()
    .default("pending"),
  memoryProcessedAt: timestamp("memory_processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
