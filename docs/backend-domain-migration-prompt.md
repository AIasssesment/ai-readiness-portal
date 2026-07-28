# Prompt for Nest backend agent — migrate domain logic from Next

Copy everything below the line into a chat opened on **`/Users/ww/ai-portal-backend`**.

Sibling frontend repo (source of truth for current behavior): **`/Users/ww/ai-readiness-portal`**.

---

## ROLE

You are a senior NestJS backend engineer. Your job is to make `ai-portal-backend` the **canonical API** for product domain logic that currently lives inside Next.js Route Handlers (`ai-readiness-portal/app/api/**`) and `lib/**`.

Do not turn Next into a second backend. Next should become a thin BFF/UI that calls this Nest API (`/v1/...`).

Work in **phases**. Ship each phase with working endpoints, tests or at least curl examples in README, and no broken payments/health that already exist.

## CONTEXT (current split)

### Nest already owns (`ai-portal-backend`)

- Prefix: `/v1`
- Error shape: `{ error: { code, message, details? } }`
- Health, Assessments create + ScoringService
- Reports readiness / report requests
- Monobank payments + webhooks + job_risk unlocks
- Redis + BullMQ (`emails` queue) for notifications skeleton
- Prisma + Neon (`DATABASE_URL`)
- Swagger at `/docs`

### Next currently owns (must move to Nest over time)

Route handlers under `ai-readiness-portal/app/api/`:

| Area | Routes (approx) | Core libs to port |
|------|-----------------|-------------------|
| Auth | `auth/login`, `sign-up`, `logout`, `me`, `forgot-password`, `reset-password`, `google/start`, `google/callback` | `lib/auth/*` |
| Assessments CRUD | `assessments`, `assessments/[id]`, `assessment/provision-account` | `lib/assessment-store.ts`, `lib/assessment/*` |
| Chat | `chat`, `chat/conversations`, `chat/conversations/[id]` | `lib/chat-context.ts`, `lib/chat-prompts.ts` |
| Job Risk | `job-risk/generate`, `job-risk/linkedin`, `job-risk/checkout` (partial stub) | `lib/job-risk/*`, `lib/company-enrichment/*`, `lib/ai/model.ts` |
| Opportunities | `opportunities`, `opportunities/generate`, admin variants + stream | `lib/opportunities/*` |
| Workforce | `workforce/roles`, `workforce/roles/[id]` | SQL on `workforce_roles` |
| Admin clients | `admin/clients/[id]`, opportunities under admin | `lib/auth/admin.ts` |
| Misc | `db/query` (do **not** port as public API) | — |

Prompts inventory: `ai-readiness-portal/docs/llm-prompts.md`  
Opportunity pipeline design: `ai-readiness-portal/docs/ai-opportunity-pipeline.md`  
SQL migrations (actual Neon schema beyond Prisma): `ai-readiness-portal/scripts/*.sql`

### Shared database

Both apps use the **same Neon Postgres**. Nest Prisma schema is **incomplete** vs live tables created by Next SQL scripts (`company_intelligence`, `company_enrichment`, `job_risk_reports`, `job_risks`, `workforce_roles`, `conversations`, `messages`, `clients.website`, `clients.description`, etc.).

**Rule:** extend Prisma to match existing tables. Prefer `prisma db pull` / introspect + careful models over inventing parallel tables. Do not drop or rename columns used by the frontend.

### Redis

Redis is already wired for BullMQ. Use it for:

- long AI jobs (job-risk generate, opportunities generate, LinkedIn enrichment)
- email sending (finish the existing notifications processor)
- optional short-lived job status keys

Do **not** put company knowledge / canonical business data in Redis. Canonical data stays in Postgres.

## GOAL

Make Nest the system of record for:

1. Company / client profile reads & updates needed by AI features
2. Job Risk generation + LinkedIn enrichment
3. Opportunities generation pipeline
4. Chat context assembly + chat message persistence API
5. Workforce roles CRUD
6. Admin-safe mutations for clients/opportunities

Auth can stay on Next temporarily (Phase 0), but Nest must accept a clear auth strategy (see below).

## NON-GOALS (do not do in this work)

- Do not build a data warehouse or vector DB
- Do not move UI / i18n / PDF export browser flow into Nest
- Do not expose a raw SQL endpoint like Next `app/api/db/query`
- Do not rewrite Monobank payment flow unless required for Job Risk unlock consistency
- Do not “big bang” migrate all routes in one PR

## AUTH STRATEGY (pick and document in ADR)

Until auth is fully on Nest, use one of:

**Preferred for Phase 1–2:** internal service auth  
- Next Route Handlers call Nest with `Authorization: Bearer <INTERNAL_API_TOKEN>`  
- Plus headers: `X-Client-Id`, `X-User-Id`, `X-User-Role` (trusted only when internal token is valid)  
- Nest validates token via env `INTERNAL_API_TOKEN`

**Later:** move session verification into Nest (cookie or JWT), Next becomes pure UI.

Create `docs/adr/ADR-00X-internal-api-auth-for-bff.md` describing the choice.

## PHASED IMPLEMENTATION

### Phase 0 — Foundation (do first)

1. Sync Prisma models with live Neon tables used by AI features (at least):
   - `clients` fields: `website`, `description`, `industry`, `company_size`, `linkedin` (already partially there)
   - `company_intelligence`
   - `company_enrichment`
   - `job_risk_reports`, `job_risks`, `job_risk_unlocks` (unlock already exists)
   - `workforce_roles`
   - `opportunities` extended columns from Next migrations
   - `conversations`, `messages`
2. Add shared modules:
   - `AiModule` (Google Generative AI / same env names as Next: `GOOGLE_GENERATIVE_AI_API_KEY`, model envs)
   - `JobsModule` (BullMQ queues: `ai-jobs`, keep `emails`)
   - `ClientsModule` (read/update client profile)
3. Internal auth guard as above
4. Keep existing `/v1/payments/**`, `/v1/reports/**`, `/v1/assessments` POST working

**Done when:** Prisma generate works against Neon; Swagger lists new stubs; health ready still checks DB (+ Redis if already required).

### Phase 1 — Company + Workforce + Job Risk (highest value)

Port behavior from:

- `lib/company-enrichment/service.ts`, `apify.ts`, `normalize.ts`
- `app/api/job-risk/generate/route.ts`
- `app/api/job-risk/linkedin/route.ts`
- `lib/job-risk/access.ts`
- `app/api/workforce/roles/**`

New Nest endpoints (suggested):

```
GET    /v1/clients/:clientId
PATCH  /v1/clients/:clientId

GET    /v1/clients/:clientId/workforce/roles
POST   /v1/clients/:clientId/workforce/roles
PATCH  /v1/clients/:clientId/workforce/roles/:roleId
DELETE /v1/clients/:clientId/workforce/roles/:roleId

POST   /v1/clients/:clientId/company-enrichment/linkedin
GET    /v1/clients/:clientId/company-enrichment

POST   /v1/clients/:clientId/job-risk/generate          # enqueue or sync with status
GET    /v1/clients/:clientId/job-risk/reports/latest
GET    /v1/clients/:clientId/job-risk/access
```

Requirements:

- Preserve prompt semantics from `docs/llm-prompts.md` (Job Risk + LinkedIn implied roles)
- Tenant isolation: every query filtered by `clientId`
- Long enrichment/generate: prefer BullMQ job + status polling (`queued|running|ready|failed`) stored in DB or Redis with DB final result
- Gating: respect `job_risk_unlocks` / access rules from Next `lib/job-risk/access.ts`
- Apify env vars: same names as Next (`APIFY_TOKEN`, actor ids)

**Done when:** curl can enrich LinkedIn + generate job risk for a client and rows appear in Neon identical in shape to what Next wrote.

### Phase 2 — Opportunities pipeline

Port:

- `lib/opportunities/service.ts`
- `prompts.ts`, `schemas.ts`, `postprocess.ts`, `savings.ts`, `normalize.ts`
- Design doc: `docs/ai-opportunity-pipeline.md`

Endpoints:

```
POST /v1/clients/:clientId/opportunities/generate
GET  /v1/clients/:clientId/opportunities
PATCH /v1/clients/:clientId/opportunities/:opportunityId

# admin (role=admin)
POST /v1/admin/clients/:clientId/opportunities/generate
POST /v1/admin/clients/:clientId/opportunities/generate/stream   # optional SSE; or skip stream v1 and poll job
```

Rules from existing design (must keep):

- Stage 1 company intelligence (search grounding) → Stage 2 opportunities
- LLM emits **assumptions**, code computes savings (never trust LLM arithmetic)
- Upsert `company_intelligence.profile`
- Publication status behavior must match frontend expectations

Use BullMQ for generate jobs.

**Done when:** generate produces published/draft opportunities compatible with current portal UI JSON fields.

### Phase 3 — Chat API

Port:

- `lib/chat-context.ts` (`getChatContext`, `buildChatContext`)
- `lib/chat-prompts.ts`
- `app/api/chat/**`

Endpoints:

```
GET  /v1/clients/:clientId/chat/context          # optional debug
GET  /v1/clients/:clientId/conversations
POST /v1/clients/:clientId/conversations
GET  /v1/clients/:clientId/conversations/:id
POST /v1/clients/:clientId/conversations/:id/messages   # user message → assistant reply
```

Assemble context from clients + latest assessment + published opportunities + job risk (if access). Do not invent numbers.

**Done when:** one message round-trip persists user+assistant rows and uses the same context rules as Next.

### Phase 4 — Auth migration (optional, separate PR)

Only after Phases 1–3 are stable. Move session/password/Google OAuth verification to Nest. Out of scope unless explicitly requested.

## CODING STANDARDS (Nest repo)

- Modules per domain: `clients`, `workforce`, `company-enrichment`, `job-risk`, `opportunities`, `chat`, `ai`, `jobs`
- DTO validation with `class-validator`
- Unified error filter already exists — use it
- No `any` in public DTOs; Zod ok internally if already used
- Comments in code: English only
- Commit messages if you commit: `feat: ...` / `fix: ...` (English, imperative, ≤72)
- Update README API section after each phase
- Add ADR for non-obvious decisions (auth, job queue shape, Prisma sync)

## ENVIRONMENT

Document any new env vars in README. Expected additions:

```
INTERNAL_API_TOKEN=
GOOGLE_GENERATIVE_AI_API_KEY=
GOOGLE_GENERATIVE_AI_MODEL=
GOOGLE_GENERATIVE_AI_FAST_MODEL=
APIFY_TOKEN=
APIFY_LINKEDIN_COMPANY_ACTOR_ID=
APIFY_LINKEDIN_JOBS_ACTOR_ID=
```

Keep existing Redis / Monobank / Resend / DATABASE_URL.

## FRONTEND HANDOFF (write this for the Next agent)

After each phase, add `docs/frontend-bff-cutover-notes.md` in **this backend repo** listing:

- new Nest endpoints
- request/response examples
- which Next `app/api/*` routes can become thin proxies
- env vars Next must set (`API_URL` / `NEXT_PUBLIC_API_BASE_URL`, `INTERNAL_API_TOKEN`)

The Next agent prompt lives at:
`ai-readiness-portal/docs/frontend-bff-cutover-prompt.md`

Do **not** edit the Next repo in the backend-only task unless the user opens that repo.

## ACCEPTANCE CHECKLIST

- [ ] Existing payments + reports still work
- [ ] Prisma models cover tables used by new endpoints
- [ ] Job Risk generate path works via Nest and writes Neon rows
- [ ] Opportunities generate path works via Nest with deterministic savings math
- [ ] All AI/data queries scoped by `clientId`
- [ ] Long tasks go through BullMQ + status, not only blocking HTTP (or documented sync MVP with timeout limits)
- [ ] Swagger updated
- [ ] README + cutover notes updated
- [ ] No raw SQL admin query endpoint

## START NOW

1. Read existing Nest modules: `payments`, `reports`, `assessments`, `notifications`, `prisma/schema.prisma`
2. Introspect / extend Prisma for missing tables from `ai-readiness-portal/scripts/`
3. Implement Phase 0 + Phase 1
4. Stop and summarize endpoints + how to test with curl before starting Phase 2

If something in Next behavior is ambiguous, prefer matching Next’s current runtime behavior and cite the source file path in the summary.
