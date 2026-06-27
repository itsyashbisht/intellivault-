"use server";

// import pdf from "pdf-parse";
import { extractText } from "unpdf";
import { db } from "@/lib/db-config";
import { documents } from "@/lib/db-schema";
import { generateEmbeddings } from "@/lib/embedding";
import { chunkContent } from "@/lib/chunking";

export async function procesPDfFile(formData: FormData) {
  try {
    const file = formData.get("pdf") as File;
    console.log(file);
    // Convert File to Buffer and extract text
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);
    const { text } = await extractText(buffer);
    console.log(text);

    const fullText = text.join("\n\n");

    if (!fullText || fullText.trim().length === 0) {
      return {
        success: false,
        error: "No text found in PDF file",
      };
    }

    // Creating Chunks -> then embeddings
    const chunks: string[] = await chunkContent(fullText);
    const embeddings = await generateEmbeddings(chunks);

    // Records for DB
    const records = chunks.map((chunks, index) => ({
      content: chunks,
      embedding: embeddings[index],
    }));

    // DB call.
    await db.insert(documents).values(records);

    return {
      success: true,
      message: `Created ${records.length} searchable chunks`,
    };
  } catch (error) {
    console.error("Error processing PDF file: ", error);
    return {
      success: false,
      error: "Failed to process PDF file",
    };
  }
}
