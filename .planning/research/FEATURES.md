# Feature Landscape: Compass UI Parity Reskin (v1.1)

**Domain:** Plugin UI reskin to match Paperclip host visual language  
**Milestone:** v1.1 — Host-parity token migration  
**Researched:** 2026-05-04  
**Scope:** ~55 UI components, 5 mode panels, 173 broken class references  

---

## Executive Summary

Compass v1.0 ships fully functional with all 5 mode panels (Assess, Found, Revive, Reposition, Memory) complete and working. However, the UI visually breaks host parity because:

1. **Custom spacing tokens don't exist** (`gap-xs`, `px-sm`, `py-md`, etc.) → 146 references that silently no-op → collapsed/overlapping layouts
2. **Light-only color utilities** (`bg-green-50`, `text-slate-600`, `border-green-200`) → 8 references breaking dark mode
3. **Rounded corners mismatch** (`rounded-lg`, `rounded-xl`) → 7 references conflicting with host's sharp-corner design (`--radius-lg: 0px`)
4. **SidebarLink hardcoded old theme** (`bg-zinc-800`, `text-zinc-400`) → breaks sidebar integration

**Root cause:** Compass was built standalone (like `paperclip-vision`), but ships as an embedded React component tree. The host Tailwind tokens ARE available (Paperclip renders plugins directly in the host React tree at `paperclip-temp/ui/src/plugins/slots.tsx`, not in iframes). Migration = token swap, no CSS duplication needed.

**Migration scope:** Concrete, mechanical, low-risk. No behavior changes. No new dependencies. Follows host shadcn "new-york" style (neutral baseColor, sharp corners `--radius-lg: 0px`, lucide icons).

---

## Table Stakes Features

Features users expect in an embedded plugin UI. Missing = broken plugin experience.

| Feature | Why Expected | Complexity | Migration Blocker? |
|---------|--------------|------------|------|
| **Spacing respects host design** | Host uses specific spacing scale (px-2, px-3, px-4 = 8px, 12px, 16px); custom `gap-xs`, `px-md` silently no-op, causing overlaps | L | YES — 146 refs across 55 components |
| **Dark mode visibility** | Host supports light/dark toggle; light-only colors (`bg-green-50`, `text-slate-600`) invisible in dark | M | YES — affects 8 status/badge components |
| **Color tokens match host** | Host uses semantic tokens (`bg-card`, `text-muted-foreground`, `border-border`); custom colors break contrast + a11y | M | YES — affects alert/status rendering |
| **Rounded corners sharp** | Host design is flat/square (`--radius-lg: 0px`); rounded components look "off-brand" | S | YES — 7 refs in card headers |
| **Icons are lucide** | Host uses lucide-react; no incompatible icon libraries | S | VERIFIED — Compass already uses lucide |
| **Sidebar link styled correctly** | Plugin sidebar must match host inactive/active states; hardcoded `bg-zinc-800` breaks | S | YES — SidebarLink broken |
| **Modal/popover z-index respected** | Plugin modals must layer above host content correctly; custom z-values can break modals | S | LIKELY — verify after token migration |

---

## Differentiators

Features that set Compass apart from vanilla plugin hosting experience. Not expected, but highly valued once discovered.

| Feature | Value Proposition | Complexity | Tier |
|---------|-------------------|------------|------|
| **Screenshot-diff regression testing** | Verify UI changes don't visually regress; golden screenshots per mode + dark mode variant | M | Phase 4 (Polish) |
| **Dark mode QA completeness** | Explicit verification matrix: all 55 components rendered in light + dark + contrast check | S | Phase 4 (Polish) |
| **Accessibility audit gate** | WCAG contrast checker in CI; flag components with insufficient foreground/background ratios after migration | M | Phase 4 (Verification) |
| **Component token inventory** | Spreadsheet: which component uses which token, migration status, verifier coverage — for future plugin devs | S | Post-phase 1 (Documentation) |

---

## Anti-Features

Explicitly NOT building. What to do instead.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Theme switcher within plugin** | Host controls theme globally; plugin-local theme toggle breaks user expectations + causes duplication | Inherit host theme via CSS custom properties (`--background`, `--foreground`, etc. already available) |
| **Custom design system** | Compass is a plugin, not a design platform; maintaining separate token set is unsustainable | Use host tokens exclusively; if missing, propose PR to Paperclip host `index.css` |
| **Scoped Tailwind layer** | Plugin can't inject new Tailwind layer safely without breaking host builds; theme nesting conflicts | Use existing host Tailwind output; esbuild bundles lucide SVGs only |
| **CSS-in-JS (emotion/styled-components)** | Runtime overhead; conflicts with host React context; breaks SSR if Paperclip ever ships it | Use Tailwind utility classes + CSS variables only |
| **Icon replacement** | Paperclip uses lucide; adding Heroicons or FontAwesome creates visual inconsistency + bundle size | Stick with lucide-react; if icon missing, add to lucide upstream |

---

## Concrete Migration Map

These are the EXACT replacements for broken token patterns (173 total references across 55 components):

### Spacing Tokens (146 references)

Current Compass spacing classes don't exist in Tailwind. Standard Tailwind spacing: `1 = 4px, 2 = 8px, 3 = 12px, 4 = 16px, 6 = 24px, 8 = 32px`.

| Current (broken) | Replace with | Rationale |
|---|---|---|
| `gap-xs` (22 refs) | `gap-1` or `gap-2` | `gap-1` = 4px (tight), `gap-2` = 8px (comfortable) — context-dependent |
| `gap-sm` (18 refs) | `gap-2` | 8px — standard small gap |
| `gap-md` (51 refs) | `gap-3` or `gap-4` | `gap-3` = 12px (standard), `gap-4` = 16px (section separation) |
| `px-xs` (6 refs) | `px-2` | 8px horizontal padding (tight inline element) |
| `px-sm` (8 refs) | `px-3` | 12px horizontal padding (standard) |
| `px-md` (51 refs) | `px-4` | 16px horizontal padding (standard card/button) |
| `py-xs` (14 refs) | `py-1` | 4px vertical padding (badge/chip) |
| `py-sm` (53 refs) | `py-2` | 8px vertical padding (button/input) |
| `py-md` (22 refs) | `py-3` | 12px vertical padding (section header) |

**High-leverage pattern:** Most `py-sm` and `py-md` refs appear in buttons and card headers. Run visual audit after migration to confirm no regressions.

### Color Tokens (8 light-only refs)

| Current (broken) | Replace with | Rationale |
|---|---|---|
| `bg-green-50 text-green-700 border-green-200` (2 refs) | `bg-emerald-500/10 text-emerald-500 border-emerald-500/20` | Semi-transparent semantic green, dark-mode safe |
| `bg-red-50 text-red-700 border-red-200` (1 ref) | `bg-red-500/10 text-red-500 border-red-500/20` | Semi-transparent semantic red, dark-mode safe |
| `bg-slate-50 text-slate-600 border-slate-200` (1 ref) | `bg-muted text-muted-foreground border-border` | Host's semantic neutral surface |
| `text-green-700` (isolated) | `text-emerald-500` | Host's emerald accent |
| `text-red-700` (isolated) | `text-red-500` | Host's red semantic |
| `text-slate-600` (isolated) | `text-muted-foreground` | Host's neutral text |
| `border-slate-200` (isolated) | `border-border` | Host's semantic border |
| `bg-green-50` (isolated) | `bg-emerald-500/10` | Host-safe green surface |

**Implementation note:** StatusBadge.tsx is the heaviest user (3+ refs). Audit this component first; fix there will cascade to DriftItemCard, ConfidenceBar, etc.

### Rounded Corners (7 refs)

| Current (broken) | Replace with | Rationale |
|---|---|---|
| `rounded-lg` (5 refs) | `rounded-none` | Host uses `--radius-lg: 0px` (flat design) |
| `rounded-xl` (2 refs) | `rounded-none` | Host uses `--radius-lg: 0px` (flat design) |

**Alternative interpretation:** If specific corners are visually important (e.g., input fields), check if host has `rounded-md` defined. Per `index.css`, `--radius-md: 0.5rem`, so `rounded-md` = 8px (slightly rounded). Use only if host precedent exists.

### SidebarLink Hardcoding (1 file, not token-based)

`src/ui/SidebarLink.tsx` hardcodes `bg-zinc-800`, `text-zinc-400`, `hover:bg-zinc-800` — entirely incompatible.

| Current | Replace with |
|---|---|
| `bg-zinc-800 text-zinc-400` (inactive) | `bg-sidebar text-sidebar-foreground/60` |
| `bg-zinc-800 text-white` (active) | `bg-sidebar-accent text-sidebar-accent-foreground` |
| `hover:bg-zinc-800` | `hover:bg-sidebar-accent/50` |

---

## Component Inventory & Migration Status

Total: 64 files across 5 mode panels + shared. Estimated 55 visual components (logic components and utilities excluded).

### Assess Panel (10 files, ~32 broken token refs)

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| AssessPanel | `src/ui/assess/AssessPanel.tsx` | HIGH PRIORITY | Root — fix spacing first |
| DriftReportPanel | `src/ui/assess/DriftReportPanel.tsx` | HIGH | Lists drifts; check gap-md refs |
| DriftItemCard | `src/ui/assess/DriftItemCard.tsx` | HIGH | Uses ConfidenceBar; check padding |
| ConfidenceBar | `src/ui/assess/ConfidenceBar.tsx` | LOW | Already uses host colors |
| EvidenceChip | `src/ui/assess/EvidenceChip.tsx` | LOW | Uses `bg-card`, `border-border` |
| AmendmentDiff | `src/ui/assess/AmendmentDiff.tsx` | MEDIUM | Code diff layout; check gap-xs |
| ApprovalRoutingModal | `src/ui/assess/ApprovalRoutingModal.tsx` | MEDIUM | Modal spacing |
| ApprovingWaitingState | `src/ui/assess/ApprovingWaitingState.tsx` | LOW | Status message |
| CustomOverrideWarning | `src/ui/assess/CustomOverrideWarning.tsx` | MEDIUM | Warning box styling |

### Found Panel (7 files)

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| FoundPanel | `src/ui/found/FoundPanel.tsx` | HIGH PRIORITY | Main flow — step nav, progress |
| PresetSelector | `src/ui/found/PresetSelector.tsx` | MEDIUM | Preset card layout |
| InterviewSection | `src/ui/found/InterviewSection.tsx` | MEDIUM | Section card, question spacing |
| QuestionRenderer | `src/ui/found/QuestionRenderer.tsx` | MEDIUM | Input/textarea styling |
| VisionPreview | `src/ui/found/VisionPreview.tsx` | MEDIUM | Markdown code block |
| ProvisioningSummary | `src/ui/found/ProvisioningSummary.tsx` | MEDIUM | Summary list layout |
| SectionNavRail | `src/ui/found/SectionNavRail.tsx` | LOW | Navigation, check button styling |

### Revive Panel (8 files)

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| RevivePanel | `src/ui/revive/RevivePanel.tsx` | HIGH PRIORITY | Flow entry point |
| ActionItemCard | `src/ui/revive/ActionItemCard.tsx` | HIGH | Heavy spacing + button styling |
| ActionQueuePanel | `src/ui/revive/ActionQueuePanel.tsx` | MEDIUM | List layout |
| PriorityBadge | `src/ui/revive/PriorityBadge.tsx` | MEDIUM | Badge color + shape |
| StallSummaryBadge | `src/ui/revive/StallSummaryBadge.tsx` | MEDIUM | Status badge variant |
| SamplePivotModal | `src/ui/revive/SamplePivotModal.tsx` | MEDIUM | Modal content layout |
| ActionConfirmationModal | `src/ui/revive/ActionConfirmationModal.tsx` | MEDIUM | Modal spacing |

### Reposition Panel (6 files)

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| RepositionPanel | `src/ui/reposition/RepositionPanel.tsx` | HIGH PRIORITY | Shift classifier + intent |
| RepositionInterviewFlow | `src/ui/reposition/RepositionInterviewFlow.tsx` | MEDIUM | Interview variant, spacing |
| IntentEntry | `src/ui/reposition/IntentEntry.tsx` | MEDIUM | Input field styling |
| ScopeConfirmation | `src/ui/reposition/ScopeConfirmation.tsx` | MEDIUM | Confirmation layout |
| CascadeReviewPanel | `src/ui/reposition/CascadeReviewPanel.tsx` | MEDIUM | Amendment review |
| AgentDecisionCard | `src/ui/reposition/AgentDecisionCard.tsx` | LOW | Card variant |

### Memory/History Panel (13 files)

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| HistoryPanel | `src/ui/memory/HistoryPanel.tsx` | MEDIUM | Tab/section layout |
| HistoryTabBadge | `src/ui/memory/HistoryTabBadge.tsx` | LOW | Badge display |
| FindingCard | `src/ui/memory/FindingCard.tsx` | MEDIUM | Finding list item styling |
| FindingStatusBadge | `src/ui/memory/FindingStatusBadge.tsx` | MEDIUM | Status variant |
| ModeBadge | `src/ui/memory/ModeBadge.tsx` | LOW | Mode label badge |
| PriorFindingsLink | `src/ui/memory/PriorFindingsLink.tsx` | LOW | Link styling |
| ContextRefreshBanner | `src/ui/memory/ContextRefreshBanner.tsx` | LOW | Notification banner |
| SchedulesSection | `src/ui/memory/SchedulesSection.tsx` | MEDIUM | Schedule list layout |
| ScheduleCreationForm | `src/ui/memory/ScheduleCreationForm.tsx` | MEDIUM | Form spacing + input styling |
| ScheduleRoutineRow | `src/ui/memory/ScheduleRoutineRow.tsx` | LOW | Table row styling |

### Shared Components & Root (10 files)

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| MainPanel | `src/ui/MainPanel.tsx` | HIGH PRIORITY | Root orchestrator; tab nav |
| SidebarLink | `src/ui/SidebarLink.tsx` | HIGH PRIORITY | Hardcoded zinc colors |
| StatusBadge | `src/ui/components/StatusBadge.tsx` | HIGH PRIORITY | Light-only green/red/slate |
| ModeBanner | `src/ui/components/ModeBanner.tsx` | CLEAN | Already uses host tokens |
| AgentCard | `src/ui/components/AgentCard.tsx` | MEDIUM | StatusBadge inheritance |
| VisionStatusDisplay | `src/ui/components/VisionStatusDisplay.tsx` | MEDIUM | StatusBadge usage |
| InventoryDisplay | `src/ui/components/InventoryDisplay.tsx` | MEDIUM | Section layout |
| ChatPanel | `src/ui/components/ChatPanel.tsx` | MEDIUM | Input styling |
| ActivityTimeline | `src/ui/components/ActivityTimeline.tsx` | MEDIUM | Timeline layout |
| DocumentList | `src/ui/components/DocumentList.tsx` | MEDIUM | List item styling |

---

## Feature Dependencies

Token migrations have order dependencies:

```
Shared Components (StatusBadge, ModeBanner, etc.)
  ↓
  +— Assess Panel (DriftItemCard uses StatusBadge)
  +— Found Panel (uses generic spacing patterns)
  +— Revive Panel (ActionItemCard uses spacing heavily)
  +— Reposition Panel (interview variant)
  +— Memory Panel (uses shared badge styles)
  ↓
SidebarLink + MainPanel (root orchestration)
  ↓
Verification (screenshot diffs, dark-mode audit)
```

**Practical approach:**

1. **Phase 1 (Design primitives):** Fix StatusBadge, ModeBanner, shared component colors + spacing. Fix SidebarLink.
   - Verification: Sidebar renders, no visual overlap in mode banner
   
2. **Phase 2 (Assess + Found):** Migrate spacing + colors in both panels + internal components.
   - Verification: Cards lay out correctly, dark mode visible, no collapsed sections
   
3. **Phase 3 (Revive + Reposition):** Same approach for action/interview flows.
   - Verification: Modals don't clip, button spacing consistent
   
4. **Phase 4 (Memory + Polish):** History panel + dark-mode QA + screenshot diffs.
   - Verification: Screenshot golden files, contrast check passing

---

## Verification Requirements

What "parity" means as testable gates:

### Minimum Viable Token Migration (Phase 1–3)

- [ ] **Zero broken-class hits:** `grep` for 173 broken patterns returns 0 matches
- [ ] **Layout doesn't collapse:** Cards have breathing room, no overlaps
- [ ] **Dark mode visible:** Render in dark host; no invisible text, sufficient contrast
- [ ] **Sidebar link styled:** Active/inactive states match host sidebar palette

### Optional Polish (Phase 4)

- [ ] **Screenshot golden files:** Per-component light + dark renders
- [ ] **Contrast audit:** WCAG AA min 4.5:1 text/background on all interactive elements
- [ ] **Icon audit:** All lucide icons render; no broken imports
- [ ] **Responsive:** Sidebar panel width 320px; no horizontal scroll

---

## Success Criteria

v1.1 is complete when:

- **Functional:** All 5 mode panels work identically to v1.0 (behavior unchanged)
- **Visual:** Compass UI is indistinguishable from host shell — same colors, spacing, corners
- **Dark mode:** Light + dark rendering both fully visible + readable; contrast ≥ 4.5:1
- **Verifiable:** Zero broken-class hits; screenshot diffs < 2%; accessibility check passing

---

## Sources

- **Project context:** `.planning/PROJECT.md` (v1.0 shipped, v1.1 defined)
- **UI handoff:** `UI_REDO_HANDOFF.md` (root cause analysis, migration map)
- **Token reference:** `/Users/nicholasrhodes/Development/paperclip-temp/ui/src/index.css` (host shadcn tokens)
- **Component audit:** `src/ui/**/*.tsx` (173 broken-class references quantified)
- **Host examples:** ApprovalCard.tsx pattern analysis (shadcn usage)
- **Spacing scale:** Tailwind v4 default spacing scale
