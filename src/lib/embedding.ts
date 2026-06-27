import { embed, embedMany } from "ai";
import { google } from "@ai-sdk/google";

export async function generateEmbedding(text: string) {
  const input = text.replace("\n", " ");

  const { embedding } = await embed({
    model: google.embedding("gemini-embedding-001"),
    value: input,
    providerOptions: {
      google: {
        outputDimensionality: 1536,
      },
    },
  });

  return embedding;
}

export async function generateEmbeddings(texts: string[]) {
  const inputs = texts.map((text) => text.replace("\n", " "));

  const { embeddings } = await embedMany({
    model: google.embedding("gemini-embedding-001"),
    values: inputs,
    providerOptions: {
      google: {
        outputDimensionality: 1536,
      },
    },
  });

  return embeddings;
}
