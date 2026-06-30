<div align="center">

# IntelliVault

**Enterprise document intelligence — RAG-powered search and AI chat, scoped to your team's workspaces.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel%20AI%20SDK-7-black?logo=vercel)](https://sdk.vercel.ai)
[![Neon](https://img.shields.io/badge/Neon-pgvector-green?logo=postgresql)](https://neon.tech)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-purple?logo=clerk)](https://clerk.com)

Upload documents into isolated team workspaces. Ask questions. Get answers grounded in your organization's actual knowledge — with role-based access, collaboration, and full auditability.

[Getting Started](#getting-started) · [How It Works](#how-it-works) · [Tech Stack](#tech-stack) · [Project Structure](#project-structure) · [Deployment](#deployment)

</div>

---

## Overview

Traditional chatbots are limited to their training data. IntelliVault connects a large language model directly to **your organization's documents** through semantic vector search — so every answer is grounded in real, citable knowledge.

It's built around **workspaces**: isolated containers where teams upload documents, invite collaborators with specific roles, and chat with an AI that only ever retrieves from that workspace's knowledge base. No cross-tenant leakage, no flat document lists — just scoped, permissioned, auditable knowledge access.

---

## Features

| Feature | Description |
|---|---|
| **Workspace Isolation** | Documents, chats, and members are scoped per-workspace — no cross-tenant data access |
| **Role-Based Access Control** | Owner / Editor / Viewer roles enforced at the API layer on every workspace action |
| **Email Invites** | Invite collaborators by email via Resend — accept flow works whether or not they already have an account |
| **PDF Ingestion** | Extract, chunk, and index documents automatically per workspace |
| **Semantic Search** | Vector similarity search via `pgvector` with HNSW indexing |
| **AI Chat with Tools** | LLM autonomously invokes knowledge-base lookup, scoped to the active workspace |
| **Streamed Responses** | Token-by-token streaming via Vercel AI SDK + Groq |
| **Type-safe Data Layer** | Drizzle ORM with Neon PostgreSQL, enum-backed roles, and cascading schema relations |
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
| Embeddings | Google Gemini (`gemini-embedding-001`) |
| LLM | Groq (`meta-llama/llama-4-scout-17b-16e-instruct`) |
| AI SDK | [Vercel AI SDK v7](https://sdk.vercel.ai) |
| Email | [Resend](https://resend.com) + React Email |
| PDF Parsing | [unpdf](https://github.com/unjs/unpdf) |
| Text Splitting | [@langchain/textsplitters](https://js.langchain.com) |
| Styling | Tailwind CSS v4, shadcn/ui |
| Linting/Formatting | Biome |

---

## How It Works

### Workspace Model

Every document, chat session, and invite belongs to exactly one workspace. A user can be a member of multiple workspaces with different roles in each:

```
User ──▶ Workspace Membership (role: owner | editor | viewer) ──▶ Workspace
                                                                       │
                                                          ┌────────────┼────────────┐
                                                     Documents    Chat Sessions   Invites
```

- **Owner** — full control: rename, delete, manage members, manage invites
- **Editor** — upload documents, send invites, chat
- **Viewer** — chat and read access only

Every API route enforces this at the data layer before touching any workspace resource.

### Ingestion Pipeline

```
PDF Upload → Text Extraction → Chunking → Gemini Embedding → pgvector Storage (scoped to workspace)
```

1. A member with upload permission adds a PDF to a workspace
2. Text is extracted using `unpdf`
3. Content is split into overlapping chunks via LangChain text splitters
4. Each chunk is embedded with Google Gemini
5. Chunks and their vectors are stored in the `chunks` table, linked to the parent `document` and `workspace`

### Query Pipeline

```
User Message → LLM Tool Call → Query Embedding → Cosine Search (workspace-scoped) → Context Assembly → Streamed Answer
```

1. A member sends a message inside a workspace's chat
2. Groq LLM autonomously invokes the knowledge-base lookup tool when relevant
3. The query is embedded and compared against vectors **belonging only to that workspace**
4. Top-K matching chunks are returned as grounded context
5. Groq streams a concise, source-aware answer back to the UI

### Invite Flow

```
Owner/Editor sends invite → Resend email with tokenized link → Invitee clicks → Account created or matched → Joins workspace as Viewer
```

Invites work whether or not the invitee already has an account — they sign up during the accept step if needed. Tokens expire after 7 days and are single-use.

---

## Getting Started

### Prerequisites

- Node.js 20+
- [Neon](https://neon.tech) PostgreSQL database with the `pgvector` extension enabled
- [Clerk](https://clerk.com) application
- [Groq](https://groq.com) API key
- [Google AI Studio](https://aistudio.google.com) API key (for Gemini embeddings)
- [Resend](https://resend.com) API key (for invite emails)

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

# Email (Resend)
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up the database

Enable the vector extension and create the workspace role enums (one-time setup):

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE workspace_role AS ENUM ('owner', 'editor', 'viewer');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired');
CREATE TYPE document_status AS ENUM ('processing', 'ready', 'failed');
CREATE TYPE message_role AS ENUM ('user', 'assistant');
```

Then push the schema:

```bash
npx drizzle-kit push
```

This creates all workspace, document, chunk, chat, invite, and activity log tables with their HNSW vector index.

### 4. Start the development server

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
│   │   ├── workspaces/
│   │   │   ├── route.ts                      # POST create, GET list
│   │   │   └── [workspaceId]/
│   │   │       ├── route.ts                  # GET, PATCH, DELETE
│   │   │       ├── members/route.ts          # GET, PATCH, DELETE
│   │   │       └── invites/route.ts          # POST invite, GET, DELETE
│   │   ├── invites/[token]/route.ts          # POST accept invite
│   │   └── chat/route.ts                     # Streaming chat API — RAG tool-calling
│   ├── w/[workspaceId]/                      # Workspace-scoped pages
│   │   ├── page.tsx                          # Workspace home
│   │   ├── documents/page.tsx                # Document list + upload
│   │   ├── chat/page.tsx                     # Workspace-scoped chat
│   │   ├── members/page.tsx                  # Member management
│   │   └── settings/page.tsx                 # Rename, delete
│   ├── invite/[token]/page.tsx               # Accept-invite landing page
│   ├── dashboard/page.tsx                    # All workspaces for current user
│   ├── page.tsx                              # Public landing page
│   └── layout.tsx                            # Root layout + Clerk provider
├── components/
│   ├── ai-elements/                          # Chat UI components
│   ├── ui/                                   # shadcn/ui primitives
│   └── email-template.tsx                    # React Email invite template
├── db/
│   └── index.ts                              # Neon + Drizzle client
├── schema/
│   ├── enums.ts                              # workspace_role, invite_status, etc.
│   ├── workspace.ts
│   ├── workspace_member.ts
│   ├── workspaceInvites.ts
│   ├── document.ts
│   ├── chunk.ts
│   ├── chatSessions.ts
│   ├── message.ts
│   ├── activityLog.ts
│   ├── relations.ts                          # Drizzle relational queries
│   └── index.ts                              # Re-exports all schema files
├── lib/
│   ├── chunking.ts                           # LangChain text splitter
│   ├── embedding.ts                          # Gemini embedding generation
│   └── search.ts                             # Vector cosine similarity search
├── hooks/
│   └── use-mobile.ts
├── middleware.ts                             # Clerk middleware — auth + route protection
└── types/
    └── global.d.ts
```

---

## API Routes

| Route | Methods | Access |
|---|---|---|
| `/api/workspaces` | `POST`, `GET` | Any authenticated user |
| `/api/workspaces/[id]` | `GET` | Any member |
| `/api/workspaces/[id]` | `PATCH`, `DELETE` | Owner only |
| `/api/workspaces/[id]/members` | `GET` | Any member |
| `/api/workspaces/[id]/members` | `PATCH`, `DELETE` | Owner only |
| `/api/workspaces/[id]/invites` | `POST` | Owner / Editor |
| `/api/workspaces/[id]/invites` | `GET`, `DELETE` | Owner only |
| `/api/invites/[token]` | `POST` | Any authenticated user |
| `/api/chat` | `POST` | Any workspace member |

Every workspace-scoped route validates membership and role before touching the database — enforced consistently via `workspace_members` lookups, not scattered ad hoc checks.

---

## Database Schema

Nine tables, in dependency order:

```
users (Clerk-managed, referenced by ID only)
  └── workspaces
        ├── workspace_members      (role: owner | editor | viewer)
        ├── workspace_invites      (token-based, 7-day expiry)
        ├── documents
        │     └── chunks            (vector(768), HNSW indexed)
        ├── chat_sessions
        │     └── messages          (source_chunk_ids for citation)
        └── activity_logs           (audit trail)
```

All workspace-child tables cascade-delete when their parent workspace is removed. Vector search uses HNSW indexing on `chunks.embedding` for fast approximate nearest-neighbor lookups, filtered by `workspace_id` before similarity ranking.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run Biome linter |
| `npm run format` | Format with Biome |
| `npx drizzle-kit push` | Push schema changes directly to Neon (dev) |
| `npx drizzle-kit generate` | Generate SQL migration files (prod) |
| `npx drizzle-kit migrate` | Apply generated migrations |

---

## Deployment

IntelliVault is optimized for [Vercel](https://vercel.com):

1. Push the repository to GitHub
2. Import the project in the Vercel dashboard
3. Add all environment variables from `.env.local`
4. Ensure the `vector` extension and role enums are created on your production Neon database
5. Deploy

> **Note:** Run schema migrations against production Neon before the first deploy — `drizzle-kit push` is fine for early-stage projects, but switch to `generate` + `migrate` once this is in active production use.

---

## Roadmap

- [ ] Hybrid search (vector + full-text BM25, merged via reciprocal rank fusion)
- [ ] Cited source attribution UI with inline chunk highlighting
- [ ] Conversational memory with query rewriting for multi-turn RAG
- [ ] LLM-as-judge evaluation layer (faithfulness, relevance scoring)
- [ ] Multi-format ingestion (DOCX, TXT)
- [ ] Usage analytics dashboard per workspace

---

## License

Private project. All rights reserved.

---

<div align="center">
  Built with Next.js · pgvector · Vercel AI SDK · Groq · Google Gemini · Clerk
</div>
