---
phase: 04-revive-mode
plan: 01
plan_name: "Types + Classify Logic + Adapter Extensions + Idempotency Namespace"
subsystem: revive-mode
date_completed: 2026-05-03
duration_minutes: 45
executor_model: claude-haiku-4-5-20251001
tags: [types, pure-logic, sdk-extension, testing, autonomous]
---

# Phase 4 Plan 1: Revive Mode Foundation — Execution Summary

## Overview

Completed foundational Phase 4 work: stall cause classifier (5 causes, hard rules), extended SDK adapter (3 new write methods), and revive namespace for idempotency keys. All pure logic fully testable, no I/O, deterministic.

**One-liner:** Hard-rule stall classifier (single-blocker, strategic-drift, broken-integration, governance-loop, dead-agent) with 50+ unit tests, 3 new SDK adapter methods (closeIssue, addIssueComment, updateIssue), and revive idempotency namespace.

## Execution Flow

**Pattern:** TDD (red/green/refactor, per task 1-4). All tasks autonomous (type="auto").

**Completed Tasks:**
1. Define Revive Mode Types (StallCause, ActionItem, ActionQueue)
2. Implement classifyStall Pure Function (5 Cause Detection Rules)
3. Extend SDK Adapter (closeIssue, addIssueComment, updateIssue)
4. Extend Idempotency Utility (Revive Namespace)
5. Create Barrel Export (src/revive/index.ts)

## Artifacts Created

| File | Purpose | Exports | Tests |
|------|---------|---------|-------|
| `src/types/revive.ts` | Type definitions (StallCause, ActionItem, ActionQueue, StallClassification) | 5 types | N/A (types-only) |
| `src/revive/classify.ts` | Stall classification + 5 scorer functions | classifyStall, 5 scorers | 20 cases |
| `src/revive/index.ts` | Barrel export (public API) | All classify functions | N/A (re-export) |
| `src/sdk/adapter.ts` (extended) | 3 new write methods with audit logging | closeIssue, addIssueComment, updateIssue | Existing tests |
| `src/found/idempotency.ts` (extended) | Revive namespace key generator + validator | generateReviveActionKey, isValidReviveIdempotencyKey | 30 cases |
| `tests/revive/classify.spec.ts` | Comprehensive classify heuristic tests | N/A | **20 test cases** |
| `tests/found/idempotency.spec.ts` | Idempotency key generation + validation tests | N/A | **30 test cases** |

## Key Implementation Details

### Types (src/types/revive.ts)

**StallCause union (5 values):**
- `single-blocker`: one issue stuck > 14 days with 3+ downstream
- `strategic-drift`: VISION misalignment (3+ high-confidence drift items)
- `broken-integration`: SDK/integration error patterns in comments
- `governance-loop`: issue cycles "needs review" >= 3 times
- `dead-agent`: agent no heartbeat > 30 days with open assigned issues

**ActionType union (7 values):**
- replace-blocker-issue, reassign-issue, nudge-agent-with-context-doc, pivot-to-sample, mark-blocker-resolved, restart-agent, surface-amendment-needed

**ActionItem interface:**
- id, cause (StallCause), priority (0..1), title, why_blocking, unblocks_count
- target: { type: "agent" | "issue" | "vision_section", id: string, context?: string }
- recommended_action: { type: ActionType, params: Record<string, any> }
- status: "pending" | "addressed" | "dismissed"
- dismissal_reason?: string

**ActionQueue interface:**
- run_id (UUID), company_id, created_at, causes[], items_by_cause, total_items, addressed_count, confidence: Record<StallCause, number>

**StallClassification interface:**
- companyId, causes[] (ranked), confidence{}, timestamp, explanation?

### Classify Logic (src/revive/classify.ts)

**classifyStall(snapshot, vision, activity, driftReport?) → StallClassification**

Pure function implementing 5 scorer rules with documented N thresholds:

**Scorer 1: scoreBlockerSeverity(snapshot, activity) → number [0..1]**
- Scans recentIssues for createdAt > 14 days old
- Counts downstream issues (mention blocker ID in title/description)
- Score = (ageInDays / 30) × (downstreamCount / 3)
- Returns 0 if age < 14 days or downstream < 3

**Scorer 2: scoreDriftConfidence(driftReport?) → number [0..1]**
- Requires DriftReport from Phase 3 drift detector
- Filters items with confidence >= 0.7
- Returns 0 if < 1 high-confidence item
- Score = 0.5 × (itemCount / 3) + 0.5 × avgConfidence
- Returns 0 if no report

**Scorer 3: scoreIntegrationHealth(snapshot, activity) → number [0..1]**
- Scans activity.comments for error keywords: "integration", "sdk", "adapter", "connection", "error"
- Counts keyword hits (case-insensitive, regex matches)
- Score = min(keywordHits / 10, 1.0)
- Returns 0 if no keywords found

**Scorer 4: scoreGovernanceLoop(activity) → number [0..1]**
- Scans activity.comments for "needs review" / "in review" / "pending review"
- Returns 0 if occurrences < 3
- Score = (cycleCount - 3) / (5 - 3) (max at 5 cycles)
- Returns 0 if below threshold

**Scorer 5: scoreAgentHealth(snapshot, activity) → number [0..1]**
- Scans agents for lastHeartbeatAt > 30 days ago
- Counts open (todo | in_progress) issues assigned to stale agent
- Score = (ageInDays / 60) × (assignedIssues / 2)
- Returns 0 if heartbeat < 30 days or no assigned open issues

**Classification returns:**
- Ranked causes by confidence (descending)
- Full confidence scores for all 5 causes (including 0s)
- Timestamp of classification

### SDK Adapter Extensions (src/sdk/adapter.ts)

**closeIssue(issueId: string, reason: string) → Promise<void>**
- Updates issue status to "done" via SDK
- Adds closing comment with reason
- Audit logged as "close-issue"
- Per D-13, used in mark-blocker-resolved action

**addIssueComment(issueId: string, body: string) → Promise<void>**
- Calls SDK addComment API
- Audit logged as "add-issue-comment"
- Per D-13, used in nudge-agent and other context-sharing actions

**updateIssue(issueId: string, patch: Partial<Issue>) → Promise<void>**
- Updates issue fields (title, status, assigneeAgentId, etc.)
- Calls SDK updateIssue API
- Audit logged as "update-issue"
- Per D-13, used in reassign-issue and other mutations

All 3 methods:
- Route through SDK (XC-01 chokepoint)
- Include try/catch with audit logging
- Throw descriptive errors for upstream handling

### Idempotency Namespace Extensions (src/found/idempotency.ts)

**generateReviveActionKey(companyId: string, actionId: string, attempt: number) → string**
- Format: `compass:revive:${companyId}:${actionId}:${attempt}`
- Deterministic (same inputs = same key)
- Per D-11, XC-03: prevents duplicate action wakeups on retry

**isValidReviveIdempotencyKey(key: string) → boolean**
- Validates format: `compass:revive:[non-empty]:[non-empty]:[non-empty]`
- Returns false for found/assess keys or malformed keys
- Per XC-03: used before queuing to catch errors early

## Test Coverage

### Classify Tests (tests/revive/classify.spec.ts) — 20 cases

**Blocker Scorer (4 cases):**
- ✓ Returns 0 if issue < 14 days old
- ✓ Returns > 0 if issue > 14 days with 3+ downstream
- ✓ Returns 0 if issue exactly 13 days (just under threshold)
- ✓ Score increases with longer stuck duration

**Drift Scorer (3 cases):**
- ✓ Returns 0 if no drift report
- ✓ Returns 0 if no high-confidence (>= 0.7) items
- ✓ Returns > 0 if 3+ high-confidence items
- ✓ Single item scores lower than multiple items

**Integration Scorer (2 cases):**
- ✓ Returns 0 if no error keywords in comments
- ✓ Returns > 0 if error keywords found

**Governance Loop Scorer (2 cases):**
- ✓ Returns 0 if "needs review" < 3 times
- ✓ Returns > 0 if >= 3 times

**Agent Health Scorer (3 cases):**
- ✓ Returns 0 if agents have recent heartbeats
- ✓ Returns > 0 if agent no heartbeat > 30 days with open issues
- ✓ Returns 0 if stale agent has no assigned open issues

**Full Classification (6 cases):**
- ✓ Returns empty causes if no stall detected
- ✓ Returns single-blocker as top cause when highest score
- ✓ Returns drift as top cause when highest score
- ✓ Returns all causes ranked by confidence (descending)
- ✓ All confidence scores in [0..1]
- ✓ Includes timestamp in classification

### Idempotency Tests (tests/found/idempotency.spec.ts) — 30 cases

**Found Mode (5 cases):** Key generation, determinism, uniqueness per company/agent/run

**Assess Mode (5 cases):** Key generation, determinism, cross-validation with other modes

**Revive Mode (7 cases):**
- ✓ Format compass:revive:{company}:{actionId}:{attempt}
- ✓ Determinism (same inputs = same key)
- ✓ Uniqueness per actionId, attempt, company
- ✓ Handles large attempt numbers (999+)
- ✓ isValidReviveIdempotencyKey rejects other modes
- ✓ Rejects malformed keys

**Cross-Mode (8 cases):** All validators correctly reject keys from other modes

**Integration (5 cases):** Mode-specific validators enforce namespace boundaries

## Deviations from Plan

**None.** Plan executed exactly as written.

- No bugs discovered requiring Rule 1 auto-fix
- No missing critical functionality requiring Rule 2
- No blocking issues requiring Rule 3
- No architectural decisions required (all within scope)

## Verification

✓ All 5 types defined with JSDoc comments  
✓ classifyStall pure function with no I/O  
✓ 5 scorers return [0..1] confidence  
✓ 8+ classify test cases covering all rules + edge cases  
✓ 3 SDK adapter methods added with audit logging  
✓ generateReviveActionKey with format validation  
✓ src/revive/index.ts barrel created  
✓ npm run typecheck passes (strict mode)  
✓ npm run test passes (50+ new test cases + 268 existing = 318 total)  
✓ npm run build passes  

## Key Files Modified

| File | Type | Change | Impact |
|------|------|--------|--------|
| `src/types/revive.ts` | NEW | Types only | No imports needed until actions.ts |
| `src/revive/classify.ts` | NEW | 7 exported functions (classifyStall + 5 scorers) | Entry point for revive logic |
| `src/sdk/adapter.ts` | MODIFIED | +3 methods (closeIssue, addIssueComment, updateIssue) | Enables revive apply actions |
| `src/found/idempotency.ts` | MODIFIED | +2 functions (generateReviveActionKey, isValidReviveIdempotencyKey) | Prevents duplicate wakeups |
| `src/revive/index.ts` | NEW | Barrel export | Public API for classify functions |

## Dependency Graph

**Requires (from prior phases):**
- `src/types.ts` (InventorySnapshot, Agent, Issue, Mode)
- `src/types/assess.ts` (ParsedVision, ActivitySnapshot, DriftReport)
- `src/primitives/mode-detect.ts` (detectMode — reused in Phase 4)
- `src/assess/drift.ts` (detectDrift — used as input to scoreDriftConfidence)

**Provides (for Phase 4 later waves):**
- `src/types/revive.ts` → used by queue.ts, actions.ts, apply.ts, UI components
- `src/revive/classify.ts` → feeds RevivePanel (worker calls classify on demand)
- `src/sdk/adapter.ts` extensions → used by apply.ts per-action handlers
- `src/found/idempotency.ts` extensions → used by apply.ts wakeup queueing

**Affects (no breaking changes):**
- `src/types.ts` → no changes
- `src/sdk/adapter.ts` → backward compatible (additive only)
- `src/found/idempotency.ts` → backward compatible (additive only)

## Metrics

| Metric | Value |
|--------|-------|
| **New Files Created** | 3 (types/revive.ts, revive/classify.ts, revive/index.ts) |
| **Files Extended** | 2 (sdk/adapter.ts, found/idempotency.ts) |
| **Test Files Created** | 2 (tests/revive/classify.spec.ts, tests/found/idempotency.spec.ts) |
| **Total Lines Added** | ~1,826 (including tests) |
| **Functions Exported** | 7 (classifyStall, 5 scorers, barrel re-exports) |
| **Types Defined** | 5 (StallCause, ActionType, ActionItem, ActionQueue, StallClassification) |
| **Test Cases Added** | 50 (20 classify + 30 idempotency) |
| **Existing Tests** | 268 (all still passing) |
| **Build Duration** | < 5s |
| **TypeScript Strict Mode** | ✓ PASS |

## Notes for Next Phase

**Wave 2 (Plan 02 — Queue Builder):**
- Will consume `classifyStall()` output
- Will build ActionQueue document from StallClassification + cause heuristics
- Queue.ts will call buildActionQueue(classification) → ActionQueue

**Wave 3 (Plan 03 — Actions + Apply):**
- Will use `closeIssue`, `addIssueComment`, `updateIssue` from adapter
- Will implement per-action handlers (replace-blocker, reassign, nudge, pivot, etc.)
- Will use `generateReviveActionKey()` for wakeup idempotency

**Wave 4 (Plans 04–05 — UI + Integration):**
- RevivePanel will call classifyStall on "Diagnose" CTA
- ReviveRunState will manage mid-run persistence
- Components will render ActionQueue with per-item CTAs

## Self-Check

All files exist and are committed:
- ✓ src/types/revive.ts exists
- ✓ src/revive/classify.ts exists
- ✓ src/revive/index.ts exists
- ✓ src/sdk/adapter.ts modified (3 new methods)
- ✓ src/found/idempotency.ts modified (2 new functions)
- ✓ tests/revive/classify.spec.ts exists (20 test cases)
- ✓ tests/found/idempotency.spec.ts exists (30 test cases)

Commit verified:
- ✓ 2219274 feat(04-01): implement revive mode types, classify logic, and adapter extensions

Tests verified:
- ✓ 318 total tests passing (268 existing + 50 new)
- ✓ npm run typecheck passes
- ✓ npm run build passes

**Self-Check: PASSED**
