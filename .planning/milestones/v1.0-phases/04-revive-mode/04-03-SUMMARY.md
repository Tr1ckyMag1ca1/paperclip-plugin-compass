---
phase: 04-revive-mode
plan: 03
plan_name: "Incremental Apply Orchestrator"
subsystem: revive-mode
date_completed: 2026-05-03T05:36:00Z
status: complete
type: execution
---

# Phase 4 Plan 3: Incremental Apply Orchestrator — Execution Summary

**One-liner:** Per-action incremental apply orchestrator (applyAction + applyAllActions) with 31 comprehensive unit tests validating status updates, error recovery, revert action creation, idempotency keys, and non-transactional partial completion.

## Execution Summary

Phase 04 Plan 03 implements the apply execution layer for Revive Mode: single-action execution with independent status tracking, automatic revert action creation on failure, and incremental (not batch transactional) orchestration.

### What Was Built

#### 1. Per-Action Apply Orchestrator

**File:** `src/revive/apply.ts` (158 lines)

**Function 1: `applyAction(queue, actionId, adapter)`**

Executes a single action from the queue with the following steps:

1. **Finds action by id** across all cause groups in queue
2. **Validates action status** — must be "pending" (rejects already addressed/dismissed)
3. **Executes action** via `executeAction(actionItem, adapter)` dispatcher
4. **On success:**
   - Updates status to "addressed"
   - Increments `queue.addressed_count`
   - Writes updated queue to documents (idempotent)
5. **On failure:**
   - Creates compensating-revert action (title: `[REVERT] {original}`, status: pending)
   - Marks original action "dismissed"
   - Adds revert to appropriate cause group
   - Increments `queue.total_items`
   - Writes updated queue with revert for founder undo
6. **Handles all errors** as `ActionResult` (no throws) — SDK failures, unexpected errors, validation failures

Return: `{ queue: updated ActionQueue, result: ActionResult }`

**Function 2: `applyAllActions(queue, adapter)`**

Applies all pending actions in sequence (incremental, NOT transactional):

1. Iterates over all causes and all action items
2. For each pending action, calls `applyAction(queue, actionId, adapter)`
3. Updates queue for next iteration (so addressed items remain addressed)
4. **Continues on failure** — one action failure does NOT block others
5. Collects results into array `[{ actionId, result }, ...]`

Return: `{ queue: final ActionQueue, results: Array<{ actionId, result }> }`

**Design Pattern (Per D-10):**

- Incremental, not transactional (contrast with Phase 2/3 batch apply)
- Each action has per-item confirmation (lighter than two-stage gate)
- Failures are isolated; partial completion is expected
- Revert actions provide founder-initiated undo (no silent rollback)
- Philosophy: "founder can execute recommended unblocks incrementally"

#### 2. Per-Action Idempotency (Per D-11, XC-03)

All wakeups queued within action handlers use idempotency keys:
- Format: `compass:revive:${company_id}:${action_id}:${attempt}`
- Generated via `generateReviveActionKey()` from Phase 01
- Prevents duplicate wakeups on retry (adapter checks before insert)

#### 3. Queue Persistence

After each `applyAction`:
- Updated queue written to Paperclip documents table
- Uses idempotency key: `compass:revive:action-queue:${run_id}`
- Same key on retry = in-place update (idempotent write)
- Status changes (pending → addressed/dismissed) persisted

### Tests (31 passing)

**File:** `tests/revive/apply.spec.ts`

#### applyAction Tests (17 tests)

- ✓ Finds action by id across causes
- ✓ Executes action via executeAction handler
- ✓ Updates status to "addressed" on success
- ✓ Increments addressed_count on success
- ✓ Writes updated queue to documents on success
- ✓ Returns success result on action completion
- ✓ Creates revert action on failure
- ✓ Marks original action "dismissed" on failure
- ✓ Writes updated queue with revert action on failure
- ✓ Returns error result on action failure
- ✓ Returns error if action not found
- ✓ Returns error if action already addressed
- ✓ Returns error if action already dismissed
- ✓ Handles SDK adapter call failures gracefully
- ✓ Idempotency: same action twice — second returns "already addressed"
- ✓ Idempotency: wakeups include idempotency keys per XC-03
- ✓ total_items incremented when revert action added

#### applyAllActions Tests (10 tests)

- ✓ Applies all pending actions in sequence
- ✓ Continues on failure (doesn't batch rollback)
- ✓ Returns array of results (one per action applied)
- ✓ Increments addressed_count for each successful action
- ✓ Empty queue returns empty results
- ✓ Queue with all pending actions applies all of them
- ✓ Partial completion: some succeed, some fail, continues
- ✓ addressed_count reflects only successful actions
- ✓ Returns updated queue from each apply step
- ✓ Skips non-pending actions (only applies pending)

#### Integration Tests (4 tests)

- ✓ Integration: end-to-end apply all actions with state tracking
- ✓ Handles queue with mixed cause groups
- ✓ Revert actions are added with correct priority and structure
- ✓ All writes route through SDK adapter (XC-01 chokepoint)

### Commits Created

**d5916ab** `feat(04-03): implement incremental apply orchestrator for per-action execution and status tracking`
- src/revive/apply.ts (158 lines)
- tests/revive/apply.spec.ts (531 lines, 31 tests)

## Verification

### Automated Tests

```bash
npm test -- tests/revive/apply.spec.ts  # 31 tests ✓
npm test                                # 395 total tests ✓ (all passing)
```

### TypeScript Strict Mode

```bash
npm run typecheck  # ✓ passes (no errors)
```

### Build Verification

```bash
npm run build  # ✓ succeeds
```

## Architecture Alignment

### Per D-10 (Incremental Apply Pattern)

Per-action orchestration implemented exactly per spec:
- ✓ Each action executed independently (not batch)
- ✓ Per-item confirmation modal flow (lighter gate)
- ✓ Status updates (pending → addressed) written back to queue document
- ✓ Failures isolated — one action failure does NOT block others
- ✓ Revert actions added for founder undo (no silent rollback)
- ✓ Incremental progress philosophy — founder can stop mid-way

### Per D-11 (Wakeup Idempotency)

All wakeup queueing in action handlers uses idempotency keys:
- ✓ Format: compass:revive:${company_id}:${action_id}:${attempt}
- ✓ Prevents duplicate wakeups on retry
- ✓ Per XC-03: validated before insert

### Cross-Cutting Constraints

- ✓ XC-01: All SDK calls route through adapter chokepoint
- ✓ XC-03: Idempotency keys on all wakeups
- ✓ Queue persistence: documents table (not .planning/)
- ✓ Error handling: no throws, all errors as ActionResult

### Threat Model Coverage

Per Phase 04 threat_model:
- ✓ T-04-11 (Tampering): Status updated only after executeAction succeeds; failure creates explicit revert
- ✓ T-04-12 (DoS): Loop iterates finite queue items; no recursive calls; adapter timeout enforced
- ✓ T-04-13 (Integrity): Each action failure documented in queue via revert action
- ✓ T-04-14 (Non-Repudiation): All status changes logged in queue document

## Key Files Modified

### Created (New)

| File | Purpose | Lines | Tests |
|------|---------|-------|-------|
| `src/revive/apply.ts` | Incremental apply orchestrator + per-action + sequence | 158 | N/A |
| `tests/revive/apply.spec.ts` | Comprehensive apply logic tests | 531 | 31 |

### Reused (No Changes)

| File | Usage |
|------|-------|
| `src/revive/actions.ts` | executeAction dispatcher + 7 handlers |
| `src/revive/queue.ts` | writeActionQueueDocument for persistence |
| `src/found/idempotency.ts` | generateReviveActionKey for wakeup keys |
| `src/sdk/adapter.ts` | All SDK calls route through |

## Dependency Graph

**Requires (from prior phases):**
- `src/types/revive.ts` → ActionItem, ActionQueue, ActionResult types
- `src/revive/actions.ts` → executeAction handler dispatcher
- `src/revive/queue.ts` → writeActionQueueDocument persistence
- `src/found/idempotency.ts` → generateReviveActionKey for wakeup keys
- `src/sdk/adapter.ts` → PaperclipAdapter interface

**Provides (for later waves):**
- `src/revive/apply.ts` → applyAction, applyAllActions exported for UI
- Used by Phase 04 Wave 4 UI components (RevivePanel, ApplyProgressPanel)
- Used by Phase 05 (Reposition) cascade execution with same incremental pattern

**Affects (no breaking changes):**
- No changes to existing modules
- Fully additive (new exports only)

## Metrics

| Metric | Value |
|--------|-------|
| **New Files Created** | 2 (apply.ts, apply.spec.ts) |
| **Total Lines Added** | 689 (158 source + 531 tests) |
| **Functions Exported** | 2 (applyAction, applyAllActions) |
| **Test Cases Added** | 31 |
| **Existing Tests** | 364 (all still passing) |
| **Total Tests** | 395 ✓ |
| **Test Coverage** | applyAction success/failure/error, applyAllActions sequence/partial, integration |
| **Build Duration** | < 5s |
| **TypeScript Strict Mode** | ✓ PASS |

## Deviations from Plan

**None.** Plan executed exactly as written.

- ✓ applyAction implemented per D-10 (per-action, status updates, revert on failure)
- ✓ applyAllActions implemented per D-10 (incremental, not batch, continues on failure)
- ✓ Queue persistence per D-04 (documents table, idempotency key)
- ✓ Wakeup idempotency per D-11 (XC-03)
- ✓ 31 unit tests covering all scenarios and edge cases
- ✓ TypeScript strict mode passes
- ✓ No bugs discovered requiring Rule 1 auto-fix
- ✓ No missing critical functionality requiring Rule 2
- ✓ No blocking issues requiring Rule 3
- ✓ No architectural decisions required (all within scope)

## Known Stubs

None. All implementation complete and verified.

## Next Steps (Phase 04 Plan 04+)

Phase 04 Plan 04 (Wave 3) will implement:
- Diagnostic engine (populate ActionQueue from classified causes)
- Cascade plan (reuse Phase 3 cascade.ts for agent eligibility screening)
- Sample-pivot queue builder (incorporate REVIVE-04 pattern into queue items)

Phase 04 Plans 05+ (Wave 4) will implement:
- RevivePanel UI component (render ActionQueue by cause, trigger applyAction on confirm)
- ApplyProgressPanel (show addressed_count / total_items, display results)
- Worker integration (wire mode-detection trigger → classify → diagnose → queue → UI)

---

**Executor:** Claude Haiku 4.5  
**Completed:** 2026-05-03 05:36 UTC  
**Duration:** ~15 minutes (TDD: write tests → implement → verify)  
**Model:** Haiku 4.5  
**Requirements Completed:** REVIVE-02, REVIVE-03, REVIVE-06, REVIVE-07, XC-02, XC-03
