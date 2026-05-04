# Phase 7: Foundations + Shared Primitives - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the design-token baseline and ship two reusable primitives (Card, SectionHeader) using host shadcn tokens. Migrate the shell components — MainPanel, SidebarLink, ModeBanner, StatusBadge — and the 7 shared components (AgentCard, VisionStatusDisplay, InventoryDisplay, ChatPanel, ActivityTimeline, DocumentList, ErrorBoundary) to host tokens. Verify OKLCH + opacity-modifier compatibility before scaling, and prove the dark-mode story works end-to-end.

In scope: token swaps per UI_REDO_HANDOFF.md migration map, two new primitives, ~13 component migrations, OKLCH probe, dual-render dark-mode probe page.

Out of scope: panel-level migrations (Assess, Found, Revive, Reposition, Memory) — those are Phases 8–10. No behavior changes. No new dependencies. No CSS-in-JS, no plugin Tailwind config, no theme switcher.

</domain>

<decisions>
## Implementation Decisions

### Card Primitive API
- **D-01:** Children-only with variant + padding props. Signature: `<Card variant="default|muted|elevated" padding="sm|md|lg">{children}</Card>`. Default variant = `bg-card border-border`. Muted = `bg-muted border-border`. Elevated = `bg-card border-border shadow-sm` (verify shadow token exists in host). Sharp corners — `rounded-none` always.
- **D-02:** No header/body/footer slots in v1. Callers compose internal structure freely; SectionHeader is the standardized title row that pairs with Card.

### SectionHeader Primitive API
- **D-03:** Signature: `<SectionHeader title subtitle? actions?={ReactNode} icon?={LucideIcon} />`. Title = `text-base font-semibold text-foreground`. Subtitle = `text-sm text-muted-foreground`. Actions slot pinned right (flex justify-between). Icon (lucide) sits left of title at `h-4 w-4 text-muted-foreground` by default.

### ModeBanner Accent Treatment
- **D-04:** Per-mode accent. Compass icon + a left border (or top-left tint) colored per mode: `text-emerald-500` (Found), `text-blue-500` (Assess), `text-red-500` (Revive), `text-yellow-500` (Reposition). Banner background stays `bg-card`. Reinforces the semantic palette so founder reads mode at a glance.

### Typography Tokens (text-heading / text-body / text-label)
- **D-05:** Mechanical map to host scale. `text-heading` → `text-base font-semibold`. `text-body` → `text-sm`. `text-label` → `text-xs font-medium`. No plugin-side `@utility` aliases — keep the bundle dependency-free and inline the host classes at call sites.
- **D-06:** Researcher should still verify whether host `index.css` defines any of these names before we strip them; if host owns them, keep them.

### OKLCH Verification (UIF-08)
- **D-07:** First task in the phase. Build a tiny `OklchProbe` component that renders `bg-card`, `bg-muted`, `border-border`, `text-foreground`, `text-muted-foreground`, `bg-emerald-500/10`, `bg-emerald-500/20`, `bg-red-500/10`, `bg-red-500/20`, `bg-blue-500/10`, `bg-yellow-500/10` in both light and dark. Founder eyeballs in running host. Phase blocks if OKLCH + opacity modifiers do not render correctly.

### Dark-Mode Verification (UIF-09)
- **D-08:** Dual-render probe page. One dev-only route renders all Phase 7 components twice — once under `class="light"`, once under `class="dark"` — side-by-side. Founder + reviewer scan the page; no Percy/Chromatic in v1.1 (deferred to v1.2 per REQUIREMENTS).

### Migration Ordering
- **D-09:** Primitives-first. Order: (1) OklchProbe gates phase, (2) Card + SectionHeader primitives + their unit tests, (3) StatusBadge migration (uses semantic palette directly), (4) ModeBanner migration, (5) MainPanel + SidebarLink migration, (6) the 7 shared components consume the primitives, (7) dual-render probe page assembled, (8) grep verifier sanity check on the phase's surface area.

### SidebarLink Palette
- **D-10:** Use host sidebar tokens — `bg-sidebar`, `text-sidebar-foreground`, hover `bg-sidebar-accent text-sidebar-accent-foreground`, active `bg-sidebar-accent text-sidebar-accent-foreground`. Drop hardcoded `zinc-800`. Verify these tokens exist in host `index.css` during research.

### Claude's Discretion
- Card prop validation strategy (TS literal types vs runtime guard) — pick whichever aligns with existing component conventions.
- Where the dual-render probe page lives in routing (dev-only flag, hidden URL, or `?probe=1` query) — pick lowest-friction option.
- Whether to extract a tiny `cn()` helper for class composition or inline template strings — match current codebase pattern.

### Folded Todos
None — no pending todos matched this phase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Migration map + design source
- `UI_REDO_HANDOFF.md` — Concrete class swap table (gap-xs→gap-1, color swaps, rounded-none, opacity /10 /20). The authoritative migration map for v1.1.
- `~/Development/paperclip-temp/ui/src/index.css` — Host shadcn token definitions (OKLCH values for `--background`, `--card`, `--border`, `--foreground`, `--muted-foreground`, `--sidebar-*`, `--radius-lg: 0px`).
- `~/Development/paperclip-temp/ui/src/components/` — shadcn "new-york" reference components (baseColor: neutral, lucide icons, mono ID style). Visual reference for indistinguishable parity.
- `~/Development/paperclip-temp/ui/src/plugins/slots.tsx` — Confirms plugin renders directly in host React tree (no iframe/shadow). Token inheritance is automatic.

### Project planning
- `.planning/REQUIREMENTS.md` §UI-FOUND — UIF-01 through UIF-09 (the 9 requirements scoped to this phase).
- `.planning/ROADMAP.md` §"Phase 7" — Goal + 6 success criteria.
- `.planning/PROJECT.md` — Constraints (Plugin SDK only, no plugin Tailwind config, no CSS-in-JS, MIT license, two-maintainer structure).
- `.planning/STATE.md` — v1.0 shipped state; v1.1 milestone memory.

### Existing UI surface (the migration target)
- `src/ui/MainPanel.tsx` — Root panel, contains `HistoryTabBar` with broken `gap-sm`, `px-md`, `py-sm`, `rounded` tokens.
- `src/ui/SidebarLink.tsx` — Hardcoded `zinc-800` palette to replace.
- `src/ui/components/ModeBanner.tsx` — Uses `text-heading`, `text-body`, `text-accent`, `mt-xs`, `gap-md`. All target classes.
- `src/ui/components/StatusBadge.tsx` — Light-only `bg-green-50 text-green-700 border-green-200` pattern; reference case for semantic-palette migration.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Lucide-react already in dependency tree (used by SidebarLink, ModeBanner). Keep using it for SectionHeader icon prop.
- Plugin SDK UI hooks (`usePluginData`, `usePluginAction`, `useHostContext`) — no changes; reskin only.
- esbuild config in `esbuild.config.mjs` already bundles `src/ui/index.tsx` via `createPluginBundlerPresets`. No build changes needed.

### Established Patterns
- All UI components are function components with named exports + JSDoc — keep convention for Card / SectionHeader.
- Tailwind utility classes inline (no `cn()` helper observed); template literals used for conditional classes (e.g., `MainPanel.tsx` HistoryTabBar). Match this style; do not introduce `clsx` / `cva`.
- No existing tests under `src/ui/` — Phase 7 should add Vitest snapshot or behavior tests for Card / SectionHeader to lock the API.

### Integration Points
- `src/ui/index.tsx` is the UI bundle entrypoint and exports the named components for declared slots. Probe page (D-08) must register here behind a dev-only flag.
- StatusBadge is consumed by AgentCard, VisionStatusDisplay (per JSDoc) — migrate StatusBadge before those two so they pick up the semantic palette automatically.

</code_context>

<specifics>
## Specific Ideas

- "Indistinguishable from host shell" is the bar — a Paperclip user opening Compass should not be able to tell it is a separate plugin.
- Per-mode accent in ModeBanner is the only place mode-color leaks into the shell at Phase 7. Mode panels (Phases 8–10) carry their own accent treatments separately.
- Founder is non-developer — verification gates lean on visual probe pages, not test infrastructure that requires reading code.

</specifics>

<deferred>
## Deferred Ideas

- Screenshot-diff regression infra (Percy / Chromatic) — already deferred to v1.2 in REQUIREMENTS.md.
- Storybook for plugin components — v1.2+.
- Extracting `cn()` / `clsx` helper — only if a third caller needs conditional class composition; otherwise leave inline.
- Card slot-based variant (Card.Header / Body / Footer) — revisit if v1.2 component complexity grows.
- `@utility` aliases for typography tokens — only if mechanical map turns out to be too noisy at call sites.

</deferred>

---

*Phase: 7-foundations-shared-primitives*
*Context gathered: 2026-05-04*
</content>
</invoke>