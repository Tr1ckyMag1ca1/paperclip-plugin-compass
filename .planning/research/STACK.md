# Technology Stack — UI Parity Reskin (v1.1)

**Project:** Compass — Paperclip Plugin  
**Milestone:** v1.1 (UI parity reskin with Paperclip host)  
**Researched:** 2026-05-04

## Summary

Compass UI migration to match Paperclip host requires **no new runtime dependencies**. The host uses Tailwind CSS v4 with inline `@theme` and CSS variables for theming (not a separate config file). Compass inherits these tokens directly via the host's React tree (no iframe/shadow DOM). All 55 components migrate by swapping hardcoded light-only Tailwind classes for host-exposed theme tokens and eliminating nonexistent custom utilities (`gap-xs`, `px-sm`, `py-md`). Theme verification uses Vitest + DOM inspection (existing Compass test runner), no screenshot-diff tool needed at this stage.

## Recommended Stack (No Changes Required)

### Current Runtime (Compass v1.0 — Already Correct)

| Technology | Version | Purpose | Why Kept |
|------------|---------|---------|----------|
| **TypeScript** | ^5.7.3 | Type-safe source language | Already matches Paperclip core standard; strict mode verified working |
| **Node.js** | >=20 | Worker process runtime | Required by Paperclip, already in use |
| **React** | >=18 (peer) | UI component framework | Paperclip host ≥19; peer dependency prevents duplication; shared React tree |
| **Zod** | ^3.24.2 (via SDK) | Schema validation | Already in Plugin SDK, reuse as-is |
| **esbuild** | ^0.27.3 | Bundling (worker, manifest, UI) | Paperclip standard; handles `.tsx` + CSS tokens seamlessly |
| **Tailwind CSS v4** | (via host) | Utility-first CSS framework | **Not bundled by Compass**; host loads globally; Compass inherits tokens |
| **lucide-react** | ^1.14.0 | SVG icons | Already in Compass; matches Paperclip icon library |

### Build & Testing (Compass v1.0 — Already Correct)

| Technology | Version | Purpose | Why Kept |
|------------|---------|---------|----------|
| **TypeScript Compiler** | ^5.7.3 | Type checking (CI/pre-commit) | Already used; `tsc --noEmit` works fine |
| **Vitest** | ^3.0.5 | Unit tests + component DOM inspection | Already in use; sufficient for theme token validation without screenshots |
| **pnpm** | >=9.15.4 | Package manager | Paperclip monorepo standard; already in use |

### Theme Token System (From Host)

Paperclip host provides via `paperclip-temp/ui/src/index.css`:

**Color tokens (CSS variables, light + dark mode):**
- Surfaces: `--color-background`, `--color-card`, `--color-muted`, `--color-popover`
- Text: `--color-foreground`, `--color-muted-foreground`
- Semantic: `--color-primary`, `--color-secondary`, `--color-accent`, `--color-destructive`
- Borders: `--color-border`, `--color-input`, `--color-ring`
- Sidebar: `--color-sidebar`, `--color-sidebar-foreground`, `--color-sidebar-border`, `--color-sidebar-accent`
- Chart colors: `--color-chart-1` through `--color-chart-5`

**Radius tokens:**
- `--radius-sm: 0.375rem` (6px)
- `--radius-md: 0.5rem` (8px)
- `--radius-lg: 0px` (sharp corners — **key design difference**)
- `--radius-xl: 0px` (sharp corners)

**Dark mode:** Defined via `.dark` class selector (e.g., `<div class="dark">` on root); Paperclip toggles this dynamically.

**Tailwind version:** v4.0.7 (host), uses inline `@theme { ... }` syntax (no separate `tailwind.config.js`).

## Migration Rules — No New Dependencies

### 1. Replace Light-Only Color Classes

| Current (broken) | Host Token Replacement | Why |
|---|---|---|
| `bg-green-50 text-green-700 border-green-200` | `bg-emerald-500/10 text-emerald-500 border-emerald-500/20` | Fallback for status/success; host doesn't provide semantic "success" token |
| `bg-red-50 text-red-700 border-red-200` | `bg-destructive/10 text-destructive border-destructive/20` | Uses host's destructive token for errors |
| `bg-slate-50 text-slate-600 border-slate-200` | `bg-muted text-muted-foreground border-border` | Neutral surfaces map to muted |
| `bg-white` / `bg-gray-50` (panels) | `bg-card` | Host card surface token |
| `text-gray-900` | `text-foreground` | Dark text always maps to foreground |
| `text-gray-500` / `text-gray-600` | `text-muted-foreground` | Secondary text maps to muted-foreground |
| `border-gray-200` | `border-border` | Borders always use border token |
| `rounded-lg` / `rounded-xl` | `rounded-none` | Host radius is 0 (sharp corners, not rounded) |

### 2. Eliminate Nonexistent Custom Utilities

Currently cause silent no-op, breaking layout:

| Current | Replace With | Reasoning |
|---|---|---|
| `gap-xs` | `gap-1` (4px) | Smallest Tailwind gap |
| `gap-sm` | `gap-2` (8px) | Small gap |
| `gap-md` | `gap-3` (12px) | Medium gap |
| `px-xs` | `px-1` (4px) | Smallest padding |
| `px-sm` | `px-2` (8px) | Small padding |
| `px-md` | `px-3` (12px) | Medium padding |
| `py-xs` | `py-1` (4px) | Smallest padding |
| `py-sm` | `py-2` (8px) | Small padding |
| `py-md` | `py-3` (12px) | Medium padding |

### 3. Use Host Semantic Tokens (Already Available)

No imports or installs needed — Tailwind classes automatically resolve to host CSS variables:

- `bg-card` → `var(--color-card)` (auto-switches in dark mode)
- `text-foreground` → `var(--color-foreground)` (auto-switches)
- `border-border` → `var(--color-border)` (auto-switches)
- `bg-sidebar` → `var(--color-sidebar)` (sidebar-specific surface)

## What NOT to Add

### Anti-Dependencies (Explicitly Avoided)

| What | Why Not | Alternative |
|---|---|---|
| **Custom Tailwind config** (`tailwind.config.js`) | Plugin runs in host React tree; host Tailwind is global. Custom config = override conflicts. | Use host tokens via CSS variable utility classes |
| **CSS Modules / styled-components** | Defeats token parity; adds build complexity; increases bundle size. | Plain Tailwind utilities inherit host tokens automatically |
| **Tailwind CSS bundle** | Host already loads Tailwind v4 globally; bundling creates duplication + version conflicts. | Reference host tokens via Tailwind classes (peer dependency) |
| **Design system extraction libraries** (Storybook, chromatic, etc.) | Plugin is part of host, not a standalone system. | Run theme validation in Vitest against host's .dark class |
| **CSS-in-JS** (emotion, linaria, etc.) | Adds runtime overhead; conflicts with host's CSS variable system; unnecessary. | Tailwind utilities + host tokens |
| **Screenshot diff tools** (Percy, Chromatic, etc.) | Early stage; manual visual QA sufficient for v1.1. Defer to v1.2 if drift emerges. | Vitest DOM inspection + manual host browser verification |
| **PostCSS plugins** (autoprefixer, etc.) | Host Tailwind already handles vendor prefixes; bundler (esbuild) handles the rest. | Let esbuild and host's Tailwind handle it |
| **Theme toggle library** (next-themes, etc.) | Paperclip host manages dark mode state globally; plugin just renders. | Use `dark:` prefix in Tailwind classes; host controls `.dark` class |
| **Type-safe color utility library** | Tailwind's class-based system is already type-safe with TypeScript. | Stick with strings; linters catch typos. |

## Testing & Verification Strategy (No New Tools)

### Unit Tests (Vitest — Already in Use)

Theme token migration is verified by:

1. **DOM class inspection:** Render component with both light + dark host context, inspect computed styles match host tokens
2. **No broken class patterns:** Grep `src/ui/**/*.tsx` for broken patterns from migration map above; expect **zero hits**
3. **Type safety:** TypeScript `strict: true` already catches invalid class names (though TypeScript doesn't know about host's Tailwind)

### Verification Workflow (Verifier Acceptance Criteria)

After each phase migration:

```bash
# 1. Grep for broken class patterns
grep -r "gap-xs\|gap-sm\|gap-md\|px-xs\|px-sm\|px-md\|py-xs\|py-sm\|py-md\|bg-green-50\|bg-red-50\|bg-slate-50\|text-slate-600\|border-green-200\|border-red-200\|border-slate-200\|rounded-lg\|rounded-xl" src/ui --include="*.tsx"
# Expected: 0 matches (all migrated)

# 2. Build and typecheck
pnpm build && pnpm typecheck
# Expected: No errors

# 3. Manual verification in browser
# Load plugin in local Paperclip instance
# Switch dark mode toggle in host
# Visually confirm colors, padding, gaps look consistent with rest of app
```

### Why NOT Screenshot Testing in v1.1

- **Overhead:** Requires Playwright (not in host's devDeps for UI), Percy or Chromatic integration, baseline storage
- **Early stage:** Plugin styling is mostly spacing + color swaps; manual verification catches regressions faster than image diffs at this scale
- **Host-dependent:** Host may change theme tokens between versions; screenshot baselines would break
- **Deferrable:** Adopt Percy/Chromatic in v1.2 if drift testing becomes frequent

**Recommendation:** Defer screenshot-diff testing to v1.2+ when component library matures and changes stabilize.

## Installation & Build Verification

No new package installs needed. Verify existing setup:

```bash
cd ~/Development/Paperclip/paperclip-plugin-compass

# Current stack
pnpm install  # Already has all deps

# Verify no bundled Tailwind conflict
grep -A3 '"react"\|"tailwindcss"' package.json
# Expected: React as peerDependency, NO tailwindcss in dependencies/devDependencies

# Build
pnpm build
# Expected: dist/ui bundle < 200KB (Compass: ~45KB gzipped currently)

# Typecheck
pnpm typecheck
# Expected: No errors
```

## Sources

- **Paperclip host CSS:** `/Users/nicholasrhodes/Development/paperclip-temp/ui/src/index.css` (Tailwind v4, inline `@theme`, CSS variables, dark mode)
- **Paperclip host package.json:** `/Users/nicholasrhodes/Development/paperclip-temp/ui/package.json` (Tailwind v4.0.7, React 19.0.0, Vitest 3.0.5)
- **Compass current stack:** `/Users/nicholasrhodes/Development/Paperclip/paperclip-plugin-compass/package.json` (v0.1.9, TypeScript 5.7.3, esbuild 0.27.3, lucide-react 1.14.0)
- **Plugin SDK:** `@paperclipai/plugin-sdk` v2026.428.0 (no Tailwind exports; theme tokens via host global Tailwind)
- **UI_REDO_HANDOFF.md:** Class migration map reference

## Confidence Assessment

| Component | Level | Rationale |
|-----------|-------|-----------|
| No new runtime deps | **HIGH** | Verified: host loads Tailwind globally; Compass shares React tree; all tokens available via host CSS variables |
| Tailwind v4 support | **HIGH** | Verified: host uses v4.0.7 with inline `@theme`; Compass esbuild config already works with Tailwind v4 (no config file needed) |
| Theme token availability | **HIGH** | Verified: `/paperclip-temp/ui/src/index.css` exports 25+ color tokens + radius tokens; all accessible via standard Tailwind utility classes |
| Dark mode handling | **HIGH** | Verified: host uses `.dark` class selector; Compass uses `dark:` Tailwind prefix; no new logic needed |
| No config conflicts | **MEDIUM** | Assumption: Compass bundled UI will not declare a Tailwind config that conflicts with host. esbuild preset doesn't generate tailwind.config.js, so risk is low. **Action:** Confirm in phase 1 build that no config collision occurs. |
| Vitest sufficiency for theme QA | **MEDIUM** | Vitest 3.0.5 + DOM testing covers styling verification at unit level; manual browser verification still required for confident visual parity. No automated screenshot-diff = less coverage than Percy/Chromatic, but acceptable for v1.1 scope. |

## Next Steps (Handoff to Phase 1 — Design Primitives)

1. **Phase 1:** Migrate shell components (`MainPanel`, `SidebarLink`, `ModeBanner`, `StatusBadge`, shared `Card`/`Section`/`Button` wrappers)
   - Replace classes per migration map above
   - Build and verify no broken utilities
   - Grep `src/ui/**/*.tsx` — confirm zero matches on broken patterns
   - Manual host browser check: light + dark mode, padding/spacing looks correct

2. **Phase 2:** Assess + Found panels (10+ components per panel)
   - Use same migration pattern
   - Vitest DOM inspection for color tokens if needed (e.g., verify `bg-muted` renders correctly in both modes)

3. **Phase 3:** Revive + Reposition panels

4. **Phase 4:** Memory/History + polish + final verification

**Do not add:**
- Tailwind config file
- CSS modules / styled-components
- Screenshot diff tools
- Theme toggle libraries
- Storybook / design system extraction

Stick to Tailwind utilities + host tokens. Keep bundle < 200KB. Ship to production.
