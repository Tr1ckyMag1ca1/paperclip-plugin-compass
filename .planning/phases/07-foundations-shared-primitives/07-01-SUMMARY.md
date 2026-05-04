---
phase: 07
plan: 01
title: Foundations + Shared Primitives — Primitives Build
subsystem: UI/Primitives
tags: [primitives, design-tokens, host-inheritance, shared-components]
dependency_graph:
  requires: []
  provides: [Card, SectionHeader]
  affects: [Phase 7.2 (StatusBadge), Phase 7.3+ (all component migrations)]
tech_stack:
  added: []
  patterns: [host-token-inheritance, variants-via-literal-types, no-cn-helper]
key_files:
  created:
    - src/ui/primitives/Card.tsx
    - src/ui/primitives/SectionHeader.tsx
    - tests/ui/Card.spec.ts
    - tests/ui/SectionHeader.spec.ts
  modified: []
decisions:
  - D-01: Card children-only API with variant + padding props; no slots
  - D-02: No header/body/footer slots in v1; callers compose freely
  - D-03: SectionHeader title (required), subtitle/icon/actions (optional), no internal padding
  - D-05: Typography tokens inline as explicit classes (text-base font-semibold), no @utility aliases
completion_timestamp: "2026-05-04T19:31:00Z"
completed_date: "2026-05-04"
duration_minutes: 3
one_liner: Two foundational UI primitives (Card and SectionHeader) implementing host design tokens with comprehensive unit tests

---

# Phase 7 Plan 01: Foundations + Shared Primitives Summary

## Overview

Built two foundational reusable UI primitives using host shadcn design tokens, establishing the token baseline for remaining Phase 7 migrations and downstream phases. Both primitives are ready for immediate use in StatusBadge migration (Plan 7.2) and other Phase 7 component migrations.

**Execution:** 100% autonomous, 4 tasks, 3 minutes elapsed
**All requirements covered:** UIF-01, UIF-02
**All tests passing:** 28/28 (12 Card + 16 SectionHeader)

## Task Completion

### Task 1: Card Primitive Component
**Status:** ✓ Complete  
**File:** `src/ui/primitives/Card.tsx` (48 lines)  
**Commit:** `269fd87` — feat(07-01): implement Card primitive component

**Implementation:**
- Named export `Card` function component with React.ReactElement return type
- Interface `CardProps` with typed variant/padding props and children
- Variant API: `"default"` (bg-card), `"muted"` (bg-muted), `"elevated"` (shadow-sm)
- Padding API: `"sm"` (p-2), `"md"` (p-4), `"lg"` (p-6)
- Always-on: `rounded-none` (sharp corners per host design)
- Host tokens used: bg-card, bg-muted, border-border, text-foreground (via children)
- Template literal class composition (matches codebase pattern, no cn() helper)
- JSDoc documentation with @param and @returns

**Design Compliance:**
- ✓ D-01 locked decision (children-only API with variant/padding)
- ✓ D-02 decision (no slot-based structure)
- ✓ UI-SPEC.md Card Primitive section
- ✓ No broken tokens (gap-xs, px-sm, py-sm absent)

### Task 2: SectionHeader Primitive Component
**Status:** ✓ Complete  
**File:** `src/ui/primitives/SectionHeader.tsx` (52 lines)  
**Commit:** `c9b5a00` — feat(07-01): implement SectionHeader primitive

**Implementation:**
- Named export `SectionHeader` function component
- Interface `SectionHeaderProps` with typed props: title (required), subtitle/icon/actions (optional)
- Title: text-base font-semibold text-foreground (explicit classes per D-05)
- Subtitle: text-sm text-muted-foreground, optional, renders below title with mt-1
- Icon (lucide component): h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0, left-aligned
- Actions: optional right-aligned container (flex items-center gap-2)
- Container: flex items-start justify-between gap-4, no internal padding
- Conditional rendering: Icon && <Icon>, {subtitle && <p>...}, {actions && <div>...}
- JSDoc documentation with @param and @returns

**Design Compliance:**
- ✓ D-03 locked decision (title required, subtitle/icon/actions optional, no padding)
- ✓ D-05 decision (explicit host classes, no text-heading/text-body/text-label)
- ✓ UI-SPEC.md SectionHeader Primitive section
- ✓ PATTERNS.md ModeBanner reference pattern followed
- ✓ No broken tokens (text-heading, text-body, text-label absent)

### Task 3: Unit Tests for Card
**Status:** ✓ Complete  
**File:** `tests/ui/Card.spec.ts` (136 lines)  
**Commit:** `4d1a2f6` — test(07-01): add comprehensive unit tests for Card primitive

**Test Coverage:** 12 test cases
1. ✓ Exports Card as named function
2. ✓ Renders with default variant and padding
3. ✓ Default variant: bg-card + border-border (no shadow)
4. ✓ Muted variant: bg-muted + border-border
5. ✓ Elevated variant: bg-card + shadow-sm + border-border
6. ✓ Padding sm: p-2 (8px)
7. ✓ Padding md: p-4 (16px, default)
8. ✓ Padding lg: p-6 (24px)
9. ✓ Always renders rounded-none (sharp corners)
10. ✓ Children render correctly
11. ✓ No broken spacing tokens (gap-xs, px-sm, py-sm)
12. ✓ Variant + padding combined correctly

**Test Quality:**
- Uses vitest describe/it/expect structure (matches repo conventions)
- Property-based assertions on className composition
- All 12 tests passing
- No test dependencies or mocking required

### Task 4: Unit Tests for SectionHeader
**Status:** ✓ Complete  
**File:** `tests/ui/SectionHeader.spec.ts` (267 lines)  
**Commit:** `e62aa03` — test(07-01): add comprehensive unit tests for SectionHeader primitive

**Test Coverage:** 16 test cases
1. ✓ Exports SectionHeader as named function
2. ✓ Renders title only (required prop)
3. ✓ Title typography: text-base font-semibold text-foreground
4. ✓ Subtitle renders with correct typography (text-sm text-muted-foreground)
5. ✓ Subtitle not rendered when not provided
6. ✓ Icon renders with correct size/color (h-4 w-4 text-muted-foreground)
7. ✓ Icon not rendered when not provided
8. ✓ Actions container renders right-aligned
9. ✓ Actions container not rendered when actions not provided
10. ✓ Container layout: flex items-start justify-between gap-4
11. ✓ All props together (title, subtitle, icon, actions)
12. ✓ No broken typography tokens (text-heading, text-body, text-label)
13. ✓ Accepts any lucide icon component
14. ✓ Accepts ReactNode for actions (complex compositions)
15. ✓ Title text renders correctly
16. ✓ Subtitle text renders correctly

**Test Quality:**
- Uses vitest describe/it/expect structure
- Element navigation and prop inspection
- All 16 tests passing
- Covers optional prop combinations and typography validation

## Verification Results

### Automated Checks (Per Plan Verification Section)

```
✓ Card exports: grep -c "export function Card" = 1
✓ Variants present: "default", "muted", "elevated" found
✓ Rounded-none always: grep -c "rounded-none" = 2 (present in all variants)
✓ Broken tokens absent: gap-xs/gap-sm/gap-md/px-sm/py-sm = 0 matches
✓ Host tokens: bg-card, bg-muted, border-border all present

✓ SectionHeader exports: grep -c "export function SectionHeader" = 1
✓ Title typography: text-base font-semibold text-foreground found
✓ Subtitle typography: text-sm text-muted-foreground found
✓ Icon styling: h-4 w-4 text-muted-foreground found
✓ Layout structure: flex items-start justify-between found
✓ Broken tokens absent: text-heading/text-body/text-label = 0 matches

✓ Card.spec.ts: 12 test cases, all passing
✓ SectionHeader.spec.ts: 16 test cases, all passing
✓ Total test suite: 857 tests passing (up from 829)
✓ Build: pnpm build — success
✓ TypeCheck: pnpm typecheck — success (no TS errors)
```

### Manual Verifications

**Component Structure:**
- ✓ Both primitives follow established codebase patterns (JSDoc, interface, export)
- ✓ No external dependencies added (uses React, lucide-react, host tokens only)
- ✓ TypeScript strict mode compliance (all types properly declared)

**Design Token Usage:**
- ✓ Card: bg-card, bg-muted, border-border, rounded-none used correctly
- ✓ SectionHeader: text-base, font-semibold, text-foreground, text-sm, text-muted-foreground used correctly
- ✓ No hardcoded colors (all via host tokens or host token classes)
- ✓ No light-mode-only utilities (no green-50, orange-600, zinc-800, etc.)

**API Clarity:**
- ✓ Card variant prop typed as literal union (TypeScript enforces valid values)
- ✓ Card padding prop typed as literal union (TypeScript enforces valid values)
- ✓ SectionHeader icon prop accepts React.ComponentType<{ className?: string }> (lucide-compatible)
- ✓ SectionHeader actions prop accepts React.ReactNode (flexible composition)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — both primitives are complete, self-contained, and ready for use.

## Threat Surface Scan

**Files created/modified:** 4 (2 components, 2 test files)
**New security surface:** None

Both primitives are pure presentational components (no data mutations, no API calls, no authentication logic). They inherit the Plugin SDK + host security model. No new trust boundaries introduced.

## Compliance & Readiness

**UIF-01 (Card Primitive):** ✓ Complete
- Card component implemented per UI-SPEC.md
- Variant and padding API matches D-01 decision
- Host tokens used correctly (bg-card, bg-muted, border-border)
- Sharp corners (rounded-none) enforced
- Unit tests validate all prop combinations

**UIF-02 (SectionHeader Primitive):** ✓ Complete
- SectionHeader component implemented per UI-SPEC.md
- Title/subtitle/icon/actions API matches D-03 decision
- Typography uses explicit host classes (text-base, text-sm) per D-05
- Layout structure matches PATTERNS.md ModeBanner reference
- Unit tests validate all prop combinations and typography

## Next Steps (Downstream)

Both primitives are ready for immediate consumption:

1. **Phase 7 Plan 02:** StatusBadge migration (consumes semantic palette; no primitives dependency)
2. **Phase 7 Plan 03:** ModeBanner + MainPanel + SidebarLink migrations (no primitives consumed yet)
3. **Phase 7 Plan 04:** AgentCard + 6 shared components (Card and SectionHeader reused for section headers)
4. **Phase 7 Plan 05:** OklchProbe (light/dark verification)
5. **Phase 7 Plan 06:** DualRenderProbe (all components in light/dark side-by-side)
6. **Phase 7 Plan 07:** Grep verifier (zero broken-token hits)

## Metrics

| Metric | Value |
|--------|-------|
| Tasks completed | 4/4 (100%) |
| Components built | 2 (Card, SectionHeader) |
| Test cases added | 28 (12 Card + 16 SectionHeader) |
| Tests passing | 857/857 (all) |
| Build status | ✓ Success |
| TypeCheck status | ✓ Success |
| Broken tokens found | 0 |
| Files created | 4 |
| Lines of code | 403 (48 Card + 52 SectionHeader + 136 Card tests + 267 SectionHeader tests) |
| Duration (elapsed) | 3 minutes |
| Commits | 4 (feat Card, feat SectionHeader, test Card, test SectionHeader) |

## Self-Check: PASSED

- ✓ Created files exist: Card.tsx, SectionHeader.tsx, Card.spec.ts, SectionHeader.spec.ts
- ✓ Commits exist with correct hashes
- ✓ All tests pass (857/857)
- ✓ Build succeeds
- ✓ TypeCheck succeeds
- ✓ No broken tokens in implementation
- ✓ Host token usage verified
- ✓ Design decisions D-01, D-02, D-03, D-05 implemented correctly
- ✓ Requirements UIF-01 and UIF-02 addressed

---

**Plan Status:** COMPLETE  
**Ready for Phase 7 Plan 02 (StatusBadge Migration)**

*Executor: Claude Opus 4.7 (1M context)*  
*Completed: 2026-05-04 19:31 UTC*
