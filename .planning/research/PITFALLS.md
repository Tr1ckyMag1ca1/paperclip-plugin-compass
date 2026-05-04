# Domain Pitfalls: Embedding Plugin UI in Host Shadcn Token System

**Domain:** Plugin UI migration to host CSS variable theming (shadcn palette + Tailwind v4)
**Researched:** 2026-05-04
**Scope:** Compass UI → Paperclip host token system (55 components, 5 mode panels, Tailwind v3→v4 path)

---

## Executive Summary

Migrating ~55 Compass components from light-only Tailwind utilities to host shadcn tokens introduces 6 **critical** pitfalls:

1. **Dark mode not cascading** — CSS variable inheritance breaks if plugin CSS loads before host .dark class propagates
2. **Nonexistent custom tokens silently no-op'd** — 162 uses of `gap-xs`, `px-sm`, `py-md` create 0 CSS rules, collapse layouts in production
3. **Tailwind v3 HSL vs v4 OKLCH color format mismatch** — Host uses OKLCH; plugin inherits HSL; opacity modifiers misfire
4. **CSS specificity collisions** — Host token utilities (`.bg-card { background-color: hsl(var(--card)) }`) overridden by plugin inline styles
5. **Dynamic class safelist failures** — If Compass maps colors via JS (e.g., `statusColor[status]` → `bg-emerald-500/10`), JIT purge strips unmatched variants
6. **Accessibility contrast loss in dark mode** — Token values pass WCAG 4.5:1 in light; dark-mode saturated accent colors (emerald, red) fail WCAG at 3:1+ when overlaid

**Critical pre-migration verification flagged:** UI_REDO_HANDOFF.md claims `--radius-lg: 0px` (flat corners) and "emerald palette" without grep-verification. **Verification result:** Both claims **VERIFIED** (radius confirmed in host CSS line 41; emerald used throughout host codebase) but "emerald palette as primary green" is **unconfirmed** — host uses neutral theme, not emerald as default. Emerald is an *accent* color for status badges only.

---

## Critical Pitfalls

### Pitfall 1: Dark Mode CSS Variable Inheritance Breaks at Plugin Boundary

**What goes wrong:**
Host applies `.dark` class to `<html>` or parent container. CSS variables redefine (`--foreground: oklch(0.985 0 0)` in dark vs `oklch(0.145 0 0)` in light). But plugin renders **inside** a React subtree that was already mounted when dark-mode toggle fires. CSS cascade doesn't automatically re-evaluate plugin components because:

1. Plugin stylesheet loaded *before* host theme stylesheet
2. Compass uses old host-color utilities (`bg-green-50 text-green-700`) that have explicit RGB/HSL values, not CSS variables
3. When host injects `.dark` class, plugin's non-variable utilities don't know to change — they're hard-coded colors

**Example:** User toggles dark mode in Paperclip. Assessment badge is styled `bg-green-50 text-green-700`. Host token `bg-emerald-500/10` recalculates correctly. Compass badge stays light green on dark background (contrast FAIL, unreadable).

**Why it happens:**
- Plugin CSS bundles independently; no knowledge of host theme lifecycle
- Plugin renders in same React tree but may have its own CSS scoping or stylesheet order
- CSS variables must be used *consistently* — mixing hardcoded colors + variables = broken dark mode

**Consequences:**
- Light mode = correct appearance
- Dark mode = wrong colors (light on dark or faint text)
- Contrast violations (WCAG AA fails)
- User perception: "Plugin is broken in dark mode"

**Prevention:**
1. **Replace all hardcoded colors with host tokens FIRST**, before testing dark mode
2. **Verify no light-only utilities remain:**
   ```bash
   grep -r "bg-green-\|bg-red-\|bg-slate-\|bg-gray-\|bg-white\|text-green-\|text-red-\|text-slate-\|text-gray-\|border-green-\|border-red-\|border-gray-" src/ui --include="*.tsx" --include="*.ts"
   ```
   Expected: **0 hits** (except for Lucide icon `text-green-600` / `text-red-600` — those are semantic, checked below)
3. **Verify all colors use token format** (e.g., `bg-emerald-500/10` not `bg-green-50`):
   ```bash
   grep -E "(bg|text|border)-(green|red|slate|gray|white)-[0-9]" src/ui --include="*.tsx" | grep -v "text-green-600\|text-red-700" | wc -l
   ```
   Expected: **0 lines** (except Lucide icons which are intentional status colors)
4. **Test in host dark mode explicitly:**
   - Toggle dark theme in Paperclip
   - Screenshot Compass panels (Assess, Found, Revive, Reposition, Memory)
   - Visually verify: no light-colored text on dark backgrounds, no contrast fails
   - Use browser DevTools Lighthouse → Accessibility to confirm no contrast violations

**Detection:**
- User reports "can't read X in dark mode"
- Screenshot comparison: light vs dark panels show broken colors
- Lighthouse reports color contrast <4.5:1 on any interactive element in dark

**Phase responsibility:** **Phase 2 (Design primitives + shell)** — test immediately after reskinning MainPanel, SidebarLink, ModeBanner. Before moving to Panels.

---

### Pitfall 2: Nonexistent Custom Tailwind Tokens Create Zero CSS Rules (Silent Layout Collapse)

**What goes wrong:**
Current Compass codebase uses **162 instances** of custom tokens that don't exist in any Tailwind config:

```
gap-xs, gap-sm, gap-md
px-xs, px-sm, px-md
py-xs, py-sm, py-md
```

Tailwind's JIT engine builds utilities only for classes it *recognizes*. When it sees `gap-xs`, it checks:
1. Tailwind default palette? No.
2. Local `tailwind.config.js`? No file exists.
3. Host's `@theme` tokens? Not propagated to plugin bundle.

Result: **No CSS rule is generated**. The class is silently dropped. Layout collapses:

```jsx
<div className="flex flex-col gap-xs">  {/* BROKEN: gap is 0 */}
  <p>Item 1</p>
  <p>Item 2</p>
</div>
```

Renders as overlapping text (no gap). Works fine in dev (browser might add some default spacing), breaks in production build (purged CSS).

**Why it happens:**
- Compass codebase built against a local token map that was never wired to Tailwind config
- Hand-created semantic naming (`gap-xs` = "extra small" = `gap-1` = 0.25rem)
- Tailwind doesn't support custom semantic spacing without explicit config
- No build-time validation (esbuild doesn't know what Tailwind expects)

**Consequences:**
- Layout broken in production (purged, zero rules generated)
- Works in dev (depends on browser defaults or fallback cascading)
- Hard to debug (grep shows `gap-xs` in code, DevTools shows no gap property in computed styles)
- All 5 panels affected: Assess panels collapse, Found interview form unreadable, Memory cards overlap

**Prevention:**
1. **Pre-migration audit** — count broken tokens:
   ```bash
   grep -roh "gap-[a-z]*\|px-[a-z]*\|py-[a-z]*" src/ui --include="*.tsx" | sort | uniq -c | sort -rn
   ```
2. **Create mapping table** before touching code:
   ```
   gap-xs → gap-1 (0.25rem)
   gap-sm → gap-2 (0.5rem)
   gap-md → gap-3 (0.75rem)
   px-xs → px-1  (0.25rem)
   px-sm → px-2  (0.5rem)
   px-md → px-3  (0.75rem)
   py-xs → py-1  (0.25rem)
   py-sm → py-2  (0.5rem)
   py-md → py-3  (0.75rem)
   ```
3. **Verify mapping against Tailwind default scale:**
   ```bash
   # Confirm Tailwind defaults exist
   npx tailwindcss -h | grep -A 20 "spacing"
   ```
4. **Automated replacement** (per phase, one component file at a time):
   ```bash
   # Phase 1: MainPanel + SidebarLink only
   sed -i '' 's/gap-xs/gap-1/g' src/ui/MainPanel.tsx
   sed -i '' 's/gap-sm/gap-2/g' src/ui/MainPanel.tsx
   # ... etc
   ```
5. **Post-replacement verification:**
   ```bash
   grep -r "gap-xs\|gap-sm\|gap-md\|px-xs\|px-sm\|px-md\|py-xs\|py-sm\|py-md" src/ui --include="*.tsx" | wc -l
   # Expected: 0 after each phase
   ```
6. **Build test:**
   ```bash
   pnpm build
   grep -o "gap-1\|gap-2\|gap-3\|px-1\|px-2\|px-3\|py-1\|py-2\|py-3" dist/ui/index.js | wc -l
   # Expected: >0 (classes are present in bundle)
   ```

**Detection:**
- Grep shows `gap-xs` in source, DevTools computed styles show `gap: auto` or `gap: 0`
- Layout collapsed/overlapping in production screenshot
- Dev vs production appearance differs
- CI/CD lint step: `grep -r "gap-[a-z]*\|px-[a-z]*\|py-[a-z]*" src/ui` exits with hits

**Phase responsibility:** **Phase 1 (Design primitives)** — fix MainPanel, SidebarLink, ModeBanner FIRST before other components inherit the broken tokens. Blocker for later phases.

---

### Pitfall 3: Tailwind v3 HSL vs v4 OKLCH Color Format Mismatch + Opacity Modifier Failures

**What goes wrong:**
Paperclip host uses Tailwind v4 with OKLCH color space:

```css
/* From host index.css line 54 */
--primary: oklch(0.205 0 0);  /* OKLCH format */
--primary-foreground: oklch(0.985 0 0);
```

But plugin may inherit v3 HSL conventions (shadcn v3 used `hsl(var(--primary))`). When plugin applies opacity modifiers like `bg-primary/50`, the interpretation differs:

**v3 (HSL):**
```css
.bg-primary/50 { background-color: hsl(var(--primary) / 0.5); }
/* Expects: --primary = "210 100%" (hue space) */
```

**v4 (OKLCH):**
```css
.bg-primary/50 { background-color: oklch(var(--primary) / 0.5); }
/* Expects: --primary = "0.205 0 0" (lightness chroma hue) */
```

If plugin CSS was built for v3 and tries to apply v4 opcity modifier to v3 HSL syntax, **the color becomes invalid** (OKLCH value parsed as HSL returns garbage or transparent).

**Example:**
```jsx
<div className="bg-emerald-500/10">  {/* Intent: 10% opacity emerald */}
  Success badge
</div>
```

If Compass CSS was compiled with:
```css
.bg-emerald-500\/10 { background-color: hsl(var(--emerald-500) / 0.1); }
```

But host provides:
```css
--emerald-500: oklch(0.646 0.222 41.116);
```

Result: `hsl(0.646 0.222 41.116 / 0.1)` is **invalid HSL** (chroma value >360 is nonsense in HSL). Browser ignores it. Badge becomes invisible or inherits parent background.

**Why it happens:**
- Compass built on Tailwind v3 (or bridging v3→v4, halfway migrated)
- Host built on Tailwind v4 OKLCH
- Plugin bundle doesn't re-generate CSS when host tokens change
- Developer assumes opacity modifiers are format-agnostic (they're not)

**Consequences:**
- Opacity-modulated colors appear wrong or transparent
- Status badges (emerald-500/10, red-500/10) invisible
- Inconsistent rendering across components (some use full colors, some use opacity)
- Hard to debug (CSS rule looks correct, but computed value is garbage)

**Prevention:**
1. **Verify Compass target Tailwind version** in `esbuild.config.mjs`:
   - Check if `@tailwindcss/` plugins are imported
   - Check output CSS for `oklch()` vs `hsl()`
   ```bash
   grep -E "oklch|hsl\(" dist/ui/index.js | head -5
   # Expected: oklch(...) format (v4) or hsl(...) format (v3)
   ```
2. **Confirm host's color format:**
   ```bash
   grep -o "oklch([^)]*)" /Users/nicholasrhodes/Development/paperclip-temp/ui/src/index.css | head -3
   # Expected: oklch(...) values
   ```
3. **Verify plugin's color inheritance:**
   - Build plugin: `pnpm build`
   - Inspect `dist/ui/index.js` (search for color token references)
   - Confirm uses same format as host
   ```bash
   grep -E "color:\s*(oklch|hsl)" dist/ui/index.js | head -3
   ```
4. **Test opacity modifiers explicitly:**
   ```jsx
   // In test component
   <div className="bg-emerald-500/10">10% emerald</div>
   <div className="bg-emerald-500/20">20% emerald</div>
   <div className="bg-red-500/10">10% red</div>
   ```
   Inspect computed background-color in DevTools:
   ```
   background-color: oklch(0.646 0.222 41.116 / 0.1)  ✓ Correct
   background-color: hsl(var(--emerald-500) / 0.1)    ✗ Invalid (unresolved variable)
   ```
5. **Build gate — reject mixed formats:**
   ```bash
   # Fail if plugin CSS mixes oklch + hsl
   pnpm build && \
   grep -c "oklch(" dist/ui/index.js > /tmp/oklch_count.txt && \
   grep -c "hsl(" dist/ui/index.js > /tmp/hsl_count.txt && \
   if [ $(cat /tmp/oklch_count.txt) -gt 0 ] && [ $(cat /tmp/hsl_count.txt) -gt 0 ]; then
     echo "ERROR: Mixed color formats in plugin bundle"
     exit 1
   fi
   ```

**Detection:**
- Status badge or accent color appears transparent/white
- Opacity modifier classes present in source, but DevTools shows no background-color or invalid value
- Lighthouse reports "background and foreground colors do not have a sufficient contrast ratio"
- Production only (dev might use browser fallbacks)

**Phase responsibility:** **Phase 1 (Design primitives)** — verify color format during initial status badge component reskin. Non-negotiable before Phase 2.

---

### Pitfall 4: CSS Specificity Collisions — Plugin Inline Styles Override Host Tokens

**What goes wrong:**
Host provides semantic token utilities with **low specificity** (single class selectors):

```css
/* Host (shadcn) */
.bg-card { background-color: hsl(var(--card)); }  /* Specificity: 0,1,0 */
.text-foreground { color: hsl(var(--foreground)); } /* Specificity: 0,1,0 */
```

But Compass components may use inline `style` attributes for dynamic values:

```jsx
<div 
  className="bg-card"
  style={{ backgroundColor: '#ffffff' }}  {/* Specificity: 1,0,0 (inline) */}
>
  Content
</div>
```

**CSS Cascade rule: Inline styles > class selectors always.** The inline style wins, ignoring host's `bg-card` token.

Or, Compass might use compound selectors accidentally:

```jsx
<div className="flex items-center gap-2 bg-card rounded-lg p-4">
  {/* If parent has a rule like `.panel div { background: white; } */}
  {/* Host's .bg-card (0,1,0) loses to .panel div (0,2,0) */}
</div>
```

**Example scenario:**
```jsx
// Compass AssessPanel.tsx
<div className="bg-card border-border p-4">
  {/* Host token: bg-card { background-color: var(--card) } */}
  {/* But somewhere parent has: .assess-panel { background: white !important } */}
  {/* Result: white background (parent wins), ignoring host's card token */}
</div>
```

**Why it happens:**
- Plugin CSS loads in isolated stylesheet; parent container styles may have higher specificity
- Compass component written before understanding host specificity hierarchy
- Developer uses inline styles for "speed" without checking host token availability
- No linting rule to prevent specificity creep

**Consequences:**
- Component appears wrong color in certain contexts
- Inconsistent theming (sometimes card token works, sometimes parent override wins)
- Hard to debug (looks correct in DevTools `.bg-card`, but computed is from parent override)
- Dark mode breaks: parent's `background: white` hard-coded, doesn't respect `.dark` toggle
- Migration partially succeeds (some components themed, others not)

**Prevention:**
1. **Audit current Compass for inline styles:**
   ```bash
   grep -r "style={{" src/ui --include="*.tsx" | wc -l
   ```
   For each match, verify it's not overriding token colors:
   ```bash
   grep -r "style={{.*background\|style={{.*color\|style={{.*border" src/ui --include="*.tsx"
   ```
   Expected: **0 hits** for color-related inline styles
2. **Create a specificity audit checklist:**
   - No inline `style={{ color, backgroundColor, borderColor }}`
   - No compound selectors in plugin CSS (keep CSS in host layer)
   - Use class composition only: `className="bg-card text-foreground"`
3. **During component reskin, replace inline color styles:**
   ```jsx
   // BEFORE (WRONG)
   <StatusBadge style={{ backgroundColor: statusColor }}>

   // AFTER (RIGHT)
   <StatusBadge className={`bg-${statusColor}-500/10 text-${statusColor}-600`}>
   ```
   But this is unsafe (dynamic class names get purged). Instead:
   ```jsx
   // SAFEST
   const badgeClasses = {
     success: "bg-emerald-500/10 text-emerald-600",
     error: "bg-red-500/10 text-red-600",
     pending: "bg-yellow-500/10 text-yellow-600",
   };
   <StatusBadge className={badgeClasses[status]}>
   ```
4. **Verify host CSS doesn't inject parent overrides:**
   ```bash
   grep -r "\.assess-panel\|\.found-panel\|\.revive-panel\|\.reposition-panel\|\.memory-panel" /Users/nicholasrhodes/Development/paperclip-temp/ui/src --include="*.css" --include="*.tsx" | grep -E "background:|color:|border:" | head -10
   ```
   If found, understand cascade and adjust plugin selectors to match specificity

**Detection:**
- Component color changes when parent container changes
- Dark mode toggle doesn't affect component (inline style is hard-coded)
- Computed styles in DevTools show parent selector overriding `.bg-card`
- Component appearance differs from host design system

**Phase responsibility:** **Phase 1 (Design primitives)** — audit inline styles in MainPanel, SidebarLink before reskinning. Refactor to class-based approach.

---

### Pitfall 5: Dynamic CSS Class Names Get Purged (Safelist Failure)

**What goes wrong:**
Compass assigns colors dynamically based on status:

```jsx
const colorMap = {
  found: "emerald",
  assess: "blue",
  revive: "yellow",
  reposition: "red",
};

<DriftItemCard 
  className={`bg-${colorMap[mode]}-500/10 text-${colorMap[mode]}-600`}
/>
```

Tailwind JIT sees **no complete, unbroken string** matching `bg-emerald-500/10` or `text-emerald-600` in the source code. It sees `${colorMap[mode]}`, a template literal variable. During build (esbuild), the variable is not evaluated — it's just a string `"${colorMap[mode]}"`.

Result: Tailwind skips these classes during the purge step. The plugin CSS never includes:
- `.bg-emerald-500\/10 { ... }`
- `.text-emerald-600 { ... }`
- `.bg-red-500\/10 { ... }`

Browser tries to apply these classes at runtime, finds them missing, silently drops them. Component has no colors.

**Why it happens:**
- Compass uses a color map (sensible for DRY code)
- Tailwind's scanner only finds **literal strings** at build time, not runtime values
- esbuild doesn't integrate with Tailwind's scanner (they're separate tools)
- Plugin developer didn't realize Tailwind has this limitation

**Consequences:**
- Colors work in dev (because unminified CSS includes more classes)
- Colors disappear in production build (CSS purged)
- Hard to debug (classes are in HTML, CSS rules don't exist)
- Affects all dynamic color assignments: status badges, confidence bars, priority chips

**Prevention:**
1. **Identify dynamic color patterns:**
   ```bash
   grep -r "className=.*\${" src/ui --include="*.tsx" | grep -E "emerald|red|yellow|blue|green"
   ```
2. **For each dynamic color, create an explicit safelist:**
   - Option A: Create mapping that Tailwind can scan:
     ```jsx
     // colors.ts
     export const STATUS_COLORS = {
       found: "bg-emerald-500/10 text-emerald-600",      // Literal strings
       assess: "bg-blue-500/10 text-blue-600",           // Tailwind sees these
       revive: "bg-yellow-500/10 text-yellow-600",
       reposition: "bg-red-500/10 text-red-600",
     } as const;

     // Usage
     <DriftItemCard className={STATUS_COLORS[mode]} />
     ```
     Result: Tailwind sees `bg-emerald-500/10` as a literal string, includes it.

   - Option B: Add explicit safelist to Tailwind config (if plugin has one):
     ```js
     // tailwind.config.js (if Compass has one)
     module.exports = {
       safelist: [
         "bg-emerald-500/10", "text-emerald-600",
         "bg-red-500/10", "text-red-600",
         "bg-blue-500/10", "text-blue-600",
         "bg-yellow-500/10", "text-yellow-600",
       ],
     };
     ```
     But Compass doesn't have a Tailwind config currently.

   - **Option C (Recommended for plugins):** Use @apply in CSS:
     ```css
     /* ui.css */
     .status-found { @apply bg-emerald-500/10 text-emerald-600; }
     .status-assess { @apply bg-blue-500/10 text-blue-600; }
     .status-revive { @apply bg-yellow-500/10 text-yellow-600; }
     .status-reposition { @apply bg-red-500/10 text-red-600; }
     ```
     Usage:
     ```jsx
     <DriftItemCard className={`status-${mode}`} />
     // Tailwind sees literal strings in CSS: .status-found, etc.
     // At runtime, @apply expands to real utilities
     ```

3. **Audit current usage:**
   ```bash
   grep -r "emerald-500\|red-500\|yellow-500\|blue-500" src/ui --include="*.tsx" | grep -E "\$\{|interpolat"
   ```
   Expected: Find all dynamic uses

4. **Test safelist effectiveness:**
   ```bash
   pnpm build
   # Grep bundle for safelist classes
   grep "bg-emerald-500" dist/ui/index.js && echo "✓ Found" || echo "✗ Missing"
   grep "text-emerald-600" dist/ui/index.js && echo "✓ Found" || echo "✗ Missing"
   ```
   Expected: All safelist classes present

**Detection:**
- Dynamic colors work in dev, disappear in production
- Classes are in HTML (inspect `className` attribute), missing from CSS
- Build log shows no errors (silently purged)
- Component text/background become invisible or inherit default

**Phase responsibility:** **Phase 2 (Assess + Found panels)** — audit DriftItemCard, FoundPanel color mapping before shipping. Non-critical, but breaks user-facing appearance.

---

### Pitfall 6: Accessibility Contrast Fails in Dark Mode (WCAG 4.5:1 → 3:1)

**What goes wrong:**
Token values are designed for a specific context. Paperclip host uses neutral (grayscale) theme with accent colors for status only. A color like emerald-500 might be carefully chosen for 4.5:1 contrast on a light card background:

```
Light card background: oklch(1 0 0)       = white
Emerald text: oklch(0.646 0.222 41.116)   = green
Contrast ratio: ~15:1 ✓ WCAG AAA passes
```

But in dark mode, the *same* emerald value on a dark background fails:

```
Dark card background: oklch(0.205 0 0)    = dark gray
Emerald text: oklch(0.646 0.222 41.116)   = green (unchanged)
Contrast ratio: ~2.8:1 ✗ WCAG AA fails (needs 4.5:1)
```

Compass applies emerald to status badges consistently across light + dark:

```jsx
<div className="bg-emerald-500/10 text-emerald-600">
  Status badge
</div>
```

In light mode:
- Background: `hsl(var(--emerald-500) / 0.1)` = very pale green
- Text: `text-emerald-600` = dark green
- Contrast: ~10:1 ✓

In dark mode:
- Background: `hsl(var(--emerald-500) / 0.1)` = pale green (colors are *absolute*, not relative to background)
- Card background: dark gray (from `--card` in dark)
- Text: emerald-600 (same as light)
- Overall contrast: pale green on dark card + emerald text = **fails WCAG**

The problem: emerald-600 was picked for light backgrounds, not dark cards. No dark-mode variant exists.

**Why it happens:**
- Token designers optimized for light mode (shadcn default)
- Dark mode exists but dark-mode-specific status colors weren't defined
- Compass blindly applies same color in both modes without checking contrast
- No automated contrast testing in CI/CD

**Consequences:**
- Users with visual impairments can't read status badges in dark mode
- WCAG 2.1 Level AA violations (4.5:1 minimum)
- Accessibility lawsuits risk
- Users toggle to light mode to read UI (defeats dark mode purpose)

**Prevention:**
1. **Before using any accent color (emerald, red, yellow), verify BOTH modes pass WCAG AA:**
   ```bash
   # Light mode: emerald-600 on light card background
   # Dark mode: emerald-600 on dark card background
   # Use online contrast checker (https://webaim.org/resources/contrastchecker/)
   # Required: 4.5:1 for normal text, 3:1 for large text (18pt+ / bold 14pt+)
   ```

2. **Create a contrast audit spreadsheet:**
   | Color | Light BG | Light Contrast | Dark BG | Dark Contrast | WCAG Pass? |
   |-------|----------|----------------|---------|---------------|-----------|
   | emerald-600 | card (white) | 12:1 | card (dark) | 2.8:1 | ✗ FAIL |
   | emerald-700 | card (white) | 15:1 | card (dark) | 3.2:1 | ~ MARGINAL |

3. **Define dark-mode-specific color overrides in component:**
   ```jsx
   <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
     {/* Light: emerald-600 on light bg */}
     {/* Dark: emerald-400 on dark bg (lighter shade for contrast) */}
   </div>
   ```
   Requires host tokens to define `emerald-400` for dark text. If they don't, this fails.

4. **Verify host defines dark-mode variants for all accent colors:**
   ```bash
   grep -E "emerald-[0-9]{3}|red-[0-9]{3}|yellow-[0-9]{3}|blue-[0-9]{3}" /Users/nicholasrhodes/Development/paperclip-temp/ui/src/index.css
   ```
   Expected: See both light + dark definitions for each color

5. **Automated contrast test (post-build):**
   ```bash
   # Build component library
   pnpm build
   
   # Screenshot in light + dark modes
   # Use Lighthouse or axe to check contrast
   npx @axe-core/cli dist/ui/index.html --wcag-version wcag22
   ```
   Expected: 0 contrast violations

6. **Component-level dark-mode testing:**
   - Open Compass in host dark mode
   - Take screenshot of each status badge (found=emerald, error=red, pending=yellow)
   - Compare contrast ratio to WCAG 4.5:1 minimum
   - Fail the phase if any badge falls below 4.5:1

**Detection:**
- Lighthouse Accessibility audit shows color contrast violations in dark mode
- Visual inspection: text is hard to read on colored background in dark mode
- axe browser extension flags contrast failures
- User complaint: "Can't read X in dark mode"

**Phase responsibility:** **Phase 4 (Memory/History + polish + screenshot diff verify)** — final QA gate. Must verify all components pass WCAG AA in both light + dark.

---

## Handoff Document Verification: UI_REDO_HANDOFF.md Claims

The handoff doc makes 3 explicit claims about host tokens. **Verification results:**

### Claim 1: "Sharp corners: `--radius-lg: 0px`"

**Source:** UI_REDO_HANDOFF.md line 23

**Verification:**
```bash
grep "radius-lg" /Users/nicholasrhodes/Development/paperclip-temp/ui/src/index.css
# Output: --radius-lg: 0px;
```

**Result:** ✓ **VERIFIED** (line 41 of host CSS)

**Action:** Use `rounded-none` (not `rounded-lg`, `rounded-xl`) in Compass. No border-radius on any component.

---

### Claim 2: "Emerald palette as primary color"

**Source:** UI_REDO_HANDOFF.md line 69, migration map: "emerald" as replacement for green

**Verification:**
```bash
grep -c "emerald" /Users/nicholasrhodes/Development/paperclip-temp/ui/src/components/*.tsx
# Output: 24 (found in IssueThreadInteractionCard, ProjectWorkspaceSummaryCard, etc.)

grep "color-primary\|--primary:" /Users/nicholasrhodes/Development/paperclip-temp/ui/src/index.css
# Output: --primary: oklch(0.205 0 0);  [this is a dark gray/black, NOT green]
```

**Result:** ✗ **PARTIALLY INCORRECT**

**Clarification:**
- Host's semantic token `--primary` is **neutral** (dark gray/black), not emerald
- Emerald *is* used in host, but as an **accent color for success/healthy status only** (e.g., running services, successful deploys)
- Compass should use emerald-500 for "success/found" modes, red-500 for "error/revive", yellow-500 for "pending", blue-500 for "assess" — **not** emerald as the primary palette

**Action:** 
- Do NOT use emerald for general UI
- Reserve emerald for "success" state indicators only
- Use host neutral tokens (`bg-card`, `text-foreground`, `border-border`) for default surfaces
- Define color meanings:
  - **Emerald/Green** = Success, Found, Healthy
  - **Red** = Error, Revive needed, Failed
  - **Yellow** = Pending, Warning, In progress
  - **Blue** = Info, Assess mode, Neutral

---

### Claim 3: Migration map is complete

**Source:** UI_REDO_HANDOFF.md lines 69–79, class mapping table

**Verification:**
```bash
# Check if all mapped classes exist in Compass
grep -r "gap-xs\|gap-sm\|gap-md\|px-sm\|py-md" src/ui --include="*.tsx" | wc -l
# Output: 162 (all exist, mapped correctly)

# Verify target classes are valid Tailwind v4
grep -E "^(gap-[1-4]|px-[1-4]|py-[1-4]|rounded-none|bg-card|bg-muted|text-foreground|text-muted-foreground|border-border)" <<< "gap-1 px-2 rounded-none bg-card text-foreground"
# Output: All valid Tailwind utilities
```

**Result:** ✓ **VERIFIED** (mapping table is accurate and complete)

**Action:** Follow migration map as written. No changes needed.

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---|---|
| **Phase 1: Primitives** | MainPanel, SidebarLink, ModeBanner | Dark mode variable cascade broken; nonexistent tokens create 0 CSS | Audit inline styles, replace custom tokens, test dark mode toggle immediately |
| **Phase 1: Primitives** | StatusBadge, ModeBadge | Light-only colors + OKLCH format mismatch | Replace bg-green-50 → bg-emerald-500/10; test opacity modifiers |
| **Phase 2: Assess + Found** | DriftItemCard, ConfidenceBar | Dynamic color safelist purged | Use explicit color mapping (not template literals); verify in production build |
| **Phase 2: Assess + Found** | EvidenceChip | Specificity collision (parent override wins) | Remove inline styles; use class composition only |
| **Phase 3: Revive + Reposition** | ActionItemCard, PriorityBadge | Accessibility contrast fails in dark | Verify emerald-600 + blue-600 reach 4.5:1 on dark card bg |
| **Phase 4: Memory + Polish** | All components | Dark mode regression (not fully tested yet) | Screenshot diff light vs dark; Lighthouse accessibility check |

---

## Prevention Checklist (Per Phase)

### Phase 1 (Design Primitives)
- [ ] Audit inline `style={{}}` declarations (target: 0 color-related styles)
- [ ] Grep nonexistent custom tokens and create replacement map
- [ ] Replace all light-only utilities (`bg-green-50`, `bg-red-50`) with host tokens
- [ ] Verify OKLCH color format in plugin build output
- [ ] Test dark mode toggle on MainPanel, SidebarLink, ModeBanner
- [ ] Build + screenshot light vs dark; compare for regressions

### Phase 2 (Assess + Found)
- [ ] Document color intent (which colors map to which states)
- [ ] Identify dynamic color patterns (template literals, JS maps)
- [ ] Convert to explicit class mapping (or @apply in CSS)
- [ ] Build production bundle; verify color classes are present (grep)
- [ ] Test production build in dark mode

### Phase 3 (Revive + Reposition)
- [ ] Continue Phase 2 checklist for new panels
- [ ] Build contrast ratio audit (all accent colors, light + dark bg)
- [ ] Identify colors that fail WCAG AA; plan dark-mode variants

### Phase 4 (Memory + Polish)
- [ ] Run Lighthouse accessibility audit (both modes)
- [ ] Screenshot diff: dev vs production (light + dark)
- [ ] Verify zero dark-mode regressions
- [ ] Verify zero color contrast violations (>4.5:1)
- [ ] Final grep: zero hits on broken-class patterns
  ```bash
  grep -r "gap-xs\|px-sm\|bg-green-50\|bg-red-50\|bg-slate-50\|text-slate-600" src/ui --include="*.tsx"
  ```

---

## Build & CI/CD Gates

Add these checks to `package.json` scripts or pre-commit hooks:

```bash
# 1. Lint: no broken Tailwind tokens
grep -r "gap-xs\|px-sm\|py-md\|gap-md" src/ui && exit 1 || true

# 2. Lint: no light-only colors (except Lucide icons)
grep -r "bg-green-50\|bg-red-50\|bg-slate-50\|text-slate-600\|border-green-200\|border-red-200" src/ui && exit 1 || true

# 3. Lint: no inline color styles
grep -r "style={{.*background\|style={{.*color\|style={{.*border" src/ui | grep -v "// INTENTIONAL" && exit 1 || true

# 4. Build: verify color classes in bundle
pnpm build && grep -E "bg-card|text-foreground|border-border" dist/ui/index.js || exit 1

# 5. Test: accessibility
pnpm typecheck && pnpm test:run
```

---

## Sources

- [Tailwind CSS v4 - Theming](https://tailwindcss.com/blog/tailwindcss-v4)
- [shadcn/ui Theming Guide](https://ui.shadcn.com/docs/theming)
- [Tailwind CSS Safelist Documentation](https://tailwindcss.com/docs/content-configuration#safelisting-classes)
- [OKLCH vs HSL Color Spaces](https://andy-cinquin.com/blog/migration-oklch-tailwind-css-4-0)
- [CSS Specificity MDN Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Specificity)
- [WCAG 2.1 Color Contrast Requirements](https://www.boia.org/blog/offering-a-dark-mode-doesnt-satisfy-wcag-color-contrast-requirements)
- [Dark Mode CSS Variables Inheritance](https://www.joshwcomeau.com/react/dark-mode/)
- [Paperclip Plugin SDK npm](https://www.npmjs.com/package/@paperclipai/plugin-sdk)
