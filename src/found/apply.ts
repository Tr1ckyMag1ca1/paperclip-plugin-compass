/**
 * Apply Orchestrator for Found Mode
 *
 * Per D-09 (XC-02): orchestrates preflight → sequential writes → compensating rollback on failure.
 *
 * Apply writes in dependency order (must respect):
 * 1. VISION.md document (others reference it)
 * 2. Agents (VISION created, agents created)
 * 3. Kickoff issues (agents must exist before issues assign to them)
 * 4. Wakeups (queued last, so failure doesn't leave hanging wakeups)
 *
 * On any write failure, rollback runs in REVERSE order:
 * - Delete issues
 * - Delete agents
 * - Delete VISION doc
 *
 * If rollback step itself fails, halt and surface manual cleanup steps to founder.
 *
 * All writes route through adapter (XC-01 chokepoint). Idempotency keys prevent
 * duplicate runs on retry (XC-03).
 *
 * NOTE: Assess mode (Phase 3 Plan 2) reuses this orchestrator pattern in src/assess/apply.ts
 * with amendments + cascade instead of agents + issues. The preflight → sequential → rollback
 * structure is fundamental to XC-02 and is replicated for the assessment flow.
 */

import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { FilledVision, PresetDefinition } from "../types/found.js";
import { PaperclipAdapter, type AuditLogEntry } from "../sdk/adapter.js";
import { preflight, type PreflightResult } from "./preflight.js";
import { checkVisionQuality } from "./quality-check.js";
import { generateIdempotencyKey, generateApplyRunId } from "./idempotency.js";

/**
 * Result of Apply step execution.
 *
 * Returns complete context: what succeeded, what failed, what rolled back, audit trail.
 */
export interface ApplyResult {
  /** True if all writes succeeded and wakeups queued */
  success: boolean;

  /** Apply run UUID (stable across retries, used for memory recording) */
  runId?: string;

  /** Document ID of written VISION.md (if successful) */
  visionDocId?: string;

  /** Array of created agent IDs (if successful) */
  agentIds?: string[];

  /** Array of created issue IDs (if successful) */
  issueIds?: string[];

  /** Number of wakeups queued (if successful) */
  wakeupCount?: number;

  /** Blocking errors that prevented completion (from quality check or preflight) */
  blockingErrors?: string[];

  /** Blocking errors that prevented completion (from preflight/validation) */
  errors?: string[];

  /** True if rollback completed successfully; false if rollback errors occurred */
  rollbackApplied?: boolean;

  /** Errors during rollback (manual cleanup needed if non-empty) */
  rollbackErrors?: string[];

  /** Full audit trail of all write attempts and rollback actions */
  auditLog?: AuditLogEntry[];

  /** Preflight result if validation failed */
  preflightResult?: PreflightResult;
}

/**
 * Apply the Found mode provisioning.
 *
 * Orchestrates the full write sequence:
 * 1. Call preflight validation (blocks if errors)
 * 2. Write VISION.md document
 * 3. Provision agents per preset
 * 4. Write agent instructions (per dual-path routing)
 * 5. Create kickoff issues
 * 6. Queue wakeups with idempotency keys
 *
 * On any error, run compensating rollback (reverse order).
 *
 * @param ctx Plugin context
 * @param companyId Company ID to found
 * @param vision Filled VISION template (from quality-check)
 * @param preset Preset definition with agents
 * @param selectedPresetId Selected preset ID (for audit)
 * @returns ApplyResult with success flag, IDs, errors, rollback status, audit log
 */
export async function applyFound(
  ctx: PluginContext,
  companyId: string,
  vision: FilledVision,
  preset: PresetDefinition,
  selectedPresetId: string
): Promise<ApplyResult> {
  const adapter = new PaperclipAdapter(ctx);
  const applyRunId = generateApplyRunId();
  const result: ApplyResult = { success: false, runId: applyRunId };

  // 0. Quality check VISION before proceeding
  try {
    const quality = checkVisionQuality(vision);
    if (!quality.isValid) {
      result.blockingErrors = quality.errors.length > 0
        ? quality.errors
        : [`Missing required slots: ${quality.missingRequiredSlots.join(", ")}`];
      result.auditLog = adapter.getAuditLog();
      return result;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.blockingErrors = [`Quality check failed: ${msg}`];
    result.auditLog = adapter.getAuditLog();
    return result;
  }

  // 1. Initialize and run preflight
  try {
    const preflightResult = await preflight(ctx, companyId, preset, vision);

    if (!preflightResult.valid) {
      result.blockingErrors = preflightResult.errors;
      result.errors = preflightResult.errors;
      result.preflightResult = preflightResult;
      result.auditLog = adapter.getAuditLog();
      return result;
    }

    // Log preflight pass
    if (preflightResult.warnings.length > 0) {
      console.warn("Preflight warnings:", preflightResult.warnings);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.blockingErrors = [`Preflight failed: ${msg}`];
    result.errors = [`Preflight failed: ${msg}`];
    result.auditLog = adapter.getAuditLog();
    return result;
  }

  // 2. Write VISION.md document
  try {
    const docId = await adapter.writeDocument(companyId, "VISION.md", vision.body);
    result.visionDocId = docId;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors = [String(err)];
    result.auditLog = adapter.getAuditLog();
    return result; // Jump to rollback (but nothing to roll back yet)
  }

  // 3. Provision agents per preset
  try {
    const agentIds: string[] = [];

    for (const agentBlueprint of preset.agents) {
      const agent = await adapter.provisionAgent(companyId, {
        name: agentBlueprint.name,
        role: agentBlueprint.role,
        description: `Provisioned from preset: ${preset.name}`,
      });

      agentIds.push(agent.id);

      // 3a. Write agent instructions immediately after creation
      // Per D-11, dual-path routing handled by adapter
      const instructions = `# Instructions for ${agent.name}

## Role
${agent.role}

## General Guidance
Act as the ${agent.name} for this company. Follow the company VISION.md for strategic direction.

See VISION.md for full company context.`;

      try {
        await adapter.writeAgentInstructions(companyId, agent, instructions);
      } catch (instrErr) {
        // Instruction write failure should roll back the agent
        throw instrErr;
      }
    }

    result.agentIds = agentIds;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors = [String(err)];
    await performRollback(adapter, companyId, result);
    result.auditLog = adapter.getAuditLog();
    return result;
  }

  // 4. Create kickoff issues
  try {
    const issueIds: string[] = [];

    for (const agentId of result.agentIds || []) {
      const issueId = await adapter.createIssue(
        companyId,
        `Kickoff: ${agentId}`,
        "Company founded via Compass. Begin heartbeat and initial setup.",
        agentId
      );
      issueIds.push(issueId);
    }

    result.issueIds = issueIds;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors = [String(err)];
    await performRollback(adapter, companyId, result);
    result.auditLog = adapter.getAuditLog();
    return result;
  }

  // 5. Queue wakeups (must be last — failure here is non-critical)
  try {
    let wakeupCount = 0;

    for (const agentId of result.agentIds || []) {
      const idempotencyKey = generateIdempotencyKey(companyId, agentId, applyRunId);
      await adapter.queueWakeup(
        companyId,
        agentId,
        idempotencyKey,
        `Company founded via Compass Found mode. Preset: ${selectedPresetId}`
      );
      wakeupCount++;
    }

    result.wakeupCount = wakeupCount;
    result.success = true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Wakeup failure is logged but not fatal (agents created, just not woken up)
    result.errors = [String(err)];
    result.success = false; // Mark failure but don't roll back (wakeups are queue-only)
  }

  // Per D-06: Memory recording deferred to handler layer (Phase 7)
  // Apply executes in browser context; memory functions require Node APIs
  // Handler will call recordFindingsToHistory post-Apply with result metadata

  result.auditLog = adapter.getAuditLog();
  return result;
}

/**
 * Perform compensating rollback on Apply failure.
 *
 * Runs in REVERSE dependency order:
 * 1. Delete issues (if created)
 * 2. Delete agents (if created)
 * 3. Delete VISION doc (if created)
 *
 * If any rollback step fails, surface explicit manual cleanup steps.
 *
 * @param adapter Paperclip adapter with delete methods
 * @param companyId Company ID
 * @param result Apply result with resource IDs to delete
 */
async function performRollback(adapter: any, companyId: string, result: ApplyResult): Promise<void> {
  const rollbackErrors: string[] = [];

  // Rollback issues (if any created)
  if (result.issueIds && result.issueIds.length > 0) {
    for (const issueId of result.issueIds) {
      try {
        await adapter.deleteIssue(companyId, issueId);
      } catch (rollbackErr) {
        const msg = rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr);
        rollbackErrors.push(`Failed to delete issue ${issueId}: ${msg}`);
      }
    }
  }

  // Rollback agents (if any created)
  if (result.agentIds && result.agentIds.length > 0) {
    for (const agentId of result.agentIds) {
      try {
        await adapter.deleteAgent(companyId, agentId);
      } catch (rollbackErr) {
        const msg = rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr);
        rollbackErrors.push(`Failed to delete agent ${agentId}: ${msg}`);
      }
    }
  }

  // Rollback VISION doc (if created)
  if (result.visionDocId) {
    try {
      await adapter.deleteDocument(companyId, result.visionDocId);
    } catch (rollbackErr) {
      const msg = rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr);
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
      "1. Delete agents: " + (result.agentIds || []).join(", "),
      "2. Delete issues: " + (result.issueIds || []).join(", "),
      "3. Delete VISION doc: " + result.visionDocId,
    ];

    result.errors = result.errors || [];
    result.errors.push(...cleanupSteps);
  }
}
