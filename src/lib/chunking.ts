import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000, // Chunks are around 1000 char.
  chunkOverlap: 200, // Consecutive chunks will share around 200 characters on boundaries, this helps us to maintain context between consecutive chunks.
  separators: ["\n\n", "\n", " ", ""],
});

// This will return array of string (each str is a chunk)
export async function chunkContent(content: string) {
  return await textSplitter.splitText(content.trim());
}
