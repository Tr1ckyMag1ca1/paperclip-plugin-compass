# Compass UI Redo — Handoff

**Status:** ✓ COMPLETE (2026-05-12)

All 80+ broken custom tokens migrated to host equivalents across 13 memory components (Phase 10). UI verification gates (grep, contrast, build, bundle size) all PASSED. Plugin is production-ready for v1.1 public release.

See [.planning/phases/10-memory-verification-documentation/10-03-SUMMARY.md](./.planning/phases/10-memory-verification-documentation/10-03-SUMMARY.md) for verification results and [docs/WCAG_AUDIT.md](./docs/WCAG_AUDIT.md) for contrast audit details.

---

## Goal

Reskin Compass UI to match Paperclip host (functional > fancy, indistinguishable from rest of app). Fix layout bugs along the way.

## Root Cause of Current Look

Compass renders directly in host React tree (no iframe/shadow — confirmed in `paperclip-temp/ui/src/plugins/slots.tsx`). Host Tailwind shadcn tokens ARE available. Current code breaks parity by:

1. Using **light-only** Tailwind utilities (`bg-green-50`, `text-slate-600`, `bg-red-50`, `border-green-200`) → look wrong in dark host.
2. Using **nonexistent custom tokens** (`gap-xs`, `px-sm`, `py-md`, `gap-md`) → silently no-op → collapsed/overlapping layout (see screenshot of broken Reposition mode: header overlap, dropdown clipped, no padding).
3. Zero use of host shadcn primitives (`bg-card`, `border-border`, `text-muted-foreground`, etc.).

Fix = swap classes to host tokens. No CSS duplication needed. Compass stays slim.

## Reference Design Source

`~/Development/paperclip-temp/ui/src/components/` — shadcn "new-york" style, `baseColor: neutral`, lucide icons.

Key tokens (from `paperclip-temp/ui/src/index.css`):
- Surfaces: `bg-background`, `bg-card`, `bg-muted`, `bg-popover`
- Text: `text-foreground`, `text-muted-foreground`
- Borders: `border-border`, `border-input`
- Sharp corners: `--radius-lg: 0px` (Paperclip is flat-square, NOT rounded-2xl)
- Sidebar: `bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-border`
- Lucide icons only
- Mono IDs (e.g., `ALE-285` style)

## Recommended Approach: GSD Milestone

Scope (~55 components, 5 modes, deep state) deserves PLAN.md + atomic commits + verifier loop.

```
/gsd-new-milestone "Compass UI parity with Paperclip host"
```

### Phase Split

1. **Design primitives + shell** — MainPanel, SidebarLink, ModeBanner, StatusBadge, shared Card/Section/Button wrappers. Visible win fast.
2. **Assess + Found panels** — AssessPanel, DriftReportPanel, DriftItemCard, EvidenceChip, ConfidenceBar, AmendmentDiff, ApprovingWaitingState, ApprovalRoutingModal, CustomOverrideWarning + all FoundPanel components.
3. **Revive + Reposition panels** — RevivePanel, ActionItemCard, ActionQueuePanel, ActionConfirmationModal, PriorityBadge, StallSummaryBadge, SamplePivotModal + RepositionInterviewFlow, IntentEntry, ScopeConfirmation, CascadeReviewPanel.
4. **Memory/History + polish + screenshot diff verify** — HistoryPanel, FindingCard, ModeBadge, FindingStatusBadge, ContextRefreshBanner, PriorFindingsLink, SchedulesSection, ScheduleCreationForm, ScheduleRoutineRow, HistoryTabBadge.

One PR per phase. Each ships independently usable.

## Inventory of UI Files

```
src/ui/index.tsx
src/ui/MainPanel.tsx
src/ui/SidebarLink.tsx
src/ui/components/        (9 files: ModeBanner, StatusBadge, AgentCard, VisionStatusDisplay, InventoryDisplay, ChatPanel, ActivityTimeline, DocumentList, ErrorBoundary)
src/ui/assess/            (10 files)
src/ui/found/             (TBD — ls)
src/ui/revive/            (9 files)
src/ui/reposition/        (5 files)
src/ui/memory/            (13 files)
```

## Build Confirmation

- `esbuild.config.mjs` bundles UI to `dist/ui` via `createPluginBundlerPresets({ uiEntry: "src/ui/index.tsx" })`.
- Build: `pnpm build` (or `npm run build`).
- Watch: `pnpm dev`.

## Concrete Class Migration Map

| Current (broken) | Replace with |
|---|---|
| `bg-green-50 text-green-700 border-green-200` | `bg-emerald-500/10 text-emerald-500 border-emerald-500/20` |
| `bg-red-50 text-red-700 border-red-200` | `bg-red-500/10 text-red-500 border-red-500/20` |
| `bg-slate-50 text-slate-600 border-slate-200` | `bg-muted text-muted-foreground border-border` |
| `gap-xs` / `gap-sm` / `gap-md` | `gap-1` / `gap-2` / `gap-3` |
| `px-xs` / `px-sm` / `px-md` | `px-1` / `px-2` / `px-3` |
| `py-xs` / `py-sm` / `py-md` | `py-1` / `py-2` / `py-3` |
| `bg-white` / `bg-gray-50` (panels) | `bg-card` |
| `text-gray-900` | `text-foreground` |
| `text-gray-500` / `text-gray-600` | `text-muted-foreground` |
| `border-gray-200` | `border-border` |
| `rounded-lg` / `rounded-xl` | `rounded-none` (host uses sharp corners) |

## Color Semantics Correction

**v1.0 Design Error:** Compass incorrectly used emerald as a "primary" color alongside other semantic colors. This caused visual confusion and violated the host's semantic palette.

**v1.1 Correction (Phase 10):** Emerald is the semantic "success" color only. All other modes and states use their designated semantic colors.

**Correct semantic palette:**
- **Emerald (success):** Found mode, healthy status, confirmed items, successful operations
- **Red (error):** Revive mode, stalled status, errors, critical blockers
- **Yellow (warning):** Pending items, warnings, items requiring attention, draft states
- **Blue (info):** Assess mode, informational states, secondary actions
- **Neutral (gray):** Unimplemented features, unknown states, muted/inactive elements

**Why this matters:** Paperclip host uses neutral gray as the primary text and surface color (text-foreground, bg-card). Emerald and other colors are reserved for semantic state indication only. This ensures visual consistency with the host and reduces color overload in the UI. Users should immediately understand intent from color: green = good, red = problem, yellow = caution, blue = info, gray = inactive.

For components still using outdated color patterns, use the migration map above (bg-green-50 → bg-emerald-500/10, etc.).

## Phase 10 Status: Broken Patterns Verified Removed

All 28 broken patterns documented above have been confirmed REMOVED from the codebase across all 55+ components:
- ✓ 0 hits for gap-xs/sm/md, px-xs/sm/md, py-xs/sm/md
- ✓ 0 hits for text-label, text-body, text-heading
- ✓ 0 hits for light-only utilities (bg-green-50, text-slate-600, etc.)
- ✓ 0 hits for rounded-lg/xl/md

Verified via automated grep in [pnpm verify:broken-patterns](./scripts/verify-broken-patterns.ts).

## For Future Contributors

Start with [src/ui/PATTERNS.md](./src/ui/PATTERNS.md) for token usage guidelines and component conventions. Then reference this handoff document for the full migration history from v1.0 to v1.1.
