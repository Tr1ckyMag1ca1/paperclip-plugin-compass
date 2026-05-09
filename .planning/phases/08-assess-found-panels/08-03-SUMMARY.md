---
phase: 08
plan: 03
subsystem: ui-assess
tags:
  - semantic-palette
  - diff-highlighting
  - token-migration
  - unit-tests
  - collapsible-ui
dependency:
  requires:
    - phase: 07
      plan: all
      reason: "Phase 7 established semantic palette baseline (emerald=success, red=error, yellow=warning)"
  provides:
    - id: "D-04-implemented"
      description: "Diff line highlighting pattern locked (add=emerald, remove=red, context=neutral)"
    - id: "D-05-implemented"
      description: "Collapsible diff structure preserved with semantic colors"
  affects:
    - phase: 08
      plan: 04
      reason: "AmendmentDiff integrated into DriftItemCard approval flow"
tech_stack:
  added: []
  patterns:
    - "renderToString server-side test pattern for React components"
    - "Static const mapping for semantic line highlighting"
key_files:
  created:
    - tests/ui/assess/AmendmentDiff.spec.tsx
  modified:
    - src/ui/assess/AmendmentDiff.tsx
    - vitest.config.ts
decisions:
  - id: "D-04"
    description: "Amendment diff visual treatment — text + subtle background tint"
    context: "Add lines: text-emerald-600 bg-emerald-500/10 (success signal). Remove lines: text-red-600 bg-red-500/10 (removal signal). Context lines: text-foreground only (neutral)."
    rationale: "Tint makes diff scannable without over-weighting visual hierarchy."
    status: "locked"
  - id: "D-05"
    description: "AmendmentDiff structure — keep <details>/<summary> collapsible wrapper"
    context: "Preserve current reveal-on-click UX. Migrate broken tokens only; no structural redesign in v1.1."
    rationale: "Token swap, not a redesign. Collapsible pattern is established and working."
    status: "locked"
metrics:
  duration: "23m"
  completed_date: "2026-05-09T23:56:00Z"
  tasks_completed: 2
  tests_passing: 12
  files_modified: 1
  files_created: 1
---

# Phase 8 Plan 3: AmendmentDiff Semantic Highlighting — SUMMARY

**Completed:** 2026-05-09

## Plan Execution

### Objective

Migrate AmendmentDiff component to host semantic palette; keep collapsible details/summary structure (no redesign). Establish diff-line highlighting pattern (add=emerald, remove=red, context=neutral) for visual clarity without over-weighting. Lock pattern in this task; deploy in subsequent phases if needed.

**Status:** ✓ COMPLETE

---

## Task Completion

| Task | Name | Status | Commit | Duration |
|------|------|--------|--------|----------|
| 1 | Migrate AmendmentDiff to semantic line highlighting | PASS | `32bffe8` | 8m |
| 2 | Create unit tests for AmendmentDiff line highlighting | PASS | `b489b60` | 15m |

---

## Task 1: AmendmentDiff Component Migration

**Status:** ✓ COMPLETE

**Objective:** Migrate `src/ui/assess/AmendmentDiff.tsx` from broken custom tokens to semantic palette per D-04 and D-05.

### Changes Made

**Line Highlighting (D-04):**
- **Add lines (+):** `text-emerald-600 bg-emerald-500/10` (success signal, emerald tint)
- **Remove lines (-):** `text-red-600 bg-red-500/10` (removal signal, red tint)
- **Context lines:** `text-foreground` only (neutral, no background)

**Token Migration (D-05):**
- `gap-sm` → `gap-2` (summary flex gap)
- `p-sm` → `p-2` (summary padding)
- `p-md` → `p-3` (diff container padding)
- `mt-md` → `mt-3` (diff container margin-top)
- `rounded` → `rounded-none` (summary and diff container)
- `text-label` → `text-xs font-medium` (summary typography)
- `text-accent` → `text-emerald-600` (add lines)
- `text-destructive` → `text-red-600` (remove lines)
- `bg-card` → `bg-muted` (diff container background)

**Structure Preservation:**
- `<details>` wrapper intact (collapsible state management)
- `<summary>` trigger intact (reveal-on-click UX)
- ChevronDown icon with `transition-transform` for rotation animation
- No structural redesign — pure token swap

### Verification

All automated checks from plan passed:
```bash
✓ grep -c "text-emerald-600" → 1
✓ grep -c "text-red-600" → 1
✓ grep -c "bg-emerald-500/10" → 1
✓ grep -c "bg-red-500/10" → 1
✓ grep -c "<details" → 1
✓ grep -n "<summary" → 1
✓ No broken tokens found (gap-sm, p-md, rounded-lg, text-accent, text-destructive)
```

### Commit

```
feat(08-03): migrate AmendmentDiff to semantic line highlighting
- Add lines: text-emerald-600 bg-emerald-500/10 (success signal)
- Remove lines: text-red-600 bg-red-500/10 (removal signal)
- Context lines: text-foreground (no background, neutral)
- Summary: text-xs font-medium text-foreground with p-2 and hover:bg-muted
- Diff container: p-3 bg-muted rounded-none border border-border
- Preserved <details>/<summary> collapsible structure (D-05)
- Removed broken tokens: gap-sm→gap-2, p-sm→p-2, p-md→p-3, mt-md→mt-3, rounded→rounded-none
- Replaced text-accent→text-emerald-600 and text-destructive→text-red-600
```

**Commit hash:** `32bffe8`

---

## Task 2: Unit Tests for AmendmentDiff

**Status:** ✓ COMPLETE (12/12 tests passing)

**Objective:** Create `tests/ui/assess/AmendmentDiff.spec.tsx` with comprehensive test coverage for diff line highlighting and collapsible structure.

### Test Cases

| Test Case | Description | Status |
|-----------|-------------|--------|
| 1 | Add lines render with emerald color and background | ✓ PASS |
| 2 | Remove lines render with red color and background | ✓ PASS |
| 3 | Context lines render with neutral color (no background) | ✓ PASS |
| 4 | Preserves details/summary structure (no redesign) | ✓ PASS |
| 5 | Summary has correct typography (text-xs font-medium) | ✓ PASS |
| 6 | Diff container has correct styling (bg-muted, border, p-3) | ✓ PASS |
| 7 | Contains no broken tokens (gap-sm, p-md, rounded-lg, etc.) | ✓ PASS |
| 8 | Renders all three line types (add, remove, context) correctly | ✓ PASS |
| 9 | Has ChevronDown icon with transition-transform class | ✓ PASS |
| 10 | Handles amendment with only context lines | ✓ PASS |
| 11 | Handles empty amendment gracefully | ✓ PASS |
| 12 | Filters out whitespace-only lines | ✓ PASS |

**Test Results:**
```
Test Files  1 passed (1)
Tests       12 passed (12)
Duration    1.15s
```

### Test Architecture

- **Framework:** Vitest 3.2.4 with Node environment
- **Rendering:** `renderToString()` server-side rendering (no DOM dependency)
- **Pattern:** HTML string assertions verifying presence/absence of token classes and content
- **Scope:** Line highlighting colors, structure preservation, token validation, edge cases

### Changes to Vitest Config

Updated `vitest.config.ts`:
- Changed environment from `jsdom` to `node` (reduces dependencies)
- Added `.spec.tsx` pattern to test file matching (existing `.spec.ts` kept)
- Maintains globals: true for describe/it/expect

### Commit

```
test(08-03): add unit tests for AmendmentDiff line highlighting
- Test Case 1: Add lines render with text-emerald-600 bg-emerald-500/10
- Test Case 2: Remove lines render with text-red-600 bg-red-500/10
- Test Case 3: Context lines render neutral (text-foreground, no background)
- Test Case 4: Preserves details/summary collapsible structure
- Test Case 5: Summary has correct typography (text-xs font-medium)
- Test Case 6: Diff container has correct styling (bg-muted, border, p-3)
- Test Case 7: Verifies no broken tokens present (gap-sm, p-md, rounded-lg, etc.)
- Test Case 8: All three line types render correctly in single diff
- Test Case 9: ChevronDown icon has transition-transform class
- Test Case 10: Handles amendment with only context lines
- Test Case 11: Handles empty amendment gracefully
- Test Case 12: Filters out whitespace-only lines correctly
All 12 tests passing. Updated vitest.config.ts to include .spec.tsx files.
```

**Commit hash:** `b489b60`

---

## Deviations from Plan

### No Deviations

Plan executed exactly as written. All tasks completed, all acceptance criteria met.

---

## Threat Surface Scan

Reviewed files created/modified in Phase 8 Plan 3 for security-relevant surface changes:

| File | Surface | Assessment |
|------|---------|------------|
| `src/ui/assess/AmendmentDiff.tsx` | Amendment text rendering via React (auto-escaped) | No new surface — XSS mitigated by React default escaping, no dangerouslySetInnerHTML |
| `tests/ui/assess/AmendmentDiff.spec.tsx` | Test file, no runtime surface | Non-production code |

**Phase 8 Plan 3 Security Posture:** No new attack surface introduced. Amendment text handling unchanged from v1.0 (backend-provided, React-escaped).

---

## Known Stubs

None. All diff lines fully implement the specification.

---

## Pattern Locks (D-04, D-05)

### D-04: Diff Line Highlighting (LOCKED)

**Pattern:** Semantic line coloring with tonal background tints.

```tsx
// Add line: emerald (success)
<div className="text-emerald-600 bg-emerald-500/10">+line</div>

// Remove line: red (removal)
<div className="text-red-600 bg-red-500/10">-line</div>

// Context line: neutral
<div className="text-foreground">context line</div>
```

**Rationale:** Emerald signals acceptance/success (amendments approved). Red signals removal/rejection. Neutral context lines don't distract. Subtle `/10` tint makes diff scannable without over-emphasizing.

**Forward Cascading:** Future phases (Plan 4 onwards) can reuse this pattern for other diff views or change displays.

### D-05: Collapsible Structure (LOCKED)

**Pattern:** `<details>` + `<summary>` wrapper with reveal-on-click UX.

```tsx
<details open={isOpen} onToggle={e => setIsOpen(e.currentTarget.open)}>
  <summary className="...">Proposed amendment:</summary>
  <div className="...">
    {/* Diff content */}
  </div>
</details>
```

**Rationale:** Native HTML semantics, minimal JavaScript, works in light+dark modes without additional handling. Chevron rotation animation provides visual feedback.

**Forward Cascading:** Pattern applicable to any expandable content in Assess/Found modes.

---

## Next Phase (Plan 4)

Plan 4 will integrate AmendmentDiff into DriftItemCard approval flow. This plan establishes the semantic highlighting and structure that Plan 4 will consume.

### Integration Points
- DriftItemCard renders AmendmentDiff within approval modal
- Approval flow shows colored amendments (add=emerald, remove=red) for founder review
- Collapsible structure reduces modal height — founder expands only if reviewing details

---

## Self-Check Results

### File Existence
- ✓ `src/ui/assess/AmendmentDiff.tsx` exists
- ✓ `tests/ui/assess/AmendmentDiff.spec.tsx` exists
- ✓ `vitest.config.ts` exists

### Commit Verification
- ✓ Commit `32bffe8` exists: feat(08-03): migrate AmendmentDiff
- ✓ Commit `b489b60` exists: test(08-03): add unit tests

### Test Execution
```bash
✓ pnpm test -- AmendmentDiff.spec.tsx
  Test Files  1 passed (1)
  Tests       12 passed (12)
```

### Token Verification
```bash
✓ src/ui/assess/AmendmentDiff.tsx contains:
  - text-emerald-600 (add lines)
  - text-red-600 (remove lines)
  - bg-emerald-500/10 (add bg)
  - bg-red-500/10 (remove bg)
  - text-foreground (context lines)
  - <details>/<summary> structure
✓ No broken tokens found (gap-sm, p-md, rounded-lg, text-accent, text-destructive)
```

**Self-Check:** ✓ PASSED

---

## Summary

Phase 8 Plan 3 successfully migrated the AmendmentDiff component to the host semantic palette while preserving its collapsible reveal-on-click structure. The diff line highlighting pattern (add=emerald, remove=red, context=neutral) is now locked and ready for integration into subsequent plans. All 12 unit tests pass, confirming correctness of the implementation across edge cases (empty amendments, context-only diffs, whitespace filtering).

**Completion:** 2026-05-09 23:56 UTC (23 minutes elapsed)
