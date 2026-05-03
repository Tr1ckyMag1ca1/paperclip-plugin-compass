---
phase: 06-engagement-memory
verified: 2026-05-03T19:45:00Z
status: gaps_found
score: 3/5 must-haves verified
overrides_applied: 0
gaps:
  - truth: "Findings from Found/Assess/Revive/Reposition mode Apply flows persist to engagement history"
    status: failed
    reason: |
      ROADMAP SC #5 requires "Engagement memory integrates with all prior modes (M1–M5); 
      findings from Found/Assess/Revive/Reposition all persist." The runApply, applyAmendments, 
      applyReviveAction, applyReposition handlers in worker.ts do NOT call memory.recordFindings.
      Comments in apply.ts files indicate this is intentionally deferred to Phase 7 (decision D-06),
      but this violates the phase 6 contract. Only routine.run calls recordFindingsToHistory.
    artifacts:
      - path: "src/worker.ts"
        issue: "runApply handler (line 252-315) returns ApplyResult but never calls memory.recordFindings"
      - path: "src/worker.ts"
        issue: "applyAmendments handler (line 386-449) returns result but never calls memory.recordFindings"
      - path: "src/worker.ts"
        issue: "applyReviveAction handler (line 573-634) returns result but never calls memory.recordFindings"
      - path: "src/worker.ts"
        issue: "applyReposition handler (line 1013-1061) returns result but never calls memory.recordFindings"
      - path: "src/found/apply.ts"
        issue: "Line 251: Comment says 'Memory recording deferred to handler layer (Phase 7)'"
      - path: "src/assess/apply.ts"
        issue: "Line 218: Comment says 'Memory recording deferred to handler layer (Phase 7)'"
      - path: "src/revive/apply.ts"
        issue: "Line 226: Comment says 'Handler will call recordFindingsToHistory post-Apply'"
      - path: "src/reposition/apply.ts"
        issue: "Similar deferment comment"
    missing:
      - "Each Apply handler (runApply, applyAmendments, applyReviveAction, applyReposition) must call memory.recordFindings after success"
      - "Record findings from ApplyResult metadata (success, mode, amendments applied, etc.)"
      - "Integration tests for Found/Assess/Revive/Reposition Apply flows verifying findings appear in history"

  - truth: "ASSESS-09 Context-Refresh dedup suppresses repeat drift noise based on prior open findings"
    status: failed
    reason: |
      ASSESS-09 (MEM-03 requirement) requires context-refresh step that surfaces prior findings 
      and suppresses repeat drift noise. The detectDrift function in src/assess/drift.ts accepts 
      an optional priorOpenFindings parameter and implements deduplicateAgainstOpenFindings, 
      but the runDriftAudit handler (line 317-384 in worker.ts) never loads prior findings 
      from engagement history and never passes them to detectDrift. Dedup logic is unit-tested 
      but not integrated.
    artifacts:
      - path: "src/worker.ts"
        issue: "runDriftAudit handler (lines 317-384) calls detectDrift(parsedVision, activity, 30) without priorOpenFindings parameter"
      - path: "src/assess/drift.ts"
        issue: "detectDrift function accepts priorOpenFindings but handler never populates it"
    missing:
      - "runDriftAudit handler must load engagement history and extract open findings before calling detectDrift"
      - "Pass priorOpenFindings to detectDrift for substring-match dedup"
      - "Verify contextRefreshPreamble metadata appears in returned DriftReport"
      - "Integration test: prior open finding should suppress matching new drift signal"

  - truth: "Paperclip scheduler integration for routine.onFire is verified working"
    status: uncertain
    reason: |
      The routine.onFire handler is registered (line 1527-1540 in worker.ts) with a comment 
      "Triggered by Paperclip scheduler when routine cron fires". However, no documentation 
      or test verifies that Paperclip actually calls this handler when a cron fires. This assumes 
      Paperclip SDK supports routines with scheduler callbacks, which is not explicitly verified 
      in the codebase (no handler registration name matches routine.onFire pattern from SDK).
      The routine.run handler is tested and works, but routine.onFire is untested.
    artifacts:
      - path: "src/worker.ts"
        issue: "routine.onFire handler assumes Paperclip scheduler will invoke it (not verified)"
    missing:
      - "Documentation or test showing Paperclip scheduler integration for routines"
      - "Verify handler name matches SDK routine scheduler callback convention"
      - "Test that routine fires automatically at scheduled time (integration test with mock scheduler)"

---

# Phase 6: Engagement Memory + Scheduled Check-ins — Verification Report

**Phase Goal:** Plugin remembers per-company engagement findings across sessions. History tab surfaces prior findings. Founder can schedule recurring strategic check-ins (quarterly drift reviews, monthly trust-gate reviews) that auto-trigger and persist results.

**Verified:** 2026-05-03T19:45:00Z  
**Status:** gaps_found  
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Plugin persists per-company engagement state (last engagement date, prior findings, open recommendations) in documents table | ✓ VERIFIED | Document I/O via adapter.getDocumentByKey/writeDocument; EngagementHistory schema in memory.ts; history-store.ts implements create/read/update operations; worker memory.load handler retrieves document with 60s TTL caching |
| 2 | Findings have a complete lifecycle: open → addressed OR invalidated, with audit trail | ✓ VERIFIED | StatusTransition type with audit trail (from, to, at, by_run_id); transitionStatus function in finding.ts validates state machine; 29 unit tests pass for status transitions; finding.spec.ts tests immutability |
| 3 | Scheduled routines store cron expressions that can be parsed into human-readable strings | ✓ VERIFIED | ScheduledRoutine interface with cron field; cronToReadable utility converts 5-field cron to human text; routine.ts implements validateCronExpression, parseCronExpression, getCronFromPreset; 32 unit tests for routine logic; ScheduleCreationForm validates cron input; ScheduleRoutineRow displays human-readable cron |
| 4 | "History" tab in UI surfaces prior engagement findings with status filtering | ✓ VERIFIED | HistoryPanel component renders findings tab with filters (status: open/addressed/invalidated/all; mode filter); FindingCard shows summary + evidence + status badge + status change buttons; MainPanel routing to history tab via selectedTab === 'history'; HistoryTabBadge shows finding count |
| 5 | Findings from Found/Assess/Revive/Reposition Apply flows persist and surface in history tab | ✗ FAILED | runApply, applyAmendments, applyReviveAction, applyReposition handlers do NOT call memory.recordFindings. Only routine.run records findings. Manual Apply flows (non-routine) do not persist findings to history. ROADMAP SC #5 explicitly requires "findings from Found/Assess/Revive/Reposition all persist". |
| 6 | ASSESS-09: Prior open findings suppress repeat drift noise via substring matching | ✗ FAILED | detectDrift function accepts priorOpenFindings and implements deduplicateAgainstOpenFindings (unit tested). runDriftAudit handler never loads prior findings and never passes them to detectDrift. Dedup logic exists but is not integrated into handler call path. |
| 7 | Founder can schedule recurring check-ins and they auto-trigger Assess/Revive mode | ⚠️ PARTIAL | routine.create handler registers routine in history.routines; routine.run handler dispatches to Assess/Revive and records findings; routine.onFire handler registered but assumes Paperclip scheduler calls it (not verified). No test or documentation confirms Paperclip SDK actually triggers routine.onFire when cron fires. |

**Score:** 3/5 critical truths verified + 2 major gaps + 1 uncertain

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/types/memory.ts` | Type definitions for Finding, ScheduledRoutine, EngagementHistory, FindingStatus | ✓ VERIFIED | 143 lines; complete type definitions; exported in barrel |
| `src/memory/history-store.ts` | Document I/O + worker-state caching for engagement history | ✓ VERIFIED | 200+ lines; implements getEngagementHistory, createEngagementHistory, updateEngagementHistory, recordFindingsToHistory; calls adapter.getDocumentByKey/writeDocument; worker-state cache with 60s TTL; all functions tested |
| `src/memory/finding.ts` | Finding lifecycle & status transition logic | ✓ VERIFIED | 165+ lines; createFinding, transitionStatus, deduplicateAgainstOpenFindings, filterByStatus, filterByMode; 29 unit tests; pure functions, no I/O |
| `src/memory/routine.ts` | Cron parsing + routine scheduling dispatcher | ✓ VERIFIED | 180+ lines; validateCronExpression, parseCronExpression, getCronFromPreset, validateRoutineSchedule, shouldRunRoutine, createRoutine; 32 unit tests; cron validation per 5-field standard |
| `src/memory/cron-readable.ts` | Cron expression → human-readable formatter | ✓ VERIFIED | 80+ lines; cronToReadable converts cron to natural language (e.g., "Every 1st of month at 9am"); 24 unit tests |
| `src/sdk/adapter.ts` | Extended adapter with routine + memory document methods | ✓ VERIFIED | Methods added: getEngagementHistory (via getDocumentByKey), createEngagementHistory/updateEngagementHistory (via writeDocument); routine methods registered in worker (routine.create, routine.delete, routine.run, routine.onFire, routine.listForCompany); chokepoint pattern maintained |
| `src/ui/memory/HistoryPanel.tsx` | Main history tab container with findings + schedules | ✓ VERIFIED | 240+ lines; two-tab container: findings (with filters + cards) + schedules; loading/error states; empty state messaging |
| `src/ui/memory/FindingCard.tsx` | Individual finding card component with status transitions | ✓ VERIFIED | 160+ lines; summary + timestamp + mode badge + status badge + evidence chips + status history + action buttons; status change confirmation modal; async button handling |
| `src/ui/memory/ScheduleCreationForm.tsx` | Form for creating new scheduled routines | ✓ VERIFIED | 185+ lines; Name + Mode (Assess/Revive) + Frequency (Quarterly/Monthly/Custom) inputs; cron validation; preset mapping per D-15 |
| `src/ui/memory/MemoryState.ts` | Hook for engagement history state management | ✓ VERIFIED | 170+ lines; useMemory hook with refetch, recordFindings, updateFindingStatus, createRoutine, deleteRoutine, runRoutineNow; follows AssessRunState pattern |
| `src/worker.ts` memory handlers | Handlers for memory.load, memory.recordFindings, memory.transitionStatus | ✓ VERIFIED | All 3 registered (lines 1130, 1160, 1199); memory.load returns cached history; memory.recordFindings calls recordFindingsToHistory; memory.transitionStatus validates state machine |
| `src/worker.ts` routine handlers | Handlers for routine.create, routine.delete, routine.run, routine.onFire | ⚠️ PARTIAL | All 4 registered. routine.create validates cron; routine.run calls detectDrift/classifyStall and records findings. routine.onFire assumes scheduler integration (unverified). routine.listForCompany returns active routines. No integration test for scheduler callback. |
| `src/ui/MainPanel.tsx` | Tab routing to History panel | ✓ VERIFIED | MainPanel refactored with tabType state; tab A: mode, tab B: history; HistoryPanel rendered when selectedTab === 'history'; HistoryTabBadge shows finding count; usePluginData("memory.load") fetches history on render |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| history-store.ts | adapter | adapter.getDocumentByKey, adapter.writeDocument | ✓ WIRED | Lines 61, 115, 152 call adapter methods; reads/writes via chokepoint |
| finding.ts | history-store.ts | recordFindingsToHistory calls createFinding | ✓ WIRED | history-store imports and uses createFinding; finding.ts exported in barrel |
| routine.ts | cron-readable.ts | cronToReadable called in routine logic | ✓ WIRED | routine.ts imports cronToReadable; ScheduleRoutineRow calls it for display |
| MemoryState.ts | worker handlers | usePluginAction calls memory.load, memory.recordFindings, etc. | ✓ WIRED | MemoryState invokes worker handlers; UI components use MemoryState |
| MainPanel.tsx | HistoryPanel | conditional render when selectedTab === 'history' | ✓ WIRED | Tab routing works; component rendered when tab selected |
| HistoryPanel | MemoryState | useMemory hook provides state + callbacks | ✓ WIRED | HistoryPanel calls useMemory; passes refetch/status-change callbacks |
| runDriftAudit handler | prior findings for ASSESS-09 dedup | ✗ NOT_WIRED | detectDrift accepts priorOpenFindings parameter but handler never loads or passes it; dedup logic disconnected |
| runApply/applyAmendments/etc handlers | memory.recordFindings | ✗ NOT_WIRED | Apply handlers return ApplyResult but never call memory.recordFindings after success; no integration |
| routine.onFire | Paperclip scheduler | Assumes scheduler calls handler when cron fires | ⚠️ UNCERTAIN | Handler registered but no evidence scheduler invokes it; no test verifies callback |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---|---|---|---|
| HistoryPanel | findings (from useMemory) | memory.load handler → getEngagementHistory → adapter.getDocumentByKey | Only if prior recordFindings calls exist | ⚠️ HOLLOW — findings array empty until Apply flows call recordFindings |
| ScheduleRoutineRow | routine (last_run_at, last_finding_ids) | routine.run handler → recordFindingsToHistory | Yes (routine.run updates these fields) | ✓ FLOWING |
| FindingCard | finding.status | updateFindingStatus handler → transitionStatus → updateEngagementHistory | Yes (status transitions update document) | ✓ FLOWING |
| ScheduleCreationForm | cron validation result | validateCronExpression → pure validation logic | Yes (regex validation) | ✓ FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Memory types compile and export correctly | `npm run typecheck` | Pass | ✓ PASS |
| Memory + routine units pass | `npm test -- tests/memory/` | 195 tests pass | ✓ PASS |
| Worker handlers register without error | `npm run build` | No build errors | ✓ PASS |
| Cron preset mapping works | `npm test -- tests/memory/routine.spec.ts` | 32 tests pass | ✓ PASS |
| Finding status transitions enforce immutability | `npm test -- tests/memory/finding.spec.ts` | 29 tests pass | ✓ PASS |
| Integration: routine.run records findings from Assess | `npm test -- tests/memory/memory.integration.spec.ts` (lines 190+) | 51 tests pass | ✓ PASS |
| Integration: Found/Assess/Revive Apply persists findings | No test exists | N/A | ✗ SKIP — no test for this critical flow |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| MEM-01 | 06-01 | Plugin persists per-company engagement state in documents table | ⚠️ PARTIAL | Document I/O works; schema exists; but findings never recorded from manual Apply flows |
| MEM-02 | 06-01 | Stored as `compass-engagement-history` document in documents table | ✓ SATISFIED | Adapter uses correct document key; tests verify read/write |
| MEM-03 | 06-01 | Engagement memory tracks finding status with timestamps + audit trail | ✓ SATISFIED | StatusTransition records (from, to, at, by_run_id); status_history array appends on every change |
| MEM-04 | 06-03 | "History" tab surfaces prior findings with filters and status display | ✓ SATISFIED | HistoryPanel component with filters; FindingCard displays all metadata; MainPanel integrates tab |
| MEM-05 | 06-03 | Founder can schedule routines via ScheduleCreationForm | ✓ SATISFIED | Form creates routine; routine.create handler stores in history.routines |
| MEM-06 | 06-04 | Scheduled routines auto-trigger and post findings to history | ⚠️ PARTIAL | routine.run handler records findings; routine.onFire handler assumes scheduler integration (not verified) |
| ASSESS-09 | 06-02 | Context-refresh dedup suppresses repeat drift noise | ✗ BLOCKED | detectDrift accepts priorOpenFindings; runDriftAudit handler never loads or passes them |
| XC-09 | 06-04 | Integration tests cover Apply flows and memory persistence | ✗ BLOCKED | Tests exist for memory module + routine.run; no tests for Found/Assess/Revive/Reposition Apply → memory recording |

**Orphaned requirements:** None detected in REQUIREMENTS.md for Phase 6.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/worker.ts | 1538 | `const result = await (ctx.actions as any).call("routine.run", ...)` | ℹ️ Info | Type assertion required; routine.onFire delegates to routine.run instead of duplicating logic (acceptable pattern) |
| None detected | — | No TODO/FIXME/placeholder/stub patterns | — | — |

---

### Human Verification Required

1. **Test: Paperclip Scheduler Integration for Routines**

   **Test:** Set up a Paperclip dev instance with compass plugin installed. Create a routine with cron `* * * * *` (every minute). Wait 2 minutes. Verify that routine.onFire handler was called and findings were recorded to engagement history.

   **Expected:** After waiting, History tab should show findings from the routine fire with `triggered_by_routine_id` set; `routine.last_run_at` should be recent.

   **Why human:** Scheduler callback integration requires a running Paperclip instance with scheduler daemon; can't verify with mock harness alone.

2. **Test: Manual Apply Flow → Findings Recording**

   **Test:** In a Paperclip instance with compass plugin:
   - Create a new company (Found mode Apply) — verify finding "Company founded" appears in History tab
   - Add VISION.md and agents, then trigger Assess → accept amendments → Apply — verify drift findings appear in History
   - Set company to stalled state, trigger Revive → select actions → Apply — verify action findings appear in History

   **Expected:** Each Apply should immediately post findings to History tab visible without page reload.

   **Why human:** Apply flows are complex; require live Paperclip instance with real company state; mock harness doesn't cover full orchestration.

3. **Test: ASSESS-09 Dedup in Action**

   **Test:** Run Assess on a company, accept "Revenue model" drift finding, Apply. Run Assess again without changing anything — should suppress the same "Revenue model" finding (or show "suppressed by prior X" in history).

   **Expected:** Second Assess report should show fewer items or have dedup indicator showing prior finding still open.

   **Why human:** Requires live company with agents producing activity; dedup logic is unit-tested but context-refresh handler integration is not.

---

### Gaps Summary

**Two critical gaps block the phase goal:**

1. **Found/Assess/Revive/Reposition Apply flows do NOT record findings** — ROADMAP SC #5 explicitly requires "Engagement memory integrates with all prior modes (M1–M5); findings from Found/Assess/Revive/Reposition all persist." Currently, only routine.run records findings. Manual Apply flows (runApply, applyAmendments, applyReviveAction, applyReposition) return success without calling memory.recordFindings. The code comments indicate this was intentionally deferred to Phase 7 (decision D-06), but this violates the phase 6 contract.

   **Impact:** Findings persist only for scheduled check-ins, not for founder-initiated Apply actions. History tab will remain empty unless routines fire. This breaks the core value proposition of Phase 6.

   **Fix:** Each Apply handler must:
   - Call memory.recordFindings after ApplyResult.success = true
   - Pass ApplyResult metadata (amendments applied, actions queued, etc.) as findings
   - Add integration tests for Found/Assess/Revive/Reposition flows verifying findings appear in History

2. **ASSESS-09 Context-Refresh dedup NOT integrated** — The detectDrift function accepts priorOpenFindings and implements deduplication logic, but runDriftAudit handler never loads prior findings or passes them. The dedup only works if caller provides findings (e.g., routine.run), but standard Assess audit doesn't use it.

   **Impact:** Repeat drift findings from the same issue will appear every run, causing noise and defeating the purpose of ASSESS-09.

   **Fix:** runDriftAudit handler must:
   - Load engagement history and extract open findings before calling detectDrift
   - Pass priorOpenFindings to detectDrift for substring-match dedup
   - Verify contextRefreshPreamble metadata appears in DriftReport
   - Add integration test: run Assess twice without resolving first finding, verify second report suppresses the duplicate

**One uncertain item requires human verification:**

3. **Paperclip Scheduler Integration for routine.onFire** — The handler is registered but assumes Paperclip scheduler calls it when cron fires. No documentation or test verifies this integration path. Needs confirmation that:
   - Paperclip SDK routine scheduler actually invokes `routine.onFire` handler
   - Handler name/signature matches SDK convention
   - Scheduler integration is tested end-to-end

**All other artifacts verified working:**
- Memory module types, store, finding lifecycle, cron parsing: ✓
- Memory UI components: ✓
- Worker memory.load, memory.recordFindings, memory.transitionStatus handlers: ✓
- Worker routine.create, routine.delete, routine.run handlers: ✓
- History tab rendering and filtering: ✓
- Tests: 822/822 pass (no regressions)
- Build, typecheck: ✓

---

_Verified: 2026-05-03T19:45:00Z_  
_Verifier: Claude (gsd-verifier)_
