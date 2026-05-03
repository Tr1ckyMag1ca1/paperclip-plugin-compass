# STATE — Compass Project Memory

**Project:** Paperclip Plugin — Strategic Consultant for AI Company Lifecycle  
**Initialized:** 2026-05-02  
**Current Phase:** None (roadmap created, awaiting planning)  
**Status:** Awaiting `/gsd-plan-phase 1` to begin Phase 1 planning

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

| Component | Status | Details |
|-----------|--------|---------|
| Roadmap | Complete | 6 phases, 72 requirements mapped, 100% coverage |
| Phase 1 Plan | Pending | Awaiting `/gsd-plan-phase 1` |
| Execution | Not started | No commits yet |
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

## Open Questions / Blockers

None at roadmap stage. Deferred to phase planning.

---

**Last updated:** 2026-05-02 (roadmap creation)  
**Next action:** `/gsd-plan-phase 1` to decompose Phase 1 into executable plans
