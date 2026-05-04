# Architecture: Compass Plugin UI Integration with Paperclip Host (v1.1)

**Project:** Compass — Paperclip Strategic Consultant Plugin  
**Research Date:** 2026-05-04  
**Milestone:** v1.1 — UI parity reskin with host design system  
**Focus:** UI integration patterns, shared primitives, design token inheritance, component boundaries  
**Confidence:** HIGH (confirmed via host source code, plugin SDK contract, live render tree inspection)

---

## Executive Summary

Compass renders directly in the Paperclip host's React tree (no iframe, no shadow DOM). The host's Tailwind design tokens (shadcn colors, semantics, OKLCH color system) are globally available to the plugin bundle via CSS custom properties. The plugin currently breaks visual parity by using nonexistent custom token names (`gap-xs`, `px-sm`, `py-md`) that silently no-op, causing collapsed/overlapping layouts.

**Integration Model:** The host loads the plugin's UI bundle as ES modules from `/_plugins/:pluginId/ui/` and injects each plugin component into named slot outlets in the main React tree. Plugin components share the host's React context, CSS cascade, and design system without code duplication. No CSS bundling, no scoping, no theme injection—just direct inheritance of host's Tailwind compiled classes.

**Design Token Chain:** `paperclip-temp/ui/src/index.css` defines CSS custom properties (`--background`, `--card`, `--border`, etc.) in `:root` and `.dark` selectors. Tailwind v4's `@theme inline` block maps these custom properties to color utilities. Plugin Tailwind classes resolve against host CSS variables at runtime.

**v1.1 Strategy:** Keep plugin UI thin (no custom Tailwind config, no CSS bundling). Swap broken custom token classes (`gap-xs` → `gap-1`/`gap-2`, `px-sm` → `px-2`, `bg-green-50` → `bg-emerald-500/10`) to valid Tailwind utilities that resolve to host tokens. Create two new shared primitives (`Card`, `SectionHeader`) in `src/ui/components/` to standardize patterns across ~55 components and reduce duplication.

---

## Part 1: Three-Layer Plugin Architecture

### Manifest + Worker + UI Pattern

Compass follows the standard three-layer plugin architecture established by Paperclip's file-viewer and company-wizard plugins:

```
1. MANIFEST (src/manifest.ts → dist/manifest.js)
   ├─ Declares plugin metadata (id, version, capabilities)
   ├─ Declares UI slots (sidebar + main panel)
   └─ Declares worker entrypoint
   
2. WORKER (src/worker.ts → dist/worker.js)
   ├─ Plugin SDK definePlugin() setup
   ├─ getData handlers (fetch inventory, detect mode, etc.)
   ├─ performAction handlers (set mode override, apply amendments, etc.)
   ├─ Event subscriptions (heartbeat updates, user activity)
   └─ State writes to Plugin SDK (scoped by companyId)
   
3. UI (src/ui/ → dist/ui/index.js)
   ├─ React components for sidebar + main panel slots
   ├─ usePluginData/usePluginAction/useHostContext hooks
   ├─ Mode-specific panels (Assess, Found, Revive, Reposition, Memory)
   ├─ Shared primitives (Card, SectionHeader, StatusBadge, etc.)
   └─ Zero CSS bundling (relies entirely on host's Tailwind)
```

### High-Level Data Flow (v1.0 operational)

```
User opens company in Paperclip
  ↓
Host renders plugin sidebar + main panel slots
  ↓
SidebarLink loads (minimal entry point)
MainPanel loads, calls getInventory action
  ↓
Worker getData("getInventory") fetches company snapshot
  ↓
Worker getData("getDetectedMode") auto-detects mode (Found/Assess/Revive/Reposition)
  ↓
MainPanel shows mode banner + mode-specific panel
  ↓
User interacts (e.g., clicks "Accept" on drift item)
  ↓
Component calls usePluginAction("applyDriftAmendment") → Bridge sends to worker
  ↓
Worker performAction handler validates + applies (SDK writes to VISION.md, issues, etc.)
  ↓
Result returned to UI, component state updates
  ↓
User sees confirmation (amendment queued for approval, etc.)
```

---

## Part 2: Plugin UI Rendering Model

### How Host Loads Plugin UI

**Location:** `paperclip-temp/ui/src/plugins/slots.tsx` (host side)

The host implements a plugin slot system that:

1. **Discovers slots** — Reads plugin manifest for `ui.slots[]` declarations
2. **Loads UI module dynamically** — HTTP request to `/_plugins/:pluginId/ui/index.js` (ES module)
3. **Resolves named exports** — Calls `import()` and retrieves named exports (e.g., `SidebarLink`, `MainPanel`)
4. **Injects into React tree** — Renders plugin component inline in host React tree (NOT iframed)
5. **Wraps with bridge** — Wraps in `PluginBridgeScope` to inject bridge context (pluginId, host methods)
6. **Error isolation** — Each plugin wrapped in error boundary per plugin

**Key Insight:** Plugin components are NOT iframed or shadow-DOM isolated. They share the host's:
- React instance (hooks, context)
- Global CSS (Tailwind classes resolve to host-compiled utilities)
- Event system (window events, DOM events)
- localStorage/sessionStorage

### Compass Manifest UI Slots

```typescript
ui: {
  slots: [
    {
      slotType: 'sidebar',
      exportName: 'SidebarLink',
      description: 'Sidebar link to Compass'
    },
    {
      slotType: 'plugin-panel',
      exportName: 'MainPanel',
      description: 'Main Compass diagnostic dashboard'
    }
  ]
}
```

**SidebarLink slot:**
- Rendered in left sidebar (next to other plugin entries)
- Receives `context: { companyPrefix?: string, ... }`
- Currently has broken styling (hard-coded `text-zinc-800`, should be semantic)

**MainPanel slot:**
- Rendered as plugin's main content area (center/right)
- Receives `context: { companyId, companyPrefix, projectId, ... }`
- Acts as root for Compass's entire UI tree
- Full height/width allocation from host

### React Tree Structure

```
Host App (React 19, global Tailwind CSS loaded)
  │
  ├─ PluginBridgeScope (for Compass SidebarLink)
  │   └─ SidebarLink
  │       └─ <a> + Compass icon + label
  │
  ├─ [Other plugins' sidebar entries...]
  │
  └─ Main Content Area
      └─ PluginBridgeScope (for Compass MainPanel)
          └─ MainPanel
              ├─ ModeBanner (detected mode + override dropdown)
              ├─ HistoryTabBar (tab buttons: Mode | History)
              ├─ Content Area (conditional)
              │   ├─ [if tab="mode"]
              │   │   └─ Mode Panel (AssessPanel | FoundPanel | RevivePanel | RepositionPanel)
              │   └─ [if tab="history"]
              │       └─ HistoryPanel
              └─ Footer (refresh button, chat input)
```

---

## Part 3: CSS Integration — Design Tokens Cascade

### Host Design System (OKLCH + CSS Variables)

**Source:** `paperclip-temp/ui/src/index.css` (Tailwind v4 with `@theme inline`)

```css
@theme inline {
  --color-background: var(--background);
  --color-card: var(--card);
  --color-border: var(--border);
  --color-foreground: var(--foreground);
  --color-muted-foreground: var(--muted-foreground);
  /* ... 40+ color + radius slots ... */
}

:root {
  --background: oklch(1 0 0);           /* white */
  --card: oklch(1 0 0);                 /* white (same as bg) */
  --border: oklch(0.922 0 0);           /* very light gray */
  --foreground: oklch(0.145 0 0);       /* near-black */
  --muted-foreground: oklch(0.556 0 0); /* medium gray */
  /* ... */
}

.dark {
  --background: oklch(0.145 0 0);       /* dark */
  --card: oklch(0.205 0 0);             /* slightly lighter dark */
  --border: oklch(0.269 0 0);           /* dark gray */
  --foreground: oklch(0.985 0 0);       /* near-white */
  --muted-foreground: oklch(0.708 0 0); /* light gray */
  /* ... */
}
```

### Token Resolution Chain

```
Plugin JSX
  <div className="bg-card text-foreground border border-border">

    ↓ (Tailwind compiler, host-side, runs once at build time)

Compiled Tailwind CSS (host/dist/main.css)
  .bg-card { background-color: var(--card); }
  .text-foreground { color: var(--foreground); }
  .border-border { border-color: var(--border); }

    ↓ (Applied to DOM at runtime)

Browser CSS Engine
  var(--card) = oklch(1 0 0)      [light mode]
  or
  var(--card) = oklch(0.205 0 0)  [dark mode, if .dark class on root]

    ↓ (Result)

DOM renders with correct colors for current theme automatically
```

**Integration Requirement:** Plugin must use ONLY class names that exist in the compiled Tailwind output. Custom names like `gap-xs`, `px-sm`, `py-md` are ignored silently.

**Verification:** Compass's esbuild output contains ZERO CSS. No `dist/ui/index.css` file. Only `dist/ui/index.js` (JavaScript).

### Current Breakage: Nonexistent Custom Tokens

**Broken classes in Compass (cause layout collapse):**
- `gap-xs`, `gap-sm`, `gap-md` → No gap applied, elements collapse
- `px-xs`, `px-sm`, `px-md` → No horizontal padding, text overflows
- `py-xs`, `py-sm`, `py-md` → No vertical padding, crowded
- `rounded-lg`, `rounded-xl` → Host uses `rounded-none` (0px radius, sharp corners)

**Light-only colors (broken in dark mode):**
- `bg-green-50 text-green-700 border-green-200` → Lime in light, invisible in dark
- `bg-red-50 text-red-700 border-red-200` → Pink in light, invisible in dark
- `bg-slate-50 text-slate-600 border-slate-200` → Gray in light, invisible in dark
- `text-gray-900`, `text-gray-500`, `text-gray-600` → Hard-coded, not semantic

### v1.1 Migration Map

```
| Current (broken)                              | Replace with (host-aware)        |
|-----------------------------------------------|----------------------------------|
| bg-green-50 text-green-700 border-green-200   | bg-emerald-500/10 text-emerald-500 border-emerald-500/20 |
| bg-red-50 text-red-700 border-red-200         | bg-red-500/10 text-red-500 border-red-500/20 |
| bg-slate-50 text-slate-600 border-slate-200  | bg-muted text-muted-foreground border-border |
| rounded-lg / rounded-xl                       | rounded-none |
| text-gray-900                                 | text-foreground |
| text-gray-500 / text-gray-600                 | text-muted-foreground |
| border-gray-200                               | border-border |
| gap-xs / gap-sm / gap-md                      | gap-1 / gap-2 / gap-3 |
| px-xs / px-sm / px-md                         | px-1 / px-2 / px-3 |
| py-xs / py-sm / py-md                         | py-1 / py-2 / py-3 |
```

---

## Part 4: Shared Primitives Strategy

### Current State: ~55 Components Across 5 Mode Folders

```
src/ui/
  ├─ components/          [9 shared utilities]
  │   ├─ ModeBanner.tsx
  │   ├─ StatusBadge.tsx
  │   ├─ AgentCard.tsx
  │   ├─ VisionStatusDisplay.tsx
  │   ├─ InventoryDisplay.tsx
  │   ├─ ChatPanel.tsx
  │   ├─ ActivityTimeline.tsx
  │   ├─ DocumentList.tsx
  │   └─ ErrorBoundary.tsx
  │
  ├─ assess/              [10 files]
  │   ├─ AssessPanel.tsx
  │   ├─ DriftReportPanel.tsx
  │   ├─ DriftItemCard.tsx
  │   ├─ ConfidenceBar.tsx
  │   ├─ EvidenceChip.tsx
  │   ├─ AmendmentDiff.tsx
  │   ├─ ApprovalRoutingModal.tsx
  │   ├─ ApprovingWaitingState.tsx
  │   ├─ CustomOverrideWarning.tsx
  │   └─ [index.ts, state]
  │
  ├─ found/               [12 files]
  │   ├─ FoundPanel.tsx
  │   ├─ InterviewSection.tsx
  │   ├─ QuestionRenderer.tsx
  │   ├─ PresetSelector.tsx
  │   ├─ ProvisioningSummary.tsx
  │   ├─ VisionPreview.tsx
  │   ├─ SectionNavRail.tsx
  │   ├─ ApplyProgress.tsx
  │   ├─ ApplyErrorDisplay.tsx
  │   ├─ ConfirmationModal.tsx
  │   └─ [index.ts, state]
  │
  ├─ revive/              [9 files]
  ├─ reposition/          [5 files]
  └─ memory/              [13 files]
```

### Recommended New Primitives for v1.1

**Proposal 1: Card Wrapper**

Current pattern (raw divs):
```typescript
<div className="bg-background border border-border rounded-lg overflow-hidden">
  {/* content */}
</div>
```

Proposed `Card.tsx`:
```typescript
export function Card({ 
  children, 
  className = '', 
  variant = 'default'
}: { 
  children: React.ReactNode; 
  className?: string;
  variant?: 'default' | 'muted';
}) {
  const baseClass = variant === 'muted' 
    ? 'bg-muted border-border' 
    : 'bg-card border-border';
  
  return (
    <div className={`border rounded-none ${baseClass} ${className}`}>
      {children}
    </div>
  );
}
```

**Usage in DriftItemCard.tsx:**
```typescript
// Before:
<div className="bg-background border border-border rounded-lg overflow-hidden">

// After:
<Card className="overflow-hidden">
```

Benefits:
- Single source of truth for card styling
- Easy to adjust spacing, border, corners globally
- Reduces class duplication across 20+ components

**Proposal 2: SectionHeader**

Used by AssessPanel, FoundPanel, RevivePanel, HistoryPanel for section titles + descriptions.

```typescript
export function SectionHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-md border-b border-border pb-md mb-md">
      <div>
        <h3 className="text-heading font-bold">{title}</h3>
        {description && <p className="text-body text-muted-foreground mt-xs">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
```

Benefits:
- Consistent heading + description + action layout
- Supports button slots (close, edit, expand, etc.)
- Reduces CSS class duplication across 15+ components

### SDK Component Reuse?

**Question:** Does `@paperclipai/plugin-sdk/ui` export components like `MetricCard`, `StatusBadge`, `DataTable`, etc.?

**Finding:** The package.json shows `@paperclipai/plugin-sdk` v2026.428.0 is installed. The SDK exports hooks (`usePluginData`, `usePluginAction`, `useHostContext`) and possibly design token helpers, but inspection is limited. Assuming the SDK exports mostly hooks, not opinionated UI components.

**Recommendation:** Keep shared primitives in `src/ui/components/`. Reason: components are opinionated (card padding, border color, typography); each plugin needs to customize. SDK should export hooks + utilities, not components.

---

## Part 5: Build Order for v1.1 UI Reskin

### Phase 1: Design Primitives + Shell Foundation

**Goal:** Fix layout + establish pattern  
**Timeline:** 1–2 weeks

**Components to modify:**
- `MainPanel.tsx` — Audit all spacing (`gap-*`, `px-*`, `py-*`)
- `SidebarLink.tsx` — CRITICAL: Remove hard-coded `text-zinc-800`, use semantic colors
- `ModeBanner.tsx` — Verify spacing classes exist, update colors
- `StatusBadge.tsx` — Swap light-only colors to theme-aware alternatives
- `components/*.tsx` — Audit all 9 files for broken classes

**New files to create:**
- `src/ui/components/Card.tsx` — Card wrapper
- `src/ui/components/SectionHeader.tsx` — Section header wrapper

**Verification:**
- Build succeeds: `pnpm build`
- Bundle size: <200KB
- Visual: No collapsed/overlapped elements
- Dark mode: Toggle theme, verify readable colors
- Grep: Zero hits on `(gap|px|py)-(xs|sm|md)` outside valid Tailwind

### Phase 2: Assess + Found Panels

**Goal:** Migrate two major mode panels  
**Timeline:** 2–3 weeks

**Dependencies:** Phase 1 complete (Card, SectionHeader available)

**Components to update:**
- `assess/AssessPanel.tsx`, `DriftReportPanel.tsx`, `DriftItemCard.tsx` — Use Card wrapper
- `assess/ConfidenceBar.tsx`, `EvidenceChip.tsx` — Swap color utilities
- `assess/AmendmentDiff.tsx`, `ApprovalRoutingModal.tsx`, etc. — Full color audit
- `found/FoundPanel.tsx`, `InterviewSection.tsx`, `QuestionRenderer.tsx`, etc. — Same pattern

**Build verification:**
- All imports resolve (`import { Card } from "../components/Card.js"`)
- Tree-shake: unused imports removed
- No circular dependencies

### Phase 3: Revive + Reposition Panels

**Goal:** Complete four-mode coverage  
**Timeline:** 2–3 weeks

**Dependencies:** Phase 2 complete (patterns mature, Card/SectionHeader proven)

**Components to update:**
- `revive/RevivePanel.tsx`, `ActionItemCard.tsx`, `PriorityBadge.tsx`, etc.
- `reposition/RepositionPanel.tsx`, `RepositionInterviewFlow.tsx`, etc.
- Migrate action buttons, badge colors, status indicators

### Phase 4: Memory/History + Polish

**Goal:** Final components + visual parity verification  
**Timeline:** 1–2 weeks

**Dependencies:** Phases 1–3 complete

**Components to update:**
- `memory/HistoryPanel.tsx`, `FindingCard.tsx`, `FindingStatusBadge.tsx`, etc.
- Final color audit (ensure all status pills use semantic tokens)
- Screenshot comparison against host panels

**Polish tasks:**
- Consistent spacing audit (all `gap-*`, `px-*`, `py-*` scanned)
- Icon sizing standardization (lucide icons 4–5px consistent)
- Button states (hover, active, disabled — contrast verified)
- Responsive test (narrow sidebar <400px width)

### Dependency Graph

```
Phase 1: Primitives + Shell
  ├─ creates: Card, SectionHeader, updated shared components
  ├─ modifies: MainPanel, SidebarLink, ModeBanner, StatusBadge
  └─ output: visual baseline + design patterns

Phase 2: Assess + Found (10 + 12 files)
  ├─ depends on: Phase 1
  ├─ uses: Card, SectionHeader from Phase 1
  └─ output: two mode panels, parity achieved

Phase 3: Revive + Reposition (9 + 5 files)
  ├─ depends on: Phase 2
  ├─ patterns: mature, patterns from Phase 2 scale
  └─ output: four mode panels complete

Phase 4: Memory + Polish (13 files + audit)
  ├─ depends on: Phase 3
  └─ output: release-ready UI + visual parity verified
```

---

## Part 6: Component Boundaries & Data Flow

### UI vs. Worker Separation

**UI Layer (React, `src/ui/`):**
- Pure rendering (no business logic)
- Collects user input, dispatches actions
- Displays results from worker
- Communicates via `usePluginAction`, `usePluginData`, `useHostContext`

**Worker Layer (Node.js, `src/worker.ts`):**
- Business logic (mode detection, drift analysis, etc.)
- Data validation + transformation
- Paperclip SDK integration (documents, issues, wakeups)
- Communicates via `getData`, `performAction`, event handlers

**Example: Apply Drift Amendment**

```
User sees DriftItemCard, clicks "Accept"
  ↓ (UI)
  <button onClick={onAccept}> calls usePluginAction("applyDriftAmendment")
  ↓ (Bridge)
  Sends message: { action: "applyDriftAmendment", payload: { driftId, amendment } }
  ↓ (Worker)
  performAction handler: async (action, payload, ctx) => {
    // Validate amendment
    // Fetch current VISION.md
    // Merge amendment into VISION
    // Create approval queue entry
    // Write to SDK: ctx.documents.create(...), ctx.issues.create(...)
    // Return result
  }
  ↓ (Bridge)
  Returns: { success: true, approvalQueueId: "..." }
  ↓ (UI)
  Component state updates, shows "Amendment queued for approval"
```

### Slot Boundaries

**SidebarLink slot:**
- Entry point only (minimal surface)
- Single responsibility: clickable link to Compass
- No state, no API calls
- Styling must match host sidebar appearance

**MainPanel slot:**
- Root component for entire Compass UI tree
- Manages tab state (Mode | History)
- Dispatches to mode-specific panels
- Receives `companyId` from host context
- Handles refresh, mode override, bottom actions

---

## Part 7: Token Reference for Migration

### Host Color Semantics

**Surfaces:**
- `bg-background` — Page/panel background (white light, dark dark)
- `bg-card` — Card/container background (white light, slightly lighter dark dark)
- `bg-muted` — Muted/disabled surface (very light gray light, mid-dark dark)
- `bg-popover` — Tooltip/popover (same as card)

**Text:**
- `text-foreground` — Primary text (near-black light, near-white dark)
- `text-muted-foreground` — Secondary/muted (medium gray light, light gray dark)

**Borders:**
- `border-border` — Default border (light gray light, dark gray dark)
- `border-input` — Input field border (same as border)

**Interactive:**
- `bg-primary` / `text-primary-foreground` — Primary action
- `bg-secondary` / `text-secondary-foreground` — Secondary action
- `bg-accent` / `text-accent-foreground` — Highlight/active
- `bg-destructive` / `text-destructive-foreground` — Error/danger

**Spacing:**
- Tailwind standard: `gap-1` (0.25rem), `gap-2` (0.5rem), `gap-3` (0.75rem), `gap-4` (1rem), `gap-6` (1.5rem)
- `px-2`, `px-3`, `px-4` — Horizontal padding
- `py-2`, `py-3`, `py-4` — Vertical padding
- No custom names (`gap-sm`, `px-sm`, etc.)

**Radius:**
- Host: `--radius-lg: 0px` (sharp corners, no rounding)
- Use: `rounded-none` (not `rounded-lg`, `rounded-xl`)

**Typography:**
- `text-label` (verify exists for small labels) or fall back to `text-xs`
- `text-body` (verify exists for body text) or fall back to `text-sm`
- `text-heading` (verify exists for headings) or fall back to `text-base` / `text-lg`

### Specific Migrations

**StatusBadge (healthy/stalled/unknown):**

Current (broken):
```
healthy: bg-green-50 text-green-700 border-green-200
stalled: bg-red-50 text-red-700 border-red-200
unknown: bg-slate-50 text-slate-600 border-slate-200
```

Migrated (host-aware):
```
healthy: bg-emerald-500/10 text-emerald-500 border-emerald-500/20
stalled: bg-red-500/10 text-red-500 border-red-500/20
unknown: bg-muted text-muted-foreground border-border
```

---

## Part 8: Integration Checklist

### Pre-Phase 1 Verification

- [ ] Confirm Tailwind utilities exist: `bg-emerald-500/10`, `text-emerald-500`, `border-emerald-500/20`
  - Fallback: use `bg-green-500/10` if emerald unavailable
- [ ] Test host theme toggle: CSS vars update in DevTools
- [ ] Check host for custom typography: `text-label`, `text-body`, `text-heading`
- [ ] Verify SDK doesn't export UI components (avoid duplication)

### Phase 1 Deliverables

- [ ] Create `Card.tsx` with `variant` prop
- [ ] Create `SectionHeader.tsx` with title + description + action
- [ ] Update `MainPanel.tsx` spacing
- [ ] Update `SidebarLink.tsx` — remove hard-coded zinc colors
- [ ] Update `ModeBanner.tsx`, `StatusBadge.tsx` — semantic colors
- [ ] Build: `pnpm build` succeeds, bundle <200KB
- [ ] Grep: zero hits on broken patterns
- [ ] Visual: no collapsed elements
- [ ] Dark mode: toggle theme, verify readable

### Phases 2–4 Deliverables (per phase)

- [ ] Grep for broken classes, migrate to valid tokens
- [ ] Screenshot diff: compare to host panels
- [ ] Accessibility: button focus states, WCAG AA contrast
- [ ] Responsive: test in narrow sidebar (<400px)

### Final Release

- [ ] All phases complete + verified
- [ ] CHANGELOG: "UI reskin for host parity, dark mode support"
- [ ] Version bump (e.g., 0.1.9 → 0.2.0)
- [ ] `npm publish` succeeds

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| **Integration model** | HIGH | Verified via slots.tsx, plugin loads as ES modules, CSS cascade confirmed |
| **Design token inheritance** | HIGH | Host CSS vars + Tailwind v4 @theme reviewed, chain confirmed |
| **Breakage root cause** | HIGH | Nonexistent custom tokens confirmed; migration map provided |
| **Component boundaries** | HIGH | Manifest, slot system, bridge context all documented |
| **Dark mode propagation** | HIGH | CSS var scoping (:root vs .dark) verified |
| **SDK component exports** | MEDIUM | Full SDK export list not available; verify in phase 1 |
| **Shared primitives location** | HIGH | Best practice: local components in src/ui/components/ |
| **Build output** | HIGH | esbuild config verified; no CSS bundling; UI as ES module |

---

## Gaps Requiring Phase-Specific Research

1. **Tailwind color names** — Verify `bg-emerald-500/10` vs `bg-green-500/10` availability
2. **Typography utilities** — Confirm `text-label`, `text-body`, `text-heading` exist
3. **SDK exports** — Check if `@paperclipai/plugin-sdk/ui` exports components
4. **Dark mode context** — Verify if host passes `theme` in `useHostContext()`
5. **Mobile layout** — Test plugin in narrow sidebar, may need single-column adjustments

---

## Recommendations

1. **Keep UI thin** — No custom Tailwind config, no CSS in bundle. Rely on host tokens.

2. **Create two primitives:**
   - `Card.tsx` — standardizes card styling
   - `SectionHeader.tsx` — standardizes section headers

3. **Migration is straightforward:**
   - Search-replace `bg-green-50` → `bg-emerald-500/10`
   - `text-gray-900` → `text-foreground`
   - `gap-xs` → `gap-2` (or `gap-1`/`gap-3` as appropriate)
   - Remove `rounded-lg`, add `rounded-none`

4. **Build order matters** — Phase 1 sets patterns; phases 2–4 scale easily

5. **Verification is simple:**
   - Grep for broken patterns → zero hits
   - Visual parity check (DevTools side-by-side with host panels)

6. **No worker changes** — UI reskin is purely cosmetic; worker code, manifest, SDK integration unchanged

---

## Sources

- Paperclip Plugin Slot System: `paperclip-temp/ui/src/plugins/slots.tsx`
- Paperclip Design Tokens: `paperclip-temp/ui/src/index.css` (Tailwind v4, OKLCH colors)
- Plugin SDK: `@paperclipai/plugin-sdk` v2026.428.0
- Compass Build Config: `esbuild.config.mjs`
- Compass UI Handoff: `UI_REDO_HANDOFF.md`
- Compass Component Inventory: `src/ui/` (full tree, ~55 components)
- Compass Manifest: `src/manifest.ts` (compiled to `dist/manifest.js`)
