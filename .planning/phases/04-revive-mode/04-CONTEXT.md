# Phase 4: Revive Mode - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous run)

<domain>
## Phase Boundary

Phase 4 delivers Revive Mode end-to-end: founder triggers Revive on a stalled company (VISION exists + no recent heartbeats OR blockers piling) → deterministic classifier categorizes the cause as one of {single-blocker, strategic drift, broken integration, governance loop, dead agent} → diagnostic produces a single founder-action queue document enumerating blocking items in priority order, each linked to the agent/issue/VISION section it unblocks → optional sample-pivot one-click action reframes existing draft work as "samples for critique pass" with dual-issue structure (sample + production-quality) and SAMPLE_PIVOT.md explanation → cascade plan applies agent screening (excludes newly-provisioned) and surfaces detected custom overrides for confirmation → Apply step queues wakeups with idempotency keys after blockers are addressed → founder can execute recommended unblocks incrementally (not a single transactional batch — incremental progress is the philosophy).

7 v1 requirements covered: REVIVE-01..07, plus reusing XC-02, XC-03, XC-08 (no new XC IDs claimed but the pattern is enforced).

</domain>

<decisions>
## Implementation Decisions

### Stall Detection (deterministic-first)
- **D-01:** Stall trigger is precomputed by Phase 1 mode-detection: `mode === 'revive'` when VISION present AND (no heartbeats in last 7 days OR open blocker issues > threshold). Phase 4 reuses Phase 1 mode-detect.ts; no new detection logic needed for the trigger.
- **D-02:** Cause classifier lives in `src/revive/classify.ts` as pure function `classifyStall(snapshot: InventorySnapshot, vision: ParsedVision, activity: ActivitySnapshot, driftReport?: DriftReport): StallCause[]`. Returns ranked list (sometimes multiple causes apply). Categories: `single-blocker`, `strategic-drift`, `broken-integration`, `governance-loop`, `dead-agent`. Hard rules — no LLM. Each rule documented inline.
- **D-03:** Heuristics:
  - **single-blocker**: One issue blocks 3+ downstream issues OR one agent has stuck issue > 14 days
  - **strategic-drift**: drift report (from Phase 3 detector — reuse it directly) returns >= 3 high-confidence items
  - **broken-integration**: SDK adapter smoke check fails OR documented integration error pattern in recent issue_comments
  - **governance-loop**: same approval pending > N days OR same issue title cycles in/out of "needs review" state >= 3 times
  - **dead-agent**: agent.last_heartbeat_at > 30 days ago AND open assigned issues exist

### Founder-Action Queue
- **D-04:** Queue document lives at `.planning/[NOT WRITTEN]` — actually NOT written to .planning. Written to Paperclip `documents` table via SDK as `compass:revive:action-queue:${run_id}` so it persists in Paperclip alongside VISION and assess history. Founder UI surfaces it inline.
- **D-05:** Action queue items: `{ id, cause, priority, title, why_blocking, target: { agent_id|issue_id|vision_section }, recommended_action: { type, params }, status: 'pending'|'addressed'|'dismissed' }`. Priority computed: cause severity + blast radius (count of downstream items unblocked).
- **D-06:** Render queue grouped by cause (sections) with priority sort within each. Each item shows what it unblocks ("Unlocks 3 downstream issues" / "Restores agent X to active") and a primary CTA matching `recommended_action.type`.

### Recommended Action Types
- **D-07:** Action types (each maps to a typed handler in `src/revive/actions.ts`):
  - `replace-blocker-issue`: redraft a stuck issue (creates new issue, comments link explaining swap)
  - `reassign-issue`: move issue to a different agent (eligible-agent screening)
  - `nudge-agent-with-context-doc`: write a `documents` entry that briefs an agent on what it's stuck on, then queue wakeup
  - `pivot-to-sample` (D-08): one-click sample-pivot per REVIVE-04
  - `mark-blocker-resolved`: close issue with explanation comment
  - `restart-agent`: queue wakeup with reset prompt for dead agents (with founder confirmation)
  - `surface-amendment-needed`: link to Assess mode flow if cause is drift
- **D-08:** Sample-pivot (REVIVE-04) is its own module `src/revive/sample-pivot.ts` because it has the most logic. Reframes an existing draft issue as "sample for critique pass": creates dual issues — one labeled `[SAMPLE]` (current draft, stays where it is) and one labeled `[PRODUCTION]` (new, blank, for the critique-improved version). Explicit linking via issue_comments. Writes `SAMPLE_PIVOT.md` doc explaining the pattern (one per company, idempotent). All wakeups carry idempotency keys per XC-03 (`compass:revive:sample-pivot:${company_id}:${original_issue_id}`).

### Agent Screening (reused from Phase 3)
- **D-09:** REUSE `src/assess/cascade.ts` agent screening logic — eligible agent = NOT (created_at < 7 days AND last_heartbeat_at empty). Same custom-override warning surface. Phase 4 does not reimplement.

### Apply Behavior (different from Phase 2/3)
- **D-10:** Revive Apply is INCREMENTAL, not transactional. Each action item has its own apply step that the founder triggers individually with a per-item confirmation (lighter than Phase 2/3 two-stage gate — single confirm modal, since each action is bounded). Action results write back to the action queue document (status changes pending → addressed). No bulk rollback; if an action fails, only that action's writes need undoing — handled inline by adding a compensating-revert action to the queue.
- **D-11:** Wakeup queueing per action uses idempotency keys: `compass:revive:${company_id}:${action_id}:${attempt}` per XC-03.

### Reuse from Earlier Phases
- **D-12:** Reuse Phase 1 mode-detect, inventory snapshot. Reuse Phase 2 idempotency utility (extend namespace). Reuse Phase 3 drift detector (one of the cause inputs), VISION parser, activity snapshot builder. Reuse Phase 2/3 ConfirmationModal, ApplyProgress, ApplyErrorDisplay components.
- **D-13:** SDK adapter additions: `closeIssue(issueId, reason)`, `addIssueComment(issueId, body)`, `updateIssue(issueId, patch)`. All audit-logged.

### UX Shape
- **D-14:** Revive main panel: header shows company name + stall summary ("Stalled — 8 days no activity, 3 open blockers") + "Diagnose" CTA. On run, classifier output renders as ActionQueuePanel grouped by cause. Each ActionItemCard shows priority, what's unblocked, recommended action with primary CTA, secondary actions (dismiss / explain). Sticky footer shows progress: "3 of 8 addressed".
- **D-15:** Mid-run state (queue rendered but not yet acted on) persists in worker-state keyed `compass:revive:run:${company_id}` so founder can return.

### Sample-Pivot UX
- **D-16:** Sample-pivot CTA opens a confirmation modal that explains the pattern in 2-3 sentences and shows what will be created (sample issue link + production issue link + SAMPLE_PIVOT.md doc). Single confirm step. After apply, renders inline result with both issue links.

### Cross-Cutting
- **D-17:** All writes through SDK adapter (XC-01).
- **D-18:** All wakeups idempotency-keyed (XC-03).
- **D-19:** No company_secrets reads (XC-04).
- **D-20:** XC-08 unit tests: classify.ts heuristics, action handlers, sample-pivot dual-issue creation, queue prioritization.
- **D-21:** Integration test: end-to-end revive on stalled company fixture (combines all 5 cause types in different fixtures).

### Claude's Discretion
- React component file layout in `src/ui/revive/`
- Concrete N values for governance-loop and dead-agent heuristics (Claude picks defensible defaults; document inline)
- Action card visual treatment (priority badge color, etc.)
- Whether sample-pivot creates a sub-task or a separate top-level issue (Claude picks based on Paperclip schema patterns)

</decisions>

<canonical_refs>
## Canonical References

- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`
- `.planning/phases/01-skeleton-inventory-mode-detection/01-CONTEXT.md`
- `.planning/phases/02-found-mode/02-CONTEXT.md`, `02-UI-SPEC.md`
- `.planning/phases/03-assess-mode/03-CONTEXT.md`, `03-UI-SPEC.md`, `03-PATTERNS.md`
- `.planning/phases/03-assess-mode/03-01..04-SUMMARY.md`
- `PROMPT.md`, `COLLAB.md`, `CLAUDE.md`
- `.planning/research/STACK.md`, `ARCHITECTURE.md`, `PITFALLS.md`
- `~/Development/paperclip-temp/doc/plugins/PLUGIN_SPEC.md`
- `~/Development/paperclip-temp/packages/plugins/sdk/`
- `~/Development/paperclip-temp/packages/plugins/examples/plugin-kitchen-sink-example/`

### Compass repo (Phase 1+2+3 outputs)
- `src/sdk/adapter.ts` — extend with closeIssue, addIssueComment, updateIssue
- `src/primitives/mode-detect.ts` — Revive trigger
- `src/found/idempotency.ts` — extend namespace
- `src/assess/drift.ts` — drift signal as one of revive cause inputs
- `src/assess/vision-parse.ts`, `activity.ts` — reused
- `src/assess/cascade.ts` — eligibility screening reused
- `src/ui/found/{ConfirmationModal,ApplyProgress,ApplyErrorDisplay}.tsx` — reused
- `src/ui/found/InterviewDraftState.ts` — pattern for ReviveRunState

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- All Phase 3 modules (drift/vision-parse/activity/cascade) feed Revive cause classifier
- Phase 2/3 ConfirmationModal handles per-item action confirmation
- Plugin SDK mock host harness extends with stalled-company fixtures (single-blocker, drift-stall, dead-agent, governance-loop, integration-broken)
- Worker-state hook pattern from Phase 2 useInterviewDraft + Phase 3 useAssessRunState

### Patterns to Mirror
- Pure-function primitives (classify.ts) — no I/O, fully testable
- Per-item incremental apply (NEW pattern — different from Phase 2/3 batch transactional). Document this divergence in PATTERNS.md so executors don't accidentally try to make it transactional.
- Worker-state for mid-run persistence

### Integration Points
- Phase 5 (Reposition) reuses revive's incremental-apply pattern for cascade execution
- Phase 6 will surface revive history in engagement memory

</code_context>

<specifics>
## Specific Ideas
- "Diagnose" button copy: "Find what's blocking this company"
- Cause section headers: "Stuck on a blocker", "Drifted from vision", "Integration broken", "Stuck in approval loop", "Agent stopped responding"
- Action card primary CTA examples: "Replace this issue", "Reassign to {agent}", "Brief the agent", "Switch to sample mode", "Mark resolved", "Restart agent"
- Sample-pivot modal copy: "We'll keep your current draft as a sample to critique, and open a fresh production issue for the improved version. This is a known pattern from how vision-quest companies unstick themselves."
- Empty state ("nothing to revive"): "This company isn't stalled. Try Assess for a strategic audit instead." with link to switch mode.

</specifics>

<deferred>
## Deferred Ideas
- Auto-apply highest-priority action (rejected — incremental-apply is the philosophy)
- Cross-company revive comparison (v1 per-company)
- LLM-aided classifier (deferred — keep deterministic in v1)
- Adjustable thresholds for stall heuristics (v1 fixed; Aron tunes in code)
- Revive history aggregation (Phase 6 engagement memory will surface this)

</deferred>

---

*Phase: 4-Revive Mode*
*Context gathered: 2026-05-03*
