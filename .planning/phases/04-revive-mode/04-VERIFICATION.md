---
phase: 04-revive-mode
verified: 2026-05-03T14:30:00Z
status: gaps_found
score: 4/5 must-haves verified
overrides_applied: 0
gaps:
  - truth: "Founder can trigger Revive diagnostic via UI and see classified stall causes"
    status: failed
    reason: "Handler name mismatch: UI calls usePluginAction('classifyStall') but worker registers 'runStallDiagnostic'. Will fail at runtime when founder clicks 'Diagnose' button."
    artifacts:
      - path: "src/ui/revive/RevivePanel.tsx"
        issue: "Line 32: const classifyStallAction = usePluginAction('classifyStall'); — handler name incorrect"
      - path: "src/worker.ts"
        issue: "Line 470: ctx.data.register('runStallDiagnostic', ...) — handler registered with different name than UI expects"
    missing:
      - "Either rename handler in worker.ts to 'classifyStall' or update UI to call 'runStallDiagnostic'"
  - truth: "Revive run state persists across panel reloads via worker state handlers"
    status: failed
    reason: "Missing handler registrations: UI calls usePluginAction('loadReviveRunState') and usePluginAction('updateReviveRunState') but these handlers are never registered in worker.ts. UI state persistence will fail at runtime."
    artifacts:
      - path: "src/ui/revive/ReviveRunState.ts"
        issue: "Lines 22-23: usePluginAction calls for 'loadReviveRunState' and 'updateReviveRunState' — handlers don't exist"
      - path: "src/worker.ts"
        issue: "No handler registrations found for loadReviveRunState or updateReviveRunState"
    missing:
      - "Register loadReviveRunState handler to load queue from worker-state"
      - "Register updateReviveRunState handler to persist queue to worker-state"
  - truth: "Incremental action apply persists progress in worker-state across reloads"
    status: failed
    reason: "Depends on missing updateReviveRunState handler. applyReviveAction handler calls ctx.state.set to persist queue, but UI cannot recover the persisted queue on reload due to missing loadReviveRunState."
    artifacts:
      - path: "src/worker.ts"
        issue: "Line 600: ctx.state.set updates queue, but no handler exposes this state to UI for recovery"
    missing:
      - "Register loadReviveRunState handler to expose persisted queue state to UI"
---

# Phase 4: Revive Mode — Verification Report

**Phase Goal:** Stalled companies can diagnose root cause (single-blocker, drift, broken integration, governance loop, dead agent) and unlock. Founder-action queue enumerates blocking items; sample-pivot pattern available as one-click reframe.

**Verified:** 2026-05-03T14:30:00Z  
**Status:** gaps_found  
**Score:** 4/5 observable truths verified

## Goal Achievement

### ROADMAP Success Criteria

| # | Success Criterion | Status | Evidence |
|---|-------------------|--------|----------|
| 1 | Founder can trigger Revive mode on stalled company; plugin deterministically classifies cause | **FAILED** | Handler name mismatch: UI calls 'classifyStall', worker registers 'runStallDiagnostic'. Runtime error on trigger. |
| 2 | Diagnostic produces founder-action queue document enumerating blocking items in priority order | ✓ VERIFIED | `src/revive/classify.ts` classifyStall() returns StallClassification with ranked causes; `src/revive/queue.ts` persists to documents table with idempotency key |
| 3 | Sample-pivot action creates dual-issue structure with explicit linking and SAMPLE_PIVOT.md | ✓ VERIFIED | `src/revive/sample-pivot.ts` executeSamplePivot() creates [SAMPLE] and [PRODUCTION] issues, adds linking comment, writes SAMPLE_PIVOT.md doc. All 16 sample-pivot tests pass. |
| 4 | Cascade plan applies agent screening and surfaces custom overrides | ✓ VERIFIED | Uses `src/assess/cascade.ts` agent screening (reused per D-09). Tested in assess integration (12 tests passing). |
| 5 | Apply step queues wakeups with idempotency keys; founder can execute incrementally | ✓ VERIFIED | `src/revive/apply.ts` applyAction() and applyAllActions() implement per-action execution; all wakeups use idempotency namespace `compass:revive:${company}:${action}:${attempt}`. 31 apply tests pass. |

**Must-Have Truths (derived from ROADMAP + REQUIREMENTS):**

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| T1 | Stall cause classifier detects {single-blocker, strategic-drift, broken-integration, governance-loop, dead-agent} using hard rules | ✓ VERIFIED | `src/revive/classify.ts` implements 5 scorer functions; 20 unit tests pass covering all 5 causes with named thresholds (STUCK_THRESHOLD_DAYS=14, CYCLE_THRESHOLD=3, NO_HEARTBEAT_THRESHOLD_DAYS=30, etc.). All thresholds documented inline. |
| T2 | Action queue document is persisted to Paperclip documents table via SDK adapter | ✓ VERIFIED | `src/revive/queue.ts` writeActionQueueDocument() writes with idempotency key `compass:revive:action-queue:${run_id}`; adapter.createDocument() or updateDocument() via XC-01 chokepoint. 12 queue tests pass. |
| T3 | Action handlers execute all 7 action types (replace-blocker, reassign, nudge, pivot, mark-resolved, restart, surface-amendment) | ✓ VERIFIED | `src/revive/actions.ts` implements 7 handlers with executeAction() dispatcher; 18 unit tests pass covering all types, error handling, and SDK adapter calls. |
| T4 | Sample-pivot creates dual issues with explicit linking and SAMPLE_PIVOT.md doc | ✓ VERIFIED | `src/revive/sample-pivot.ts` executeSamplePivot() creates [SAMPLE] and [PRODUCTION] issues, links via comment, writes SAMPLE_PIVOT.md with idempotency key. 16 tests pass. |
| T5 | Incremental apply orchestrator updates action status and persists queue | ✓ VERIFIED | `src/revive/apply.ts` applyAction() and applyAllActions() update queue.status pending→addressed, increment addressed_count, write updated queue via writeActionQueueDocument(). 31 tests pass. |
| T6 | Founder can trigger Revive diagnostic from UI and see classified stall causes rendered | **FAILED** | UI calls `usePluginAction('classifyStall')` but worker registers handler as `'runStallDiagnostic'`. Handler name mismatch will cause runtime error when founder clicks "Diagnose" button. |
| T7 | Revive run state persists across panel reloads via worker-state handlers | **FAILED** | `src/ui/revive/ReviveRunState.ts` calls `usePluginAction('loadReviveRunState')` and `usePluginAction('updateReviveRunState')` but these handlers are not registered in worker.ts. State persistence will fail at runtime. |

### Required Artifacts

| Artifact | Purpose | Status | Details |
|----------|---------|--------|---------|
| `src/revive/classify.ts` | Stall cause classifier (5 causes, hard rules) | ✓ VERIFIED | 256 lines, 5 scorer functions, all thresholds documented. 20 unit tests pass. |
| `src/revive/actions.ts` | 7 action handlers with dispatcher | ✓ VERIFIED | 256 lines, executeAction() router, all 7 handlers implemented. 18 unit tests pass. |
| `src/revive/sample-pivot.ts` | Dual-issue creation + SAMPLE_PIVOT.md | ✓ VERIFIED | 183 lines, executeSamplePivot() and createSamplePivotDocs(). 16 tests pass. |
| `src/revive/apply.ts` | Incremental apply orchestrator | ✓ VERIFIED | 158 lines, applyAction() and applyAllActions(). 31 tests pass. |
| `src/revive/queue.ts` | Queue serialization + persistence | ✓ VERIFIED | 63 lines, serializeActionQueue() and writeActionQueueDocument(). 12 tests pass. |
| `src/revive/index.ts` | Barrel export | ✓ VERIFIED | Re-exports all logic, per pattern. |
| `src/types/revive.ts` | Type definitions (StallCause, ActionItem, ActionQueue) | ✓ VERIFIED | 5 cause union, 7 action types, all interfaces substantive. |
| `src/ui/revive/RevivePanel.tsx` | Main orchestrator + state machine | ✓ VERIFIED | 208 lines, state machine (empty→diagnosing→queue), Diagnose CTA, sticky progress footer. |
| `src/ui/revive/ActionQueuePanel.tsx` | Groups items by cause with priority sort | ✓ VERIFIED | 58 lines, 5 cause sections, priority sorting within. |
| `src/ui/revive/ActionItemCard.tsx` | Individual action card with modals | ✓ VERIFIED | 146 lines, priority badge, consequence display, modals. |
| `src/ui/revive/SamplePivotModal.tsx` | Sample-pivot confirmation with explanation | ✓ VERIFIED | 51 lines, single-confirm gate, pattern explanation. |
| `src/ui/revive/ActionConfirmationModal.tsx` | Per-action confirmation modal | ✓ VERIFIED | 63 lines, single-confirm gate, shows what's unblocked. |
| `src/ui/revive/PriorityBadge.tsx` | Color-coded priority indicator | ✓ VERIFIED | 47 lines, High/Medium/Low color mapping. |
| `src/ui/revive/StallSummaryBadge.tsx` | Stall status badge in header | ✓ VERIFIED | 35 lines, "Stalled — N days, N blockers" format. |
| `src/ui/revive/ReviveRunState.ts` | Worker-state persistence hook | ⚠️ ORPHANED | 89 lines, calls usePluginAction('loadReviveRunState') and usePluginAction('updateReviveRunState'), but these handlers are not registered. Hook is defined but cannot function. |
| `src/worker.ts` | Worker handler registration (3 handlers) | ✗ STUB | Registers `runStallDiagnostic`, `applyReviveAction`, `checkReviveActionStatus` but UI expects `classifyStall`. Missing `loadReviveRunState` and `updateReviveRunState` handlers. |
| `src/ui/MainPanel.tsx` | Mode routing to RevivePanel | ✓ VERIFIED | Lines 124-126: `if (currentMode === "Revive") return <RevivePanel ... />`. Correctly routes. |
| `tests/revive/revive.integration.spec.ts` | Integration tests (18 test cases) | ⚠️ WARNING | 580 lines, 18 tests pass, but all tests use mocked context and do not actually invoke real worker handlers. Tests verify mock behavior, not actual wiring. No handler registration in test setup. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| RevivePanel.tsx | runStallDiagnostic handler | usePluginAction('classifyStall') | ✗ NOT_WIRED | Handler mismatch: UI calls 'classifyStall', worker registers 'runStallDiagnostic'. Will fail at runtime. |
| ReviveRunState.ts | loadReviveRunState handler | usePluginAction('loadReviveRunState') | ✗ NOT_WIRED | Handler not registered in worker.ts. State load will fail. |
| ReviveRunState.ts | updateReviveRunState handler | usePluginAction('updateReviveRunState') | ✗ NOT_WIRED | Handler not registered in worker.ts. State save will fail. |
| applyReviveAction | action handlers | executeAction(actionItem, adapter) | ✓ WIRED | Router properly dispatches to 7 handlers. 18 tests pass. |
| RevivePanel → ActionQueuePanel → ActionItemCard | onApply/onDismiss callbacks | Props passed correctly | ✓ WIRED | Component hierarchy passes callbacks. UI flow wired. |
| classifyStall() → writeActionQueueDocument() | SDK adapter | adapter.createDocument() / adapter.updateDocument() | ✓ WIRED | Both methods exist in src/sdk/adapter.ts (extended per 04-01). XC-01 chokepoint enforced. |
| All handlers | PaperclipAdapter methods | XC-01 chokepoint | ✓ WIRED | closeIssue(), addIssueComment(), updateIssue() exist (added in 04-01). All writes route through adapter. |

### Requirements Coverage

| Requirement | Phase | Status | Evidence |
|-------------|-------|--------|----------|
| REVIVE-01 | 4 | ✓ SATISFIED | Deterministic classifier with 5 causes (no LLM). classifyStall() implements hard rules. 20 tests. |
| REVIVE-02 | 4 | ✓ SATISFIED | Action queue document written to documents table. queue.ts persists with idempotency key. 12 tests. |
| REVIVE-03 | 4 | ✓ SATISFIED | Each action item links to agent/issue/VISION section via target field. All 7 action types have target references. |
| REVIVE-04 | 4 | ✓ SATISFIED | Sample-pivot action creates dual issues ([SAMPLE] + [PRODUCTION]) with explicit linking. sample-pivot.ts, 16 tests. |
| REVIVE-05 | 4 | ✓ SATISFIED | SAMPLE_PIVOT.md document written (idempotent, one per company). createSamplePivotDocs() called. 16 tests. |
| REVIVE-06 | 4 | ✓ SATISFIED | Cascade plan applies agent screening (reused from assess/cascade.ts per D-09). Custom overrides surfaced. |
| REVIVE-07 | 4 | ✓ SATISFIED | All wakeups use idempotency keys per XC-03. generateReviveActionKey() in found/idempotency.ts extended. |
| XC-02 | 2 | ✓ SATISFIED | Apply is incremental per D-10 (not transactional). Each action independent; failures isolated; founder can undo. |
| XC-03 | 2 | ✓ SATISFIED | All idempotency keys use namespace `compass:revive:${company}:${action}:${attempt}`. generateReviveActionKey() implements. 30 tests. |
| XC-08 | 3 | ✓ SATISFIED | Unit tests cover classify heuristics, action handlers, sample-pivot, queue persistence. 20+18+16+31+12 = 97 tests across revive modules. |

**REVIVE requirements 1-7: All satisfied in logic layer. XC requirements: Satisfied.**

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/ui/revive/RevivePanel.tsx | 32 | `usePluginAction("classifyStall")` calls handler that doesn't exist | 🛑 BLOCKER | UI cannot trigger diagnosis. Founder-facing feature will crash at runtime. |
| src/ui/revive/ReviveRunState.ts | 22-23 | `usePluginAction("loadReviveRunState")` and `usePluginAction("updateReviveRunState")` call missing handlers | 🛑 BLOCKER | State persistence broken. Panel reloads lose all progress. |
| src/worker.ts | 470 | Handler registered as `"runStallDiagnostic"` but UI expects `"classifyStall"` | 🛑 BLOCKER | Handler name mismatch. Developer error in naming convention — not documented in PATTERNS.md. |
| tests/revive/revive.integration.spec.ts | 239-333 | Tests use `createMockContext()` and simulate behavior without registering real handlers | ⚠️ WARNING | Integration tests don't test actual wiring. Pass status is false confidence — real handlers never executed in tests. Tests would fail if run against actual worker handler registry. |

### Test Coverage

**Unit Tests (413 total passing):**
- classify.spec.ts: 20 tests (5 causes, all heuristics, thresholds)
- actions.spec.ts: 18 tests (7 handlers, error cases)
- sample-pivot.spec.ts: 16 tests (dual-issue creation, SAMPLE_PIVOT.md, idempotency)
- apply.spec.ts: 31 tests (per-action apply, revert on failure, status tracking, queue persistence)
- queue.spec.ts: 12 tests (serialization, document write, idempotency key format)
- idempotency.spec.ts: 30 tests (revive namespace validation)
- revive.integration.spec.ts: 18 tests (simulated handler behavior, not actual handler invocation)

**TypeScript Strict Mode:** ✓ PASSING (no type errors)

**Build:** ✓ PASSING (esbuild output valid)

### Human Verification Required

| Test | What to Do | Expected | Why Human |
|------|-----------|----------|-----------|
| 1. Trigger Revive diagnostic | Click "Find what's blocking this company" in RevivePanel | Plugin shows stall causes classified by type (single-blocker, drift, integration, governance, dead-agent) in ActionQueuePanel | Handler name mismatch (T6) will cause JavaScript error; cannot test until fixed |
| 2. Persist queue across reload | Trigger diagnosis, reload panel mid-review (manually reload browser) | Queue still visible; can continue reviewing actions | Missing loadReviveRunState handler (T7) will cause state loss; cannot test until fixed |
| 3. Apply single action | Click primary CTA on action card, confirm in modal | Action executes, queue updates, progress counter increments | applyReviveAction handler wired correctly per tests, but depends on queue persistence working (blocked by T7) |
| 4. Sample-pivot pattern | Select "pivot-to-sample" action, confirm in modal | Two issues created ([SAMPLE] + [PRODUCTION]), SAMPLE_PIVOT.md written, linking comment added | Logic verified in 16 unit tests, but end-to-end UI flow depends on handler wiring being fixed |
| 5. Progress tracking | Apply 3 of 5 actions, check footer counter | Shows "3 of 5 addressed" with progress bar | Depends on applyReviveAction and queue persistence working |

## Gaps Summary

**3 Critical Blocking Gaps:**

### Gap 1: Handler Name Mismatch (runStallDiagnostic vs classifyStall)
**Impact:** Founder cannot trigger Revive diagnostic. UI calls `usePluginAction("classifyStall")` but worker registers `"runStallDiagnostic"`. JavaScript error at runtime.

**Root Cause:** 04-05 SUMMARY.md documented handler name correctly ("runStallDiagnostic") but RevivePanel.tsx calls wrong name. Naming convention not enforced in PATTERNS.md or code review.

**Fix Options:**
1. Rename handler in worker.ts line 470 from `"runStallDiagnostic"` to `"classifyStall"` (matches UI expectation, but differs from SUMMARY.md documentation)
2. Rename UI call in RevivePanel.tsx line 32 from `"classifyStall"` to `"runStallDiagnostic"` (matches handler, requires UX text change in code)
3. Register both names as aliases pointing to same handler (extra complexity)

**Recommendation:** Option 2 — rename UI to match registered handler name. "classifyStall" is less descriptive than "runStallDiagnostic" for the operation.

### Gap 2: Missing loadReviveRunState Handler
**Impact:** Revive run state cannot be recovered across panel reloads. ReviveRunState.ts line 22 calls `usePluginAction("loadReviveRunState")` but no handler registered.

**Root Cause:** Worker-state persistence pattern from Phase 2/3 (Found/Assess modes) assumes handlers exist, but they were never implemented. Same gap exists in Assess mode (loadAssessRunState / updateAssessRunState also missing).

**Fix Required:**
```typescript
ctx.actions.register("loadReviveRunState", async (params: any) => {
  const companyId = params.companyId as string;
  const key = `compass:revive:run:${companyId}`;
  const queue = await ctx.state.get({ key });
  return queue || null;
});
```

### Gap 3: Missing updateReviveRunState Handler
**Impact:** Revive queue cannot be persisted to worker-state for recovery. ReviveRunState.ts line 23 calls `usePluginAction("updateReviveRunState")` but no handler registered.

**Root Cause:** Same as Gap 2 — handler infrastructure assumed but never implemented.

**Fix Required:**
```typescript
ctx.actions.register("updateReviveRunState", async (params: any) => {
  const stateUpdates = params as Record<string, any>;
  for (const [key, value] of Object.entries(stateUpdates)) {
    if (value === undefined) {
      await ctx.state.delete({ key });
    } else {
      await ctx.state.set({ key, value });
    }
  }
});
```

**All Three Gaps Must Be Closed Before Phase 4 Can Ship.**

---

_Verified: 2026-05-03T14:30:00Z_  
_Verifier: Claude (gsd-verifier)_
