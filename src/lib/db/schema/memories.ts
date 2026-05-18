import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  real,
  timestamp,
} from "drizzle-orm/pg-core";
import { characters } from "./characters";

export const userMemories = pgTable("user_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  memoryType: varchar("memory_type", { length: 100 }).notNull(),
  content: text("content").notNull(),
  importance: integer("importance").notNull(),
  confidence: real("confidence").notNull(),
  sourceMessageId: uuid("source_message_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const characterMemories = pgTable("character_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  characterId: uuid("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  memoryType: varchar("memory_type", { length: 100 }).notNull(),
  content: text("content").notNull(),
  importance: integer("importance").notNull(),
  confidence: real("confidence").notNull(),
  sourceMessageId: uuid("source_message_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
