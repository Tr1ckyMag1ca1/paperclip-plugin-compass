# Compass UI Patterns & Token Conventions

**Last Updated:** 2026-05-12  
**Phase:** Phase 10 (v1.1 Host Token Parity)

This document guides contributors on Compass UI patterns, token usage, and component conventions. All components use Tailwind utility classes inherited from the Paperclip host — no custom CSS or Tailwind config needed.

---

## Token Inheritance Model

Compass renders directly in Paperclip's React tree. All design tokens (colors, spacing, typography) come from the host's Tailwind config and CSS variables. This means:

- ✓ Plugin automatically inherits light/dark theme switching
- ✓ Plugin is visually consistent with Paperclip core
- ✓ No bundled CSS duplication
- ✓ No plugin-side Tailwind config required

**Never add custom Tailwind config or CSS variables to Compass.**

---

## Semantic Color Palette

| Color | Use Case | Example Classes |
|-------|----------|-----------------|
| **Emerald** | Success, healthy status, confirmed items | `bg-emerald-500/10 text-emerald-500 border-emerald-500/20` |
| **Red** | Error, stalled status, blocking issues | `bg-red-500/10 text-red-500 border-red-500/20` |
| **Yellow** | Warning, pending items, draft states | `bg-yellow-500/10 text-yellow-500 border-yellow-500/20` |
| **Blue** | Info, secondary actions, informational states | `bg-blue-500/10 text-blue-500 border-blue-500/20` |
| **Neutral (Gray)** | Inactive, muted, unimplemented | `text-muted-foreground bg-muted` |

### Color Class Pattern

Semantic colors follow a consistent pattern:
- Background: `bg-{color}-500/10` (10% opacity for subtle fill)
- Text: `text-{color}-500` (full opacity for readability)
- Border: `border-{color}-500/20` (20% opacity for subtle border)

This pattern ensures **4.5:1+ contrast ratio** in light and dark modes (WCAG AA standard).

---

## Surface & Text Tokens

| Purpose | Token | Usage |
|---------|-------|-------|
| **Main backgrounds** | `bg-background` | Page/panel root containers |
| **Card backgrounds** | `bg-card` | Cards, panels, sections |
| **Muted backgrounds** | `bg-muted` | Inactive/secondary areas |
| **Primary text** | `text-foreground` | All body text, headings |
| **Secondary text** | `text-muted-foreground` | Hints, metadata, timestamps |
| **Borders** | `border-border` | All dividers, input borders |
| **Sidebar surface** | `bg-sidebar` | Sidebar panels (if needed) |
| **Sidebar text** | `text-sidebar-foreground` | Sidebar text |

---

## Spacing & Sizing

All spacing uses standard Tailwind scale (4px base unit):

| Class | Size | Usage |
|-------|------|-------|
| `gap-1` | 4px | Tight component spacing (icon-text gaps) |
| `gap-2` | 8px | Standard item spacing |
| `gap-3` | 12px | Section spacing |
| `gap-4` | 16px | Large section spacing |
| `px-1` / `py-1` | 4px | Tight padding |
| `px-2` / `py-2` | 8px | Standard padding |
| `px-3` / `py-3` | 12px | Generous padding |
| `px-4` / `py-4` | 16px | Large padding |
| `mt-1` through `mt-6` | 4px–24px | Margin utilities |

### Typography Sizes

| Class | Size | Purpose |
|-------|------|---------|
| `text-xs font-medium` | 12px, 500 weight | Labels, badges, small caps |
| `text-sm` | 14px, 400 weight | Body text, descriptions |
| `text-base font-semibold` | 16px, 600 weight | Section headings |

**Never use custom aliases** like `text-label`, `text-body`, `text-heading`. Expand inline: `text-xs font-medium`, `text-sm`, `text-base font-semibold`.

---

## Border Radius

Paperclip uses **sharp, square corners** (no rounded corners). All components use:

```tsx
className="rounded-none"  // or omit rounded class entirely
```

**Never use** `rounded-lg`, `rounded-xl`, `rounded-md`. These don't match the host design language.

---

## Component Conventions

### Layout Components

**Panel/Container:**
```tsx
<div className="bg-card rounded-none p-4 gap-3 flex flex-col">
  {children}
</div>
```

**Section with Header:**
```tsx
<div className="gap-2 flex flex-col">
  <h2 className="text-base font-semibold text-foreground">Section Title</h2>
  <div className="gap-2 flex flex-col">
    {items}
  </div>
</div>
```

### Badge/Status Indicators

**Status Badge (emerald/success example):**
```tsx
<div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-none px-2 py-1 flex items-center gap-1">
  <CheckIcon className="w-3 h-3" />
  <span className="text-xs font-medium">Confirmed</span>
</div>
```

**Error Badge (red example):**
```tsx
<div className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-none px-2 py-1 flex items-center gap-1">
  <AlertIcon className="w-3 h-3" />
  <span className="text-xs font-medium">Stalled</span>
</div>
```

### Icon Usage

- All icons from **Lucide React** (`lucide-react` package)
- Icon size: typically `w-4 h-4` (16px) for inline icons, `w-5 h-5` (20px) for larger badges
- Icon color: inherit from parent text color or explicit semantic color

```tsx
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

// Semantic icon with color
<CheckCircle className="w-4 h-4 text-emerald-500" />

// Inherit parent color
<span className="text-red-500 flex items-center gap-1">
  <AlertCircle className="w-4 h-4" />
  Error state
</span>
```

---

## Anti-Patterns (Do NOT Do This)

| ❌ Anti-Pattern | ✓ Correct Pattern | Why |
|-----------------|-------------------|-----|
| `gap-xs`, `gap-sm`, `gap-md` | `gap-1`, `gap-2`, `gap-3` | Custom tokens don't exist; use standard Tailwind |
| `px-xs`, `py-sm`, `text-label` | `px-1`, `py-2`, `text-xs font-medium` | Same reason — no custom aliases |
| `bg-green-50 text-green-700` | `bg-emerald-500/10 text-emerald-500` | Light-only utilities fail in dark mode |
| `rounded-lg`, `rounded-xl` | `rounded-none` | Host uses sharp corners |
| `text-slate-600`, `bg-gray-50` | `text-muted-foreground`, `bg-muted` | Use semantic tokens for theme flexibility |
| Template literals for color: `` className={`text-${colorMap[status]}`} `` | Object maps: `const classes = { active: "text-emerald-500", ... }; className={classes[status]}` | Template literals break Tailwind JIT purge |
| Inline style attributes | Tailwind utility classes | Keep all styling in class names for consistency |
| Shadow utilities for depth | None — use border or opacity instead | Paperclip design uses borders, not shadows |

---

## Migration Reference (v1.0 → v1.1)

If you encounter v1.0 code with broken patterns, use this map to migrate:

| v1.0 (Broken) | v1.1 (Host Parity) |
|---------------|-------------------|
| `text-label` | `text-xs font-medium` |
| `text-body` | `text-sm` |
| `text-heading` | `text-base font-semibold` |
| `gap-xs` | `gap-1` |
| `gap-sm` | `gap-2` |
| `gap-md` | `gap-3` |
| `px-xs` | `px-1` |
| `px-sm` | `px-2` |
| `px-md` | `px-3` |
| `py-xs` | `py-1` |
| `py-sm` | `py-2` |
| `py-md` | `py-3` |
| `mt-xs` | `mt-1` |
| `mt-sm` | `mt-2` |
| `bg-green-50` | `bg-emerald-500/10` |
| `text-green-700` | `text-emerald-500` |
| `border-green-200` | `border-emerald-500/20` |
| `rounded-lg` | `rounded-none` |
| `rounded-xl` | `rounded-none` |

---

## Verification Gates

Before committing UI changes:

1. **Run the broken-pattern verifier:**
   ```bash
   pnpm verify:broken-patterns
   ```
   This confirms zero references to v1.0 patterns (gap-xs, text-label, etc.).

2. **Test in both light and dark modes:**
   - Toggle host theme in Paperclip settings
   - Verify contrast (badge text is readable on semantic background)
   - Check surface tokens match host's light/dark palette

3. **Build and check bundle size:**
   ```bash
   pnpm build
   ls -lh dist/ui/index.js  # Should be <250 KB uncompressed
   ```

---

## References

- **Host Tokens:** Paperclip's Tailwind v4 config in `paperclip-temp/ui/src/index.css`
- **Design Language:** Paperclip uses shadcn "new-york" style with neutral base color
- **Verification Results:** See [docs/WCAG_AUDIT.md](../docs/WCAG_AUDIT.md) and [docs/BUILD_VERIFICATION.md](../docs/BUILD_VERIFICATION.md)
- **Migration History:** See [UI_REDO_HANDOFF.md](../UI_REDO_HANDOFF.md) for v1.0 → v1.1 context

---

## Questions?

See [README.md](../README.md) for maintainers and contribution guidelines. Open an issue if a pattern doesn't work or seems inconsistent.
