---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 01
status: executing
last_updated: "2026-05-03T05:46:17Z"
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 3
  completed_plans: 0
  percent: 0
---

# STATE — Compass Project Memory

**Project:** Paperclip Plugin — Strategic Consultant for AI Company Lifecycle  
**Initialized:** 2026-05-02  
**Current Phase:** 01
**Status:** Executing Phase 01

## Project Reference

**Core Value:** Founders get one in-app surface for strategic + operational guidance across the full company lifecycle, with every change written natively into Paperclip — no founder-side tooling roundtrip.

**Key Constraint:** All 6 milestones must ship for v1.0 — no partial release.

**Milestone Structure:** Pre-determined by PROMPT.md, derived directly into 6-phase roadmap:

1. Skeleton + Inventory + Mode Detection (read-only diagnostic)
2. Found Mode (vision-quest interview → VISION.md → agent provisioning)
3. Assess Mode (drift audit → amendments → cascade)
4. Revive Mode (diagnostic flowchart → action queue → sample-pivot)
5. Reposition Mode (scoped re-interview → targeted amendments)
6. Engagement Memory + Scheduled Check-ins (persisted state + routines)

## Current Position

Phase: 01 (skeleton-inventory-mode-detection) — EXECUTING
Plan: 2 of 3 — COMPLETE
| Component | Status | Details |
|-----------|--------|---------|
| Roadmap | Complete | 6 phases, 72 requirements mapped, 100% coverage |
| Phase 1 Plan 1 | Complete | 4 tasks, 17 files, 5 commits (exec + summary) |
| Phase 1 Plan 2 | Complete | 3 tasks, 3 files created, 6 files modified, 2 commits (exec + summary) |
| Execution | In Progress | Plan 3 (UI dashboard) ready to begin |
| Distribution | Not started | npm + Paperclip plugin manager pending |

## Coverage Summary

**Requirements:** 72 total v1

- SKEL: 12 (Skeleton — plugin shell, packaging, testing)
- INV: 7 (Inventory — read DB + filesystem + git)
- MODE: 4 (Mode Detection — auto-detect + override)
- FOUND: 12 (Found Mode — vision-quest + provisioning)
- ASSESS: 9 (Assess Mode — drift report + amendments)
- REVIVE: 7 (Revive Mode — diagnostic + action queue)
- REPO: 5 (Reposition Mode — scoped re-interview)
- MEM: 6 (Engagement Memory — persisted state + routines)
- XC: 10 (Cross-Cutting — SDK adapter, idempotency, tests)

**Mapped:** 72/72 (100%)

## Key Decisions

| Decision | Rationale | Implementation |
|----------|-----------|-----------------|
| 6 coarse-grained phases | Founder wants full taxonomy; each milestone is self-contained and shippable | Phases match PROMPT.md milestones exactly |
| Phase 1 is read-only | Diagnostic dashboard foundation; zero DB writes until Found mode | XC-06 enforces no-write checks; all VISION/agent/issue writes require explicit founder gate |
| SDK adapter chokepoint (XC-01) in Phase 1 | No direct Postgres, no raw HTTP, no filesystem for managed agents | All writes route through `src/sdk/adapter.ts` in Phase 2+ |
| Hard-rules mode detection (not LLM) | Predictable, fast, debuggable, zero token cost | MODE-01/MODE-02 use deterministic rules; MODE-04 uses lightweight keyword classifier for chat |
| Amendment Protocol default-NO | Safety: preserve intent until founder approves; cascade visibility | ASSESS-05, REPO-04 enforce dated changelog on YES |
| Engagement memory in `documents` table | Native to Paperclip, versioned, no invasive migrations, survives plugin reinstall | MEM-02 stores `compass-engagement-history` doc; MEM-01/MEM-03/MEM-04 reference it |

## Performance Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Phase 1 → 2 lead time | TBD | — |
| Founder interview time (Found mode) | ~30–50 min | Inherited from vision-quest |
| Drift detection false-positive rate | <10% | Confidence scoring in ASSESS-02 |
| Sample-pivot setup time | <2 min | One-click action per REVIVE-04 |

## Accumulated Context

### Inherited Source Repos

- **company-wizard** (`yesterday-ai/paperclip-plugin-company-wizard`) — TypeScript/React plugin chassis, preset library, provisioning code, UX shells
- **vision-quest** (`aronprins/paperclip-vision`) — 6-section interview structure, VISION.md template, Amendment Protocol, operating philosophy framework

### Paperclip Schema Load-Bearing Tables

- `agents` (id, role, status, last_heartbeat_at, adapter_config)
- `issues` (company_id, identifier, title, description, status, assignee_agent_id)
- `documents` (company_id, title, latest_body) — stores VISION.md and compass-engagement-history
- `approvals` (company_id, type, status, payload, decided_by_user_id) — routes amendments when `founder+ceo` approval required
- `agent_wakeup_requests` (company_id, agent_id, idempotency_key, status) — queues heartbeats
- `routines` (company_id, title, schedule, status) — triggers scheduled check-ins

### Critical Patterns

1. **Dual-path agent instructions:** `adapter_config.instructionsBundleMode` = 'managed' (UUID path) or null (external friendly path). Phase 2+ must inspect before every write.
2. **No-write enforcement:** Phase 1 validates that zero DB writes occur during inventory; XC-06 enforces approval gates before all VISION/agent/issue writes.
3. **Idempotency keys:** Every `agent_wakeup_requests` insert includes idempotency_key to prevent duplicates on retry (XC-03).
4. **Founder approval gates:** Two-stage gate on all Apply steps — preview + "I confirm" modal (FOUND-11, ASSESS enforcement, REPO-04).
5. **Amendment Protocol:** Every VISION write includes dated changelog entry on YES; default behavior is NO (preserves intent) (ASSESS-05, REPO-04).

### Contributor Notes

- **Aron Prins** offered co-maintainership; build assumes he joins. README + outreach issue (per COLLAB.md). CODEOWNERS + DECISIONS.md established for two-maintainer governance (SKEL-10).
- **Non-developer founder:** Plugin must automate everything; hard-coded content over abstractions; founder-friendly UX.
- **Production safety:** Compass runs against live Paperclip companies (Pictor.pro, Candlewood Lake Weekly, RaiseYourGlass.ai). No direct Postgres writes, no unvetted cascades, no heartbeat disruption.

## Execution Summary — Phase 1 Plan 1 & 2

### Plan 1 (Plugin Skeleton)

**Completed:** 2026-05-03 06:15:00 UTC  
**Duration:** 38 minutes

**Tasks Executed:**
1. ✓ Task 1: Set up plugin project structure and TypeScript configuration
2. ✓ Task 2: Create plugin manifest and worker entry point with schema validation
3. ✓ Task 3: Establish SDK adapter chokepoint and schema validator utilities
4. ✓ Task 4: Create governance and contributor documentation

**Commits:**
- 5b42d5f: feat(01-01): set up plugin project structure and TypeScript configuration
- 2197881: feat(01-01): create plugin manifest and worker with schema validation
- 2767a0c: feat(01-01): establish SDK adapter chokepoint and schema validator utilities
- 7d6d573: docs(01-01): add governance and contributor documentation
- b256aad: docs(01-01): complete plan summary with execution results

**Requirements Coverage:**
- SKEL: 10/12 (SKEL-01, SKEL-02, SKEL-04, SKEL-05, SKEL-06, SKEL-07, SKEL-09, SKEL-10, SKEL-11, SKEL-12)
- INV: 2/7 (INV-06, INV-07)
- XC: 1/10 (XC-01)
- Total Plan 1: 13/29 requirements

### Plan 2 (Inventory Snapshot + Mode Detection)

**Completed:** 2026-05-03 05:46:17 UTC  
**Duration:** 4 minutes

**Tasks Executed:**
1. ✓ Task 1: Implement inventory snapshot types and loader
2. ✓ Task 2: Implement deterministic mode detection logic
3. ✓ Task 3: Wire inventory and mode detection into worker setup

**Commits:**
- 9977c6f: feat(01-02): implement inventory snapshot and deterministic mode detection
- 4da7615: docs(01-02): complete plan summary with execution results

**Requirements Coverage:**
- INV: 4/7 (INV-01, INV-02, INV-03, INV-07)
- MODE: 3/4 (MODE-01, MODE-02, MODE-04)
- XC: 1/10 (XC-06)
- Total Plan 2: 8/29 requirements
- **Phase 1 Cumulative: 21/29 requirements (72%)**

**Deviations (All Auto-Fixed):**
1. Rule 1: Fixed SDK API compatibility (camelCase field names)
2. Rule 1: Updated manifest capabilities to match SDK API
3. Rule 1: Fixed import paths for ESM/Node16 compatibility
4. Rule 2: Added minimal UI stub for build completion
5. Rule 1: Fixed package.json SDK version constraint

**Architecture Locked In:**
- D-04: Inventory loads once on plugin open, passed to mode detection
- D-20: Mode detection as pure functions (no I/O)
- D-21: InventorySnapshot typed payload passed to mode controllers
- MODE-01/MODE-02: Hard rules only (no LLM), deterministic output
- MODE-04: Lightweight keyword classifier for chat routing
- D-09: Mode override persistence in worker-state

---

## Open Questions / Blockers

None. Plans 1 & 2 complete. Plan 3 (UI Dashboard) ready to begin.

---

**Last updated:** 2026-05-03 05:46:17 UTC (Plan 2 execution complete)  
**Next action:** Execute Phase 1 Plan 3 (Main UI Panel + Chat Shell)
