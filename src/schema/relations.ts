import { relations } from "drizzle-orm";
import { workspaces } from "@/schema/workspace";
import { workspaceMembers } from "@/schema/workspaceMember";
import { workspaceInvites } from "@/schema/workspaceInvites";
import { documents } from "@/schema/document";
import { chatSessions } from "@/schema/chatSessions";
import { activityLogs } from "@/schema/activityLog";
import { chunks } from "@/schema/chunk";
import { messages } from "@/schema/message";

// Relations
export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  invites: many(workspaceInvites),
  documents: many(documents),
  chatSessions: many(chatSessions),
  activityLogs: many(activityLogs),
}));

export const workspaceMembersRelations = relations(
  workspaceMembers,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceMembers.workspaceId],
      references: [workspaces.id],
    }),
  }),
);

export const workspaceInvitesRelations = relations(
  workspaceInvites,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceInvites.workspaceId],
      references: [workspaces.id],
    }),
  }),
);

export const documentsRelations = relations(documents, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [documents.workspaceId],
    references: [workspaces.id],
  }),
  chunks: many(chunks),
}));

export const chunksRelations = relations(chunks, ({ one }) => ({
  document: one(documents, {
    fields: [chunks.documentId],
    references: [documents.id],
  }),
}));

export const chatSessionsRelations = relations(
  chatSessions,
  ({ one, many }) => ({
    workspace: one(workspaces, {
      fields: [chatSessions.workspaceId],
      references: [workspaces.id],
    }),
    messages: many(messages),
  }),
);

export const messagesRelations = relations(messages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [messages.sessionId],
    references: [chatSessions.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [activityLogs.workspaceId],
    references: [workspaces.id],
  }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────
// User type comes from Clerk — import it where needed:
// import { User } from "@clerk/nextjs/server"

export type Workspace = typeof workspaces.$inferSelect;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type WorkspaceInvite = typeof workspaceInvites.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Chunk = typeof chunks.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;

export type InsertWorkspace = typeof workspaces.$inferInsert;
export type InsertDocument = typeof documents.$inferInsert;
export type InsertChunk = typeof chunks.$inferInsert;
export type InsertMessage = typeof messages.$inferInsert;
