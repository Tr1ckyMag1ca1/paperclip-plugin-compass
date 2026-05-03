/**
 * Revive Mode Action Handlers
 *
 * Per D-07, D-10: Typed handler functions for all 7 action types.
 * Each handler:
 * 1. Receives an ActionItem with specific parameters for the action type
 * 2. Uses the PaperclipAdapter to execute writes (no direct SDK calls)
 * 3. Returns an ActionResult with success status and summary
 * 4. Includes error handling and validation
 *
 * Handler registry (handlers map) and executeAction dispatcher route actions
 * by type to their corresponding handler implementation.
 *
 * Per XC-01: All writes route through the adapter chokepoint.
 * Per XC-03: Wakeups include idempotency keys for retry safety.
 */

import type { ActionItem, ActionType, ActionResult } from "../types/revive.js";
import { PaperclipAdapter } from "../sdk/adapter.js";
import { generateReviveActionKey } from "../found/idempotency.js";
import { executeSamplePivot } from "./sample-pivot.js";

/**
 * ActionHandler interface: all 7 handlers conform to this signature.
 * @param actionItem The action to execute, with typed parameters
 * @param adapter PaperclipAdapter instance for SDK calls
 * @returns ActionResult with success status and summary
 */
export interface ActionHandler {
  (actionItem: ActionItem, adapter: PaperclipAdapter): Promise<ActionResult>;
}

/**
 * Handler 1: Replace blocker issue
 *
 * Unblocks stalled work by replacing a stuck issue with a fresh one.
 * Creates a new issue with similar context, comments a link explaining the swap.
 *
 * Per D-07, used when a single blocker has been stuck > 14 days.
 * Founder must confirm before execution.
 *
 * @param item Action item with issue_id and company_id
 * @param adapter SDK chokepoint
 * @returns ActionResult with new issue ID and link summary
 */
export const replaceBlockerIssueHandler: ActionHandler = async (item, adapter) => {
  try {
    const issueId = item.target.id;
    const companyId = item.recommended_action.params.company_id;

    if (!issueId) {
      return {
        success: false,
        error: "Action requires target.id (issue_id)",
        summary: "Replace blocker issue failed",
      };
    }

    // Load original issue to copy context
    const originalIssue = await adapter.getIssue(issueId);

    // Create new issue with similar title + updated context
    const newIssueId = await adapter.createIssue(
      companyId,
      `[REDRAFTED] ${originalIssue.title}`,
      `Originally blocked: ${originalIssue.description?.substring(0, 200)}...\n\nRedrafted to unblock progress.`,
      originalIssue.assigneeAgentId
    );

    // Add comment to original linking to replacement
    const linkComment = `
This issue has been replaced with a fresh redraft to unblock progress.

**Original (blocked):** This issue
**Replacement:** Issue #${newIssueId}

The replacement issue has the same context and assignee, but fresh title and description to reset focus.
    `;
    await adapter.addIssueComment(issueId, linkComment);

    return {
      success: true,
      summary: `Issue #${issueId} replaced with Issue #${newIssueId}`,
      result: {
        originalIssueId: issueId,
        newIssueId: newIssueId,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
      summary: "Replace blocker issue failed",
    };
  }
};

/**
 * Handler 2: Reassign issue
 *
 * Unblocks stalled work by transferring to a different agent.
 * Updates issue assignment, adds explanatory comment, queues wakeup for new agent.
 *
 * Per D-07, used when current assignee is unresponsive or lacks capacity.
 * New agent is determined by eligibility screening (from D-09, cascade.ts).
 *
 * @param item Action item with issue_id, new_agent_id, company_id
 * @param adapter SDK chokepoint
 * @returns ActionResult with reassignment summary
 */
export const reassignIssueHandler: ActionHandler = async (item, adapter) => {
  try {
    const issueId = item.target.id;
    const newAgentId = item.recommended_action.params.new_agent_id;
    const companyId = item.recommended_action.params.company_id;

    if (!issueId || !newAgentId) {
      return {
        success: false,
        error: "Action requires target.id (issue_id) and new_agent_id",
        summary: "Reassign issue failed",
      };
    }

    // Update issue assignment
    await adapter.updateIssue(issueId, {
      assigneeAgentId: newAgentId,
    });

    // Add comment explaining reassignment
    const reassignComment = `
This issue has been reassigned to unblock progress.

**New assignee:** Agent ${newAgentId}

This agent has been screened for capacity and expertise. They'll receive a wakeup notification with context about this issue.
    `;
    await adapter.addIssueComment(issueId, reassignComment);

    // Queue wakeup for new agent with idempotency key
    const idempotencyKey = generateReviveActionKey(companyId, item.id, 1);
    await adapter.queueWakeup(
      companyId,
      newAgentId,
      idempotencyKey,
      `Reassigned issue: ${item.title}`
    );

    return {
      success: true,
      summary: `Issue #${issueId} reassigned to agent ${newAgentId}`,
      result: {
        issueId,
        newAgentId,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
      summary: "Reassign issue failed",
    };
  }
};

/**
 * Handler 3: Nudge agent with context doc
 *
 * Unblocks stalled work by providing context to the stuck agent.
 * Writes a documents entry with details about why they're stuck and what unblocks progress.
 * Queues wakeup to notify agent of the context.
 *
 * Per D-07, used when agent is technically capable but lacks situation awareness.
 * Context doc is stored in Paperclip documents table, persistent for future reference.
 *
 * @param item Action item with agent_id, company_id, context_summary
 * @param adapter SDK chokepoint
 * @returns ActionResult with context doc summary
 */
export const nudgeAgentHandler: ActionHandler = async (item, adapter) => {
  try {
    const agentId = item.target.id;
    const companyId = item.recommended_action.params.company_id;
    const contextSummary = item.recommended_action.params.context_summary || item.why_blocking;

    if (!agentId) {
      return {
        success: false,
        error: "Action requires target.id (agent_id)",
        summary: "Nudge agent failed",
      };
    }

    // Write context document
    const docKey = `compass:revive:context:${item.id}`;
    await adapter.writeDocument(companyId, docKey, {
      title: `Context: ${item.title}`,
      body: `# Context for This Work

## Why You're Stuck

${contextSummary}

## What Unblocks Progress

This action provides briefing on the situation. Review the context above, and if you have questions or blockers, reach out to the founder or team lead.

---

*Generated by Compass Revive Mode at ${new Date().toISOString()}*
      `,
      idempotency_key: docKey,
    });

    // Queue wakeup with idempotency key
    const idempotencyKey = generateReviveActionKey(companyId, item.id, 1);
    await adapter.queueWakeup(
      companyId,
      agentId,
      idempotencyKey,
      `Context briefing: ${item.title}`
    );

    return {
      success: true,
      summary: `Agent ${agentId} notified with context briefing and queued for wake`,
      result: {
        agentId,
        contextDocKey: docKey,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
      summary: "Nudge agent failed",
    };
  }
};

/**
 * Handler 4: Pivot to sample
 *
 * Delegates to src/revive/sample-pivot.ts to implement the dual-issue pattern.
 * Reframes an existing draft as "sample for critique" and creates a parallel
 * "production" issue for the improved version after critique.
 *
 * Per D-08, REVIVE-04: sample-pivot is a separate module with its own tests.
 * This handler serves as the registry entry point.
 *
 * @param item Action item with issue_id, company_id
 * @param adapter SDK chokepoint
 * @returns ActionResult from executeSamplePivot
 */
export const pivotToSampleHandler: ActionHandler = async (item, adapter) => {
  try {
    // Delegate to sample-pivot module (same adapter, same action item)
    return await executeSamplePivot(item, adapter);
  } catch (error) {
    return {
      success: false,
      error: String(error),
      summary: "Pivot to sample failed",
    };
  }
};

/**
 * Handler 5: Mark blocker resolved
 *
 * Closes an issue that has been resolved externally or by another agent.
 * Used when a blocker's root cause has been fixed but the issue wasn't closed.
 * Adds explanation comment and closes the issue.
 *
 * Per D-07, used when founder confirms the issue is no longer blocking.
 *
 * @param item Action item with issue_id, company_id, reason
 * @param adapter SDK chokepoint
 * @returns ActionResult with closure summary
 */
export const markResolvedHandler: ActionHandler = async (item, adapter) => {
  try {
    const issueId = item.target.id;
    const companyId = item.recommended_action.params.company_id;
    const reason = item.recommended_action.params.reason || "Blocker has been resolved";

    if (!issueId) {
      return {
        success: false,
        error: "Action requires target.id (issue_id)",
        summary: "Mark resolved failed",
      };
    }

    // Close the issue
    await adapter.closeIssue(issueId, reason);

    return {
      success: true,
      summary: `Issue #${issueId} marked resolved and closed`,
      result: {
        issueId,
        reason,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
      summary: "Mark resolved failed",
    };
  }
};

/**
 * Handler 6: Restart agent (dead agent recovery)
 *
 * Wakes up an agent that has been inactive for 30+ days.
 * Used when an agent needs to be brought back online.
 * Queues a reset wakeup with context about the company's current state.
 *
 * Per D-07, used for dead-agent cause classification (agent.lastHeartbeat > 30 days).
 * Founder confirms before execution (high-impact action).
 *
 * @param item Action item with agent_id, company_id
 * @param adapter SDK chokepoint
 * @returns ActionResult with restart summary
 */
export const restartAgentHandler: ActionHandler = async (item, adapter) => {
  try {
    const agentId = item.target.id;
    const companyId = item.recommended_action.params.company_id;

    if (!agentId) {
      return {
        success: false,
        error: "Action requires target.id (agent_id)",
        summary: "Restart agent failed",
      };
    }

    // Queue wakeup with reset context
    const idempotencyKey = generateReviveActionKey(companyId, item.id, 1);
    await adapter.queueWakeup(
      companyId,
      agentId,
      idempotencyKey,
      `Agent restart: ${item.title}. Check VISION.md and recent issues for current context.`
    );

    return {
      success: true,
      summary: `Agent ${agentId} queued for restart with reset context`,
      result: {
        agentId,
        resetPrompt: "Check VISION.md and recent issues for current context",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
      summary: "Restart agent failed",
    };
  }
};

/**
 * Handler 7: Surface amendment needed (informational)
 *
 * Does not execute any writes. Instead, returns a summary pointing to Assess mode
 * where founder can amend the VISION or strategic direction.
 *
 * Per D-07, used when cause is strategic-drift and the fix requires founder decision,
 * not an automated action. Surfaces the decision point without taking action.
 *
 * @param item Action item (minimal params needed)
 * @param adapter SDK chokepoint (not used for informational action)
 * @returns ActionResult with Assess mode pointer
 */
export const surfaceAmendmentHandler: ActionHandler = async (item, adapter) => {
  // No writes; purely informational
  return {
    success: true,
    summary: `This action requires strategic decision: switch to Assess mode to review and amend VISION.md or relevant section. Compass cannot auto-fix drift — only you can decide the right direction.`,
    result: {
      nextStep: "Switch to Assess mode",
      targetItem: item.target.id,
    },
  };
};

/**
 * Handler registry: maps ActionType to handler implementation.
 * Per D-07: all 7 types are present and callable.
 */
export const handlers: Record<ActionType, ActionHandler> = {
  "replace-blocker-issue": replaceBlockerIssueHandler,
  "reassign-issue": reassignIssueHandler,
  "nudge-agent-with-context-doc": nudgeAgentHandler,
  "pivot-to-sample": pivotToSampleHandler,
  "mark-blocker-resolved": markResolvedHandler,
  "restart-agent": restartAgentHandler,
  "surface-amendment-needed": surfaceAmendmentHandler,
};

/**
 * Execute action by type.
 *
 * Dispatcher function that looks up the handler for a given action type
 * and executes it. Returns ActionResult with success/failure status.
 *
 * Per D-10: each action is independent and can fail individually.
 * Errors are caught and returned as ActionResult (not thrown).
 *
 * @param actionItem The action to execute
 * @param adapter SDK chokepoint
 * @returns ActionResult with status and summary
 */
export async function executeAction(
  actionItem: ActionItem,
  adapter: PaperclipAdapter
): Promise<ActionResult> {
  const handler = handlers[actionItem.recommended_action.type];

  if (!handler) {
    return {
      success: false,
      error: `Unknown action type: ${actionItem.recommended_action.type}`,
      summary: "Action execution failed",
    };
  }

  try {
    return await handler(actionItem, adapter);
  } catch (error) {
    return {
      success: false,
      error: String(error),
      summary: "Action execution failed",
    };
  }
}
