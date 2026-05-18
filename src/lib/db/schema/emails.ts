import {
  pgTable,
  uuid,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { characters } from "./characters";

export const emailRecallLogs = pgTable("email_recall_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  targetCharacterId: uuid("target_character_id").references(
    () => characters.id,
    { onDelete: "set null" }
  ),
  emailType: varchar("email_type", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
