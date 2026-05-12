# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
