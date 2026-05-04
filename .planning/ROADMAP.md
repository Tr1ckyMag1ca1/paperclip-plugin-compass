# Compass — Roadmap

**Project:** Paperclip Plugin — Strategic Consultant for AI Company Lifecycle

---

## Shipped Milestones

- ✅ **v1.0** — Compass Plugin (all 4 modes + engagement memory + scheduled check-ins). 6 phases, 22 plans, 829 tests, 72/72 requirements. See [`.planning/milestones/v1.0-ROADMAP.md`](milestones/v1.0-ROADMAP.md).

---

## Active Milestone: v1.1 Compass UI Parity with Paperclip Host

**Status:** Planning
**Phases:** 4 (7–10, continuing from v1.0)
**Total Requirements:** 38 v1
**Granularity:** Coarse (per config.json)

Goal: Reskin Compass UI (~55 components, 5 mode panels) to look indistinguishable from Paperclip host shell. Fix layout bugs caused by nonexistent custom Tailwind tokens and light-only color utilities.

### Phases

- [ ] **Phase 7: Foundations + Shared Primitives** - Design token baseline and reusable components (9 reqs)
- [ ] **Phase 8: Assess + Found Panels** - Migrate primary mode panels to host tokens (8 reqs)
- [ ] **Phase 9: Revive + Reposition Panels** - Complete secondary mode migrations (7 reqs)
- [ ] **Phase 10: Memory + Verification + Documentation** - History panel, verification gates, documentation (14 reqs)

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

**Plans:** TBD

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

**Plans:** TBD

**UI hint**: yes

---

### Phase 9: Revive + Reposition Panels

**Goal:** Migrate remaining mode panels (Revive + Reposition, ~20 components) to host tokens; ensure action/intent flows and modal confirmations respect new token hierarchy; no layout breakage.

**Depends on:** Phase 8.

**Requirements:** UIR-01, UIR-02, UIR-03, UIR-04, UIRP-01, UIRP-02, UIRP-03

**Success Criteria** (what must be TRUE):
1. RevivePanel root container, ActionItemCard, PriorityBadge, and StallSummaryBadge use host tokens
2. ActionQueuePanel and ActionConfirmationModal display correctly; action selection flow unchanged
3. SamplePivotModal migrated; one-click pivot UI matches host design
4. RepositionInterviewFlow and IntentEntry use host tokens; scoped re-interview flow feels native
5. ScopeConfirmation and CascadeReviewPanel migrated; all confirm/apply modals consistent across modes

**Plans:** TBD

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

**Plans:** TBD

**UI hint**: yes

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 7. Foundations | 0/? | Not started | — |
| 8. Assess + Found | 0/? | Not started | — |
| 9. Revive + Reposition | 0/? | Not started | — |
| 10. Memory + Verify + Docs | 0/? | Not started | — |

---

## Coverage Summary

**Requirements mapped:** 38/38 ✓

| Category | Requirements | Count | Phase |
|----------|--------------|-------|-------|
| UI-FOUND | UIF-01 through UIF-09 | 9 | Phase 7 |
| UI-ASSESS | UIA-01 through UIA-05 | 5 | Phase 8 |
| UI-FOUND-MODE | UIFM-01 through UIFM-03 | 3 | Phase 8 |
| UI-REVIVE | UIR-01 through UIR-04 | 4 | Phase 9 |
| UI-REPO | UIRP-01 through UIRP-03 | 3 | Phase 9 |
| UI-MEM | UIM-01 through UIM-05 | 5 | Phase 10 |
| UI-VERIFY | UIV-01 through UIV-05 | 5 | Phase 10 |
| UI-DOCS | UID-01, UID-02 | 2 | Phase 10 |

**Total:** 38/38 requirements, 0 orphans, 0 duplicates.

---

## Key Dependencies & Constraints

- **Phase 7 → 8:** Shared primitives (Card, SectionHeader) and token baseline must establish before scaling to larger panels.
- **Phase 8 → 9:** Mode panel pattern established in Assess/Found informs Revive/Reposition migrations.
- **Phase 9 → 10:** All components must be migrated before verification gates can pass.
- **Verification gates (Phase 10):** Grep verifier, manual light/dark checks, contrast audit, and production build verification are gating criteria for v1.1 ship.

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

**Phase 10:**
- Criterion 1 (History panel) ← UIM-01, UIM-02
- Criterion 2 (Engagement memory UI) ← UIM-03, UIM-04
- Criterion 3 (Schedules section) ← UIM-05
- Criterion 4 (Grep verifier) ← UIV-01
- Criterion 5 (Manual verification + contrast) ← UIV-02, UIV-03
- Criterion 6 (Production build verify) ← UIV-04
- Criterion 7 (Bundle size check) ← UIV-05
- Criterion 8 (Documentation) ← UID-01, UID-02

---

*Last updated: 2026-05-04 — v1.1 roadmap created*
