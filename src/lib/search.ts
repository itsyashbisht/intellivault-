import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { db } from "./db-config";
import { documents } from "@/lib/db-schema";
import { generateEmbedding } from "@/lib/embedding";

export async function searchDocuments(
  query: string,
  limit: number = 5,
  threshold: number = 0.5,
) {
  const embedding = await generateEmbedding(query);

  // CosineDistance - measures dissimilarities b/w embeddings, and we need similarities so 1 - (cosineDistance) thing.
  const similarity = sql<number>`1 - (${cosineDistance(
    documents.embedding,
    embedding,
  )})`;

  const similarDocuments = await db
    .select({
      id: documents.id,
      content: documents.content,
      similarity: similarity,
    })
    .from(documents)
    .where(gt(similarity, threshold))
    .orderBy(desc(similarity))
    .limit(limit);

  return similarDocuments;
}
