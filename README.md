# Interview Memory Agent

AI-powered mock interviews with **long-term memory**. The agent generates
role-specific questions, scores your answers, writes a report, and stores your
strengths/weaknesses in a [Cognee](https://www.cognee.ai/) knowledge graph so
future interviews target your weak spots.

## Tech Stack

| Layer      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | Next.js 15+ (App Router, Route Handlers)           |
| Language   | TypeScript                                         |
| Styling    | Tailwind CSS + Shadcn UI                           |
| State      | Zustand                                            |
| Database   | PostgreSQL (`pg`)                                  |
| Memory     | Cognee (HTTP sidecar, with in-memory demo fallback)|
| AI         | OpenAI / Gemini (provider-agnostic)               |

No monorepo, no Turborepo, no Express — plain Next.js Route Handlers.

## Architecture

```
app/                     Frontend pages (App Router)
├── login/               Auth screen
├── onboarding/          Pick target role
├── dashboard/           Overview + stats
├── interview/           Run a live interview
├── reports/             Past evaluations
├── memory/              Browse/search the memory graph
├── settings/            Provider + preferences
│
└── api/                 Backend (Route Handlers)
    ├── auth/            POST login/register
    ├── interview/       POST create interview (AI question gen)
    ├── evaluation/      POST score interview + save report + remember
    ├── speech/          POST audio -> transcript (Whisper)
    ├── memory/          GET list/search, POST add memory node
    └── reports/         GET list reports

components/              UI (Shadcn-style) + feature components
├── dashboard/  interview/  reports/  ui/

lib/                     Server/shared utilities
├── ai/                  OpenAI + Gemini + provider-agnostic complete()
├── cognee/              Cognee client (add/cognify/search/list)
├── db/                  PG pool + query() + schema.sql
├── prompts/             LLM prompt builders
└── utils/               cn(), uid(), API envelope helpers

hooks/                   Client React hooks (useAuth, useInterview, useSpeech)
store/                   Zustand stores (auth, interview, settings)
services/                Business logic bridging routes <-> lib
types/                   Shared TypeScript types
constants/               Routes, API paths, model names
public/                  Static assets
```

### Request flow (an interview)

1. `interview/page.tsx` → `useInterview.start()` → `POST /api/interview`
2. Route calls `services/interviewService.generateQuestions()`, which pulls
   context via `lib/cognee.searchMemory()` and generates questions via `lib/ai`.
3. User answers → `POST /api/evaluation` → `evaluateInterview()` scores it,
   then `saveReport()` (Postgres) + `rememberEvaluation()` (Cognee) run.
4. Insights persist in the memory graph and personalize the next session.

## Getting Started

```bash
npm install
cp .env.example .env.local      # fill in keys
psql "$DATABASE_URL" -f lib/db/schema.sql   # optional: create tables
npm run dev
```

Open http://localhost:3000.

### Demo mode

Without `COGNEE_API_URL` the memory layer uses an in-process stub, and without
`DATABASE_URL` report persistence is skipped — the app still runs end-to-end for
demos/hackathons.

## Absolute imports

`@/*` maps to the project root (see `tsconfig.json`), so import as
`@/lib/ai`, `@/components/ui/button`, `@/store/useInterviewStore`, etc.

## Cognee sidecar (optional)

Cognee is Python-based. Run it as a small HTTP service exposing:
`POST /add`, `POST /cognify`, `POST /search`, `GET /list?userId=`.
Point `COGNEE_API_URL` at it. See `lib/cognee/client.ts` for the contract.
