/**
 * Tests for Revive mode action handlers.
 *
 * Per D-07, D-10: Each handler is a typed function that takes an ActionItem
 * and a PaperclipAdapter, executes its specific action type, and returns an ActionResult.
 *
 * Tests cover:
 * 1. All 7 handler types (replace-blocker, reassign, nudge, pivot, mark-resolved, restart, surface-amendment)
 * 2. Error handling (unknown action type, SDK call failures)
 * 3. Idempotency (same action called twice produces consistent results)
 * 4. Integration (handler registry + executeAction dispatcher)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ActionItem, ActionResult } from "../../src/types/revive.js";
import {
  executeAction,
  handlers,
  replaceBlockerIssueHandler,
  reassignIssueHandler,
  nudgeAgentHandler,
  pivotToSampleHandler,
  markResolvedHandler,
  restartAgentHandler,
  surfaceAmendmentHandler,
} from "../../src/revive/actions.js";
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

describe("Revive Mode Action Handlers", () => {
  let mockAdapter: Partial<PaperclipAdapter>;

  beforeEach(() => {
    mockAdapter = createMockAdapter();
    vi.clearAllMocks();
  });

  // ========== HANDLER 1: replace-blocker-issue ==========

  describe("replaceBlockerIssueHandler", () => {
    it("creates new issue and comments link to original", async () => {
      const actionItem: ActionItem = {
        id: "action-1",
        cause: "single-blocker",
        priority: 0.95,
        title: "Replace blocker issue",
        why_blocking: "Issue is stuck for 14 days",
        unblocks_count: 3,
        target: {
          type: "issue",
          id: "issue-123",
          context: "Stuck: no assignee response",
        },
        recommended_action: {
          type: "replace-blocker-issue",
          params: {
            issue_id: "issue-123",
            company_id: "company-123",
          },
        },
        status: "pending",
      };

      const result = await replaceBlockerIssueHandler(actionItem, mockAdapter as PaperclipAdapter);

      expect(result.success).toBe(true);
      expect(result.summary).toContain("replaced");
      expect(mockAdapter.createIssue).toHaveBeenCalled();
      expect(mockAdapter.addIssueComment).toHaveBeenCalled();
    });

    it("returns error if issue_id missing", async () => {
      const actionItem: ActionItem = {
        id: "action-1",
        cause: "single-blocker",
        priority: 0.95,
        title: "Replace blocker issue",
        why_blocking: "Issue is stuck",
        unblocks_count: 3,
        target: {
          type: "issue",
          id: "", // Empty ID
        },
        recommended_action: {
          type: "replace-blocker-issue",
          params: { company_id: "company-123" },
        },
        status: "pending",
      };

      const result = await replaceBlockerIssueHandler(actionItem, mockAdapter as PaperclipAdapter);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ========== HANDLER 2: reassign-issue ==========

  describe("reassignIssueHandler", () => {
    it("updates issue assignment and queues wakeup", async () => {
      const actionItem: ActionItem = {
        id: "action-2",
        cause: "single-blocker",
        priority: 0.85,
        title: "Reassign to different agent",
        why_blocking: "Current assignee unresponsive",
        unblocks_count: 2,
        target: {
          type: "issue",
          id: "issue-456",
          context: "needs new assignee",
        },
        recommended_action: {
          type: "reassign-issue",
          params: {
            issue_id: "issue-456",
            new_agent_id: "agent-ceo-456",
            company_id: "company-123",
          },
        },
        status: "pending",
      };

      const result = await reassignIssueHandler(actionItem, mockAdapter as PaperclipAdapter);

      expect(result.success).toBe(true);
      expect(result.summary).toContain("reassigned");
      expect(mockAdapter.updateIssue).toHaveBeenCalled();
      expect(mockAdapter.queueWakeup).toHaveBeenCalled();
    });

    it("returns error if new_agent_id missing", async () => {
      const actionItem: ActionItem = {
        id: "action-2",
        cause: "single-blocker",
        priority: 0.85,
        title: "Reassign to different agent",
        why_blocking: "Current assignee unresponsive",
        unblocks_count: 2,
        target: {
          type: "issue",
          id: "issue-456",
        },
        recommended_action: {
          type: "reassign-issue",
          params: {
            issue_id: "issue-456",
            company_id: "company-123",
            // Missing new_agent_id
          },
        },
        status: "pending",
      };

      const result = await reassignIssueHandler(actionItem, mockAdapter as PaperclipAdapter);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ========== HANDLER 3: nudge-agent-with-context-doc ==========

  describe("nudgeAgentHandler", () => {
    it("creates context document and queues wakeup", async () => {
      const actionItem: ActionItem = {
        id: "action-3",
        cause: "single-blocker",
        priority: 0.75,
        title: "Nudge agent with context",
        why_blocking: "Agent needs briefing on blocker details",
        unblocks_count: 1,
        target: {
          type: "agent",
          id: "agent-engineer-123",
          context: "Stuck on: external API integration",
        },
        recommended_action: {
          type: "nudge-agent-with-context-doc",
          params: {
            agent_id: "agent-engineer-123",
            company_id: "company-123",
            context_summary: "External API timeout issues blocking deployment",
          },
        },
        status: "pending",
      };

      const result = await nudgeAgentHandler(actionItem, mockAdapter as PaperclipAdapter);

      expect(result.success).toBe(true);
      expect(result.summary).toContain("notified");
      expect(mockAdapter.writeDocument).toHaveBeenCalled();
      expect(mockAdapter.queueWakeup).toHaveBeenCalled();
    });

    it("returns error if agent_id missing", async () => {
      const actionItem: ActionItem = {
        id: "action-3",
        cause: "single-blocker",
        priority: 0.75,
        title: "Nudge agent with context",
        why_blocking: "Agent needs briefing",
        unblocks_count: 1,
        target: {
          type: "agent",
          id: "",
        },
        recommended_action: {
          type: "nudge-agent-with-context-doc",
          params: {
            company_id: "company-123",
            context_summary: "Some context",
          },
        },
        status: "pending",
      };

      const result = await nudgeAgentHandler(actionItem, mockAdapter as PaperclipAdapter);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ========== HANDLER 4: pivot-to-sample ==========

  describe("pivotToSampleHandler", () => {
    it("delegates to sample-pivot module", async () => {
      const actionItem: ActionItem = {
        id: "action-4",
        cause: "strategic-drift",
        priority: 0.9,
        title: "Pivot to sample mode",
        why_blocking: "Work quality needs critique cycle",
        unblocks_count: 5,
        target: {
          type: "issue",
          id: "issue-789",
        },
        recommended_action: {
          type: "pivot-to-sample",
          params: {
            issue_id: "issue-789",
            company_id: "company-123",
          },
        },
        status: "pending",
      };

      const result = await pivotToSampleHandler(actionItem, mockAdapter as PaperclipAdapter);

      // Handler should succeed (delegates to sample-pivot implementation)
      expect(result.summary).toBeDefined();
    });
  });

  // ========== HANDLER 5: mark-blocker-resolved ==========

  describe("markResolvedHandler", () => {
    it("closes issue with explanation comment", async () => {
      const actionItem: ActionItem = {
        id: "action-5",
        cause: "single-blocker",
        priority: 0.8,
        title: "Mark blocker resolved",
        why_blocking: "Issue has been fixed",
        unblocks_count: 2,
        target: {
          type: "issue",
          id: "issue-999",
        },
        recommended_action: {
          type: "mark-blocker-resolved",
          params: {
            issue_id: "issue-999",
            company_id: "company-123",
            reason: "Vendor API restored and tested",
          },
        },
        status: "pending",
      };

      const result = await markResolvedHandler(actionItem, mockAdapter as PaperclipAdapter);

      expect(result.success).toBe(true);
      expect(result.summary).toContain("resolved");
      expect(mockAdapter.closeIssue).toHaveBeenCalled();
    });

    it("returns error if issue_id missing", async () => {
      const actionItem: ActionItem = {
        id: "action-5",
        cause: "single-blocker",
        priority: 0.8,
        title: "Mark blocker resolved",
        why_blocking: "Issue has been fixed",
        unblocks_count: 2,
        target: {
          type: "issue",
          id: "",
        },
        recommended_action: {
          type: "mark-blocker-resolved",
          params: {
            company_id: "company-123",
            reason: "Fixed",
          },
        },
        status: "pending",
      };

      const result = await markResolvedHandler(actionItem, mockAdapter as PaperclipAdapter);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ========== HANDLER 6: restart-agent ==========

  describe("restartAgentHandler", () => {
    it("queues wakeup with reset prompt", async () => {
      const actionItem: ActionItem = {
        id: "action-6",
        cause: "dead-agent",
        priority: 0.95,
        title: "Restart dead agent",
        why_blocking: "Agent last heartbeat 30+ days ago",
        unblocks_count: 3,
        target: {
          type: "agent",
          id: "agent-engineer-456",
          context: "No activity for 30 days",
        },
        recommended_action: {
          type: "restart-agent",
          params: {
            agent_id: "agent-engineer-456",
            company_id: "company-123",
          },
        },
        status: "pending",
      };

      const result = await restartAgentHandler(actionItem, mockAdapter as PaperclipAdapter);

      expect(result.success).toBe(true);
      expect(result.summary).toContain("restart");
      expect(mockAdapter.queueWakeup).toHaveBeenCalled();
    });

    it("returns error if agent_id missing", async () => {
      const actionItem: ActionItem = {
        id: "action-6",
        cause: "dead-agent",
        priority: 0.95,
        title: "Restart dead agent",
        why_blocking: "Agent unresponsive",
        unblocks_count: 3,
        target: {
          type: "agent",
          id: "",
        },
        recommended_action: {
          type: "restart-agent",
          params: {
            company_id: "company-123",
          },
        },
        status: "pending",
      };

      const result = await restartAgentHandler(actionItem, mockAdapter as PaperclipAdapter);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ========== HANDLER 7: surface-amendment-needed ==========

  describe("surfaceAmendmentHandler", () => {
    it("returns informational summary (no writes)", async () => {
      const actionItem: ActionItem = {
        id: "action-7",
        cause: "strategic-drift",
        priority: 0.85,
        title: "Switch to Assess mode",
        why_blocking: "Strategic direction needs review",
        unblocks_count: 0,
        target: {
          type: "vision_section",
          id: "business-model",
        },
        recommended_action: {
          type: "surface-amendment-needed",
          params: {
            company_id: "company-123",
            reason: "Vision section needs amendment",
          },
        },
        status: "pending",
      };

      const result = await surfaceAmendmentHandler(actionItem, mockAdapter as PaperclipAdapter);

      expect(result.success).toBe(true);
      expect(result.summary).toContain("Assess");
      // No SDK calls should be made for informational handler
      expect(mockAdapter.createIssue).not.toHaveBeenCalled();
      expect(mockAdapter.queueWakeup).not.toHaveBeenCalled();
    });
  });

  // ========== INTEGRATION TESTS ==========

  describe("executeAction dispatcher", () => {
    it("looks up handler by action type and executes it", async () => {
      const actionItem: ActionItem = {
        id: "action-1",
        cause: "single-blocker",
        priority: 0.95,
        title: "Replace blocker issue",
        why_blocking: "Issue is stuck",
        unblocks_count: 3,
        target: {
          type: "issue",
          id: "issue-123",
        },
        recommended_action: {
          type: "replace-blocker-issue",
          params: {
            issue_id: "issue-123",
            company_id: "company-123",
          },
        },
        status: "pending",
      };

      const result = await executeAction(actionItem, mockAdapter as PaperclipAdapter);

      expect(result.success).toBe(true);
      expect(result.summary).toBeDefined();
    });

    it("returns error for unknown action type", async () => {
      const actionItem: ActionItem = {
        id: "action-unknown",
        cause: "single-blocker",
        priority: 0.5,
        title: "Unknown action",
        why_blocking: "Testing unknown action",
        unblocks_count: 0,
        target: {
          type: "issue",
          id: "issue-123",
        },
        recommended_action: {
          type: "unknown-action" as any,
          params: {},
        },
        status: "pending",
      };

      const result = await executeAction(actionItem, mockAdapter as PaperclipAdapter);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown action type");
    });

    it("catches handler errors and returns ActionResult with error", async () => {
      const mockAdapterWithError = {
        createIssue: vi.fn(async () => {
          throw new Error("SDK call failed");
        }),
        getIssue: vi.fn(async () => ({
          id: "issue-123",
          title: "Issue",
          description: "Desc",
          status: "draft",
          assigneeAgentId: "agent-123",
          companyId: "company-123",
        })),
        addIssueComment: vi.fn(async () => {
          throw new Error("Comment failed");
        }),
      };

      const actionItem: ActionItem = {
        id: "action-fail",
        cause: "single-blocker",
        priority: 0.5,
        title: "Action that will fail",
        why_blocking: "Testing error handling",
        unblocks_count: 0,
        target: {
          type: "issue",
          id: "issue-123",
        },
        recommended_action: {
          type: "replace-blocker-issue",
          params: {
            issue_id: "issue-123",
            company_id: "company-123",
          },
        },
        status: "pending",
      };

      const result = await executeAction(actionItem, mockAdapterWithError as any);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ========== HANDLER REGISTRY TESTS ==========

  describe("handlers registry", () => {
    it("has all 7 handler types", () => {
      const expectedTypes = [
        "replace-blocker-issue",
        "reassign-issue",
        "nudge-agent-with-context-doc",
        "pivot-to-sample",
        "mark-blocker-resolved",
        "restart-agent",
        "surface-amendment-needed",
      ];

      for (const type of expectedTypes) {
        expect(handlers[type as any]).toBeDefined();
        expect(typeof handlers[type as any]).toBe("function");
      }
    });

    it("has correct handler count (7 types)", () => {
      const handlerCount = Object.keys(handlers).length;
      expect(handlerCount).toBe(7);
    });
  });

  // ========== IDEMPOTENCY TESTS ==========

  describe("idempotency", () => {
    it("same action called twice produces consistent results", async () => {
      const actionItem: ActionItem = {
        id: "action-idempotent",
        cause: "single-blocker",
        priority: 0.8,
        title: "Test idempotency",
        why_blocking: "Testing idempotent behavior",
        unblocks_count: 1,
        target: {
          type: "issue",
          id: "issue-123",
        },
        recommended_action: {
          type: "mark-blocker-resolved",
          params: {
            issue_id: "issue-123",
            company_id: "company-123",
            reason: "Fixed",
          },
        },
        status: "pending",
      };

      const result1 = await markResolvedHandler(actionItem, mockAdapter as PaperclipAdapter);
      const result2 = await markResolvedHandler(actionItem, mockAdapter as PaperclipAdapter);

      // Both calls should succeed with same outcome
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.summary).toBe(result2.summary);
    });
  });
});
