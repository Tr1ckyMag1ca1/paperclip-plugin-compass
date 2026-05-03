---
phase: 05-reposition-mode
verified: 2026-05-03T06:28:00Z
status: gaps_found
score: 3/10 must-haves verified
overrides_applied: 0
gaps:
  - truth: "Reposition mode can trigger cascade planning via worker handler"
    status: failed
    reason: "UI calls 'planCascade' handler but worker registers 'planRepositionCascade' — name mismatch causes runtime failure"
    artifacts:
      - path: "src/ui/reposition/RepositionPanel.tsx"
        issue: "Line 78: usePluginAction('planCascade') but worker has 'planRepositionCascade'"
      - path: "src/worker.ts"
        issue: "Line 883: ctx.data.register('planRepositionCascade')"
    missing:
      - "Rename worker handler to 'planCascade' OR update UI to call 'planRepositionCascade'"
  - truth: "Reposition mode can apply amendments via worker handler"
    status: failed
    reason: "UI calls 'applyReposition' handler but worker registers 'applyRepositionAmendments' — name mismatch causes runtime failure"
    artifacts:
      - path: "src/ui/reposition/RepositionPanel.tsx"
        issue: "Line 79: usePluginAction('applyReposition') but worker has 'applyRepositionAmendments'"
      - path: "src/worker.ts"
        issue: "Line 945: ctx.actions.register('applyRepositionAmendments')"
    missing:
      - "Rename worker handler to 'applyReposition' OR update UI to call 'applyRepositionAmendments'"
  - truth: "Plugin builds successfully"
    status: failed
    reason: "npm run build fails: 'Could not resolve node:crypto' in src/found/idempotency.ts"
    artifacts:
      - path: "src/found/idempotency.ts"
        issue: "Line 17: import { randomUUID } from 'node:crypto' is not marked external in esbuild config"
      - path: "esbuild.config.mjs"
        issue: "Uses SDK bundler presets that don't properly handle node: imports as external"
    missing:
      - "Either: (a) add node:crypto to esbuild external config, (b) move randomUUID usage to worker-only code, or (c) use crypto.getRandomValues fallback for universal code"
---

# Phase 5: Reposition Mode Verification Report

**Phase Goal:** Healthy companies can execute targeted strategic shift. Founder describes delta, plugin runs scoped vision-quest re-interview, proposes VISION amendments, and brand/voice/scope cascade plan.

**Verified:** 2026-05-03T06:28:00Z

**Status:** gaps_found

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth   | Status     | Evidence       |
| --- | ------- | ---------- | -------------- |
| 1   | Shift classifier accepts free-form founder intent and deterministically maps to affected VISION sections | ✓ VERIFIED | src/reposition/shift-classify.ts exists, implements classifyShift with keyword heuristics, 56+ unit tests passing |
| 2   | Scope-filter reduces full 6-section interview to only affected sections | ✓ VERIFIED | src/reposition/scope-filter.ts exists, implements filterInterviewToScope, 31+ unit tests passing |
| 3   | Seed-answers pre-fills interview questions with current VISION values | ✓ VERIFIED | src/reposition/seed-answers.ts exists, implements getSectionAnswerSeed, 37+ unit tests passing |
| 4   | Reposition mode can trigger shift classification via worker handler | ✓ VERIFIED | src/worker.ts registers 'classifyShift' handler (line 758), UI calls usePluginAction('classifyShift') (line 76), names match |
| 5   | Reposition mode can generate amendments from scoped interview answers | ✓ VERIFIED | src/worker.ts registers 'generateAmendments' handler (line 824), UI calls usePluginAction('generateAmendments') (line 77), names match |
| 6   | Reposition mode can trigger cascade planning via worker handler | ✗ FAILED | UI calls 'planCascade' (line 78) but worker registers 'planRepositionCascade' (line 883) — name mismatch prevents handler invocation |
| 7   | Reposition mode can apply amendments via worker handler | ✗ FAILED | UI calls 'applyReposition' (line 79) but worker registers 'applyRepositionAmendments' (line 945) — name mismatch prevents handler invocation |
| 8   | Amendment generation orchestrator produces valid VISION amendments | ✓ VERIFIED | src/reposition/amend.ts exists, implements generateAmendments, 17 unit tests passing |
| 9   | Cascade planning reuses Phase 3 machinery with per-agent override detection | ✓ VERIFIED | src/reposition/cascade.ts exists, implements planRepositionCascade, 12 unit tests passing |
| 10 | Apply step routes amendments through Amendment Protocol with approval routing | ✗ FAILED | src/reposition/apply.ts exists and implements applyRepositionAmendments, but handler cannot be called due to name mismatch (truth #7) |

**Score:** 7/10 truths verified (3 blocked by handler name mismatches)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `src/types/reposition.ts` | ShiftScope, RepositionRunState, Amendment types | ✓ VERIFIED | File exists, 150+ lines, all 5 types defined with proper JSDoc |
| `src/reposition/shift-classify.ts` | classifyShift function with keyword heuristics | ✓ VERIFIED | File exists, 200+ lines, deterministic keyword classifier with 45+ keyword groups, confidence scoring |
| `src/reposition/scope-filter.ts` | filterInterviewToScope function | ✓ VERIFIED | File exists, 50+ lines, O(n) filter preserving order, null-safe |
| `src/reposition/seed-answers.ts` | getSectionAnswerSeed function | ✓ VERIFIED | File exists, 150+ lines, maps VISION sections to interview fields, preserves formatting |
| `src/reposition/amend.ts` | generateAmendments orchestrator | ✓ VERIFIED | File exists, 170+ lines, orchestrates derive → template-fill → quality-check → diff |
| `src/reposition/cascade.ts` | planRepositionCascade wrapper | ✓ VERIFIED | File exists, 160+ lines, thin wrapper delegating to Phase 3 cascade logic |
| `src/reposition/apply.ts` | applyRepositionAmendments orchestrator | ✓ VERIFIED | File exists, 320+ lines, mirrors Phase 3 pattern with preflight → write → rollback |
| `src/ui/reposition/RepositionPanel.tsx` | Main state machine orchestrator | ✓ VERIFIED | File exists, 400+ lines, implements 11-state machine (empty → intent → scope → interview → preview → cascade → confirming → applying → complete/waiting/error) |
| `src/ui/reposition/IntentEntry.tsx` | Shift description textarea | ✓ VERIFIED | File exists, validates 20-char minimum, shows placeholder examples |
| `src/ui/reposition/ScopeConfirmation.tsx` | Section selection checkboxes | ✓ VERIFIED | File exists, shows all 19 sections, pre-checked from classifier, founder override support |
| `src/ui/reposition/RepositionInterviewFlow.tsx` | Scoped interview orchestrator | ✓ VERIFIED | File exists, reuses Phase 2 InterviewSection, filters to affected sections only |
| `src/ui/reposition/AmendmentPreview.tsx` | Per-section diff display | ✓ VERIFIED | File exists, reuses Phase 3 AmendmentDiff component |
| `src/ui/reposition/CascadeReviewPanel.tsx` | Agent override decision panel | ✓ VERIFIED | File exists, displays per-agent toggle (keep custom / apply / merge) |
| `src/ui/reposition/AgentDecisionCard.tsx` | Individual agent decision card | ✓ VERIFIED | File exists, shows agent role, override status, decision controls |
| `src/ui/reposition/index.ts` | Barrel export | ✓ VERIFIED | Exports all components and orchestrator types |
| `src/worker.ts` (handlers) | 6+ registered handlers for Reposition mode | ⚠️ PARTIAL | Handlers registered but with name mismatches: 'planRepositionCascade' vs 'planCascade', 'applyRepositionAmendments' vs 'applyReposition' |
| `src/ui/MainPanel.tsx` (routing) | Routes Reposition mode to RepositionPanel | ✓ VERIFIED | Line routing added, checks if mode === "Reposition" |

### Key Link Verification

| From | To  | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| RepositionPanel | classifyShift | usePluginAction → worker handler | ✓ WIRED | Handler name matches exactly |
| RepositionPanel | generateAmendments | usePluginAction → worker handler | ✓ WIRED | Handler name matches exactly |
| RepositionPanel | planCascade | usePluginAction → worker handler | ✗ NOT_WIRED | UI calls 'planCascade' but worker registers 'planRepositionCascade' |
| RepositionPanel | applyReposition | usePluginAction → worker handler | ✗ NOT_WIRED | UI calls 'applyReposition' but worker registers 'applyRepositionAmendments' |
| shift-classify → scope-filter | shared affectedSectionIds | orchestrator result passed to next function | ✓ WIRED | Both consume VisionSectionId[] correctly |
| amend orchestrator → quality-check | amendments list | reuses Phase 2 isValidAmendmentList | ✓ WIRED | Quality check called before returning amendments |
| apply orchestrator → Amendment Protocol | amendments + approvalRouting | reuses Phase 3 approval routing pattern | ✓ WIRED | founder vs founder+ceo routing replicated exactly |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| src/reposition/shift-classify.ts | affectedSections, confidence, rationale | input: description (string) + currentVision (ParsedVision) | ✓ Real (deterministic output from keyword matching) | ✓ FLOWING |
| src/reposition/scope-filter.ts | filtered InterviewSection[] | input: allSections (from loadInterviewSections) + affectedSectionIds | ✓ Real (returns matched sections from input) | ✓ FLOWING |
| src/reposition/seed-answers.ts | Partial<InterviewAnswers> | input: vision (ParsedVision) + sectionId | ✓ Real (extracts section content, preserves formatting) | ✓ FLOWING |
| src/reposition/amend.ts | amendments list | orchestrates derive → template-fill → quality-check on interview answers | ✓ Real (quality-check validates non-empty) | ✓ FLOWING |
| RepositionPanel state | amendments, cascadePlan, step | handler invocation results stored in React state | ⚠️ STATIC-UNLESS-FIXED | Will be empty/error on handlers that fail (truths #6, #7) | ⚠️ HOLLOW (no data if handlers don't exist) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| All unit tests pass | npm test 2>&1 \| grep "Test Files" | Test Files 29 passed (29), Tests 670 passed (670) | ✓ PASS |
| TypeScript strict mode | npm run typecheck 2>&1 | 0 errors | ✓ PASS |
| Build succeeds | npm run build 2>&1 | FAILED: "Could not resolve 'node:crypto'" | ✗ FAIL |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| REPO-01 | 05-01, 05-04 | Scoped vision-quest re-interview touching only affected sections | ✓ SATISFIED | shift-classify + scope-filter + seed-answers + RepositionInterviewFlow all implemented and tested |
| REPO-02 | 05-01, 05-02 | Output is targeted (only changed VISION sections), not full rewrite | ✓ SATISFIED | amend.ts generates per-section amendments, quality-check validates completeness |
| REPO-03 | 05-02, 05-04 | Cascade plan covers brand/voice/scope changes across all affected pods/agents | ✓ SATISFIED | cascade.ts wraps Phase 3 logic, agent screening + override detection implemented |
| REPO-04 | 05-02, 05-04 | Apply step routes amendments through Amendment Protocol (per-company approval routing) | ⚠️ UNCERTAIN | apply.ts orchestrator exists and implements approval routing, but cannot be called due to handler name mismatch |
| REPO-05 | 05-02, 05-03, 05-04 | Cascade preserves intentional agent variance and custom overrides (granular per-agent confirmations) | ⚠️ UNCERTAIN | CascadeReviewPanel UI exists with per-agent toggle, but cannot be reached due to handler mismatch preventing cascade plan generation |
| XC-02 | 05-02, 05-04 | Apply step is transactional — preflight validation before writes; rollback path exists if any write fails | ✓ SATISFIED | apply.ts implements preflight → sequential write → compensating rollback pattern |
| XC-03 | 05-01, 05-02 | All agent_wakeup_requests inserts include idempotency_key to prevent duplicates | ✓ SATISFIED | generateRepositionIdempotencyKey implemented, compass:reposition namespace defined |
| XC-04 | 05-04 | Plugin never reads company_secrets values — only key names via Plugin SDK | ✓ SATISFIED | Code inspection: no company_secrets reads in handlers |
| XC-08 | 05-01, 05-02, 05-03, 05-04 | Unit tests cover mode detection rules, drift detection logic, sample-pivot logic, dual-path adapter routing, idempotency-key generation | ✓ SATISFIED | 670 total tests passing (124 shift-classify/scope-filter/seed-answers, 75 orchestrators, 38 UI components, 40 integration) |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| src/ui/reposition/RepositionPanel.tsx | 78 | usePluginAction('planCascade') but handler registered as 'planRepositionCascade' | 🛑 BLOCKER | Handler will not be found at runtime, flow breaks at cascade step |
| src/ui/reposition/RepositionPanel.tsx | 79 | usePluginAction('applyReposition') but handler registered as 'applyRepositionAmendments' | 🛑 BLOCKER | Handler will not be found at runtime, flow breaks at apply step |
| src/found/idempotency.ts | 17 | import { randomUUID } from 'node:crypto' | 🛑 BLOCKER | Node.js built-in cannot be bundled; esbuild fails with "Could not resolve 'node:crypto'" |
| src/worker.ts (handler names) | 883, 945 | Handler names do not match UI usePluginAction calls | 🛑 BLOCKER | Critical PHASE 4 gap: this exact pattern was mentioned as CRITICAL CHECK in verification brief |

### Human Verification Required

None — all gaps are programmatically detectable and have clear fixes.

### Gaps Summary

**CRITICAL WIRING FAILURE: Phase 5 is NOT VIABLE without fixing handler name mismatches and build error.**

**Root Causes:**

1. **Handler Name Mismatches (BLOCKER):**
   - UI designed for handlers named 'planCascade' and 'applyReposition'
   - Worker registers 'planRepositionCascade' and 'applyRepositionAmendments'
   - This is the **exact pattern mentioned in the user's CRITICAL CHECK** — "Phase 4 had this gap: audit UI usePluginAction/usePluginData calls vs registered worker handlers — flag any name mismatches"
   - Without these matches, the Reposition flow CANNOT proceed past the cascade planning step

2. **Build Failure (BLOCKER):**
   - npm run build fails with "Could not resolve 'node:crypto'"
   - src/found/idempotency.ts imports randomUUID from node:crypto
   - This import is valid for worker code but must be marked as external in esbuild config
   - Without a successful build, the plugin cannot be deployed or tested in a real instance

**Deferred Items:** None — these are present-phase blockers, not Phase 6 dependencies.

**Test Status Caveat:**
- All 670 unit tests pass because they test pure functions and mocked handlers
- Integration tests use mock handlers that don't validate name matching
- The real failure only occurs at runtime when UI tries to invoke non-existent handlers
- This demonstrates why goal-backward verification must check wiring, not just test counts

**Next Steps for Gap Closure:**

1. Rename worker handlers to match UI expectations:
   - Rename `planRepositionCascade` → `planCascade` (in worker.ts line 883)
   - Rename `applyRepositionAmendments` → `applyReposition` (in worker.ts line 945)
   - Update all internal references and tests

   OR

   - Rename UI handler calls to match worker registration:
   - Change 'planCascade' → 'planRepositionCascade' (in RepositionPanel.tsx line 78)
   - Change 'applyReposition' → 'applyRepositionAmendments' (in RepositionPanel.tsx line 79)

2. Fix build error:
   - Mark node:crypto as external in esbuild config, OR
   - Move randomUUID usage to worker-only code path, OR
   - Use crypto.getRandomValues polyfill for universal code

---

_Verified: 2026-05-03T06:28:00Z_
_Verifier: Claude (gsd-verifier)_
