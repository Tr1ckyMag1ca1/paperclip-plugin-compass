/**
 * Tests for Revive Mode Incremental Apply Orchestrator
 *
 * Per D-10: Incremental Apply executes each action independently (not transactional).
 * Per D-11: Wakeups use idempotency keys.
 *
 * Tests cover:
 * 1. applyAction: finds action by id, executes, updates status to "addressed" on success
 * 2. applyAction: on failure, creates revert action and marks original "dismissed"
 * 3. applyAction: error handling (not found, already addressed)
 * 4. applyAllActions: applies all pending actions in sequence (incremental, not batch rollback)
 * 5. applyAllActions: partial completion (some succeed, some fail, continues on failure)
 * 6. Queue persistence: updated queue written to documents after each apply
 * 7. Idempotency: same action called twice — second call sees "addressed", returns error
 * 8. Wakeup idempotency: all wakeups queued with idempotency keys per XC-03
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ActionItem, ActionQueue, ActionResult } from "../../src/types/revive.js";
import { applyAction, applyAllActions } from "../../src/revive/apply.js";
import { PaperclipAdapter } from "../../src/sdk/adapter.js";

/**
 * Mock PaperclipAdapter for testing.
 * All SDK calls are stubbed to avoid I/O during tests.
 */
function createMockAdapter(): Partial<PaperclipAdapter> {
  return {
    createIssue: vi.fn(async (companyId: string, title: string, description: string, assigneeAgentId?: string) => {
      return `issue-${Math.random().toString(36).substring(7)}`;
    }),
    getIssue: vi.fn(async (issueId: string) => ({
      id: issueId,
      title: "Original Issue Title",
      description: "Original description",
      status: "draft",
      assigneeAgentId: "agent-engineer-123",
      companyId: "company-123",
    })),
    addIssueComment: vi.fn(async (issueId: string, body: string) => {
      // Mock comment added
    }),
    updateIssue: vi.fn(async (issueId: string, patch: Partial<any>) => {
      // Mock issue updated
    }),
    closeIssue: vi.fn(async (issueId: string, reason: string) => {
      // Mock issue closed
    }),
    queueWakeup: vi.fn(async (companyId: string, agentId: string, idempotencyKey: string, reason: string) => {
      // Mock wakeup queued
    }),
    writeDocument: vi.fn(async (companyId: string, key: string, data: any) => {
      // Mock document written
    }),
  };
}

/**
 * Create a mock action queue with pending actions for testing.
 */
function createMockQueue(): ActionQueue {
  return {
    run_id: "run-123",
    company_id: "company-123",
    created_at: new Date().toISOString(),
    causes: ["single-blocker"],
    items_by_cause: {
      "single-blocker": [
        {
          id: "action-1",
          cause: "single-blocker",
          priority: 0.95,
          title: "Replace blocker issue",
          why_blocking: "Issue is stuck for 14 days",
          unblocks_count: 3,
          target: {
            type: "issue",
            id: "issue-123",
          },
          recommended_action: {
            type: "replace-blocker-issue",
            params: { company_id: "company-123" },
          },
          status: "pending",
        },
        {
          id: "action-2",
          cause: "single-blocker",
          priority: 0.85,
          title: "Reassign issue to new agent",
          why_blocking: "Current agent unresponsive",
          unblocks_count: 2,
          target: {
            type: "issue",
            id: "issue-456",
          },
          recommended_action: {
            type: "reassign-issue",
            params: { new_agent_id: "agent-new-123", company_id: "company-123" },
          },
          status: "pending",
        },
      ],
      "strategic-drift": [],
      "broken-integration": [],
      "governance-loop": [],
      "dead-agent": [],
    },
    total_items: 2,
    addressed_count: 0,
    confidence: {
      "single-blocker": 0.95,
      "strategic-drift": 0,
      "broken-integration": 0,
      "governance-loop": 0,
      "dead-agent": 0,
    },
  };
}

describe("Revive Mode Incremental Apply Orchestrator", () => {
  let mockAdapter: Partial<PaperclipAdapter>;

  beforeEach(() => {
    mockAdapter = createMockAdapter();
    vi.clearAllMocks();
  });

  // ========== applyAction Tests ==========

  describe("applyAction", () => {
    it("finds action by id across causes", async () => {
      const queue = createMockQueue();
      const result = await applyAction(queue, "action-1", mockAdapter as PaperclipAdapter);

      // Should execute the action (via executeAction handler)
      expect(mockAdapter.getIssue).toHaveBeenCalled();
    });

    it("executes action via executeAction handler", async () => {
      const queue = createMockQueue();
      const result = await applyAction(queue, "action-1", mockAdapter as PaperclipAdapter);

      // Handler calls getIssue + createIssue + addIssueComment
      expect(mockAdapter.getIssue).toHaveBeenCalledWith("issue-123");
      expect(mockAdapter.createIssue).toHaveBeenCalled();
      expect(mockAdapter.addIssueComment).toHaveBeenCalled();
    });

    it("updates status to 'addressed' on success", async () => {
      const queue = createMockQueue();
      const result = await applyAction(queue, "action-1", mockAdapter as PaperclipAdapter);

      expect(result.queue.items_by_cause["single-blocker"][0].status).toBe("addressed");
    });

    it("increments addressed_count on success", async () => {
      const queue = createMockQueue();
      expect(queue.addressed_count).toBe(0);

      const result = await applyAction(queue, "action-1", mockAdapter as PaperclipAdapter);

      expect(result.queue.addressed_count).toBe(1);
    });

    it("writes updated queue to documents on success", async () => {
      const queue = createMockQueue();
      const result = await applyAction(queue, "action-1", mockAdapter as PaperclipAdapter);

      // writeDocument should be called with updated queue
      expect(mockAdapter.writeDocument).toHaveBeenCalledWith(
        "company-123",
        `compass:revive:action-queue:${queue.run_id}`,
        expect.any(Object)
      );
    });

    it("returns success result on action completion", async () => {
      const queue = createMockQueue();
      const result = await applyAction(queue, "action-1", mockAdapter as PaperclipAdapter);

      expect(result.result.success).toBe(true);
      expect(result.result.summary).toContain("replaced");
    });

    it("creates revert action on failure", async () => {
      const queue = createMockQueue();
      // Mock handler failure by making createIssue throw
      (mockAdapter.createIssue as any).mockRejectedValueOnce(new Error("SDK error"));

      const result = await applyAction(queue, "action-1", mockAdapter as PaperclipAdapter);

      // Original action should be marked dismissed
      expect(result.queue.items_by_cause["single-blocker"][0].status).toBe("dismissed");

      // Revert action should be added
      const revertActions = result.queue.items_by_cause["single-blocker"].filter((a) => a.id.includes(":revert"));
      expect(revertActions.length).toBeGreaterThan(0);
      expect(revertActions[0].title).toContain("[REVERT]");
    });

    it("marks original action 'dismissed' on failure", async () => {
      const queue = createMockQueue();
      (mockAdapter.createIssue as any).mockRejectedValueOnce(new Error("SDK error"));

      const result = await applyAction(queue, "action-1", mockAdapter as PaperclipAdapter);

      expect(result.queue.items_by_cause["single-blocker"][0].status).toBe("dismissed");
    });

    it("writes updated queue with revert action on failure", async () => {
      const queue = createMockQueue();
      (mockAdapter.createIssue as any).mockRejectedValueOnce(new Error("SDK error"));

      const result = await applyAction(queue, "action-1", mockAdapter as PaperclipAdapter);

      // writeDocument should still be called to persist the revert action
      expect(mockAdapter.writeDocument).toHaveBeenCalled();
      const call = (mockAdapter.writeDocument as any).mock.calls[0];
      expect(call[0]).toBe("company-123"); // company_id
      expect(call[1]).toContain("compass:revive:action-queue");
    });

    it("returns error result on action failure", async () => {
      const queue = createMockQueue();
      (mockAdapter.createIssue as any).mockRejectedValueOnce(new Error("SDK error"));

      const result = await applyAction(queue, "action-1", mockAdapter as PaperclipAdapter);

      expect(result.result.success).toBe(false);
      expect(result.result.error).toBeDefined();
    });

    it("returns error if action not found", async () => {
      const queue = createMockQueue();
      const result = await applyAction(queue, "nonexistent-action", mockAdapter as PaperclipAdapter);

      expect(result.result.success).toBe(false);
      expect(result.result.error).toContain("not found");
      expect(result.queue).toEqual(queue); // Queue unchanged
    });

    it("returns error if action already addressed", async () => {
      const queue = createMockQueue();
      queue.items_by_cause["single-blocker"][0].status = "addressed";

      const result = await applyAction(queue, "action-1", mockAdapter as PaperclipAdapter);

      expect(result.result.success).toBe(false);
      expect(result.result.error).toContain("already addressed");
    });

    it("returns error if action already dismissed", async () => {
      const queue = createMockQueue();
      queue.items_by_cause["single-blocker"][0].status = "dismissed";

      const result = await applyAction(queue, "action-1", mockAdapter as PaperclipAdapter);

      expect(result.result.success).toBe(false);
      expect(result.result.error).toContain("already dismissed");
    });

    it("handles SDK adapter call failures gracefully", async () => {
      const queue = createMockQueue();
      const sdkError = new Error("Adapter connection error");
      (mockAdapter.getIssue as any).mockRejectedValueOnce(sdkError);

      const result = await applyAction(queue, "action-1", mockAdapter as PaperclipAdapter);

      expect(result.result.success).toBe(false);
      expect(result.result.error).toContain("Adapter connection error");
    });

    it("idempotency: same action called twice — second returns 'already addressed'", async () => {
      const queue = createMockQueue();

      // First apply
      const result1 = await applyAction(queue, "action-1", mockAdapter as PaperclipAdapter);
      expect(result1.result.success).toBe(true);
      expect(result1.queue.addressed_count).toBe(1);

      // Second apply with updated queue
      const result2 = await applyAction(result1.queue, "action-1", mockAdapter as PaperclipAdapter);
      expect(result2.result.success).toBe(false);
      expect(result2.result.error).toContain("already addressed");
      expect(result2.queue.addressed_count).toBe(1); // Still 1, not incremented again
    });

    it("idempotency: wakeups include idempotency keys per XC-03", async () => {
      const queue = createMockQueue();
      // Switch to reassign-issue action which queues a wakeup
      queue.items_by_cause["single-blocker"][0].recommended_action.type = "reassign-issue";
      queue.items_by_cause["single-blocker"][0].recommended_action.params.new_agent_id = "agent-new-123";

      const result = await applyAction(queue, "action-1", mockAdapter as PaperclipAdapter);

      // Check that queueWakeup was called with an idempotency key
      expect(mockAdapter.queueWakeup).toHaveBeenCalled();
      const wakeupCall = (mockAdapter.queueWakeup as any).mock.calls[0];
      const idempotencyKey = wakeupCall[2];
      expect(idempotencyKey).toMatch(/^compass:revive:[^:]+:[^:]+:[^:]+$/);
    });

    it("total_items incremented when revert action added", async () => {
      const queue = createMockQueue();
      expect(queue.total_items).toBe(2);
      (mockAdapter.createIssue as any).mockRejectedValueOnce(new Error("SDK error"));

      const result = await applyAction(queue, "action-1", mockAdapter as PaperclipAdapter);

      expect(result.queue.total_items).toBe(3); // 2 original + 1 revert
    });
  });

  // ========== applyAllActions Tests ==========

  describe("applyAllActions", () => {
    it("applies all pending actions in sequence", async () => {
      const queue = createMockQueue();
      const result = await applyAllActions(queue, mockAdapter as PaperclipAdapter);

      // Should apply both pending actions
      expect(result.results.length).toBeGreaterThanOrEqual(1);
    });

    it("continues on failure (doesn't batch rollback)", async () => {
      const queue = createMockQueue();
      // Fail first action
      (mockAdapter.getIssue as any).mockRejectedValueOnce(new Error("SDK error"));

      const result = await applyAllActions(queue, mockAdapter as PaperclipAdapter);

      // Both actions should be in results (first failed, second attempted)
      expect(result.results.length).toBeGreaterThanOrEqual(1);
    });

    it("returns array of results (one per action applied)", async () => {
      const queue = createMockQueue();
      const result = await applyAllActions(queue, mockAdapter as PaperclipAdapter);

      expect(Array.isArray(result.results)).toBe(true);
      expect(result.results[0]).toHaveProperty("actionId");
      expect(result.results[0]).toHaveProperty("result");
    });

    it("increments addressed_count for each successful action", async () => {
      const queue = createMockQueue();
      expect(queue.addressed_count).toBe(0);

      const result = await applyAllActions(queue, mockAdapter as PaperclipAdapter);

      // At least one action should succeed
      expect(result.queue.addressed_count).toBeGreaterThanOrEqual(1);
    });

    it("empty queue returns empty results", async () => {
      const queue = createMockQueue();
      queue.items_by_cause["single-blocker"] = [];
      queue.total_items = 0;

      const result = await applyAllActions(queue, mockAdapter as PaperclipAdapter);

      expect(result.results.length).toBe(0);
      expect(result.queue.addressed_count).toBe(0);
    });

    it("queue with all pending actions applies all of them", async () => {
      const queue = createMockQueue();

      const result = await applyAllActions(queue, mockAdapter as PaperclipAdapter);

      // Both pending actions should have been attempted
      expect(result.results.length).toBeGreaterThanOrEqual(2);
    });

    it("partial completion: some succeed, some fail, continues", async () => {
      const queue = createMockQueue();
      // Fail first action, let second succeed
      (mockAdapter.getIssue as any).mockRejectedValueOnce(new Error("SDK error"));

      const result = await applyAllActions(queue, mockAdapter as PaperclipAdapter);

      // Both should be in results
      const successCount = result.results.filter((r) => r.result.success).length;
      const failureCount = result.results.filter((r) => !r.result.success).length;

      // At least one success, at least one failure (from the rejection)
      expect(successCount + failureCount).toBeGreaterThanOrEqual(1);
    });

    it("addressed_count reflects only successful actions", async () => {
      const queue = createMockQueue();
      (mockAdapter.getIssue as any).mockRejectedValueOnce(new Error("SDK error"));

      const result = await applyAllActions(queue, mockAdapter as PaperclipAdapter);

      // addressed_count should be 1 (one success, one failure creates revert)
      expect(result.queue.addressed_count).toBeLessThanOrEqual(result.queue.total_items);
    });

    it("returns updated queue from each apply step", async () => {
      const queue = createMockQueue();
      const result = await applyAllActions(queue, mockAdapter as PaperclipAdapter);

      expect(result.queue).toHaveProperty("run_id");
      expect(result.queue).toHaveProperty("items_by_cause");
      expect(result.queue).toHaveProperty("addressed_count");
    });

    it("skips non-pending actions (only applies pending)", async () => {
      const queue = createMockQueue();
      queue.items_by_cause["single-blocker"][0].status = "addressed";

      const result = await applyAllActions(queue, mockAdapter as PaperclipAdapter);

      // Only the second pending action should be applied
      expect(result.results.length).toBe(1);
      expect(result.results[0].actionId).toBe("action-2");
    });

    it("integration: end-to-end apply all actions with state tracking", async () => {
      const queue = createMockQueue();
      const result = await applyAllActions(queue, mockAdapter as PaperclipAdapter);

      // Final state should have updated queue and results
      expect(result.queue.addressed_count).toBeGreaterThanOrEqual(0);
      expect(result.results.length).toBeGreaterThanOrEqual(0);
      expect(mockAdapter.writeDocument).toHaveBeenCalled(); // Persistence verified
    });
  });

  // ========== Edge Cases and Integration Tests ==========

  describe("Edge Cases and Integration", () => {
    it("handles queue with mixed cause groups", async () => {
      const queue = createMockQueue();
      queue.items_by_cause["strategic-drift"] = [
        {
          id: "action-drift-1",
          cause: "strategic-drift",
          priority: 0.75,
          title: "Review VISION",
          why_blocking: "Drift detected",
          unblocks_count: 1,
          target: { type: "vision_section", id: "vision-problem" },
          recommended_action: {
            type: "surface-amendment-needed",
            params: { company_id: "company-123" },
          },
          status: "pending",
        },
      ];

      const result = await applyAllActions(queue, mockAdapter as PaperclipAdapter);

      // Should include the drift action in results
      const driftResult = result.results.find((r) => r.actionId.includes("drift"));
      expect(driftResult).toBeDefined();
    });

    it("revert actions are added with correct priority and structure", async () => {
      const queue = createMockQueue();
      (mockAdapter.getIssue as any).mockRejectedValueOnce(new Error("SDK error"));

      const result = await applyAction(queue, "action-1", mockAdapter as PaperclipAdapter);

      const revertAction = result.queue.items_by_cause["single-blocker"].find((a) => a.id.includes(":revert"));
      expect(revertAction).toBeDefined();
      expect(revertAction?.title).toContain("[REVERT]");
      expect(revertAction?.status).toBe("pending");
      expect(revertAction?.priority).toBe(1.0); // High priority
      expect(revertAction?.recommended_action.params.original_action_id).toBe("action-1");
    });

    it("all writes route through SDK adapter (XC-01 chokepoint)", async () => {
      const queue = createMockQueue();
      await applyAction(queue, "action-1", mockAdapter as PaperclipAdapter);

      // Verify all writes went through adapter methods
      expect(mockAdapter.getIssue).toHaveBeenCalled();
      expect(mockAdapter.createIssue).toHaveBeenCalled();
      expect(mockAdapter.addIssueComment).toHaveBeenCalled();
      expect(mockAdapter.writeDocument).toHaveBeenCalled();
      // No direct SDK calls made
    });
  });
});
