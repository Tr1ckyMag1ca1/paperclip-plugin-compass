# Phase 3: Assess Mode - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning
**Mode:** Auto-generated (skip_discuss=true; founder requested autonomous run)

<domain>
## Phase Boundary

Phase 3 delivers Assess Mode end-to-end: founder triggers Assess on an active company → plugin pulls inventory snapshot (Phase 1 patterns) and parses the company's VISION.md (written by Phase 2) → drift detector compares each VISION section against the last 30 days of `issues`, `issue_comments`, and `documents` with per-item confidence scoring → drift report renders grouped by VISION section in the main panel with inline proposed amendments → founder reviews each item and accepts/rejects individually → accepted amendments route through the Amendment Protocol (default-NO + dated changelog) → per-company approval routing (`founder` default vs `founder+ceo`) — `founder+ceo` mode writes to `approvals` table and waits for CEO agent decision → Apply step writes amendments to VISION.md document, creates downstream cascade issues for affected pods/agents with explicit linking, respects custom overrides and excludes newly-provisioned agents from cascade.

14 v1 requirements covered: ASSESS-01..09, XC-02, XC-03, XC-04, XC-08, XC-09.

</domain>

<decisions>
## Implementation Decisions

### Drift Detection (deterministic-first)
- **D-01:** Drift detection lives in `src/assess/drift.ts` as a pure function `detectDrift(vision: ParsedVision, activity: ActivitySnapshot, windowDays: 30): DriftReport`. No LLM call in v1 — uses keyword/section overlap heuristics + confidence scoring. PROJECT.md mode-detection rule (hard rules, no LLM tax) extends to drift detection. Keeps cost predictable, output reproducible, and easily unit-testable per XC-08.
- **D-02:** ActivitySnapshot input shape lives in `src/assess/activity.ts` and is built by querying SDK adapter for `issues`, `issue_comments`, `documents` filtered to last 30 days. The 30-day window is fixed (per PROJECT.md constraint — not user-configurable in v1).
- **D-03:** Drift items include: `vision_section`, `evidence[]` (issue/comment/doc IDs that triggered the signal), `confidence` (0..1), `proposed_amendment` (markdown delta to apply if accepted), `severity` (info/warn/blocker).
- **D-04:** Confidence scoring blends three signals: lexical overlap (term frequency vs section), semantic clustering of evidence (count of distinct activity items pointing at same drift), recency-weighted decay (more recent = higher weight). Threshold for surface-to-founder defaults to 0.5; below that, drift item drops to deferred bucket.

### VISION.md Parsing
- **D-05:** VISION parser lives in `src/assess/vision-parse.ts` as pure function `parseVision(markdown: string): ParsedVision` returning all 19 named sections from the Phase 2 template (mission, mandate, voice, principles, etc.). Parser respects the slot-based template shape and is round-trip-safe with `serializeVision(parsed): string` so amendments can be applied and re-emitted without losing structure.
- **D-06:** Round-trip stability is enforced via unit test: parse(serialize(parse(x))) === parse(x).

### Amendment Protocol Enforcement
- **D-07:** Amendment Protocol lives in `src/assess/amendment.ts`. Default-NO: every drift item starts unaccepted; founder must explicitly accept each one. Dated changelog entry (timestamped, with founder identity if SDK exposes it) is appended to VISION.md `## Amendment Log` section on Apply.
- **D-08:** Amendment delta presentation: render before-vs-after diff (unified diff, not side-by-side initially — narrower sidebar constraint). Founder sees exact lines that change before approving Apply.

### Approval Routing
- **D-09:** Per-company config field `compass.approvalRouting`: `'founder'` (default) | `'founder+ceo'`. Stored in the company-scoped Compass plugin config (per-instance plugin SDK config, not new schema migration). Default value seeded on first Assess run.
- **D-10:** `'founder'` mode: amendments apply directly on Apply with founder confirmation modal. `'founder+ceo'` mode: amendments insert into `approvals` table via SDK with type `compass.assess.amendment`, payload includes the proposed delta + drift evidence; Apply step waits for `decided_by_user_id`/`status=approved` before proceeding (polling via SDK or pending state in worker). Apply step is split into "queue for approval" vs "execute approved amendment" subflows.
- **D-11:** UI surfaces routing mode at top of Assess panel — founder sees current routing + a button to switch (writes config). Switching is logged to the engagement memory (Phase 6 will surface this; Phase 3 stores the audit entry in `documents`-scoped Compass log).

### Cascade Logic
- **D-12:** Cascade lives in `src/assess/cascade.ts`. After amendment is applied, walks affected agents per amended VISION section (e.g., voice change → all customer-facing agents; principle change → all agents). Creates kickoff-style issues per affected agent with explicit linking back to the VISION amendment via issue body reference and `issue_documents.key = "compass:assess:cascade:${run_id}"`.
- **D-13:** Agent screening excludes newly-provisioned agents (heuristic: `created_at < 7 days ago` AND `last_heartbeat_at` empty). Reason: cascade against agents that haven't started would dump premature work; let them get going first.
- **D-14:** Custom-override detection: if an agent's `adapter_config` or instructions deviate from preset baseline, surface a warning to founder before cascade — "Agent X has custom overrides. Cascade will overlay the amendment; review the diff before continuing." Founder confirms per-agent.

### Apply Transactionality (XC-02 — extends Phase 2 D-09 pattern)
- **D-15:** Phase 3 Apply reuses the preflight → sequential write → compensating-rollback orchestrator pattern from Phase 2 (`src/found/apply.ts`). New file `src/assess/apply.ts` extends it for the Assess flow: preflight (vision exists, parsing succeeds, no concurrent assess run), sequential writes (VISION amendment → cascade issues → wakeup notifications for affected agents), reverse-order compensating rollback on partial failure. Idempotency keys per XC-03: `compass:assess:${company_id}:${assess_run_id}:${agent_id}`.

### UX Shape
- **D-16:** Assess main panel: header shows company name + routing mode + "Run Assess" button (disabled if no VISION exists; surfaces a clear next step pointing at Found). On run, shows progress indicator while drift detection runs, then renders DriftReportPanel grouped by VISION section. Each drift item is collapsible, shows evidence chips, confidence bar, proposed amendment diff, and accept/reject toggle. Sticky footer with "Apply N accepted amendments" button (disabled until at least one accepted; opens two-stage approval gate consistent with Phase 2 D-15).
- **D-17:** Mid-run state (drift detected but not yet applied) persists in worker-state keyed `compass:assess:run:${company_id}` so founder can leave and return to a half-reviewed report without re-running detection.

### Reuse from Phase 2
- **D-18:** Reuse `src/sdk/adapter.ts` extensions from Phase 2: `writeDocument` (for VISION amendment), `createIssue` (for cascade), `queueWakeup` (for affected-agent wakeups). Phase 3 adds: SDK adapter methods for `listIssues({ companyId, since })`, `listIssueComments({ companyId, since })`, `listDocuments({ companyId, since })`, `insertApproval(payload)`, `getApproval(id)`. All routed through the chokepoint.
- **D-19:** Reuse two-stage approval gate UX from Phase 2 (preview screen + final modal) for Apply confirmation. Confirmation modal lists exact write count.
- **D-20:** Reuse Vitest mock host harness with new fixtures: company-with-drift, company-no-drift, company-with-overrides, company-pending-ceo-approval.

### Cross-Cutting Architectural Rules
- **D-21:** All writes route through SDK adapter (XC-01).
- **D-22:** Plugin never reads `company_secrets` values (XC-04). Approval routing config does not contain secrets.
- **D-23:** XC-08 unit tests required for: drift.ts pure functions, vision-parse.ts round-trip, amendment.ts changelog formatting, cascade.ts agent screening, apply.ts rollback paths, idempotency-key generation.
- **D-24:** XC-09 integration tests required: end-to-end Assess flow (run → review → apply with founder routing) + end-to-end with founder+ceo routing (queues approval, simulates CEO decision, completes apply).

### Claude's Discretion
- React component file layout inside `src/ui/assess/`
- Diff rendering library (custom regex vs lightweight diff lib — favor zero deps if possible)
- Confidence bar visual treatment
- Concrete heuristic weights inside the confidence scoring blend (Claude tunes during planning + tests)
- Polling interval for `founder+ceo` approval wait (Claude picks reasonable default; surfaces a "checking..." indicator)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning artifacts
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md` — ASSESS-01..09 + XC-02, XC-03, XC-04, XC-08, XC-09
- `.planning/ROADMAP.md` — Phase 3 success criteria
- `.planning/STATE.md`
- `.planning/phases/01-skeleton-inventory-mode-detection/01-CONTEXT.md` — adapter chokepoint, mode detection, worker-state pattern
- `.planning/phases/02-found-mode/02-CONTEXT.md` — apply orchestrator pattern, two-stage gate, idempotency format
- `.planning/phases/02-found-mode/02-UI-SPEC.md` — design tokens, copy conventions, two-stage gate UX
- `.planning/phases/02-found-mode/02-04-SUMMARY.md` — FoundPanel orchestrator pattern
- `PROMPT.md` — original spec
- `COLLAB.md`

### Research outputs (still load-bearing)
- `.planning/research/STACK.md`
- `.planning/research/ARCHITECTURE.md`
- `.planning/research/PITFALLS.md` — Pitfalls 1, 2, 3 still apply

### Vision-quest content origin (Amendment Protocol reference)
- https://github.com/aronprins/paperclip-vision/tree/main/references — Amendment Protocol pattern (default-NO + dated changelog)

### Paperclip core
- `~/Development/paperclip-temp/doc/plugins/PLUGIN_SPEC.md`
- `~/Development/paperclip-temp/doc/plugins/PLUGIN_AUTHORING_GUIDE.md`
- `~/Development/paperclip-temp/packages/plugins/sdk/` — look for issuesApi.list, issueCommentsApi.list, approvalsApi
- `~/Development/paperclip-temp/packages/plugins/examples/plugin-kitchen-sink-example/`

### Schema (read-only references)
- `documents` — VISION.md amendment writes
- `issues` + `issue_comments` — drift activity sources
- `approvals` — `founder+ceo` routing destination
- `agents` — cascade target (with screening on `created_at`/`last_heartbeat_at`)

### Compass repo (Phase 1+2 outputs Phase 3 builds on)
- `src/sdk/adapter.ts` — extend with list/approval methods
- `src/found/apply.ts` — apply orchestrator pattern reused by `src/assess/apply.ts`
- `src/found/idempotency.ts` — extend key namespace to `compass:assess:`
- `src/types/found.ts` — pattern for typed exports; add `src/types/assess.ts`
- `src/ui/found/` — component patterns reused (preview, confirmation modal, apply progress)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (from Phase 1 + Phase 2)
- `src/sdk/adapter.ts` chokepoint — extend with `listIssues`, `listIssueComments`, `listDocuments`, `insertApproval`, `getApproval`.
- `src/found/apply.ts` — orchestrator pattern (preflight + sequential + rollback). `src/assess/apply.ts` mirrors this shape.
- `src/found/idempotency.ts` — extend namespace; use same UUID-per-run pattern.
- `src/ui/found/ConfirmationModal.tsx` and `ApplyProgress.tsx` — directly reusable for Assess Apply.
- `useInterviewDraft` hook pattern (Phase 2 D-12) — model for `useAssessRun` hook in Phase 3 D-17.
- Plugin SDK mock host (createTestHarness) — extend with assess fixtures.
- Vision-quest VISION.md template structure (Phase 2 vision-template.md) — informs the parser slot list.

### Established Patterns
- All Paperclip access through `src/sdk/adapter.ts` (XC-01).
- Pure-function primitives (mode-detect, derive, drift) — no I/O, fully testable.
- Worker-state for transient per-instance state — extends to Assess run state.
- Two-stage approval gate for any VISION write (XC-06 spirit).
- Conventional Commits (XC-10).

### Integration Points
- Mode override surface (Phase 1) routes Assess; chat panel intent classifier already wired.
- VISION.md doc consumer: parser must accept whatever Phase 2 wrote (single document, 19 sections, slot template) — parser tests verify with golden fixtures based on Phase 2 output.
- Phase 4 (Revive) and Phase 5 (Reposition) will reuse drift detection patterns and amendment protocol; Phase 3 must keep these primitives clean and reusable.

</code_context>

<specifics>
## Specific Ideas

- "Run Assess" button copy must be plain English: "Run a drift audit" or "Audit company against vision" — not "Detect drift". Surface the time window in helper text: "Compares the last 30 days of activity against your vision document."
- Drift item card layout: section name as header, confidence bar (color-coded green/yellow/red), evidence chips (3-5 max with "see all" expansion), proposed-amendment diff inside a collapsible `<details>` element, accept/reject toggle as a clear pair of buttons (not radio).
- Amendment changelog entry format: `- 2026-05-03: Updated voice section after Q2 drift audit. Reason: 12 issues used "casual" copy in conflict with original "professional" voice direction.`
- `founder+ceo` waiting state: panel shows "Waiting for CEO approval — submitted 2 minutes ago" with a refresh button. No tight polling; founder-triggered refresh + post-Apply restore.

</specifics>

<deferred>
## Deferred Ideas

- LLM-assisted drift detection (deferred — keep deterministic in v1; add as opt-in later if confidence scoring proves insufficient).
- User-configurable drift window (PROJECT.md constraint locks 30-day window for v1).
- Side-by-side diff renderer (v1 ships unified diff to fit sidebar width).
- Live polling on `founder+ceo` approvals (v1 founder refreshes manually).
- Cascade preview showing per-agent diff (v1 lists affected agents only; show full per-agent preview in Phase 5 Reposition).
- Cross-company drift comparison (v1 is per-company only).
- Custom heuristic tuning UI (v1 ships fixed weights — Aron can tune in code).

</deferred>

---

*Phase: 3-Assess Mode*
*Context gathered: 2026-05-03*
