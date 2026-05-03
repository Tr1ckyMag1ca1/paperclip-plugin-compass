/**
 * Revive Mode Incremental Apply Orchestrator
 *
 * Per D-10: Incremental Apply executes each action independently (not transactional).
 * Per D-11: All wakeups use idempotency keys (XC-03).
 *
 * This module provides:
 * 1. applyAction(queue, actionId, adapter) — executes a single action, updates status in queue
 * 2. applyAllActions(queue, adapter) — applies all pending actions in sequence (not batch)
 *
 * Key Design Decisions:
 * - Each action has its own per-item confirmation (lighter than Phase 2/3 two-stage gate)
 * - On failure, a compensating-revert action is added to queue (founder can undo)
 * - Action status updates (pending → addressed/dismissed) written back to queue document
 * - Failures are isolated; one action failure does not block other pending actions
 * - No bulk rollback; incremental progress is the philosophy per D-10
 *
 * Contrast with Phase 2/3 (Found/Assess):
 * - Phase 2/3: Two-stage approval gate → batch transactional apply (all-or-nothing writes)
 * - Phase 4 (Revive): Per-item confirmation → incremental apply (individual actions, partial completion OK)
 */

import type { ActionItem, ActionQueue, ActionResult } from "../types/revive.js";
import { PaperclipAdapter } from "../sdk/adapter.js";
import { executeAction } from "./actions.js";
import { writeActionQueueDocument } from "./queue.js";

/**
 * Apply a single action from the queue.
 *
 * Per D-10: incremental apply — each action executed independently.
 * Per D-11: wakeups use idempotency keys.
 *
 * Steps:
 * 1. Find action by id in queue (across all cause groups)
 * 2. Validate action is "pending" (not already addressed/dismissed)
 * 3. Execute action via executeAction handler
 * 4. On success: update status to "addressed", increment addressed_count
 * 5. On failure: add compensating-revert action to queue, mark original "dismissed"
 * 6. Write updated queue back to documents (per D-04)
 *
 * @param queue Current action queue
 * @param actionId ID of action to apply
 * @param adapter SDK adapter for all writes
 * @returns Object { queue: updated ActionQueue, result: ActionResult from handler }
 */
export async function applyAction(
  queue: ActionQueue,
  actionId: string,
  adapter: PaperclipAdapter
): Promise<{ queue: ActionQueue; result: ActionResult }> {
  // Find action in queue across all causes
  let actionItem: ActionItem | undefined;
  let causeKey: string | undefined;

  for (const cause in queue.items_by_cause) {
    const item = queue.items_by_cause[cause as keyof typeof queue.items_by_cause]?.find(
      (a) => a.id === actionId
    );
    if (item) {
      actionItem = item;
      causeKey = cause;
      break;
    }
  }

  // Action not found
  if (!actionItem || !causeKey) {
    return {
      queue,
      result: {
        success: false,
        error: `Action ${actionId} not found in queue`,
        summary: "Action not found",
      },
    };
  }

  // Action already addressed or dismissed
  if (actionItem.status !== "pending") {
    return {
      queue,
      result: {
        success: false,
        error: `Action already ${actionItem.status}`,
        summary: `Action already ${actionItem.status}`,
      },
    };
  }

  try {
    // Execute action via handler (per D-07 handler registry)
    const result = await executeAction(actionItem, adapter);

    if (result.success) {
      // SUCCESS: Update status and queue
      actionItem.status = "addressed";
      queue.addressed_count += 1;

      // Write updated queue to documents (per D-04)
      await writeActionQueueDocument(adapter, queue.company_id, queue);

      return { queue, result };
    } else {
      // FAILURE: Add compensating-revert action to queue for founder undo
      const revertAction: ActionItem = {
        id: `${actionId}:revert`,
        cause: actionItem.cause,
        priority: 1.0, // High priority: undo is urgent
        title: `[REVERT] ${actionItem.title}`,
        why_blocking: `Undo failed action: ${result.error || "unknown error"}`,
        unblocks_count: 0,
        target: actionItem.target,
        recommended_action: {
          type: "surface-amendment-needed", // Placeholder; can be "undo-writes" if needed
          params: {
            original_action_id: actionId,
            error: result.error,
          },
        },
        status: "pending",
        dismissal_reason: "Created as revert for failed action",
      };

      // Add revert to appropriate cause group
      if (!queue.items_by_cause[actionItem.cause]) {
        queue.items_by_cause[actionItem.cause] = [];
      }
      queue.items_by_cause[actionItem.cause]!.push(revertAction);
      queue.total_items += 1;

      // Mark original as dismissed (failed)
      actionItem.status = "dismissed";

      // Write updated queue with revert action
      await writeActionQueueDocument(adapter, queue.company_id, queue);

      return { queue, result };
    }
  } catch (error) {
    // UNEXPECTED ERROR: Add revert action and mark original dismissed
    const revertAction: ActionItem = {
      id: `${actionId}:revert`,
      cause: actionItem.cause,
      priority: 1.0,
      title: `[REVERT] ${actionItem.title}`,
      why_blocking: `Undo failed action: ${String(error)}`,
      unblocks_count: 0,
      target: actionItem.target,
      recommended_action: {
        type: "surface-amendment-needed",
        params: {
          original_action_id: actionId,
          error: String(error),
        },
      },
      status: "pending",
      dismissal_reason: "Created as revert for thrown error",
    };

    if (!queue.items_by_cause[actionItem.cause]) {
      queue.items_by_cause[actionItem.cause] = [];
    }
    queue.items_by_cause[actionItem.cause]!.push(revertAction);
    queue.total_items += 1;

    actionItem.status = "dismissed";

    // Write updated queue
    await writeActionQueueDocument(adapter, queue.company_id, queue);

    return {
      queue,
      result: {
        success: false,
        error: String(error),
        summary: "Action execution threw error",
      },
    };
  }
}

/**
 * Apply all pending actions in sequence (incremental, NOT transactional).
 *
 * Per D-10: founder can execute recommended unblocks incrementally.
 * Each action result tracked; failures don't block others.
 *
 * Iterates over queue items by cause, calling applyAction for each pending item.
 * Updates queue for next iteration (so addressed items stay addressed).
 *
 * @param queue Current action queue
 * @param adapter SDK adapter for all writes
 * @returns Object { queue: final ActionQueue, results: array of { actionId, result } }
 */
export async function applyAllActions(
  queue: ActionQueue,
  adapter: PaperclipAdapter
): Promise<{
  queue: ActionQueue;
  results: Array<{ actionId: string; result: ActionResult }>;
}> {
  const results: Array<{ actionId: string; result: ActionResult }> = [];

  // Iterate over all causes and all actions
  for (const cause in queue.items_by_cause) {
    for (const action of queue.items_by_cause[cause as keyof typeof queue.items_by_cause] || []) {
      // Only apply pending actions
      if (action.status === "pending") {
        // Apply this action with updated queue from previous iteration
        const { queue: updatedQueue, result } = await applyAction(queue, action.id, adapter);
        queue = updatedQueue; // Update queue for next iteration

        // Track this result
        results.push({ actionId: action.id, result });
      }
    }
  }

  return { queue, results };
}
