# Phase 5: Reposition Mode - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous run)

<domain>
## Phase Boundary

Phase 5 delivers Reposition Mode end-to-end: founder triggers Reposition on a healthy company, describes a strategic shift in plain English (e.g., "rebrand to focus on compliance") → plugin runs a deterministic shift-classifier that maps the shift description to affected VISION sections (voice, product direction, target customer, mission, growth strategy, etc.) → scoped vision-quest re-interview surfaces ONLY the affected sections (not full 6-section rewrite) → founder answers, generates targeted VISION amendments → preview shows per-section diff between current VISION and proposed amendments → cascade plan covers brand/voice/scope changes per affected agent (reusing Phase 3 cascade machinery + screening) with per-agent custom-override warnings → Apply step routes amendments through Amendment Protocol per-company approval routing (`founder` | `founder+ceo`, reusing Phase 3) → writes amendments to VISION via SDK adapter, creates downstream cascade issues, queues wakeups with idempotency keys → preserves intentional agent variance and custom overrides (no overwrites without per-agent confirmation).

5 v1 requirements covered: REPO-01..05, plus reusing XC-02, XC-03, XC-04, XC-08.

</domain>

<decisions>
## Implementation Decisions

### Shift Classifier (deterministic + lightweight)
- **D-01:** Shift classifier lives in `src/reposition/shift-classify.ts` as pure function `classifyShift(description: string, currentVision: ParsedVision): ShiftScope` returning `{ affectedSections: VisionSectionId[], confidence: number, rationale: string }`. Uses keyword + section-overlap heuristics — NO LLM. Document keyword groups inline (rebrand → voice + product direction; pivot → target customer + mission; scale → growth strategy + sales model; tighten → principles + red lines; etc.).
- **D-02:** Threshold for surfacing a section to the re-interview: 0.4 (lower than Assess drift threshold because founder explicit shift intent should err toward including borderline sections; founder can deselect any).
- **D-03:** Founder can override classification: UI surfaces classified sections with checkboxes; founder may add or remove sections before re-interview begins.

### Scoped Re-Interview (reuses Phase 2 interview machinery)
- **D-04:** Reuse `src/content/interview/*.md` content from Phase 2 + `src/primitives/interview-loader.ts`. NEW: `src/reposition/scope-filter.ts` filters loaded interview to only the questions whose section is in the affected scope. Pure function: `filterInterviewToScope(allSections, affectedSectionIds): InterviewSection[]`.
- **D-05:** Scoped interview UI reuses `src/ui/found/InterviewSection.tsx`, `QuestionRenderer.tsx`, `SectionNavRail.tsx`. Wire into a thin `RepositionInterviewFlow.tsx` orchestrator (NOT FoundPanel — Reposition has different state machine and different output target). Section nav rail shows only the affected sections.
- **D-06:** Pre-fill questions with current VISION values where possible: parser exposes `getSectionAnswerSeed(parsedVision, sectionId): Partial<InterviewAnswers>`. Founder edits, doesn't restart from blank.

### Amendment Generation (reuses Phase 2 template-fill + Phase 3 amendment formatter)
- **D-07:** `src/reposition/amend.ts` orchestrates: load current VISION → run scoped interview → run derive functions on new answers → fill template slots for affected sections → diff against current → produce per-section AmendmentEntry list (reuses Phase 3 `src/assess/amendment.ts` types and changelog formatter).
- **D-08:** Quality check (FOUND-12 spirit): all newly-edited required slots must be non-empty before Apply. Reuses `src/found/quality-check.ts`.

### Cascade (reuses Phase 3 cascade.ts)
- **D-09:** `src/reposition/cascade.ts` thin wrapper around `src/assess/cascade.ts` planCascade. Maps amended VISION sections to affected pods/agents, applies same eligibility screening (no newly-provisioned), same custom-override detection.
- **D-10:** REPO-05 — preserve intentional agent variance: cascade plan UI offers per-agent toggle (apply / skip / custom-merge) when an agent has custom overrides. Default: skip with a clear warning. Founder must opt-in to overwrite custom-instructed agents.

### Approval Routing (reuses Phase 3)
- **D-11:** Reuses `src/assess/apply.ts` approval routing pattern: per-company `approvalRouting` config; `founder` mode applies on confirmation; `founder+ceo` queues to approvals table. Phase 5 adds no new routing logic — uses Phase 3 verbatim.

### Apply Transactionality
- **D-12:** Phase 5 Apply mirrors Phase 3 Apply pattern (preflight → sequential write → compensating rollback). New file `src/reposition/apply.ts` extends. Idempotency key namespace: `compass:reposition:${company_id}:${run_id}:${agent_id}`.

### UX Shape
- **D-13:** RepositionPanel main flow has explicit phases: `intent` (textarea: "describe the shift") → `scope-confirm` (classified sections shown, founder edits) → `interview` (scoped re-interview) → `preview` (per-section diff) → `cascade-review` (per-agent decisions) → `confirming` → `applying` → `complete`/`waiting-approval`/`error`.
- **D-14:** Mid-run state persists in worker-state keyed `compass:reposition:run:${company_id}` — same pattern as Phase 2/3/4.
- **D-15:** Shift-intent textarea has examples shown as ghost text: "rebrand toward compliance" / "narrow focus to enterprise customers" / "stop accepting government work" / "tighten voice".

### Reuse Map
- **D-16:** Heavy reuse:
  - Interview content + components: Phase 2
  - VISION parser + amendment formatter: Phase 3
  - Cascade screening + custom-override detection: Phase 3
  - Approval routing logic: Phase 3
  - Apply orchestrator pattern (preflight + sequential + rollback): Phase 2/3
  - ConfirmationModal + ApplyProgress + ApplyErrorDisplay + CustomOverrideWarning + AmendmentDiff: Phase 2/3
  - Idempotency utility: Phase 2 (extend namespace)

### Cross-Cutting
- **D-17:** SDK adapter chokepoint (XC-01). No new adapter methods needed — Phase 3 already added everything required.
- **D-18:** Idempotency keys on all wakeups (XC-03).
- **D-19:** Never read company_secrets values (XC-04).
- **D-20:** XC-08 unit tests: shift-classify heuristics, scope-filter logic, amend orchestrator, apply rollback paths.
- **D-21:** Integration test: end-to-end reposition (rebrand voice example) with founder routing AND founder+ceo routing.
- **D-22:** Cascade test: at least one fixture with custom-override agent — verify default skip + opt-in overwrite path.

### Claude's Discretion
- React component file layout in `src/ui/reposition/`
- Concrete keyword groups for shift classifier (Claude tunes during planning)
- Diff visual treatment for cascade preview (likely reuses Phase 3 AmendmentDiff)
- Scope-confirmation UI style (checkbox list vs tag selector)
- Polling interval for founder+ceo approval (Claude reuses Phase 3 default)

</decisions>

<canonical_refs>
## Canonical References

- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md` (REPO-01..05), `.planning/ROADMAP.md`, `.planning/STATE.md`
- `.planning/phases/01-skeleton-inventory-mode-detection/01-CONTEXT.md`
- `.planning/phases/02-found-mode/02-CONTEXT.md`, `02-UI-SPEC.md`
- `.planning/phases/03-assess-mode/03-CONTEXT.md`, `03-UI-SPEC.md`, `03-PATTERNS.md`
- `.planning/phases/04-revive-mode/04-CONTEXT.md`, `04-UI-SPEC.md`, `04-PATTERNS.md`
- `.planning/phases/03-assess-mode/03-04-SUMMARY.md`
- `.planning/phases/04-revive-mode/04-05-SUMMARY.md`
- `PROMPT.md`, `COLLAB.md`, `CLAUDE.md`
- `.planning/research/STACK.md`, `ARCHITECTURE.md`, `PITFALLS.md`

### Compass repo (heavy reuse)
- `src/sdk/adapter.ts`
- `src/content/interview/*.md` + `src/content/vision-template.md`
- `src/primitives/interview-loader.ts`
- `src/found/{derive,template-fill,quality-check,idempotency}.ts`
- `src/assess/{vision-parse,activity,amendment,cascade,apply}.ts`
- `src/ui/found/{InterviewSection,QuestionRenderer,SectionNavRail,ConfirmationModal,ApplyProgress,ApplyErrorDisplay}.tsx`
- `src/ui/assess/{AmendmentDiff,CustomOverrideWarning,ApprovalRoutingModal,ApprovingWaitingState}.tsx`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Almost everything in src/found and src/assess is reusable.
- Worker-state persistence hook pattern from Phase 2/3/4.
- Mock host fixtures: extend with reposition-shift fixtures (rebrand, pivot, scale, tighten).

### Established Patterns
- Pure-function primitives.
- Per-company config in worker-state for routing.
- Two-stage approval gate for VISION writes (XC-06 spirit).
- Cascade with eligibility screening + custom-override detection.

### Integration Points
- Phase 6 (engagement memory) will record reposition history alongside found/assess/revive.

</code_context>

<specifics>
## Specific Ideas
- Intent textarea placeholder: "Describe the shift in plain English. Examples: 'rebrand toward compliance', 'narrow focus to enterprise customers', 'tighten our voice'."
- Scope-confirmation header: "These sections will be re-interviewed. Add or remove any."
- Cascade-review header: "These agents will receive new instructions. Skip any with custom overrides if you want to keep them."
- Per-agent override toggle copy: "Keep custom" / "Apply repositioning" / "Merge"

</specifics>

<deferred>
## Deferred Ideas
- LLM-aided intent parser (deferred — keep deterministic in v1)
- Per-pod cascade preview rolled up across many agents (v1 lists per-agent only)
- Reposition history rollup (Phase 6 engagement memory)
- Custom-merge action for overridden agents (v1 ships keep/apply only; merge is Phase 6+)

</deferred>

---

*Phase: 5-Reposition Mode*
*Context gathered: 2026-05-03*
