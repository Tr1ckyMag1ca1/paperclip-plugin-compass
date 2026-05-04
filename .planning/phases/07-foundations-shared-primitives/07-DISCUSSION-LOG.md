# Phase 7: Foundations + Shared Primitives - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-04
**Phase:** 7-foundations-shared-primitives
**Areas discussed:** Primitive APIs (Card + SectionHeader), ModeBanner accent + typography tokens, OKLCH verify + dark-mode test method, Migration ordering

---

## Card Primitive API

| Option | Description | Selected |
|--------|-------------|----------|
| Children-only + variant prop | `<Card variant='default\|muted\|elevated' padding='sm\|md\|lg'>{children}</Card>`. Simple, covers 90% cases. Callers compose internal structure freely. | ✓ |
| Slot-based (header/body/footer) | `<Card.Header>`, `<Card.Body>`, `<Card.Footer>`. More structure but forces callers to refactor markup more aggressively. | |
| Bare wrapper, no variants | Single fixed style; variants added later if needed. | |

**User's choice:** Children-only + variant prop (Recommended)

---

## SectionHeader Primitive API

| Option | Description | Selected |
|--------|-------------|----------|
| title + optional subtitle + actions slot | `<SectionHeader title subtitle? actions?={node} icon?={LucideIcon} />`. Covers panel section titles + right-side buttons. | ✓ |
| title only, callers compose siblings | Simplest. Right-side actions live as separate JSX. | |
| Children-based fully composable | Most flexible, least standardized — risks divergence. | |

**User's choice:** title + optional subtitle + actions slot (Recommended)

---

## ModeBanner Accent Treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Per-mode accent color | Compass icon + left-border tinted by mode (emerald/blue/red/yellow). Reinforces semantic palette. | ✓ |
| Neutral foreground only | Icon and border stay text-foreground/border-border. | |
| Per-mode tint on icon only | Subtle accent without banner-wide color block. | |

**User's choice:** Per-mode accent color (Recommended)

---

## Typography Tokens (text-heading / text-body / text-label)

| Option | Description | Selected |
|--------|-------------|----------|
| Map to host scale | text-heading→text-base font-semibold, text-body→text-sm, text-label→text-xs. Mechanical swap. | ✓ |
| Define utility aliases via @utility | Plugin-side semantic aliases; keeps current call sites unchanged. | |
| Research first — may already exist in host | Defer choice to research. | |

**User's choice:** Map to host scale (Recommended)
**Notes:** Researcher should still verify whether host `index.css` defines any of these names before stripping them.

---

## OKLCH Verification (UIF-08)

| Option | Description | Selected |
|--------|-------------|----------|
| Gating probe task first | Probe component renders bg-card, border-border, emerald-500/10, /20 in light+dark. Blocks rest of phase if format incompatible. | ✓ |
| Inline check during primitive build | Verify visually as part of Card + StatusBadge tasks. No dedicated probe. | |
| Build esbuild test page | Static HTML in dist showing all token combos side-by-side. | |

**User's choice:** Gating probe task first (Recommended)

---

## Dark-Mode Test Method (UIF-09)

| Option | Description | Selected |
|--------|-------------|----------|
| Manual host theme toggle + checklist | Toggle host theme in local Paperclip dev, walk component checklist. | |
| Dual-render probe page | One route renders all Phase 7 components in both themes side-by-side. | ✓ |
| Screenshot capture via /browse | Paired light + dark screenshots in PR. | |

**User's choice:** Dual-render probe page

---

## Migration Ordering

| Option | Description | Selected |
|--------|-------------|----------|
| Primitives first, then refactor callers | OKLCH probe → Card+SectionHeader → StatusBadge → ModeBanner → MainPanel/SidebarLink → 7 shared. One pass per file. | ✓ |
| Token-swap raw classes first, primitives in pass 2 | Sweep all files with class swap, then build primitives. | |
| Component-by-component, primitives extracted as patterns repeat | Organic but unpredictable. | |

**User's choice:** Primitives first, then refactor callers (Recommended)

---

## Claude's Discretion

- Card prop validation strategy (TS literal types vs runtime guard) — match existing component conventions.
- Where the dual-render probe page lives in routing (dev-only flag, hidden URL, or `?probe=1` query) — pick lowest-friction option.
- Whether to extract a tiny `cn()` helper for class composition or inline template strings — match current codebase pattern.

## Deferred Ideas

- Screenshot-diff regression infra (Percy / Chromatic) — already deferred to v1.2.
- Storybook for plugin components — v1.2+.
- Extracting `cn()` / `clsx` helper — only if third caller needs it.
- Card slot-based variant (Card.Header / Body / Footer) — revisit in v1.2.
- `@utility` aliases for typography tokens — only if mechanical map proves noisy.
