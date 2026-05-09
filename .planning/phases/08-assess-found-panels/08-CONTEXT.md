# Phase 8: Assess + Found Panels - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate the Assess and Found mode panels (~19 components) to host shadcn tokens. Convert dynamic color classes from template literals to explicit safelist-safe maps. Ensure all evidence/confidence displays, drift severity indicators, amendment diffs, approval modals, and the vision-quest interview surface render indistinguishable from the Paperclip host shell in light + dark themes.

In scope:
- Assess components: AssessPanel, DriftReportPanel, DriftItemCard, EvidenceChip, ConfidenceBar, AmendmentDiff, ApprovingWaitingState, ApprovalRoutingModal, CustomOverrideWarning.
- Found components: FoundPanel, PresetSelector, QuestionRenderer, InterviewSection, SectionNavRail, VisionPreview, ConfirmationModal, ApplyProgress, ApplyErrorDisplay, ProvisioningSummary.
- Token swaps per UI_REDO_HANDOFF.md migration map (gap-xs/sm/md/lg → gap-1/2/3/4, px-md/py-sm → px-3/py-2, rounded → rounded-none, light-only colors → semantic palette + opacity modifiers).
- Severity → class map refactor (UIA-02): static per-component const records with full class strings.

Out of scope:
- Revive + Reposition panels (Phase 9).
- Memory / History panel (Phase 10).
- Verification gate scripts and grep verifier (Phase 10).
- New Modal primitive extraction (deferred — migrate in place).
- Behavior changes — reskin only.
- New dependencies, plugin Tailwind config, CSS-in-JS.

</domain>

<decisions>
## Implementation Decisions

### Drift Severity Color Map (UIA-02)
- **D-01:** Tonal semantic palette. `low` = `text-muted-foreground` (no bg). `medium` = `text-yellow-600 bg-yellow-500/10`. `high` = `text-red-600 bg-red-500/10`. Reads severity intuitively, matches Phase 7 D-04 semantic palette.
- **D-02:** Map shape = per-component static const. `const SEVERITY_CLASSES: Record<Severity, string> = { low: "...", medium: "...", high: "..." }` at top of `DriftItemCard.tsx`. Full class strings (Tailwind JIT picks them up — no safelist needed). No shared util in v1.1; revisit if duplicated.
- **D-03:** Mode color usage in DriftReportPanel — Claude's discretion. Researcher/planner determines from grep + component reads whether mode-color shows up beyond ModeBanner; if so, reuse Phase 7 D-04 mode→color mapping inline.

### AmendmentDiff (UIA-04)
- **D-04:** Visual treatment = text + subtle bg tint. Add lines: `text-emerald-600 bg-emerald-500/10`. Remove lines: `text-red-600 bg-red-500/10`. Context lines: `text-foreground` (no bg). Tint makes diff scannable without over-weighting.
- **D-05:** Structure = keep `<details>` + `<summary>` collapsible wrapper. Migrate broken tokens (gap-sm → gap-2, p-sm → p-2, p-md → p-3, mt-md → mt-3, rounded → rounded-none). Preserve current reveal-on-click UX.
- **D-06:** No Card-primitive wrapper around the diff in v1.1 — keep current inline shape. Pure token swap, not a structural redesign.

### EvidenceChip + ConfidenceBar (UIA-03)
- **D-07:** EvidenceChip = StatusBadge variant. StatusBadge already migrated in Phase 7 to host semantic palette; EvidenceChip becomes a thin wrapper or direct callsite consumer of StatusBadge. Reuse, don't duplicate.
- **D-08:** ConfidenceBar = custom horizontal bar. Track: `bg-muted` rounded-none (sharp). Fill: `bg-emerald-500` (high), `bg-yellow-500` (medium), `bg-red-500` (low) — threshold-driven by score. Score readout: `text-label text-muted-foreground` to right of bar. Per-component static const for thresholds and fill class.

### Approval Modals (UIA-05)
- **D-09:** Sharp corners + dim/blur backdrop. Modal panel: `bg-card border border-border rounded-none shadow-lg`. Backdrop: `bg-background/80 backdrop-blur-sm`. Drop `bg-black/50` (light-only feel) and `rounded-lg` (Phase 7 D-09 sharp-corner constraint).
- **D-10:** Migrate in place — no Modal primitive extraction in v1.1. ApprovalRoutingModal, CustomOverrideWarning, ConfirmationModal each get individual token migration. If three modals show pure structural duplication during plan-phase, planner may extract — otherwise defer to v1.2.
- **D-11:** Internal text tokens — replace `text-heading`, `text-body`, `text-label`, `text-accent`, `text-foreground/70` per Phase 7 D-05 mechanical map (`text-heading` → `text-base font-semibold`, `text-body` → `text-sm`, `text-label` → `text-xs font-medium`, `text-accent` → `text-emerald-600` only where semantic; otherwise `text-foreground`). Replace `space-y-md`/`space-y-lg` and `gap-md`/`gap-lg` with numeric scale.

### Vision-Quest Interview Layout (UIFM-02, UIFM-03)
- **D-12:** SectionNavRail = keep horizontal tab strip (current shape). Migrate broken tokens (gap-xs → gap-1, gap-sm → gap-2, px-md → px-3, py-sm → py-2, rounded → rounded-none, mr-sm → mr-2, pb-sm → pb-2). Preserve overflow-x-auto scroll for narrow plugin sidebar.
- **D-13:** Active section visual = neutral bold. Active = `bg-foreground text-background` (or equivalent host inverse). Drop `bg-accent text-accent-foreground` for active state — emerald is reserved for Found-mode signal + completed state per Phase 7 D-04. Completed sections keep emerald `CheckCircle` icon (already in code, reads as success).
- **D-14:** VisionPreview = Card variant=`muted` with SectionHeader per vision section. Reuses Phase 7 Card + SectionHeader primitives heavily.
- **D-15:** ApplyProgress = Card variant=`default` with linear progress bar. Track `bg-muted` rounded-none, fill `bg-foreground` (neutral, not emerald — progress is in-flight, not success). Step list below bar with `text-sm text-muted-foreground` for pending, `text-sm text-foreground` for active, emerald `CheckCircle h-4 w-4` for done.
- **D-16:** ApplyErrorDisplay = Card variant=`default` containing alert region: `bg-red-500/10 border border-red-500/30 p-3` with `text-red-600 text-sm`. Distinct from ConfirmationModal — error is inline, not modal.

### Migration Ordering (within phase)
- **D-17:** Assess shell first, then Found shell. Order: (1) DriftItemCard severity-map refactor sets the explicit-map pattern, (2) DriftReportPanel + AssessPanel root, (3) EvidenceChip + ConfidenceBar, (4) AmendmentDiff, (5) ApprovingWaitingState + ApprovalRoutingModal + CustomOverrideWarning (modal pattern locked), (6) FoundPanel root + SectionNavRail, (7) PresetSelector + QuestionRenderer + InterviewSection (interview body), (8) VisionPreview + ApplyProgress + ApplyErrorDisplay + ProvisioningSummary + ConfirmationModal (apply gate). Planner refines into wave structure.

### Claude's Discretion
- Whether DriftReportPanel needs a mode→color util beyond severity map (researcher determines from grep).
- Whether to extract a `cn()` helper if conditional class composition multiplies — Phase 7 deferred this; same logic applies. Match existing inline-template-literal pattern unless three+ callsites push complexity.
- Threshold cutoffs for ConfidenceBar fill color (e.g., >0.75 emerald, 0.4–0.75 yellow, <0.4 red) — pick reasonable defaults matching v1.0 behavior; founder reviews in dual-render probe.
- Exact dark-mode contrast verification — relies on Phase 7 OKLCH probe baseline; spot-check during implementation.

### Folded Todos
None — no pending todos matched this phase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Migration map + design source
- `UI_REDO_HANDOFF.md` — Concrete class swap table (gap-xs→gap-1, color swaps, rounded-none, opacity /10 /20). Authoritative migration map for v1.1.
- `~/Development/paperclip-temp/ui/src/index.css` — Host shadcn token definitions (OKLCH values for `--background`, `--card`, `--border`, `--foreground`, `--muted-foreground`, `--radius-lg: 0px`).
- `~/Development/paperclip-temp/ui/src/components/` — shadcn "new-york" reference components (baseColor: neutral, lucide icons). Visual reference for indistinguishable parity. Note Dialog/Modal patterns if used.

### Project planning
- `.planning/REQUIREMENTS.md` §UI-ASSESS, §UI-FOUND-MODE — UIA-01 through UIA-05 + UIFM-01 through UIFM-03.
- `.planning/ROADMAP.md` §"Phase 8" — Goal + 6 success criteria.
- `.planning/PROJECT.md` — Constraints (Plugin SDK only, no plugin Tailwind config, no CSS-in-JS, MIT license).
- `.planning/STATE.md` — v1.1 milestone memory.
- `.planning/phases/07-foundations-shared-primitives/07-CONTEXT.md` — Phase 7 decisions D-01 through D-10 (Card, SectionHeader, ModeBanner, semantic palette, mechanical typography map, sharp corners, OKLCH probe baseline).
- `.planning/phases/07-foundations-shared-primitives/07-VERIFICATION.md` — Phase 7 PASS verdict; OKLCH + opacity modifiers confirmed working.

### Existing UI surface (the migration target)
- `src/ui/assess/AssessPanel.tsx` — Assess root container.
- `src/ui/assess/DriftReportPanel.tsx` — Drift list + summary.
- `src/ui/assess/DriftItemCard.tsx` — Severity badge + drift item layout (current `severityColor` Record at line 48 is the refactor anchor for D-02).
- `src/ui/assess/EvidenceChip.tsx`, `src/ui/assess/ConfidenceBar.tsx` — Evidence/confidence displays.
- `src/ui/assess/AmendmentDiff.tsx` — Diff renderer (current `text-accent` adds, `text-destructive` removes; broken `gap-sm`, `p-md`, `rounded`).
- `src/ui/assess/ApprovingWaitingState.tsx`, `src/ui/assess/ApprovalRoutingModal.tsx`, `src/ui/assess/CustomOverrideWarning.tsx` — Approval flow (current modal uses `bg-black/50` backdrop, `rounded-lg` panel — both target classes).
- `src/ui/found/FoundPanel.tsx` — Found mode root.
- `src/ui/found/SectionNavRail.tsx` — Horizontal nav tabs (current `bg-accent text-accent-foreground` active state — D-13 target).
- `src/ui/found/PresetSelector.tsx`, `src/ui/found/QuestionRenderer.tsx`, `src/ui/found/InterviewSection.tsx` — Interview body.
- `src/ui/found/VisionPreview.tsx`, `src/ui/found/ApplyProgress.tsx`, `src/ui/found/ApplyErrorDisplay.tsx`, `src/ui/found/ProvisioningSummary.tsx`, `src/ui/found/ConfirmationModal.tsx` — Apply gate.

### Phase 7 primitives consumed by Phase 8
- `src/ui/primitives/Card.tsx` — Card primitive (variant=default|muted|elevated, padding=sm|md|lg).
- `src/ui/primitives/SectionHeader.tsx` — Title/subtitle/actions/icon.
- `src/ui/components/StatusBadge.tsx` — Already on semantic palette; EvidenceChip wraps/consumes it.
- `src/ui/components/ModeBanner.tsx` — Mode→color D-04 reference.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- StatusBadge (Phase 7) — semantic-palette ready. EvidenceChip migrates to be a wrapper/direct caller (D-07).
- Card + SectionHeader primitives — heavy reuse in VisionPreview, ApplyProgress, ApplyErrorDisplay (D-14, D-15, D-16).
- Lucide CheckCircle already used in SectionNavRail completed state — keep, recolor if needed.
- DriftItemCard already uses `Record<Severity, string>` shape (line 48) — refactor target swaps light-only colors for tonal semantic without changing the shape (D-02).

### Established Patterns
- Inline Tailwind template literals for conditional classes (no `cn()` helper). Match in all migrations.
- Function components, named exports, JSDoc — no class components.
- Static const at top of file for class maps (already used in DriftItemCard) — extend pattern to ConfidenceBar fill thresholds.
- Phase 7 D-09 ordering pattern: token-swap-then-verify, primitives consumed in dependent components after primitive itself is migrated.

### Integration Points
- `src/ui/index.tsx` — bundle entrypoint; no slot changes in Phase 8 (panels already declared in v1.0).
- DualRenderProbe (Phase 7) — register Phase 8 components on probe page for founder visual review under both light + dark.
- ModeBanner (Phase 7) — Found-mode banner already shows emerald accent; FoundPanel migration must not double-stack mode color.

### Known Broken Patterns (sample from grep)
- `gap-xs`, `gap-sm`, `gap-md`, `gap-lg`, `px-md`, `py-sm`, `mt-md`, `space-y-md`, `space-y-lg`, `pb-sm`, `mr-sm`, `p-sm`, `p-md`, `p-lg` — all custom-spacing tokens, no-op without plugin Tailwind config. Target classes for swap.
- `text-heading`, `text-body`, `text-label`, `text-accent` — replace per Phase 7 D-05 mechanical map.
- `rounded`, `rounded-lg` — replace with `rounded-none` per sharp-corner constraint.
- `bg-black/50` (modal backdrop) — replace with `bg-background/80 backdrop-blur-sm` per D-09.
- Light-only color literals (`bg-green-50`, `text-slate-600`, `border-green-200`) — replace with semantic palette + opacity modifiers (`bg-emerald-500/10`, `text-muted-foreground`, `border-border`).

</code_context>

<specifics>
## Specific Ideas

- "Indistinguishable from host shell" remains the bar (carried from Phase 7).
- Severity map refactor (UIA-02) is the load-bearing UIA pattern: explicit static record with full class strings — Tailwind JIT-safe, no safelist config.
- Emerald reserved for success/completed/Found-mode (Phase 7 D-04). Active-but-not-complete states use neutral bold (D-13). In-flight states (ApplyProgress) use neutral foreground fill (D-15) — emerald only for done steps.
- Modal pattern locked once on ApprovalRoutingModal — same backdrop/panel/corner treatment applies to CustomOverrideWarning + ConfirmationModal (D-10).
- Founder is non-developer — visual verification leans on Phase 7 DualRenderProbe extended to cover Phase 8 components.

</specifics>

<deferred>
## Deferred Ideas

- Modal primitive extraction (`src/ui/primitives/Modal.tsx`) — defer to v1.2 unless duplication forces it during plan-phase (D-10).
- Shared `severity.ts` / `mode-color.ts` util — defer until two+ components need same map (D-02, D-03).
- `cn()` / `clsx` helper — Phase 7 deferred; same logic.
- Screenshot-diff regression infra (Percy / Chromatic) — already deferred to v1.2 in REQUIREMENTS.md.
- ConfidenceBar threshold tuning UI / per-mode override — out of v1.1 scope (reskin only, no behavior changes).
- Side-by-side AmendmentDiff layout — keep unified diff in v1.1.
- Vertical sidebar variant of SectionNavRail — keep horizontal tab strip in v1.1 (D-12).

</deferred>

---

*Phase: 8-assess-found-panels*
*Context gathered: 2026-05-09*
