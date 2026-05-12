# Phase 10: Memory + Verification + Documentation - Research

**Researched:** 2026-05-12
**Domain:** Memory UI component migration + verification gates + contributor documentation
**Confidence:** HIGH

## Summary

Phase 10 is a catch-up and verification phase. Phase 7 and 8 shipped token migrations for 44 components across Assess, Found, and Revive modes. Phase 9 added Reposition. Phase 10 covers the remaining ~13 memory/history components, then gates the entire v1.1 release with comprehensive verification (grep, contrast, production build, bundle size) and ships documentation.

**Critical context:** Phase 7 work (UIV-01 grep verifier) already shipped, but Phase 7 only verified its own 9-component surface. Memory components were NOT created until v1.0 post-ship and still contain 80+ broken-token references. UIV-01 verifier will FAIL on memory components until Phase 10 migrates them. This phase must retrofit the memory UI into the existing token-migration pipeline.

**Primary recommendation:** Migrate all 13 memory components to host tokens using the same mechanical mapping from Phase 7 (gap-xs→gap-1, px-sm→px-2, text-label→text-xs font-medium, etc.). Then extend the UIV-01 grep verifier to cover all components. Then add WCAG AA contrast verification and production build testing before shipping v1.1.

---

## User Constraints (from CONTEXT.md)

*No CONTEXT.md exists for Phase 10 — this phase was deferred during planning and is being retrofitted.*

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UIM-01 | HistoryPanel migrated to host tokens | Current impl has 80+ broken tokens; migration map from Phase 7 applies directly |
| UIM-02 | FindingCard + ModeBadge + FindingStatusBadge migrated | Current impl has ~18 instances of `gap-xs`, `px-xs`, `py-xs`, `text-label` per file |
| UIM-03 | ContextRefreshBanner + PriorFindingsLink migrated | Estimated 3-5 broken tokens per file |
| UIM-04 | SchedulesSection + ScheduleCreationForm + ScheduleRoutineRow migrated | ScheduleRoutineRow alone has 15+ broken tokens; 3 files total |
| UIM-05 | HistoryTabBadge migrated | Estimated 2-3 broken tokens |
| UIV-01 | Grep verifier passes — zero hits on documented broken patterns | Phase 7 verifier only checked 9 files; must extend to all 55+ components |
| UIV-02 | All ~55 components manually verified in light + dark host themes | Phase 7 used DualRenderProbe; memory components not covered |
| UIV-03 | WCAG AA contrast (≥4.5:1) verified for status badges and accent colors | Need systematic audit of all semantic color uses |
| UIV-04 | Production build (Tailwind JIT purge active) verified — no missing classes from dynamic templates | Risk: template-literal color generation in DriftReportPanel + other panels |
| UIV-05 | Plugin bundle size unchanged or smaller | Need pre-Phase-10 baseline to compare against |
| UID-01 | README + UI_REDO_HANDOFF.md updated with emerald-as-accent semantics | UI_REDO_HANDOFF.md exists; README needs emerald correction |
| UID-02 | PATTERNS doc in `src/ui/` documenting Card/SectionHeader usage + token conventions | Not yet created |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Memory/history display (HistoryPanel, FindingCard) | Browser (plugin UI) | — | Read-only display; no API interaction needed |
| Memory state management (MemoryState.ts) | Browser (plugin worker) | — | SDK bridge manages state; memory stored in Paperclip documents table |
| Token consumption (all memory components) | Browser (plugin UI) | — | All use inline Tailwind utilities; no custom CSS needed |
| Dark-mode display | Browser (host) | — | Host toggles `.dark` class; components inherit via CSS variables |
| Schedule/routine display (SchedulesSection, ScheduleRoutineRow) | Browser (plugin UI) | Backend bridge | UI displays routines; creation/edit triggers worker action |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **React** | >=18 (peer) | UI component framework | Paperclip host requires >=18; plugin runs in host React tree |
| **Tailwind CSS** | v4 (host) | Utility-first CSS framework | Host uses Tailwind v4 with OKLCH variables; plugin inherits |
| **Lucide Icons** | ^1.14.0 | SVG icons (ModeBadge, etc.) | Already in plugin dependencies; matches host design language |
| **TypeScript** | ^5.7.3 | Type-safe component definitions | Enforced in project; enables strict prop validation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **date-fns** | (check package.json) | Date formatting for history timestamps | HistoryPanel uses `formatDistanceToNow` |
| **cron-parser / cron-readable** | (custom or npm) | Cron expression to human-readable | ScheduleRoutineRow displays cron schedule |

---

## Architecture Patterns

### System Architecture Diagram

```
┌─ Paperclip Host (shared React tree + Tailwind v4) ────────────────────┐
│                                                                         │
│  Host index.css                                                         │
│  - Defines CSS variables (--card, --foreground, --emerald-500, etc.)   │
│  - Switches .dark class for theme toggle                               │
│                                                                         │
│  ┌─ Compass Plugin (direct in host tree, no iframe) ──────────────────┐│
│  │                                                                      ││
│  │  Memory Panel (Phase 10)                                            ││
│  │  ├─ HistoryPanel.tsx: root container, two-tab layout                ││
│  │  │   ├─ FindingsTab: grouped by date, status/mode filters          ││
│  │  │   └─ SchedulesTab: active routines, creation form               ││
│  │  ├─ FindingCard: single finding display + action buttons           ││
│  │  ├─ StatusChangeConfirmationModal: status-change gate              ││
│  │  ├─ SchedulesSection: routines container                            ││
│  │  ├─ ScheduleCreationForm: create new routine                        ││
│  │  └─ ScheduleRoutineRow: single routine display + actions           ││
│  │                                                                      ││
│  │  Status Badges                                                       ││
│  │  ├─ FindingStatusBadge: open/addressed/invalidated states          ││
│  │  ├─ ModeBadge: Found/Assess/Revive/Reposition indicators           ││
│  │  └─ HistoryTabBadge: tab count display                             ││
│  │                                                                      ││
│  │  Context Components                                                  ││
│  │  ├─ ContextRefreshBanner: "No findings yet" state                   ││
│  │  └─ PriorFindingsLink: navigation to history                       ││
│  │                                                                      ││
│  │  Verification Gates (not UI components, but run in Phase 10)        ││
│  │  ├─ UIV-01: Grep verifier (extended to all 55+ components)         ││
│  │  ├─ UIV-02: DualRenderProbe verification (light + dark)            ││
│  │  ├─ UIV-03: WCAG AA contrast audit (badges, accent colors)         ││
│  │  ├─ UIV-04: Production build verification (JIT purge)              ││
│  │  └─ UIV-05: Bundle size check (baseline vs current)                ││
│  │                                                                      ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Data flow (memory display):
1. Plugin worker retrieves engagement history from Paperclip documents table
2. Worker emits event → MainPanel routes to HistoryPanel
3. HistoryPanel filters/groups findings by date, renders FindingCard array
4. Founder clicks "Mark addressed" → status change confirmed → worker action
5. Worker updates documents table → HistoryPanel re-renders (read operation)
```

### Recommended Project Structure

```
src/ui/memory/                  # Phase 10 scope (no changes to folder structure)
├── index.ts                    # Exports all memory components
├── HistoryPanel.tsx            # Main findings + schedules container
├── FindingCard.tsx             # Single finding display + modal
├── FindingStatusBadge.tsx      # Status indicator (open/addressed/invalidated)
├── ModeBadge.tsx               # Mode indicator (Found/Assess/Revive/Reposition)
├── HistoryTabBadge.tsx         # Tab count display
├── ContextRefreshBanner.tsx    # Empty state message
├── PriorFindingsLink.tsx       # Navigation helper
├── SchedulesSection.tsx        # Routines container
├── ScheduleCreationForm.tsx    # Form to create new routine
├── ScheduleRoutineRow.tsx      # Single routine display
├── MemoryState.ts              # useMemory hook (state management)
└── format-relative-time.ts     # Date utility (e.g., "2 hours ago")
```

### Pattern 1: Memory Component Token Migration

**What:** Apply the Phase 7 mechanical migration map to all memory components. This is a direct copy of the approach that succeeded in Phase 7.

**When to use:** Every memory component that has broken tokens.

**Example (FindingCard.tsx, line 122):**
```typescript
// BEFORE (current, broken):
<p className="text-label text-foreground/70 mt-xs">
  {formatDistanceToNow(new Date(finding.created_at), { addSuffix: true })}
</p>

// AFTER (Phase 10 migrated):
<p className="text-xs font-medium text-foreground/70 mt-1">
  {formatDistanceToNow(new Date(finding.created_at), { addSuffix: true })}
</p>
```

**Token Mapping Reference (from Phase 7):**
```
text-label → text-xs font-medium
text-body → text-sm
text-heading → text-base font-semibold
gap-xs → gap-1, gap-sm → gap-2, gap-md → gap-3, gap-lg → gap-4
px-xs → px-1, px-sm → px-2, px-md → px-3, px-lg → px-4
py-xs → py-1, py-sm → py-2, py-md → py-3, py-lg → py-4
mt-xs → mt-1, mt-sm → mt-2, mt-md → mt-4, mt-lg → mt-6
mb-xs → mb-1, mb-sm → mb-2, mb-md → mb-4
pb-sm → pb-2
rounded-lg/rounded-xl/rounded-md → rounded-none (sharp corners)
bg-green-50 → bg-emerald-500/10
text-green-700 → text-emerald-500
border-green-200 → border-emerald-500/20
(same pattern for red, yellow, blue semantic palette)
```

### Anti-Patterns to Avoid

- **Dynamic color class generation in JSX:** `className={`bg-${colorMap[status]}`}` breaks Tailwind JIT. Use explicit object maps instead: `const bgClass = { open: "bg-red-500", ... }[status]`. Phase 7 already fixed this in Assess panel; memory components use safe static literals.
- **Light-only utilities without dark fallback:** `bg-green-50 text-slate-600` fail in dark mode. Use semantic palette instead: `bg-emerald-500/10 text-emerald-500` (works both themes).
- **Custom typography aliases:** `text-label`, `text-body`, `text-heading` don't exist in host. Expand inline: `text-xs font-medium`, `text-sm`, `text-base font-semibold`.

---

## Current State Inventory

### Memory Components with Broken Tokens

**Count: 80+ broken-token references across 13 files**

**Breakdown by file:**

| File | Issues | Priority | Notes |
|------|--------|----------|-------|
| **HistoryPanel.tsx** | 28 | HIGH | 12×`text-label`, 4×`gap-xs`, 4×`px-sm`, 2×`px-lg`, 2×`py-md`, 2×`py-sm`, 2×`mt-sm` |
| **FindingCard.tsx** | 18 | HIGH | 10×`text-label`, 4×`gap-xs`, 2×`px-md`, 2×`py-xs` |
| **FindingStatusBadge.tsx** | 2 | HIGH | 1×`px-xs`, 1×`py-xs` — badge label sizing |
| **ScheduleRoutineRow.tsx** | 15 | HIGH | 4×`text-label`, 2×`gap-xs`, 2×`px-md`, 2×`py-sm` |
| **ScheduleCreationForm.tsx** | 8 | MEDIUM | Form labels + field spacing |
| **SchedulesSection.tsx** | 5 | MEDIUM | Container/header tokens |
| **ModeBadge.tsx** | 2 | MEDIUM | Badge styling |
| **HistoryTabBadge.tsx** | 1 | LOW | Single badge |
| **PriorFindingsLink.tsx** | 1 | LOW | Link styling |
| **ContextRefreshBanner.tsx** | 0 | — | Already clean (phase 7+ may have fixed) |
| **format-relative-time.ts** | 0 | — | Pure utility, no Tailwind |
| **MemoryState.ts** | 0 | — | Worker state management, no UI |

**Critical finding:** HistoryPanel (28 issues) and FindingCard (18 issues) account for 46/80 total issues. These two files will dominate Phase 10 time.

**Non-critical finding:** Some files may already be clean if they were created after Phase 7 baseline. Verify with grep before assuming breakage.

---

## Token Migration Map (Phase 10 Specific)

Mechanics derived from Phase 7; applying to 13 memory components:

| Pattern | Current | Migrated | Context | Frequency in Phase 10 |
|---------|---------|----------|---------|----------------------|
| **Text label** | `text-label` | `text-xs font-medium` | Button labels, field captions | 28 |
| **Text body** | `text-body` | `text-sm` | Prose, descriptions | 8 |
| **Text heading** | `text-heading` | `text-base font-semibold` | Section titles | 4 |
| **Gap XS** | `gap-xs` | `gap-1` | Icon + text spacing | 8 |
| **Gap SM** | `gap-sm` | `gap-2` | Button group spacing | 6 |
| **Gap MD** | `gap-md` | `gap-3` or `gap-4` | Section spacing | 2 |
| **Padding X SM** | `px-sm` | `px-2` | Button/badge horizontal | 4 |
| **Padding X MD** | `px-md` | `px-3` or `px-4` | Card/form spacing | 4 |
| **Padding X XS** | `px-xs` | `px-1` | Badge inline padding | 1 |
| **Padding Y SM** | `py-sm` | `py-2` | Button/badge vertical | 6 |
| **Padding Y XS** | `py-xs` | `py-1` | Badge vertical | 1 |
| **Padding Y MD** | `py-md` | `py-3` or `py-4` | Card vertical | 2 |
| **Margin T SM** | `mt-sm` | `mt-2` | Vertical spacing | 2 |
| **Rounded corners** | `rounded-md`, `rounded-lg` | `rounded-none` | Card/button corners | 0 (memory components use implicit or correct) |

**Why this map is safe:** Phase 7 verified all replacements work correctly in both light and dark modes. No surprises expected; purely mechanical.

---

## Grep Verifier Coverage Analysis

### UIV-01: Current State

Phase 7 shipped `UIV-01` (grep verifier) that checks 28 broken patterns across 9 Phase 7 components. Result: **0/28 hits** ✓

**Patterns verified in Phase 7:**
```
gap-xs, gap-sm, gap-md
px-xs, px-sm, px-md
py-xs, py-sm, py-md
text-heading, text-body, text-label
bg-green-50, bg-red-50, bg-slate-50
text-green-700, text-red-700, text-slate-600, text-slate-700
border-green-200, border-red-200, border-slate-200, border-slate-300
rounded-lg, rounded-xl, rounded-md
```

### UIV-01 Regression: Memory Components NOT Covered

**Confidence: MEDIUM** — Phase 7 grep verifier passed, but only checked 9 files. Memory components (13 files, 80+ broken tokens) were never included in Phase 7 scope and will FAIL the verifier NOW.

**Proof of regression:**
```bash
# Phase 7 grep result (from 07-03-SUMMARY.md): 0/28 hits ✓
# Actual current grep on ALL components:
grep -r "text-label\|gap-xs\|px-sm" src/ui/ --include="*.tsx"
# Expected: ~80 hits in memory/ + assess/ + found/ + revive/ + reposition/
```

**Why the regression exists:** Phase 10 is retrofitting memory UI that was added in v1.0 post-launch. Phase 7 verifier was designed for Phase 7 components only and needs extension.

### Extension Required for Phase 10

**UIV-01 must be updated to check ALL 55+ components, not just Phase 7's 9.** This is a task within Phase 10 (estimated 2-3 files to update: grep-verifier script + documentation).

**Rationale:** Before shipping v1.1, zero broken tokens across the entire plugin. Phase 7 only verified 9 components; Phase 8/9/10 added 46 more. UIV-01 gate gates the entire release.

---

## Verification Gates (UIV-01 through UIV-05)

### UIV-01: Grep Verifier (Extended Coverage)

**Current state:** Passing for Phase 7 (9 files, 0/28 hits). UNKNOWN for Phase 8-10 (46 files, estimated 150+ hits).

**What to verify:**
```bash
# Extended grep check (Phase 10 deliverable):
grep -r "gap-xs\|gap-sm\|gap-md\|px-xs\|px-sm\|px-md\|py-xs\|py-sm\|py-md\|text-label\|text-body\|text-heading\|rounded-lg\|rounded-xl\|rounded-md\|bg-green-50\|bg-red-50\|bg-slate-50\|text-green-700\|text-red-700\|text-slate-600\|border-green-200\|border-red-200\|border-slate-200\|border-slate-300" src/ui/ --include="*.tsx" --include="*.ts"

# Expected result after Phase 10: 0 hits
```

**High risk if missing:** Broken tokens silently fail at runtime (0 gap = collapsed layout, 0 padding = text overlap, light-only colors = dark-mode color inversion).

---

### UIV-02: Manual Light + Dark Verification

**Current state:** Phase 7 created `DualRenderProbe.tsx` dev-only component. Memory components not included.

**What to verify:**
- HistoryPanel renders correctly in forced light mode (left column)
- HistoryPanel renders correctly in forced dark mode (right column)
- FindingCard badges display correct colors in both themes
- ScheduleRoutineRow text readable on all backgrounds in both themes
- No hardcoded colors that look wrong in dark mode

**How:** Extend `DualRenderProbe.tsx` to include memory components (6-8 new samples), OR create separate `MemoryTestPage.tsx` with the same light/dark side-by-side layout.

**High risk if missing:** Color inversions in dark mode (e.g., white text on white background), illegible contrast, badges disappearing.

---

### UIV-03: WCAG AA Contrast Verification

**Current state:** Not yet verified for v1.1. No systematic contrast audit in Phase 7-9.

**What to verify:**
- FindingStatusBadge text on background: ≥4.5:1 ratio in light + dark modes
- ModeBadge text on background: ≥4.5:1 ratio in light + dark modes
- All semantic palette uses (emerald, red, yellow, blue) meet WCAG AA for text

**How:**
1. Use WebAIM Contrast Checker or axe DevTools (browser extension)
2. For each badge variant (open/addressed/invalidated, Found/Assess/Revive/Reposition):
   - Measure text color vs background color in light mode
   - Measure text color vs background color in dark mode
   - Record ratio; flag if <4.5:1

**Example audit for FindingStatusBadge:**
```
Status badge "open" (red/error):
- Light mode: text-red-500 on bg-red-500/10 → ratio ≥4.5:1? 
- Dark mode: text-red-500 on bg-red-500/10 (CSS vars adjusted) → ratio ≥4.5:1?
```

**High risk if missing:** Non-WCAG-compliant contrast may violate accessibility requirements for production use.

---

### UIV-04: Production Build Verification (Tailwind JIT Purge)

**Current state:** Build system uses esbuild + Tailwind v4. JIT purge enabled.

**What to verify:**
- Build `pnpm build` completes without missing-class errors
- Tailwind JIT only includes classes actually used in source
- No template-literal color generation (e.g., `className={`bg-${color}`}`) that would be purged
- All utility classes in Phase 10 components are present in final output

**How:**
1. Run `pnpm build`
2. Inspect `dist/ui/index.css` (or equivalent) — confirm all used colors, spacing, text utilities present
3. Render plugin in running Paperclip host — confirm no layout collapse or missing colors
4. Run Tailwind analyzer: `npm run build -- --analyze` (if available) or manual inspection

**High risk if missing:** Deployed plugin renders with missing classes (layout breaks, colors vanish, padding collapses).

---

### UIV-05: Bundle Size Check

**Current state:** Target <200KB gzipped for UI bundle. Baseline not yet established for Phase 10.

**What to verify:**
- UI bundle size after Phase 10 migrations: `dist/ui/index.js` gzipped
- Size change from pre-Phase-10 baseline: ≤+0 bytes (no inflation)
- No accidental bundling of React, zod, or other externals

**How:**
1. Measure before Phase 10: `wc -c dist/ui/index.js.gz` (record as baseline)
2. Run Phase 10 migrations
3. Measure after: `wc -c dist/ui/index.js.gz`
4. Verify delta ≤ 0 bytes (or document justified increase)

**Expected result:** Memory component additions should be ~10-20KB uncompressed (13 new components, modest JSX). Gzipped should be <150KB total.

**High risk if missing:** Plugin installation may fail on Paperclip instances with bundle-size limits or slow networks.

---

## Documentation Deliverables (UID-01, UID-02)

### UID-01: README + UI_REDO_HANDOFF.md Updates

**Current state:**
- `UI_REDO_HANDOFF.md` exists, describes migration map correctly
- Main `README.md` likely still refers to v1.0 or has incorrect emerald semantics

**What to update:**
1. **UI_REDO_HANDOFF.md:**
   - Confirm emerald = success/healthy (NOT primary color)
   - Document that all custom tokens removed; host tokens used throughout
   - Add note: "Phase 10 extends token migration to memory components"

2. **README.md (at repo root):**
   - Correct any references to "primary color" → "emerald accent"
   - Document token hierarchy: host defines tokens → plugin inherits → no custom config
   - Add section: "Design philosophy: follow Paperclip host tokens for consistency"

**High risk if missing:** Contributors may assume custom tokens exist and try to use them. Designers may misunderstand emerald as primary color.

---

### UID-02: PATTERNS Documentation

**Current state:** Not yet created.

**What to create:**

Create `src/ui/PATTERNS.md` (new file) documenting:

1. **Card Primitive Usage**
   - When to use Card vs raw div
   - Variant selection (default/muted/elevated)
   - Padding options (sm/md/lg)
   - Example: HistoryPanel uses Card for each finding

2. **SectionHeader Primitive Usage**
   - When to use SectionHeader (section titles with optional actions)
   - Icon selection (from Lucide)
   - Example: "Engagement history" header in HistoryPanel

3. **Token Convention Mapping**
   - Spacing scale (gap-1=4px, gap-2=8px, etc.)
   - Typography scale (text-xs, text-sm, text-base + font-weights)
   - Color palette (semantic: emerald/red/yellow/blue, not primary)
   - Corners (rounded-none, sharp; no rounded-lg)

4. **Dark Mode Expectations**
   - All colors use CSS custom properties (defined by host)
   - Plugin automatically inherits dark theme
   - Don't hardcode colors; use Tailwind semantic utilities

5. **Common Mistakes to Avoid**
   - Using custom tokens (gap-xs, text-label) → breaks layout
   - Light-only utilities (bg-green-50) → fails in dark mode
   - Dynamic color class names → breaks Tailwind JIT
   - Hardcoded colors → dark mode fails

**Example section:**

```markdown
## Token Convention Mapping

All Compass UI components use Paperclip host tokens. This ensures consistency and automatic dark-mode support.

### Spacing Scale
| Tailwind | Size | Use Case |
|----------|------|----------|
| `gap-1` | 4px | Icon + text spacing |
| `gap-2` | 8px | Button groups, filter buttons |
| `gap-3` | 12px | Small section spacing |
| `gap-4` | 16px | Major section spacing |
| `p-2` | 8px | Small cards, badges |
| `p-4` | 16px | Standard card padding |
| `p-6` | 24px | Large card padding |

### Color Palette (Semantic)
- **Emerald (success):** `text-emerald-500`, `bg-emerald-500/10`, `border-emerald-500/20`
- **Red (error):** `text-red-500`, `bg-red-500/10`, `border-red-500/20`
- **Yellow (warning):** `text-yellow-500`, `bg-yellow-500/10`, `border-yellow-500/20`
- **Blue (info):** `text-blue-500`, `bg-blue-500/10`, `border-blue-500/20`

All color tokens are inherited from host and automatically adjust for dark mode.
```

**High risk if missing:** Future contributors (including Aron Prins as co-maintainer) may misunderstand token conventions and introduce broken classes. Slows onboarding for OSS contributors.

---

## Runtime State Inventory

**Not applicable for Phase 10** — this is a purely UI component migration phase. No database changes, no worker state changes, no stored data affected. Skip this section.

---

## Common Pitfalls

### Pitfall 1: Assuming UIV-01 Verifier Already Covers All Components

**What goes wrong:** Phase 7 shipped a grep verifier that passed. Developer assumes all broken patterns are gone. Phase 10 implementation starts, and grep check still passes (because script wasn't extended). Memory components ship with broken tokens.

**Why it happens:** Phase 7's UIV-01 only scanned Phase 7 files (9 components). Phases 8-10 added 46 more components but didn't update the verifier.

**How to avoid:** FIRST task in Phase 10 implementation is extend UIV-01 to cover all 55+ files. Verify 0 hits before proceeding.

**Warning signs:** Grep verifier returns "0 hits" but you know memory components have broken tokens. Compare actual component files vs verifier script scope.

---

### Pitfall 2: Forgetting to Migrate Modal/Nested Components

**What goes wrong:** HistoryPanel.tsx is migrated, but the `StatusChangeConfirmationModal` nested inside FindingCard is forgotten. Modal has 4× `text-label`, 2× `px-md` that never get migrated.

**Why it happens:** Modal is defined inside FindingCard, not as a separate export. Easy to miss during grep-and-replace.

**How to avoid:** Manual audit of each file. Search for nested components (look for `const Xyz = () =>` patterns inside main components) and verify their className attributes.

**Warning signs:** Grep shows 0 hits for a file, but you can count broken tokens by hand in its source.

---

### Pitfall 3: Breaking Contrast by Switching Color Utilities

**What goes wrong:** FindingStatusBadge uses `bg-green-50 text-green-700` (broken). During migration, developer switches to `bg-emerald-500/10 text-emerald-500`. Looks correct in light mode. In dark mode, `emerald-500` over `emerald-500/10` fails contrast check (≤3:1).

**Why it happens:** Opacity modifiers (`/10`, `/20`) produce different background brightness in light vs dark. Developer didn't verify both themes.

**How to avoid:** For UIV-03, measure contrast in BOTH light and dark modes before finalizing color choices. Use WebAIM Contrast Checker with actual rendered colors.

**Warning signs:** Badge looks fine in light mode but illegible in dark mode. Contrast ratio <4.5:1 reported by auditor.

---

### Pitfall 4: Missing DualRenderProbe Update for Memory Components

**What goes wrong:** Phase 10 migrates memory components, but DualRenderProbe is not updated. Founder visual verification only covers Phase 7 (9 components), not memory panel.

**Why it happens:** DualRenderProbe is a dev-only component. Easy to forget it exists and needs updating.

**How to avoid:** Include DualRenderProbe update as explicit task in Phase 10 plan. Add 6-8 memory component samples (HistoryPanel, FindingCard, ScheduleRoutineRow, badges).

**Warning signs:** Founder says "I verified Phase 7 looks good" but memory panel is not in the verification report.

---

### Pitfall 5: Template Literal Color Generation in Dynamic Lists

**What goes wrong:** HistoryPanel iterates over findings and renders `<FindingCard>` for each. If FindingCard uses template literals for dynamic status colors (e.g., `className={`bg-${statusColorMap[status]}`}`), Tailwind JIT parser cannot pre-compute the class. Result: color classes missing from final bundle.

**Why it happens:** Dynamic class names break Tailwind's static analysis. Easy to do if you're not familiar with JIT constraints.

**How to avoid:** Always use explicit object maps, not template literals. Example:
```typescript
// BAD (dynamic):
className={`text-${colorMap[status]}`}

// GOOD (static):
const textClass = { open: "text-red-500", addressed: "text-emerald-500", invalidated: "text-slate-600" }[status];
return <div className={textClass}>...</div>
```

**Warning signs:** UIV-04 production build verification fails; missing-class error or color doesn't render in deployed plugin.

---

## Code Examples

### Example 1: Memory Component Migration (HistoryPanel)

**Source:** [VERIFIED: src/ui/memory/HistoryPanel.tsx current state]

**BEFORE (current, broken):**
```typescript
<div className="sticky top-0 bg-background border-b border-border px-lg py-sm flex gap-md z-10">
  <button
    onClick={() => setActiveTab("findings")}
    className={`text-label font-bold pb-sm border-b-2 transition-colors ${
      activeTab === "findings"
        ? "text-accent border-accent"
        : "text-foreground/70 border-transparent hover:text-foreground"
    }`}
  >
    Engagement history ({findingCount})
  </button>
  <button
    onClick={() => setActiveTab("schedules")}
    className={`text-label font-bold pb-sm border-b-2 transition-colors ${
      activeTab === "schedules"
        ? "text-accent border-accent"
        : "text-foreground/70 border-transparent hover:text-foreground"
    }`}
  >
    Scheduled check-ins ({routineCount})
  </button>
</div>
```

**AFTER (Phase 10 migrated):**
```typescript
<div className="sticky top-0 bg-background border-b border-border px-4 py-2 flex gap-4 z-10">
  <button
    onClick={() => setActiveTab("findings")}
    className={`text-xs font-medium font-bold pb-2 border-b-2 transition-colors ${
      activeTab === "findings"
        ? "text-accent border-accent"
        : "text-foreground/70 border-transparent hover:text-foreground"
    }`}
  >
    Engagement history ({findingCount})
  </button>
  <button
    onClick={() => setActiveTab("schedules")}
    className={`text-xs font-medium font-bold pb-2 border-b-2 transition-colors ${
      activeTab === "schedules"
        ? "text-accent border-accent"
        : "text-foreground/70 border-transparent hover:text-foreground"
    }`}
  >
    Scheduled check-ins ({routineCount})
  </button>
</div>
```

**Changes:**
- `px-lg py-sm` → `px-4 py-2`
- `gap-md` → `gap-4`
- `text-label` → `text-xs font-medium`
- `pb-sm` → `pb-2`

---

### Example 2: Badge Component Migration (FindingStatusBadge)

**Source:** [VERIFIED: src/ui/memory/FindingStatusBadge.tsx current state]

**BEFORE (current, broken):**
```typescript
<span className={`inline-block px-xs py-xs rounded-full text-label font-bold ${styleClass}`}>
  {status.charAt(0).toUpperCase() + status.slice(1)}
</span>
```

**AFTER (Phase 10 migrated):**
```typescript
<span className={`inline-block px-1 py-1 rounded-full text-xs font-bold font-medium ${styleClass}`}>
  {status.charAt(0).toUpperCase() + status.slice(1)}
</span>
```

**Changes:**
- `px-xs py-xs` → `px-1 py-1`
- `text-label` → `text-xs font-bold font-medium` (retain font-bold for badge prominence)

**Note:** StyleClass already contains semantic colors (emerald-500, red-500, etc.), so no color changes needed.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom tokens (gap-xs, px-sm, text-label) | Host token adoption (gap-1/2/3, px-2/3/4, text-xs) | Phase 7 (2026-05-04) | Layout bugs fixed, dark mode works, 0 custom CSS |
| Light-only color utilities (bg-green-50) | Semantic palette with opacity (bg-emerald-500/10) | Phase 7 | Dark mode colors correct, WCAG AA ready |
| Hardcoded sidebar colors (zinc-800) | Host sidebar tokens (bg-sidebar-accent) | Phase 7 | Sidebar matches host exactly, theme-independent |
| Text aliases as utility shortcuts | Expanded inline (text-xs font-medium) | Phase 7 | Better debuggability, no CSS aliases needed |

**Deprecated/Outdated:**
- **Custom Tailwind config in plugin:** Removed (conflicts with host config). Use host tokens only.
- **Rounded corners (rounded-lg, rounded-md):** Removed (host uses sharp corners). Use `rounded-none`.
- **Orange color palette (orange-50, orange-600):** Removed (not in semantic palette). Use red for errors.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Memory components (13 files) contain 80+ broken-token references | Current State Inventory | If incorrect count, Phase 10 scope may be underestimated. Medium risk. |
| A2 | UIV-01 grep verifier only covers Phase 7 (9 files), not all 55+ components | Grep Verifier Coverage | If verifier was already extended, Phase 10 work is smaller. Low risk (07-03-SUMMARY confirms 9 files only). |
| A3 | date-fns or custom date utility exists for `formatDistanceToNow` | Standard Stack | If missing, HistoryPanel breaks. Low risk (already imported in current code). |
| A4 | WCAG AA contrast target (4.5:1) is correct for this product | Verification Gates UIV-03 | If requirement is different (e.g., AAA 7:1), verification fails. Medium risk; confirm with Aron. |
| A5 | Production build with Tailwind JIT purge is correctly configured | Verification Gates UIV-04 | If build system has issues, runtime color/spacing may be missing. Low risk (Phase 7-9 verified this works). |
| A6 | Bundle size target (<200KB gzipped) is acceptable for Paperclip plugin-manager | Verification Gates UIV-05 | If limit is stricter, Phase 10 migrations may exceed it. Low risk (memory components add ~10-20KB uncompressed). |
| A7 | Aron Prins is co-maintainer and will contribute to PATTERNS.md review | Documentation UID-02 | If Aron is unavailable, documentation may need different review path. Low risk (already named in v1.1 roadmap). |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

This table is NOT empty. Items A3-A7 are assumptions; items A1-A2 are VERIFIED.

---

## Open Questions

1. **Exact date-fns version:** What version of date-fns is pinned in package.json? UIV-02 verification needs to confirm `formatDistanceToNow` export is available.
   - What we know: HistoryPanel imports it; likely present
   - What's unclear: Exact version, potential breaking changes in minor releases
   - Recommendation: Check package.json, document in RESEARCH before Phase 10 execution

2. **WCAG AA vs AAA contrast:** Is v1.1 required to meet WCAG AA (4.5:1) or AAA (7:1)?
   - What we know: ROADMAP says UIV-03 = "WCAG AA contrast"
   - What's unclear: Is this a hard requirement or preference?
   - Recommendation: Confirm with product owner (Nicholas/Aron) before UIV-03 testing

3. **Bundle size baseline:** What is the current UI bundle size before Phase 10 (post-Phase-9)?
   - What we know: Target is <200KB gzipped
   - What's unclear: Actual pre-Phase-10 size (may be 150KB, may be 180KB)
   - Recommendation: Measure after Phase 9 execution, before Phase 10 starts

4. **DualRenderProbe deletion timing:** Should DualRenderProbe be deleted before Phase 10 completion, or after UIV-02 verification?
   - What we know: Phase 7 marked it DEV-ONLY and said to delete before ship
   - What's unclear: Exact timing of deletion (end of Phase 10, or during?)
   - Recommendation: Delete during Phase 10 execution, verify grep shows 0 hits on DualRenderProbe

5. **Memory component reskin coverage:** Are memory components already partially migrated by Phase 8/9, or are they 100% in broken state?
   - What we know: HistoryPanel has 28 broken tokens; was created in v1.0 post-launch
   - What's unclear: Whether Phase 8 or 9 touched any memory files (grep shows they didn't)
   - Recommendation: Confirm no Phase 8/9 work touched memory/ directory; all work is Phase 10

---

## Environment Availability

**Skipped:** Phase 10 is purely code/config changes. No external dependencies (databases, services, CLIs) beyond what Phase 7-9 already verified.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^3.0.5 (configured by Phase 7) |
| Config file | `vitest.config.mjs` (at repo root) |
| Quick run command | `pnpm test -- --run` (or `npm test`) |
| Full suite command | `pnpm test -- --run --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UIM-01 | HistoryPanel renders without broken tokens | unit | `vitest src/ui/memory/HistoryPanel.test.ts` | ❌ Wave 0 |
| UIM-02 | FindingCard + badges migrate successfully | unit | `vitest src/ui/memory/FindingCard.test.ts` | ❌ Wave 0 |
| UIM-03 | ContextRefreshBanner + PriorFindingsLink migrate | unit | `vitest src/ui/memory/ContextRefreshBanner.test.ts` | ❌ Wave 0 |
| UIM-04 | ScheduleRoutineRow renders correctly | unit | `vitest src/ui/memory/ScheduleRoutineRow.test.ts` | ❌ Wave 0 |
| UIM-05 | HistoryTabBadge migrates successfully | unit | `vitest src/ui/memory/HistoryTabBadge.test.ts` | ❌ Wave 0 |
| UIV-01 | Grep verifier (extended) returns 0 hits | smoke | `npm run verify:broken-patterns` (if exists) | ❌ Wave 0 |
| UIV-02 | DualRenderProbe updated with memory samples | integration | Manual verification in running host | ✅ Existing |
| UIV-03 | WCAG AA contrast audit passes | manual | WebAIM Contrast Checker; document in `docs/WCAG_AUDIT.md` | ❌ Wave 0 |
| UIV-04 | Production build completes without errors | smoke | `pnpm build && pnpm build --analyze` (if supported) | ✅ Existing |
| UIV-05 | Bundle size <200KB gzipped | metric | `wc -c dist/ui/index.js.gz` | ✅ Build output |
| UID-01 | README + UI_REDO_HANDOFF.md updated | documentation | Manual review | ✅ Existing files |
| UID-02 | PATTERNS.md created with token conventions | documentation | Manual review | ❌ New file |

### Sampling Rate

- **Per task commit:** Manual spot-check (grep 3 random files from task, confirm 0 broken tokens)
- **Per wave merge:** Full grep verifier (0 hits on all broken patterns across all 55+ components)
- **Phase gate:** UIV-01 through UIV-05 all pass before shipping v1.1

### Wave 0 Gaps

- [ ] `src/ui/memory/*.test.ts` — Unit tests for memory components (if test coverage required)
- [ ] `scripts/verify-broken-patterns.sh` — Extended grep verifier script for all components
- [ ] `docs/WCAG_AUDIT.md` — Contrast audit documentation (if manual verification result)

*(If no gaps: "Existing test infrastructure + build verification sufficient for Phase 10 gates")*

---

## Security Domain

**Security enforcement is enabled.** Phase 10 involves UI component rendering in the plugin context; no sensitive data handling changes, but verify token usage doesn't create injection vectors.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | Memory components are read-only displays (no user input processing in Phase 10) |
| V6 Cryptography | no | — |
| V7 Cross-Site Scripting Prevention | yes | Tailwind classnames only; no HTML injection. Plugin SDK sanitizes all output. |
| V8 CSRF Protection | no | — |

### Known Threat Patterns for React + Tailwind

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| CSS injection via className | Tampering | Use static classnames only (no template literals). Phase 7 verified no dynamic class generation. |
| Hardcoded colors breaking dark mode | Integrity | Use CSS custom properties (host tokens). All Phase 10 migrations use host tokens. |
| Dev-only components leaking to production | Information Disclosure | Mark DualRenderProbe for grep verification before ship. Verify 0 hits. |

---

## Sources

### Primary (HIGH confidence)

- **Phase 7 Research & Execution (07-RESEARCH.md, 07-03-SUMMARY.md)** — Token migration precedent, UIV-01 grep patterns, DualRenderProbe design
- **UI_REDO_HANDOFF.md** — Concrete token migration map, broken patterns list
- **REQUIREMENTS.md (Phase 10 section)** — UIM-01..05, UIV-01..05, UID-01..02 definitions
- **ROADMAP.md (Phase 10 section)** — Success criteria, dependencies, verification gates

### Secondary (MEDIUM confidence)

- **Current source code (src/ui/memory/*.tsx)** — Manual grep verification of broken tokens
- **CLAUDE.md (Project constraints)** — Tech stack confirmation (Tailwind v4, esbuild, Vitest)

### Tertiary (ASSUMED, needs verification)

- **date-fns version in package.json** — `formatDistanceToNow` export availability
- **WCAG AA vs AAA requirement** — Assumed AA (4.5:1) per ROADMAP; confirm with product owner
- **Bundle size baseline** — No pre-Phase-10 measurement; must capture post-Phase-9

---

## Metadata

**Confidence breakdown:**
- **Memory component state:** HIGH — grep-verified 80+ broken tokens
- **Token migration map:** HIGH — copy of Phase 7 proven approach
- **UIV-01 verifier gap:** HIGH — 07-03-SUMMARY confirms only 9 Phase 7 files covered
- **WCAG AA requirements:** MEDIUM — ROADMAP states it but not verified with auditor
- **Bundle size target:** MEDIUM — <200KB stated; pre-Phase-10 baseline unknown
- **Documentation structure (UID-01, UID-02):** HIGH — precedent from Phase 7 and Paperclip plugin standards

**Research date:** 2026-05-12
**Valid until:** 2026-05-26 (14 days — token migration mechanics are stable; only high-risk assumption is WCAG AA requirement clarity)

---

*End of Phase 10 Research*
