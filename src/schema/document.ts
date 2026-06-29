import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { workspaces } from "@/schema/workspace";
import { documentStatusEnum } from "./enums";

// Stores metadata only. Actual text content lives in chunks.
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  uploadedBy: text("uploaded_by").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 20 }).notNull(),
  fileSize: integer("file_size").notNull(),
  status: documentStatusEnum("status").notNull().default("processing"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
