# IntelliVault

**Intelligent document search and chat, powered by RAG.**

IntelliVault is a production-ready Retrieval-Augmented Generation (RAG) application that lets organizations upload PDF
documents into a searchable knowledge vault and chat with an AI assistant that answers questions grounded in that
content.

Admins ingest documents. Users ask questions. The system retrieves the most relevant passages and generates accurate,
context-aware responses.

---

## Overview

Traditional chatbots rely solely on model training data. IntelliVault connects a large language model to **your**
documents through vector search, so answers reflect your actual knowledge base—not generic internet knowledge.

![Architecture Mind Map](/public/images/mindmap.png)


---

## Features

- **PDF ingestion** — Extract text from PDFs and index them automatically
- **Semantic search** — Find relevant content using vector similarity (pgvector + HNSW)
- **AI chat with tools** — Streaming responses via Groq with automatic knowledge-base lookup
- **Role-based access** — Clerk authentication with admin-only document upload
- **Modern UI** — Dark-mode interface built with shadcn/ui and AI Elements
- **Type-safe data layer** — Drizzle ORM with PostgreSQL migrations

---

## Tech Stack

| Layer         | Technology                                         |
|---------------|----------------------------------------------------|
| Framework     | [Next.js 16](https://nextjs.org) (App Router)      |
| Language      | TypeScript                                         |
| Auth          | [Clerk](https://clerk.com)                         |
| Database      | [Neon](https://neon.tech) (PostgreSQL)             |
| Vector search | [pgvector](https://github.com/pgvector/pgvector)   |
| ORM           | [Drizzle ORM](https://orm.drizzle.team)            |
| Embeddings    | Google Gemini (`gemini-embedding-001`)             |
| LLM           | Groq (`meta-llama/llama-4-scout-17b-16e-instruct`) |
| AI SDK        | [Vercel AI SDK](https://sdk.vercel.ai)             |
| PDF parsing   | [unpdf](https://github.com/unjs/unpdf)             |
| Styling       | Tailwind CSS 4, shadcn/ui                          |

---

## How It Works

### 1. Document ingestion (admin)

1. Admin uploads a PDF on `/upload`
2. Text is extracted with `unpdf`
3. Content is split into overlapping chunks (~150 characters)
4. Each chunk is embedded with Google Gemini (1536 dimensions)
5. Chunks and vectors are stored in the `documents` table

### 2. Question answering (authenticated users)

1. User sends a message on `/chat`
2. The LLM invokes the `searchKnowledgeBase` tool when needed
3. The query is embedded and compared against stored vectors (cosine similarity)
4. Top matching chunks are returned as context
5. Groq streams a concise answer grounded in those results

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database with the **pgvector** extension enabled
- [Clerk](https://clerk.com) application
- [Groq](https://groq.com) API key
- [Google AI](https://aistudio.google.com) API key (for embeddings)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd rag-chatbot
npm install
```

### 2. Environment variables

Create a `.env.local` file in the project root:

```env
# Database (Neon)
NEON_DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI Providers
GROQ_API_KEY=gsk_...
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
```

### 3. Database setup

Generate and apply migrations:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

The initial migration enables the `vector` extension and creates the `documents` table with an HNSW index for fast
similarity search.

### 4. Configure admin access

Upload is restricted to users with an admin role. In the [Clerk Dashboard](https://dashboard.clerk.com):

1. Open **Users** → select a user
2. Edit **Public metadata**
3. Add:

```json
{
  "role": "admin"
}
```

Only users with `"role": "admin"` can access `/upload`. All other authenticated users can chat.

### 5. Run the development server

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
│   │   └── chat/route.ts    # Streaming chat API with RAG tool
│   ├── chat/page.tsx        # Chat interface
│   ├── upload/
│   │   ├── page.tsx         # PDF upload UI (admin only)
│   │   └── actions.ts       # Server action: parse, chunk, embed, store
│   ├── page.tsx             # Home page (role-aware landing)
│   ├── layout.tsx           # Root layout + Clerk provider
│   └── globals.css          # Global styles + Tailwind config
├── components/
│   ├── ai-elements/         # Chat UI components (60+)
│   ├── ui/                  # shadcn/ui primitives
│   └── navigation.tsx       # App header and navigation
├── hooks/
│   └── use-mobile.ts        # Responsive design helper
├── lib/
│   ├── chunking.ts          # LangChain text splitter (semantic)
│   ├── db-config.ts         # Neon + Drizzle ORM client
│   ├── db-schema.ts         # documents table schema
│   ├── embedding.ts         # Google Gemini embedding generation
│   ├── search.ts            # Vector similarity search (cosine)
│   └── utils.ts             # Utility functions
├── proxy.ts                 # Clerk middleware for auth + route protection
└── types/
    └── global.d.ts          # Global TypeScript declarations
```

---

## Routes & Access Control

| Route       | Access                                   |
|-------------|------------------------------------------|
| `/`         | Public                                   |
| `/chat`     | Authenticated users                      |
| `/upload`   | Admin only (`metadata.role === "admin"`) |
| `/api/chat` | Authenticated users                      |

Route protection is handled in `src/proxy.ts` using Clerk middleware.

---

## Scripts

| Command                    | Description                         |
|----------------------------|-------------------------------------|
| `npm run dev`              | Start development server            |
| `npm run build`            | Production build                    |
| `npm run start`            | Start production server             |
| `npm run lint`             | Run Biome linter                    |
| `npm run format`           | Format code with Biome              |
| `npx drizzle-kit generate` | Generate SQL migrations from schema |
| `npx drizzle-kit migrate`  | Apply migrations to Neon            |

---

## Database Schema

```sql
CREATE TABLE documents
(
    id        SERIAL PRIMARY KEY,
    content   TEXT NOT NULL,
    embedding VECTOR(1536)
);

CREATE INDEX embeddingIndex
    ON documents
    USING hnsw (embedding vector_cosine_ops);
```

Each row represents one text chunk from an uploaded PDF, with its corresponding embedding vector for semantic search.

---

## Deployment

IntelliVault deploys seamlessly on [Vercel](https://vercel.com):

1. Push your repository to GitHub
2. Import the project in Vercel
3. Add all environment variables from `.env.local`
4. Deploy

Ensure migrations have been applied to your production Neon database before going live.

---

## License

Private project. All rights reserved.

---

<p align="center">
  Built with Next.js, pgvector, and the Vercel AI SDK
</p>
