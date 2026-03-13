import { pgTable, real, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { userTable } from "./auth";

export const pantryTable = pgTable("pantry", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => userTable.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  confidence: real("confidence"),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
});
