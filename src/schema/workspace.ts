import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

// Join table between users and workspaces.
// Unique constraint ensures one role per user per workspace.

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
