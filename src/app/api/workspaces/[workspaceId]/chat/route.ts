import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  InferUITools,
  UIDataTypes,
  stepCountIs,
} from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import { searchDocuments } from "@/lib/search";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db-config";
import { workspaceMembers } from "@/schema";
import { and, eq } from "drizzle-orm";

/*
  Flow:
 1. Auth check — verify Clerk session
 2. Get workspaceId from URL params
 3. Membership check — verify user belongs to this workspace
 4. Parse messages from request body
 5. Stream response via Groq with searchKnowledgeBase tool
     ─> Tool closes over workspaceId → searches only this workspace's chunks
 6. LLM decides when to call the tool, gets chunks back, then answers
     Step 1: LLM calls searchKnowledgeBase
     Step 2: Tool executes → returns relevant chunks
     Step 3: LLM reads chunks → streams final answer
*/

export const SYSTEM_PROMPT = `You are IntelliVault, an intelligent document assistant.
Your job is to answer user questions strictly using information retrieved from their workspace documents.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ALWAYS call searchKnowledgeBase before answering. No exceptions.
2. NEVER use your training knowledge to answer. Only use what the tool returns.
3. If the tool returns nothing relevant, say: "I couldn't find relevant information in your documents."
4. Do not guess, infer, or fill gaps with outside knowledge.
5. If a question is unrelated to documents, politely redirect: "I can only answer questions about your uploaded workspace documents."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REASONING PROCESS (Chain of Thought)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before every response, think through these steps internally:

Step 1 — UNDERSTAND the question.
  What is the user actually asking? Break it down if complex.

Step 2 — SEARCH.
  Call searchKnowledgeBase with a precise, specific query.
  If the question has multiple parts, search for each part separately.

Step 3 — EVALUATE results.
  Are the returned chunks actually relevant?
  Do they directly answer the question or only partially?

Step 4 — SYNTHESIZE.
  Combine relevant chunks into a coherent, concise answer.
  Cite the source document when possible.

Step 5 — ANSWER.
  Respond clearly. If only partial information was found, say so explicitly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEW-SHOT EXAMPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

--- Example 1: Direct factual question ---

User: What is the notice period mentioned in the employment contract?

Thinking:
  Step 1 — User wants a specific clause from a contract document.
  Step 2 — Search: "notice period employment contract"
  Step 3 — Tool returns chunk from "employment_contract.pdf" mentioning 30-day notice.
  Step 4 — The chunk directly answers the question.
  Step 5 — Answer with the fact and cite the source.`;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    // Authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    // Params + Validation
    const { workspaceId } = await params;
    if (!workspaceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Workspace id required.",
        },
        {
          status: 400,
        },
      );
    }

    // Membership check (any role can chat)
    const member = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    });
    if (!member) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        {
          status: 403,
        },
      );
    }

    // Parse messages
    const { messages }: { messages: ChatMessage[] } = await req.json();

    if (messages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Message not provided.",
        },
        { status: 400 },
      );
    }

    const tools = {
      searchKnowledgeBase: tool({
        description:
          "Search the workspace documents for relevant information to answer the user's question.",
        inputSchema: z.object({
          query: z
            .string()
            .describe("The search query to find relevant document chunks"),
        }),
        execute: async ({ query }) => {
          try {
            const response = await searchDocuments(query, 5, workspaceId);
            if (response.length === 0) {
              return "No relevant information found in the knowledge base";
            }

            const context = response.map((r) => ({
              content: r.content,
              source: r.documentName,
              chunkId: r.chunkId,
            }));

            return context;
          } catch (error) {
            console.error("Search error:", error);
            return "Error searching the knowledge base";
          }
        },
      }),
    };

    // Streaming with Groq
    // stopWhen: stepCountIs(3) allows:
    //   Step 1 → LLM calls tool
    //   Step 2 → Tool executes, results returned to LLM
    //   Step 3 → LLM reads results, streams final answer
    const result = streamText({
      model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
      messages: await convertToModelMessages(messages),
      tools,
      system: SYSTEM_PROMPT,
      stopWhen: stepCountIs(3),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error streaming chat completion: ", error);
    return new Response("Failed to stream chat completion", { status: 500 });
  }
}

type ChatToolsShape = {
  searchKnowledgeBase: ReturnType<typeof tool>;
};
export type ChatTools = InferUITools<ChatToolsShape>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;
