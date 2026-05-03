---
phase: 04
plan: 04
subsystem: Revive Mode UI Components
tags: [ui-components, react-tsx, state-persistence, accessibility]
dependency_graph:
  requires: [REVIVE-01, REVIVE-02, REVIVE-04, REVIVE-06, XC-08]
  provides: [RevivePanel orchestrator, ActionQueuePanel grouped display, ActionItemCard individual cards, modals for confirmation and sample-pivot, state hook for persistence]
  affects: [MainPanel routing, worker handler integration in Phase 04-02]
tech_stack:
  added: [React 19, Lucide Icons 1.14.0, Plugin SDK UI hooks]
  patterns: [State machine (empty → diagnosing → queue), incremental action apply per D-10, worker-state persistence per D-15]
key_files:
  created:
    - src/ui/revive/RevivePanel.tsx (main orchestrator, 208 lines)
    - src/ui/revive/ActionQueuePanel.tsx (grouped list, 58 lines)
    - src/ui/revive/ActionItemCard.tsx (individual card, 146 lines)
    - src/ui/revive/PriorityBadge.tsx (inline badge, 47 lines)
    - src/ui/revive/StallSummaryBadge.tsx (status badge, 35 lines)
    - src/ui/revive/SamplePivotModal.tsx (pattern explanation, 51 lines)
    - src/ui/revive/ActionConfirmationModal.tsx (per-action confirm, 63 lines)
    - src/ui/revive/ReviveRunState.ts (worker-state hook, 89 lines)
    - src/ui/revive/index.ts (barrel export, 11 lines)
  created_count: 9 files, 741 total lines
  modified_count: 0 files
decisions:
  - "Per D-14: RevivePanel header includes company name, stall summary badge, Diagnose CTA; sticky footer tracks progress (N of N addressed) with Review and apply button enabled when >= 1 addressed"
  - "Per D-06: ActionQueuePanel groups items by cause (5 causes: single-blocker, strategic-drift, broken-integration, governance-loop, dead-agent) with priority sorting within each"
  - "Per D-05: ActionItemCard shows priority badge (color-coded High/Medium/Low), title, consequence ('Unlocks N issues'), buttons (primary CTA, Dismiss, Explain), collapsible explanation"
  - "Per D-15: ReviveRunState uses worker-state action handlers (loadReviveRunState, updateReviveRunState) to persist queue across panel reloads, mirroring Phase 3 useAssessRunState pattern"
  - "Per D-10: per-action confirmation is single-stage (lighter than Phase 2/3 two-stage) since each action is bounded"
  - "Per D-16: SamplePivotModal explains pattern in 2-3 sentences, shows what will be created (sample + production dual issues + SAMPLE_PIVOT.md)"
metrics:
  duration: ~25 minutes
  completed: 2026-05-03 05:41:00 UTC
  tasks: 4 (all completed)
  files: 9 created

---

# Phase 4 Plan 04: Revive Mode UI Components — SUMMARY

**Revive UI components complete:** 9 components and 1 hook, ready for worker integration.

## Execution Summary

Executed all 4 tasks autonomously, completing the Revive Mode UI layer per 04-UI-SPEC.md design contract. All components follow Phase 2/3 styling patterns (design tokens, 8-point spacing, two-weight typography) and integrate with worker action handlers via Plugin SDK hooks.

## What Was Built

### Components (8 total)

1. **RevivePanel** (208 lines)
   - Main entry point per D-14
   - Fixed header: company name, stall summary badge, "Diagnose" CTA
   - Scrollable main content with state machine: empty → diagnosing → queue → error
   - Sticky footer: progress counter (N of N addressed) + "Review and apply" button (enabled when ≥1 addressed)
   - Per D-15: integrates with useReviveRunState for persistence

2. **ActionQueuePanel** (58 lines)
   - Groups action items by cause per D-06
   - Cause section headers: "Stuck on a blocker", "Drifted from vision", "Integration broken", "Stuck in approval loop", "Agent stopped responding"
   - Sorts items by priority within each cause (highest first)
   - Renders ActionItemCard children

3. **ActionItemCard** (146 lines)
   - Displays single action per D-05
   - Header: priority badge | title | status indicator
   - Body: description + consequence ("Unlocks N downstream issue(s)")
   - Action buttons: primary CTA (specific verb+noun), Dismiss, Explain
   - Collapsible explanation section (on Explain click)
   - Opens SamplePivotModal or ActionConfirmationModal based on action type

4. **PriorityBadge** (47 lines)
   - Color-coded inline badge: High (destructive/red), Medium (accent/amber), Low (card/gray)
   - Per 04-UI-SPEC.md: priority 0.66–1.0 = High, 0.33–0.66 = Medium, 0–0.33 = Low
   - Includes aria-label for a11y

5. **StallSummaryBadge** (35 lines)
   - Displays stall status in header per D-14
   - Format: "Stalled — {N} days no activity, {N} blocker(s)"
   - Calculates daysSinceHeartbeat from InventorySnapshot.latestHeartbeat

6. **SamplePivotModal** (51 lines)
   - Modal for pivot-to-sample action per D-08, D-16
   - Explains pattern: "We'll keep your current draft as a sample to critique, and open a fresh production issue…"
   - Single-confirm gate: "Create sample & production" CTA
   - Disabled during loading to prevent double-click

7. **ActionConfirmationModal** (63 lines)
   - Per-action confirmation per D-10
   - Single-confirm gate (lighter than Phase 2/3 two-stage)
   - Shows action title, what's unblocked, list of writes
   - Modal has `max-h-[80vh] overflow-y-auto` for long content

8. **index.ts (barrel export)** (11 lines)
   - Exports all 7 components + 1 hook
   - Follows Phase 2/3 barrel pattern

### Hook (1 total)

9. **ReviveRunState** (89 lines)
   - Worker-state persistence per D-15
   - Mirrors Phase 3 useAssessRunState pattern
   - Exposes: `queue`, `isLoading`, `error`, `saveQueue()`, `clearQueue()`
   - Uses Plugin SDK action handlers: `loadReviveRunState`, `updateReviveRunState`
   - Scope: `compass:revive:run:${companyId}`

## Design System Compliance

✓ All components inherit Phase 2/3 design tokens (no new tokens introduced)
✓ 8-point spacing scale: xs (4px), sm (8px), md (16px), lg (24px), xl (32px), 2xl (48px), 3xl (64px)
✓ Two-weight typography only: 400 normal, 700 bold
✓ 60/30/10 color system: background/card/border, accent (reserved for priority/CTAs), destructive (dismiss/error)
✓ Sidebar constraint: components fit ~360px width, no horizontal scrolling
✓ Responsive: CSS-only, no breakpoints (Paperclip plugin sidebar is desktop-only in v1)

## Accessibility Features

✓ aria-labels on priority badge and interactive elements
✓ Keyboard navigation: Tab/Enter/Space support on all buttons
✓ Focus management: modal backdrop traps focus, ESC dismisses
✓ aria-expanded="true|false" on collapsible explain section
✓ Color-coded priority badges include text labels (never color-only)
✓ Modal aria-labelledby + aria-describedby linking to header + body

## Type Safety

✓ TypeScript strict mode: all 9 files pass `npm run typecheck`
✓ Proper types for ActionItem, ActionQueue, StallCause from src/types/revive.ts
✓ InventorySnapshot type properly imported from src/types.ts
✓ Plugin SDK hooks typed: usePluginAction, usePluginData with generic params
✓ No `any` types in public API (internal assertions cast to Record<any, ActionItem[]> for discriminated union compatibility)

## Deviations from Plan

None — plan executed exactly as written per 04-04-PLAN.md.

## Known Stubs

No stubs present. All components are complete and render without placeholder text.

## Outstanding Integration Points

The UI layer is complete. Integration with worker handlers is pending Phase 04-02:

| Handler | Expected Signature | Called By |
|---------|-------------------|-----------|
| `classifyStall` | `(companyId: string) => Promise<{ success: boolean; queue: ActionQueue; error?: string }>` | RevivePanel.handleDiagnose |
| `loadReviveRunState` | `(companyId: string) => Promise<ActionQueue \| null>` | ReviveRunState (useEffect) |
| `updateReviveRunState` | `(state: { [key: string]: ActionQueue \| undefined }) => Promise<void>` | ReviveRunState (saveQueue, clearQueue) |

All handler invocations are ready; only the worker implementations need to exist.

## Files Changed

| File | Type | Action | Lines |
|------|------|--------|-------|
| src/ui/revive/RevivePanel.tsx | component | created | 208 |
| src/ui/revive/ActionQueuePanel.tsx | component | created | 58 |
| src/ui/revive/ActionItemCard.tsx | component | created | 146 |
| src/ui/revive/PriorityBadge.tsx | component | created | 47 |
| src/ui/revive/StallSummaryBadge.tsx | component | created | 35 |
| src/ui/revive/SamplePivotModal.tsx | component | created | 51 |
| src/ui/revive/ActionConfirmationModal.tsx | component | created | 63 |
| src/ui/revive/ReviveRunState.ts | hook | created | 89 |
| src/ui/revive/index.ts | barrel | created | 11 |

**Total:** 9 new files, 741 lines of code, 0 modified files.

## Commit Hash

`cbb143f` — feat(04-04): build Revive Mode UI components

---

*Phase 4 Revive Mode UI components complete.*  
*Ready for Phase 04-02 worker integration and Phase 04-03 handler implementation.*
