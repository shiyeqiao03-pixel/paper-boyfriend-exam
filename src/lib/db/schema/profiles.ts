import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  text,
  integer,
} from "drizzle-orm/pg-core";

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  nickname: varchar("nickname", { length: 100 }).notNull(),
  preferredName: varchar("preferred_name", { length: 100 }).notNull(),
  isAdultConfirmed: boolean("is_adult_confirmed").notNull().default(false),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  lastCharacterId: varchar("last_character_id", { length: 255 }),
  emailRecallEnabled: boolean("email_recall_enabled").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  recallEmailCount: integer("recall_email_count").notNull().default(0),
  emailRecallPaused: boolean("email_recall_paused").notNull().default(false),
  lastRecallEmailSentAt: timestamp("last_recall_email_sent_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
