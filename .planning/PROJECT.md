# Compass — Paperclip Plugin

## What This Is

Compass is a Paperclip plugin that acts as a strategic consultant for any Paperclip-hosted AI company at any lifecycle stage. It founds new companies, audits existing ones, revives stalled ones, and repositions mature ones — all from inside Paperclip's plugin sidebar with no separate Claude Code session, SSH, or shell scripting required. It combines the plugin chassis from `yesterday-ai/paperclip-plugin-company-wizard` with the strategic-interview depth of `aronprins/paperclip-vision`, ported into a single in-app surface for Paperclip founders.

## Core Value

Founders get one in-app surface for strategic + operational guidance across the full company lifecycle, with every change written natively into Paperclip (documents, agents, issues, comments, wakeups) — no founder-side tooling roundtrip.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Plugin loads cleanly in a local Paperclip dev instance with sidebar entry "Compass"
- [ ] Inventory step reads DB + filesystem + git via the Paperclip Plugin SDK and renders a snapshot
- [ ] Mode auto-detection (Found / Assess / Revive / Reposition) via deterministic hard rules with founder override
- [ ] Found mode: full vision-quest interview (6 sections) → generated VISION.md → agent provisioning per chosen preset → kickoff issues → wakeups queued
- [ ] Assess mode: drift report comparing VISION sections vs last 30 days of agent activity → proposed amendments → cascade plan
- [ ] Revive mode: revival diagnostic flowchart (single-blocker / drift / governance loop / dead agent) → founder-action queue → sample-pivot pattern available as one-click action
- [ ] Reposition mode: scoped vision-quest re-run on deltas → targeted VISION amendments → brand/voice/scope cascade plan
- [ ] Amendment Protocol enforced on every VISION write (default-NO, dated changelog entries on YES)
- [ ] Engagement memory persisted per company in Paperclip `documents` table as `compass-engagement-history`
- [ ] Scheduled strategic check-ins via Paperclip `routines` (quarterly drift review, monthly trust-gate review)
- [ ] Approval gate routing for amendments — per-company config: `founder` | `founder+ceo` | configurable
- [ ] Dual-path agent instruction awareness — read `agents.adapter_config->>'instructionsBundleMode'` and route writes accordingly
- [ ] All wakeups queued with idempotency_key
- [ ] No direct Postgres or filesystem writes for managed-mode agents — Plugin SDK only
- [ ] Distribution: published to npm AND installable through Paperclip's plugin manager per https://docs.paperclip.ing/#/administration/plugins/plugins
- [ ] README credits Aron Prins prominently; codebase structured for two-maintainer collaboration

### Out of Scope

- Standalone CEO_BOOTSTRAP.md generator — Paperclip already has BOOTSTRAP.md + Wizard provisioning; the standalone bootstrap doc was redundant in vision-quest
- Step-0 folder-scan (vision-quest's lightweight scan) — replaced by deeper inventory step
- Direct Postgres writes from plugin code — Plugin SDK only; preserves portability and avoids RLS/audit bypass
- Reading `company_secrets` values — only key names; values handled by Paperclip's secret API
- Filesystem writes to `/agents/<role>/` paths for managed-mode agents — must check `adapter_config.instructionsBundleMode` and route to UUID-based managed path
- Auto-edit of VISION.md without founder approval — even Apply step requires final confirmation gate
- Standalone CLI mode — Compass is a plugin only; no separate binary

## Context

**Ecosystem.** Paperclip is the founder's AI agent platform (live on Hostinger VPS at Tailscale `100.79.31.30:3100`, source mirrored at `~/Development/paperclip-temp/`). Compass is the founder's third Paperclip plugin (after Company Wizard upstream and File Viewer locally at `~/Development/Paperclip/plugin-file-viewer/`).

**Source repos to inherit from.**
- `yesterday-ai/paperclip-plugin-company-wizard` — TypeScript/React plugin chassis. Inherit: manifest, sidebar+main+chat panel UX shells, full preset library, module system + role fallback, AI/manual mode toggle, inline file editing before apply, provisioning code, npm packaging.
- `aronprins/paperclip-vision` (markdown skill) — port the strategic interview content into the Found mode flow. Specifically: 6-section interview structure (big picture, revenue & customers, growth & marketing, product direction, CEO autonomy, vision & identity), full VISION.md template (mission / 12-mo goal / 3-yr vision / target customer / voice / issue structure / locality / revenue model / launch plan / trust governance / growth strategy / sales model / product direction / org structure / operating philosophy / CEO mandate / principles / amendment protocol / success criteria), Amendment Protocol (default-NO + dated changelog), Research → Plan → Execute operating philosophy, audience model framing, voice / red lines / principles patterns. Drop: vision-quest's Step-0 scan and standalone CEO_BOOTSTRAP.md generator.

**Founder profile.** Non-developer (per memory). Workflow preferences: hard-coded over abstract, automate everything, milestone-not-calendar gating. Founder will use Compass on real running companies (Pictor.pro WordPress theme work, Candlewood Lake Weekly, RaiseYourGlass.ai, others) — Compass cannot break heartbeating systems.

**Paperclip schema (load-bearing).** Tables: `agents`, `issues`, `issue_comments`, `issue_documents`, `documents`, `company_secrets`, `approvals`, `agent_wakeup_requests`, `routines`. Critical patterns: dual-path agent instructions (managed UUID vs external friendly-path), company-scoped sequential issue identifiers (`<SLUG>-NNN`), wakeup queueing with idempotency keys, document linkage via `issue_documents.key`.

**Aron Prins.** Co-maintainership offered, response pending. Build assumes he joins. README + outreach issue per PROMPT instructions; codebase structured for two-maintainer collaboration.

**MVP scope.** All 6 milestones must ship for v1.0 — founder wants the full taxonomy, not a partial vertical slice.

## Constraints

- **Tech stack**: TypeScript + React, matching company-wizard conventions and Paperclip plugin standard
- **API surface**: Paperclip Plugin SDK only — no direct Postgres, no raw HTTP REST, no filesystem writes outside the SDK envelope
- **Distribution**: Must work as both npm public package AND Paperclip plugin-manager install (per https://docs.paperclip.ing/#/administration/plugins/plugins)
- **Audience**: Open-source community — broader UX, docs, contribution guidelines required (not a single-tenant tool)
- **Mode detection**: Hard deterministic rules — VISION exists? heartbeats recent? blockers piling? Predictable, debuggable, no LLM tax for classification
- **Drift window**: 30-day lookback for Assess mode (default; not user-configurable in v1)
- **Vision-quest interview**: Full 6-section depth (no condensed mode in v1)
- **Approval routing**: Per-company config — `founder` (default) | `founder+ceo` | configurable
- **Memory storage**: `documents` table only — no new schema migrations to Paperclip core
- **Safety**: Never auto-edit VISION.md without explicit founder confirmation gate, even within Apply step
- **License**: MIT
- **Co-maintainership**: README credits + repo structure assume Aron Prins joins as second maintainer

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Plugin SDK only (no direct Postgres or HTTP REST) | Portable, future-proof, avoids RLS/audit bypass; aligns with Paperclip plugin contract | — Pending |
| Hard-rules mode detection (not LLM classifier) | Predictable, fast, debuggable, zero token cost per detection | — Pending |
| Full vision-quest interview (6 sections, ~30–50 questions) in Found mode | Matches Aron's spec; this is the strategic-depth differentiator vs vanilla company-wizard | — Pending |
| 30-day drift window in Assess mode | Standard signal-to-noise tradeoff; PROMPT default | — Pending |
| Engagement memory in `documents` table (not new schema, not plugin-local sqlite) | Native to Paperclip, versioned, no invasive migrations, survives plugin reinstall | — Pending |
| Per-company configurable amendment-approval routing | Founder may want CEO review on some companies but not others; flexibility without complexity | — Pending |
| All 6 milestones must ship for v1.0 (no partial release) | Founder wants the full mode taxonomy, not a vertical slice | — Pending |
| Distribution via npm + Paperclip plugin manager | Standard OSS pattern; Paperclip plugin manager is the founder-friendly path | — Pending |
| Build assumes Aron Prins co-maintainership | He's been invited; structure-for-collab is cheap to add now, expensive to retrofit | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-02 after initialization*
