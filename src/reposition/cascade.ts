/**
 * Cascade Planning Wrapper for Reposition Mode
 *
 * Per D-09, D-10: Thin wrapper around Phase 3 assess cascade orchestration.
 * Reuses agent screening, custom-override detection, issue planning, and execution.
 *
 * Only difference from Assess: idempotency key namespace is reposition-specific.
 *
 * No new cascade logic: Phase 5 adds no novel cascade patterns — delegates to assess.
 */

import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { Agent } from "../types.js";
import type { ParsedVision } from "../types/assess.js";
import type { Amendment as AssessAmendment, CascadePlan, CascadeResult } from "../assess/cascade.js";
import {
  planCascade as planAssessCascade,
  executeCascade as executeAssessCascade,
} from "../assess/cascade.js";
import { PaperclipAdapter } from "../sdk/adapter.js";
import { generateRepositionIdempotencyKey } from "../found/idempotency.js";
import type { Amendment } from "../types/reposition.js";

// Re-export types for convenience
export type { CascadePlan, CascadeResult } from "../assess/cascade.js";

/**
 * Plan cascade for reposition amendments.
 *
 * Per D-09: Thin wrapper around assess planCascade.
 * Converts reposition Amendment to assess Amendment format (same structure, add evidence=[]).
 * Delegates all screening, override detection, and issue planning logic to Phase 3.
 *
 * @param vision Parsed VISION.md object
 * @param amendments Reposition amendments (from amend.ts)
 * @param agents All company agents
 * @returns CascadePlan with affected agents, warnings, and proposed issues
 */
export async function planRepositionCascade(
  vision: ParsedVision,
  amendments: Amendment[],
  agents: Agent[]
): Promise<CascadePlan> {
  if (!vision) {
    return {
      affectedAgents: [],
      customOverrideWarnings: [],
      issuesByAgent: {},
      generatedAt: new Date().toISOString(),
    };
  }

  if (!agents || agents.length === 0) {
    return {
      affectedAgents: [],
      customOverrideWarnings: [],
      issuesByAgent: {},
      generatedAt: new Date().toISOString(),
    };
  }

  // Convert Reposition Amendment to Assess Amendment format
  // Assess amendments have evidence[] and confidence fields; reposition doesn't
  const assessAmendments: AssessAmendment[] = amendments.map((a) => ({
    section: a.section,
    currentContent: a.currentContent,
    proposedContent: a.proposedContent,
    reason: a.reason,
    evidence: [], // Reposition has no evidence items (deterministic shift, not drift audit)
    confidence: 1.0, // Reposition founder explicitly approved, so high confidence
    runId: "reposition-run", // Placeholder; not used in cascade planning
  }));

  // Delegate to assess cascade planning (no Phase 5-specific logic)
  return planAssessCascade(vision, assessAmendments, agents);
}

/**
 * Execute cascade plan for reposition mode.
 *
 * Per D-09, D-12: Thin wrapper around assess executeCascade.
 * Only difference: idempotency key uses reposition namespace via generateRepositionIdempotencyKey.
 *
 * @param ctx PluginContext (provides SDK adapter and user context)
 * @param companyId Company ID
 * @param plan CascadePlan from planRepositionCascade
 * @param repositionRunId Unique run UUID for this reposition operation
 * @returns CascadeResult with created issue IDs, woken agents, errors
 */
export async function executeRepositionCascade(
  ctx: PluginContext,
  companyId: string,
  plan: CascadePlan,
  repositionRunId: string
): Promise<CascadeResult> {
  if (!plan || plan.affectedAgents.length === 0) {
    return {
      success: true,
      createdIssueIds: [],
      wakenAgentIds: [],
    };
  }

  const adapter = new PaperclipAdapter(ctx);

  // Delegate sequential creation of issues and wakeups to assess executeCascade
  // but modify the wakeup idempotency key to use reposition namespace
  const result: CascadeResult = {
    success: false,
    createdIssueIds: [],
    wakenAgentIds: [],
    errors: [],
  };

  // Sequential loop: create issue per agent, then queue wakeup with reposition idempotency key
  for (const agent of plan.affectedAgents) {
    const issuePlan = plan.issuesByAgent[agent.id];

    if (!issuePlan) {
      result.errors?.push(`No issue plan for agent ${agent.id}`);
      return result; // Halt on missing plan
    }

    // 1. Create cascade issue (same as assess)
    try {
      const issueId = await adapter.createIssue(
        companyId,
        issuePlan.title,
        issuePlan.description,
        agent.id
      );

      result.createdIssueIds.push(issueId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors?.push(`Failed to create issue for agent ${agent.id}: ${msg}`);
      return result; // Halt on issue creation failure
    }

    // 2. Queue wakeup with reposition-namespaced idempotency key (DIFFERENCE FROM ASSESS)
    try {
      const idempotencyKey = generateRepositionIdempotencyKey(
        companyId,
        repositionRunId,
        agent.id
      );
      await adapter.queueWakeup(
        companyId,
        agent.id,
        idempotencyKey,
        `VISION.md repositioned. Review cascade issue for details.`
      );

      result.wakenAgentIds.push(agent.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors?.push(`Failed to queue wakeup for agent ${agent.id}: ${msg}`);
      return result; // Halt on wakeup failure
    }
  }

  result.success = true;
  result.errors = undefined; // Clear errors on success
  return result;
}
