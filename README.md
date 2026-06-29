<div align="center">

# IntelliVault

**Intelligent document search and AI chat, powered by RAG.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel%20AI%20SDK-7-black?logo=vercel)](https://sdk.vercel.ai)
[![Neon](https://img.shields.io/badge/Neon-pgvector-green?logo=postgresql)](https://neon.tech)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-purple?logo=clerk)](https://clerk.com)

Upload PDFs. Ask questions. Get answers grounded in your actual documents — not generic AI knowledge.

[Getting Started](#getting-started) · [How It Works](#how-it-works) · [Tech Stack](#tech-stack) · [Project Structure](#project-structure) · [Deployment](#deployment)

</div>

---

## Overview

Traditional chatbots are limited to their training data. IntelliVault connects a large language model directly to **your documents** through semantic vector search — so every answer is grounded in your actual knowledge base.

Admins ingest PDFs. Users ask questions. The system retrieves the most relevant passages and streams accurate, context-aware responses in real time.

![Architecture Mind Map](/public/images/mindmap.png)

---

## Features

| Feature | Description |
|---|---|
| **PDF Ingestion** | Extract, chunk, and index PDF documents automatically |
| **Semantic Search** | Vector similarity search via `pgvector` with HNSW indexing |
| **AI Chat with Tools** | LLM autonomously invokes knowledge-base lookup when needed |
| **Streamed Responses** | Token-by-token streaming via Vercel AI SDK + Groq |
| **Role-based Access** | Admin-only document upload, auth via Clerk |
| **Type-safe Data Layer** | Drizzle ORM with Neon PostgreSQL and schema migrations |
| **Modern UI** | Dark-mode interface built with shadcn/ui + Tailwind CSS v4 |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript 5 |
| Auth | [Clerk](https://clerk.com) |
| Database | [Neon](https://neon.tech) — serverless PostgreSQL |
| Vector Search | [pgvector](https://github.com/pgvector/pgvector) — cosine similarity + HNSW index |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| Embeddings | Google Gemini (`gemini-embedding-001`, 1536 dims) |
| LLM | Groq (`meta-llama/llama-4-scout-17b-16e-instruct`) |
| AI SDK | [Vercel AI SDK v7](https://sdk.vercel.ai) |
| PDF Parsing | [unpdf](https://github.com/unjs/unpdf) |
| Text Splitting | [@langchain/textsplitters](https://js.langchain.com) |
| Styling | Tailwind CSS v4, shadcn/ui |
| Linting/Formatting | Biome |

---

## How It Works

### Ingestion Pipeline (Admin)

```
PDF Upload → Text Extraction → Chunking → Gemini Embedding → pgvector Storage
```

1. Admin uploads a PDF at `/upload`
2. Text is extracted using `unpdf`
3. Content is split into overlapping chunks (~150 characters) via LangChain text splitters
4. Each chunk is embedded with Google Gemini (`gemini-embedding-001`, 1536 dimensions)
5. Chunks and their vectors are stored in the `documents` table in Neon

### Query Pipeline (Authenticated Users)

```
User Message → LLM Tool Call → Query Embedding → Cosine Search → Context Assembly → Streamed Answer
```

1. User sends a message at `/chat`
2. Groq LLM autonomously invokes the `searchKnowledgeBase` tool when relevant
3. The query is embedded and compared against stored vectors using cosine similarity
4. Top-K matching chunks are returned as grounded context
5. Groq streams a concise, source-aware answer back to the UI

---

## Getting Started

### Prerequisites

- Node.js 20+
- [Neon](https://neon.tech) PostgreSQL database with the `pgvector` extension enabled
- [Clerk](https://clerk.com) application
- [Groq](https://groq.com) API key
- [Google AI Studio](https://aistudio.google.com) API key (for Gemini embeddings)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd rag-chatbot
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Database
NEON_DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI Providers
GROQ_API_KEY=gsk_...
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
```

### 3. Set up the database

Generate and apply migrations:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

This enables the `vector` extension and creates the `documents` table with an HNSW index for fast similarity search.

### 4. Configure admin access

Document upload is restricted to admin users. To grant admin access:

1. Open the [Clerk Dashboard](https://dashboard.clerk.com) → **Users** → select a user
2. Edit **Public metadata** and add:

```json
{
  "role": "admin"
}
```

All other authenticated users can access the chat interface.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── chat/route.ts        # Streaming chat API — RAG tool-calling logic
│   ├── chat/page.tsx             # Chat interface
│   ├── upload/
│   │   ├── page.tsx              # PDF upload UI (admin only)
│   │   └── actions.ts            # Server action: parse → chunk → embed → store
│   ├── page.tsx                  # Home — role-aware landing page
│   ├── layout.tsx                # Root layout + Clerk provider
│   └── globals.css               # Global styles + Tailwind config
├── components/
│   ├── ai-elements/              # Chat UI components (60+)
│   ├── ui/                       # shadcn/ui primitives
│   └── navigation.tsx            # App header and navigation
├── lib/
│   ├── chunking.ts               # LangChain text splitter
│   ├── db-config.ts              # Neon + Drizzle ORM client
│   ├── db-schema.ts              # legacy documents table schema
├── schema/                       # Drizzle workspace and RAG table schemas
│   ├── embedding.ts              # Gemini embedding generation
│   ├── search.ts                 # Vector cosine similarity search
│   └── utils.ts                  # Utility functions
├── hooks/
│   └── use-mobile.ts             # Responsive design helper
├── proxy.ts                      # Clerk middleware — auth + route protection
└── types/
    └── global.d.ts               # Global TypeScript declarations
```

---

## Routes & Access Control

| Route | Access |
|---|---|
| `/` | Public |
| `/chat` | Authenticated users |
| `/upload` | Admin only (`metadata.role === "admin"`) |
| `/api/chat` | Authenticated users |

Route protection is implemented in `src/proxy.ts` using Clerk middleware.

---

## Database Schema

```sql
CREATE TABLE documents (
    id        SERIAL PRIMARY KEY,
    content   TEXT        NOT NULL,
    embedding VECTOR(1536)
);

CREATE INDEX embeddingIndex
    ON documents
    USING hnsw (embedding vector_cosine_ops);
```

Each row represents one text chunk from an uploaded PDF, stored alongside its 1536-dimensional embedding vector. The HNSW index enables sub-millisecond approximate nearest-neighbor search at scale.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run Biome linter |
| `npm run format` | Format with Biome |
| `npx drizzle-kit generate` | Generate SQL migrations from schema |
| `npx drizzle-kit migrate` | Apply migrations to Neon |

---

## Deployment

IntelliVault is optimized for [Vercel](https://vercel.com):

1. Push the repository to GitHub
2. Import the project in the Vercel dashboard
3. Add all environment variables from `.env.local`
4. Deploy

> **Note:** Ensure Drizzle migrations have been applied to your production Neon database before the first deployment.

---

## License

Private project. All rights reserved.

---

<div align="center">
  Built with Next.js · pgvector · Vercel AI SDK · Groq · Google Gemini
</div>
