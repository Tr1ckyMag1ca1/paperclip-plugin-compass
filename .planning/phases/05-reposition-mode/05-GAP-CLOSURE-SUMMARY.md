---
phase: 5
plan: gap-closure
subsystem: reposition-mode
tags: [gap-fix, handler-registration, web-crypto]
date: 2026-05-03
---

# Phase 5 Gap Closure: Reposition Mode Handler Registration & Crypto Fixes

## Objective
Close 3 critical gaps preventing Phase 5 reposition mode from building and running correctly:

1. **Gap 1:** UI handler name mismatch for cascade planning
2. **Gap 2:** UI handler name mismatch for amendment application
3. **Gap 3:** Browser-incompatible crypto import in idempotency module

## Summary
All three gaps fixed with four atomic commits. Full audit sweep completed. All tests pass, build succeeds, typecheck succeeds.

### Gap 1: planRepositionCascade → planCascade

**Files:** src/worker.ts

**Issue:** `RepositionPanel.tsx:78` calls `usePluginAction('planCascade')` but worker registered handler as `'planRepositionCascade'`.

**Fix:** Renamed handler registration from `'planRepositionCascade'` to `'planCascade'` to match UI call.

**Commit:** f87bd55 (part of multi-fix commit)

### Gap 2: applyRepositionAmendments → applyReposition

**Files:** src/worker.ts

**Issue:** `RepositionPanel.tsx:79` calls `usePluginAction('applyReposition')` but worker registered handler as `'applyRepositionAmendments'`.

**Fix:** Renamed handler registration from `'applyRepositionAmendments'` to `'applyReposition'` to match UI call.

**Commit:** f87bd55 (part of multi-fix commit)

### Gap 3: node:crypto randomUUID → Web Crypto API

**Files:** src/found/idempotency.ts, src/worker.ts

**Issue:** `src/found/idempotency.ts:17` imports `randomUUID` from `node:crypto`, which is not available in browser environment. Causes build error when esbuild targets UI bundle (browser target).

**Fix:**
- Removed `import { randomUUID } from "node:crypto"` from idempotency.ts
- Created runtime-safe `generateUUID()` helper using `globalThis.crypto.randomUUID()`
- Replaced all `randomUUID()` calls with `generateUUID()` in idempotency.ts
- Replaced `randomUUID()` call in worker.ts (line 1068) with `globalThis.crypto.randomUUID()`
- Works in both Node.js (>=19) and browser environments

**Commit:** f87bd55 (part of multi-fix commit)

## Missing Handler Discovery & Fix

**Audit:** Full sweep of all `usePluginAction`/`usePluginData` calls in `src/ui/reposition/*` against worker registered handlers.

**Found:** Two missing handlers used by RepositionPanel:
- `getCurrentVision` — retrieve current VISION.md for interview pre-filling
- `getApprovalRouting` — retrieve approval configuration (founder vs founder+ceo)

**Fix:** Added both handlers to worker.ts in new `REPOSITION MODE HANDLERS` section (after line 752).

**Handlers Added:**
- `getCurrentVision` (data handler) — loads VISION.md from issue documents
- `getApprovalRouting` (data handler) — returns approval routing config (defaults to 'founder')

**Commit:** f92cfac

## Test Coverage

**Added:** Handler registration validation smoke test in `tests/reposition/reposition.integration.spec.ts`

**Coverage:** New `Handler Registration Validation (UI/Worker Contract)` describe block with test verifying all 8 reposition-mode UI handler calls exist as registered worker handlers:
- getCurrentVision
- getApprovalRouting
- classifyShift
- generateAmendments
- planCascade
- applyReposition
- loadRepositionRunState
- updateRepositionRunState

**Commit:** de4bd40

## Verification

### Audit Results
All reposition-mode UI handler calls now match registered worker handlers:

```
UI Reposition Handlers:      Worker Registered Handlers:
✓ applyReposition            ✓ applyReposition
✓ classifyShift              ✓ classifyShift
✓ generateAmendments         ✓ generateAmendments
✓ getApprovalRouting         ✓ getApprovalRouting
✓ getCurrentVision           ✓ getCurrentVision
✓ loadRepositionRunState     ✓ loadRepositionRunState
✓ planCascade                ✓ planCascade
✓ updateRepositionRunState   ✓ updateRepositionRunState
```

### Test Results
```
Test Files  29 passed (29)
     Tests  671 passed (671)
```

### Build Results
```
npm run build     ✓ Success
npm run typecheck ✓ Success
npm test          ✓ Success (all tests passing)
```

## Files Modified

| File | Changes | Commit |
|------|---------|--------|
| src/worker.ts | Rename 2 handlers, remove crypto import, add 2 new handlers, fix globalThis.crypto call | f87bd55, f92cfac |
| src/found/idempotency.ts | Replace node:crypto with globalThis.crypto | f87bd55 |
| tests/reposition/reposition.integration.spec.ts | Add handler registration validation test | de4bd40 |

## Commits

1. **f87bd55** — `fix(05-gap): rename worker handlers to match UI calls`
   - Rename planRepositionCascade → planCascade
   - Rename applyRepositionAmendments → applyReposition
   - Replace node:crypto with globalThis.crypto.randomUUID()

2. **f92cfac** — `fix(05-gap): add missing reposition mode handlers`
   - Add getCurrentVision handler
   - Add getApprovalRouting handler

3. **de4bd40** — `test(05-gap): add handler registration validation smoke test`
   - Smoke test for all 8 reposition UI handler calls

## Deviations from Plan

**None.** Plan specified exact fixes required. All three gaps closed as instructed.

## Follow-Up

**Note on Found/Assess modes:** Audit also discovered 3 missing handlers in Found/Assess modes (`loadAssessRunState`, `updateAssessRunState`, `runApply`), but these are out of scope for this reposition-focused gap closure. They should be addressed in future phase audits for those modes.
