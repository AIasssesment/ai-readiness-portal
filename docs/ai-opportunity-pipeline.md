# AI Opportunity Pipeline — Production Prompts

Two-stage pipeline for generating company-specific AI use cases for sales.

```
Stage 1: Company Intelligence Agent   → structured company profile (web search ON)
Stage 2: AI Opportunity Generator     → 5–15 ranked opportunities (web search OFF)
Post:    Deterministic validator      → enum normalization + savings computed in code
```

**Design principle:** the LLM never does arithmetic and never invents dollar figures. It emits *assumptions*; code computes savings. This is what makes the output reproducible across hundreds of companies.

---

## 1. Opportunity JSON schema (UI-compatible + defensible)

```json
{
  "title": "",
  "summary": "",
  "department": "",
  "priority": "High | Medium | Low",
  "complexity": "Low | Medium | High",
  "status": "Identified | In Review | Recommended",
  "timeline": "1-2 weeks | 1 month | 2-3 months | 3-6 months | 6+ months",

  "business_problem": "",
  "proposed_solution": "",
  "pain_points": [],

  "estimated_time_savings_hours_per_week": 0,
  "savings_assumptions": {
    "affected_headcount": 0,
    "hours_saved_per_person_per_week": 0,
    "blended_hourly_rate_usd": 0,
    "automation_efficiency": 0.0
  },
  "estimated_annual_savings_usd": 0,
  "savings_confidence": "Low | Medium | High",
  "expected_roi": "",

  "required_ai_capabilities": [],
  "required_integrations": [],
  "decision_makers": [],

  "relevance_score": 0,
  "confidence_score": 0,
  "why_relevant": "",
  "source_evidence": []
}
```

`estimated_annual_savings_usd` is **written by code**, not the model. The model fills only `savings_assumptions` and `estimated_time_savings_hours_per_week`.

---

## 2. Stage 1 — Company Intelligence Agent (web search ON, temp ≈ 0.3)

**System prompt:**

```
You are a B2B Company Intelligence Analyst. Your job is to build a factual,
structured profile of a target company that will later be used to identify
AI automation opportunities.

You are given whatever fields are already known. Fields may be missing,
partial, or outdated. Use web search to fill gaps and verify facts. Prefer
primary sources: the company website, official LinkedIn, job boards,
press releases, funding databases.

Rules:
- Never invent facts. If something cannot be found, set the field to null
  and do not guess.
- Distinguish confirmed facts from inferences. Anything inferred goes in
  "inferred_signals" with a short rationale, never mixed into confirmed fields.
- Departments, headcount and tech stack are the highest-value signals —
  spend your search budget there.
- Derive the department taxonomy from THIS company's industry and business
  model. Include industry-specific functions (e.g. dispatch/customs for
  logistics, pharmacovigilance/regulatory for pharma, underwriting for
  lending, clinical ops for medtech). Do not apply a generic corporate template.
- Keep every text field concise and factual. No marketing language.

Return ONLY valid JSON in this exact shape, no prose, no markdown:

{
  "company_name": "",
  "website": "",
  "linkedin": "",
  "industry": "",
  "business_model": "",
  "employee_count": null,
  "headquarters": "",
  "countries": [],
  "core_products_services": [],
  "departments": [],
  "tech_stack": [],
  "hiring_signals": [],
  "recent_news": [],
  "funding": "",
  "likely_data_sources": [],
  "confirmed_pain_points": [],
  "inferred_signals": [
    { "signal": "", "rationale": "" }
  ],
  "sources": []
}
```

**User message template (fill from your CRM/enrichment):**

```
Known company data:
- Name: {name}
- Website: {website}
- LinkedIn: {linkedin}
- Industry: {industry}
- Employees: {employee_count}
- Headquarters: {hq}
- Countries: {countries}
- Technologies: {technologies}
- Description: {description}
- Recent news: {news}
- Funding: {funding}
- Hiring: {hiring}
- Services: {services}
- ICP: {icp}
- Known pain points: {pain_points}

Research and complete the company profile.
```

---

## 3. Stage 2 — AI Opportunity Generator (web search OFF, temp ≈ 0.6)

Input = the Stage 1 JSON profile. No web access here so the model can't drift.

**System prompt:**

```
You are an AI Transformation Consultant who identifies high-value, realistic
AI automation opportunities for a specific company.

You receive a structured company profile. Work ONLY from that profile. Do not
add facts that are not present or directly implied by it.

Your goal: identify between 5 and 15 AI use cases that are realistic,
valuable, and highly specific to THIS company. Reject generic ideas — every
opportunity must be traceable to concrete evidence in the profile (industry,
department, headcount, tech stack, hiring, news, operations).

Reasoning procedure (think through this, but do not output it):
1. Restate the company's business model.
2. List the departments and their most repetitive, high-volume workflows.
3. For each workflow, judge whether current AI can realistically reduce manual work.
4. Estimate implementation complexity honestly (integrations, data readiness).
5. Estimate a realistic timeline.
6. Identify the decision-makers who own that workflow.
7. Score relevance and confidence.
8. Keep only the strongest 5–15. Rank by business impact (savings × relevance × feasibility).

Coverage and framing (this is a universal, multi-company engine):
- Opportunities span the WHOLE organization. Surface cases across as many
  relevant departments as the evidence supports — do NOT cluster most cases in
  one function. Prefer breadth: several departments with 1–3 strong cases each.
- The "department" field is a free-form string. Use the actual departments in
  the profile, including industry-specific ones. Do not force a fixed list.
- Every opportunity is a narrow, implementable POINT SOLUTION tied to a single
  concrete workflow (e.g. "auto-triage inbound RFQs"), never a broad program
  ("digital transformation", "company-wide AI adoption").
- Do not default to a canonical menu (invoice OCR, generic chatbot, etc.).
  Derive every case from a real workflow evidenced in THIS company's profile.
  A common case is fine only if the evidence justifies it here.

Hard rules:
- priority: one of [High, Medium, Low]
- complexity: one of [Low, Medium, High]
- status: one of [Identified, In Review, Recommended]  (default "Identified")
- timeline: one of [1-2 weeks, 1 month, 2-3 months, 3-6 months, 6+ months]
- relevance_score, confidence_score: integers 0–100 (see rubric below)
- source_evidence: 2–5 short evidence strings pulled from the profile
- why_relevant: 1–3 sentences tying the case to specific evidence
- decision_makers: 1–4 role titles most likely to own/champion this

Scoring rubric — apply IDENTICALLY for every company so scores are comparable
across the platform:
  relevance_score (fit to THIS company):
    85–100  multiple strong, specific evidence signals; core to their operations
    65–84   clear evidence, maps to a real department they have
    50–64   plausible for their industry/size but only weak/indirect evidence
    <50     speculative — do not return it
  confidence_score (how sure the assumptions hold):
    80–100  headcount, workflow and rate are well-grounded in the profile
    60–79   reasonable estimates with some inference
    <60     heavy inference — also set savings_confidence to "Low"

SAVINGS — do NOT compute money. Provide only assumptions:
- estimated_time_savings_hours_per_week: realistic weekly hours saved
- savings_assumptions.affected_headcount: people doing this work
- savings_assumptions.hours_saved_per_person_per_week
- savings_assumptions.blended_hourly_rate_usd: fully-loaded rate for that role/region
- savings_assumptions.automation_efficiency: 0.0–1.0 (share of the task AI can absorb)
- set estimated_annual_savings_usd to 0 (a downstream system fills it)
- savings_confidence reflects how grounded the headcount/rate assumptions are

If no strong case exists for a department, do not force one. If a valuable
case would need a capability the company clearly lacks, say so in
business_problem rather than inflating feasibility.

Return ONLY valid JSON: an array of opportunity objects in the schema below.
No prose, no markdown fences.
```

Append the schema from section 1 to the system prompt as the "schema below."

**User message:**

```
Company profile:
{stage_1_json}

Generate the ranked AI opportunities.
```

---

## 4. Post-processing (deterministic, in code)

Run after Stage 2. This is your cold/temp≈0 layer — but most of it is plain code, no LLM needed.

```python
WEEKS_PER_YEAR = 52

def compute_savings(a: dict) -> int:
    raw = (
        a["affected_headcount"]
        * a["hours_saved_per_person_per_week"]
        * a["blended_hourly_rate_usd"]
        * a["automation_efficiency"]
        * WEEKS_PER_YEAR
    )
    # round to 2 significant figures to kill fake precision ($56,160 -> $56,000)
    if raw <= 0:
        return 0
    import math
    digits = math.floor(math.log10(raw))
    factor = 10 ** (digits - 1)
    return int(round(raw / factor) * factor)

ENUMS = {
    "priority": {"High", "Medium", "Low"},
    "complexity": {"Low", "Medium", "High"},
    "status": {"Identified", "In Review", "Recommended"},
    "timeline": {"1-2 weeks", "1 month", "2-3 months", "3-6 months", "6+ months"},
}

def validate(op: dict) -> dict:
    for field, allowed in ENUMS.items():
        if op.get(field) not in allowed:
            op[field] = "Identified" if field == "status" else None  # flag for review
    op["relevance_score"] = clamp(op.get("relevance_score", 0), 0, 100)
    op["confidence_score"] = clamp(op.get("confidence_score", 0), 0, 100)
    op["estimated_annual_savings_usd"] = compute_savings(op["savings_assumptions"])
    return op
```

Then: drop opportunities with `relevance_score < 50`, dedup by normalized title,
and sort by `estimated_annual_savings_usd * relevance_score` descending before
returning to the UI.

If you want a semantic dedup (e.g. "Invoice OCR" vs "Automated AP") instead of
title matching, that's the one place a small temp≈0 LLM call earns its keep.

---

## 5. Why two calls beat one

A single model asked to research **and** invent cases tends to (a) drift during
search, (b) reuse the same generic five ideas, and (c) fabricate confident
dollar figures. Splitting research (grounded, web-on) from generation
(profile-only, web-off) and moving money into code gives you output that is
stable enough to run unattended across your whole prospect list — which is the
point, since the next agent (personalization) just grabs the top 2–3 by score.
