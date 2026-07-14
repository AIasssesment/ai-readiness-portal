# ADR-0002: Two-stage AI Opportunities pipeline with Gemini

## 1) ADR-0002: Two-stage AI Opportunities pipeline with Gemini

## 2) Status: Implemented

## 3) Authors: Portal engineering · Decision Date: 2026-07-14

## 4) Context / Problem

The portal already showed `opportunities` rows (often heuristic inserts from assessment), but there was no production path to generate company-specific AI use cases for sales/advisory.

We needed:
- Stable generation across many companies (not one brittle mega-prompt)
- Defensible savings numbers for CFO trust (no fake precision like `$56,160`)
- Persistent company context for regeneration and downstream agents (chat/outreach)
- Manual opportunity entry without losing AI-generated rows on regenerate
- LLM provider aligned with product choice: Google Generative AI (Gemini), not OpenAI

Reference design: [docs/ai-opportunity-pipeline.md](../ai-opportunity-pipeline.md).

## 5) Decision & Rationale

**Decision:** Implement a two-stage Opportunities pipeline (Company Intelligence → Opportunity Generator), store canonical company intelligence as JSONB in Postgres, compute savings in code from LLM assumptions, serve Gemini via a shared model helper, and keep manual opportunities across regenerations.

Rationale:
- Splitting research and generation reduces drift and generic “menu” use cases
- Code-owned arithmetic makes savings reproducible and auditable
- Rounding to 2 significant figures + showing assumptions improves CFO credibility
- `company_intelligence.profile` is multi-tenant friendly (RLS/auth via `client_id`) vs file/OKF wiki as source of truth
- Stage 1 uses Gemini Google Search grounding when available; Stage 2 is profile-only
- `@ai-sdk/google@3.x` matches `ai@6` model spec (`v2`/`v3`); `v4` provider packages break generation
- Zod validation stays loose on raw model numbers; hard caps run in post-process so one optimistic item does not fail the whole batch

## 6) (Expected or Known) Consequences

- New APIs: `POST /api/opportunities/generate`, `POST /api/opportunities`
- New tables/columns: `company_intelligence`; richer `opportunities` (`source`, assumptions, details, scores, …) via scripts `012`/`013`
- Generation latency rises (search + multiple structured LLM calls)
- Requires `GOOGLE_GENERATIVE_AI_API_KEY` (OAuth `GOOGLE_CLIENT_*` is unrelated)
- Chat/job-risk routes also use Gemini through `lib/ai/model.ts`
- Regenerating AI rows deletes `source in ('ai','assessment')` and preserves `manual`
- Wrong/ambiguous company website still risks research drift; website quality matters
- Second-order: future personalization / chat agents should read `company_intelligence` + scored opportunities rather than re-researching ad hoc

## 7) Considered Options

1. **Single LLM call (research + invent opportunities)**  
   Pros: simpler, cheaper latency.  
   Cons: drifts during search, generic ideas, fabricated dollars.  
   **Why not:** unstable for unattended multi-company use.

2. **OKF / markdown wiki as canonical company knowledge**  
   Pros: human-editable, agent-friendly traversal.  
   Cons: multi-tenant auth, versioning, and ops heavier for this SaaS.  
   **Why not for v1:** JSONB snapshot per `client_id` is enough; markdown/OKF can be an export later.

3. **LLM returns final `$` savings**  
   Pros: fewer post-steps.  
   Cons: arithmetic hallucinations, non-reproducible.  
   **Why not:** code computes from `savings_assumptions` and clamps by company size.

4. **OpenAI gpt-4o (previous stack)**  
   Pros: already wired.  
   Cons: product decision is Google AI.  
   **Why not:** migrated to Gemini with shared helper.

## 8) Assumptions & Constraints

- Latest assessment exists before generate (portal inputs + answers feed Stage 1)
- Company website/name is good enough for public research (e.g. `https://www.google.com/` is a real target)
- Savings assumptions must stay defensible after code clamps (headcount share, hours/week, rate, efficiency)
- Post-process drops `relevance_score < 50`, dedupes titles, sorts by `savings × relevance`
- Enums normalized in code (`priority`, `complexity`, `timeline`, `status`)
- No live web search in Stage 2

## 9) Related Decisions / Requirements / Artifacts

- Spec/prompts: [docs/ai-opportunity-pipeline.md](../ai-opportunity-pipeline.md)
- SQL: `scripts/012_company_intelligence_and_opportunities.sql`, `scripts/013_opportunity_details.jsonb.sql`
- Code: `lib/opportunities/*`, `lib/ai/model.ts`, `app/api/opportunities/**`, portal Opportunities UI
- Parallel pattern: job-risk generate (`generateObject` + deterministic scores)
- Related: [docs/database-migrations.md](../database-migrations.md) (`npm run db:migrate`)
- Supersedes ad-hoc heuristic-only opportunity inserts as the primary generation path (assessment heuristics may still seed early rows)

## 10) Appendix / References

- Vercel AI SDK + `@ai-sdk/google` (Gemini `googleSearch` provider tool)
- Env: `GOOGLE_GENERATIVE_AI_API_KEY`, optional `GOOGLE_GENERATIVE_AI_MODEL` / `GOOGLE_GENERATIVE_AI_FAST_MODEL`
- DB: Neon Postgres via `lib/db.ts` tagged SQL for generate routes

## 11) Update Log

- 2026-07-14 — Decided/Implemented: two-stage pipeline, Gemini provider, company_intelligence JSONB, code-owned savings, ADR authored.
