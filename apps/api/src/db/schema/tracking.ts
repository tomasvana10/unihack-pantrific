import { pgTable, real, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { userTable } from "./auth";

export const trackedNutrientsTable = pgTable("tracked_nutrients", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => userTable.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  dailyTarget: real("daily_target").notNull(),
});

export const intakeLogsTable = pgTable("intake_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => userTable.id, { onDelete: "cascade" })
    .notNull(),
  trackedNutrientId: uuid("tracked_nutrient_id")
    .references(() => trackedNutrientsTable.id, { onDelete: "cascade" })
    .notNull(),
  amount: real("amount").notNull(),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
});
