# Compass — Roadmap

**Project:** Paperclip Plugin — Strategic Consultant for AI Company Lifecycle  
**Granularity:** Coarse (6 phases, each a self-contained milestone)  
**Coverage:** 72/72 requirements mapped  
**Last updated:** 2026-05-02

## Phases

- [ ] **Phase 1: Skeleton + Inventory + Mode Detection** - Plugin loads cleanly with diagnostic dashboard
- [ ] **Phase 2: Found Mode** - New companies can be founded from vision-quest interview
- [ ] **Phase 3: Assess Mode** - Active companies can audit drift via 30-day lookback
- [ ] **Phase 4: Revive Mode** - Stalled companies can diagnose blockers and unlock
- [ ] **Phase 5: Reposition Mode** - Healthy companies can execute strategic shift
- [ ] **Phase 6: Engagement Memory + Scheduled Check-ins** - Plugin remembers findings and auto-triggers reviews

## Phase Details

### Phase 1: Skeleton + Inventory + Mode Detection

**Goal:** Plugin loads cleanly as a diagnostic dashboard, founder can see company state at a glance, auto-detect mode with override capability. Read-only — no DB writes.

**Depends on:** Nothing (first phase).

**Requirements:** SKEL-01 through SKEL-12, INV-01 through INV-07, MODE-01 through MODE-04, XC-01, XC-06

**Success Criteria** (what must be TRUE when this phase ships):
1. Plugin sidebar entry "Compass" opens the main panel in a Paperclip dev instance with no runtime errors
2. Inventory snapshot renders showing agent count, VISION.md presence, recent issues, and git activity — without triggering any DB writes
3. Mode auto-detects to one of {Found, Assess, Revive, Reposition} based on hard rules; founder can override from the UI
4. Free-form chat input (e.g., "assess this company") routes to the correct mode via lightweight keyword classifier
5. Plugin passes TypeScript strict mode, Vitest harness wired, README credits Aron Prins, CODEOWNERS + DECISIONS.md established, MIT licensed

**Plans:** TBD

---

### Phase 2: Found Mode

**Goal:** New companies can be founded end-to-end via full vision-quest interview. VISION.md generated and applied, agents provisioned per preset, kickoff issues created, wakeups queued for heartbeating.

**Depends on:** Phase 1 (inventory, mode detection, SDK adapter, zero-write enforcement in place)

**Requirements:** FOUND-01 through FOUND-12, XC-02, XC-03, XC-04, XC-05, XC-07, XC-08

**Success Criteria** (what must be TRUE when this phase ships):
1. Founder can start a vision-quest interview from Found mode chat input; interview has 6 sections (big picture, revenue & customers, growth & marketing, product direction, CEO autonomy, vision & identity) and persists across plugin reloads
2. Interview output generates a complete VISION.md with all required sections (mission, 12-mo goal, 3-yr vision, target customer, voice, issue structure, locality, revenue model, launch plan, trust governance, growth strategy, sales model, product direction, org structure, operating philosophy, CEO mandate, principles, amendment protocol, success criteria) — no placeholders
3. Founder previews proposed VISION.md inline and can edit before apply; two-stage approval gate (preview + final "I confirm" modal) enforces no auto-writes
4. Apply writes VISION.md to documents table via SDK, provisions agents per chosen preset, creates kickoff issues, queues wakeup_requests with idempotency keys — company starts heartbeating on next poll cycle
5. Agent instruction writes route correctly based on `adapter_config.instructionsBundleMode` (managed UUID path vs external friendly path); no filesystem writes for managed agents

**Plans:** TBD

**UI hint**: yes

---

### Phase 3: Assess Mode

**Goal:** Active companies can run drift audit comparing VISION.md vs 30 days of agent activity. Proposed amendments route through Amendment Protocol (founder or founder+CEO approval), cascade issues created for affected agents.

**Depends on:** Phase 2 (Found mode shippped so companies exist, SDK adapter mature, wakeup queueing pattern proven)

**Requirements:** ASSESS-01 through ASSESS-09, XC-02, XC-03, XC-04, XC-08, XC-09

**Success Criteria** (what must be TRUE when this phase ships):
1. Founder can trigger Assess mode on a company with VISION.md; drift report compares each VISION section vs last 30 days of issues, issue_comments, documents with confidence scoring to mitigate false positives
2. Drift report renders grouped by VISION section with inline proposed amendments; founder reviews each drift item and approves/rejects individually before any write occurs
3. Amendment Protocol enforced: every accepted amendment includes a dated changelog entry (default-NO behavior preserved); founder sees the exact VISION.md delta before apply
4. Approval routing per-company configurable as `founder` (default) or `founder+ceo` — when CEO approval required, amendment routes through `approvals` table and waits for CEO agent decision
5. Apply step writes VISION amendments and creates downstream issues for affected pods/agents with explicit linking; cascade respects custom overrides and agent screening (excludes newly-provisioned)

**Plans:** TBD

**UI hint**: yes

---

### Phase 4: Revive Mode

**Goal:** Stalled companies can diagnose root cause (single-blocker, drift, broken integration, governance loop, dead agent) and unlock. Founder-action queue enumerates blocking items; sample-pivot pattern available as one-click reframe.

**Depends on:** Phase 3 (Assess mode for drift detection patterns, cascade logic proven, amendment protocol mature)

**Requirements:** REVIVE-01 through REVIVE-07, XC-02, XC-03, XC-08

**Success Criteria** (what must be TRUE when this phase ships):
1. Founder can trigger Revive mode on a stalled company (VISION exists + no recent heartbeats OR blockers piling); plugin deterministically classifies cause as one of {single-blocker, strategic drift, broken integration, governance loop, dead agent}
2. Diagnostic produces a single founder-action queue document enumerating blocking items in priority order, each linked to the specific agent, issue, or VISION section it unblocks
3. Sample-pivot action reframes existing draft work as "samples for critique pass" and creates a dual-issue structure (sample + production-quality) with explicit linking and SAMPLE_PIVOT.md explanation doc
4. Cascade plan applies agent screening (excludes newly-provisioned agents) and surfaces detected custom overrides for founder confirmation before apply
5. Apply step queues wakeups with idempotency keys after all blockers are addressed; founder can execute recommended unblocks incrementally

**Plans:** TBD

**UI hint**: yes

---

### Phase 5: Reposition Mode

**Goal:** Healthy companies can execute targeted strategic shift. Founder describes the delta, plugin re-runs vision-quest interview scoped to affected sections, proposes VISION amendments and brand/voice/scope cascade plan.

**Depends on:** Phase 4 (Revive for diagnostic patterns, cascade logic, amendment protocol)

**Requirements:** REPO-01 through REPO-05, XC-02, XC-03, XC-04, XC-08

**Success Criteria** (what must be TRUE when this phase ships):
1. Founder can trigger Reposition mode describing a strategic shift (e.g., "rebrand to focus on compliance"); plugin surfaces a scoped vision-quest re-interview touching only affected sections (voice, product direction, target customer, etc.) — not a full rewrite
2. Interview output generates targeted VISION amendments affecting only the changed sections; founder previews and approves via Amendment Protocol before any write
3. Cascade plan covers brand/voice/scope changes across all affected pods and agents with per-agent granularity — custom overrides surface for founder confirmation
4. Apply writes amendments through full Amendment Protocol (per-company approval routing), creates downstream issues for affected agents, queues wakeups with idempotency keys
5. VISION.md preserves intentional agent variance and custom instruction overrides — Reposition does not overwrite agent-specific configs

**Plans:** TBD

**UI hint**: yes

---

### Phase 6: Engagement Memory + Scheduled Check-ins

**Goal:** Plugin remembers per-company engagement findings across sessions. History tab surfaces prior findings. Founder can schedule recurring strategic check-ins (quarterly drift reviews, monthly trust-gate reviews) that auto-trigger and persist results.

**Depends on:** All prior phases (memory system aggregates findings from all modes)

**Requirements:** MEM-01 through MEM-06, XC-07, XC-09, XC-10

**Success Criteria** (what must be TRUE when this phase ships):
1. Plugin persists per-company engagement state (last engagement date, prior findings, open recommendations) in a `compass-engagement-history` document in the `documents` table — survives plugin uninstall/reinstall
2. Plugin UI surfaces a "history" tab showing prior engagement findings per company with status (open / addressed / invalidated) and timestamps; founder can review what Compass recommended in prior sessions
3. Founder can schedule recurring strategic check-ins via Paperclip `routines` (e.g., "quarterly drift review" or "monthly trust-gate review") without leaving the plugin
4. Scheduled routines auto-trigger Assess or Revive mode on schedule and post results back as engagement memory entries — no manual re-run needed
5. Engagement memory integrates with all prior modes (M1–M5); findings from Found/Assess/Revive/Reposition all persist and surface in history tab

**Plans:** TBD

**UI hint**: yes

---

## Requirement Traceability

| Requirement | Phase | Category |
|-------------|-------|----------|
| SKEL-01 | Phase 1 | Skeleton |
| SKEL-02 | Phase 1 | Skeleton |
| SKEL-03 | Phase 1 | Skeleton |
| SKEL-04 | Phase 1 | Skeleton |
| SKEL-05 | Phase 1 | Skeleton |
| SKEL-06 | Phase 1 | Skeleton |
| SKEL-07 | Phase 1 | Skeleton |
| SKEL-08 | Phase 1 | Skeleton |
| SKEL-09 | Phase 1 | Skeleton |
| SKEL-10 | Phase 1 | Skeleton |
| SKEL-11 | Phase 1 | Skeleton |
| SKEL-12 | Phase 1 | Skeleton |
| INV-01 | Phase 1 | Inventory |
| INV-02 | Phase 1 | Inventory |
| INV-03 | Phase 1 | Inventory |
| INV-04 | Phase 1 | Inventory |
| INV-05 | Phase 1 | Inventory |
| INV-06 | Phase 1 | Inventory |
| INV-07 | Phase 1 | Inventory |
| MODE-01 | Phase 1 | Mode Detection |
| MODE-02 | Phase 1 | Mode Detection |
| MODE-03 | Phase 1 | Mode Detection |
| MODE-04 | Phase 1 | Mode Detection |
| FOUND-01 | Phase 2 | Found Mode |
| FOUND-02 | Phase 2 | Found Mode |
| FOUND-03 | Phase 2 | Found Mode |
| FOUND-04 | Phase 2 | Found Mode |
| FOUND-05 | Phase 2 | Found Mode |
| FOUND-06 | Phase 2 | Found Mode |
| FOUND-07 | Phase 2 | Found Mode |
| FOUND-08 | Phase 2 | Found Mode |
| FOUND-09 | Phase 2 | Found Mode |
| FOUND-10 | Phase 2 | Found Mode |
| FOUND-11 | Phase 2 | Found Mode |
| FOUND-12 | Phase 2 | Found Mode |
| ASSESS-01 | Phase 3 | Assess Mode |
| ASSESS-02 | Phase 3 | Assess Mode |
| ASSESS-03 | Phase 3 | Assess Mode |
| ASSESS-04 | Phase 3 | Assess Mode |
| ASSESS-05 | Phase 3 | Assess Mode |
| ASSESS-06 | Phase 3 | Assess Mode |
| ASSESS-07 | Phase 3 | Assess Mode |
| ASSESS-08 | Phase 3 | Assess Mode |
| ASSESS-09 | Phase 3 | Assess Mode |
| REVIVE-01 | Phase 4 | Revive Mode |
| REVIVE-02 | Phase 4 | Revive Mode |
| REVIVE-03 | Phase 4 | Revive Mode |
| REVIVE-04 | Phase 4 | Revive Mode |
| REVIVE-05 | Phase 4 | Revive Mode |
| REVIVE-06 | Phase 4 | Revive Mode |
| REVIVE-07 | Phase 4 | Revive Mode |
| REPO-01 | Phase 5 | Reposition Mode |
| REPO-02 | Phase 5 | Reposition Mode |
| REPO-03 | Phase 5 | Reposition Mode |
| REPO-04 | Phase 5 | Reposition Mode |
| REPO-05 | Phase 5 | Reposition Mode |
| MEM-01 | Phase 6 | Engagement Memory |
| MEM-02 | Phase 6 | Engagement Memory |
| MEM-03 | Phase 6 | Engagement Memory |
| MEM-04 | Phase 6 | Engagement Memory |
| MEM-05 | Phase 6 | Engagement Memory |
| MEM-06 | Phase 6 | Engagement Memory |
| XC-01 | Phase 1 | Cross-Cutting |
| XC-02 | Phase 2 | Cross-Cutting |
| XC-03 | Phase 2 | Cross-Cutting |
| XC-04 | Phase 2 | Cross-Cutting |
| XC-05 | Phase 2 | Cross-Cutting |
| XC-06 | Phase 1 | Cross-Cutting |
| XC-07 | Phase 2 | Cross-Cutting |
| XC-08 | Phase 3 | Cross-Cutting |
| XC-09 | Phase 6 | Cross-Cutting |
| XC-10 | Phase 6 | Cross-Cutting |

**Coverage:**
- v1 requirements: 72 total
- Mapped to phases: 72
- Unmapped: 0

---

## Progress Tracking

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Skeleton + Inventory + Mode Detection | 0/1 | Not started | - |
| 2. Found Mode | 0/1 | Not started | - |
| 3. Assess Mode | 0/1 | Not started | - |
| 4. Revive Mode | 0/1 | Not started | - |
| 5. Reposition Mode | 0/1 | Not started | - |
| 6. Engagement Memory + Scheduled Check-ins | 0/1 | Not started | - |

---

*Roadmap created: 2026-05-02 by gsd-roadmapper*
