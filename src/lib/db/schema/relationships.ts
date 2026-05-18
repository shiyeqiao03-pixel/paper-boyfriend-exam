import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { characters } from "./characters";

export const userCharacterRelationships = pgTable(
  "user_character_relationships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    affinityScore: integer("affinity_score").notNull().default(40),
    relationshipStage: varchar("relationship_stage", { length: 50 })
      .notNull()
      .default("初识"),
    introSeen: boolean("intro_seen").notNull().default(false),
    lastChatAt: timestamp("last_chat_at", { withTimezone: true }),
    messageCount: integer("message_count").notNull().default(0),
    dailyImageCount: integer("daily_image_count").notNull().default(0),
    dailyVoiceCount: integer("daily_voice_count").notNull().default(0),
    dailyUploadImageCount: integer("daily_upload_image_count")
      .notNull()
      .default(0),
    dailyUploadVoiceCount: integer("daily_upload_voice_count")
      .notNull()
      .default(0),
    dailyResetDate: timestamp("daily_reset_date", { withTimezone: true }),
    lastAffinityUpdatedAt: timestamp("last_affinity_updated_at", {
      withTimezone: true,
    }),
    lastDecayAt: timestamp("last_decay_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }
);
