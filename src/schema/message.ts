// sourceChunkIds: array of chunk UUIDs used to generate this response.
// Only populated on assistant messages — powers the citation UI.

import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { chatSessions } from "./chatSessions";
import { messageRoleEnum } from "./enums";

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  sourceChunkIds: jsonb("source_chunk_ids").$type<string[]>(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
