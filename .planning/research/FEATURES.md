# Feature Landscape: Compass (Paperclip Strategic Consultant Plugin)

**Domain:** Strategic consulting + agent operations for AI companies  
**Researched:** May 2, 2026  
**Confidence:** MEDIUM — Researched existing Paperclip ecosystem tools (Company Wizard, vision-quest), examined broader agent/consulting platform patterns, extrapolated to plugin use case. Limited specific validation of founder expectations for drift detection and revival diagnostics patterns (not yet validated in real use).

## Executive Summary

Compass sits at the intersection of **strategic founding/positioning tools** (like Aron Prins' paperclip-vision) and **operational governance tools** (like enterprise approval workflows, health monitoring). The ecosystem shows clear table-stakes expectations: VISION document authoring, approval routing, and mode-aware state management. Differentiators emerge where Compass goes beyond vanilla interview → document generation: drift detection (comparing VISION vs. observed behavior), revival diagnostics (classifying stall causes), and the **sample-pivot pattern** (reframing existing work for critique pass). 

The key design choice is **scope containment**: Compass augments Paperclip's existing company/agent APIs without becoming a standalone founder dashboard or autonomous decision-maker. It surfaces findings, routes approvals, queues wakeups — founder remains the decider.

## Table Stakes

Features users expect. Missing = Compass feels incomplete or fails to solve the core founder problem.

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|----------------------|
| **VISION.md generation with multi-section structure** | Aron's vision-quest + Company Wizard both do this; founders expect strategic document output | Medium | 6-section interview (Big Picture, Revenue & Customers, Growth & Marketing, Product Direction, CEO Autonomy, Vision & Identity) → template-parameterized VISION.md with mission, goals, audience, voice, principles, mandate, operating philosophy, success criteria |
| **Mode auto-detection on plugin open** | Founder should not manually classify company state; plugin reads VISION existence + heartbeat recency + blocker inventory | Low | Hard rules: Found (no VISION), Assess (VISION + recent heartbeats), Revive (VISION + stale heartbeats OR open blockers), Reposition (founder-initiated override). Deterministic, no LLM tax. |
| **Inventory snapshot (state summary)** | Founder needs to see company's current configuration before interview/drift/diagnostic. Reduces manual discovery. | Medium | Reads: agents + roles + skills + recent issues/comments + last heartbeat times + VISION sections status + active blockers. Renders in UI as a read-only dashboard. |
| **Amendment Protocol enforcement on VISION writes** | Aron's vision-quest enforces "default-NO, founder approval on YES"; Compass must not auto-edit strategy | Low | Every VISION.md write requires explicit founder confirmation gate before applying. Proposed amendments surface in inline preview. Changelog section logs dated entries for amendments. |
| **Agent provisioning per preset** | Company Wizard provides this; Compass must not lose it. Founders choose presets (fast, launch-mvp, secure, gtm, startup, etc.) and get agents + skills | Medium | Inherit Company Wizard's preset library, role fallback logic, and provisioning code. Call Paperclip API to create agents with selected preset roles. |
| **Dual-path agent instruction awareness** | Managed-mode agents store instructions in UUID-based paths; external agents use friendly paths. Plugin must route writes correctly. | Low | Read `agents.adapter_config->>'instructionsBundleMode'` and decide write destination. Never assume filesystem path for managed agents. |
| **Wakeup queueing on apply** | Changes must trigger agent heartbeats without manual cron waiting. Founders expect immediate effect. | Low | Insert into `agent_wakeup_requests` with `idempotency_key` + `reason` on each Apply step. Plugin SDK ensures no duplicates. |
| **Engagement memory persistence** | Compass findings (prior diagnostics, last engagement date, open recommendations) must survive plugin close/reopen | Low | Store as `documents` table entry `compass-engagement-history` per company. Versioned, native to Paperclip, survives reinstall. |
| **Approval routing for amendments** | Founder may want CEO review on some companies but not others. Per-company configurable: `founder` (default) or `founder+ceo` | Medium | Store approval config on company in `approvals` table. Amend flow routes to `founder` or escalates to `founder+ceo` based on config. |
| **Inline preview + confirm-gate before apply** | Founder sees proposed changes (VISION, agent provisioning, issues) before commit. No auto-write. | Medium | UI surfaces markdown preview of VISION draft, agent manifest preview, issue list preview. "Confirm & Apply" is the final gate. |

## Differentiators

Features that set Compass apart. Not expected, but valued by founders running stalled/drifting companies.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Drift detection (Assess mode)** | Identifies gaps between VISION intent and observed agent behavior over 30-day window (issues, comments, outputs). No other Paperclip tool does this. | Large | Parse VISION sections (revenue model, product direction, growth strategy, etc.). Query last 30 days of issues + comments + agent edition outputs. Classify mismatch (e.g., "VISION says launch new feature, but 80% of issues are customer support"). Surface as drift report with proposed amendments. |
| **Revival diagnostic flowchart (Revive mode)** | When company stalls, auto-classify root cause: single blocker? strategic drift? broken integration? governance loop? dead agent? Founder gets one-click unblock recommendations. | Large | Deterministic flowchart: scan blockers → blocker type → recommend unblock action (e.g., "rotate CEO", "kill Agent X + re-assign tasks", "run drift report then amend vision"). Not LLM-driven; rule-based. |
| **Sample-pivot pattern (Revive-mode action)** | Novel feature: reframe existing work as "samples for critique pass" rather than throw away. Spin up fresh production branch under calibrated standard. Dramatically accelerates recovery. | Large | One-click action in Revive mode that creates: (1) `SAMPLES.md` document linking existing issues/outputs as critique fodder; (2) new `CRITIQUE_PASS` issue assigning to QA or relevant agent; (3) new production board with stricter bar. Unblocks "restart" without losing context. |
| **Founder-action queue (Revive mode)** | Single prioritized list of actions only founder can take: approve CEO reset, fund new agent hire, override agent decision, etc. Unblocks waiting agents. | Medium | Auto-generate from diagnostic findings. Actions like "Founder: decide on feature launch timeline" or "Founder: approve budget for performance optimization work". Surfaces in issue comments or as a dedicated document. |
| **30-day drift window (default, not configurable v1)** | Matches founder workflow: monthly sync cadence, seasonal changes, not daily noise. Standard signal-to-noise tradeoff. | Low | Query `issues.created_at > NOW() - INTERVAL '30 days'`. If founder wants different window, surface as future feature request. |
| **Scheduled strategic check-ins via Paperclip routines (Milestone 6)** | Quarterly drift reviews, monthly trust-gate reviews auto-scheduled on company. Plugin remembers engagement history across sessions. | Medium | Hook Paperclip's `routines` table to auto-trigger Assess or Revive mode on schedule. Engagement memory surfaces prior findings + new delta vs. prior state. |
| **Full 6-section vision-quest interview in Found mode** | Aron's interview is deeper and more opinionated than Company Wizard's lighter intake. Compass ports all 6 sections, giving founders strategic depth on day one. | Large | ~30–50 total questions across: Big Picture (ultimate goal, 12-mo milestone, 3-yr vision), Revenue & Customers (pricing, model, target), Growth & Marketing (channels, budget, sales), Product Direction (status, roadmap), CEO Autonomy (decision authority, approvals, cadence), Vision & Identity (values, red lines, success signals). |
| **Voice + principles articulation in VISION.md** | Aron's template includes "voice" (tone, style, audience), "red lines" (what we won't do), "principles" (operating philosophy). Most company templates skip these. | Medium | Interview questions elicit voice/tone preferences, red lines, core principles. VISION.md sections preserve these as explicit guidance for agents. |
| **Amendment Protocol changelog in VISION.md** | Every VISION change logged with date, author, reason. Founders track strategic shifts over company lifetime. | Low | On amendment, auto-append dated entry: `[2026-05-02] Added product direction delta (founded: Q2 pivot to B2B). Approved by: founder. Reason: market feedback.` |
| **Free-form chat router to right mode** | Founder types "competitor showed up, need to rebrand" → plugin infers Reposition mode. No manual mode selection. | Medium | LLM-driven classifier (lightweight, not token-heavy) routes free-form input to Found / Assess / Revive / Reposition based on keywords and context. Override always available. |
| **Two-maintainer collaboration structure** | Codebase assumes Aron Prins co-maintainership. README credits, governance model, contribution docs for open-source collab. | Low | Repository structure, CONTRIBUTING.md, dual-maintainer governance patterns. Not a feature users see, but lowers friction for contributions. |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Standalone CEO_BOOTSTRAP.md generator** | Paperclip already has `BOOTSTRAP.md` + Wizard provisioning. Duplicating this is scope creep. vision-quest's CEO bootstrap was a workaround for Claude Code context; Compass doesn't need it. | Let Company Wizard + Paperclip's native bootstrap handle CEO initialization. VISION.md is the strategic constitution; BOOTSTRAP.md is operational startup. Both are separate concerns. |
| **Direct Postgres writes from plugin code** | Breaks portability, bypasses RLS/audit logging, sets bad precedent. Plugin SDK exists for this reason. | Use Plugin SDK for all mutations. Slower? Yes. Future-proof? Also yes. |
| **Reading `company_secrets` values directly** | Secrets are encrypted; accessing them outside Paperclip's secret API is a security smell. | Read only secret **names** via Paperclip API. Founders manage values through Paperclip's secret manager. |
| **Auto-editing VISION.md without founder approval** | Tempting to apply amendments programmatically; catastrophic if wrong. Founder is the decider. | Always surface a confirmation gate. "Commit this amendment? Y/N". Final approval is non-negotiable even in Apply step. |
| **Filesystem writes to `/agents/<role>/` for managed agents** | Managed mode agents use UUID-based paths. Writing to friendly paths silently corrupts the dual-path contract. | Always check `adapter_config.instructionsBundleMode`. Route writes to UUID path for managed; external path for external. Never assume. |
| **Standalone CLI mode** | Compass is a plugin only. Hermetic, in-app, no founder SSH/heredoc/quoting burden. | Build the plugin. Don't ship a CLI companion tool. Plugin SDK is the interface. |
| **Separate plugin-local SQLite for persistence** | Tempting for offline support or isolated state. Breaks Paperclip's versioning + audit. | Use Paperclip's `documents` table for engagement memory. Native, versioned, survived reinstall, auditable. |
| **LLM classifier for mode detection** | Adds token cost, latency, non-determinism. Hard rules are fast + predictable + debuggable. | Deterministic hard rules only. If edge case, let founder override. |
| **Multiple drift windows per company** | Founder wants consistency. 30-day window is standard; configurability adds complexity without value in v1. | Fixed 30-day window. If founder needs different window, capture as future feature request. |
| **Agent instruction templating without version control** | Instructions drift from template; audit trail breaks. Agent instructions must be versioned separately. | Parameterized templates (yes) → versioned output in `AGENTS.md` or managed bundle. Don't create "always in-sync templates"; create "initialized from template" + track divergence. |
| **Comprehensive runbook/playbook generation** | Tempting to generate "daily ops playbook" or "escalation runbook". Out of scope; founders manage agent workflows separately. | VISION.md + Amendment Protocol establish the strategic frame. Agent workflows are separate domain (Paperclip's heartbeat, skills, issues). |
| **Autonomous agent decision-making on VISION rewrites** | LLM re-interprets VISION without founder context. Adds hallucination risk. | Plugin is a mirror + advisor, not an actor. Founder approves all changes. |

## Feature Dependencies

Map what depends on what. MVP can't skip a foundation.

```
Found mode → Agent provisioning (requires preset selection)
       ↓
    Wakeup queueing (agents must be created first)

Assess mode → Drift detection (requires VISION to exist + 30 days of agent activity)
       ↓
    Amendment Protocol (drift findings surface as proposed amendments)

Revive mode → Diagnostic flowchart (requires inventory + blocker scan)
       ↓
    Sample-pivot pattern (one-click action in Revive findings)
       ↓
    Founder-action queue (unblock recommendations surface here)

Reposition mode → Scoped vision-quest re-run (asks only about changed sections)
       ↓
    Amendment Protocol (targeted amendments route through approval gate)

Engagement memory → Prior findings (engagement history doc must exist to surface priors)
       ↓
    Scheduled check-ins (routines trigger Assess/Revive, priors inform context)

All modes → Dual-path agent instruction awareness (must route provisioning + amendments correctly)
        ↓
    Approval routing (all amendments need governance)
```

## MVP Recommendation

Ship all 6 milestones (per PROJECT.md) because the taxonomy is load-bearing. Partial release loses value.

### Prioritize in Build Order

1. **Milestone 1: Skeleton + Inventory + Mode Detection** — Read-only diagnostic foundation. Lowest risk, validates architecture.
2. **Milestone 2: Found mode** — Porting vision-quest interview + provisioning. Core value for founders starting companies.
3. **Milestone 3: Assess mode** — Drift detection. First instance of the "advisor" pattern (detect + surface findings + propose amendments).
4. **Milestone 4: Revive mode** — Diagnostic flowchart + sample-pivot. Most novel feature, validates "one-click unblock" UX.
5. **Milestone 5: Reposition mode** — Lightest mode (scoped interview). Validates that all modes share the same amendment infrastructure.
6. **Milestone 6: Engagement memory + routines** — Persistence + scheduled checks. Completes the "always-on advisor" experience.

### Why This Order

- Milestones 1–2 de-risk the plugin shell + interview porting.
- Milestone 3 proves the "drift → amendment → cascade" loop works.
- Milestone 4 proves novel Revive-specific features (diagnostics, sample-pivot) add real value.
- Milestone 5 proves all modes share the amendment + approval infrastructure.
- Milestone 6 proves long-term engagement (memory, routines) works without adding new schema.

### Defer (Post-MVP)

- Multiple drift windows per company (use fixed 30-day, capture feedback)
- LLM-driven free-form chat router (start with manual mode selection, add later)
- Comprehensive runbook generation (out of scope)
- Deep agent skill auto-recommendation (future feature; stays in Company Wizard's domain)

## Cross-Mode Primitives

These appear in every mode and must be built once, reused everywhere.

### Core Primitives

| Primitive | Used By | Implementation Notes |
|-----------|---------|----------------------|
| **Inventory step** | All modes | Reads: agents, roles, skills, recent issues, heartbeats, VISION status, blockers. Renders as dashboard. |
| **Mode detection** | Plugin entry | Hard rules: Found / Assess / Revive / Reposition. Deterministic. Founder override available. |
| **Inline preview** | Found, Assess, Revive, Reposition | Markdown editor showing proposed VISION changes, agent manifest, issues. Editable before apply. |
| **Approval routing** | Found, Assess, Revive, Reposition | Routes through Amendment Protocol. Configurable per company: founder or founder+ceo. |
| **Apply step** | Found, Assess, Revive, Reposition | Writes VISION.md, provisions agents, creates issues, queues wakeups. Single transaction or atomicity-aware batching. |
| **Wakeup queueing** | Found, Assess, Revive, Reposition | Queues `agent_wakeup_requests` with idempotency keys. No manual cron. |
| **Engagement memory** | All modes | Persists findings, timestamps, decisions in `documents` table. Survives session close. |
| **Dual-path agent awareness** | Found, Assess, Revive | Reads `adapter_config.instructionsBundleMode`, routes writes correctly. |

## Per-Mode Feature List

### Found Mode (Founding a New Company)

| Feature | Deliverable | Complexity |
|---------|-------------|-----------|
| Full 6-section vision-quest interview | Interactive questionnaire (30–50 questions) | Large |
| VISION.md generation | Structured document with all template sections | Medium |
| Preset selection + agent provisioning | CEO + specialized roles per chosen preset | Medium |
| Kickoff issues | Initial backlog issues for first projects | Low |
| Wakeup queueing | Agents begin heartbeating immediately | Low |
| Engagement memory (session #1 recorded) | Initial engagement timestamp + answers snapshot | Low |

### Assess Mode (Auditing Healthy Company)

| Feature | Deliverable | Complexity |
|---------|-------------|-----------|
| Inventory snapshot | Current state dashboard | Medium |
| Drift detection (30-day window) | Report: observed behavior vs. VISION intent | Large |
| Per-area calibration briefs | Specific findings for revenue, product, growth, CEO autonomy | Large |
| Proposed amendments | Suggested VISION updates to reflect observed state | Medium |
| Amendment routing | Through approval gate (founder / founder+ceo) | Low |
| Cascade plan | Downstream issues for affected pods | Medium |
| Engagement memory update | Latest engagement findings recorded | Low |

### Revive Mode (Unblocking Stalled Company)

| Feature | Deliverable | Complexity |
|---------|-------------|-----------|
| Inventory snapshot | Current state (with extra blocker detail) | Medium |
| Revival diagnostic flowchart | Classify stall: blocker? drift? integration? governance loop? dead agent? | Large |
| Unblock recommendations | Specific actions for each stall cause | Medium |
| Sample-pivot pattern | One-click reframe existing work as samples for critique | Large |
| Founder-action queue | Prioritized list of founder-only decisions needed | Medium |
| Engagement memory update | Diagnostic findings, recommendations, sample-pivot status | Low |

### Reposition Mode (Strategic Shift)

| Feature | Deliverable | Complexity |
|---------|-------------|-----------|
| Founder-described shift input | Chat or form: "competitor appeared, pivot to B2B", etc. | Low |
| Scoped vision-quest re-run | Only question sections affected by shift | Medium |
| Targeted VISION amendments | Rewrite only changed sections (revenue, product, growth) | Medium |
| Brand/voice/scope cascade plan | Downstream changes to affected pods (marketing, sales, product) | Medium |
| Amendment routing | Through approval gate | Low |
| Engagement memory update | Strategic shift logged + proposed changes | Low |

## Lifecycle Features

Spanning multiple sessions.

| Feature | When Active | Notes |
|---------|-----------|-------|
| **Engagement memory** | All sessions | Persists prior findings, last engagement date, open recommendations. Surfaces at mode entry. |
| **Scheduled drift reviews (quarterly)** | Triggered via routine | Assess mode on schedule. Prior findings surface for comparison. |
| **Scheduled trust-gate reviews (monthly)** | Triggered via routine | Check CEO autonomy section of VISION vs. recent decision patterns. Alert if drift. |
| **Amendment changelog** | Persistent in VISION.md | Dated entries for every strategic change. Audit trail for founder. |

## MVP Feature Checklist

For the FEATURES.md reader evaluating Compass readiness:

- [ ] **Inventory step** renders full company state (agents, skills, blockers, VISION status)
- [ ] **Mode detection** correctly classifies Found / Assess / Revive / Reposition with founder override
- [ ] **Found mode** ports all 6 vision-quest sections and generates complete VISION.md
- [ ] **Assess mode** detects drift and proposes amendments with calibration briefs per area
- [ ] **Revive mode** diagnoses stall cause and offers sample-pivot + founder-action queue
- [ ] **Reposition mode** handles scoped strategic shifts with targeted amendments
- [ ] **Amendment Protocol** enforced: default-NO, founder confirmation gate, dated changelog
- [ ] **Approval routing** configurable per company (founder / founder+ceo)
- [ ] **Engagement memory** survives plugin close/reopen; prior findings surface
- [ ] **Wakeup queueing** agents heartbeat immediately on Apply
- [ ] **Dual-path agent awareness** correct routing for managed vs. external instructions
- [ ] **Inline preview** shows proposed changes before Apply
- [ ] **Scheduled check-ins** (routines) auto-trigger Assess/Revive periodically

## Sources

- [Company Wizard features](https://github.com/yesterday-ai/paperclip-plugin-company-wizard) — preset library, module system, provisioning patterns, AI/manual mode toggle, inline editing
- [Paperclip Vision interview structure](https://github.com/aronprins/paperclip-vision) — 6-section interview, VISION.md template, Amendment Protocol
- [Paperclip core APIs](https://github.com/paperclip-ing/paperclip) — documents, issues, agents, routines, approvals tables; Plugin SDK
- [Agent operations observability patterns](https://ardor.cloud/blog/ai-agent-monitoring-essential-metrics-and-best-practices) — monitoring, diagnostics, performance metrics
- [Approval workflow governance](https://spendmatters.com/2026/03/24/approvals-and-controls-scaling-governance-without-slowing-execution/) — routing, role-based authority, escalation patterns
- [AI organization tools landscape](https://dust.tt/blog/top-ai-agent-tools) — multi-agent collaboration, governance, founder copilot patterns
