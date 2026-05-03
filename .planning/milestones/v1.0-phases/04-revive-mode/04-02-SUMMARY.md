---
phase: 04-revive-mode
plan: 02
name: Actions Handlers + Sample-Pivot + Queue Persistence + Tests
completed_date: 2026-05-03T05:35:00Z
status: complete
type: execution
---

# Phase 4 Plan 2: Actions Handlers + Sample-Pivot + Queue Persistence Summary

**One-liner:** Typed 7-handler action registry + sample-pivot dual-issue logic + idempotent queue persistence with 46+ unit tests validating all handler types, sample-pivot dual-issue creation, and queue serialization.

## Execution Summary

Phase 04 Plan 02 implements the operational heart of Revive Mode: action handlers that execute unblocking operations, sample-pivot logic for reframing stuck work quality, and persistent action queue management.

### What Was Built

#### 1. Action Handler Registry (7 handlers)

**File:** `src/revive/actions.ts` (256 lines)

Implements all 7 action types from D-07:

1. **replace-blocker-issue** — Creates new issue with similar context, comments link
2. **reassign-issue** — Updates issue assignment, queues wakeup for new agent
3. **nudge-agent-with-context-doc** — Writes context document, queues wakeup
4. **pivot-to-sample** — Delegates to sample-pivot module (D-08)
5. **mark-blocker-resolved** — Closes issue with explanation comment
6. **restart-agent** — Queues wakeup with reset context for dead agents
7. **surface-amendment-needed** — Informational (no writes), points to Assess mode

Each handler:
- Validates input parameters (returns ActionResult with error if missing)
- Executes writes exclusively through PaperclipAdapter (XC-01 chokepoint)
- Returns ActionResult { success, summary, error?, result? }
- Includes idempotency keys on wakeup requests (XC-03)
- Has try-catch with no-throw contract (errors returned as ActionResult, not thrown)

**Handler Registry:** `Record<ActionType, ActionHandler>` maps all 7 types to implementations.

**Dispatcher:** `executeAction(actionItem, adapter)` routes by action type, handles unknown types, catches handler errors.

#### 2. Sample-Pivot Dual-Issue Logic

**File:** `src/revive/sample-pivot.ts` (183 lines)

Implements D-08 (REVIVE-04, REVIVE-05):

**`executeSamplePivot(actionItem, adapter)`**
- Loads original issue from actionItem.target.id
- Creates [SAMPLE] issue (keeps title + content + assignee)
- Creates [PRODUCTION] issue (blank body, same assignee)
- Comments on original linking both issues
- Writes SAMPLE_PIVOT.md document (calls createSamplePivotDocs)
- Returns ActionResult with both issue IDs

**`createSamplePivotDocs(adapter, companyId)`**
- Writes one-per-company idempotent SAMPLE_PIVOT.md
- Idempotency key: `compass:revive:sample-pivot:{company_id}`
- Document includes pattern explanation (How It Works, Why This Works, Example)
- Stored in Paperclip documents table with idempotency_key

Per D-08: Decouples feedback (critique on sample) from implementation (polished production version).

#### 3. Action Queue Serialization & Persistence

**File:** `src/revive/queue.ts` (63 lines)

Implements D-04, D-05:

**`serializeActionQueue(queue: ActionQueue): string`**
- Converts ActionQueue to formatted JSON (2-space indentation)
- All fields preserved: run_id, company_id, items_by_cause, addressed_count, confidence

**`writeActionQueueDocument(adapter, companyId, queue): Promise<void>`**
- Persists queue to Paperclip documents table
- Idempotency key: `compass:revive:action-queue:${run_id}`
- Document title: "Revive Action Queue — {run_id}"
- Document body: serialized JSON
- Same key on retry = in-place update (idempotent)

Queue stored in documents table (not .planning/), per D-04 — founder-visible, integrated with VISION and assess history.

### Tests (46+ passing)

**Task 1 — Actions Handlers (18 tests)**

File: `tests/revive/actions.spec.ts`

- Replace-blocker: creates new issue + comments link
- Reassign-issue: updates assignment + queues wakeup
- Nudge-agent: writes context doc + queues wakeup
- Pivot-to-sample: delegates to sample-pivot module
- Mark-resolved: closes issue + adds comment
- Restart-agent: queues wakeup with reset prompt
- Surface-amendment: returns informational summary (no writes)
- Registry: all 7 handlers present + callable
- Error handling: unknown action type + SDK call failures
- Idempotency: same action twice produces consistent results

**Task 2 — Sample-Pivot (16 tests)**

File: `tests/revive/sample-pivot.spec.ts`

- Creates [SAMPLE] issue with original title + content
- Creates [PRODUCTION] issue with blank body
- Preserves assignee in both issues
- Adds linking comment to original
- Returns ActionResult with both issue IDs
- SAMPLE_PIVOT.md written once per company (idempotent)
- Error: missing issue_id / company_id
- Error: SDK failures caught + returned as ActionResult
- Edge case: no assignee in original
- Edge case: original title already has [SAMPLE]/[PRODUCTION] prefix
- End-to-end: creates complete dual-issue structure with linking + doc

**Task 3 — Queue Serialization (12 tests)**

File: `tests/revive/queue.spec.ts`

- Serialization: JSON string with formatting
- Deserialization: JSON parses back to ActionQueue
- All fields preserved during round-trip
- Document writing: correct adapter call + parameters
- Idempotency key format: `compass:revive:action-queue:{run_id}`
- Document title includes run_id
- Document body is serialized JSON
- Same queue written twice uses same key (idempotency)
- Different run_ids produce different keys
- Round-trip: serialize → write → read → deserialize preserves queue
- Edge case: empty queue (no action items)
- Edge case: queue with all items addressed

### Commits Created

1. **8b58aaa** `feat(04-02): implement 7 action handlers + registry for Revive mode` — actions.ts + tests
2. **cd5c47f** `feat(04-02): implement sample-pivot dual-issue logic for REVIVE-04` — sample-pivot.ts + tests
3. **e50f8ac** `feat(04-02): implement action queue serialization + document persistence` — queue.ts + tests
4. **0bbb978** `feat(04-02): extend SDK adapter with getIssue and overloaded writeDocument` — adapter + types

## Verification

### Automated Tests

```bash
npm test -- tests/revive/actions.spec.ts      # 18 tests ✓
npm test -- tests/revive/sample-pivot.spec.ts # 16 tests ✓
npm test -- tests/revive/queue.spec.ts        # 12 tests ✓
npm test -- tests/revive                      # 66 total (46 new + 20 existing from classify) ✓
```

### TypeScript Strict Mode

```bash
npm run typecheck  # ✓ passes (no errors)
```

## Architecture Alignment

### Per D-07 (Recommended Action Types)

All 7 action types implemented with typed handlers:
- ✓ replace-blocker-issue
- ✓ reassign-issue
- ✓ nudge-agent-with-context-doc
- ✓ pivot-to-sample (delegates to D-08)
- ✓ mark-blocker-resolved
- ✓ restart-agent
- ✓ surface-amendment-needed

### Per D-08 (Sample-Pivot Pattern)

Dual-issue structure implemented exactly per spec:
- ✓ Original issue reframed as [SAMPLE]
- ✓ New [PRODUCTION] issue created (blank for post-critique)
- ✓ Explicit linking via issue comment
- ✓ SAMPLE_PIVOT.md explanation (one per company, idempotent)

### Per D-04, D-05 (Founder-Action Queue)

Queue persistence implemented as specified:
- ✓ Written to Paperclip documents table (not .planning/)
- ✓ Keyed by run_id for per-run uniqueness
- ✓ Serialized to JSON with formatting
- ✓ Idempotency key: compass:revive:action-queue:{run_id}
- ✓ Round-trip preserves all ActionQueue fields

### Cross-Cutting Constraints

- ✓ XC-01: All SDK calls route through adapter chokepoint
- ✓ XC-03: Idempotency keys on all wakeups (compass:revive:${company}:${action}:${attempt})
- ✓ XC-01 + XC-03: Adapter extended with getIssue() and overloaded writeDocument()

### Threat Model (T-04-06 through T-04-10)

- ✓ T-04-06 (Handler registry): Handlers defined in code, not data-driven
- ✓ T-04-07 (Sample-pivot): Visibility intended (sample + production visible to founder + agents)
- ✓ T-04-08 (DoS): Each handler has try-catch, no unbounded loops, timeouts via adapter
- ✓ T-04-09 (Idempotency keys): Include company_id to prevent cross-company collision
- ✓ T-04-10 (Audit trail): All writes audit-logged via SDK adapter

## Key Files Modified

### Created (New)
- `src/revive/actions.ts` — 7 handlers + registry (256 lines)
- `src/revive/sample-pivot.ts` — Dual-issue + SAMPLE_PIVOT.md (183 lines)
- `src/revive/queue.ts` — Serialization + persistence (63 lines)
- `tests/revive/actions.spec.ts` — 18 handler tests (413 lines)
- `tests/revive/sample-pivot.spec.ts` — 16 sample-pivot tests (365 lines)
- `tests/revive/queue.spec.ts` — 12 queue tests (310 lines)

### Modified
- `src/sdk/adapter.ts` — Added getIssue(), overloaded writeDocument() with idempotency key support
- `src/types/revive.ts` — Exported ActionResult interface

## Deviations from Plan

None. Plan executed exactly as written.

- ✓ All 7 handlers implemented per D-07
- ✓ Sample-pivot dual-issue + SAMPLE_PIVOT.md per D-08
- ✓ Action queue serialization + idempotent persistence per D-04/D-05
- ✓ 46+ unit tests covering all handler types, edge cases, idempotency
- ✓ TypeScript strict mode passes

## Known Stubs

None. All implementation complete and verified.

## Next Steps (Phase 04 Plan 03)

Phase 04 Plan 03 will implement:
- Revive classifier (pure function, uses Phase 3 drift detector + availability snapshots)
- Diagnostic engine (populates ActionQueue from classified causes)
- Cascade plan (reuses Phase 3 cascade.ts for agent eligibility screening)
- Apply step (queues individual actions with idempotency keys)

This plan (04-02) provides the foundation for all downstream action execution and queue persistence.

---

**Executor:** Claude Opus 4.7 (1M context)  
**Completed:** 2026-05-03 05:35 UTC  
**Duration:** ~2 hours (TDD: write failing tests → implement → verify)  
**Model:** Haiku 4.5
