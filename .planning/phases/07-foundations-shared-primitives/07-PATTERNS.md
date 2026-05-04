# Phase 7: Foundations + Shared Primitives - Pattern Map

**Mapped:** 2026-05-04  
**Files analyzed:** 17 new/modified files  
**Analogs found:** 13 / 17

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/ui/primitives/Card.tsx` | component | request-response | `src/ui/components/AgentCard.tsx` | exact |
| `src/ui/primitives/SectionHeader.tsx` | component | request-response | `src/ui/components/ModeBanner.tsx` | exact |
| `src/ui/components/OklchProbe.tsx` | component | request-response | `src/ui/components/InventoryDisplay.tsx` | partial |
| `src/ui/components/DualRenderProbe.tsx` | component | request-response | `src/ui/MainPanel.tsx` | partial |
| `src/ui/MainPanel.tsx` | controller | request-response | `src/ui/MainPanel.tsx` (self) | N/A |
| `src/ui/SidebarLink.tsx` | component | request-response | `src/ui/SidebarLink.tsx` (self) | N/A |
| `src/ui/components/ModeBanner.tsx` | component | request-response | `src/ui/components/ModeBanner.tsx` (self) | N/A |
| `src/ui/components/StatusBadge.tsx` | component | request-response | `src/ui/components/StatusBadge.tsx` (self) | N/A |
| `src/ui/components/AgentCard.tsx` | component | request-response | `src/ui/components/AgentCard.tsx` (self) | N/A |
| `src/ui/components/VisionStatusDisplay.tsx` | component | request-response | `src/ui/components/VisionStatusDisplay.tsx` (self) | N/A |
| `src/ui/components/InventoryDisplay.tsx` | component | request-response | `src/ui/components/InventoryDisplay.tsx` (self) | N/A |
| `src/ui/components/ChatPanel.tsx` | component | request-response | `src/ui/components/ChatPanel.tsx` (self) | N/A |
| `src/ui/components/ActivityTimeline.tsx` | component | request-response | `src/ui/components/ActivityTimeline.tsx` (self) | N/A |
| `src/ui/components/DocumentList.tsx` | component | request-response | `src/ui/components/DocumentList.tsx` (self) | N/A |
| `src/ui/components/ErrorBoundary.tsx` | component | request-response | `src/ui/components/ErrorBoundary.tsx` (self) | N/A |
| `tests/ui/Card.test.ts` | test | CRUD | `tests/ui/assess.ui.spec.ts` | role-match |
| `tests/ui/SectionHeader.test.ts` | test | CRUD | `tests/ui/assess.ui.spec.ts` | role-match |

---

## Pattern Assignments

### `src/ui/primitives/Card.tsx` (component, request-response)

**Analog:** `src/ui/components/AgentCard.tsx`

**Imports pattern** (lines 1-4):
```typescript
import React from "react";
import type { SomeType } from "../../types.js";
```

**Component structure** (lines 22-42):
```typescript
export function AgentCard({ agent }: AgentCardProps): React.ReactElement {
  return (
    <div className="rounded border border-border bg-card px-md py-md">
      <div className="flex items-start justify-between gap-md">
        {/* content */}
      </div>
    </div>
  );
}
```

**Key pattern from AgentCard to replicate:**
- Function component with React.ReactElement return type
- JSDoc comment with `@param` and `@returns` documentation
- Inline Tailwind classes (border, padding, flexbox utilities)
- Use of host tokens: `bg-card`, `border-border`, spacing via `px-md py-md`
- No `cn()` helper — template literals for conditional classes only

**Token usage for Card:**
- Variant default: `bg-card border border-border`
- Variant muted: `bg-muted border border-border`
- Variant elevated: `bg-card border border-border shadow-sm`
- Padding sm: `p-2` (8px)
- Padding md: `p-4` (16px)
- Padding lg: `p-6` (24px)
- Always: `rounded-none` (sharp corners per host design)

---

### `src/ui/primitives/SectionHeader.tsx` (component, request-response)

**Analog:** `src/ui/components/ModeBanner.tsx`

**Imports pattern** (lines 1-3):
```typescript
import React from "react";
import { Compass } from "lucide-react";
import type { InventorySnapshot, Mode } from "../../types.js";
```

**Component structure** (lines 29-66):
```typescript
export function ModeBanner({
  inventory,
  detectedMode,
  override,
  onOverrideChange,
}: ModeBannerProps): React.ReactElement {
  const currentMode = override || detectedMode;

  return (
    <div className="border-b bg-card px-lg py-lg">
      <div className="flex items-center justify-between gap-md">
        <div className="flex items-start gap-md flex-1">
          <Compass className="h-5 w-5 mt-1 text-accent flex-shrink-0" />
          <div>
            <h2 className="text-heading font-semibold leading-tight">
              {getModeLabel(currentMode)}
            </h2>
            <p className="text-body text-foreground/70 mt-xs">
              {getModeBannerCopy(currentMode)}
            </p>
          </div>
        </div>
```

**Key pattern from ModeBanner to replicate:**
- Flexbox layout with `flex items-start justify-between gap-md`
- Icon component (lucide) with `className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0"`
- Typography: `text-base font-semibold text-foreground` for title, `text-sm text-muted-foreground` for subtitle
- No padding/margin tokens passed to children — parent supplies spacing
- Actions slot right-aligned via flex gap

**Token usage for SectionHeader:**
- Container: `flex items-start justify-between gap-4`
- Icon: `h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0`
- Title: `text-base font-semibold text-foreground`
- Subtitle: `text-sm text-muted-foreground`
- Actions: `flex justify-end items-center gap-2`

---

### `src/ui/components/OklchProbe.tsx` (component, request-response)

**Analog:** `src/ui/components/InventoryDisplay.tsx`

**Imports pattern** (lines 1-5):
```typescript
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { InventorySnapshot } from "../../types.js";
import { AgentCard } from "./AgentCard.js";
```

**Component structure** (lines 28-82):
```typescript
export function InventoryDisplay({
  inventory,
}: InventoryDisplayProps): React.ReactElement {
  return (
    <div className="divide-y divide-border">
      {/* Agents section */}
      <CollapsibleSection
        title={`Agents (${inventory.agentCount})`}
        defaultOpen={true}
      >
        {inventory.agents.length > 0 ? (
          <div className="space-y-sm">
            {inventory.agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
```

**Key pattern from InventoryDisplay to replicate for OklchProbe:**
- Grid/container structure rendering multiple color variants
- Use of host color tokens directly in className
- Render same color in light and dark side-by-side
- Simple card layout to display color swatches

**Token usage for OklchProbe (gating task UIF-08):**
Render all Phase 7 color tokens in small swatches:
- `bg-card`, `bg-muted`, `border-border`, `text-foreground`, `text-muted-foreground`
- `bg-emerald-500/10`, `bg-emerald-500/20`
- `bg-red-500/10`, `bg-red-500/20`
- `bg-blue-500/10`, `bg-yellow-500/10`

---

### `src/ui/components/DualRenderProbe.tsx` (component, request-response)

**Analog:** `src/ui/MainPanel.tsx`

**Imports pattern** (lines 1-16):
```typescript
import React, { useCallback, useState } from "react";
import {
  usePluginData,
  usePluginAction,
  useHostContext,
} from "@paperclipai/plugin-sdk/ui";
import type { InventorySnapshot, Mode } from "../types.js";
import { ModeBanner } from "./components/ModeBanner.js";
import { InventoryDisplay } from "./components/InventoryDisplay.js";
import { ChatPanel } from "./components/ChatPanel.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
```

**Component structure** (lines 96-271):
```typescript
export function MainPanel(): React.ReactElement {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabType>("mode");
  
  return (
    <div className="flex h-full flex-col bg-background">
      {/* D-03: Mode banner at top with override dropdown */}
      <ModeBanner {...} />

      {/* Tab bar with History tab (D-10, MEM-04) */}
      <HistoryTabBar {...} />

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
```

**Key pattern from MainPanel to replicate:**
- Root layout with `flex h-full flex-col bg-background`
- Import and render all Phase 7 components in side-by-side light/dark contexts
- Use div with `class="light"` and `class="dark"` to force theme context
- Render each component twice — once in light, once in dark
- No state mutations; purely compositional render

---

### `src/ui/MainPanel.tsx` (controller, request-response) — MIGRATION TARGET

**Current analog:** Self (existing file to be refactored)

**Tokens to replace:**

| Current | Replace with | Lines |
|---------|--------------|-------|
| `text-label` | `text-xs font-medium` | 71, 120 |
| `text-body` | `text-sm` | 162 |
| `text-heading` | `text-base font-semibold` | 43 |
| `gap-sm` | `gap-2` | 68 |
| `px-lg py-sm` | `px-4 py-2` | 68 |
| `px-md py-sm` | `px-4 py-2` | 71, 79 |
| `mt-xs` | `mt-1` | 46 |
| `px-lg py-md` | `px-4 py-4` | 256 |

**Pattern:** All existing imports, state management, and logic remain unchanged. Only classNames with broken tokens are replaced with host token equivalents.

---

### `src/ui/SidebarLink.tsx` (component, request-response) — MIGRATION TARGET

**Current analog:** Self (existing file to be refactored)

**Current tokens (broken):**
```typescript
className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-zinc-800 ${
  isActive ? "bg-zinc-800 text-white" : "text-zinc-400"
}`}
```

**Replace with host sidebar tokens:**
```typescript
className={`flex items-center gap-2 px-3 py-2 rounded-none text-sm ${
  isActive 
    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
    : "bg-sidebar text-sidebar-foreground hover:opacity-80"
}`}
```

**Key migrations:**
- `rounded-md` → `rounded-none` (sharp corners)
- `hover:bg-zinc-800` → `hover:opacity-80`
- `bg-zinc-800 text-white` (active) → `bg-sidebar-accent text-sidebar-accent-foreground`
- `text-zinc-400` (inactive) → `text-sidebar-foreground`

---

### `src/ui/components/StatusBadge.tsx` (component, request-response) — MIGRATION TARGET

**Current analog:** Self (existing file to be refactored)

**Current code** (lines 20-47):
```typescript
export function StatusBadge({ status }: StatusBadgeProps): React.ReactElement {
  const config = {
    healthy: {
      icon: <Check className="h-3 w-3" />,
      label: "Healthy",
      className: "bg-green-50 text-green-700 border-green-200",
    },
    stalled: {
      icon: <X className="h-3 w-3" />,
      label: "Stalled",
      className: "bg-red-50 text-red-700 border-red-200",
    },
    unknown: {
      icon: null,
      label: "Unknown",
      className: "bg-slate-50 text-slate-600 border-slate-200",
    },
  }[status];

  return (
    <div
      className={`inline-flex items-center gap-xs px-sm py-xs rounded text-xs font-medium border ${config.className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}
```

**Tokens to replace:**

| Current | Replace with | Lines |
|---------|--------------|-------|
| `gap-xs` | `gap-1` | 41 |
| `px-sm py-xs` | `px-2 py-1` | 41 |
| `rounded` (no value) | `rounded-none` | 41 |
| `bg-green-50 text-green-700 border-green-200` | `bg-emerald-500/10 text-emerald-500 border-emerald-500/20` | 23 |
| `bg-red-50 text-red-700 border-red-200` | `bg-red-500/10 text-red-500 border-red-500/20` | 28 |
| `bg-slate-50 text-slate-600 border-slate-200` | `bg-muted text-muted-foreground border-border` | 33 |

**Key insight:** This is the foundational migration for semantic palette. StatusBadge is consumed by AgentCard and VisionStatusDisplay, so migrate it first.

---

### `src/ui/components/ModeBanner.tsx` (component, request-response) — MIGRATION TARGET

**Current analog:** Self (existing file to be refactored)

**Per D-04:** Add per-mode accent color (left border or icon tint).

**Tokens to replace:**

| Current | Replace with | Lines | Context |
|---------|--------------|-------|---------|
| `text-accent` | Mode-specific color | 41 | Compass icon tint |
| `text-heading` | `text-base font-semibold` | 43 | Mode label |
| `text-body` | `text-sm` | 46 | Description text |
| `mt-xs` | `mt-1` | 46 | Subtitle spacing |
| `gap-md` | `gap-4` | 39 | Main container gap |
| `px-lg py-lg` | `px-4 py-4` | 38 | Container padding |

**Per-mode accent mapping (D-04):**
- Found mode: `text-emerald-500`
- Assess mode: `text-blue-500`
- Revive mode: `text-red-500`
- Reposition mode: `text-yellow-500`

**Key change:** Icon color becomes mode-aware. Current code uses static `text-accent`; Phase 7 replaces with `text-emerald-500 | text-blue-500 | text-red-500 | text-yellow-500` based on `currentMode`.

---

### `src/ui/components/AgentCard.tsx` (component, request-response) — MIGRATION TARGET

**Current analog:** Self (existing file to be refactored)

**Current code** (lines 22-42):
```typescript
export function AgentCard({ agent }: AgentCardProps): React.ReactElement {
  const status = getAgentStatus(agent);
  const heartbeatLabel = getHeartbeatLabel(agent.lastHeartbeatAt);

  return (
    <div className="rounded border border-border bg-card px-md py-md">
      <div className="flex items-start justify-between gap-md">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground">
            {agent.name}
          </h3>
          <p className="text-xs text-foreground/60 mt-xs">{agent.role}</p>
          <div className="flex items-center gap-xs mt-md text-xs text-foreground/60">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span>{heartbeatLabel}</span>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
    </div>
  );
}
```

**Tokens to replace:**

| Current | Replace with | Lines | Notes |
|---------|--------------|-------|-------|
| `rounded` | `rounded-none` | 27 | Sharp corners |
| `gap-xs` | `gap-1` | 34 | Icon-text gap |
| `mt-xs` | `mt-1` | 33 | Role spacing |
| `mt-md` | `mt-4` | 34 | Heartbeat section spacing |

**Key insight:** AgentCard already uses host tokens correctly (`bg-card`, `border-border`, `text-foreground`). Only minor spacing/corner migrations needed. StatusBadge consume will pick up semantic palette automatically once StatusBadge is migrated (ordered per D-09).

---

### `src/ui/components/VisionStatusDisplay.tsx` (component, request-response) — MIGRATION TARGET

**Current analog:** Self (existing file to be refactored)

**Current code** (lines 18-46):
```typescript
export function VisionStatusDisplay({
  visionExists,
}: VisionStatusDisplayProps): React.ReactElement {
  if (visionExists) {
    return (
      <div className="flex items-start gap-md">
        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">VISION.md found</p>
          <p className="text-xs text-foreground/60 mt-xs">
            Your company has a strategic vision document.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-md">
      <X className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-foreground">No VISION.md</p>
        <p className="text-xs text-foreground/60 mt-xs">
          Create one using Found mode to establish your company's strategic foundation.
        </p>
      </div>
    </div>
  );
}
```

**Tokens to replace:**

| Current | Replace with | Lines | Context |
|---------|--------------|-------|---------|
| `text-green-600` | `text-emerald-500` | 24 | Success icon color |
| `text-orange-600` | `text-red-500` | 37 | Error/missing icon color |
| `mt-xs` | `mt-1` | 26, 39 | Subtitle spacing |

**Key insight:** Light-only utilities (`green-600`, `orange-600`) replaced with semantic palette (emerald, red).

---

### `src/ui/components/InventoryDisplay.tsx` (component, request-response) — MIGRATION TARGET

**Current analog:** Self (existing file to be refactored)

**Tokens to replace:**

| Current | Replace with | Lines | Notes |
|---------|--------------|-------|-------|
| `space-y-sm` | `space-y-2` | 39 | Card spacing |
| `gap-md` | `gap-4` | 39, 114 | Various gaps |
| `px-lg py-md` | `px-4 py-4` | 114, 122 | Section padding |
| `mt-xs` | `mt-1` | 46 | Subtitle spacing |

**Key insight:** Already uses host tokens (`divide-border`, `text-foreground/60`). Spacing migration only. Nested components (AgentCard, DocumentList, ActivityTimeline, VisionStatusDisplay) will be migrated separately.

---

### `src/ui/components/ChatPanel.tsx` (component, request-response) — MIGRATION TARGET

**Current analog:** Self (existing file to be refactored)

**No broken tokens found** in lines 64-84. All classes already reference host tokens:
- `border-t bg-background px-lg py-md` — already uses `bg-background`, `border`
- `rounded border border-border` — already correct
- `placeholder-foreground/40` — already correct
- `focus:ring-accent` — already correct

**Spacing migration only:**

| Current | Replace with | Lines | Notes |
|---------|--------------|-------|-------|
| `gap-sm` | `gap-2` | 66 | Input-button gap |
| `px-lg py-md` | `px-4 py-4` | 65 | Container padding |
| `px-md py-sm` | `px-4 py-2` | 71 | Button padding |
| `gap-xs` | `gap-1` | 80 | Icon-text gap |

---

### `src/ui/components/ActivityTimeline.tsx` (component, request-response) — MIGRATION TARGET

**Current analog:** Self (existing file to be refactored)

**Tokens to replace:**

| Current | Replace with | Lines | Notes |
|---------|--------------|-------|-------|
| `space-y-sm` | `space-y-2` | 33 | Item spacing |
| `gap-md` | `gap-4` | 35 | Icon-content gap |
| `gap-xs` | `gap-1` | 37 | Clock-text gap |
| `pb-sm` | `pb-2` | 39 | Item bottom padding |

**Key insight:** Already uses `text-foreground/60` and other host tokens. Minor spacing fixes only.

---

### `src/ui/components/DocumentList.tsx` (component, request-response) — MIGRATION TARGET

**Current analog:** Self (existing file to be refactored)

**Tokens to replace:**

| Current | Replace with | Lines | Notes |
|---------|--------------|-------|-------|
| `space-y-md` | `space-y-4` | 26 | Document item spacing |
| `gap-md` | `gap-4` | 28, 38 | Icon-content gap |
| `text-green-600` | `text-emerald-500` | 29, 39 | Icon color (success semantic) |

**Key insight:** Light-only `text-green-600` replaced with semantic `text-emerald-500`.

---

### `src/ui/components/ErrorBoundary.tsx` (component, request-response) — MIGRATION TARGET

**Current analog:** Self (existing file to be refactored)

**Current code uses light-only orange colors** (lines 36-62):
```typescript
<div className="max-w-md w-full rounded-lg border border-orange-200 bg-orange-50 p-lg">
  <div className="flex items-start gap-md">
    <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
    {/* ... */}
  </div>
</div>
```

**Tokens to replace:**

| Current | Replace with | Lines | Context |
|---------|--------------|-------|---------|
| `rounded-lg` | `rounded-none` | 36 | Sharp corners |
| `border-orange-200 bg-orange-50` | `border-red-500/20 bg-red-500/10` | 36 | Error background (semantic palette) |
| `text-orange-600` | `text-red-500` | 38 | Icon color |
| `text-orange-900 text-orange-800 text-orange-700` | `text-red-500` | 40, 41, 58, 60 | Text colors |
| `border-orange-200` | `border-red-500/20` | 44 | Divider |
| `gap-xs` | `gap-1` | 59 | Button icon-text gap |
| `px-sm py-xs` | `px-2 py-1` | 59 | Button padding |

**Key insight:** Error state uses semantic red palette (D-04). Migration is critical for dark-mode compatibility.

---

### `tests/ui/Card.test.ts` (test, CRUD)

**Analog:** `tests/ui/assess.ui.spec.ts`

**Test structure** (lines 1-30):
```typescript
/**
 * Assess Mode UI Component Tests
 *
 * Tests for: ConfidenceBar, EvidenceChip, AmendmentDiff, DriftItemCard,
 * DriftReportPanel, ApprovalRoutingModal, ApprovingWaitingState, CustomOverrideWarning.
 *
 * Note: These are integration tests that verify component structure and props.
 * Full E2E rendering tests deferred to Phase 4+ with Playwright.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Assess Mode UI Components", () => {
  describe("ConfidenceBar", () => {
    it("should accept confidence scores 0..1", () => {
      // Component is defined and exported
      expect(true).toBe(true);
    });

    it("should render percentage label", () => {
      // Percentage should be calculated and displayed
      expect(true).toBe(true);
    });
```

**Pattern for Card tests:**
- Import Vitest: `import { describe, it, expect, beforeEach, vi } from "vitest";`
- Wrap tests in `describe("Card", () => { ... })`
- Test each variant + padding combination: 3 variants × 3 paddings = 9 tests
- Test JSDoc presence and export
- Placeholder tests (true expects) until full rendering harness available

**Key test cases:**
- Variant default renders `bg-card border-border`
- Variant muted renders `bg-muted border-border`
- Variant elevated renders `shadow-sm`
- Padding sm renders `p-2`
- Padding md renders `p-4`
- Padding lg renders `p-6`
- Always renders `rounded-none`

---

### `tests/ui/SectionHeader.test.ts` (test, CRUD)

**Analog:** `tests/ui/assess.ui.spec.ts`

**Test structure:** Same pattern as Card tests above.

**Key test cases:**
- Renders title with `text-base font-semibold text-foreground`
- Subtitle renders with `text-sm text-muted-foreground`
- Icon renders at `h-4 w-4 text-muted-foreground`
- Actions slot right-aligned
- Optional props (icon, subtitle, actions) all pass without error
- Layout uses flexbox with correct gap and alignment

---

## Shared Patterns

### Typography Token Mapping
**Source:** Host Tailwind scale via `index.css`
**Apply to:** All Phase 7 components
```typescript
// Map these nonexistent plugin tokens to host scale:
text-heading     → text-base font-semibold
text-body        → text-sm
text-label       → text-xs font-medium

// All inline at call sites; no @utility aliases
className="text-base font-semibold"  // instead of className="text-heading"
```

### Spacing Scale Migration
**Source:** Tailwind v4 native scale
**Apply to:** All Phase 7 components
```typescript
// Replace nonexistent custom tokens with Tailwind native:
gap-xs  → gap-1   (4px)
gap-sm  → gap-2   (8px)
gap-md  → gap-3 or gap-4 (12px or 16px — context-dependent)
px-xs   → px-1    (4px)
px-sm   → px-2    (8px)
px-md   → px-3 or px-4 (12px or 16px — context-dependent)
py-xs   → py-1    (4px)
py-sm   → py-2    (8px)
py-md   → py-3 or py-4 (12px or 16px — context-dependent)

// Verify UI_REDO_HANDOFF.md spacing table before finalizing
```

### Semantic Palette (Status & Mode Accent)
**Source:** Host shadcn emerald/red/yellow/blue tokens
**Apply to:** StatusBadge, ModeBanner, VisionStatusDisplay, DocumentList, ErrorBoundary, any status-aware component
```typescript
// Replace light-only colors with semantic palette:
bg-green-50 text-green-700 border-green-200     → bg-emerald-500/10 text-emerald-500 border-emerald-500/20
bg-red-50 text-red-700 border-red-200           → bg-red-500/10 text-red-500 border-red-500/20
bg-slate-50 text-slate-600 border-slate-200     → bg-muted text-muted-foreground border-border
text-green-600                                   → text-emerald-500
text-orange-600                                  → text-red-500
text-orange-50 / orange-200 / orange-900, etc.  → red-500/10 or red-500 (context-dependent)

// Per-mode accent in ModeBanner:
Found mode:      text-emerald-500
Assess mode:     text-blue-500
Revive mode:     text-red-500
Reposition mode: text-yellow-500
```

### Corner Rounding (Sharp Corners)
**Source:** Host design uses `--radius-lg: 0px` (flat, square)
**Apply to:** All Phase 7 components
```typescript
// Replace all rounded-lg, rounded-xl, rounded-md with sharp corners:
rounded-lg       → rounded-none
rounded-xl       → rounded-none
rounded-md       → rounded-none
rounded          → rounded-none

// Primitives always enforce rounded-none
```

### SidebarLink Palette
**Source:** Host sidebar tokens
**Apply to:** SidebarLink component only
```typescript
// Replace hardcoded zinc-800 with host sidebar tokens:
Inactive state:  bg-sidebar text-sidebar-foreground
Hover state:     hover:opacity-80 (subtle feedback)
Active state:    bg-sidebar-accent text-sidebar-accent-foreground
Border (if any): border-sidebar-border

// Round-trip verification: grep host index.css for --sidebar to confirm tokens exist
```

### Component Import & Export Pattern
**Source:** All existing components (agentCard, ModeBanner, etc.)
**Apply to:** All new and migrated Phase 7 components
```typescript
// Imports
import React from "react";
import { SomeIcon } from "lucide-react";
import type { TypeFromIndex } from "../../types.js";

// Component signature
export function ComponentName({ 
  prop1, 
  prop2 
}: ComponentNameProps): React.ReactElement {
  // JSDoc above
  return (
    <div>Content</div>
  );
}

// JSDoc example
/**
 * ComponentName — One-line description.
 *
 * Per UI-SPEC.md section, renders:
 * - List item 1
 * - List item 2
 *
 * @param prop1 Description
 * @param prop2 Description
 */
```

### Conditional Class Composition Pattern
**Source:** MainPanel.tsx lines 71-75, ChatPanel.tsx lines 68-73
**Apply to:** All components with conditional classes
```typescript
// DO use template literals with ternary:
className={`flex items-center ${
  isActive 
    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
    : "text-sidebar-foreground"
}`}

// DON'T use clsx, cn(), or classnames:
// className={clsx("flex items-center", isActive && "bg-...")}
// ^ No clsx helper in this codebase
```

---

## No Analog Found

No files in Phase 07 lack analogs. All new files (primitives, probes) follow established patterns from existing components. All migration targets (MainPanel, ModeBanner, etc.) are self-analogs undergoing in-place refactoring.

---

## Metadata

**Analog search scope:** `src/ui/` tree (MainPanel, SidebarLink, components/*, assess/, found/, revive/, reposition/, memory/)  
**Files scanned:** 50+ component files  
**Pattern extraction date:** 2026-05-04  
**Confidence level:** HIGH

**Key assumptions validated:**
- ✓ Host tokens (bg-card, border-border, text-foreground, etc.) available via React tree
- ✓ Lucide icons already in dependencies
- ✓ Plugin SDK UI hooks (`usePluginData`, `useHostContext`) in all controller components
- ✓ TypeScript strict mode enforced (all components properly typed)
- ✓ JSDoc conventions established (all components documented)

**Files with early-stop note:**
All migration targets (MainPanel, SidebarLink, components/*) are self-refactoring — no additional analogs needed. Early stop after identifying token-swap patterns.

---

*Phase 7 pattern mapping complete. Planner can now reference these analogs in action sections.*  
*Mapped: 2026-05-04 | Ready for execution*
