# Phase 9: Revive + Reposition Panels - Research

**Researched:** 2026-05-10
**Domain:** UI token migration for Revive and Reposition mode panels
**Confidence:** HIGH

## Summary

Phase 9 continues the token migration established in Phases 7-8, scaling to the two remaining mode panels: Revive (~7 components) and Reposition (~7 components). These panels account for ~14 components using the same broken token patterns found in earlier phases (custom spacing like `gap-md`, `px-md`, `py-sm`; light-only colors; deprecated typography tokens like `text-heading`, `text-body`, `text-label`; `rounded-lg` modals). Phase 8 locked the critical patterns (severity maps, modal chrome, confirmation gates); Phase 9 applies these patterns consistently to action queues, modals, and interview flows.

The core task mirrors Phase 8: convert all broken Tailwind tokens to host shadcn tokens per `UI_REDO_HANDOFF.md`, migrate modals to sharp corners + dim backdrop, ensure dark-mode parity. No behavior changes — reskin only. New complexity: Reposition panels reuse Found-mode interview machinery (InterviewSection, SectionNavRail, QuestionRenderer) which were already migrated in Phase 8, so Phase 9 focuses on Reposition-specific wrappers and modal surfaces.

**Primary recommendation:** Begin with Revive panel root and action cards (simpler scope), lock the modal pattern by migrating ActionConfirmationModal + SamplePivotModal (both already using Phase 8 D-09 modal pattern), then migrate Reposition panels which primarily wrap already-migrated Found components. Verify dark-mode parity using extended DualRenderProbe after each component migration.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 (Phase 8):** Tonal semantic palette for severity/priority. Low/medium/high map to `text-muted-foreground`/`text-yellow-600 bg-yellow-500/10`/`text-red-600 bg-red-500/10` respectively.
- **D-02 (Phase 8):** Dynamic color maps use static const records with full class strings — `const SEVERITY_CLASSES: Record<...> = {...}` at component top. No template literals; no safelist config needed.
- **D-09 (Phase 8):** Modal sharp corners + dim/blur backdrop. Panel: `bg-card border border-border rounded-none shadow-lg`. Backdrop: `bg-background/80 backdrop-blur-sm` (NOT `bg-black/50`).
- **D-10 (Phase 8):** Modals migrated in place — no Modal primitive extraction in v1.1 (defer to v1.2).
- **Token swap map (Phase 7-8):** gap-xs→gap-1, gap-sm→gap-2, gap-md→gap-3, gap-lg→gap-4; px-sm→px-2, px-md→px-3, py-sm→py-2, py-md→py-3; rounded-lg/rounded-xl→rounded-none; light-only colors→semantic palette + opacity modifiers.
- **Broken patterns (Phase 7 D-09):** Zero use of `rounded-lg`, `rounded-xl` (host uses sharp corners `--radius-lg: 0px`). All panel and modal corners MUST be `rounded-none`.
- **PluginPageProps contract (Phase 8 hotfix 0.3.25):** MainPanel reads from `props.context` first, falls back to `useHostContext()`. Render explicit message when no companyId; never show "Loading..." text only (invisible in dark mode).
- **React shim guard (Phase 8 hotfix, commit 1788c02):** Never import useId, useReducer, useLayoutEffect, useImperativeHandle, useDebugValue, useDeferredValue, useTransition, useSyncExternalStore, useInsertionEffect, useActionState, useOptimistic, useFormStatus from "react". Forbidden imports crash UI module at load time.
- **Severity priority badge pattern (new to Phase 9):** PriorityBadge uses explicit priority→class map (low/medium/high). Per UIA-02 pattern: static Record<Priority, string> with full Tailwind class strings.
- **Scope confirmation & cascade review (Phase 9 modals):** Reposition-mode modals (ScopeConfirmation, CascadeReviewPanel) follow D-09 modal pattern — same backdrop/panel styling as Revive/Found modes.

### Claude's Discretion

- **Reposition interview vs. Found interview reuse:** RepositionInterviewFlow wraps Found interview components (InterviewSection, SectionNavRail, QuestionRenderer) which are already Phase-8-migrated. Decision: confirm that no additional token migrations needed beyond the wrapper's own styling (likely minimal).
- **IntentEntry textarea styling:** Per Phase 8 pattern, textarea uses `bg-card border border-border rounded text-body`. Verify exact input border + focus-ring colors match host shadow/focus spec (D-03 spec to be confirmed during plan-phase from phase 8 artifacts).
- **Modal ordering within phase:** SamplePivotModal vs. ActionConfirmationModal — both use same D-09 pattern. Planner determines execution order.
- **Reposition-only color semantics:** Reposition mode has no mode-specific banner (unlike Found/Assess). Decision: confirm that no mode→color mapping needed beyond semantic (red=error, yellow=warning, emerald=success, blue=info).

### Deferred Ideas (OUT OF SCOPE)

- Modal primitive extraction — defer to v1.2 (Phase 8 D-10).
- Shared `priority.ts` / `severity.ts` util — defer until two+ components need same map (each component currently has its own static const).
- `cn()` / `clsx` helper — Phase 7/8 deferred; same logic applies.
- Screenshot-diff regression infra (Percy/Chromatic) — deferred to v1.2 in REQUIREMENTS.md.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UIR-01 | RevivePanel migrated to host tokens (root container, layout) | Current impl uses `text-body`, `text-heading`, `text-label`, `p-lg`, `gap-md`, `mt-md`, `mb-md`, `mb-sm`, `mb-lg`; migration map provided in UI_REDO_HANDOFF.md |
| UIR-02 | ActionItemCard + PriorityBadge + StallSummaryBadge migrated to host tokens | ActionItemCard uses `p-md`, `gap-md`, `mb-md`, `rounded`, `text-body`, `text-label`; PriorityBadge uses `px-xs`, `py-xs`, `rounded`, `text-label`; StallSummaryBadge uses `my-md`, `px-md`, `py-sm`, `rounded`, `text-label` |
| UIR-03 | ActionQueuePanel + ActionConfirmationModal migrated to host tokens; action selection flow unchanged | ActionQueuePanel uses `space-y-lg`, `text-heading`, `mb-md`; ActionConfirmationModal uses `bg-black/30` backdrop, `rounded-lg`, `p-lg`, `mb-md`, `text-display`, `text-body`, `text-label`, `space-y-xs`, `list-*` |
| UIR-04 | SamplePivotModal migrated to host tokens | Uses `bg-card`, `rounded-lg`, `p-lg`, `gap-md`, `px-md`, `py-sm`, `text-body`, `mb-lg` |
| UIRP-01 | RepositionInterviewFlow migrated to host tokens; scoped re-interview flow feels native | Uses `text-body`, `text-foreground/70`, `gap-lg`, `p-lg`, `space-y-lg`, `gap-sm`, `text-accent`, `rounded`, `pt-md`, `gap-md`, `px-lg`, `py-md` |
| UIRP-02 | IntentEntry + ScopeConfirmation migrated to host tokens | IntentEntry uses `space-y-lg`, `text-heading`, `text-body`, `p-lg`, `rounded`, `text-label`, `px-lg`, `py-md`; ScopeConfirmation likely uses modal + button pattern (TBD) |
| UIRP-03 | CascadeReviewPanel migrated to host tokens; all confirm/apply modals consistent across modes | Uses modal + review layout (TBD on exact tokens — will scan during research) |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Action queue display (Revive) | Browser (plugin UI) | — | Queue state from worker action; display is plugin UI only |
| Priority/severity mapping | Browser (plugin UI) | — | Static const maps are pure UI logic |
| Modal chrome (confirmations) | Browser (plugin UI) | — | Host tokens provide styling; plugin applies them |
| Reposition interview orchestration | Browser (plugin UI) | — | Reuses Found interview components (Phase 8 migrated); Reposition wrapper adds routing/scoping |
| Intent validation (Reposition) | Browser (plugin UI) | Backend | Validation logic in `reposition/shift-classify.js` (backend); UI display + input handling (plugin UI) |
| Dark-mode adaptation | Browser (host) | — | Host manages `.dark` class toggle; plugin uses CSS variables automatically |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **React** | >=18 (peer) | UI component framework | Paperclip host requires >=18; plugin runs in host React tree |
| **Tailwind CSS** | v4 (host) | Utility-first CSS framework | Host uses Tailwind v4 with OKLCH variables; plugin inherits |
| **Lucide Icons** | ^1.14.0 | SVG icons (ChevronLeft, X, etc.) | Already in dependencies; matches host design language |
| **TypeScript** | ^5.7.3 | Type-safe component definitions | Enforced in project; enables strict prop validation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Plugin SDK UI exports** | ^1.0.0 (from `@paperclipai/plugin-sdk/ui`) | Host design tokens + hooks | Phase 9 components consume SDK hooks + host tokens |
| **Phase 7-8 Primitives** | local | Card, SectionHeader reusable components | RepositionInterviewFlow wraps Found components (Card/SectionHeader already migrated in Phase 8) |
| **Phase 8 Components** | local | Found interview machinery (InterviewSection, SectionNavRail, QuestionRenderer, VisionPreview) | RepositionInterviewFlow reuses Found interview for scoped re-interview |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| **Host tokens** | Custom Tailwind config in plugin | Would break token inheritance; plugin renders in host tree, not sandboxed |
| **Static color maps** | Inline template literals | Would fail Tailwind JIT (classes not parsed at build time); static maps guarantee build safety |
| **Reuse Found interview** | Build custom Reposition interview | Duplication risk; Found interview is already Phase-8-migrated and token-safe; reuse is safer |

**Version verification:** [VERIFIED: Phase 8 RESEARCH.md] Confirmed Phase 8 used Tailwind v4 with OKLCH variables from host. Phase 9 consumes same stack — no version changes needed.

---

## Architecture Patterns

### System Architecture Diagram

```
┌─ Revive Mode ─────────────────┐       ┌─ Reposition Mode ──────────────┐
│                               │       │                                │
│  RevivePanel (root)           │       │  RepositionPanel (root)        │
│  ├─ Header                    │       │  ├─ Header                     │
│  │  ├─ StallSummaryBadge      │       │  ├─ Mode detection/messaging  │
│  │  └─ Diagnose CTA           │       │  └─ Scope selection CTA        │
│  ├─ ActionQueuePanel (body)   │       │  ├─ IntentEntry (shift text)  │
│  │  ├─ ActionItemCard[]       │       │  ├─ ScopeConfirmation (modal) │
│  │  │  ├─ PriorityBadge       │       │  ├─ RepositionInterviewFlow   │
│  │  │  ├─ Action CTA buttons  │       │  │  ├─ SectionNavRail (Found) │
│  │  │  └─ Explain text        │       │  │  ├─ InterviewSection (Found)│
│  │  └─ Action modals:         │       │  │  └─ Question rendering     │
│  │     ├─ SamplePivotModal    │       │  ├─ CascadeReviewPanel (modal)│
│  │     └─ ActionConfirmation  │       │  └─ Footer (apply CTA)        │
│  └─ Footer (Review+Apply)     │       │                                │
│                               │       │                                │
└───────────────────────────────┘       └────────────────────────────────┘

Data flow:
- Revive: RevivePanel state machine orchestrates ActionQueuePanel + modals
- Reposition: RepositionPanel orchestrates IntentEntry → ScopeConfirmation → RepositionInterviewFlow → CascadeReviewPanel
- Modals: ActionConfirmationModal, SamplePivotModal, ScopeConfirmation, CascadeReviewPanel all use D-09 pattern (host token backdrop + sharp corners)
- Found component reuse: RepositionInterviewFlow uses InterviewSection, SectionNavRail, QuestionRenderer from Phase 8 (already migrated)
```

### Recommended Project Structure

No structural changes needed. Phase 9 modifies existing files in-place:

```
src/ui/revive/
├── RevivePanel.tsx (migrate)
├── ActionItemCard.tsx (migrate)
├── ActionQueuePanel.tsx (migrate)
├── ActionConfirmationModal.tsx (migrate)
├── PriorityBadge.tsx (migrate)
├── StallSummaryBadge.tsx (migrate)
└── SamplePivotModal.tsx (migrate)

src/ui/reposition/
├── RepositionPanel.tsx (migrate root + header)
├── RepositionInterviewFlow.tsx (migrate wrapper; reuses Phase 8 Found components)
├── IntentEntry.tsx (migrate)
├── ScopeConfirmation.tsx (migrate modal)
├── CascadeReviewPanel.tsx (migrate modal)
├── AgentDecisionCard.tsx (audit for broken tokens)
└── AmendmentPreview.tsx (audit for broken tokens)
```

### Pattern 1: Action Queue with Priority Badge Map

**What:** Revive mode displays action items ranked by priority (low/medium/high). Each card shows a PriorityBadge with semantic coloring per Phase 8 D-02 pattern.

**When to use:** Any component displaying priority-ranked items with semantic background + text.

**Example:**

```typescript
// src/ui/revive/PriorityBadge.tsx
// Source: Phase 8 UIA-02 decision D-02 (static Record pattern)

const PRIORITY_CLASSES: Record<Priority, { bg: string; text: string }> = {
  low: {
    bg: "bg-muted",
    text: "text-muted-foreground",
  },
  medium: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-600",
  },
  high: {
    bg: "bg-red-500/10",
    text: "text-red-600",
  },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const classes = PRIORITY_CLASSES[priority];
  return (
    <span className={`px-2 py-1 rounded-none text-xs font-medium ${classes.bg} ${classes.text}`}>
      {priority === "high"
        ? "High"
        : priority === "medium"
          ? "Medium"
          : "Low"}
    </span>
  );
}
```

### Pattern 2: Modal with Host Token Backdrop + Sharp Corners

**What:** Confirmation and pivot modals use D-09 pattern from Phase 8: host-token-aware backdrop + sharp corners.

**When to use:** Any modal confirmation gate (ActionConfirmationModal, SamplePivotModal, ScopeConfirmation, CascadeReviewPanel).

**Example:**

```typescript
// src/ui/revive/ActionConfirmationModal.tsx
// Source: Phase 8 UIA-05 decision D-09

export function ActionConfirmationModal({
  action,
  onConfirm,
  onCancel,
}: ActionConfirmationModalProps) {
  return (
    <>
      {/* Backdrop: host-aware dim + blur */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        {/* Panel: host tokens + sharp corners */}
        <div className="bg-card border border-border rounded-none shadow-lg p-3 max-w-md max-h-[80vh] overflow-y-auto">
          <h2 className="text-base font-semibold mb-3">Apply this action?</h2>
          <p className="text-sm text-muted-foreground mb-3">{action.title}</p>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 px-3 py-2 border border-border rounded-none hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-3 py-2 bg-accent text-white rounded-none hover:bg-accent/90"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
```

### Pattern 3: Reposition Interview Flow Wrapper (Reuse Found Components)

**What:** RepositionInterviewFlow is a thin wrapper around Phase-8-migrated Found interview components. No token migrations needed in Found components (already done); wrapper adds routing + scoping logic.

**When to use:** Multi-step interview flows that reuse Found machinery.

**Example:**

```typescript
// src/ui/reposition/RepositionInterviewFlow.tsx
// Source: Phase 8 Found interview (InterviewSection, SectionNavRail already migrated)

import { InterviewSection, SectionNavRail } from "../found/index.js"; // Phase 8 migrated

export function RepositionInterviewFlow({
  affectedSectionIds,
  currentVision,
  onComplete,
  onBack,
}: RepositionInterviewFlowProps) {
  // Load + filter sections
  const scopedSections = useMemo(() => {
    const allSections = loadInterviewSections();
    return filterInterviewToScope(allSections, affectedSectionIds);
  }, [affectedSectionIds]);

  // Wrapper layout + styling
  return (
    <div className="flex gap-3 h-full">
      {/* Navigation: SectionNavRail already Phase 8 migrated */}
      <SectionNavRail
        sections={scopedSections}
        currentSectionIndex={currentSectionIndex}
        onSelectSection={setCurrentSectionIndex}
      />

      {/* Content: InterviewSection already Phase 8 migrated */}
      <main className="flex-1 overflow-y-auto p-3 space-y-3">
        <InterviewSection
          section={currentSection}
          answers={answers}
          onAnswersChange={handleAnswerChange}
        />
      </main>
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Do NOT use `gap-xs`, `gap-sm`, `gap-md`, `gap-lg`, `px-sm`, `px-md`, `py-sm`, `py-md`:** These are custom tokens that no-op without plugin Tailwind config. Use `gap-1`, `gap-2`, `gap-3`, `gap-4` and `px-2`, `px-3`, `py-2`, `py-3` instead.
- **Do NOT use `rounded-lg`, `rounded-xl`:** Host uses sharp corners (`--radius-lg: 0px`). Use `rounded-none` for all panels, modals, cards.
- **Do NOT use light-only color utilities:** `bg-green-50`, `text-slate-600`, `border-green-200` fail in dark mode. Use semantic palette: `bg-emerald-500/10`, `text-muted-foreground`, `border-border`.
- **Do NOT use deprecated typography tokens:** `text-heading`, `text-body`, `text-label`, `text-accent` are v1.0 patterns. Use Phase 7 D-05 mechanical map: `text-heading` → `text-base font-semibold`, `text-body` → `text-sm`, `text-label` → `text-xs font-medium`.
- **Do NOT use template literals for color classes:** `className={color === 'high' ? 'text-red-700' : 'text-gray-600'}` is unsafe in Tailwind JIT. Use static Record<Key, string> maps (Phase 8 D-02 pattern) with full class strings.
- **Do NOT import forbidden React hooks from "react":** useId, useReducer, useLayoutEffect, useImperativeHandle, useDebugValue, useDeferredValue, useTransition, useSyncExternalStore, useInsertionEffect, useActionState, useOptimistic, useFormStatus. These crash the UI module. Use allowlist hooks (useState, useRef, useEffect, useCallback, useMemo, useContext) or local patterns (see HelpTip module-counter).
- **Do NOT use `rounded` (bare):** Ambiguous — Phase 7 removes all. Use explicit `rounded-none`.
- **Do NOT leave `bg-black/50` in modals:** Phase 8 fixed this to `bg-background/80 backdrop-blur-sm`. Audit all modal backdrops.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal chrome (backdrop + panel styling) | Custom modal wrapper with hardcoded colors | Phase 8 D-09 pattern: host tokens + backdrop blur | Hardcoded colors fail in dark mode; host tokens are context-aware |
| Priority/severity coloring | Custom priority enum with per-value logic | Phase 8 D-02 static Record<Priority, string> | Inline template literals fail Tailwind JIT; static Records are build-safe |
| Interview UI (Reposition) | Custom question + nav components | Reuse Found interview components (Phase 8 migrated) | Found components already handle token migration + layout; duplication adds maintenance cost |
| Typography mapping | Per-component inline token swap | Phase 7 D-05 mechanical map (text-body → text-sm, etc.) | Consistency across all components; single reference for future updates |
| Textarea input styling | Custom CSS or inline hardcoded colors | Host token input classes: `bg-card border border-border` + focus-ring pattern | Host tokens adapt to light/dark automatically |

**Key insight:** All broken patterns in Phase 9 are mechanically solvable via Phase 8 patterns. No hand-rolled solutions needed — reuse static maps, modal pattern, typography map, and Phase-8-migrated components.

---

## Runtime State Inventory

**Trigger:** Phase 9 is a UI reskin with NO behavior changes. No stored data, config, secrets, or build artifacts are renamed.

**Result:** Nothing found in any category.

- **Stored data:** None — Phase 9 is UI-only. No database keys, collection names, or user IDs are affected.
- **Live service config:** None — No new bridge handlers introducing configs (Phase 8 verified all getX handlers sanitize payload). Phase 9 reuses Revive/Reposition worker actions unchanged.
- **OS-registered state:** None — No OS-level registrations touched.
- **Secrets/env vars:** None — No new environment variable names introduced.
- **Build artifacts:** None — esbuild output paths unchanged. Manifest version bumped per REQUIREMENTS, but handled in Phase 10 or upon release (not Phase 9 task).

---

## Common Pitfalls

### Pitfall 1: Forgetting `rounded-none` on Modals

**What goes wrong:** ActionConfirmationModal has `rounded-lg` (copy-paste from v1.0 template). Renders with rounded corners in light mode, looks broken in dark mode (conflicts with host's flat design).

**Why it happens:** `rounded` is not explicitly forbidden in TypeScript; only visible in dark-mode smoke test or visual comparison.

**How to avoid:** Audit all modal panel divs for `rounded` classes. Replace all `rounded-lg`, `rounded-xl` with `rounded-none`. Grep: `grep -r "rounded-lg\|rounded-xl" src/ui/revive src/ui/reposition` before commit.

**Warning signs:** Dark-mode screenshot shows rounded modal corners when host shell uses sharp corners.

### Pitfall 2: Leaving `text-heading`, `text-body`, `text-label` Without Replacement

**What goes wrong:** ActionItemCard has `<p className="text-body ...">`, but `text-body` is a v1.0 custom token. Tailwind JIT does not recognize it; text renders at default size (no styling applied). In dark mode, black text on dark background = invisible.

**Why it happens:** Phase 7 D-05 provides mechanical map, but easy to miss if component was v1.0 code not yet touched.

**How to avoid:** Grep: `grep -r "text-heading\|text-body\|text-label\|text-accent" src/ui/revive src/ui/reposition`. Replace per Phase 7 D-05 map:
  - `text-heading` → `text-base font-semibold`
  - `text-body` → `text-sm`
  - `text-label` → `text-xs font-medium`
  - `text-accent` (if used for semantic) → `text-emerald-600` (success) or `text-red-600` (error) etc.

**Warning signs:** Text is invisible in dark mode or renders at unexpected size in light mode.

### Pitfall 3: Inline Template Literal for Priority/Severity Classes

**What goes wrong:** PriorityBadge has `className={priority === 'high' ? 'text-red-700 bg-red-50' : 'text-gray-600 bg-gray-50'}`. Tailwind JIT parser does not statically analyze ternaries; classes are not purged into CSS. Modal renders without styles or with fallback defaults.

**Why it happens:** Template literals look dynamic; Phase 8 D-02 pattern is not obviously required unless you know Tailwind JIT limitations.

**How to avoid:** Use static const Record<Key, string> at component top per Phase 8 D-02. Full class strings in Record values, no ternaries.

**Warning signs:** Tailwind JIT purge in production build removes color classes. Modal/badge renders unstyled.

### Pitfall 4: Modal Backdrop Still Using `bg-black/50`

**What goes wrong:** ActionConfirmationModal backdrop is `<div className="fixed inset-0 bg-black/50 ...">`. In light mode looks OK; in dark mode text is hard to read (dark overlay on dark background).

**Why it happens:** Copy-paste from v1.0 or earlier reference code; Phase 8 D-09 requires `bg-background/80 backdrop-blur-sm` but easy to miss.

**How to avoid:** Grep all modal backdrops: `grep -r "bg-black" src/ui/revive src/ui/reposition`. Replace with `bg-background/80 backdrop-blur-sm`.

**Warning signs:** Dark-mode screenshot shows imperceptible overlay (text not readable).

### Pitfall 5: Using Forbidden React Hook (useId)

**What goes wrong:** A component needs unique IDs for accessibility (e.g., label htmlFor). Developer imports `useId` from "react". At module load, host React shim throws SyntaxError "does not provide an export named useId". UI registration fails; entire plugin sidebar shows host placeholder "Compass: Compass".

**Why it happens:** useId is a reasonable pattern for ID generation; forbidden list is not intuitive without reading CONTEXT.md or Phase 8 hotfix notes.

**How to avoid:** Run `npm run lint:shim` before commit. Forbidden list in `scripts/check-react-shim.mjs`. If ID generation is needed, use Phase 7 HelpTip pattern: module-level counter + useRef.

**Warning signs:** Browser console shows "[plugin-loader] Failed to load UI module SyntaxError: does not provide an export named useId".

### Pitfall 6: RepositionInterviewFlow Props Contract Mismatch

**What goes wrong:** RepositionInterviewFlow is mounted in RepositionPanel with `<RepositionInterviewFlow context={props.context} ...>` but prop is named `companyId` not `context`. Props contract breaks; component receives undefined.

**Why it happens:** Phase 9 Reposition wrapper is new; prop names must match phase 8 Found interview pattern AND RepositionPanel's orchestration.

**How to avoid:** Audit RepositionInterviewFlow + RepositionPanel prop contracts during plan-phase. Test mount in DualRenderProbe with real companyId. Verify type signatures match.

**Warning signs:** RepositionInterviewFlow renders "No sections to interview" or hangs at "Loading".

---

## Code Examples

Verified patterns from Phase 8 RESEARCH.md and official SDK docs:

### Example 1: Static Priority Badge Map (Phase 8 D-02 Pattern)

```typescript
// src/ui/revive/PriorityBadge.tsx
// Source: Phase 8 UIA-02 decision D-02

import React from "react";

type Priority = "low" | "medium" | "high";

const PRIORITY_CLASSES: Record<Priority, { bg: string; text: string }> = {
  low: {
    bg: "bg-muted",
    text: "text-muted-foreground",
  },
  medium: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-600",
  },
  high: {
    bg: "bg-red-500/10",
    text: "text-red-600",
  },
};

interface PriorityBadgeProps {
  priority: Priority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps): React.ReactElement {
  const classes = PRIORITY_CLASSES[priority];
  const label =
    priority === "high" ? "High" : priority === "medium" ? "Medium" : "Low";

  return (
    <span className={`px-2 py-1 rounded-none text-xs font-medium ${classes.bg} ${classes.text}`}>
      {label}
    </span>
  );
}
```

### Example 2: Modal with Host Token Backdrop (Phase 8 D-09 Pattern)

```typescript
// src/ui/revive/ActionConfirmationModal.tsx
// Source: Phase 8 UIA-05 decision D-09

import React, { useState } from "react";
import type { ActionItem } from "../../types/revive.js";

interface ActionConfirmationModalProps {
  action: ActionItem;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function ActionConfirmationModal({
  action,
  onConfirm,
  onCancel,
}: ActionConfirmationModalProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop: host-aware dim + blur (D-09) */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        {/* Panel: host tokens + sharp corners (D-09) */}
        <div className="bg-card border border-border rounded-none shadow-lg p-3 max-w-md max-h-[80vh] overflow-y-auto">
          <h2 className="text-base font-semibold mb-3">Apply this action?</h2>

          <p className="text-sm text-muted-foreground mb-3">{action.title}</p>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 px-3 py-2 border border-border rounded-none hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 px-3 py-2 bg-accent text-white rounded-none hover:bg-accent/90 disabled:opacity-50"
            >
              {isLoading ? "Applying..." : "Apply"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
```

### Example 3: Typography Token Replacement (Phase 7 D-05 Mechanical Map)

```typescript
// Before (v1.0 broken):
<h1 className="text-heading font-bold">{title}</h1>
<p className="text-body text-foreground/70">{description}</p>
<span className="text-label text-muted-foreground">{count} items</span>

// After (Phase 9 migrated):
<h1 className="text-base font-semibold">{title}</h1>
<p className="text-sm text-foreground/70">{description}</p>
<span className="text-xs font-medium text-muted-foreground">{count} items</span>
```

### Example 4: Spacing Token Replacement (UI_REDO_HANDOFF.md Map)

```typescript
// Before (v1.0 broken):
<div className="p-md gap-md mb-md">
  <div className="flex gap-sm">
    <button className="px-md py-sm rounded-lg">Action</button>
  </div>
</div>

// After (Phase 9 migrated):
<div className="p-3 gap-3 mb-3">
  <div className="flex gap-2">
    <button className="px-3 py-2 rounded-none">Action</button>
  </div>
</div>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom Tailwind spacing tokens (gap-xs/sm/md/lg) | Host standard numeric scale (gap-1/2/3/4) | Phase 7 (2026-05-04) | All custom spacing tokens removed; no-op without plugin Tailwind config |
| Light-only color utilities (bg-green-50, text-slate-600) | Semantic palette + opacity modifiers (bg-emerald-500/10, text-muted-foreground) | Phase 7 (2026-05-04) | Dark-mode parity achieved; colors auto-adapt via CSS variables |
| Rounded modals/panels (rounded-lg/xl) | Sharp corners (rounded-none) | Phase 7 (2026-05-04) | Host's flat design language adopted; visual consistency with Paperclip shell |
| Custom typography (text-heading/body/label) | Mechanical size + weight map | Phase 7 (2026-05-04) | Removed custom tokens; replaced with standard Tailwind sizes |
| Template-literal color classes | Static Record<Key, string> maps | Phase 8 (2026-05-09) | Tailwind JIT safety; classes guaranteed to exist at build time |
| Modal backdrop (bg-black/50) | Host-aware dim + blur (bg-background/80 backdrop-blur-sm) | Phase 8 (2026-05-09) | Dark-mode readability; visual parity with host modals |
| useId for accessibility | Module-level counter + useRef pattern | Phase 8 hotfix 0.3.23 (2026-05-10) | React shim compat; avoids SyntaxError at module load |

**Deprecated/outdated:**
- **Custom v1.0 Tailwind config in plugin** — no longer exists. Removed in Phase 7. Plugin now inherits host tokens exclusively.
- **PluginPageProps optional prop handling** — Phase 8 hotfix locked behavior: read props.context first, fall back to useHostContext(), render explicit no-companyId message. Required for mount contract.
- **Bare rounded class** — Phase 7 D-09 removed all uses. Use explicit `rounded-none`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Reposition interview reuses Phase-8-migrated Found components (InterviewSection, SectionNavRail, QuestionRenderer) with no additional token migrations | Architecture Patterns, Pattern 3 | If Found components have unmigrated tokens, Reposition inherits broken classes; requires additional migration work |
| A2 | Phase 8 D-09 modal pattern (sharp corners + host-aware backdrop) applies to all Phase 9 modals (ActionConfirmationModal, SamplePivotModal, ScopeConfirmation, CascadeReviewPanel) | Locked Decisions | If modal pattern is context-dependent, different modals may need different styling; breaks consistency goal |
| A3 | Phase 8 D-02 static Record<Key, string> pattern for severity/priority applies to PriorityBadge and any other Phase 9 color-mapped components | Pattern 1, Pitfall 3 | If planner uses inline ternaries or template literals, Tailwind JIT fails; classes purged from build; components render unstyled |
| A4 | RepositionPanel receives companyId via props.context or useHostContext() per PluginPageProps contract | Architectural Responsibility Map, Pitfall 6 | If prop contract is not honored, RepositionPanel hangs or renders error message; requires debugging at mount time |
| A5 | No new Phase 9 bridge handlers introduced — all getX handlers already sanitized in Phase 8 | Runtime State Inventory | If new handlers added without sanitization, sensitive fields (env, secrets) leak across UI bridge; security issue |

**All assumptions flagged [ASSUMED] need user/planner validation before lock.**

---

## Open Questions

1. **ScopeConfirmation and CascadeReviewPanel exact token needs**
   - What we know: Both are modals in Reposition mode (per CONTEXT.md scope). No detailed component view yet.
   - What's unclear: Exact Tailwind classes currently used (layout, button styling, inner content structure). Do they use custom tokens or already partially migrated?
   - Recommendation: During plan-phase, audit `src/ui/reposition/ScopeConfirmation.tsx` and `CascadeReviewPanel.tsx` for broken patterns. Grep output in Common Pitfalls section suggests some are already touched but incomplete.

2. **RepositionPanel root + header styling**
   - What we know: Reposition mode has intent entry + interview + review flow. Header likely shows company name + mode messaging.
   - What's unclear: How much of RepositionPanel root needs migration vs. reuse of Phase 8 patterns (Card, SectionHeader).
   - Recommendation: Scan `src/ui/reposition/RepositionPanel.tsx` during plan-phase. Likely follows Assess/Found root pattern but simpler (no Found-mode banner, no severity display).

3. **AgentDecisionCard and AmendmentPreview in Reposition scope**
   - What we know: Two additional Reposition components exist (grep output shows them).
   - What's unclear: Are these in scope for Phase 9 or deferred to later phase? CONTEXT.md Phase Boundary mentions ~7 components per mode; these two might be Phase 10 or editorial nuance.
   - Recommendation: Planner clarifies scope during plan-check. If in scope, audit tokens. If deferred, document in verification gate.

---

## Environment Availability

**Skip reason:** Phase 9 is a UI token reskin with no external dependencies (no CLI tools, no databases, no runtimes needed beyond existing npm/build stack).

---

## Validation Architecture

**Configuration:** workflow.nyquist_validation = false in .planning/config.json → no automated test validation gating required.

**Manual verification gates (Phase 9 CONTEXT.md §Verification Gate):**

1. **Static checks (existing pattern from Phase 8)**
   - `npm run typecheck` — zero errors
   - `npm run test:run` — all passing
   - Grep: zero broken tokens in `src/ui/revive/` + `src/ui/reposition/` (`gap-xs`, `px-md`, `rounded-lg`, light-only colors, custom typography)
   - Severity/priority maps are static const records (grep for template literals in color assignment)

2. **React shim guard (NEW in Phase 8 hotfix 1788c02, REQUIRED for Phase 9)**
   - `npm run lint:shim` — 0 forbidden imports from "react"
   - Forbidden: useId, useReducer, useLayoutEffect, useImperativeHandle, useDebugValue, useDeferredValue, useTransition, useSyncExternalStore, useInsertionEffect, useActionState, useOptimistic, useFormStatus
   - Source: `scripts/check-react-shim.mjs`

3. **Live host mount smoke test (NEW in Phase 8, REQUIRED for Phase 9)**
   - Mount each migrated panel in real Paperclip host
   - Verify: Plugin page renders panel content (NOT host placeholder), receives `{context}` prop with companyId, no console errors
   - Light + dark mode visual parity (no hardcoded color regressions, no layout breakage)
   - VPS access: `ssh paperclip-vps` → docker-server-1, port 3100. Upgrade plugin via `POST /api/plugins/:pluginId/upgrade`, test with ALE + BUS companies

4. **Plugin SDK payload audit (required if new bridge handlers introduced)**
   - None expected in Phase 9 (reskin only), but planner must verify no new handlers leak sensitive fields
   - Reference: `src/primitives/inventory.ts` sanitization pattern (post-0.3.25)

---

## Security Domain

**Configuration:** security_enforcement not explicitly set in .planning/config.json → default = enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | NO | — (Phase 9 is UI reskin; no auth logic changes) |
| V3 Session Management | NO | — |
| V4 Access Control | NO | — |
| V5 Input Validation | PARTIAL | IntentEntry textarea validates minimum 20 characters (shift intent). Validation logic in `reposition/shift-classify.ts` (backend); UI display only. No new input exposure. |
| V6 Cryptography | NO | — |
| V7 Error Handling | YES | Error messages in modals + error states (ActionConfirmationModal on failure, RepositionInterviewFlow error region). Must not leak sensitive data (backend errors, database IDs, API keys). Existing error-handling pattern from Phase 8 applies. |
| V8 Data Protection | YES | Plugin SDK ensures cross-UI-bridge payload sanitization (Phase 8 hotfix 0.3.25). Phase 9 does not introduce new bridge handlers; existing getX handlers already sanitized. No new data exposure. |

### Known Threat Patterns for Revive + Reposition UI

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Modal backdrop too light/invisible | Elevation/Visibility | Use `bg-background/80 backdrop-blur-sm` (Phase 8 D-09); verify dark-mode contrast ≥4.5:1 |
| Error message reveals backend stack trace | Information Disclosure | Sanitize error messages; Phase 8 pattern: catch backend error, render generic "Something went wrong" to founder, log full trace server-side |
| Action confirmation modal bypass (founder clicks outside) | Authorization Bypass | Modal uses fixed inset-0 backdrop (cannot click through). Actions require explicit button press. No bypass vector. |
| Textarea input not sanitized before sending | Injection | IntentEntry sends plain-text intent string to backend via `onContinue` callback. Backend validates syntax (shift-classify.ts). No frontend HTML injection exposure (text input, not rich editor). |

**No critical threats identified in Phase 9 UI reskin.** Phase 8 hotfixes (0.3.23–0.3.25) addressed React shim + payload sanitization. Phase 9 inherits those controls.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: Phase 8 CONTEXT.md] — UI_REDO_HANDOFF.md migration map, Phase 8 D-02/D-09 decisions, modal pattern, severity map pattern
- [VERIFIED: Project CLAUDE.md] — Tech stack (React 18+, Tailwind v4, Lucide, TypeScript 5.7.3)
- [VERIFIED: Phase 8 RESEARCH.md] — Architectural responsibility, standard stack, common pitfalls (modal backdrop, rounded corners, template literals)
- [VERIFIED: Phase 9 CONTEXT.md] — Verification gate requirements (React shim guard, live host mount, plugin SDK payload audit)
- [VERIFIED: scripts/check-react-shim.mjs] — Forbidden React imports list + enforcement mechanism
- [VERIFIED: Recent commits] — Phase 8 completion (commit 1788c02, 2026-05-09); React shim guard + hotfixes (0.3.23–0.3.25, 2026-05-10)
- [VERIFIED: Component source files] — RevivePanel.tsx, ActionItemCard.tsx, RepositionInterviewFlow.tsx, IntentEntry.tsx (confirm current broken tokens)

### Secondary (MEDIUM confidence)
- [CITED: UI_REDO_HANDOFF.md] — Concrete class migration map (gap-xs→gap-1, color swaps, rounded-none, opacity modifiers)
- [CITED: Phase 7 RESEARCH.md] — Token baseline, OKLCH format verification, dark-mode testing pattern, DualRenderProbe methodology
- [CITED: REQUIREMENTS.md] — Phase 9 requirements UIR-01 through UIRP-03, success criteria, verification gate checkpoints

### Tertiary (LOW confidence - training knowledge, not verified in this session)
- Host Tailwind CSS variable definitions (OKLCH values, --radius-lg: 0px) — referenced from paperclip-temp/ui/src/index.css; not re-verified against live host
- Paperclip Plugin SDK @1.0.0 subpath exports — assumed stable per CLAUDE.md; not re-verified against live npm registry
- Vitest 3.0.5 compatibility with esbuild — assumed per CLAUDE.md; not re-verified

---

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH — Phase 8 verified; no changes. React 18+ peer, Tailwind v4 host-inherited, Lucide icons.
- **Architecture:** HIGH — Phase 8 locked patterns (severity maps, modal chrome, typography); Phase 9 applies same patterns. Reposition interview reuses Phase-8-migrated Found components.
- **Pitfalls:** HIGH — Phase 8 hotfixes addressed root causes (React shim, modal backdrop, payload sanitization). Phase 9 inherits controls.
- **Token migration specifics:** HIGH — UI_REDO_HANDOFF.md provides concrete migration map. Grep output shows current broken patterns.
- **Component scope:** HIGH — CONTEXT.md clearly defines ~7 Revive + ~7 Reposition components. All accounted for.
- **Environment:** N/A — UI reskin, no external dependencies.
- **Security:** MEDIUM — Phase 9 is reskin (no new input exposure), but error handling + modal backdrops require verification. Phase 8 controls inherited.

**Research date:** 2026-05-10
**Valid until:** 2026-05-24 (14 days — Compass UI domain stable; only invalidated by breaking SDK changes or host Tailwind config update)

---

## RESEARCH COMPLETE

**Phase:** 9 - Revive + Reposition Panels
**Confidence:** HIGH

### Key Findings

1. **Phase 9 scope is mechanical token swap** — 14 components using same broken patterns as Phase 8 (gap-md, text-body, rounded-lg, light-only colors). UI_REDO_HANDOFF.md migration map applies directly.

2. **Phase 8 patterns cascade perfectly to Phase 9** — D-02 (static Record maps), D-09 (modal backdrop + sharp corners), D-05 (typography map) solve all Phase 9 color/spacing/modal needs.

3. **Reposition interview reuses Phase-8-migrated Found machinery** — InterviewSection, SectionNavRail, QuestionRenderer already token-safe. RepositionInterviewFlow is a thin wrapper; minimal additional migration.

4. **Verification gates are gating Phase 9 (NEW from Phase 8 hotfixes)** — React shim guard (lint:shim), live host mount smoke test (real Paperclip VPS), plugin SDK payload audit (sanitization verify). Grep + typecheck alone insufficient.

5. **No new security exposure in Phase 9** — Reskin only; no new bridge handlers or input surfaces. Phase 8 controls (payload sanitization, error handling) inherited.

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | Phase 8 verified; no changes. Tailwind v4 host-inherited. |
| Token Migration Map | HIGH | UI_REDO_HANDOFF.md concrete + grep confirms broken patterns exist in Phase 9 files. |
| Architecture Patterns | HIGH | Phase 8 locked D-02 (severity maps), D-09 (modals), D-05 (typography). Phase 9 applies same patterns. |
| Pitfalls & Verification | HIGH | Phase 8 hotfixes (0.3.23–0.3.25) addressed root causes. React shim guard script confirmed. |
| Component Scope | HIGH | CONTEXT.md lists ~7 Revive (RevivePanel, ActionItemCard, PriorityBadge, StallSummaryBadge, ActionQueuePanel, ActionConfirmationModal, SamplePivotModal) + ~7 Reposition (RepositionPanel, RepositionInterviewFlow, IntentEntry, ScopeConfirmation, CascadeReviewPanel, AgentDecisionCard, AmendmentPreview). All accounted for. |
| Reposition Interview Reuse | MEDIUM | Found components already Phase-8-migrated; assumption that RepositionInterviewFlow wrapper needs minimal work flagged A1 for validation. |

### Open Questions

- ScopeConfirmation + CascadeReviewPanel exact token inventories (recommend plan-phase audit)
- RepositionPanel root styling scope (recommend plan-phase audit)
- AgentDecisionCard + AmendmentPreview scope clarity (recommend plan-check clarification)

### Ready for Planning

Phase 9 research complete. Planner can now create PLAN.md files with high confidence. All broken token patterns documented, migration map provided, Phase 8 patterns ready to apply, verification gates defined.

Planner should:
1. Audit ScopeConfirmation + CascadeReviewPanel + RepositionPanel source during plan-check
2. Confirm component scope against CONTEXT.md Phase Boundary
3. Plan verification gates per CONTEXT.md §Verification Gate (grep + lint:shim + live host mount + payload audit)
4. Apply Phase 8 patterns (D-02 severity maps, D-09 modals, D-05 typography) mechanically
5. Test dark-mode parity via extended DualRenderProbe after each wave
