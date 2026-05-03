# Phase 6: Engagement Memory + Scheduled Check-ins - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous run)

<domain>
## Phase Boundary

Phase 6 delivers the persistent memory layer + scheduled check-ins: per-company engagement state (last engagement date, prior findings, open recommendations) persists across sessions in a `compass-engagement-history` document in Paperclip's `documents` table — no new core schema. Findings tracked with status (open / addressed / invalidated) + timestamps. UI surfaces a "History" tab per company showing prior findings, ordered, with status filters. Founder can schedule recurring strategic check-ins (quarterly drift review, monthly trust-gate review) via Paperclip `routines` from inside the plugin (no leaving). Scheduled routines auto-trigger Assess or Revive mode at the configured interval and post results back as engagement memory entries. Phase 6 also implements the long-deferred ASSESS-09 — context-refresh step in Assess mode that surfaces prior findings before producing new recommendations (prevents memory rot).

7 v1 requirements covered: MEM-01..06 + ASSESS-09 (reassigned to this phase).

</domain>

<decisions>
## Implementation Decisions

### Memory Storage Schema
- **D-01:** Single per-company document keyed `compass-engagement-history` in `documents` table (PROJECT.md + PROMPT.md constraint — no schema migration). Body is JSON-formatted markdown — JSON section in a fenced code block plus a human-readable rendering of recent findings underneath. Both halves serialized atomically.
- **D-02:** Schema (`EngagementHistory`):
  ```
  {
    version: 1,
    company_id: string,
    last_engaged_at: ISO timestamp,
    findings: Finding[],          // append-only; never deleted
    routines: ScheduledRoutine[]  // active scheduled check-ins
  }
  Finding: { id, run_id, mode, created_at, summary, evidence_refs[], status, status_history[] }
  ScheduledRoutine: { id, name, mode, cron, last_run_at, last_finding_ids[], created_at }
  ```
- **D-03:** Reads cached in worker-state with TTL 60s to avoid hammering documents table on every panel render. Writes invalidate the cache.
- **D-04:** Memory module lives in `src/memory/`. Files: types.ts, history-store.ts (read/write), finding.ts (status transitions), routine.ts (cron parsing + scheduling), index.ts (barrel).

### Finding Status Lifecycle (MEM-03)
- **D-05:** Statuses: `open` (founder hasn't acted), `addressed` (founder explicitly resolved), `invalidated` (no longer relevant — auto-detected if subsequent run shows the issue is gone). Each status transition records `{ from, to, at, by_run_id }` in status_history. Findings never deleted (audit trail).

### Posting Findings From Modes
- **D-06:** Phase 2/3/4/5 modes write findings on Apply success: Found mode posts an "Onboarded" finding; Assess posts per-drift-item findings; Revive posts per-action-item findings; Reposition posts a "Repositioned" finding with section list. Implemented as a thin SDK call in each mode's apply.ts `await memory.recordFindings(companyId, runId, mode, items)`. NEW dependency edge from existing apply files into memory module.
- **D-07:** Modes IMPORT memory adapter; they don't reach into the documents table directly. Keeps the chokepoint clean.

### Context-Refresh in Assess (ASSESS-09)
- **D-08:** Before producing a new drift report, Assess `runDriftAudit` handler reads the engagement history and surfaces "Context: prior findings still open from N days ago" preamble. Drift items are deduplicated against still-open findings (suppresses repeat noise). UI shows "Compared against prior X findings still open" in the drift report header.
- **D-09:** When founder marks an old open finding as addressed, that finding's status transitions and Assess on next run won't re-suppress its drift signal.

### History Tab UI (MEM-04)
- **D-10:** History tab is a sibling tab to the main Compass panel content. Tab header shows count "(N findings)". Selecting it renders HistoryPanel: filters (status: open|addressed|invalidated|all; mode: all|found|assess|revive|reposition; date range), grouped by run timestamp (newest first), each finding renders FindingCard with summary + evidence chips + status badge + status-change buttons.
- **D-11:** Mode-active panels also surface a small "View N prior findings" link in headers when relevant findings exist; opens History tab pre-filtered.

### Scheduled Check-ins UI + Logic (MEM-05, MEM-06)
- **D-12:** New "Schedules" sub-section in History tab (or a separate Schedules tab — Claude's discretion based on space). Lists active routines with name, mode, cron expression rendered human-readably ("Every quarter, first Monday at 9am"), last run timestamp, "Run now" + "Disable" actions.
- **D-13:** Schedule creation flow: simple form — Name, Mode (Assess | Revive), Frequency preset (Quarterly drift review / Monthly trust-gate review / Custom cron). Custom cron is plain-text input with validation. Submission writes to Paperclip `routines` table via SDK.
- **D-14:** Routine execution: when Paperclip fires the routine, plugin worker handler `routine.run` matches the routine ID, dispatches the appropriate mode's audit handler, captures findings, posts to engagement history with `last_run_at` updated. Findings carry `triggered_by_routine_id` for traceability.

### Cron Defaults
- **D-15:** Preset crons: Quarterly = `0 9 1 1,4,7,10 *` (9am, first day of Q1/Q2/Q3/Q4); Monthly trust-gate = `0 9 1 * *` (9am first of every month). Hard-coded defaults; Custom for everything else.

### Reuse Map
- **D-16:** Reuse SDK adapter (XC-01) — extend with `getRoutines(companyId)`, `createRoutine(payload)`, `deleteRoutine(id)`, `runRoutine(id)`. All audit-logged.
- **D-17:** Reuse Phase 3 ApprovingWaitingState styling for routine "running now" indicator.
- **D-18:** Reuse Phase 4 ActionItemCard pattern for FindingCard layout.

### Cross-Cutting
- **D-19:** All writes through SDK adapter (XC-01).
- **D-20:** No company_secrets reads (XC-04).
- **D-21:** XC-08 unit tests: memory store read/write/cache, status transitions, cron parsing/validation, finding deduplication.
- **D-22:** XC-09 integration: end-to-end persist findings from Assess Apply → reload plugin → see in History tab; schedule routine → simulate fire → verify finding posted; ASSESS-09 dedup verified against fixture with overlapping findings.
- **D-23:** Phase 6 marks XC-10 (Conventional Commits enforced project-wide — already standard practice; declare in CONTRIBUTING.md if not already).

### Claude's Discretion
- React component file layout in `src/ui/memory/`
- HistoryPanel internal layout (single scrolling list vs paginated)
- Cron-to-human library vs custom string (favor zero deps; small custom function fine)
- Whether History tab is a sibling tab in MainPanel header or a slide-over panel
- Schedule form input visual treatment

</decisions>

<canonical_refs>
## Canonical References

- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md` (MEM-01..06 + ASSESS-09), `.planning/ROADMAP.md`, `.planning/STATE.md`
- `.planning/phases/01..05` CONTEXT/UI-SPEC/PATTERNS files
- `.planning/phases/03-assess-mode/03-04-SUMMARY.md` (Assess apply where ASSESS-09 hooks in)
- `.planning/phases/04-revive-mode/04-05-SUMMARY.md`
- `.planning/phases/05-reposition-mode/05-04-SUMMARY.md`
- PROMPT.md, COLLAB.md, CLAUDE.md
- `.planning/research/STACK.md`, ARCHITECTURE.md, PITFALLS.md (memory rot pitfall)
- `~/Development/paperclip-temp/doc/plugins/PLUGIN_SPEC.md` (routines table)
- `~/Development/paperclip-temp/packages/plugins/sdk/` (look for routinesApi)

### Compass repo (reuse)
- `src/sdk/adapter.ts`
- `src/found/idempotency.ts` (extend namespace if needed)
- `src/found/apply.ts`, `src/assess/apply.ts`, `src/revive/apply.ts`, `src/reposition/apply.ts` (each gets a memory.recordFindings call)
- `src/ui/found/{ConfirmationModal,ApplyProgress,ApplyErrorDisplay}.tsx`
- `src/ui/MainPanel.tsx` (add History tab)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- All Phase 1+ adapter chokepoint extends naturally for routines table.
- Worker-state caching pattern from Phase 2/3/4/5 reused for memory cache.
- Mock host harness extends with engagement-history fixtures.

### Established Patterns
- All writes through SDK adapter chokepoint (XC-01).
- Pure-function primitives (status transitions, cron parsing).
- Worker-state for short-TTL caching.
- Finding cards mirror ActionItemCard from Phase 4.

### Integration Points
- Modes 2/3/4/5 each gain ONE LINE: post-apply call to memory.recordFindings. Don't restructure; surgical addition only.
- ASSESS-09 hooks into runDriftAudit handler.
- Phase 1 mode-detect could optionally factor in last_engaged_at later (not in v1).

</code_context>

<specifics>
## Specific Ideas
- History tab badge: small pill with count, accent color when any open findings exist.
- "Run now" button copy on schedules: "Run check-in now" (not "Execute routine").
- Empty history state: "No engagement history yet. Findings appear here after you Found, Assess, Revive, or Reposition a company."
- Cron preset labels: "Quarterly drift review", "Monthly trust-gate review", "Custom".
- Status badge colors: open = accent, addressed = green, invalidated = muted.

</specifics>

<deferred>
## Deferred Ideas
- Cross-company history rollup (v1 per-company)
- Memory export (JSON/CSV) — deferred
- Engagement health score derived from finding density — deferred
- Auto-invalidation when subsequent run shows resolution (v1 keeps it simple — only auto-detected if Assess deduplicates against still-open findings; explicit transition handled by founder)
- Email/notification on routine fire (v1 results visible in History tab only)

</deferred>

---

*Phase: 6-Engagement Memory + Scheduled Check-ins*
*Context gathered: 2026-05-03*
