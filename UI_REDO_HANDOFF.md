# Compass UI Redo — Handoff

Goal: reskin Compass UI to match Paperclip host (functional > fancy, indistinguishable from rest of app). Fix layout bugs along the way.

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

## First Action When Picked Up

```
cd ~/Development/Paperclip/paperclip-plugin-compass
/gsd-new-milestone "Compass UI parity with Paperclip host"
```

Then phase 1 plan-phase. Verifier should grep for the broken-class patterns above and confirm zero hits.
