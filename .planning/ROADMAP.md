# Compass — Roadmap

**Project:** Paperclip Plugin — Strategic Consultant for AI Company Lifecycle

---

## Shipped Milestones

- ✅ **v1.0** — Compass Plugin (all 4 modes + engagement memory + scheduled check-ins). 6 phases, 22 plans, 829 tests, 72/72 requirements. See [`.planning/milestones/v1.0-ROADMAP.md`](milestones/v1.0-ROADMAP.md).
- ✅ **v1.1** — Compass UI Parity with Paperclip Host. 5 phases (7–11), token migration, OSS launch, npm publish. 48/48 requirements.

---

## Next Milestone: v1.2 Native SDK Integration + Conversational Vision Quest + Aaron Template Parity

**Status:** Filed 2026-05-12; restructured 2026-05-13 after Paperclip v2026.512.0 release
**Phases:** 5 (12–16)
**Granularity:** Coarse

### Why this milestone

Three converging pressures:

1. **Conversational interview gap.** Compass v1.0/v1.1 ships Found mode as a static 6-section form. Original spec called for "strategic-interview depth of `aronprins/paperclip-vision`" — adaptive chat, one question at a time, LLM-driven follow-ups, section extraction.

2. **Template format drift.** Compass's `src/content/vision-template.md` has **20 sections**; Aaron's canonical template has **13** — with renames and 7 Compass-only additions (Voice, Issue Structure, Locality, Launch Plan, Trust Governance, Amendment Protocol, extras). Any Aaron-built tooling that reads VISION.md will not find expected sections → company drifts.

3. **Paperclip v2026.512.0 (2026-05-12) shipped expanded plugin host surface** (#5205, #5597). SDK jumped `2026.428.0` → `2026.512.0`. New primitives Compass should adopt:
   - **Scoped DB namespaces** (`ctx.db`) — own schema with restricted SELECT/INSERT/UPDATE/DELETE. **This permanently retires the v1.1.7 VISION-storage hack** (synthetic issue + document key mismatch). VISION + findings + schedule state move to `compass.*` tables.
   - **UI components**: `FileTree`, `IssuesList`, `AssigneePicker`, `ProjectPicker`, `ManagedRoutinesList`, `MarkdownEditor`
   - **Slot types**: `PluginRouteSidebar` (Compass owns sidebar during vision-quest), `PluginProjectSidebarItem`, `PluginCommentAnnotation`, `PluginSettingsPage`
   - **Managed routines/agents/folders**: replaces hand-rolled Schedules UI and agent-provisioning hacks
   - **Reference implementation**: `@paperclip/plugin-llm-wiki` (#5716) — clone and study before designing Compass equivalents

### Goal

1. **Adopt expanded SDK surface** to replace custom hand-rolling with native host primitives.
2. **Persist storage in plugin-owned namespace** so VISION/findings/schedules cannot drift from reader expectations again.
3. **VISION.md matches Aaron's 13-section template strictly**, with legacy parser shim for v1.0/v1.1 docs.
4. **Replace static form with conversational chat-style interview** (paperclip-vision parity), backed by host LLM and MarkdownEditor live preview.
5. **All four mode panels** (Found/Assess/Revive/Reposition) read both legacy (20-section, issue-doc storage) and new (13-section, namespaced storage) without crashing.

### Aaron's canonical template (authoritative)

```
# VISION.md — [Company Name]
## Mission
## 12-Month Goal
## 3-Year Vision
## Revenue Model
## Target Customer
## Growth Strategy
## Sales Model
## Product Direction
## Organisational Structure
## Operating Philosophy
## CEO Mandate
## Guiding Principles
## What Success Looks Like
```

Source: `~/.claude/skills/paperclip-vision/references/vision-template.md`.

### Constraints

- SDK pinned to `^2026.512.0` (latest stable) — no canaries
- LLM call path routes through Plugin SDK (`ctx.llm` or equivalent) — no direct Anthropic API keys
- Form fallback retained behind `?form=1` for accessibility / no-LLM envs
- Legacy VISION (issue-doc, 20-section) must read without migration on first load; written through namespaced DB on next save
- Aaron template names + ordering are verbatim — `## Organisational Structure` (British spelling), not `## Org Structure`

### Phases

- [ ] **Phase 12: SDK Upgrade + Compatibility Audit** — bump `@paperclipai/plugin-sdk` to `2026.512.0`, run typecheck/build/tests against new types, document breaking changes, replace deprecated APIs, swap obviously-better components (`MetricCard` etc remain; `MarkdownBlock` callsites considered for `MarkdownEditor`). No new features — just surface compat.
- [ ] **Phase 13: Storage Migration to Scoped DB Namespace** — declare `compass.*` schema in manifest, write migrations for `compass.visions`, `compass.findings`, `compass.schedules`, `compass.engagement_memory`. Add `ctx.db` writers behind feature flag. Dual-write to legacy issue-doc storage during transition. Reader prefers DB, falls back to issue-doc. Retires v1.1.7 `isVisionDoc` shim once dual-read confirmed safe.
- [ ] **Phase 14: Aaron Template Migration + Parser Shim** — swap `src/content/vision-template.md` to Aaron's 13-section format. Update `template-fill.ts`, `vision-parse.ts`. Parser accepts both legacy 20-section and new 13-section, normalises to internal 13-section model. Mode panels (Assess/Revive/Reposition) re-tested against both shapes.
- [ ] **Phase 15: Conversational Vision Quest** — new `ChatInterview` component, message thread persisted to `compass.interview_messages`, question state machine, LLM-driven follow-ups via `ctx.llm`, section extraction into Aaron's 13-section model. `MarkdownEditor` live preview on right. Form fallback behind `?form=1`.
- [ ] **Phase 16: Native Slot + Cutover** — `PluginRouteSidebar` owns sidebar during vision-quest (section progress 1/13 → 13/13). `ManagedRoutinesList` replaces custom Schedules UI. `PluginSettingsPage` for approval routing config. Deprecate legacy form. Verify on alex wynn + Candlewood Beacon. Release v1.2.0.

---

## Active Milestone: v1.1 Compass UI Parity with Paperclip Host

**Status:** Phase 8 complete; Phase 9 planning complete (3 plans created 2026-05-10); Phase 11 added 2026-05-11
**Phases:** 5 (7–11, continuing from v1.0)
**Total Requirements:** 48 v1.1 (38 UI parity + 10 distribution/OSS launch)
**Granularity:** Coarse (per config.json)

Goal: Reskin Compass UI (~55 components, 5 mode panels) to look indistinguishable from Paperclip host shell. Fix layout bugs caused by nonexistent custom Tailwind tokens and light-only color utilities.

### Phases

- [x] **Phase 7: Foundations + Shared Primitives** - Design token baseline and reusable components (9 reqs) — 3 plans
- [x] **Phase 8: Assess + Found Panels** - Migrate primary mode panels to host tokens (8 reqs) (completed 2026-05-09)
- [ ] **Phase 9: Revive + Reposition Panels** - Complete secondary mode migrations (7 reqs) — 3 plans created 2026-05-10
- [ ] **Phase 10: Memory + Verification + Documentation** - History panel, verification gates, documentation (14 reqs)
- [ ] **Phase 11: Distribution + Open-Source Launch** - npm publish, plugin-manager install verify, OSS docs, Aron co-maintainer setup (10 reqs)

---

## Phase Details

### Phase 7: Foundations + Shared Primitives

**Goal:** Establish design token baseline; ship reusable Card/SectionHeader primitives using host shadcn tokens; fix dark-mode inheritance and remove nonexistent custom spacing tokens; verify OKLCH format compatibility before scaling.

**Depends on:** Nothing (foundation phase).

**Requirements:** UIF-01, UIF-02, UIF-03, UIF-04, UIF-05, UIF-06, UIF-07, UIF-08, UIF-09

**Success Criteria** (what must be TRUE):
1. Card and SectionHeader primitives built using host tokens (bg-card, border-border, text-foreground) and work across all panel shells
2. MainPanel and SidebarLink migrated to host tokens; sidebar styling matches Paperclip host (bg-sidebar, text-sidebar-foreground)
3. ModeBanner and StatusBadge use host semantic palette (emerald=success, red=error, yellow=warning, blue=info, NOT primary color)
4. All 7 shared components (AgentCard, VisionStatusDisplay, InventoryDisplay, ChatPanel, ActivityTimeline, DocumentList, ErrorBoundary) migrated to host tokens
5. Dark-mode toggle test passes for all Phase 7 components — light and dark both visually correct, zero hardcoded color regressions
6. OKLCH-vs-HSL color format verified compatible with host tokens and opacity modifiers (`/10`, `/20`) tested explicitly

**Plans:** 3 plans

**Plan List:**
- [x] **07-01-PLAN.md** — Card + SectionHeader primitives, unit tests (UIF-01, UIF-02)
- [x] **07-02-PLAN.md** — OklchProbe (gating), StatusBadge + ModeBanner migrations (UIF-05, UIF-06, UIF-08)
- [x] **07-03-PLAN.md** — MainPanel, SidebarLink, 7 shared components, DualRenderProbe, grep verify (UIF-03, UIF-04, UIF-07, UIF-09)

**UI hint**: yes

---

### Phase 8: Assess + Found Panels

**Goal:** Migrate Assess and Found mode panels (~30 components) to host tokens; convert dynamic color classes from template literals to explicit safelist-safe maps; ensure all evidence/confidence displays and amendment diffs respect host accent palette.

**Depends on:** Phase 7.

**Requirements:** UIA-01, UIA-02, UIA-03, UIA-04, UIA-05, UIFM-01, UIFM-02, UIFM-03

**Success Criteria** (what must be TRUE):
1. AssessPanel root container and layout use host tokens; DriftReportPanel and DriftItemCard colors mapped from template literals to explicit enums
2. EvidenceChip and ConfidenceBar display correctly with host semantic accent colors in light + dark modes
3. AmendmentDiff highlighting respects host accent palette; diff readability maintained
4. ApprovalRoutingModal and CustomOverrideWarning migrated; approval flow UX unchanged
5. FoundPanel and interview subcomponents (preset selector, question rendering, vision preview, apply gate) display indistinguishable from host shell
6. Vision-quest interview flow visually consistent across all sections in light + dark themes

**Plans:** 7/7 plans complete

**UI hint**: yes

---

### Phase 9: Revive + Reposition Panels

**Goal:** Migrate remaining mode panels (Revive + Reposition, ~20 components) to host tokens; ensure action/intent flows and modal confirmations respect new token hierarchy; no layout breakage. Introduce new verification gates: React shim guard, live host mount smoke test, plugin SDK payload audit (Phase 8 missed runtime bugs; these gates prevent regression).

**Depends on:** Phase 8.

**Requirements:** UIR-01, UIR-02, UIR-03, UIR-04, UIRP-01, UIRP-02, UIRP-03

**Success Criteria** (what must be TRUE):
1. RevivePanel root container, ActionItemCard, PriorityBadge, and StallSummaryBadge use host tokens
2. ActionQueuePanel and ActionConfirmationModal display correctly; action selection flow unchanged
3. SamplePivotModal migrated; one-click pivot UI matches host design
4. RepositionInterviewFlow and IntentEntry use host tokens; scoped re-interview flow feels native
5. ScopeConfirmation and CascadeReviewPanel migrated; all confirm/apply modals consistent across modes
6. React shim guard passes: 0 forbidden imports (useId, useReducer, etc.) in plugin components
7. Live host mount smoke test passes: RevivePanel and RepositionPanel render in VPS Paperclip host without errors
8. SDK payload audit passes: 0 sensitive data leaks (adapterConfig.env, etc.)

**Plans:** 3 plans

**Plan List:**
- [x] **09-01-PLAN.md** — Revive panel root + ActionItemCard + badges (PriorityBadge, StallSummaryBadge) with static priority/severity maps (UIR-01, UIR-02)
- [x] **09-02-PLAN.md** — Revive action queue + modals (ActionQueuePanel, ActionConfirmationModal, SamplePivotModal) with D-09 chrome (UIR-03, UIR-04)
- [x] **09-03-PLAN.md** — Reposition panels (RepositionPanel, RepositionInterviewFlow, IntentEntry, ScopeConfirmation, CascadeReviewPanel) + verification gates (React shim guard, live host mount smoke test, SDK payload audit) (UIRP-01, UIRP-02, UIRP-03)

**UI hint**: yes

---

### Phase 10: Memory + Verification + Documentation

**Goal:** Complete history/memory panel migration; ship comprehensive verification gates (grep + visual + contrast + build); document token conventions and patterns for future contributors; ship v1.1 ready for production.

**Depends on:** Phase 9.

**Requirements:** UIM-01, UIM-02, UIM-03, UIM-04, UIM-05, UIV-01, UIV-02, UIV-03, UIV-04, UIV-05, UID-01, UID-02

**Success Criteria** (what must be TRUE):
1. HistoryPanel, FindingCard, ModeBadge, and FindingStatusBadge use host tokens; History tab displays correctly
2. ContextRefreshBanner and PriorFindingsLink migrated; engagement memory UI matches host
3. SchedulesSection, ScheduleCreationForm, and ScheduleRoutineRow use host tokens; routine management UX unchanged
4. Grep verifier confirms zero hits on documented broken patterns (gap-xs, px-sm, py-md, bg-green-50, text-red-700, border-green-200, rounded-lg, rounded-xl, etc.)
5. All ~55 components verified manually in light + dark host themes; WCAG AA contrast (≥4.5:1) confirmed for badges and accent colors
6. Production build (Tailwind JIT purge active) verified; no missing classes from dynamic templates
7. Plugin bundle size unchanged or smaller (no inflation from migration)
8. README + UI_REDO_HANDOFF.md updated with corrected semantics (emerald=accent, NOT primary); PATTERNS doc shipped documenting Card/SectionHeader usage and token conventions

**Plans:** 6/6 plans complete

**UI hint**: yes

---

### Phase 11: Distribution + Open-Source Launch

**Goal:** Ship Compass v1.1 publicly — npm publish under `paperclip-plugin-compass` (unscoped, third-party), verify install on live Paperclip plugin-manager, publish OSS contributor docs (README, CONTRIBUTING, LICENSE, CHANGELOG, issue/PR templates), and onboard Aron Prins as co-maintainer with CODEOWNERS + repo access.

**Depends on:** Phase 10 (v1.1 must pass UI parity verification gates before public release).

**Requirements:** DIST-01, DIST-02, DIST-03, DIST-04, OSS-01, OSS-02, OSS-03, OSS-04, OSS-05, OSS-06

**Success Criteria** (what must be TRUE):
1. `npm publish` succeeds for `paperclip-plugin-compass` (unscoped, third-party) with valid `package.json#paperclipPlugin` metadata pointing at correct manifest/worker/UI paths
2. Plugin-manager install verified on live Paperclip VPS host — plugin installs, registers, renders without errors end-to-end
3. GitHub release tagged `v1.1.0` with `.tgz` artifact attached + release notes derived from CHANGELOG
4. Bundle audit passes: React/zod/lucide-react externals correct, peer deps declared, final bundle <200KB gzipped
5. README rewritten with install steps, mode overview, screenshots, and Aron Prins co-maintainer credit + `paperclip-vision` lineage link
6. CONTRIBUTING.md committed with dev setup, Plugin SDK pointers, test guidance, GSD workflow expectations
7. LICENSE (MIT) committed and matches `package.json#license`
8. CODEOWNERS committed and Aron Prins added as repo collaborator with maintainer permissions
9. `.github/` issue + PR templates committed
10. CHANGELOG.md initialized with v1.0 and v1.1 entries

**Plans:** TBD

**UI hint**: no

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 7. Foundations | 3/3 | Complete | 2026-05-04 |
| 8. Assess + Found | 7/7 | Complete   | 2026-05-09 |
| 9. Revive + Reposition | 3/3 | Complete | 2026-05-11 |
| 10. Memory + Verify + Docs | 6/6 | Complete | 2026-05-12 |
| 11. Distribution + OSS Launch | 0/? | Planned | — |

---

## Coverage Summary

**Requirements mapped:** 48/48 ✓

| Category | Requirements | Count | Phase | Status |
|----------|--------------|-------|-------|--------|
| UI-FOUND | UIF-01 through UIF-09 | 9 | Phase 7 | Complete |
| UI-ASSESS | UIA-01 through UIA-05 | 5 | Phase 8 | Complete |
| UI-FOUND-MODE | UIFM-01 through UIFM-03 | 3 | Phase 8 | Complete |
| UI-REVIVE | UIR-01 through UIR-04 | 4 | Phase 9 | Complete |
| UI-REPO | UIRP-01 through UIRP-03 | 3 | Phase 9 | Complete |
| UI-MEM | UIM-01 through UIM-05 | 5 | Phase 10 | Complete |
| UI-VERIFY | UIV-01 through UIV-05 | 5 | Phase 10 | Complete |
| UI-DOCS | UID-01, UID-02 | 2 | Phase 10 | Complete |
| DIST | DIST-01 through DIST-04 | 4 | Phase 11 | Planned |
| OSS | OSS-01 through OSS-06 | 6 | Phase 11 | Planned |

**Total:** 48/48 requirements, 0 orphans, 0 duplicates.

---

## Key Dependencies & Constraints

- **Phase 7 → 8:** Shared primitives (Card, SectionHeader) and token baseline must establish before scaling to larger panels.
- **Phase 8 → 9:** Mode panel pattern established in Assess/Found informs Revive/Reposition migrations.
- **Phase 9 → 10:** All components must be migrated before verification gates can pass.
- **Verification gates (Phase 10):** Grep verifier, manual light/dark checks, contrast audit, and production build verification are gating criteria for v1.1 ship.
- **Phase 9 NEW gates:** React shim guard (npm run lint:shim), live host mount smoke test (VPS), SDK payload audit — Phase 8 skipped these and shipped hotfixes post-launch.
- **Phase 10 → 11:** Public release gated on v1.1 UI parity verification (grep, contrast, build, bundle) — do not `npm publish` until Phase 10 success criteria pass.

---

## Success Criteria Traceability

All success criteria map to requirements; all requirements support at least one criterion:

**Phase 7:**
- Criterion 1 (Card/SectionHeader primitives) ← UIF-01, UIF-02
- Criterion 2 (MainPanel/SidebarLink) ← UIF-03, UIF-04
- Criterion 3 (ModeBanner/StatusBadge) ← UIF-05, UIF-06
- Criterion 4 (7 shared components) ← UIF-07
- Criterion 5 (Dark-mode test) ← UIF-09
- Criterion 6 (OKLCH format verify) ← UIF-08

**Phase 8:**
- Criterion 1 (Assess panel colors) ← UIA-01, UIA-02
- Criterion 2 (Evidence/Confidence displays) ← UIA-03
- Criterion 3 (Amendment diff) ← UIA-04
- Criterion 4 (Approval modals) ← UIA-05
- Criterion 5 (Found panel + interview) ← UIFM-01, UIFM-02
- Criterion 6 (Interview visual consistency) ← UIFM-03

**Phase 9:**
- Criterion 1 (Revive components) ← UIR-01, UIR-02
- Criterion 2 (Action flow) ← UIR-03
- Criterion 3 (Sample-pivot modal) ← UIR-04
- Criterion 4 (Reposition flow) ← UIRP-01, UIRP-02
- Criterion 5 (Confirm/apply modals) ← UIRP-03
- Criterion 6 (React shim guard) ← UIR-01 through UIRP-03 (all Phase 9 components)
- Criterion 7 (Live host mount) ← UIR-01 through UIRP-03 (all Phase 9 components)
- Criterion 8 (SDK payload audit) ← UIRP-01, UIRP-02 (Reposition bridge handlers)

**Phase 10:**
- Criterion 1 (History panel) ← UIM-01, UIM-02
- Criterion 2 (Engagement memory UI) ← UIM-03, UIM-04
- Criterion 3 (Schedules section) ← UIM-05
- Criterion 4 (Grep verifier) ← UIV-01
- Criterion 5 (Manual verification + contrast) ← UIV-02, UIV-03
- Criterion 6 (Production build verify) ← UIV-04
- Criterion 7 (Bundle size check) ← UIV-05
- Criterion 8 (Documentation) ← UID-01, UID-02

**Phase 11:**
- Criterion 1 (npm publish) ← DIST-01
- Criterion 2 (plugin-manager install verified) ← DIST-02
- Criterion 3 (GitHub release v1.1.0) ← DIST-03
- Criterion 4 (Bundle audit) ← DIST-04
- Criterion 5 (README) ← OSS-01
- Criterion 6 (CONTRIBUTING) ← OSS-02
- Criterion 7 (LICENSE) ← OSS-03
- Criterion 8 (CODEOWNERS + Aron access) ← OSS-04
- Criterion 9 (Issue/PR templates) ← OSS-05
- Criterion 10 (CHANGELOG) ← OSS-06

---

*Last updated: 2026-05-11 — Phase 11 added (Distribution + OSS Launch, 10 reqs)*
