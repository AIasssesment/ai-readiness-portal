# Frontend BFF cutover status

Last update: 2026-07-28

Architecture: Browser → Next UI → Next `/api/*` BFF → Nest `/v1/*`.

## Env (Next)

```bash
API_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000   # browser payments/reports only
INTERNAL_API_TOKEN=<same as Nest>
APP_URL=http://localhost:3001
```

See `.env.example`.

## Phase status

| Phase | Status | Notes |
|-------|--------|--------|
| 0 Foundation | Done | `lib/api/backend.ts`, env docs |
| 1 Job Risk / LinkedIn / Workforce / Clients | Done | thin proxies + Nest reads for portal Job Risk |
| 2 Opportunities | Blocked | waiting on Nest Phase 2 |
| 3 Chat | Blocked | waiting on Nest Phase 3 |
| 4 Auth | Not started | stays on Next until requested |

## Phase 1 inventory

| Next surface | Nest |
|--------------|------|
| `GET/POST /api/workforce/roles` | `/v1/clients/:id/workforce/roles` |
| `DELETE /api/workforce/roles/[id]` | `DELETE .../workforce/roles/:roleId` |
| `POST /api/job-risk/linkedin` | `POST .../company-enrichment/linkedin` |
| `POST /api/job-risk/generate` | `POST .../job-risk/generate` (async + poll) |
| `GET /api/job-risk/jobs/[jobId]` | `GET .../job-risk/jobs/:jobId` |
| `POST /api/job-risk/checkout` | `POST /v1/payments/monobank/job-risk/invoices` |
| `PATCH /api/admin/clients/[id]` | `PATCH /v1/clients/:clientId` |
| `lib/job-risk/access.ts` | `GET .../job-risk/access` |
| Job Risk page + enrichment panel | `reports/latest` + `company-enrichment` GET |

Identity SQL kept only for `resolveClientIdForUser` (map `app_users` → `clients.id`). Domain SQL removed from Phase 1 routes / Job Risk page / enrichment panel.

## Still on Next SQL (later phases)

- Opportunities / chat routes and `lib/chat-context.ts` report slices
- Admin company list/detail pages (PATCH profile already via Nest)
- Auth / provision

## Payments note

Browser report unlock still uses `lib/api/payments.ts` → Nest without internal token.
Job Risk checkout is server BFF → Nest Monobank job-risk invoice (`pageUrl` redirect).

## Production note (2026-07-28)

Job Risk **reads** (access / latest report / enrichment) try Nest first, then fall
back to Neon SQL if Nest is unreachable or BFF env is missing. This avoids
`/portal/job-risk` 500s when VPS Nest is behind Phase 1.

Vercel still needs for full BFF (mutations / generate / checkout):

```bash
API_URL=https://<prod-nest-host>
INTERNAL_API_TOKEN=<same as Nest>
APP_URL=https://www.signal2flow.com
```

Until Nest on VPS is at `436d6e3+`, generate/linkedin/workforce/checkout proxies
may fail; page render should still work via SQL fallback.
