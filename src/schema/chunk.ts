import {
  index,
  integer,
  pgTable,
  text,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import { documents } from "./document";

// One document → many chunks.
// Each chunk has its own embedding vector.
// Gemini text-embedding-004 = 768 dimensions.

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 768 }),
    chunkIndex: integer("chunk_index").notNull(),
    pageNumber: integer("page_number"),
  },
  (table) => [
    index("chunk_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);
