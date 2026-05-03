# Phase 2: Found Mode - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers Found mode end-to-end: founder triggers Found from chat input or override → 6-section vision-quest interview runs in main panel (resumable across reload) → answers feed deterministic template that generates VISION.md → founder previews + edits inline → two-stage approval gate (preview screen + final "I confirm" modal) → Apply step writes VISION.md to `documents` table, provisions agents per chosen preset, creates kickoff issues, queues `agent_wakeup_requests` with idempotency keys. All Paperclip access routes through Phase 1's `src/sdk/adapter.ts` chokepoint. Dual-path agent instruction routing (`adapter_config.instructionsBundleMode` managed UUID vs external friendly path) enforced.

19 v1 requirements covered: FOUND-01..12, XC-02, XC-03, XC-04, XC-05, XC-07, XC-08.

</domain>

<decisions>
## Implementation Decisions

### Interview Content Format
- **D-01:** Interview content lives as markdown files in `src/content/interview/` — one `.md` per section (6 files: big-picture, revenue-and-customers, growth-and-marketing, product-direction, ceo-autonomy, vision-and-identity). XC-07 portability — Aron edits in any text editor, no React/TS knowledge required.
- **D-02:** Each section file has YAML frontmatter with a typed `questions[]` array (fields: `id`, `prompt`, `type`, `hint`, optional `options`, optional `showIf`). Body of markdown = section intro/context displayed to founder before question loop. Strict structure, easy parser.
- **D-03:** Question types supported: `free-text-short` (single-line), `free-text-long` (textarea), `single-choice` (radio/select with `options[]`), `multi-choice` (checkboxes with `options[]`), `conditional-follow-up` (uses `showIf: { questionId, equals|includes }`).
- **D-04:** Markdown reaches runtime via esbuild text loader inlining `.md` into the bundle at build time. Zero runtime FS reads — matches Plugin SDK constraint (no FS outside SDK envelope). Fast startup, deterministic, testable.

### VISION.md Generation Strategy
- **D-05:** Pure deterministic template-fill — no LLM dependency. Predictable, reproducible, free, Aron-portable. Founder edits prose in preview (FOUND-05) for any voice polish before Apply.
- **D-06:** Single VISION.md template lives at `src/content/vision-template.md` with `{{slot}}` placeholders. Renders 1:1 to output VISION.md so Aron sees the final shape inline. All 19 sections present in template.
- **D-07:** Derived slots (e.g., `principles` from voice + red-lines, `12-mo goal` from revenue + customer count) computed by typed pure functions in `src/found/derive.ts`. Each `derive*(answers): string`. Easy unit tests per XC-08. Slots resolve via function call before template render.
- **D-08:** Quality Checklist (FOUND-12) enforcement — hard-block Apply when any required slot is missing/empty. Required: `mission`, `mandate` (CEO mandate), `voice`, `principles`, `success_criteria`. Optional/derived slots show ⚠ in preview but allow Apply. Founder-friendly, safe.

### Apply Transactionality (XC-02)
- **D-09:** Plugin SDK does not expose true cross-table DB transactions, so Apply uses **preflight-validate → sequential-write-in-dependency-order → compensating-rollback-on-failure**. Preflight checks: VISION not already present (or amendment path), preset agents resolvable, company exists, no duplicate idempotency keys. Sequential write order: VISION doc → agents (managed-path or filesystem per `adapter_config.instructionsBundleMode`) → kickoff issues → wakeups (last so failures don't double-fire). On any write failure, run reverse-order compensating undo (delete kickoff issues, delete agents, delete VISION doc); if rollback step itself fails, halt and surface explicit manual cleanup steps to founder.
- **D-10:** All `agent_wakeup_requests` inserts include `idempotency_key` derived as `compass:found:${company_id}:${agent_id}:${apply_run_id}` (XC-03). `apply_run_id` = UUID per Apply attempt. Retry-safe.
- **D-11:** Dual-path agent instruction routing (FOUND-08, XC-05) — `src/sdk/adapter.ts` exposes `writeAgentInstructions(agent, body)` that inspects `agent.adapter_config.instructionsBundleMode`: `'managed'` → SDK call to UUID-based managed instruction store; `'external'` → friendly-path filesystem write via SDK's filesystem channel. Plugin code never branches on bundle mode itself — adapter does.

### Mid-Interview Persistence + UX Shape
- **D-12:** Mid-interview draft state stored in Plugin SDK worker-state, keyed `compass:found:draft:${company_id}` (matches Phase 1 D-09 pattern). Single in-progress draft per company. Survives plugin reload (FOUND-03). Cleared on successful Apply or explicit "Discard" action.
- **D-13:** Interview UX is linear progression with full back-nav: founder advances section-by-section, may jump back to any prior section to revise answers. Forward "Next" disabled until current section's required questions answered. Section nav rail at top shows progress + jump targets. Main panel form-driven (not chat dialogue).
- **D-14:** Chat panel input from M1 D-07 routes intent into Found mode entry — typing "found a new company" or similar opens Found mode and starts the interview in the main panel. Chat panel itself does not own the interview turn-by-turn (interview is form-based).

### Two-Stage Approval Gate (FOUND-11)
- **D-15:** Stage 1 = inline preview screen showing rendered VISION.md (read-only by default, "Edit" toggle enables in-place markdown editing per FOUND-05) + provisioning summary (preset name, agents to create, kickoff issues to file). Stage 2 = modal with explicit "I confirm — apply changes to Paperclip" button + cancel. Modal lists exact write count (e.g., "1 document, 5 agents, 5 issues, 5 wakeups"). XC-06 enforced — no code path writes VISION without crossing both stages.

### Cross-Cutting Architectural Rules
- **D-16:** All writes route through `src/sdk/adapter.ts` (Phase 1 D-19, XC-01). Phase 2 extends adapter with: `writeDocument`, `provisionAgent`, `writeAgentInstructions` (D-11), `createIssue`, `queueWakeup`. Each function logs to a structured audit trail (in worker-state, capped) for rollback + debugging.
- **D-17:** Plugin never reads `company_secrets` values (XC-04) — only key names if needed for preset descriptions. Adapter has no method that returns secret values.
- **D-18:** Vision-quest content portability (XC-07) realised through D-01 (markdown files) + D-06 (markdown template) + D-02 (declarative frontmatter). Aron can fork interview and template independently of any TSX.

### Claude's Discretion
- React component file layout inside `src/ui/found/` (constraint: section-nav rail + question-renderer + preview-panel + confirm-modal must be distinct components)
- Preset selection placement in interview flow (constraint: must be locked before Apply, presented somewhere logical — start, end, or auto-suggest from answers; pick whichever simplifies state)
- Markdown editor library for inline VISION edit (constraint: lightweight, no large dep — textarea + preview pane is acceptable v1)
- Audit trail schema for adapter writes (constraint: structured enough to drive rollback ordering; pruned to recent N entries)
- Error rendering style for preflight + rollback failures (constraint: founder-readable, actionable next steps)
- Specific Handlebars-compatible template syntax library vs custom `{{slot}}` regex (constraint: no large dep; custom regex acceptable for slots-only template)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning artifacts
- `.planning/PROJECT.md` — project context, requirements, decisions, constraints
- `.planning/REQUIREMENTS.md` — 72 v1 requirements with traceability
- `.planning/ROADMAP.md` — 6-phase structure with success criteria
- `.planning/STATE.md` — project memory and current focus
- `.planning/phases/01-skeleton-inventory-mode-detection/01-CONTEXT.md` — Phase 1 decisions (SDK adapter chokepoint, mode detection, worker-state pattern, two-maintainer governance)
- `PROMPT.md` — original build spec (architecture diagram, Paperclip schema cheatsheet, "Don't do" list, milestone acceptance criteria)
- `COLLAB.md` — Aron Prins co-maintainership outreach context

### Research outputs (from Phase 1 cycle, still load-bearing)
- `.planning/research/SUMMARY.md` — synthesis of all research
- `.planning/research/STACK.md` — TS 5.7.3 + React 19 (peer) + esbuild via `@paperclipai/plugin-sdk/bundlers` + Vitest 3.0.5; React must NOT be bundled
- `.planning/research/FEATURES.md` — table stakes vs differentiators vs anti-features per mode
- `.planning/research/ARCHITECTURE.md` — three-layer plugin pattern, SDK adapter chokepoint, mode controllers as thin orchestrators
- `.planning/research/PITFALLS.md` — BLOCKER pitfalls (wakeup duplication, dual-path misrouting, approval bypass, schema coupling) + HIGH-priority pitfalls

### Vision-quest content origin (port into Phase 2 interview + VISION template)
- https://github.com/aronprins/paperclip-vision/blob/main/SKILL.md — strategic interview structure (6 sections, ~30-50 questions)
- https://github.com/aronprins/paperclip-vision/tree/main/references — VISION.md template (19 sections), Amendment Protocol (default-NO + dated changelog)

### Paperclip core (read-only references for plugin authoring)
- `~/Development/paperclip-temp/doc/adapter-plugin.md` — adapter + plugin spec
- `~/Development/paperclip-temp/doc/plugins/PLUGIN_SPEC.md` — manifest, worker, UI contract
- `~/Development/paperclip-temp/doc/plugins/PLUGIN_AUTHORING_GUIDE.md` — authoring patterns, bundler presets, testing harness
- `~/Development/paperclip-temp/packages/plugins/sdk/` — Plugin SDK source (types, adapter API, worker-state, document/agent/issue/wakeup APIs)
- `~/Development/paperclip-temp/packages/plugins/examples/plugin-kitchen-sink-example/` — full SDK feature-set reference (look for write paths)
- `~/Development/paperclip-temp/packages/plugins/examples/plugin-hello-world-example/` — minimal reference

### Paperclip schema load-bearing for Phase 2
- `agents` table — `id`, `role`, `status`, `adapter_config` (incl. `instructionsBundleMode`)
- `documents` table — VISION.md persisted here (FOUND-06)
- `issues` table — kickoff issues (FOUND-09)
- `agent_wakeup_requests` — idempotency-key-keyed (XC-03, FOUND-10)
- `company_secrets` — key names only, never values (XC-04)

### Working external plugin reference
- `~/Development/Paperclip/plugin-file-viewer/` — package shape for published Paperclip plugin

### Paperclip plugin manager (install path)
- https://docs.paperclip.ing/#/administration/plugins/plugins

### Compass repo source (Phase 1 outputs Phase 2 builds on)
- `src/sdk/adapter.ts` — Phase 1 chokepoint; Phase 2 extends with write methods
- `src/primitives/mode-detect.ts` — pure mode detection
- `src/ui/` — component structure from Phase 1
- `src/content/` — empty in Phase 1; Phase 2 populates `interview/*.md` + `vision-template.md`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (from Phase 1 + Paperclip)
- **`src/sdk/adapter.ts`** — Phase 1 chokepoint; extend with write methods (`writeDocument`, `provisionAgent`, `writeAgentInstructions`, `createIssue`, `queueWakeup`).
- **Plugin SDK worker-state API** — used in M1 for mode-override (D-09); Phase 2 reuses for interview draft persistence (D-12).
- **Mock host harness (`@paperclipai/plugin-sdk/testing` `createTestHarness`)** — Phase 1 fixtures (founded/healthy/stalled/repositioning); Phase 2 adds Apply-flow fixtures (mid-interview, fully-answered, partial-failure-rollback).
- **Vitest harness (Phase 1 plan 3)** — extend with Found mode tests (XC-08: dual-path adapter routing, idempotency-key generation, derive functions, preflight checks).
- **Lucide icon set** — confirmed in M1 for sidebar; reuse for section nav, preview, confirm modal.
- **Company-wizard preset library** — port preset definitions selectively per Phase 1 D-01 strategy. Used in FOUND-07.

### Established Patterns
- **SDK chokepoint** — all Paperclip access through `src/sdk/adapter.ts` (D-16, Phase 1 D-19, XC-01).
- **Pure-function primitives** — mode-detect (Phase 1) shows the pattern; Phase 2 derive functions follow same shape (`(answers): string`, no I/O).
- **Worker-state for transient per-instance state** — D-09 from Phase 1; Phase 2 reuses.
- **Test fixtures via mock host** — Phase 1 D-06; Phase 2 extends fixture set.
- **Markdown content + esbuild text loader** — new in Phase 2 (D-04); pattern can be reused by Phases 3-5 for amendment templates and revival diagnostics.

### Integration Points
- **Chat panel intent routing** — Phase 1 D-07 wired keyword classifier; Phase 2 implements the Found mode entry handler that opens main-panel interview.
- **Mode override surface** — Phase 1 ships override dropdown; founder can manually pick Found mode without chat input.
- **VISION.md doc consumer** — Phases 3 (Assess) and 5 (Reposition) will read this VISION.md; Phase 2 must write a doc structure compatible with their parsers (mirror the 19-section template exactly).

</code_context>

<specifics>
## Specific Ideas

- Section nav rail copy: "Big picture", "Revenue & customers", "Growth & marketing", "Product direction", "CEO autonomy", "Vision & identity" — match vision-quest section titles verbatim, founder-facing.
- Preview screen header copy: "Here's the company you're founding. Edit anything before you apply." Don't say "VISION.md" — say "company vision".
- Confirm modal copy: "Apply will create [N] agents and [N] kickoff issues, write the vision document, and start the company heartbeating. This is reversible only by manual cleanup."
- Apply progress UI: stepwise indicator showing each write (preflight ✓ → vision doc ✓ → agents ✓ → issues ✓ → wakeups ✓) so founder sees what happened if rollback fires.
- Idempotency key format: `compass:found:${company_id}:${agent_id}:${apply_run_id}` — namespace explicit so other plugins can't collide.
- Preset selection: lean toward placing it at the START of the interview because the chosen preset can drive `showIf` branching on a few questions (e.g., revenue model preset → simpler revenue questions). Final call left to planner per Claude's Discretion.

</specifics>

<deferred>
## Deferred Ideas

- **Preset auto-suggest from answers** — could analyse interview answers and recommend a preset; deferred to v1.1 polish. v1 has founder pick preset (location decided by planner).
- **In-place rich markdown editor for preview** — v1 ships textarea + side-by-side preview; full editor (CodeMirror/Monaco) deferred — bundle bloat risk.
- **Interview draft export/import** — founder may want to save draft as JSON for later resume on different machine; deferred.
- **Preview diff view (empty vs proposed)** — relevant for Reposition (Phase 5) where there's a base VISION; not needed for Found (always empty starting state).
- **Multi-language interview content** — i18n hooks could ride the markdown loader pattern; deferred.
- **Rollback dry-run** — show founder the rollback plan before they hit Apply; deferred.
- **Telemetry on which interview questions get most "skip"** — useful for tuning vision-quest content; deferred to engagement memory phase (M6).

</deferred>

---

*Phase: 2-Found Mode*
*Context gathered: 2026-05-03*
