# Requirements: Compass — Paperclip Plugin

**Defined:** 2026-05-02
**Core Value:** Founders get one in-app surface for strategic + operational guidance across the full company lifecycle, with every change written natively into Paperclip — no founder-side tooling roundtrip.

## v1 Requirements

Requirements for initial release. All 6 milestones must ship for v1.0 (founder mandate — no partial vertical slice).

### Skeleton

- [ ] **SKEL-01**: Plugin loads cleanly in a local Paperclip dev instance with no manifest or runtime errors
- [ ] **SKEL-02**: Sidebar entry "Compass" is registered and opens the main panel
- [ ] **SKEL-03**: Main panel shell renders with chat panel, manual panel, and inline-preview placeholder
- [ ] **SKEL-04**: Plugin packages via `@paperclipai/plugin-sdk/bundlers` preset and produces a valid manifest + worker + UI bundle
- [ ] **SKEL-05**: React 19 declared as peer dependency, never bundled
- [ ] **SKEL-06**: Plugin installable via npm (`@paperclipai/paperclip-plugin-compass`) AND via Paperclip plugin manager local-path/registry install per https://docs.paperclip.ing/#/administration/plugins/plugins
- [ ] **SKEL-07**: TypeScript strict mode enabled; tsconfig extends Paperclip core base
- [ ] **SKEL-08**: Vitest test harness wired with `@paperclipai/plugin-sdk/testing` mock host
- [ ] **SKEL-09**: README credits Aron Prins prominently and links to vision-quest origin
- [ ] **SKEL-10**: CODEOWNERS + DECISIONS.md established for two-maintainer governance
- [ ] **SKEL-11**: Repository licensed MIT with LICENSE file
- [ ] **SKEL-12**: SCHEMA.md documents Paperclip schema assumptions (agents, issues, documents, wakeups, etc.) for future audit

### Inventory

- [ ] **INV-01**: Inventory step reads agents (id, role, status, last_heartbeat_at, adapter_config) for the active company via Plugin SDK
- [ ] **INV-02**: Inventory step reads filesystem state for the company (VISION.md presence, BOOTSTRAP.md presence, key documents)
- [ ] **INV-03**: Inventory step reads recent git/issue activity (last 30 days of issues and issue_comments)
- [ ] **INV-04**: Inventory snapshot renders to the main panel showing company state at a glance
- [ ] **INV-05**: Inventory step is read-only — no DB writes occur during inventory
- [ ] **INV-06**: Schema validation runs on plugin load and surfaces an error if Paperclip schema is incompatible
- [ ] **INV-07**: Inventory snapshot is exposed to mode controllers as a typed payload (not re-queried per mode)

### Mode Detection

- [ ] **MODE-01**: Mode auto-detects on plugin open via deterministic hard rules (no LLM classifier)
- [ ] **MODE-02**: Detection rules cover: Found (no VISION + no agents), Assess (VISION + heartbeats recent), Revive (VISION + no recent heartbeats OR blockers piling), Reposition (healthy + founder-initiated)
- [ ] **MODE-03**: Founder can override the auto-detected mode from the main panel
- [ ] **MODE-04**: Free-form chat input routes to the right mode via lightweight keyword classifier (no LLM in v1)

### Found Mode

- [ ] **FOUND-01**: Found mode runs the full 6-section vision-quest interview (big picture, revenue & customers, growth & marketing, product direction, CEO autonomy, vision & identity)
- [ ] **FOUND-02**: Interview content lives in `src/content/interview-prompts.ts` (or markdown), parameterized — not inlined in TSX components
- [ ] **FOUND-03**: Interview state persists across plugin reloads (founder can resume mid-interview)
- [ ] **FOUND-04**: Found mode generates VISION.md with full vision-quest structure (mission / 12-mo goal / 3-yr vision / target customer / voice / issue structure / locality / revenue model / launch plan / trust governance / growth strategy / sales model / product direction / org structure / operating philosophy / CEO mandate / principles / amendment protocol / success criteria)
- [ ] **FOUND-05**: Founder previews the proposed VISION.md inline and can edit before apply
- [ ] **FOUND-06**: Apply step writes VISION.md to the `documents` table via Plugin SDK and links it to the company
- [ ] **FOUND-07**: Apply step provisions agents per the chosen preset (presets inherited from company-wizard chassis)
- [ ] **FOUND-08**: Agent provisioning routes instruction writes correctly based on `adapter_config.instructionsBundleMode` (managed UUID path vs external friendly path)
- [ ] **FOUND-09**: Apply step creates kickoff issues for the freshly provisioned agents
- [ ] **FOUND-10**: Apply step queues `agent_wakeup_requests` with idempotency keys so the company starts heartbeating immediately
- [ ] **FOUND-11**: Two-stage approval gate (preview + final "I confirm" modal) before apply touches VISION.md or agents
- [ ] **FOUND-12**: Generated VISION.md passes the vision-quest "Quality Checklist" (every section populated, no placeholders, mandate complete)

### Assess Mode

- [ ] **ASSESS-01**: Assess mode runs a drift report comparing VISION sections vs the last 30 days of agent activity (issues, issue_comments, documents)
- [ ] **ASSESS-02**: Drift report assigns a confidence score per drift item to mitigate false positives/negatives
- [ ] **ASSESS-03**: Drift report renders to the main panel grouped by VISION section with proposed amendments
- [ ] **ASSESS-04**: Founder reviews each drift item and approves/rejects per item before any amendment is generated
- [ ] **ASSESS-05**: Amendment Protocol enforced — every amendment includes a dated changelog entry (default-NO behavior preserved)
- [ ] **ASSESS-06**: Approval routing is per-company configurable: `founder` (default) | `founder+ceo` | configurable
- [ ] **ASSESS-07**: When `founder+ceo` is selected, amendment routes through Paperclip `approvals` table for CEO agent review before founder confirmation
- [ ] **ASSESS-08**: Apply step writes VISION amendments and creates downstream issues per the cascade plan for affected pods/agents
- [ ] **ASSESS-09**: Context-refresh step surfaces prior engagement findings before re-running recommendations (prevents memory rot)

### Revive Mode

- [ ] **REVIVE-01**: Revive mode runs a deterministic diagnostic flowchart classifying the stall cause: single-blocker / strategic drift / broken integration / governance loop / dead agent
- [ ] **REVIVE-02**: Diagnostic produces a founder-action queue — a single document enumerating blocking items in priority order
- [ ] **REVIVE-03**: Founder-action queue links each action to the specific agent, issue, or VISION section it unblocks
- [ ] **REVIVE-04**: Revive mode offers the sample-pivot pattern as a one-click action: existing drafts are reframed as samples for a critique pass; a fresh production-quality issue is created in parallel under the calibrated standard
- [ ] **REVIVE-05**: Sample-pivot creates dual issues (sample + production) with explicit linking and a SAMPLE_PIVOT.md doc explaining the pattern
- [ ] **REVIVE-06**: Cascade plan applies agent screening — excludes newly-provisioned agents and surfaces detected custom overrides for founder confirmation
- [ ] **REVIVE-07**: Apply step queues all wakeups with idempotency keys after blockers are addressed

### Reposition Mode

- [ ] **REPO-01**: Reposition mode runs a scoped vision-quest re-interview — only the sections affected by the founder-described strategic shift
- [ ] **REPO-02**: Output is targeted (only changed VISION sections) — not a full rewrite
- [ ] **REPO-03**: Reposition produces a brand/voice/scope cascade plan covering affected pods and agents
- [ ] **REPO-04**: Apply step routes amendments through Amendment Protocol (per-company approval routing)
- [ ] **REPO-05**: Cascade preserves intentional agent variance and custom overrides (granular per-agent confirmations available)

### Engagement Memory

- [ ] **MEM-01**: Plugin persists per-company engagement state (last engagement date, prior findings, open recommendations) across sessions
- [ ] **MEM-02**: Engagement memory stored as a `compass-engagement-history` document in Paperclip's `documents` table — no new schema migration to Paperclip core
- [ ] **MEM-03**: Engagement memory tracks finding status: open / addressed / invalidated, with timestamps
- [ ] **MEM-04**: A "history" tab in the plugin UI surfaces prior engagement findings per company
- [ ] **MEM-05**: Recurring strategic check-ins can be scheduled via Paperclip `routines` (e.g., quarterly drift review, monthly trust-gate review)
- [ ] **MEM-06**: Scheduled routines auto-trigger Assess or Revive mode and post results back as engagement memory entries

### Cross-Cutting

- [ ] **XC-01**: All Paperclip writes route through a single `src/sdk/adapter.ts` chokepoint — no direct Postgres, no raw HTTP, no filesystem writes outside the SDK
- [ ] **XC-02**: Apply step is transactional — referential integrity validated before writes; rollback path exists if any write fails
- [ ] **XC-03**: All `agent_wakeup_requests` inserts include an `idempotency_key` to prevent duplicates on retry
- [ ] **XC-04**: Plugin never reads `company_secrets` values — only key names via Plugin SDK
- [ ] **XC-05**: Plugin never writes to `/agents/<role>/` filesystem paths for managed-mode agents — `adapter_config.instructionsBundleMode` is inspected before every instruction write
- [ ] **XC-06**: Auto-edit of VISION.md is impossible — every code path that writes VISION requires explicit founder confirmation gate
- [ ] **XC-07**: Vision-quest interview content is portable — markdown or TS-export, editable by Aron Prins without touching React/UI code
- [ ] **XC-08**: Unit tests cover: mode detection rules, drift detection logic, sample-pivot logic, dual-path adapter routing, idempotency-key generation
- [ ] **XC-09**: Integration tests run against the Plugin SDK mock host (`createTestHarness`) and cover end-to-end Apply flows for each mode
- [ ] **XC-10**: Conventional Commits format used throughout

## v2 Requirements

Deferred to future releases. Tracked but not in current roadmap.

### Configurability

- **V2-01**: Founder-configurable drift window (currently fixed at 30 days)
- **V2-02**: LLM-based mode classifier as alternative to hard rules (opt-in)
- **V2-03**: LLM-based chat-to-mode router (currently keyword classifier)
- **V2-04**: Conditional approval routing based on amendment magnitude

### Scope Expansion

- **V2-05**: Cross-company portfolio view (compare drift across multiple companies)
- **V2-06**: Compass-suggested presets based on inferred company stage
- **V2-07**: Engagement history visualizations / trend lines

### Polish

- **V2-08**: Founder onboarding tour for first-time Compass users
- **V2-09**: Localization (i18n) for non-English founders
- **V2-10**: Plugin update notifications inside the panel

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Standalone CEO_BOOTSTRAP.md generator | Paperclip already has BOOTSTRAP.md + Wizard provisioning; vision-quest's standalone bootstrap doc was redundant |
| Vision-quest Step-0 folder-scan | Replaced by deeper inventory step that reads DB + filesystem + git via Plugin SDK |
| Direct Postgres writes from plugin code | Plugin SDK only — preserves portability, avoids RLS/audit bypass, future-proof |
| Reading `company_secrets` values | Only key names; values handled by Paperclip's secret API, not plugin |
| Filesystem writes to `/agents/<role>/` for managed-mode agents | Must check `adapter_config.instructionsBundleMode` and route to UUID-based managed path |
| Auto-edit of VISION.md without founder approval | Even Apply step requires final confirmation gate — production-VPS blast radius is real |
| Standalone CLI mode | Compass is a plugin only; no separate binary, no founder SSH burden |
| LLM-driven mode detection in v1 | Hard rules are deterministic, fast, debuggable, zero token cost — better fit for v1 |
| Single-tenant scope optimization | Compass targets the open-source community, not a personal tool — broader UX required |
| New schema migrations to Paperclip core | Engagement memory lives in `documents` table — no invasive changes to Paperclip schema |
| Provider-pin per-agent | Out of Compass's scope — handled at Paperclip/Manifest layer |

## Traceability

Empty until roadmap creation. Will be populated by `gsd-roadmapper`.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (populated by roadmapper) | | |

**Coverage:**
- v1 requirements: 67 total
- Mapped to phases: 0
- Unmapped: 67 ⚠️ (roadmapper to resolve)

---
*Requirements defined: 2026-05-02*
*Last updated: 2026-05-02 after initial definition*
