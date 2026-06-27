import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 150, // Means every chunk is around 150 characters.
  chunkOverlap: 20, // Consecutive chunks will share around 20 characters on boundaries, this helps us to maintain context between them too.
  separators: [" "],
});

// This will return array of string (each str is a chunk)
export async function chunkContent(content: string) {
  return await textSplitter.splitText(content.trim());
}
