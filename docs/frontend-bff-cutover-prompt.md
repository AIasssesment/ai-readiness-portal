# Prompt for Next frontend agent — BFF cutover to Nest

Copy everything below the line into a chat opened on **`/Users/ww/ai-readiness-portal`**.

Sibling backend repo (canonical API): **`/Users/ww/ai-portal-backend`**.  
Backend migration plan: `ai-portal-backend/docs/backend-domain-migration-prompt.md`  
Backend cutover notes (written by Nest agent after each phase): `ai-portal-backend/docs/frontend-bff-cutover-notes.md` (may appear after Phase 0/1).

---

## ROLE

You are a senior Next.js engineer. Your job is to turn this app into a **thin UI + BFF**:

- Keep React UI, i18n, middleware, cookies/session, pages
- Stop owning domain AI logic, SQL for product features, and long-running jobs
- Call Nest (`/v1/...`) for company/job-risk/opportunities/chat/workforce (and payments already)

Work **in phases aligned with Nest**. Do not rip out Next domain code until the matching Nest endpoints exist and are verified.

## TARGET ARCHITECTURE

```
Browser
  → Next UI (RSC / client components)
  → Next Route Handlers `/api/*`  (thin: auth session → resolve clientId → call Nest)
  → Nest `/v1/*`  (canonical business logic + Neon + Redis/BullMQ)
```

Optional later: browser → Nest directly for some GETs. Default for now: **keep same `/api/*` URLs** so UI fetch paths stay stable; only route handler guts change.

## ALREADY DONE (do not break)

Payments/reports already go through Nest via:

- `lib/api/client.ts` → `apiFetch`
- `lib/api/payments.ts`
- env: `NEXT_PUBLIC_API_BASE_URL` and/or `API_URL` / `BACKEND_URL` (normalized to `.../v1`)

Preserve this pattern and extend it for new domains.

## NON-GOALS

- Do not re-implement Nest domain logic in `lib/opportunities`, `lib/company-enrichment`, etc. once cut over
- Do not add a vector DB / warehouse on the frontend
- Do not delete Nest-facing payment code
- Do not expose or keep expanding `app/api/db/query` (plan to remove after cutover)
- Do not move auth to Nest in this workstream unless Phase 4 is explicitly requested
- Do not redesign UI unless an API response shape forces a small adapter

## ENV / AUTH TO NEST

Add and document:

```
API_URL=http://localhost:3000          # or BACKEND_URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000   # only if browser must call Nest directly
INTERNAL_API_TOKEN=<same as Nest>
```

BFF → Nest requests must send:

```
Authorization: Bearer ${INTERNAL_API_TOKEN}
X-User-Id: <session user id>
X-User-Role: <user|admin|...>
X-Client-Id: <resolved clients.id for this user, when known>
Content-Type: application/json
```

Implement a shared helper, e.g. `lib/api/backend.ts`:

- `backendFetch(path, init)` wrapping `apiFetch` / fetch to Nest
- attaches internal token + trusted headers from `getSessionUser()` / admin role
- never leaks `INTERNAL_API_TOKEN` to the browser

Server-only: use this helper only from Route Handlers, Server Components, or server libs.

## PHASE GATE

Before each phase:

1. Confirm Nest endpoints exist (Swagger `/docs` or `docs/frontend-bff-cutover-notes.md`)
2. Smoke with curl from Nest README / notes
3. Then switch Next routes

If Nest phase is not ready: leave Next implementation as-is; do not half-migrate.

## PHASE 0 — BFF foundation (can start now)

1. Create `lib/api/backend.ts` (internal token + headers)
2. Extend `lib/api/types.ts` only as needed for new DTOs
3. Add `lib/api/normalize-backend-response.ts` helpers if Nest wrappers differ
4. Document env in README or `.env.example` if present
5. Inventory map (update this doc’s checklist as you go)

**Keep auth on Next** (`lib/auth/session.ts`, `app/api/auth/*`).

**Done when:** a dummy Nest health or existing payments call works through the new helper with headers; no UI regression on payment flow.

## PHASE 1 — Job Risk + LinkedIn + Workforce + Client profile

Nest should expose (names may match cutover notes; adapt if slightly different):

```
GET/PATCH /v1/clients/:clientId
CRUD      /v1/clients/:clientId/workforce/roles...
POST/GET  /v1/clients/:clientId/company-enrichment...
POST/GET  /v1/clients/:clientId/job-risk/...
```

### Next routes to thin-proxy

| Keep URL | Replace guts |
|----------|----------------|
| `POST /api/job-risk/generate` | enqueue/generate via Nest; poll if async |
| `POST /api/job-risk/linkedin` | Nest enrichment |
| `POST /api/job-risk/checkout` | Prefer Nest `POST /v1/payments/monobank/job-risk/invoices` (real pay). Remove stub unlock in prod path. |
| `GET/POST/DELETE /api/workforce/roles*` | Nest workforce |
| Admin `PATCH /api/admin/clients/[id]` | Nest clients PATCH |

### UI call sites (paths can stay)

- `components/portal/job-risk-generate-button.tsx`
- `components/portal/job-risk-linkedin-gate.tsx`
- `components/portal/job-risk-unlock-gate.tsx`
- `components/portal/workforce-manager.tsx`
- `components/admin/admin-company-profile-controls.tsx`
- pages that `import { sql }` for job-risk display: switch to Nest fetch or thin server helper

### Delete / stop using after cutover

- Direct SQL in those route handlers via `lib/db`
- Heavy use of `lib/company-enrichment/*`, `lib/job-risk/*` for generation (keep tiny adapters only if needed)
- Apify / Google AI env usage on Next for this phase (move ownership to Nest)

### Async jobs UX

If Nest returns `{ jobId, status }`:

- UI polls `GET .../status` or existing Next proxy
- Keep button loading/disabled states; show failed message from Nest error shape `{ error: { code, message } }`

**Done when:** generate + LinkedIn + workforce work with Nest down = feature broken (proves ownership moved); no `sql` in those route files.

## PHASE 2 — Opportunities

Nest:

```
POST/GET/PATCH /v1/clients/:clientId/opportunities...
POST /v1/admin/clients/:clientId/opportunities/generate...
```

### Next routes to thin-proxy

- `app/api/opportunities/route.ts`
- `app/api/opportunities/generate/route.ts`
- `app/api/admin/clients/[id]/opportunities/**` including `generate` and `generate/stream`

### UI

- `components/portal/opportunities-generate-button.tsx`
- `components/portal/opportunity-add-form.tsx`
- `components/admin/admin-generate-panel.tsx` (stream: either proxy SSE from Nest or switch to poll-job UX if Nest skips SSE)
- `components/admin/admin-opportunity-list.tsx`

### Rules

- Do not reimplement savings math on Next; trust Nest response fields
- Keep UI field names working via normalize adapters if Nest uses camelCase

**Done when:** portal + admin generate/list/edit go through Nest; `lib/opportunities/service.ts` no longer called from API routes (can delete or leave unused until cleanup PR).

## PHASE 3 — Chat

Nest chat endpoints → thin-proxy:

- `app/api/chat/route.ts`
- `app/api/chat/conversations/route.ts`
- `app/api/chat/conversations/[id]/route.ts`

Remove Next assembly of `lib/chat-context.ts` / LLM calls from those routes.

**Done when:** chat round-trip works with Nest; conversations persist as before.

## PHASE 4 — Auth (optional, later)

Only when asked. Until then:

- Auth stays in Next
- Nest trusts BFF headers only with `INTERNAL_API_TOKEN`

## SERVER COMPONENTS WITH SQL

Several pages/components still query Neon directly, e.g.:

- `app/portal/job-risk/page.tsx`
- `app/admin/companies/[id]/page.tsx`
- `components/portal/job-risk-enrichment-panel.tsx`

For each cutover phase, replace those reads with:

- Nest GET via `backendFetch` in the Server Component, or
- a small `lib/api/*.ts` server helper

Goal: **no product-feature `sql` outside auth** after Phases 1–3. Auth may still use SQL until Phase 4.

## REMOVE / SHRINK

After each phase is stable:

1. Delete unused domain libs (or mark deprecated in one cleanup PR)
2. Remove `GOOGLE_GENERATIVE_AI_*`, `APIFY_*` from Next env once unused
3. Plan removal of `app/api/db/query` and supabase-shaped client that hits it (`lib/supabase/client.ts`) once nothing depends on it
4. Keep `DATABASE_URL` only if auth/provision still need SQL

## CODING STANDARDS

- Match existing Next patterns (App Router, existing components)
- Comments in code: English
- Ukrainian UI copy via existing i18n — do not hardcode new user-facing English unless matching current style
- Prefer small PRs per phase
- Commits: `feat: ...` / `refactor: ...` / `fix: ...` (English, imperative, ≤72)
- Do not expand scope into visual redesign

## ACCEPTANCE CHECKLIST

Live status: `docs/frontend-cutover-status.md`

### Phase 0
- [x] `lib/api/backend.ts` exists and is server-only
- [x] Payments still work via Nest (browser `lib/api/payments.ts` unchanged)
- [x] Env vars documented (`.env.example` + cutover status)

### Phase 1
- [x] Job Risk generate uses Nest
- [x] LinkedIn enrichment uses Nest
- [x] Workforce CRUD uses Nest
- [x] Checkout uses Nest Monobank job-risk invoice (not paid stub) when backend ready
- [x] No SQL in those API routes

### Phase 2
- [ ] Opportunities generate/list/patch via Nest (portal + admin)
- [ ] Stream UX either proxied or replaced with polling without broken UI

### Phase 3
- [ ] Chat via Nest
- [ ] Context/numbers still not invented client-side

### Cleanup
- [ ] Dead libs removed or isolated
- [ ] `db/query` removed or tightly locked
- [ ] README mentions architecture: Next BFF → Nest

## START NOW

1. Read `lib/api/client.ts`, `lib/api/payments.ts`, `lib/auth/session.ts`
2. Implement Phase 0 (`lib/api/backend.ts` + env docs)
3. Check whether Nest Phase 1 endpoints exist (`ai-portal-backend` Swagger / cutover notes)
4. If yes → Phase 1 proxies; if no → stop after Phase 0 and list blocked routes waiting on Nest

When Nest response shapes differ from current Next JSON, add normalize helpers and keep UI stable.

Update `docs/frontend-bff-cutover-prompt.md` checklist statuses as you complete phases (or add a short `docs/frontend-cutover-status.md`).
