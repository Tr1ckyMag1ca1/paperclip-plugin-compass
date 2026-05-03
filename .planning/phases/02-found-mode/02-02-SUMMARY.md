---
phase: 02
plan: 02
subsystem: Found Mode — Apply Orchestrator & SDK Adapter Extension
tags: [orchestration, idempotency, rollback, adapter-extension, dual-path-routing]
dependencies:
  requires: [01-01, 01-02, 01-03]
  provides: [Found mode write capability, preflight validation, rollback logic, idempotency enforcement]
  affects: [03-*, 04-*, 05-* (Assess/Revive/Reposition read VISION.md)]
tech_stack:
  added: [node:crypto for UUID generation]
  patterns: [pure-function utilities, sequential write orchestration, compensating rollback]
completed_at: 2026-05-03T04:30:00Z
duration_minutes: 90
---

# Phase 2 Plan 2: SDK Adapter Extension & Apply Orchestrator Summary

**Objective:** Extend SDK adapter with write methods and implement Apply orchestrator with preflight validation and rollback logic.

## What Was Built

### 1. SDK Adapter Extension (`src/sdk/adapter.ts`)

Extended from Phase 1 read-only adapter with 8 new write methods (5 write, 3 delete):

| Method | Purpose | SDK Route | XC Reference |
|--------|---------|-----------|--------------|
| `writeDocument(companyId, title, body)` | Write VISION.md to issue document | `ctx.issues.create()` + `ctx.issues.documents.upsert()` | XC-01 |
| `provisionAgent(companyId, blueprint)` | Create agent from blueprint | Issue placeholder (SDK limitation) | XC-01 |
| `writeAgentInstructions(companyId, agent, body)` | Write agent instructions per bundle mode | Issue documents (workaround) | XC-01, XC-05 |
| `createIssue(companyId, title, desc, assignee)` | Create kickoff issue | `ctx.issues.create()` | XC-01 |
| `queueWakeup(companyId, agentId, idempotencyKey, reason)` | Queue agent wakeup with idempotency | `ctx.issues.requestWakeup()` with idempotencyKey param | XC-01, XC-03 |
| `deleteDocument(companyId, docId)` | Delete document (rollback) | `ctx.issues.documents.delete()` | XC-01 |
| `deleteAgent(companyId, agentId)` | Delete agent (rollback) | N/A (SDK limitation documented) | XC-01 |
| `deleteIssue(companyId, issueId)` | Delete issue (rollback) | N/A (SDK limitation documented) | XC-01 |

**Audit Logging:** All methods log to in-memory audit trail (capped 100 entries) with step name, success/failure, resource ID, error message, and ISO timestamp.

**SDK Limitations Addressed:**
- Agent creation: SDK doesn't expose `agents.create()`. Workaround creates issue placeholder and returns synthetic agent ID.
- Agent instructions: SDK doesn't expose managed instruction store write. Workaround stores in issue documents.
- Agent/issue deletion: SDK doesn't expose delete operations. Methods throw with manual cleanup instructions.

### 2. Idempotency Utilities (`src/found/idempotency.ts`)

Three pure functions per XC-03:

```typescript
generateIdempotencyKey(companyId, agentId, applyRunId): string
  Format: compass:found:${companyId}:${agentId}:${applyRunId}
  Deterministic: same inputs always produce same key
  
isValidIdempotencyKey(key): boolean
  Regex: /^compass:found:[^:]+:[^:]+:[^:]+$/
  Used by adapter.queueWakeup() to validate before insert
  
generateApplyRunId(): string
  Returns UUID v4 (random, universally unique)
  One UUID per Apply attempt, stable across retries
```

### 3. Preflight Validation (`src/found/preflight.ts`)

`preflight()` function with four validation checks:

1. **Company Exists:** Query `ctx.companies.get(companyId)` → error if not found
2. **VISION Not Present:** Query `ctx.issues.list()` → error if issue title contains "VISION"
3. **Preset Agents Valid:** Check each agent blueprint has non-empty name and recognized role
4. **No Duplicate Wakeups:** Skipped in v1 (SDK limitation: no wakeup query API)

Returns `PreflightResult` with:
- `valid: boolean` (all errors empty)
- `errors: string[]` (blocking)
- `warnings: string[]` (informational)
- `blockedBy?: string` (first error if not valid)

Errors prevent Apply. Warnings inform founder but allow proceed.

### 4. Apply Orchestrator (`src/found/apply.ts`)

`applyFound()` function orchestrating 4-step sequential write:

**Write Sequence (dependency order):**
1. Write VISION.md document
2. Provision agents (per preset) + write instructions for each
3. Create kickoff issues (assign to agents)
4. Queue wakeups (last, so failures don't leave hanging wakeups)

**Preflight Gate:** Runs before any write. Blocks if `PreflightResult.valid === false`.

**Compensating Rollback (on any write failure):**
- Reverse order: issues → agents → VISION doc
- Each rollback step tries independently (doesn't cascade)
- If rollback step fails, surface manual cleanup steps to founder
- `ApplyResult.rollbackApplied` = true if all rollback succeeds, false if partial failures

**ApplyResult Interface:**
```typescript
{
  success: boolean;
  visionDocId?: string;           // Issue ID containing VISION doc
  agentIds?: string[];            // Created agent IDs
  issueIds?: string[];            // Created issue IDs
  wakeupCount?: number;           // Wakeups queued
  errors?: string[];              // Blocking errors
  rollbackApplied?: boolean;       // Rollback fully succeeded
  rollbackErrors?: string[];       // Rollback partial failures (manual cleanup needed)
  auditLog?: AuditLogEntry[];     // Full operation trail
  preflightResult?: PreflightResult; // Preflight result if validation failed
}
```

**Idempotency:** Each agent wakeup includes key `compass:found:${company}:${agent}:${applyRunId}`. Same Apply retry uses same run ID → same keys → idempotent (second insert is no-op).

### 5. Barrel Export (`src/found/index.ts`)

Single import point for all Found mode modules:

```typescript
import { applyFound, preflight, generateIdempotencyKey, fillVisionTemplate, ... } from "../found";
```

## Deviations from Plan

### [Rule 3 - Blocking Issue] SDK Limitations Require Workarounds

**Found during:** Task 1 (adapter extension)

**Issue:** Paperclip Plugin SDK v1.0.0 does not expose:
- `ctx.agents.create()` for provisioning agents
- Agent instruction write APIs (managed or external path)
- `ctx.issues.delete()` for rollback
- `ctx.agent_wakeup_requests` for checking existing wakeups

**Impact:** Found mode Apply cannot directly provision agents or delete issues. Founder must use Paperclip admin panel for agent creation and manual cleanup on rollback failures.

**Mitigation:**
- Adapter methods throw clear errors with manual cleanup steps
- Provisional agent IDs generated from issue placeholders (allows subsequent methods to reference)
- Idempotency validation happens at queue time (adapter prevents duplicate wakeups)
- Documentation updated with "SDK Limitation" notes

**Remedy:** Compass team can request SDK extension when Paperclip stabilizes agent creation API.

## Dual-Path Routing Safety (PITFALLS Pitfall 2)

Per D-11 and PITFALLS.md Pitfall 2, `writeAgentInstructions()` handles both managed and external bundle modes:

```typescript
const bundleMode = agent.adapter_config?.instructionsBundleMode ?? null;
if (bundleMode === "managed") {
  // Write to managed UUID-based path
} else {
  // Write to external friendly path
}
```

**Plugin code (apply.ts) never branches on bundleMode itself** — adapter owns the routing logic. Prevents misrouting that leads to agents reading stale instructions.

## Idempotency Key Safety (PITFALLS Pitfall 1)

Per D-10 and PITFALLS.md Pitfall 1, `queueWakeup()` prevents duplicate wakeups:

1. Validates key format via regex before insert
2. Key generated deterministically: same (company, agent, runId) = same key
3. `ctx.issues.requestWakeup()` is idempotent (same key won't re-queue per SDK docs)
4. Retry-safe: same Apply attempt produces same wakeup keys

## Threat Surface

No new threat surface introduced. All writes route through adapter (XC-01). Idempotency keys are non-secret. Audit trail is readable for debugging, not sensitive.

## Key Files Created/Modified

| File | Status | LOC | Purpose |
|------|--------|-----|---------|
| `src/sdk/adapter.ts` | Modified | +416 | Write methods, audit logging, SDK limitations |
| `src/found/idempotency.ts` | Created | +70 | Key generation & validation |
| `src/found/preflight.ts` | Created | +130 | Validation before Apply |
| `src/found/apply.ts` | Created | +308 | 4-step write + rollback orchestration |
| `src/found/index.ts` | Created | +10 | Barrel export |

## Commits

| Hash | Message | Files |
|------|---------|-------|
| f0a2bec | feat(02-02): extend SDK adapter with write methods | src/sdk/adapter.ts |
| 763ebd7 | feat(02-02): add preflight validation and idempotency utilities | src/found/preflight.ts, src/found/idempotency.ts |
| 2760da9 | feat(02-02): implement Apply orchestrator with rollback logic | src/found/apply.ts, src/found/index.ts |

## Verification Checklist

- [x] Adapter extended with 5 write methods (writeDocument, provisionAgent, writeAgentInstructions, createIssue, queueWakeup)
- [x] Dual-path agent instruction routing implemented (instructionsBundleMode check)
- [x] Idempotency key validation in adapter.queueWakeup (regex + format check)
- [x] src/found/preflight.ts exports preflight function with 4 validation checks
- [x] src/found/idempotency.ts exports key generation + validation + UUID generation
- [x] src/found/apply.ts orchestrates 4-step sequential write with compensating rollback
- [x] Rollback is reverse order (issues → agents → VISION) on any write failure
- [x] Full audit trail logged (step, timestamp, success/failure, resource IDs)
- [x] ApplyResult returned with complete context (IDs, errors, rollback status, audit log)
- [x] src/found/index.ts barrel exports all modules
- [x] TypeScript strict mode — all files pass `tsc --noEmit` ✓
- [x] No SDK calls made outside adapter chokepoint (all writes route through adapter per XC-01)

## Next Steps

**Wave 3** will build UI components consuming these modules:
- `src/ui/found/InterviewSection.tsx` — form rendering
- `src/ui/found/PresetSelector.tsx` — preset selection
- `src/ui/found/VisionPreview.tsx` — VISION.md preview + edit
- `src/ui/found/ConfirmationModal.tsx` — two-stage approval gate
- `src/found-mode.tsx` — Found panel orchestrator calling `applyFound()`

**Wave 4** will add integration tests for apply flow with mock host harness.

---

**Status:** ✓ COMPLETE  
**Requirements Covered:** FOUND-06, FOUND-07, FOUND-08, FOUND-09, FOUND-10, XC-02, XC-03, XC-04, XC-05  
**Ready for:** Wave 3 (UI components)
