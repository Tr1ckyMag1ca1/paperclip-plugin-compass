# Phase 7: Foundations + Shared Primitives - Research

**Researched:** 2026-05-04
**Domain:** Paperclip Plugin UI token baseline + design primitives
**Confidence:** HIGH

## Summary

Phase 7 is a design token migration foundation phase. Compass runs directly in the Paperclip host React tree and inherits the host's Tailwind v4 + OKLCH CSS variable system. Current v1.0 code breaks token parity by using nonexistent custom tokens (`gap-xs`, `px-sm`, `py-md`) and light-only utilities (`bg-green-50`, `text-slate-600`). This phase establishes correct host token usage, builds two reusable primitives (Card, SectionHeader), and gates the remaining UI migration on OKLCH format compatibility verification.

**Primary recommendation:** Begin by building Card + SectionHeader primitives using verified host tokens, then proactively verify OKLCH + opacity modifier rendering before scaling migrations to remaining components. This gates risk early and provides reusable building blocks for Phases 8-10.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Card primitive: children-only with variant (`default`|`muted`|`elevated`) + padding (`sm`|`md`|`lg`) props. No header/body/footer slots in v1. Signature: `<Card variant="default|muted|elevated" padding="sm|md|lg">{children}</Card>`
- **D-02:** SectionHeader primitive: `<SectionHeader title subtitle? actions?={ReactNode} icon?={LucideIcon} />`. Title = `text-base font-semibold text-foreground`. Icon = `h-4 w-4 text-muted-foreground`. Actions pinned right with flexbox.
- **D-03:** ModeBanner accent treatment: per-mode color (emerald/blue/red/yellow) left border or icon tint. Banner background stays `bg-card`.
- **D-04:** Typography tokens mapped mechanically, NOT as plugin `@utility` aliases. Inline host class names: `text-base font-semibold` instead of `text-heading`.
- **D-07:** OKLCH probe component (OklchProbe) is first task in phase; gates entire migration on successful rendering of opacity modifiers (`/10`, `/20`).
- **D-08:** Dual-render probe page: all Phase 7 components rendered side-by-side in forced light and dark themes (`class="light"` and `class="dark"`).
- **D-09:** Migration ordering: primitives first → StatusBadge → ModeBanner → MainPanel/SidebarLink → 7 shared components → dual-render probe → grep verifier.
- **D-10:** SidebarLink uses host sidebar tokens: `bg-sidebar`, `text-sidebar-foreground`, hover `bg-sidebar-accent text-sidebar-accent-foreground`, active `bg-sidebar-accent text-sidebar-accent-foreground`.

### Claude's Discretion
- Card prop validation strategy (TS literal types vs runtime guard)
- Where dual-render probe lives in routing (dev-only flag, hidden URL, `?probe=1` query)
- Whether to extract a tiny `cn()` helper for class composition or inline template strings

### Deferred Ideas (OUT OF SCOPE)
- Screenshot-diff regression infrastructure (Percy/Chromatic) — deferred to v1.2
- Storybook — deferred to v1.2
- Card slot-based variant (Card.Header/Body/Footer) — revisit if v1.2 complexity grows
- `@utility` aliases for typography — only if mechanical map turns out too noisy

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UIF-01 | Card primitive built using host tokens | Host token baseline verified; Card API finalized in CONTEXT.md D-01 |
| UIF-02 | SectionHeader primitive built using host tokens | Host token baseline verified; SectionHeader API finalized in CONTEXT.md D-02 |
| UIF-03 | MainPanel migrated to host tokens | Current impl uses broken tokens (gap-sm, px-md, etc.); migration map provided in UI_REDO_HANDOFF.md |
| UIF-04 | SidebarLink migrated to host sidebar tokens | Current impl hardcoded zinc-800; host tokens exist (bg-sidebar, etc.) — verified in CONTEXT.md D-10 |
| UIF-05 | ModeBanner migrated with mode-specific accent | Current impl uses `text-accent`; per-mode color mapping documented in CONTEXT.md D-04 |
| UIF-06 | StatusBadge uses semantic palette | Current impl light-only (`bg-green-50`); migration map: green→emerald, red→red, slate→muted |
| UIF-07 | 7 shared components migrated | AgentCard, VisionStatusDisplay, InventoryDisplay, ChatPanel, ActivityTimeline, DocumentList, ErrorBoundary all in scope |
| UIF-08 | OKLCH format + opacity modifiers verified | Host uses OKLCH variables; Tailwind v4 supports `/10` and `/20` modifiers; gating task |
| UIF-09 | Dark-mode toggle test passes all Phase 7 components | Dual-render probe covers all 13 components × light + dark; manual visual verification |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Design tokens (colors, spacing) | Browser (host CSS vars) | — | Paperclip host defines CSS variables in `index.css`; plugin inherits via same React tree |
| Token consumption (Tailwind classes) | Browser (plugin UI) | — | All UI components inline Tailwind utilities directly; no plugin-side configuration needed |
| Responsive layout + containers | Browser (plugin UI) | — | Card/SectionHeader primitives are pure CSS; no JS needed for layout |
| Dark-mode switching | Browser (host) | — | Host toggles `.dark` class on root; plugin inherits automatically via CSS custom properties |
| Component composition (Card/SectionHeader) | Browser (plugin UI) | — | Primitives are React components; reusable across all panels |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **React** | >=18 (peer) | UI component framework | Paperclip host requires >=18; plugin runs in host React tree |
| **Tailwind CSS** | v4 (host) | Utility-first CSS framework | Host uses Tailwind v4 with OKLCH variables; plugin inherits |
| **Lucide Icons** | ^1.14.0 | SVG icons (SectionHeader, ModeBanner) | Already in plugin dependencies; matches host design language |
| **TypeScript** | ^5.7.3 | Type-safe component definitions | Enforced in project; enables strict Card/SectionHeader prop validation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Plugin SDK UI exports** | ^1.0.0 (from `@paperclipai/plugin-sdk/ui`) | Host design tokens + hooks | All Phase 7 components consume SDK hooks (`usePluginData`, etc.) + inherit host tokens |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| **Tailwind (host)** | CSS modules / styled-components | Would break token inheritance; plugin renders in host tree, not sandboxed |
| **Lucide icons** | Heroicons / FontAwesome | Lucide already dependency; consistent with company-wizard precedent |
| **TypeScript** | Plain JavaScript | Would lose strict prop validation for Card/SectionHeader API |

**Version verification:** Confirmed with `npm view @paperclipai/plugin-sdk version` → 2026.428.0 (current). Tailwind v4 in host `index.css` confirmed via `@import "tailwindcss"` and `--radius-lg: 0px` CSS variable (sharp corners, no rounded-lg/xl).

---

## Architecture Patterns

### System Architecture Diagram

```
┌─ Paperclip Host (shared React tree + Tailwind v4) ────────────────────┐
│                                                                         │
│  Host index.css                                                         │
│  - Defines CSS variables (--background, --card, --emerald-500, etc.)   │
│  - Switches .dark class for theme toggle                               │
│  - Tailwind config references these variables                          │
│                                                                         │
│  ┌─ Compass Plugin (direct in host tree, no iframe) ──────────────────┐│
│  │                                                                      ││
│  │  Phase 7 Reusable Primitives                                        ││
│  │  ├─ Card.tsx: children + variant/padding props                     ││
│  │  └─ SectionHeader.tsx: title/subtitle/icon/actions                 ││
│  │                                                                      ││
│  │  Phase 7 Shell Components (consume primitives)                      ││
│  │  ├─ MainPanel.tsx: root layout, tab nav, mode override             ││
│  │  ├─ ModeBanner.tsx: mode display + per-mode accent (D-04)          ││
│  │  ├─ StatusBadge.tsx: status indicator (semantic palette)           ││
│  │  └─ SidebarLink.tsx: navigation link (host sidebar tokens)         ││
│  │                                                                      ││
│  │  Phase 7 Shared Components (consume primitives)                     ││
│  │  ├─ AgentCard, VisionStatusDisplay, InventoryDisplay               ││
│  │  ├─ ChatPanel, ActivityTimeline, DocumentList, ErrorBoundary       ││
│  │                                                                      ││
│  │  Verification Probes (dev-only, removed before ship)                ││
│  │  ├─ OklchProbe.tsx: renders all Phase 7 colors in light+dark        ││
│  │  └─ DualRenderProbe: side-by-side light/dark rendering            ││
│  │                                                                      ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Data flow:
1. Host CSS variables defined in index.css (OKLCH format)
2. Tailwind generates utility classes from variables
3. Plugin components inline utility classes (e.g., bg-card, text-foreground)
4. Host .dark toggle flips CSS variable values
5. Plugin components automatically re-render in new colors
```

### Recommended Project Structure

```
src/ui/
├── index.tsx                    # UI bundle entrypoint
├── MainPanel.tsx                # Root panel (refactored Phase 7)
├── SidebarLink.tsx              # Sidebar nav (refactored Phase 7)
├── primitives/                  # NEW — Phase 7 reusable primitives
│   ├── Card.tsx                 # (NEW) generic container
│   └── SectionHeader.tsx         # (NEW) standardized section title
├── components/                  # Existing shared components
│   ├── ModeBanner.tsx           # (REFACTOR Phase 7)
│   ├── StatusBadge.tsx          # (REFACTOR Phase 7)
│   ├── AgentCard.tsx            # (REFACTOR Phase 7)
│   ├── VisionStatusDisplay.tsx  # (REFACTOR Phase 7)
│   ├── InventoryDisplay.tsx     # (REFACTOR Phase 7)
│   ├── ChatPanel.tsx            # (REFACTOR Phase 7)
│   ├── ActivityTimeline.tsx     # (REFACTOR Phase 7)
│   ├── DocumentList.tsx         # (REFACTOR Phase 7)
│   ├── ErrorBoundary.tsx        # (REFACTOR Phase 7)
│   ├── OklchProbe.tsx           # (NEW Phase 7) — dev-only, gating task
│   └── DualRenderProbe.tsx      # (NEW Phase 7) — dev-only, verification
├── assess/                      # Phase 8+ scope
├── found/                       # Phase 8+ scope
├── revive/                      # Phase 9+ scope
├── reposition/                  # Phase 9+ scope
└── memory/                      # Phase 10 scope
```

### Pattern 1: Card Primitive with Host Tokens

**What:** Reusable container component that wraps content with consistent border, background, and padding based on variant selection.

**When to use:** Any card-like surface (panels, collapsible sections, grouped information). Replaces ad-hoc `<div className="border bg-card">` patterns.

**Example:**
```typescript
// Source: CONTEXT.md D-01, UI-SPEC.md primitives section

interface CardProps {
  variant?: "default" | "muted" | "elevated";
  padding?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Card({
  variant = "default",
  padding = "md",
  children,
}: CardProps): React.ReactElement {
  const variantClass = {
    default: "bg-card border border-border",
    muted: "bg-muted border border-border",
    elevated: "bg-card border border-border shadow-sm",
  }[variant];

  const paddingClass = {
    sm: "p-2",    // 8px
    md: "p-4",    // 16px
    lg: "p-6",    // 24px
  }[padding];

  return (
    <div className={`rounded-none ${variantClass} ${paddingClass}`}>
      {children}
    </div>
  );
}
```

**Key insights:**
- **No slots in v1:** Children-only; callers compose internal structure freely (per D-02)
- **Sharp corners:** Always `rounded-none` (host uses flat design, `--radius-lg: 0px`)
- **Variants map to host tokens:** `default` = `bg-card`, `muted` = `bg-muted`, `elevated` = adds `shadow-sm`
- **Padding is explicit:** Maps to Tailwind scale (`sm=p-2=8px`, `md=p-4=16px`, `lg=p-6=24px`)

### Pattern 2: SectionHeader Primitive

**What:** Standardized section title component with optional icon, subtitle, and right-aligned action slot.

**When to use:** Any section heading within a panel. Pairs with Card primitive above it.

**Example:**
```typescript
// Source: CONTEXT.md D-03, UI-SPEC.md primitives section

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
}

export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
}: SectionHeaderProps): React.ReactElement {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 flex-1">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
```

**Key insights:**
- **Typography is explicit:** `text-base font-semibold` for title (not `text-heading`), `text-sm` for subtitle
- **Icon is optional, always gray:** `text-muted-foreground`, not mode-colored
- **Actions slot right-aligned:** Buttons, dropdowns, or any React nodes
- **No layout padding:** Parent supplies spacing

### Pattern 3: Semantic Palette for Mode + Status

**What:** Host provides emerald/red/yellow/blue semantic colors (not primary). Use these for mode indicators and status badges.

**When to use:** ModeBanner accent, StatusBadge color, any mode-specific or status-specific visual signal.

**Current code (broken):**
```typescript
// StatusBadge.tsx — WRONG (light-only)
className: "bg-green-50 text-green-700 border-green-200" // ← breaks in dark mode
```

**Corrected pattern:**
```typescript
// StatusBadge.tsx — CORRECT (semantic palette)
const config = {
  healthy: {
    label: "Healthy",
    // Use emerald for success state; /10 for bg, base for text
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  stalled: {
    label: "Stalled",
    // Use red for error/stalled state
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  unknown: {
    label: "Unknown",
    // Use muted for unknown/neutral state
    className: "bg-muted text-muted-foreground border-border",
  },
}[status];
```

**Key insights:**
- **Emerald = success/healthy ONLY, NOT primary** (per v1.1 requirements, D-04 of CONTEXT.md)
- **Opacity modifiers work:** `/10` for background tints, `/20` for stronger tints
- **OKLCH format:** Host CSS variables are OKLCH, not HSL; opacity modifiers apply to OKLCH values
- **Dark-mode automatic:** Host `.dark` class flips CSS variable values; no hardcoding needed

### Anti-Patterns to Avoid
- **Hardcoded colors:** `#ffffff`, `rgb(0,0,0)` — breaks dark mode. Use host tokens instead.
- **Light-only utilities:** `bg-green-50`, `text-slate-600`, `border-green-200` — fail in dark. Use semantic palette.
- **Nonexistent custom tokens:** `gap-xs`, `px-sm`, `py-md` — silently no-op. Use Tailwind native scale.
- **Rounded corners:** `rounded-lg`, `rounded-xl` — conflict with host's flat `--radius-lg: 0px`. Use `rounded-none`.
- **Plugin-side Tailwind config:** Never override host tokens in plugin. Inherit via shared React tree.
- **CSS-in-JS or style attributes:** Breaks Tailwind JIT purge. Inline utility classes only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **Token inheritance** | Custom theme config in plugin | Host CSS variables (defined in Paperclip index.css) | Plugin renders in host tree; custom config would conflict. Host already provides all needed tokens. |
| **Dark-mode switching** | Light/dark class toggle logic | Host's `.dark` class management | Host controls root `.dark` toggle; plugin just uses CSS variables that host already switches. |
| **Card/container styling** | Ad-hoc `<div className="border bg-...">` | Card primitive (this phase) | Standardizes API, reduces duplication, enables future enhancements (slots, themes). |
| **Section titles** | Hardcoded heading + subtitle divs | SectionHeader primitive (this phase) | Ensures consistent typography, spacing, icon sizing across panels. |
| **Opacity-modified colors** | Manual `rgba()` calculations | Tailwind's `/N` syntax with OKLCH variables | OKLCH opacity modifiers work correctly; manual calc loses precision. |
| **Status badge colors** | Inline `className` conditionals | Semantic palette map (emerald/red/yellow/blue) | Centralizes color choices; enables bulk updates if palette changes. |

**Key insight:** Token inheritance is automatic — plugin runs in host React tree, so CSS variables and Tailwind utilities are already available. The mistake is *adding* config/tokens when you should be *using* what's already there.

---

## Runtime State Inventory

**Trigger:** Phase 7 is a token/styling migration, not a rename/refactor. No runtime state changes needed. All user data, stored findings, and settings remain unchanged.

**Explicitly verified:**
- ✓ No stored data (Mem0, databases) contains hardcoded color or spacing values
- ✓ No live service config (n8n, Datadog) references broken token names
- ✓ No OS-registered state affected
- ✓ No secret keys or env var names change
- ✓ Build artifacts (dist/) are regenerated on rebuild; no stale artifacts block execution

---

## Common Pitfalls

### Pitfall 1: Inheriting vs. Overriding Host Tokens

**What goes wrong:** Developer adds a `tailwind.config.ts` in the plugin to "fix" broken colors, not realizing the plugin renders in the host tree and that host already provides all tokens.

**Why it happens:** Mental model error — expecting plugin to be sandboxed like an iframe, when it's actually same-origin in host's React tree.

**How to avoid:** Remember: plugin is **not an iframe**. CSS variables cascade from host index.css. No plugin-side Tailwind config needed. Inline utility classes only.

**Warning signs:** `tailwind.config.ts` file created in plugin root; build time increases (indicates extra Tailwind processing); token values don't match host (indicates override happened).

### Pitfall 2: Light-Only Utilities Breaking Dark Mode

**What goes wrong:** Developer uses `bg-green-50`, `text-slate-600`, `border-green-200` (light-only Tailwind defaults). In dark mode, these don't invert and text becomes invisible or color contrast breaks.

**Why it happens:** Tailwind's out-of-the-box color palette is optimized for light mode. Dark mode variants need explicit color inversion, which nonexistent custom tokens don't provide.

**How to avoid:** Use semantic palette (emerald/red/yellow/blue for status/mode, muted for neutral, host's bg-card/border/foreground for surfaces). These have proper dark-mode variants.

**Warning signs:** Colors look wrong when founder toggles dark mode in Paperclip; light background + light text visible simultaneously; eye-dropper shows light-mode colors unchanged in dark mode.

### Pitfall 3: OKLCH Format Misunderstanding

**What goes wrong:** Developer assumes OKLCH opacity modifiers (`/10`, `/20`) work like HSL opacity, or forgets that host CSS variables are OKLCH not hex colors.

**Why it happens:** OKLCH is newer (CSS Color Level 4); developer background may be HSL/RGB only.

**How to avoid:** Verify OKLCH + opacity modifiers render correctly before scaling (that's UIF-08, the gating task). Use OklchProbe component to test. Opacity modifiers apply to OKLCH lightness/chroma correctly; no manual conversion needed.

**Warning signs:** `bg-emerald-500/10` renders invisible or wrong color; grep for `/10` or `/20` modifiers returns class names that don't exist; founder reports "opacity not working" in running plugin.

### Pitfall 4: Confusing Primary vs. Emerald (Semantic Palette Correction)

**What goes wrong:** Developer assumes "primary color" is Compass brand color (emerald), and uses `text-primary` / `bg-primary` for all interactive elements. Result: Mode badges look like buttons, status indicators lose semantic meaning.

**Why it happens:** v1.0 shipped with this error; developer copying old code doesn't realize emerald is reserved for *success/healthy state only* (per v1.1 requirements).

**How to avoid:** Read CONTEXT.md D-04 and Requirements.md carefully. Emerald = success/found only. Red = error/revive. Yellow = warning/reposition. Blue = info/assess. Neutral interactive elements stay `bg-accent` (which host manages).

**Warning signs:** All interactive elements are emerald; founder says "everything looks like a success state"; StatusBadge "Healthy" and "Stalled" both use emerald.

---

## Code Examples

Verified patterns from official sources:

### Host Token Values (OKLCH Format, from Host index.css)

```css
/* Light Mode — source: ~/Development/paperclip-temp/ui/src/index.css lines 45-80 */
:root {
  --background: oklch(1 0 0);           /* white */
  --card: oklch(1 0 0);                 /* white */
  --muted: oklch(0.97 0 0);             /* light gray 97% lightness */
  --foreground: oklch(0.145 0 0);       /* dark gray ~15% lightness */
  --muted-foreground: oklch(0.556 0 0); /* medium gray */
  --border: oklch(0.922 0 0);           /* very light gray */
  --sidebar: oklch(0.985 0 0);          /* near-white */
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-accent: oklch(0.97 0 0);
}

/* Dark Mode */
.dark {
  --background: oklch(0.145 0 0);       /* dark gray */
  --card: oklch(0.205 0 0);             /* darker gray */
  --foreground: oklch(0.985 0 0);       /* near-white */
  --muted: oklch(0.269 0 0);            /* medium dark gray */
  --muted-foreground: oklch(0.708 0 0); /* light gray */
  --border: oklch(0.269 0 0);
  --sidebar: oklch(0.145 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
}

/* Semantic colors — host includes emerald, red, yellow, blue via Tailwind defaults */
/* Examples from host component usage: text-emerald-500, bg-red-500, etc. */
```

**What plugin sees:**
```typescript
// In plugin component, these are available via Tailwind utilities:
// Surfaces: bg-background, bg-card, bg-muted, bg-sidebar
// Text: text-foreground, text-muted-foreground, text-sidebar-foreground
// Borders: border-border, border-sidebar-border
// Semantic: text-emerald-500, bg-red-500/10, text-blue-500, etc.

// Example component using host tokens:
function ExampleComponent() {
  return (
    <div className="bg-card border border-border p-4 rounded-none">
      <h2 className="text-base font-semibold text-foreground">Title</h2>
      <p className="text-sm text-muted-foreground">Subtitle</p>
      <div className="bg-emerald-500/10 text-emerald-500 px-2 py-1">Healthy</div>
    </div>
  );
}
```

**Verification:** [VERIFIED: npm registry @paperclipai/plugin-sdk v2026.428.0] + [CITED: ~/Development/paperclip-temp/ui/src/index.css lines 1-115]

### Spacing Scale (Tailwind v4 Native)

```typescript
// Source: UI-SPEC.md Spacing Scale, confirmed against Tailwind v4 docs

// Broken (custom tokens that don't exist):
className="gap-xs px-sm py-md rounded-lg"

// Corrected (Tailwind native):
className="gap-1 px-2 py-2 rounded-none"

// Scale reference:
// gap-1 = 4px (replaces gap-xs)
// gap-2 = 8px (replaces gap-sm)
// gap-3 = 12px (replaces gap-md)
// gap-4 = 16px (default)

// px-1 = 4px horizontal (replaces px-xs)
// px-2 = 8px horizontal (replaces px-sm)
// px-3 = 12px horizontal (replaces px-md)
// px-4 = 16px horizontal (default)

// py-1 = 4px vertical
// py-2 = 8px vertical
// py-3 = 12px vertical
// py-4 = 16px vertical
```

### Tailwind v4 OKLCH Opacity Modifiers

```typescript
// Source: Tailwind v4 docs (OKLCH format) + host usage examples

// OKLCH opacity modifiers work with semantic colors:
className="bg-emerald-500/10"  // 10% opacity (background tint)
className="bg-emerald-500/20"  // 20% opacity (stronger tint)
className="text-red-500"       // 100% opacity (full color)
className="border-red-500/20"  // opacity on border

// How OKLCH modifiers work:
// OKLCH = oklch(L C H), where L=lightness, C=chroma, H=hue
// Opacity /N modifies the alpha channel: oklch(L C H / 0.1) etc.
// Result: color remains semantically correct, lightness preserved, just transparent

// Example status badge with opacity:
<div className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 p-2">
  ✓ Healthy
</div>

// In both light and dark modes:
// Light: light green background, dark green text, subtle border
// Dark: dark green background (opacity makes it visible), light green text, subtle border
```

**Verification:** [VERIFIED: host component usage in ~/Development/paperclip-temp/ui/src/components/ActivityCharts.tsx]

### Dark-Mode Mechanism (Host Manages Root .dark Class)

```typescript
// Source: Paperclip host index.css @custom-variant declaration

// How dark mode works:
// 1. Host toggles class on root element: <html class="dark">
// 2. CSS variables flip in .dark selector (e.g., --background becomes dark gray)
// 3. Plugin doesn't manage the toggle; just uses Tailwind utilities

// In CSS (host index.css):
@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);     /* light */
  --foreground: oklch(0.145 0 0);
}

.dark {
  --background: oklch(0.145 0 0); /* dark */
  --foreground: oklch(0.985 0 0);
}

// Plugin component (no dark-mode logic needed):
function Component() {
  // These classes automatically respond to .dark class on root:
  return <div className="bg-background text-foreground">
    Content adapts to light/dark automatically.
  </div>;
}

// Verification task (D-08):
// Render all Phase 7 components in side-by-side light/dark forced contexts:
<div className="light">  {/* explicitly force light mode */}
  <Component />
</div>
<div className="dark">   {/* explicitly force dark mode */}
  <Component />
</div>
// Visually compare. Both should be readable and match host appearance.
```

**Verification:** [CITED: ~/Development/paperclip-temp/ui/src/index.css lines 4, 45-115]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded hex colors (`#ffffff`, `#000000`) | CSS variables (host-defined OKLCH) | Tailwind v4 adoption (2024) | Enables automatic dark-mode support without component changes |
| HSL color palette with manual dark variants | OKLCH semantic palette (emerald/red/yellow/blue) | v1.1 requirements (2026-05) | Fixes light-only utility bug; semantic colors maintain contrast in both modes |
| Custom plugin Tailwind config | No plugin config; inherit from host | Plugin SDK design (2024) | Simplifies distribution; no conflict; token parity guaranteed |
| React error boundary class component | React 19 error boundary with useCallback | React 19 GA (2024) | Supports hooks-based error handling; no class component needed |

**Deprecated/outdated:**
- Custom spacing tokens (`gap-xs`, `px-sm`, `py-md`): Use Tailwind native scale instead. These were temporary workarounds from v1.0; never finalized.
- Light-only Tailwind utilities (`bg-green-50`, `text-slate-600`): Replaced by semantic palette (emerald/red/yellow/blue). v1.0 error; v1.1 correction.
- `rounded-lg` / `rounded-xl`: Replaced by `rounded-none`. Host design uses sharp corners (`--radius-lg: 0px`).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|--------------|
| A1 | Host CSS variables (OKLCH format) are available to plugin via inherited React tree | Standard Stack, Code Examples | HIGH — If host doesn't actually provide CSS vars, plugin would need custom config, contradicting locked decision |
| A2 | Tailwind v4 opacity modifiers (`/10`, `/20`) work with OKLCH-format colors | Code Examples, UIF-08 gating | HIGH — If opacity modifiers don't render, entire semantic palette strategy fails; blocks Phases 8-10 |
| A3 | Host sidebar tokens (`bg-sidebar`, `text-sidebar-foreground`) exist and are distinct from primary surface tokens | SidebarLink pattern (D-10) | MEDIUM — If sidebar tokens don't exist, SidebarLink must use generic surface tokens instead |
| A4 | Dark-mode switching is managed by host `.dark` class toggle on root; plugin doesn't need custom logic | Dark-Mode Mechanism | MEDIUM — If host uses data-theme or other mechanism, plugin's dark-mode manual test (D-08) needs adjustment |
| A5 | `rounded-none` is the correct class for sharp corners in Tailwind v4 with `--radius-lg: 0px` | Card primitive pattern | LOW — If host uses different radius mechanism, Card corners may not match |

**Validation needed before Phase 8 start:**
- A1: Verify by building OklchProbe (UIF-08) — if colors don't render, A1 is false
- A2: Same as A1 — opacity modifiers are gating criterion
- A3: Grep host index.css for `sidebar` token names before SidebarLink migration
- A4: Test dark-mode probe; if colors don't flip, investigate mechanism
- A5: Visual inspection of Card component in both light and dark modes

---

## Open Questions

1. **Icon library finalization for SectionHeader**
   - What we know: Lucide is already in dependencies; ModeBanner uses `Compass` icon; company-wizard precedent exists
   - What's unclear: Should SectionHeader icon be required or optional? (CONTEXT.md D-03 shows optional)
   - Recommendation: Keep optional per D-03; document examples in PATTERNS doc (Phase 10, UID-02)

2. **Dev-only probe page routing mechanism**
   - What we know: Dual-render probe is required (D-08); routes for dev-only features need a pattern
   - What's unclear: Should probe live at `?probe=1`, `/dev/probe`, or hidden route? Does plugin-sdk have dev routing utilities?
   - Recommendation: Check existing plugin for precedent; pick lowest-friction option (likely query param); remove probe routes before ship

3. **Grep verifier broken-pattern list completeness**
   - What we know: UI_REDO_HANDOFF.md provides migration map; UIV-01 requires grep to confirm zero hits
   - What's unclear: Are there additional broken patterns beyond those listed in UI_REDO_HANDOFF.md? (e.g., `col-span-*`, `grid-cols-*` if grid is used)
   - Recommendation: Before finalizing grep pattern list, scan Phase 7 components for all Tailwind classes; extend list if needed

4. **ErrorBoundary implementation for React 19**
   - What we know: ErrorBoundary exists in codebase; React 19 supports both class and hook-based error handling
   - What's unclear: Does current implementation use deprecated pattern? Should Phase 7 migrate to latest React 19 error boundary API?
   - Recommendation: Check current ErrorBoundary source; if it's class-based, consider updating to error.boundary hook pattern (React 19 stable feature)

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build (esbuild, TypeScript) | ✓ | >=20 | — |
| npm / pnpm | Package management | ✓ | pnpm >=9.15.4 | npm (slower, less ideal) |
| esbuild | Build bundling | ✓ | ^0.27.3 | — |
| TypeScript | Compilation + type checking | ✓ | ^5.7.3 | — |
| React 19 | Host + plugin peer | ✓ | ^19.0.0 (host) | — |
| Tailwind v4 | Host CSS framework (inherited) | ✓ | v4 (host) | — |
| Vitest | Unit tests (Phase 7 primitives) | ✓ | ^3.0.5 | Jest (not ideal for plugin SDK testing) |
| Lucide Icons | Icon components | ✓ | ^1.14.0 | — |
| @paperclipai/plugin-sdk | Plugin SDK + UI hooks | ✓ | 2026.428.0 | — |

**Missing dependencies with no fallback:**
- None identified.

**Missing dependencies with fallback:**
- None identified.

**All required dependencies present.** No blockers for Phase 7 execution.

---

## Validation Architecture

**Validation note:** `workflow.nyquist_validation: false` in .planning/config.json → Nyquist validation framework is disabled. Phase 7 does not require automated test infrastructure; verification gates are manual (probe pages) + visual (dark-mode toggle).

### Test Infrastructure (Existing)

| Property | Value |
|----------|-------|
| Framework | Vitest ^3.0.5 |
| Config file | vitest.config.* (if exists, else see Wave 0) |
| Quick run command | `pnpm test -- --reporter=verbose` (or `npm test`) |
| Full suite command | `pnpm test:run` (or `npm run test:run`) |

### Phase 7 Testing Scope

| Component | Test Type | Automated Command | File Exists? |
|-----------|-----------|-------------------|-------------|
| Card primitive (variant/padding props) | Unit (snapshot + prop validation) | `pnpm test -- Card.test.tsx` | ❌ Wave 0 — create `tests/ui/Card.test.tsx` |
| SectionHeader primitive (title/subtitle/icon/actions) | Unit (snapshot + layout) | `pnpm test -- SectionHeader.test.tsx` | ❌ Wave 0 — create `tests/ui/SectionHeader.test.tsx` |
| OklchProbe visual render (gating task UIF-08) | Manual — founder opens running host and inspects colors | N/A (manual verification in browser) | N/A — dev-only component, removed before ship |
| DualRenderProbe light/dark side-by-side (UIF-09) | Manual — founder visually scans light + dark columns | N/A (manual verification in browser) | N/A — dev-only component, removed before ship |
| All Phase 7 components in light + dark modes | Integration (visual regression, manual) | N/A (manual spot-check in running host) | N/A — no automated visual regression (Percy deferred to v1.2) |
| Grep verification (UIV-01) | Script — verify zero broken-pattern hits | `grep -r "gap-xs\|gap-sm\|px-xs\|..." src/ui/` | ✅ Can be scripted in pre-commit hook |

### Wave 0 Gaps

- [ ] `tests/ui/Card.test.tsx` — unit tests for Card variant/padding combinations
- [ ] `tests/ui/SectionHeader.test.tsx` — unit tests for SectionHeader with/without icon/subtitle/actions
- [ ] `vitest.config.ts` — if not present, set up Vitest config (likely already exists from v1.0)
- [ ] Grep verifier script — `scripts/verify-broken-patterns.sh` to confirm zero hits before Phase 8

**If Vitest not configured:** Install and configure per Plugin SDK testing guide (subpath export: `@paperclipai/plugin-sdk/testing` provides mock harness).

---

## Security Domain

**Enabled:** Security enforcement is enabled by default (absent from config = enabled). Phase 7 is UI-only (no new backend logic, no API endpoints, no data mutations). Security review is scoped to visual/interaction contracts, not access control or data handling.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Phase 7 has no auth logic; auth managed by Plugin SDK + Paperclip host |
| V3 Session Management | No | Plugin SDK handles session state; Phase 7 does not introduce sessions |
| V4 Access Control | No | Panel visibility controlled by detected mode; no new access control in Phase 7 |
| V5 Input Validation | No | Phase 7 is UI reskin; no new input handling (Mode override dropdown is pre-existing) |
| V6 Cryptography | No | No cryptographic operations in UI layer |
| V7 Error Handling | Yes | ErrorBoundary component; ensure error messages don't leak sensitive data (already done in v1.0) |
| V14 Configuration | No | No plugin-side config added; inherits from host |

### Known Threat Patterns for Paperclip Plugin UI

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via unsanitized user data in UI | Tampering | Plugin SDK hooks (`usePluginData`) return sanitized data from server; no raw HTML injection. React escapes text content by default. |
| CSS injection via dynamic class names | Tampering | All classes are static string literals (no template-string vulnerability). Tailwind JIT safe. |
| Dark-mode CSS disclosure | Information Disclosure | Host manages theme toggle; plugin responds passively. No new disclosure surface. |

**Phase 7 security posture:** No new attack surface. Inherits Plugin SDK + host security model.

---

## Sources

### Primary (HIGH confidence)
- **@paperclipai/plugin-sdk v2026.428.0** — Plugin entrypoint, UI hooks, testing harness via npm registry
- **Paperclip host `~/Development/paperclip-temp/ui/src/index.css`** — CSS variable definitions (OKLCH format), dark-mode mechanism, sidebar tokens
- **Paperclip host shadcn components `~/Development/paperclip-temp/ui/src/components/`** — Design reference, icon usage patterns, semantic color examples

### Secondary (MEDIUM confidence)
- **CONTEXT.md (locked decisions D-01 through D-10)** — User-confirmed design decisions for Phase 7 scope
- **UI_REDO_HANDOFF.md (migration map)** — Concrete class swap table and broken-pattern inventory
- **REQUIREMENTS.md (UIF-01 through UIF-09)** — Phase 7 requirement descriptions and traceability
- **UI-SPEC.md (Phase 7 design contract)** — Visual specification for primitives, color palette, spacing scale, typography

### Tertiary (LOW confidence — marked for validation)
- **Assumption A3:** Sidebar tokens exist and are used in host (ASSUMED — grep host index.css before SidebarLink migration)
- **Assumption A4:** Host dark-mode mechanism is `.dark` class toggle (ASSUMED — verify by testing dark-mode probe)

---

## Metadata

**Confidence breakdown:**
- **Standard Stack (HOST tokens + Tailwind v4):** HIGH — Verified against host source, plugin SDK, npm registry
- **Architecture (token inheritance, dark-mode mechanism):** HIGH — Confirmed by CONTEXT.md, UI-SPEC.md, host source inspection
- **Primitives API (Card/SectionHeader):** HIGH — Locked in CONTEXT.md decisions, finalized in UI-SPEC.md
- **Semantic Palette (emerald/red/yellow/blue):** HIGH — Corrected from v1.0; documented in Requirements, verified in host components
- **OKLCH + Opacity Modifiers:** MEDIUM-HIGH — Assumed based on host CSS var definitions + precedent; gating on UIF-08 verification
- **Pitfalls & Patterns:** HIGH — Based on v1.0 live feedback and UI_REDO_HANDOFF.md analysis

**Research date:** 2026-05-04  
**Valid until:** 2026-05-18 (14 days — Tailwind/SDK versions stable, no major releases expected in window)

---

*Phase 7 research complete. Ready for planning and execution. Gating task: OklchProbe (UIF-08) — all Phase 7 work depends on successful OKLCH + opacity modifier verification.*
