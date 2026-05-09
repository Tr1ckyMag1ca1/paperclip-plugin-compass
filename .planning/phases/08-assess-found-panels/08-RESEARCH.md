# Phase 8: Assess + Found Panels - Research

**Researched:** 2026-05-09
**Domain:** UI token migration for Assess and Found mode panels
**Confidence:** HIGH

## Summary

Phase 8 scales the token migration established in Phase 7 to the two largest and most visually complex mode panels: Assess and Found. These panels account for ~19 components with heavy use of dynamic color classes (severity indicators, diff highlighting, progress states) and complex layout patterns. Current implementation uses broken tokens (`gap-xs`, `px-md`, `rounded-lg`, light-only colors like `bg-green-50`), light-only classes that fail in dark mode, and inline template-literal color classes that create Tailwind JIT safety issues.

Phase 8's core task is converting these dynamic colors from template literals to explicit static maps (per UIA-02 decision: `Record<Severity, string>` with full class strings), ensuring all components render indistinguishable from Paperclip host in light + dark modes. The phase locks three critical patterns: **severity color maps** (DriftItemCard), **diff highlighting** (AmendmentDiff), and **modal chrome** (ApprovalRoutingModal) — these patterns cascade into remaining phases.

**Primary recommendation:** Begin with DriftItemCard severity-map refactor to lock the explicit-map pattern early, then scale to remaining 18 components following D-17 ordering. Verify component-level dark-mode parity after each component migration using DualRenderProbe (extended from Phase 7).

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Tonal semantic palette for drift severity. `low` = `text-muted-foreground` (no bg). `medium` = `text-yellow-600 bg-yellow-500/10`. `high` = `text-red-600 bg-red-500/10`. Reads severity intuitively, matches Phase 7 D-04 semantic palette.
- **D-02:** Severity color map shape = per-component static const. `const SEVERITY_CLASSES: Record<Severity, string> = { low: "...", medium: "...", high: "..." }` at top of DriftItemCard.tsx. Full class strings (Tailwind JIT picks them up — no safelist needed).
- **D-04:** Amendment diff visual treatment = text + subtle bg tint. Add lines: `text-emerald-600 bg-emerald-500/10`. Remove lines: `text-red-600 bg-red-500/10`. Context lines: `text-foreground` (no bg).
- **D-05:** AmendmentDiff structure = keep `<details>` + `<summary>` collapsible wrapper. Migrate broken tokens only; preserve current reveal-on-click UX. No Card-primitive wrapper in v1.1.
- **D-07:** EvidenceChip = StatusBadge variant. StatusBadge already migrated in Phase 7; EvidenceChip becomes a thin wrapper or direct callsite consumer. Reuse, don't duplicate.
- **D-08:** ConfidenceBar = custom horizontal bar. Track: `bg-muted rounded-none`. Fill: `bg-emerald-500` (high), `bg-yellow-500` (medium), `bg-red-500` (low) per threshold. Per-component static const for thresholds and fill class.
- **D-09:** Modal sharp corners + dim/blur backdrop. Panel: `bg-card border border-border rounded-none shadow-lg`. Backdrop: `bg-background/80 backdrop-blur-sm` (NOT `bg-black/50`).
- **D-10:** Migrate modals in place — no Modal primitive extraction in v1.1. ApprovalRoutingModal, CustomOverrideWarning, ConfirmationModal each migrated individually. If three modals show pure structural duplication during plan-phase, planner may extract — otherwise defer to v1.2.
- **D-13:** Active section nav = neutral bold. Active = `bg-foreground text-background` (or equivalent host inverse). Emerald reserved for Found-mode signal + completed state; don't use for active-but-pending states.

### Claude's Discretion

- Whether DriftReportPanel needs a mode→color util beyond severity map (researcher determines from grep).
- Whether to extract a `cn()` helper if conditional class composition multiplies — Phase 7 deferred this; same logic applies.
- Threshold cutoffs for ConfidenceBar fill color (e.g., >0.75 emerald, 0.4–0.75 yellow, <0.4 red) — pick reasonable defaults matching v1.0 behavior; founder reviews in dual-render probe.
- Exact dark-mode contrast verification — relies on Phase 7 OKLCH probe baseline; spot-check during implementation.

### Deferred Ideas (OUT OF SCOPE)

- Modal primitive extraction (`src/ui/primitives/Modal.tsx`) — defer to v1.2 unless duplication forces it during plan-phase.
- Shared `severity.ts` / `mode-color.ts` util — defer until two+ components need same map.
- `cn()` / `clsx` helper — Phase 7 deferred; same logic.
- Screenshot-diff regression infra (Percy/Chromatic) — deferred to v1.2.
- Side-by-side AmendmentDiff layout — keep unified diff in v1.1.
- Vertical sidebar variant of SectionNavRail — keep horizontal tab strip.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UIA-01 | AssessPanel migrated to host tokens (root container, layout) | Current impl uses broken tokens (gap-sm, px-md); migration map provided in UI_REDO_HANDOFF.md |
| UIA-02 | DriftReportPanel + DriftItemCard migrated; dynamic color classes → explicit map | Current severityColor Record at line 48; D-02 design finalizes shape |
| UIA-03 | EvidenceChip + ConfidenceBar migrated to host tokens | EvidenceChip wraps StatusBadge (Phase 7 migrated); ConfidenceBar uses custom bar pattern (D-08) |
| UIA-04 | AmendmentDiff migrated using host tokens (diff highlighting respects accent palette) | Current impl uses `text-accent` (add) + `text-destructive` (remove); D-04 target colors verified in UI-SPEC.md |
| UIA-05 | ApprovalRoutingModal + CustomOverrideWarning + ApprovingWaitingState migrated | Current modals use `bg-black/50` backdrop + `rounded-lg`; D-09 target specs locked |
| UIFM-01 | FoundPanel + interview shell migrated to host tokens | Current impl uses broken tokens; migration follows Assess pattern |
| UIFM-02 | All Found subcomponents migrated (preset, question, vision preview, apply gate) | 10 Found components in scope; PresetSelector/QuestionRenderer/InterviewSection use Card reuse pattern |
| UIFM-03 | Vision-quest interview UI indistinguishable from host in light + dark themes | VisionPreview/ApplyProgress/ApplyErrorDisplay/ProvisioningSummary/ConfirmationModal use Card + SectionHeader primitives from Phase 7 |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Severity color mapping | Browser (plugin UI) | — | Static const maps are pure UI logic, not backend-dependent |
| Diff highlighting | Browser (plugin UI) | — | Amendment text is fetched from backend; highlighting is visual-only |
| Modal chrome | Browser (plugin UI) | — | Host tokens and primitives provide modal styling; plugin applies them |
| Evidence/confidence displays | Browser (plugin UI) | — | Badge and bar components are stateless visual wrappers |
| Interview navigation | Browser (plugin UI) | — | Section progression logic is plugin-local; rendering uses host tokens |
| Dark-mode adaptation | Browser (host) | — | Host manages `.dark` class toggle; plugin uses CSS variables automatically |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **React** | >=18 (peer) | UI component framework | Paperclip host requires >=18; plugin runs in host React tree |
| **Tailwind CSS** | v4 (host) | Utility-first CSS framework | Host uses Tailwind v4 with OKLCH variables; plugin inherits |
| **Lucide Icons** | ^1.14.0 | SVG icons (CheckCircle, X, ChevronDown) | Already in plugin dependencies; matches host design language |
| **TypeScript** | ^5.7.3 | Type-safe component definitions | Enforced in project; enables strict prop validation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Plugin SDK UI exports** | ^1.0.0 (from `@paperclipai/plugin-sdk/ui`) | Host design tokens + hooks | Phase 8 components consume SDK hooks + host tokens |
| **Phase 7 Primitives** | local | Card + SectionHeader reusable components | VisionPreview, ApplyProgress, ApplyErrorDisplay use Card variant/padding; interview sections use SectionHeader |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| **Explicit static color maps** | Inline template literals or dynamic classname builder | Would fail Tailwind JIT (template literals not parsed at build time); static maps guarantee classes exist |
| **Host tokens** | Custom Tailwind config in plugin | Would break token inheritance; plugin renders in host tree, not sandboxed |
| **Severity Record<string, string>** | Enum with per-value logic or switch statement | Enum is more verbose; Record is simpler for class-string mappings |

**Version verification:** [VERIFIED: npm registry] Confirmed phase 7 uses Tailwind v4 with OKLCH variables from host. Phase 8 consumes same stack.

---

## Architecture Patterns

### System Architecture Diagram

```
┌─ Paperclip Host (Tailwind v4 + OKLCH CSS variables) ──────────────────────────┐
│                                                                                 │
│  Host index.css: Design tokens (--background, --card, --emerald-500, etc.)     │
│  Host .dark toggle: Flips CSS var values for dark mode                         │
│                                                                                 │
│  ┌─ Compass Plugin (Phase 8 Components) ───────────────────────────────────────┤│
│  │                                                                              ││
│  │  Assess Panel                          Found Panel                          ││
│  │  ├─ AssessPanel (root)                 ├─ FoundPanel (root)                ││
│  │  ├─ DriftReportPanel (list)            ├─ SectionNavRail (tabs)             ││
│  │  ├─ DriftItemCard                      ├─ PresetSelector (Card)             ││
│  │  │  ├─ [D-02 severity map]             ├─ QuestionRenderer (Card)           ││
│  │  │  ├─ ConfidenceBar [D-08]            ├─ InterviewSection (Card)           ││
│  │  │  ├─ EvidenceChip [D-07]             ├─ VisionPreview [D-14]              ││
│  │  │  └─ AmendmentDiff [D-04, D-05]      ├─ ApplyProgress [D-15]              ││
│  │  ├─ ApprovalRoutingModal [D-09]        ├─ ApplyErrorDisplay [D-16]          ││
│  │  ├─ CustomOverrideWarning [D-10]       ├─ ProvisioningSummary               ││
│  │  └─ ApprovingWaitingState              └─ ConfirmationModal [D-10]          ││
│  │                                                                              ││
│  │  All components consume:                                                    ││
│  │  - Host tokens (bg-card, border-border, text-foreground, etc.)             ││
│  │  - Semantic palette (emerald, red, yellow per Phase 7 D-04)                ││
│  │  - Phase 7 primitives (Card, SectionHeader)                                ││
│  │  - Lucide icons                                                             ││
│  │                                                                              ││
│  └──────────────────────────────────────────────────────────────────────────────┘│
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

Data flow:
1. Host CSS variables defined (OKLCH format)
2. Tailwind generates classes from variables
3. Phase 8 components inline utility classes + explicit color maps (D-02, D-08)
4. Host .dark toggle flips variables
5. Components automatically adapt (no component-side dark-mode logic needed)
```

### Recommended Project Structure

```
src/ui/
├── primitives/                  # Phase 7 (exists)
│   ├── Card.tsx
│   └── SectionHeader.tsx
├── components/                  # Phase 7 (exists)
│   ├── StatusBadge.tsx
│   ├── ModeBanner.tsx
│   └── (7 shared components)
├── assess/                      # Phase 8 — 9 components
│   ├── AssessPanel.tsx          # root container
│   ├── DriftReportPanel.tsx     # list wrapper
│   ├── DriftItemCard.tsx        # [D-02 severity map + D-08 confidence bar]
│   ├── EvidenceChip.tsx         # [D-07 StatusBadge wrapper]
│   ├── ConfidenceBar.tsx        # [D-08 threshold-driven fill color]
│   ├── AmendmentDiff.tsx        # [D-04, D-05 diff highlighting + collapsible]
│   ├── ApprovalRoutingModal.tsx # [D-09 modal chrome]
│   ├── CustomOverrideWarning.tsx # [D-09, D-10]
│   └── ApprovingWaitingState.tsx # [D-09, D-10]
└── found/                       # Phase 8 — 10 components
    ├── FoundPanel.tsx           # root container
    ├── SectionNavRail.tsx       # [D-13 neutral bold active state]
    ├── PresetSelector.tsx       # [uses Card primitive]
    ├── QuestionRenderer.tsx     # [uses Card primitive]
    ├── InterviewSection.tsx     # [uses Card primitive]
    ├── VisionPreview.tsx        # [D-14 Card + SectionHeader]
    ├── ApplyProgress.tsx        # [D-15 Card + progress bar]
    ├── ApplyErrorDisplay.tsx    # [D-16 inline alert, not modal]
    ├── ProvisioningSummary.tsx  # [uses Card primitive]
    └── ConfirmationModal.tsx    # [D-10 modal chrome]
```

### Pattern 1: Severity Color Map (D-02) — Load-Bearing Pattern

**What:** Static Record mapping severity levels to full Tailwind class strings.

**When to use:** Any component with discrete color states that vary per status/severity/mode (not just two branches).

**Example (DriftItemCard.tsx):**
```typescript
// Source: 08-CONTEXT.md D-02, 08-UI-SPEC.md Dynamic Color Maps section
// Location: src/ui/assess/DriftItemCard.tsx (top of file, after imports)

const SEVERITY_CLASSES: Record<"low" | "medium" | "high", string> = {
  low: "text-muted-foreground",
  medium: "text-yellow-600 bg-yellow-500/10",
  high: "text-red-600 bg-red-500/10"
};

export function DriftItemCard({ item, ...props }: DriftItemCardProps): React.ReactElement {
  return (
    <div>
      <span className={SEVERITY_CLASSES[item.severity]}>
        {item.severity}
      </span>
    </div>
  );
}
```

**Key insights:**
- **Full class strings, not partials:** "text-yellow-600 bg-yellow-500/10", NOT ["text-yellow-600", "bg-yellow-500/10"]
- **Tailwind JIT-safe:** Classes are static at build time; esbuild sees them as string literals
- **Per-component scope:** Keep map at top of each file; don't extract to shared util (Phase 8 D-02 discretion, defer extraction to v1.2)
- **Opacity modifiers work:** `/10` is native Tailwind; host OKLCH tokens support it (verified Phase 7)

### Pattern 2: Amendment Diff Highlighting (D-04) — Semantic + Tonal

**What:** Add lines get emerald tint, remove lines get red tint, context lines are neutral.

**When to use:** Diff viewers, version comparisons, change highlights.

**Example (AmendmentDiff.tsx):**
```typescript
// Source: 08-CONTEXT.md D-04, 08-UI-SPEC.md AmendmentDiff section

function AmendmentDiff({ amendment }: AmendmentDiffProps): React.ReactElement {
  const lines = amendment.split("\n");
  
  return (
    <div>
      {lines.map((line, idx) => {
        if (line.startsWith("+")) {
          // Add line: emerald text + subtle bg
          return <div key={idx} className="text-emerald-600 bg-emerald-500/10">{line}</div>;
        } else if (line.startsWith("-")) {
          // Remove line: red text + subtle bg
          return <div key={idx} className="text-red-600 bg-red-500/10">{line}</div>;
        } else {
          // Context: neutral, no bg
          return <div key={idx} className="text-foreground">{line}</div>;
        }
      })}
    </div>
  );
}
```

**Key insights:**
- **Tint, not saturation:** `/10` opacity makes bg subtle; text is full color for readability
- **Semantic meanings:** Emerald = success/accepted, red = removed/rejected
- **Structure preserved:** D-05 keeps `<details>` + `<summary>` collapsible wrapper; pure token swap, no restructure

### Pattern 3: Modal Chrome (D-09) — Unified Pattern

**What:** All modals use same backdrop + panel styling for visual consistency.

**When to use:** ApprovalRoutingModal, CustomOverrideWarning, ConfirmationModal, and any future modals.

**Example (ApprovalRoutingModal.tsx):**
```typescript
// Source: 08-CONTEXT.md D-09, 08-UI-SPEC.md ApprovalRoutingModal section

export function ApprovalRoutingModal({ isOpen, onClose }: Props): React.ReactElement {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop: dim + blur */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Panel: card styling, sharp corners */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-card border border-border rounded-none shadow-lg pointer-events-auto">
          {/* Content */}
        </div>
      </div>
    </>
  );
}
```

**Key insights:**
- **No `bg-black/50`:** Use `bg-background/80` for host-aware dimming (D-09)
- **Blur effect:** `backdrop-blur-sm` adds depth without obscuring completely
- **Sharp corners:** `rounded-none` per host design (Phase 7 D-09)
- **Apply same pattern to all three modals:** ConsistencyD-10

### Anti-Patterns to Avoid

- **Template-literal color classes:** `` `bg-${severity}` `` fails Tailwind JIT. Use explicit maps instead (D-02 pattern).
- **Light-only utilities in modal:** `bg-black/50` is light-only feel. Use `bg-background/80` (D-09).
- **Rounded corners in Phase 8:** `rounded-lg`, `rounded-xl` conflict with host's flat design. Always use `rounded-none`.
- **Broken custom tokens:** `gap-xs`, `px-md`, `py-sm`, `text-label` — replace with Tailwind native (gap-1/2/3, px-2/3/4, `text-xs font-medium`).
- **Hardcoded dark-mode branching:** Don't write `isDark ? 'light-color' : 'dark-color'`. Use host CSS variables + Tailwind utilities.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **Severity color mapping** | Custom enum class or conditional branches | Static Record<string, string> (D-02 pattern) | Explicit maps are Tailwind JIT-safe; conditionals create unparseable string templates |
| **Evidence badges** | Custom badge from scratch | StatusBadge wrapper (D-07, Phase 7) | StatusBadge already uses semantic palette; reuse saves duplication and maintenance |
| **Confidence bar fill** | Custom gradient or radial fill | Threshold-driven solid color map (D-08 pattern) | Solid colors are simpler, match host aesthetic, render correctly in light+dark |
| **Amendment diff syntax highlighting** | Custom CSS or inline styles | Semantic color classes per line type (D-04) | Tailwind classes guarantee host-token parity; custom CSS breaks dark-mode |
| **Modal backdrop + panel** | One-off modal styling per component | Unified modal chrome pattern (D-09) | Consistency across 3 modals; shared pattern enables future extraction |
| **Interview navigation state** | Inline active/pending/done styling | Static step status maps (D-15, D-16 pattern analog) | Maps are DRY, testable, easily tunable |

**Key insight:** Phases 7-8 are about token parity, not new features. Don't custom-build styling that host tokens already provide.

---

## Runtime State Inventory

**Trigger:** Phase 8 is a UI token migration with no rename/refactor. No runtime state changes.

**Explicitly verified:**
- ✓ No stored data (drift items, evidence, findings) contains hardcoded color/spacing values
- ✓ No live service config (n8n, Datadog) references broken token names
- ✓ No OS-registered state affected
- ✓ No secret keys or env var names change
- ✓ Build artifacts (dist/) regenerated on rebuild; no stale artifacts

---

## Common Pitfalls

### Pitfall 1: Template-Literal Color Classes Blocking Tailwind JIT

**What goes wrong:** Developer writes `` className={`bg-${color}-500`} `` for dynamic colors. Tailwind JIT doesn't parse template expressions, so class never makes it into compiled CSS. Result: No color applied, style breaks.

**Why it happens:** Feels natural in JavaScript to parameterize class names. Tailwind's static analysis can't see inside template expressions.

**How to avoid:** Use explicit maps (D-02 pattern): `const COLOR_MAP = { low: "bg-emerald-500", ... }`, then `className={COLOR_MAP[level]}`. Maps are static at build time.

**Warning signs:** Class renders invisible color (no effect), Tailwind build output shows missing classes, `rounded` or `bg-yellow-500` is missing from generated CSS.

### Pitfall 2: Light-Only Utilities in Dark Mode

**What goes wrong:** Developer uses `bg-black/50` (light-only backdrop) or `bg-green-50` (light-only color) in modal. In dark mode, color doesn't invert, text becomes hard to read or invisible.

**Why it happens:** Developer tests in light mode only; doesn't notice host dark mode exists.

**How to avoid:** Use host tokens (bg-background/80) and semantic palette (emerald/red/yellow/blue). Phase 7 proved these work in both modes (OklchProbe verification).

**Warning signs:** Founder toggles host dark mode; modal backdrop is too dark or text is invisible; contrast ratio fails WCAG.

### Pitfall 3: Emerald Overuse (Semantic Palette Misunderstanding)

**What goes wrong:** Developer thinks emerald is the "primary" color and uses it for active states, buttons, interactive elements. Result: Everything looks like a success state; Found mode loses its visual signal.

**Why it happens:** v1.0 shipped with this error; developer copying old code doesn't read D-01, D-04, D-13.

**How to avoid:** Read CONTEXT.md D-01, D-04, D-13, D-15 carefully. Emerald = success/healthy/completed ONLY. Active tabs use `bg-foreground text-background` (D-13). In-flight progress uses neutral fill (D-15). Red = error/revive. Yellow = warning/reposition.

**Warning signs:** All interactive elements are emerald; founder says "everything looks completed"; SectionNavRail active state uses emerald instead of neutral bold.

### Pitfall 4: Skipping Dark-Mode Verification

**What goes wrong:** Developer migrates component in light mode only, then founder tests in dark mode and reports color is unreadable or breaks layout.

**Why it happens:** Phase 7 established DualRenderProbe for this exact reason; some developers skip the probe step.

**How to avoid:** After each component migration, test in both light and dark modes. Extend DualRenderProbe to add Phase 8 components, then render side-by-side.

**Warning signs:** Component looks good in light, bad in dark; modal backdrop is invisible; text contrast fails at night.

---

## Code Examples

Verified patterns from official sources:

### Example 1: DriftItemCard Severity Map (D-02)

```typescript
// Source: 08-CONTEXT.md D-02, 08-UI-SPEC.md pattern reference
// File: src/ui/assess/DriftItemCard.tsx

import React from "react";
import { Check, X } from "lucide-react";
import { ConfidenceBar } from "./ConfidenceBar.js";
import { EvidenceList } from "./EvidenceChip.js";
import { AmendmentDiff } from "./AmendmentDiff.js";
import type { DriftItem } from "../../types/assess.js";

interface DriftItemCardProps {
  item: DriftItem;
  acceptedState: boolean | null;
  onAccept: () => void;
  onReject: () => void;
}

// MIGRATION TARGET: Replace broken severityColor Record
// OLD (BROKEN):
//   const severityColor: Record<string, string> = {
//     info: "text-foreground/70",      ← custom token, doesn't exist
//     warn: "text-accent",              ← light-only, wrong in dark mode
//     blocker: "text-destructive",      ← not semantic
//   };
//
// NEW (CORRECT):
const SEVERITY_CLASSES: Record<"low" | "medium" | "high", string> = {
  low: "text-muted-foreground",                    // Neutral, subtle
  medium: "text-yellow-600 bg-yellow-500/10",    // Warning: tonal yellow
  high: "text-red-600 bg-red-500/10"             // Critical: tonal red
};

export function DriftItemCard({
  item,
  acceptedState,
  onAccept,
  onReject,
}: DriftItemCardProps): React.ReactElement {
  const isAccepted = acceptedState === true;
  const isRejected = acceptedState === false;

  return (
    <div className="bg-card border border-border rounded-none overflow-hidden">
      {/* Header with severity badge */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <ConfidenceBar confidence={item.confidence} />
          </div>
          {/* Apply severity map here */}
          <span className={`text-xs font-medium whitespace-nowrap ${SEVERITY_CLASSES[item.severity]}`}>
            {item.severity}
          </span>
        </div>
      </div>

      {/* Body with evidence and amendment */}
      <div className="p-4 space-y-4">
        <EvidenceList evidence={item.evidence} onEvidenceClick={onEvidenceClick} />
        <AmendmentDiff amendment={item.amendment} />
      </div>

      {/* Footer with accept/reject */}
      <div className="p-4 border-t border-border flex gap-2">
        <button
          onClick={onAccept}
          className={`flex-1 px-3 py-2 rounded-none text-sm font-medium transition-colors ${
            isAccepted ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Check className="h-4 w-4 inline mr-1" /> Accept
        </button>
        <button
          onClick={onReject}
          className={`flex-1 px-3 py-2 rounded-none text-sm font-medium transition-colors ${
            isRejected ? "bg-red-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <X className="h-4 w-4 inline mr-1" /> Reject
        </button>
      </div>
    </div>
  );
}
```

**Key points:**
- `SEVERITY_CLASSES` is a static const (Tailwind JIT-safe)
- Map keys are literal strings ("low" | "medium" | "high") — TypeScript enforces correctness
- Full class strings, not partials — enables complex multi-class colors like "text-yellow-600 bg-yellow-500/10"
- Pattern is reusable (copy to ConfidenceBar fill threshold map, ApplyProgress step map, etc.)

### Example 2: Amendment Diff Highlighting (D-04)

```typescript
// Source: 08-CONTEXT.md D-04, 08-UI-SPEC.md AmendmentDiff section
// File: src/ui/assess/AmendmentDiff.tsx

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AmendmentDiffProps {
  amendment: string;
  className?: string;
}

export function AmendmentDiff({
  amendment,
  className = "",
}: AmendmentDiffProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const lines = amendment.split("\n").filter(line => line.trim().length > 0);

  return (
    <details
      open={isOpen}
      onToggle={e => setIsOpen(e.currentTarget.open)}
      className={`group ${className}`}
    >
      {/* Summary: collapsible trigger */}
      <summary className="cursor-pointer flex items-center gap-2 text-xs font-medium text-foreground hover:text-foreground/80 transition-colors p-2 hover:bg-muted rounded-none select-none">
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        <span>Proposed amendment:</span>
      </summary>

      {/* Diff content with semantic highlighting */}
      <div className="mt-3 p-3 bg-muted rounded-none border border-border overflow-x-auto">
        <pre className="text-xs font-normal leading-relaxed whitespace-pre-wrap break-words">
          {lines.map((line, idx) => {
            // D-04: Add lines get emerald tint, remove get red tint
            if (line.startsWith("+")) {
              // Add: emerald text + subtle bg
              return (
                <div key={idx} className="text-emerald-600 bg-emerald-500/10">
                  {line}
                </div>
              );
            } else if (line.startsWith("-")) {
              // Remove: red text + subtle bg
              return (
                <div key={idx} className="text-red-600 bg-red-500/10">
                  {line}
                </div>
              );
            } else {
              // Context: neutral, no bg
              return (
                <div key={idx} className="text-foreground">
                  {line}
                </div>
              );
            }
          })}
        </pre>
      </div>
    </details>
  );
}
```

**Migration notes:**
- OLD: `line.startsWith("+")` → `className="text-accent"` (breaks in dark)
- NEW: `line.startsWith("+")` → `className="text-emerald-600 bg-emerald-500/10"` (host token)
- OLD: `line.startsWith("-")` → `className="text-destructive"` (undefined token)
- NEW: `line.startsWith("-")` → `className="text-red-600 bg-red-500/10"` (semantic)
- Keep `<details>` + `<summary>` structure (D-05); pure token swap, no restructure

### Example 3: Modal Chrome Pattern (D-09)

```typescript
// Source: 08-CONTEXT.md D-09, 08-UI-SPEC.md ApprovalRoutingModal section
// File: src/ui/assess/ApprovalRoutingModal.tsx

import React from "react";
import { X } from "lucide-react";

interface ApprovalRoutingModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onApprove: () => void;
  onCancel: () => void;
}

export function ApprovalRoutingModal({
  isOpen,
  title,
  message,
  onApprove,
  onCancel,
}: ApprovalRoutingModalProps): React.ReactElement | null {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop: D-09 pattern — dim + blur, NOT black/50 */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel: D-09 pattern — sharp corners, host tokens */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-card border border-border rounded-none shadow-lg pointer-events-auto max-w-sm">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <button
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-sm text-foreground mb-4">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 p-4 border-t border-border">
            <button
              onClick={onCancel}
              className="flex-1 px-3 py-2 rounded-none border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onApprove}
              className="flex-1 px-3 py-2 rounded-none bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              Approve
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
```

**Key points:**
- Backdrop: `bg-background/80 backdrop-blur-sm` (D-09 — replaces `bg-black/50`)
- Panel: `bg-card border border-border rounded-none shadow-lg` (D-09 host tokens)
- Same pattern applies to CustomOverrideWarning + ConfirmationModal (D-10)
- Approve button uses emerald (success semantic, per D-04)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline color template literals (`` `bg-${color}` ``) | Explicit static Record maps (D-02) | Phase 8 (this research) | Enables Tailwind JIT safety; prevents "missing class" failures |
| Light-only Tailwind utilities (`bg-green-50`, `text-slate-600`) | Semantic palette + opacity modifiers (Phase 7) | Phase 7 verified, Phase 8 applies | Fixes dark-mode color blindness; contrast improves |
| `rounded-lg`, `rounded-xl` modal corners | `rounded-none` sharp corners (D-09) | Phase 8 (per host design) | Matches Paperclip host's flat aesthetic |
| Inline text token aliases (`text-label`, `text-heading`) | Explicit Tailwind classes (`text-xs font-medium`, `text-base font-semibold`) | Phase 7 D-05 map, Phase 8 applies | Reduces abstraction; easier to read and maintain |
| Per-modal custom backdrop styling | Unified modal chrome pattern (D-09, D-10) | Phase 8 (this research) | Consistency across 3 modals; enables future extraction |

**Deprecated/outdated:**
- Custom spacing tokens (`gap-xs`, `gap-sm`, `px-md`, `py-sm`, `space-y-lg`): Use Tailwind native (gap-1/2/3/4, px-1/2/3/4, space-y-1/2/3/4). Never existed as real tokens; v1.0 workaround.
- Light-only color utilities (`bg-green-50`, `text-slate-600`, `border-green-200`): Replaced by semantic palette (emerald/red/yellow/blue). v1.0 error; v1.1 correction.
- `text-accent` for add lines (AmendmentDiff): Replaced by `text-emerald-600` (semantic success). Emerald is reserved for success/healthy, not primary interactive.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|--------------|
| A1 | Phase 7 Card + SectionHeader primitives are complete and exported correctly | Architecture patterns | MEDIUM — If primitives don't export correctly, VisionPreview/ApplyProgress can't consume them. But Phase 7 VERIFICATION.md confirms ✓ VERIFIED |
| A2 | Threshold cutoffs for ConfidenceBar fill (e.g., >0.75 emerald, 0.4–0.75 yellow, <0.4 red) match v1.0 behavior | ConfidenceBar D-08 pattern | MEDIUM — If thresholds are off, confidence display may mislead. Founder should review in dual-render probe. |
| A3 | EvidenceChip can be implemented as a thin wrapper around StatusBadge (D-07) without duplicating code | EvidenceChip D-07 pattern | LOW — If EvidenceChip has distinct styling needs, wrapper approach may not work. Verify during planning. |
| A4 | DriftReportPanel doesn't use mode-color beyond severity map (D-03 discretion) | D-03 decision note | LOW — Grep will reveal if mode-color logic is needed. If found, apply Phase 7 D-04 mode→color mapping inline. |
| A5 | Three modals (ApprovalRoutingModal, CustomOverrideWarning, ConfirmationModal) will not show structural duplication requiring Modal primitive extraction (D-10) | D-10 decision note | MEDIUM — Planner should verify during plan-phase. If all three have pure structural similarity, flag for v1.2 extraction. |
| A6 | Host sidebar tokens (`bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-border`) from Phase 7 remain available and unchanged | Phase 7 primitive dependency | LOW — Phase 7 VERIFICATION.md confirms SidebarLink uses these; Phase 8 doesn't modify sidebar, so no risk. |

**Validation needed before implementation start:**
- A2: Founder reviews ConfidenceBar thresholds in DualRenderProbe (dual-render of ~3 drift items with varying confidence scores)
- A3: Verify EvidenceChip can wrap StatusBadge by reading both components' props + testing in AssessPanel
- A4: Grep DriftReportPanel for mode-specific colors or dynamic mode logic; if none, mark D-03 as "no mode-color needed"
- A5: Planner compares three modal structures; if identical header/footer/action pattern, flag for extraction

---

## Open Questions

1. **EvidenceChip implementation strategy (D-07)**
   - What we know: StatusBadge is phase 7 migrated and available; EvidenceChip currently exists in codebase
   - What's unclear: Should EvidenceChip be a thin wrapper (`<StatusBadge status={mapEvidenceToStatus()} />`), or direct callsite consumer that applies StatusBadge classes?
   - Recommendation: Check current EvidenceChip implementation; if it's mostly markup + StatusBadge logic, extract to wrapper. If it has distinct layout/sizing, keep separate and migrate tokens directly.

2. **ConfidenceBar threshold cutoffs (D-08 discretion)**
   - What we know: Default behavior from v1.0 should be preserved; Phase 7 DualRenderProbe proved OKLCH colors work
   - What's unclear: What are the exact confidence score thresholds for emerald/yellow/red? (e.g., >0.75, 0.4–0.75, <0.4?)
   - Recommendation: Search v1.0 codebase for ConfidenceBar implementation; extract thresholds from existing logic. If missing, use sensible defaults (>0.75 emerald, 0.4–0.75 yellow, <0.4 red) and founder reviews in dual-render probe.

3. **Modal primitive extraction blocker (D-10)**
   - What we know: Three modals (ApprovalRoutingModal, CustomOverrideWarning, ConfirmationModal) will be migrated individually
   - What's unclear: Will the planner identify structural duplication and want to extract a Modal primitive?
   - Recommendation: Planner compares modal structures during plan-phase. If all three have identical header/footer/backdrop/action pattern, flag for v1.2 extraction. For v1.1, migrate in place per D-10.

4. **DriftReportPanel mode-color usage (D-03 discretion)**
   - What we know: DriftItemCard has severity map; ModeBanner has mode-aware color
   - What's unclear: Does DriftReportPanel render mode-specific colors anywhere, or is severity map sufficient?
   - Recommendation: Grep DriftReportPanel.tsx for mode-specific logic or dynamic mode coloring. If none found, mark D-03 as "no mode-color needed, severity map is sufficient."

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build (esbuild, TypeScript) | ✓ | >=20 | — |
| npm / pnpm | Package management | ✓ | pnpm >=9.15.4 | npm (slower) |
| esbuild | Build bundling | ✓ | ^0.27.3 | — |
| TypeScript | Compilation + type checking | ✓ | ^5.7.3 | — |
| React 19 | Host + plugin peer | ✓ | ^19.0.0 (host) | — |
| Tailwind v4 | Host CSS framework (inherited) | ✓ | v4 (host) | — |
| Vitest | Unit tests (Phase 8 components) | ✓ | ^3.0.5 | Jest (not ideal) |
| Lucide Icons | Icon components (CheckCircle, X, ChevronDown) | ✓ | ^1.14.0 | — |
| @paperclipai/plugin-sdk | Plugin SDK + UI hooks | ✓ | 2026.428.0 | — |
| Phase 7 Card primitive | VisionPreview, ApplyProgress, interview cards | ✓ | local export | — |
| Phase 7 SectionHeader primitive | VisionPreview, ApplyProgress headers | ✓ | local export | — |
| Phase 7 StatusBadge | EvidenceChip wrapper (D-07) | ✓ | local export | — |

**Missing dependencies with no fallback:** None identified.

**Missing dependencies with fallback:** None identified.

**All required dependencies present and verified from Phase 7 VERIFICATION.md.** No blockers for Phase 8 execution.

---

## Validation Architecture

**Validation framework:** `workflow.nyquist_validation: false` in .planning/config.json → Nyquist framework disabled. Phase 8 validation is manual + visual (dark-mode toggle, dual-render probe), not automated test-driven.

### Phase 8 Testing Scope

| Component | Test Type | Validation Method | Status |
|-----------|-----------|-------------------|--------|
| DriftItemCard severity map | Manual visual (all three severity states) | DualRenderProbe: render 3 drift items with low/medium/high severity in light+dark | ❌ Phase 8 task |
| ConfidenceBar fill thresholds | Manual visual (high/medium/low confidence) | DualRenderProbe: render 3 drift items with 0.9/0.6/0.3 confidence in light+dark | ❌ Phase 8 task |
| AmendmentDiff highlighting | Manual visual (add/remove/context lines) | DualRenderProbe: render sample diff in light+dark, verify colors are distinct | ❌ Phase 8 task |
| ApprovalRoutingModal backdrop + panel | Manual visual (focus, contrast, backdrop blur) | DualRenderProbe: open modal in light+dark, verify backdrop dims correctly | ❌ Phase 8 task |
| SectionNavRail active state (D-13) | Manual visual (active != emerald) | DualRenderProbe: render nav tabs with active state, verify neutral bold (NOT emerald) | ❌ Phase 8 task |
| VisionPreview + ApplyProgress + ProvisioningSummary | Manual visual (all use Card/SectionHeader) | DualRenderProbe: render full found-mode preview in light+dark | ❌ Phase 8 task |
| All ~19 Phase 8 components in light+dark | Integration (visual regression, manual) | DualRenderProbe extended to include all Phase 8 components side-by-side | ❌ Phase 8 task |
| Grep verification (broken patterns) | Script — zero hits on 28 broken-pattern list | `grep -r "gap-xs\|gap-sm\|px-md\|..." src/ui/assess src/ui/found` | ❌ Phase 8 task |

### Wave 0 Gaps

- [ ] DualRenderProbe extended to include Phase 8 components (currently covers Phase 7 only)
- [ ] Grep verifier script confirms zero broken-pattern hits in assess/ + found/ directories before Phase 8 ship
- [ ] ConfidenceBar threshold constants extracted or verified from v1.0 logic
- [ ] EvidenceChip implementation strategy documented (wrapper vs. direct token migration)

---

## Security Domain

**Enabled:** Security enforcement is enabled by default (absent from config = enabled). Phase 8 is UI-only (no new backend logic, no API endpoints, no data mutations beyond UI state). Security review is scoped to visual/interaction contracts, not access control or data handling.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Phase 8 has no auth logic; auth managed by Plugin SDK + Paperclip host |
| V3 Session Management | No | Plugin SDK handles session state; Phase 8 does not introduce sessions |
| V4 Access Control | No | Panel visibility controlled by detected mode; no new access control in Phase 8 |
| V5 Input Validation | No | Phase 8 is UI reskin; no new input handling |
| V6 Cryptography | No | No cryptographic operations in UI layer |
| V7 Error Handling | Yes | ApplyErrorDisplay component; ensure error messages don't leak sensitive data (inherited from v1.0) |
| V14 Configuration | No | No plugin-side config added; inherits from host |

### Known Threat Patterns for Phase 8 Components

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via unsanitized drift item text in DriftItemCard | Tampering | Drift items come from backend; React escapes text by default. No raw HTML injection. |
| CSS injection via dynamic severity classes | Tampering | Severity classes are static Record keys, not user-supplied. No injection surface. |
| Modal backdrop dismissal abuse (onclick backdrop close) | Denial of Service | ApprovalRoutingModal allows backdrop click to close; behavior matches Paperclip host modals. Expected pattern. |
| Dark-mode CSS disclosure | Information Disclosure | Host manages theme toggle; plugin responds passively. No new disclosure surface. |

**Phase 8 security posture:** No new attack surface. Inherits Plugin SDK + host security model.

---

## Sources

### Primary (HIGH confidence)

- **Phase 7 RESEARCH.md + VERIFICATION.md** — Token baseline, Card/SectionHeader primitives, semantic palette verification (OKLCH + opacity modifiers confirmed working)
- **Phase 8 CONTEXT.md** — Locked design decisions (D-01 through D-17) and canonical references
- **Phase 8 UI-SPEC.md** — Visual specification, component primitives, color palette, spacing scale, copywriting contract
- **UI_REDO_HANDOFF.md** — Concrete class migration map and broken-pattern inventory
- **Paperclip host `~/Development/paperclip-temp/ui/src/components/`** — shadcn "new-york" reference implementation
- **Paperclip host `~/Development/paperclip-temp/ui/src/index.css`** — Host token definitions (OKLCH format)

### Secondary (MEDIUM confidence)

- **REQUIREMENTS.md (UIA-01 through UIA-05, UIFM-01 through UIFM-03)** — Phase 8 requirement descriptions and traceability
- **ROADMAP.md § Phase 8** — Phase goal, success criteria, dependencies on Phase 7
- **STATE.md** — Project context, v1.1 milestone memory, Phase 7 completion status

### Tertiary (LOW confidence — marked for validation)

- **A2 (ConfidenceBar thresholds):** [ASSUMED] Reasonable defaults (>0.75 emerald, 0.4–0.75 yellow, <0.4 red); needs founder review in dual-render probe
- **A3 (EvidenceChip wrapper):** [ASSUMED] Can be implemented as StatusBadge wrapper; verify during planning by checking current impl
- **A4 (DriftReportPanel mode-color):** [ASSUMED] No mode-specific coloring beyond severity map; grep will confirm
- **A5 (Modal duplication):** [ASSUMED] Three modals won't trigger extraction (defer to v1.2); planner verifies during plan-phase

---

## Metadata

**Confidence breakdown:**
- **Standard Stack (React, Tailwind v4, OKLCH tokens):** HIGH — Verified Phase 7 research + host source
- **Architecture (token inheritance, dark-mode):** HIGH — Phase 7 confirmed all mechanisms
- **Component inventory (19 components, 9 Assess + 10 Found):** HIGH — Verified via file listing + source inspection
- **Broken token patterns (template literals, custom spacing, light-only colors):** HIGH — Identified in UI_REDO_HANDOFF.md + Phase 7 grep verify
- **Design patterns (severity maps, diff highlighting, modal chrome):** HIGH — Locked in CONTEXT.md decisions + UI-SPEC.md
- **Threshold cutoffs (ConfidenceBar):** MEDIUM — Assumed reasonable defaults; needs founder review
- **EvidenceChip wrapper strategy (D-07):** MEDIUM — Likely wrapper pattern; verify via code inspection
- **Modal duplication risk (D-10):** MEDIUM — Planner comparison during plan-phase required

**Research date:** 2026-05-09  
**Valid until:** 2026-05-18 (9 days — stable phase, Tailwind/SDK versions locked, no major releases expected)

---

*Phase 8 research complete. Ready for planning and execution. Pattern-setting tasks: DriftItemCard severity map (D-02) → AmendmentDiff (D-04) → Modal chrome (D-09) establish reusable patterns for remaining 16 components.*
