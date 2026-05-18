import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const characters = pgTable("characters", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  shortLabel: varchar("short_label", { length: 100 }).notNull(),
  occupation: varchar("occupation", { length: 100 }).notNull(),
  introText: text("intro_text").notNull(),
  homepageText: text("homepage_text").notNull(),
  selectionText: text("selection_text").notNull(),
  introCardText: text("intro_card_text").notNull(),
  basePrompt: text("base_prompt").notNull(),
  ttsProvider: varchar("tts_provider", { length: 100 }),
  ttsVoiceId: varchar("tts_voice_id", { length: 255 }),
  voiceStyle: varchar("voice_style", { length: 100 }),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
