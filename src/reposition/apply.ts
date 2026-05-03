/**
 * Apply Orchestrator for Reposition Mode
 *
 * Per D-11, D-12: Mirrors Phase 3 Apply pattern (preflight → sequential write → rollback).
 * Applies scoped VISION amendments with cascade notification and approval routing.
 *
 * Approval Routing:
 * - 'founder' mode: writes synchronously (immediate VISION + cascade)
 * - 'founder+ceo' mode: queues approval (no writes until CEO decides)
 *
 * Sequential Write Stages:
 * 1. Write amended VISION.md to documents
 * 2. Plan cascade via planRepositionCascade()
 * 3. Execute cascade via executeRepositionCascade() (create issues, queue wakeups)
 *
 * Compensating Rollback (on any failure):
 * - Reverse order: delete cascade issues → delete VISION doc
 *
 * Per XC-06 safety mandate: never auto-edit VISION without explicit founder confirmation gate.
 */

import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { Agent } from "../types.js";
import type { ParsedVision } from "../types/assess.js";
import { PaperclipAdapter, type AuditLogEntry } from "../sdk/adapter.js";
import {
  planRepositionCascade,
  executeRepositionCascade,
  type CascadePlan,
  type CascadeResult,
} from "./cascade.js";
import { serializeVision } from "../assess/vision-parse.js";
import { generateApplyRunId } from "../found/idempotency.js";
import type { Amendment } from "../types/reposition.js";

/**
 * Result of applyRepositionAmendments orchestration.
 *
 * Per D-12, XC-02: complete context including what succeeded, what failed,
 * what rolled back, audit trail, and approval routing status.
 */
export interface ApplyResult {
  /** True if all writes succeeded and wakeups queued */
  success: boolean;

  /** Document ID of written VISION.md amendment (if successful) */
  visionDocId?: string;

  /** Array of created cascade issue IDs (if successful) */
  cascadeIssueIds?: string[];

  /** Number of agents woken via cascade (if successful) */
  cascadeWakeupCount?: number;

  /** If founder+ceo routing: approval ID (no writes yet) */
  approvalId?: string;

  /** If founder+ceo routing: status is waiting for approval */
  waitingForApproval?: boolean;

  /** Errors that prevented completion (preflight/validation) */
  blockingErrors?: string[];

  /** Errors from sequential writes (if success === false) */
  errors?: string[];

  /** True if rollback completed successfully */
  rollbackApplied?: boolean;

  /** Errors during rollback (manual cleanup needed if non-empty) */
  rollbackErrors?: string[];

  /** Full audit trail of all write attempts and rollback actions */
  auditLog?: AuditLogEntry[];

  /** Human-readable summary of what was applied */
  summary?: string;
}

/**
 * Apply reposition amendments to VISION.md with cascade notification.
 *
 * Per D-11, D-12, XC-02: orchestrates preflight → sequential writes → rollback.
 * Respects approval routing config: founder (sync) vs founder+ceo (async approval gate).
 *
 * Preflight Stage:
 * - Check: VISION.md exists in documents
 * - Check: VISION.md parses successfully
 * - Check: At least one amendment
 * - Check: All amendments valid
 *
 * Sequential Write Stage (founder routing only):
 * - Stage 1: Write amended VISION.md to documents via adapter
 * - Stage 2: Plan cascade via planRepositionCascade()
 * - Stage 3: Execute cascade via executeRepositionCascade()
 *
 * Sequential Write Stage (founder+ceo routing):
 * - Stage 1: Queue approval request (no write yet)
 * - Return with waitingForApproval flag
 *
 * Rollback on failure:
 * - Delete cascade issues (if created)
 * - Delete VISION doc (if created)
 *
 * @param ctx Plugin context
 * @param companyId Company ID being repositioned
 * @param company Company record with agents list
 * @param amendments Reposition amendments (from amend.ts)
 * @param currentVision Current parsed VISION.md
 * @param proposedVision Proposed VISION.md after amendments
 * @param approvalRouting 'founder' | 'founder+ceo'
 * @param repositionRunId Reposition run UUID (stable across retries)
 * @param adapterOverride Optional adapter override for testing
 * @returns ApplyResult with success flag, IDs, errors, rollback status
 */
export async function applyRepositionAmendments(
  ctx: PluginContext,
  companyId: string,
  company: { agents: Agent[] },
  amendments: Amendment[],
  currentVision: ParsedVision,
  proposedVision: ParsedVision,
  approvalRouting: "founder" | "founder+ceo" = "founder",
  repositionRunId: string,
  adapterOverride?: PaperclipAdapter
): Promise<ApplyResult> {
  const adapter = adapterOverride || new PaperclipAdapter(ctx);
  const applyRunId = generateApplyRunId();
  const result: ApplyResult = { success: false };

  // ─────────────────────────────────────────────────────────────────
  // PREFLIGHT STAGE
  // ─────────────────────────────────────────────────────────────────

  // Check: At least one amendment
  if (!amendments || amendments.length === 0) {
    result.blockingErrors = ["No amendments to apply"];
    result.auditLog = adapter.getAuditLog();
    return result;
  }

  // Check: VISION.md can be serialized (validates structure)
  let serializedVision: string;
  try {
    serializedVision = serializeVision(proposedVision);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.blockingErrors = [`Failed to serialize VISION.md: ${msg}`];
    result.auditLog = adapter.getAuditLog();
    return result;
  }

  // ─────────────────────────────────────────────────────────────────
  // ROUTING DECISION
  // ─────────────────────────────────────────────────────────────────

  if (approvalRouting === "founder+ceo") {
    // Queue approval, don't write yet
    return applyWithApprovalGate(
      adapter,
      ctx,
      companyId,
      amendments,
      proposedVision,
      applyRunId,
      repositionRunId
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // SEQUENTIAL WRITE STAGE (founder routing)
  // ─────────────────────────────────────────────────────────────────

  // Stage 1: Write amended VISION.md
  let visionDocId: string;
  try {
    visionDocId = await adapter.writeDocument(companyId, "VISION.md", serializedVision);
    result.visionDocId = visionDocId;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.blockingErrors = [`Failed to write VISION.md: ${msg}`];
    result.auditLog = adapter.getAuditLog();
    return result;
  }

  // Stage 2 & 3: Plan and execute cascade
  let cascadeResult: CascadeResult;
  try {
    const cascade = await planRepositionCascade(proposedVision, amendments, company.agents);
    cascadeResult = await executeRepositionCascade(ctx, companyId, cascade, repositionRunId);

    if (!cascadeResult.success) {
      // Cascade failed — trigger rollback
      result.errors = cascadeResult.errors;
      await performRollback(adapter, companyId, result);
      result.auditLog = adapter.getAuditLog();
      return result;
    }

    result.cascadeIssueIds = cascadeResult.createdIssueIds;
    result.cascadeWakeupCount = cascadeResult.wakenAgentIds.length;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors = [`Cascade failed: ${msg}`];
    await performRollback(adapter, companyId, result);
    result.auditLog = adapter.getAuditLog();
    return result;
  }

  // Success!
  result.success = true;
  result.summary = `Updated VISION.md with ${amendments.length} amendment(s), cascaded to ${result.cascadeWakeupCount || 0} agent(s)`;
  result.auditLog = adapter.getAuditLog();
  return result;
}

/**
 * Apply with founder+ceo approval gate.
 *
 * Per D-11: queues approval request instead of writing immediately.
 * No writes occur until CEO agent approves the reposition plan.
 *
 * @param adapter Paperclip adapter
 * @param ctx Plugin context
 * @param companyId Company ID
 * @param amendments Amendments to apply
 * @param proposedVision Final VISION after amendments
 * @param applyRunId Apply run UUID
 * @param repositionRunId Reposition run UUID
 * @returns ApplyResult with waitingForApproval flag and approvalId
 */
async function applyWithApprovalGate(
  adapter: PaperclipAdapter,
  ctx: PluginContext,
  companyId: string,
  amendments: Amendment[],
  proposedVision: ParsedVision,
  applyRunId: string,
  repositionRunId: string
): Promise<ApplyResult> {
  const result: ApplyResult = {
    success: true,
    waitingForApproval: true,
  };

  try {
    // Insert approval record (Phase 6 will poll this)
    const serializedVision = serializeVision(proposedVision);

    // Per D-11: approvalId comes from SDK insertApproval (placeholder for v1)
    // In v1, we'll use a synthetic ID based on run UUID
    const approvalId = `compass:approval:reposition:${companyId}:${repositionRunId}`;

    // Log approval request to worker-state for Phase 6
    await ctx.state.set(
      {
        scopeKind: "company" as const,
        scopeId: companyId,
        namespace: "reposition-approval",
        stateKey: repositionRunId,
      },
      {
        approvalId,
        status: "pending",
        proposedVision: serializedVision,
        amendments,
        createdAt: new Date().toISOString(),
      }
    );

    result.approvalId = approvalId;
    result.summary = `Approval request queued for CEO review. Waiting for decision.`;
    result.auditLog = adapter.getAuditLog();
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.success = false;
    result.blockingErrors = [`Failed to queue approval: ${msg}`];
    result.auditLog = adapter.getAuditLog();
    return result;
  }
}

/**
 * Perform compensating rollback on Apply failure.
 *
 * Per D-12, XC-02: runs in REVERSE dependency order:
 * 1. Delete cascade issues (if created)
 * 2. Delete VISION doc (if created)
 *
 * If any rollback step fails, surface explicit manual cleanup steps.
 *
 * @param adapter Paperclip adapter
 * @param companyId Company ID
 * @param result Apply result with resource IDs to delete
 */
async function performRollback(
  adapter: PaperclipAdapter,
  companyId: string,
  result: ApplyResult
): Promise<void> {
  const rollbackErrors: string[] = [];

  // Rollback cascade issues (if any created)
  if (result.cascadeIssueIds && result.cascadeIssueIds.length > 0) {
    for (const issueId of result.cascadeIssueIds) {
      try {
        await adapter.deleteIssue(companyId, issueId);
      } catch (rollbackErr) {
        const msg =
          rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr);
        rollbackErrors.push(`Failed to delete cascade issue ${issueId}: ${msg}`);
      }
    }
  }

  // Rollback VISION doc (if created)
  if (result.visionDocId) {
    try {
      await adapter.deleteDocument(companyId, result.visionDocId);
    } catch (rollbackErr) {
      const msg =
        rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr);
      rollbackErrors.push(`Failed to delete VISION doc ${result.visionDocId}: ${msg}`);
    }
  }

  result.rollbackApplied = rollbackErrors.length === 0;
  result.rollbackErrors = rollbackErrors;

  if (rollbackErrors.length > 0) {
    // Surface manual cleanup steps
    const cleanupSteps = [
      "Rollback encountered errors. Manual cleanup required:",
      ...rollbackErrors,
      "",
      "Steps to clean up:",
      "1. Delete cascade issues: " + (result.cascadeIssueIds || []).join(", "),
      "2. Delete VISION doc: " + result.visionDocId,
    ];

    result.errors = result.errors || [];
    result.errors.push(...cleanupSteps);
  }
}
