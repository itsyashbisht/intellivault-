import { and, cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "./db-config";
import { chunks, documents } from "@/schema";
import { generateEmbedding } from "@/lib/embedding";

/*
  SEARCH PIPELINE
  1. Embed the user's query into a 768-dim vector (same space as stored chunks)
  2. Join chunks → documents to access workspace_id for tenant isolation
  3. Filter by workspace + similarity threshold (ignore irrelevant chunks)
  4. Rank by similarity descending (most relevant first)
  5. Return top-K chunks with just the fields needed for RAG context + citations
*/

export async function searchDocuments(
  query: string,
  topK: number = 5,
  workspaceId: string,
  threshold: number = 0.65,
) {
  // 1. Embedd the user query.
  const queryEmbedding = await generateEmbedding(query);

  // 2. Define similarity expression
  const similarity = sql<number>`1 - (${cosineDistance(
    chunks.embedding,
    queryEmbedding,
  )})`;

  // 3. Query: filter → rank → limit
  // We join chunks → documents because workspace_id lives on documents,
  // not chunks. This is the tenant isolation boundary — we never search
  // across workspaces.

  const results = await db
    .select({
      // Chunk fields — needed for RAG context assembly
      chunkId: chunks.id,
      content: chunks.content,
      chunkIndex: chunks.chunkIndex,

      // Document fields — needed for citation UI ("Source: filename.pdf")
      documentId: documents.id,
      documentName: documents.name,

      // Similarity score — useful for debugging retrieval quality
      similarity,
    })
    .from(chunks)
    .innerJoin(documents, eq(documents.id, chunks.documentId))
    .where(
      and(eq(documents.workspaceId, workspaceId), gt(similarity, threshold)),
    )
    // Most similar chunks first
    .orderBy(desc(similarity))
    .limit(topK);

  return results;
}

export type SearchResult = Awaited<ReturnType<typeof searchDocuments>>[number];
