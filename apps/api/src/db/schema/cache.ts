import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { userTable } from "./auth";

export const recipeCacheTable = pgTable("recipe_cache", {
  id: uuid("id").defaultRandom().primaryKey(),
  searchTerm: varchar("search_term", { length: 255 }).notNull().unique(),
  imageUrl: text("image_url"),
  nutrition: jsonb("nutrition").$type<Record<string, number>>(),
  cuisine: varchar("cuisine", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mealCacheTable = pgTable("meal_cache", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => userTable.id, { onDelete: "cascade" })
    .notNull(),
  contextHash: varchar("context_hash", { length: 64 }).notNull(),
  meals: jsonb("meals").$type<unknown[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
