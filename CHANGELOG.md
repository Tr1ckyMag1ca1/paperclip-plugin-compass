# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.6] - 2026-05-12

### Changed

- **Phase 10 — Memory + Verification + Documentation.** Migrated remaining memory UI components (`HistoryPanel`, `FindingCard`, `FindingStatusBadge`, `ScheduleRoutineRow`, `ModeBadge`, `HistoryTabBadge`, `ContextRefreshBanner`, `PriorFindingsLink`, `ScheduleCreationForm`, `SchedulesSection`) plus two Phase 9 stragglers (`AgentDecisionCard`, `AmendmentPreview`) from custom Tailwind tokens (`gap-xs`, `px-sm`, `py-md`, `text-label`, `text-body`, `text-heading`, etc.) to Paperclip-host tokens. Zero behavior change; layouts and dark-mode rendering now correct.

### Added

- `scripts/verify-broken-patterns.mjs` (+ `pnpm verify:broken-patterns`) — CI gate that fails on any reintroduction of nonexistent custom tokens across all 55+ UI components. Currently zero hits.
- `src/ui/components/DualRenderProbe.tsx` — dev-only side-by-side light/dark visual probe expanded to cover Phase 10 memory components.
- `src/ui/PATTERNS.md` — contributor guide documenting host-token inheritance model, semantic palette (emerald=accent, not primary), spacing scale, typography, dark-mode CSS variables, component primitives, anti-patterns, and v1.0→v1.1 migration reference.
- `docs/WCAG_AUDIT.md` — WCAG AA contrast audit for all badges and semantic colors in light + dark modes (all ≥4.5:1).
- `docs/BUILD_VERIFICATION.md` — production build verification (Tailwind JIT purge, bundle size 47.7 KB gzipped, 152 KB under 200 KB target).

### Fixed

- `README.md`, `UI_REDO_HANDOFF.md` — corrected color semantics (emerald is the success/accent color, not primary).

## [1.1.5] - 2026-05-12

### Fixed

- `detectMode`: Rule 1 used to fire only when `!visionExists && agentCount === 0`. A company that had agents but no VISION fell through to Rule 4 and was classified as Reposition, sending the founder to a panel that immediately rendered "No VISION.md found" with a disabled CTA. Tightened Rule 1 to "no VISION → Found" regardless of agent count — every other mode panel requires a VISION document, so Found is the only useful starting point until VISION exists. Verified live against ALE (no VISION + agents) now auto-detects Found.

## [1.1.4] - 2026-05-12

### Added

- `InventorySnapshot.companyName`: the worker now resolves the live company name via `ctx.companies.list()` and threads it through to the UI so mode panels (Assess / Revive / Reposition) show "Biz Ops OS Generator" instead of the literal placeholder "Company".

### Fixed

- `QuestionRenderer`: removed the redundant `placeholder={question.hint}` on every input. The hint already renders as the description paragraph below the input via `aria-describedby`; doubling it up made the textarea look stuffed and broke when the user started typing.
- `RevivePanel`: empty body state used to read "This company isn't stalled / No blocking issues detected" even when the header banner showed "Stalled — 20 days no activity". The header reports the inventory stall signal; the body reports the action queue. Rewrote the empty state to "No actions queued yet / Click 'Find what's blocking this company' to diagnose" so the two surfaces stop contradicting each other.
- `SectionNavRail`: outer container now declares `w-full min-w-0` so the horizontal tab strip honors its parent's width instead of expanding to fit content and overflowing the layout. Tabs remain horizontally scrollable for narrow viewports.

## [1.1.3] - 2026-05-12

### Fixed

- `FoundPanel`: the section nav rail (horizontal tab strip with `border-b`) was being rendered as a sibling column in a `flex flex-row` container alongside the interview section. The nav rail's natural width (~940px of section title tabs) starved the interview section down to ~48px, pushing all question content off the right edge and leaving the body looking blank. Switched the container to `flex flex-col min-h-0` so the tab strip sits on top of the section as designed.
- `interview-loader.ts`: the hand-rolled YAML frontmatter parser was treating the nested `questions` array as a flat list of strings. Each `- id: mission` line was pushed verbatim into the array, and the next `prompt:` line was treated as a top-level key, so `section.questions` always collapsed to a single object with `id`/`prompt`/`required` all `undefined`. Replaced with an indent-aware parser that supports arrays of objects (the only YAML shape Compass actually uses).
- `interview-loader.ts`: trimmed each paragraph before testing for a leading `#`, otherwise a leading newline (e.g. `\n# Big Picture`) slipped past `startsWith("#")` and the section heading ended up rendered as the intro paragraph.

## [1.1.2] - 2026-05-11

### Fixed

- Hotfix: Mode-specific panels (Assess, Found, Revive, Reposition) were reskinned in phases 8 and 9 of the v1.1 milestone but never wired into `MainPanel` routing. The body always rendered `InventoryDisplay` regardless of detected mode, leaving the mode-specific flows (vision-quest interview, drift report, action queue, cascade review) unreachable from the UI. Restored conditional rendering: `currentMode === "Assess|Found|Revive|Reposition"` now mounts the corresponding panel, falling back to `InventoryDisplay` for probe/unknown modes. Matches pre-reskin behavior from commit `2204f3f`.

## [1.1.1] - 2026-05-11

### Fixed

- Hotfix: `Compass: Compass` placeholder rendered in sidebar with no icon and no click handler on v1.1.0. Root cause: `lucide-react` was marked as an esbuild external in v1.1.0, but the Paperclip host React shim only resolves `react`, `react-dom`, and `react/jsx-runtime` bare specifiers — not `lucide-react`. The browser could not resolve the bare `lucide-react` import at runtime, so the UI module load failed and the host fell back to the `{pluginDisplayName}: {displayName}` placeholder. Fix: bundle `lucide-react` (still tree-shaken; ~11 kB gzipped final UI bundle), keep only `react` / `react-dom` / `react/jsx-runtime` external.
- Sync `src/manifest.ts` version (was stuck at `0.3.26`) with `package.json` so the host DB's `plugins.version` row reflects published version.
- Tighten `scripts/check-externals.mjs` regex so `// node_modules/.../lucide-react@...` comments no longer false-positive as "bundled react".

## [1.1.0] - 2026-05-11

### Added

- Phase 7: Foundations + Shared Primitives — Card and SectionHeader components, MainPanel and SidebarLink host token migration, StatusBadge and ModeBanner semantic colors.
- Phase 8: Assess + Found Panels — AssessPanel, DriftReportPanel, EvidenceChip, ConfidenceBar, AmendmentDiff, ApprovalRoutingModal, FoundPanel, vision-quest interview flow all migrated to host tokens.
- Phase 9: Revive + Reposition Panels — RevivePanel, ActionItemCard, ActionQueuePanel, SamplePivotModal, RepositionInterviewFlow, IntentEntry, ScopeConfirmation, CascadeReviewPanel all migrated; React shim guard and live host mount smoke test verification gates.
- Phase 10: Memory + Verification + Documentation — HistoryPanel, FindingCard, SchedulesSection, grep verifier, manual verification checklist, production build verification, bundle size verification.
- Phase 11: Distribution + Open-Source Launch — npm scoped package distribution, plugin-manager VPS install verification, size-limit and externals audits, OSS documentation (README, CHANGELOG, CODEOWNERS, issue/PR templates).

### Changed

- Complete UI reskin to host design tokens (Tailwind v4 CSS vars, OKLCH color format, dark-mode support).

## [1.0.0] - 2026-04-30

### Added

- Phase 1: Foundations — Plugin scaffold, mode detection, main layout, sidebar.
- Phase 2: Found Mode — Vision-quest interview engine, VISION.md generation, agent provisioning, kickoff issue filing.
- Phase 3: Assess Mode — Drift audit engine, 30-day activity comparison, amendment proposal + approval flow.
- Phase 4: Revive Mode — Stall classification, blocker action queue, unblocking suggestions.
- Phase 5: Reposition Mode — Scoped vision-quest re-interview, amendment diff, cascade rebriefing plan.
- Phase 6: Memory + Scheduled Check-ins — Engagement memory (findings history, context refresh), scheduled drift audits with configurable interval.

### Fixed

- Initial release; no prior versions.

---

## Semantic Versioning

- **1.x.y**: UI parity and distribution milestones (v1.1 current, v1.2+ planned for additional features).
- **0.x.y**: Internal pre-release versions (0.3.26 was final pre-public version).
