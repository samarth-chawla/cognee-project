# Interview Memory Agent

Next.js 16 interview-preparation app with AI question generation, evaluation, speech, reports, analytics, and Cognee-backed long-term memory.

## Architecture

- `app/api/auth` and `app/api/user`: identity, onboarding, profile, resume boundaries
- `app/api/interview`: start, answer, progression, end, history, and lookup routes
- `app/api/reports`: report generation and lookup
- `app/api/memory`: timeline, insights, and graph routes
- `app/api/speech`: token, transcription, and synthesis routes
- `components`: feature and shared UI
- `hooks`: client orchestration
- `lib`: provider adapters, domain logic, validation, and shared utilities
- `services`: application-level interview, memory, report, speech, and analytics logic
- `store`: Zustand state
- `types`: domain-specific TypeScript contracts
- `prisma`: PostgreSQL schema and migrations

Next.js 16 renamed `middleware.ts` to `proxy.ts`, so this project intentionally keeps the supported root `proxy.ts` convention.

## API compatibility

Existing working behavior moved to focused endpoints:

- `POST /api/auth/me`
- `POST /api/interview/start`
- `POST /api/interview/end`
- `POST /api/reports/generate`
- `GET|POST /api/memory/timeline`
- `POST /api/speech/transcribe`
- `GET /api/interview/history`

Routes needing persistence or provider setup return `501` instead of reporting false success.

## Setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Configure Clerk plus required providers in `.env.local`. Cognee falls back to an in-process store when `COGNEE_API_URL` is absent. Report queries return empty data when PostgreSQL is unavailable.

## Validation

```bash
npm run typecheck
npm run lint
npm run build
```
