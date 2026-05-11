# REQUIREMENTS — Compass Plugin v1.1

**Milestone:** v1.1 — Compass UI parity with Paperclip host
**Goal:** Reskin Compass UI (~55 components, 5 mode panels) to look indistinguishable from Paperclip host shell. Zero behavior changes; visual surface only.
**Created:** 2026-05-04

## Context

Compass v1.0 shipped with broken UI: 173 broken Tailwind class references — 146 nonexistent custom spacing tokens (`gap-xs`, `px-sm`, `py-md`) silently no-op, 8 light-only color utilities fail in dark mode, 7 rounded corners conflict with host's flat `--radius-lg: 0px`. Plugin renders directly in host React tree (verified `paperclip-temp/ui/src/plugins/slots.tsx`); host Tailwind v4 + CSS-var design tokens inherited globally. Migration is mechanical: token swap, no new dependencies, no CSS bundling.

**Critical handoff correction:** Host primary palette = neutral (dark gray), NOT emerald. Emerald reserved for success/healthy state only. Accent semantics: emerald=success/found, red=error/revive, yellow=warning/pending, blue=info/assess.

## v1.1 Requirements (38 total)

### UI-FOUND — Foundations + Shared Primitives (9)

- [ ] **UIF-01**: Card primitive component built using host tokens (bg-card, border-border, text-foreground); replaces ad-hoc div+border patterns across panels
- [ ] **UIF-02**: SectionHeader primitive component built using host tokens; standardizes section titles across panels
- [ ] **UIF-03**: MainPanel migrated to host tokens (root layout, tab nav, mode routing surface)
- [ ] **UIF-04**: SidebarLink migrated to host sidebar tokens (bg-sidebar, text-sidebar-foreground, border-sidebar-border)
- [ ] **UIF-05**: ModeBanner migrated to host tokens with mode-specific accent colors (semantic palette only)
- [ ] **UIF-06**: StatusBadge migrated using semantic accent palette (emerald=success, red=error, yellow=warning, blue=info — NOT primary)
- [ ] **UIF-07**: Shared components migrated (AgentCard, VisionStatusDisplay, InventoryDisplay, ChatPanel, ActivityTimeline, DocumentList, ErrorBoundary)
- [ ] **UIF-08**: OKLCH-vs-HSL color format verified compatible with host before scaling migration; opacity modifiers (`/10`, `/20`) tested explicitly
- [ ] **UIF-09**: Dark-mode toggle test passes for all Phase 1 components — light and dark visually correct, no hardcoded color regressions

### UI-ASSESS — Assess Panel Migration (5)

- [ ] **UIA-01**: AssessPanel migrated to host tokens (root container, layout)
- [ ] **UIA-02**: DriftReportPanel + DriftItemCard migrated; dynamic color classes converted to explicit map (no template literals → safelist failure)
- [ ] **UIA-03**: EvidenceChip + ConfidenceBar migrated to host tokens
- [ ] **UIA-04**: AmendmentDiff migrated using host tokens (diff highlighting respects accent palette)
- [ ] **UIA-05**: ApprovingWaitingState + ApprovalRoutingModal + CustomOverrideWarning migrated

### UI-FOUND-MODE — Found Panel Migration (3)

- [ ] **UIFM-01**: FoundPanel + interview shell migrated to host tokens
- [ ] **UIFM-02**: All Found subcomponents migrated (preset selector, question rendering, vision preview, apply gate)
- [ ] **UIFM-03**: Vision-quest interview UI indistinguishable from host shell in light + dark themes

### UI-REVIVE — Revive Panel Migration (4)

- [ ] **UIR-01**: RevivePanel migrated to host tokens
- [ ] **UIR-02**: ActionItemCard + PriorityBadge + StallSummaryBadge migrated
- [ ] **UIR-03**: ActionQueuePanel + ActionConfirmationModal migrated
- [ ] **UIR-04**: SamplePivotModal migrated

### UI-REPO — Reposition Panel Migration (3)

- [ ] **UIRP-01**: RepositionInterviewFlow migrated to host tokens
- [ ] **UIRP-02**: IntentEntry + ScopeConfirmation migrated
- [ ] **UIRP-03**: CascadeReviewPanel migrated

### UI-MEM — Memory/History Panel Migration (5)

- [ ] **UIM-01**: HistoryPanel migrated to host tokens
- [ ] **UIM-02**: FindingCard + ModeBadge + FindingStatusBadge migrated
- [ ] **UIM-03**: ContextRefreshBanner + PriorFindingsLink migrated
- [ ] **UIM-04**: SchedulesSection + ScheduleCreationForm + ScheduleRoutineRow migrated
- [ ] **UIM-05**: HistoryTabBadge migrated

### UI-VERIFY — Verification Gates (5)

- [ ] **UIV-01**: Grep verifier passes — zero hits for broken patterns: `gap-xs`, `gap-sm`, `gap-md`, `px-xs|sm|md`, `py-xs|sm|md`, `bg-green-50`, `bg-red-50`, `bg-slate-50`, `text-green-700`, `text-red-700`, `text-slate-600`, `border-green-200|red-200|slate-200`, `rounded-lg`, `rounded-xl`
- [ ] **UIV-02**: All ~55 components manually verified in light + dark host themes (no visual regressions)
- [ ] **UIV-03**: WCAG AA contrast (≥4.5:1) verified for status badges and accent colors on light + dark backgrounds
- [ ] **UIV-04**: Production build (Tailwind JIT purge active) verified — no missing classes from dynamic template literals
- [ ] **UIV-05**: Plugin bundle size unchanged or smaller (no inflation from migration)

### UI-DOCS — Documentation (2)

- [ ] **UID-01**: README + UI_REDO_HANDOFF.md updated with corrected emerald-as-accent (not primary) semantics
- [ ] **UID-02**: Short PATTERNS doc in `src/ui/` documenting Card/SectionHeader usage and token conventions for future contributors

### DIST — Distribution (4)

- [ ] **DIST-01**: `npm publish` succeeds for `@paperclipai/paperclip-plugin-compass` with valid `package.json#paperclipPlugin` metadata (manifest/worker/UI paths correct, files allowlist includes `dist/`)
- [ ] **DIST-02**: Plugin-manager install verified on live Paperclip VPS host — install via plugin-manager UI, plugin registers, renders all 5 mode panels without runtime errors
- [ ] **DIST-03**: GitHub release tagged `v1.1.0` with `.tgz` artifact attached and release notes derived from CHANGELOG
- [ ] **DIST-04**: Bundle audit passes — React/zod/lucide-react externals declared correctly, peer deps validated, final UI bundle <200KB gzipped

### OSS — Open-Source Launch (6)

- [ ] **OSS-01**: README rewritten — install steps (npm + plugin-manager), 5-mode overview, screenshots per mode, Aron Prins co-maintainer credit, `paperclip-vision` lineage link
- [ ] **OSS-02**: CONTRIBUTING.md committed — dev setup, Plugin SDK pointers, test guidance, GSD workflow expectations, code review norms
- [ ] **OSS-03**: LICENSE (MIT) committed at repo root and matches `package.json#license`
- [ ] **OSS-04**: CODEOWNERS file committed; Aron Prins added as repo collaborator with maintainer permissions
- [ ] **OSS-05**: `.github/ISSUE_TEMPLATE/` (bug, feature, question) and `.github/PULL_REQUEST_TEMPLATE.md` committed
- [ ] **OSS-06**: CHANGELOG.md initialized at repo root with v1.0 and v1.1 entries (keepachangelog format)

## Future Requirements (deferred to v1.2+)

- Screenshot-diff regression infrastructure (Percy/Chromatic)
- Storybook for plugin components
- Cross-company history rollup
- LLM-assisted classifier variants (drift / shift / stall)
- Side-by-side amendment diff
- Live polling on `founder+ceo` approvals
- Memory export (JSON/CSV)
- Native Paperclip routines table integration (when SDK exposes routinesApi)
- Native agent create/delete (when SDK exposes those APIs)

## Out of Scope

- **Theme switcher inside plugin** — Host owns theming globally; plugin must NOT inject theme controls.
- **Custom Tailwind config in plugin** — Inherits from host shared React tree; new config would conflict.
- **CSS-in-JS / styled-components** — Defeats token parity; Tailwind utilities only.
- **Behavior changes** — v1.1 is purely visual reskin; any behavior change defers to v1.2.
- **Standalone design system extraction** — Plugin is part of host, not standalone product.
- **Iframe / shadow DOM isolation** — Plugin renders directly in host tree; isolation would break token inheritance.

## Traceability

| Requirement | Category | Phase | Status |
|-------------|----------|-------|--------|
| UIF-01 | UI-FOUND | 7 | Pending |
| UIF-02 | UI-FOUND | 7 | Pending |
| UIF-03 | UI-FOUND | 7 | Pending |
| UIF-04 | UI-FOUND | 7 | Pending |
| UIF-05 | UI-FOUND | 7 | Pending |
| UIF-06 | UI-FOUND | 7 | Pending |
| UIF-07 | UI-FOUND | 7 | Pending |
| UIF-08 | UI-FOUND | 7 | Pending |
| UIF-09 | UI-FOUND | 7 | Pending |
| UIA-01 | UI-ASSESS | 8 | Pending |
| UIA-02 | UI-ASSESS | 8 | Pending |
| UIA-03 | UI-ASSESS | 8 | Pending |
| UIA-04 | UI-ASSESS | 8 | Pending |
| UIA-05 | UI-ASSESS | 8 | Pending |
| UIFM-01 | UI-FOUND-MODE | 8 | Pending |
| UIFM-02 | UI-FOUND-MODE | 8 | Pending |
| UIFM-03 | UI-FOUND-MODE | 8 | Pending |
| UIR-01 | UI-REVIVE | 9 | Pending |
| UIR-02 | UI-REVIVE | 9 | Pending |
| UIR-03 | UI-REVIVE | 9 | Pending |
| UIR-04 | UI-REVIVE | 9 | Pending |
| UIRP-01 | UI-REPO | 9 | Pending |
| UIRP-02 | UI-REPO | 9 | Pending |
| UIRP-03 | UI-REPO | 9 | Pending |
| UIM-01 | UI-MEM | 10 | Pending |
| UIM-02 | UI-MEM | 10 | Pending |
| UIM-03 | UI-MEM | 10 | Pending |
| UIM-04 | UI-MEM | 10 | Pending |
| UIM-05 | UI-MEM | 10 | Pending |
| UIV-01 | UI-VERIFY | 10 | Pending |
| UIV-02 | UI-VERIFY | 10 | Pending |
| UIV-03 | UI-VERIFY | 10 | Pending |
| UIV-04 | UI-VERIFY | 10 | Pending |
| UIV-05 | UI-VERIFY | 10 | Pending |
| UID-01 | UI-DOCS | 10 | Pending |
| UID-02 | UI-DOCS | 10 | Pending |
| DIST-01 | DIST | 11 | Pending |
| DIST-02 | DIST | 11 | Pending |
| DIST-03 | DIST | 11 | Pending |
| DIST-04 | DIST | 11 | Pending |
| OSS-01 | OSS | 11 | Pending |
| OSS-02 | OSS | 11 | Pending |
| OSS-03 | OSS | 11 | Pending |
| OSS-04 | OSS | 11 | Pending |
| OSS-05 | OSS | 11 | Pending |
| OSS-06 | OSS | 11 | Pending |

**Coverage:** 48/48 requirements mapped to phases 7-11. No orphaned requirements.

---

*Last updated: 2026-05-11 — Phase 11 added (Distribution + OSS Launch, 10 reqs)*
