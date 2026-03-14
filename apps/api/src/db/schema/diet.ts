import {
  integer,
  jsonb,
  pgTable,
  real,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { userTable } from "./auth";

export const dietaryProfilesTable = pgTable("dietary_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => userTable.id, { onDelete: "cascade" })
    .notNull(),
  calorieTarget: integer("calorie_target"),
  proteinTarget: real("protein_target"),
  dietType: varchar("diet_type", { length: 20 }).default("none"),
  cuisinePreferences: jsonb("cuisine_preferences")
    .$type<string[]>()
    .default([]),
  gender: varchar("gender", { length: 10 }),
  age: integer("age"),
  weight: real("weight"),
});

export const deficienciesTable = pgTable("deficiencies", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => userTable.id, { onDelete: "cascade" })
    .notNull(),
  nutrient: varchar("nutrient", { length: 255 }).notNull(),
  severity: varchar("severity", { length: 50 }),
});
