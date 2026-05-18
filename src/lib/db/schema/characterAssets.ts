import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { characters } from "./characters";

export const characterAssets = pgTable("character_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  characterId: uuid("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  fileId: uuid("file_id").notNull(),
  assetType: varchar("asset_type", { length: 50 }).notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
