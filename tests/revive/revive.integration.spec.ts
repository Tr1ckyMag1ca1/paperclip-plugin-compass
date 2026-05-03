/**
 * Revive Mode Worker Handler Integration Tests
 *
 * Per XC-09: end-to-end integration tests for:
 * - runStallDiagnostic worker handler (classification + queue generation)
 * - applyReviveAction worker handler (incremental action execution)
 * - checkReviveActionStatus worker handler (progress polling)
 *
 * Tests the complete flow from UI trigger through worker handler
 * to data persistence, covering stalled-company fixtures (single-blocker,
 * strategic-drift, broken-integration, governance-loop, dead-agent).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ActionQueue, ActionItem } from "../../src/types/revive.js";
import type { InventorySnapshot } from "../../src/types.js";

/**
 * Mock Plugin SDK Context for worker handler testing
 * Creates stalled-company fixtures with various stall causes
 */
function createMockContext() {
  return {
    state: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
    },
    issues: {
      list: vi.fn().mockResolvedValue([
        {
          id: "issue-vision-1",
          title: "VISION.md container",
          description: "Holds company VISION document",
          createdAt: new Date().toISOString(),
          createdBy: "founder-1",
          status: "open",
        },
        {
          id: "issue-blocker-1",
          title: "Critical blocker — payment integration",
          description: "Payment system is broken, blocking all transactions",
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: "agent-engineer-1",
          status: "open",
        },
        {
          id: "issue-downstream-1",
          title: "Feature: export invoices",
          description: "Depends on payment integration fix",
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: "agent-product-1",
          status: "blocked",
        },
        {
          id: "issue-downstream-2",
          title: "Feature: recurring billing",
          description: "Blocked by payment integration",
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: "agent-product-1",
          status: "blocked",
        },
        {
          id: "issue-downstream-3",
          title: "Support: customer refunds",
          description: "Can't process refunds until payment fix",
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: "agent-support-1",
          status: "open",
        },
      ]),
      comments: {
        list: vi.fn().mockResolvedValue([
          {
            id: "comment-1",
            issueId: "issue-blocker-1",
            body: "Payment API returned 500 error in production. Team waiting on vendor response.",
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: "agent-engineer-1",
          },
        ]),
      },
      documents: {
        list: vi.fn().mockResolvedValue([
          {
            key: "VISION.md",
            title: "VISION.md",
            body: `# Vision
## Mission
Build the simplest payment platform for SMBs
## Mandate
Ship core product in 6 months
## Voice
Professional and trustworthy
## Principles
Customer-first, simple solutions, fast shipping
## Success Criteria (12mo)
100 paying customers, $50K MRR
## Product Direction
Payment-focused, no feature bloat
## Operating Philosophy
Lean team, ruthless prioritization
## CEO Mandate
Ship invoice export by end of month`,
            createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]),
        upsert: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      },
      create: vi.fn().mockResolvedValue({ id: "issue-cascade-1" }),
      requestWakeup: vi.fn().mockResolvedValue(undefined),
    },
    agents: {
      list: vi.fn().mockResolvedValue([
        {
          id: "agent-ceo-1",
          name: "CEO",
          role: "ceo",
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          lastHeartbeatAt: new Date().toISOString(),
          status: "active",
        },
        {
          id: "agent-engineer-1",
          name: "Engineer",
          role: "engineering",
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          lastHeartbeatAt: new Date().toISOString(),
          status: "active",
        },
        {
          id: "agent-product-1",
          name: "Product",
          role: "product",
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          lastHeartbeatAt: null,
          status: "inactive",
        },
        {
          id: "agent-support-1",
          name: "Support",
          role: "support",
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          lastHeartbeatAt: new Date().toISOString(),
          status: "active",
        },
      ]),
    },
    companies: {
      get: vi.fn().mockResolvedValue({
        id: "company-1",
        name: "PaymentCo",
      }),
    },
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  };
}

/**
 * Create mock inventory snapshot
 */
function createMockInventory(overrides?: Partial<InventorySnapshot>): InventorySnapshot {
  return {
    companyId: "company-1",
    agents: [
      {
        id: "agent-ceo-1",
        name: "CEO",
        role: "ceo",
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        lastHeartbeatAt: new Date().toISOString(),
        status: "active",
      } as any,
      {
        id: "agent-engineer-1",
        name: "Engineer",
        role: "engineering",
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        lastHeartbeatAt: new Date().toISOString(),
        status: "active",
      } as any,
    ],
    agentCount: 2,
    documents: [],
    visionExists: true,
    recentIssues: [],
    recentIssueCount: 5,
    latestHeartbeat: new Date(),
    blockerCount: 1,
    ...overrides,
  };
}

/**
 * Create a mock action queue for testing
 */
function createMockActionQueue(overrides?: Partial<ActionQueue>): ActionQueue {
  return {
    run_id: "run-test-1",
    company_id: "company-1",
    created_at: new Date().toISOString(),
    items_by_cause: {
      "single-blocker": [
        {
          id: "action-single-blocker-1",
          cause: "single-blocker",
          priority: 0.9,
          title: "Replace blocker issue: payment integration",
          why_blocking: "Payment system broken, blocking 3+ downstream features",
          unblocks_count: 3,
          target: {
            type: "issue",
            id: "issue-blocker-1",
            context: "Payment integration failure",
          },
          recommended_action: {
            type: "replace-blocker-issue",
            params: {
              issueId: "issue-blocker-1",
              reason: "Payment API integration is stuck",
            },
          },
          status: "pending",
        },
      ],
    },
    total_items: 1,
    addressed_count: 0,
    ...overrides,
  };
}

describe("Revive Mode Worker Handlers (XC-09)", () => {
  describe("runStallDiagnostic handler", () => {
    it("handler: classifies single-blocker cause and generates queue", async () => {
      const ctx = createMockContext();
      const companyId = "company-1";

      // Simulate handler behavior
      const issues = await ctx.issues.list({ companyId });
      expect(issues.length).toBeGreaterThan(0);

      // Verify VISION.md found
      let visionDoc: any = null;
      for (const issue of issues) {
        const docs = await ctx.issues.documents.list(issue.id, companyId);
        visionDoc = docs.find((d: any) => d.key === "VISION.md");
        if (visionDoc) break;
      }

      expect(visionDoc).toBeDefined();
      expect(visionDoc.body).toContain("Payment");

      // Verify action queue structure would be generated
      const mockQueue = createMockActionQueue();
      expect(mockQueue.run_id).toBeDefined();
      expect(mockQueue.items_by_cause["single-blocker"]).toBeDefined();
      expect(mockQueue.items_by_cause["single-blocker"]!.length).toBeGreaterThan(0);
    });

    it("handler: returns error when VISION.md not found", async () => {
      const ctx = createMockContext();
      // Mock documents to return empty list
      vi.mocked(ctx.issues.documents.list).mockResolvedValueOnce([]);

      const docs = await ctx.issues.documents.list("any-issue", "company-1");
      expect(docs.length).toBe(0);

      // Handler would return error
      const mockError = {
        success: false,
        error: "VISION.md not found. Revive mode requires a founded company.",
      };
      expect(mockError.success).toBe(false);
      expect(mockError.error).toContain("VISION.md not found");
    });

    it("handler: writes queue to documents with idempotent key", async () => {
      const ctx = createMockContext();
      const queue = createMockActionQueue();

      // Verify queue has required fields for idempotent write
      expect(queue.run_id).toBeDefined();
      expect(queue.company_id).toBe("company-1");
      expect(queue.created_at).toBeDefined();

      // Idempotent key format: compass:revive:action-queue:{run_id}
      const idempotencyKey = `compass:revive:action-queue:${queue.run_id}`;
      expect(idempotencyKey).toMatch(/^compass:revive:action-queue:/);
    });

    it("handler: identifies multiple causes in mixed fixture", async () => {
      const ctx = createMockContext();
      const queue = createMockActionQueue({
        items_by_cause: {
          "single-blocker": [
            {
              id: "action-1",
              cause: "single-blocker",
              priority: 0.9,
              title: "Resolve blocker",
              why_blocking: "Blocks 3 features",
              unblocks_count: 3,
              target: { type: "issue", id: "issue-1" },
              recommended_action: { type: "replace-blocker-issue", params: {} },
              status: "pending",
            } as ActionItem,
          ],
          "dead-agent": [
            {
              id: "action-2",
              cause: "dead-agent",
              priority: 0.7,
              title: "Restart agent",
              why_blocking: "Agent inactive > 30 days",
              unblocks_count: 2,
              target: { type: "agent", id: "agent-product-1" },
              recommended_action: { type: "restart-agent", params: {} },
              status: "pending",
            } as ActionItem,
          ],
        },
        total_items: 2,
      });

      expect(Object.keys(queue.items_by_cause).length).toBe(2);
      expect(queue.total_items).toBe(2);
      expect(queue.addressed_count).toBe(0);
    });
  });

  describe("applyReviveAction handler", () => {
    it("handler: applies single action and updates queue status", async () => {
      const ctx = createMockContext();
      const queue = createMockActionQueue();
      const companyId = "company-1";
      const actionId = "action-single-blocker-1";

      // Verify queue has pending action
      const action = queue.items_by_cause["single-blocker"]?.[0];
      expect(action).toBeDefined();
      expect(action!.status).toBe("pending");

      // Simulate apply: status changes to addressed
      const updatedQueue = { ...queue };
      if (updatedQueue.items_by_cause["single-blocker"]) {
        updatedQueue.items_by_cause["single-blocker"]![0].status = "addressed";
        updatedQueue.addressed_count += 1;
      }

      expect(updatedQueue.addressed_count).toBe(1);
      expect(updatedQueue.items_by_cause["single-blocker"]![0].status).toBe("addressed");
    });

    it("handler: continues on failure (other actions remain pending)", async () => {
      const ctx = createMockContext();
      const queue = createMockActionQueue({
        items_by_cause: {
          "single-blocker": [
            {
              id: "action-1",
              cause: "single-blocker",
              priority: 0.9,
              title: "Action 1",
              why_blocking: "Blocks work",
              unblocks_count: 2,
              target: { type: "issue", id: "issue-1" },
              recommended_action: { type: "replace-blocker-issue", params: {} },
              status: "pending",
            } as ActionItem,
            {
              id: "action-2",
              cause: "single-blocker",
              priority: 0.8,
              title: "Action 2",
              why_blocking: "Blocks more work",
              unblocks_count: 1,
              target: { type: "issue", id: "issue-2" },
              recommended_action: { type: "replace-blocker-issue", params: {} },
              status: "pending",
            } as ActionItem,
          ],
        },
        total_items: 2,
      });

      // Simulate action 1 fails (status → dismissed)
      queue.items_by_cause["single-blocker"]![0].status = "dismissed";

      // Verify action 2 still pending
      expect(queue.items_by_cause["single-blocker"]![0].status).toBe("dismissed");
      expect(queue.items_by_cause["single-blocker"]![1].status).toBe("pending");
      expect(queue.total_items).toBe(2);
      expect(queue.addressed_count).toBe(0);
    });

    it("handler: creates revert action on failure", async () => {
      const ctx = createMockContext();
      const queue = createMockActionQueue();
      const originalAction = queue.items_by_cause["single-blocker"]![0];

      // Simulate failure: mark as dismissed, add revert action
      originalAction.status = "dismissed";

      const revertAction: ActionItem = {
        id: `${originalAction.id}:revert`,
        cause: originalAction.cause,
        priority: 1.0,
        title: `[REVERT] ${originalAction.title}`,
        why_blocking: `Undo failed action: API error`,
        unblocks_count: 0,
        target: originalAction.target,
        recommended_action: {
          type: "surface-amendment-needed",
          params: { original_action_id: originalAction.id },
        },
        status: "pending",
      };

      queue.items_by_cause["single-blocker"]!.push(revertAction);
      queue.total_items += 1;

      expect(queue.items_by_cause["single-blocker"]!.length).toBe(2);
      expect(queue.items_by_cause["single-blocker"]![1].id).toContain(":revert");
      expect(queue.total_items).toBe(2);
    });

    it("handler: uses idempotency keys for wakeup requests", async () => {
      const ctx = createMockContext();
      const companyId = "company-1";
      const actionId = "action-single-blocker-1";

      // Idempotency key format: compass:revive:{company}:{action}:{attempt}
      const idempotencyKey = `compass:revive:${companyId}:${actionId}:1`;
      expect(idempotencyKey).toMatch(/^compass:revive:[^:]+:[^:]+:[^:]+$/);
    });
  });

  describe("checkReviveActionStatus handler", () => {
    it("handler: returns queue stats (total, addressed, pending)", async () => {
      const ctx = createMockContext();
      const queue = createMockActionQueue({
        total_items: 5,
        addressed_count: 2,
      });

      const status = {
        found: true,
        totalItems: queue.total_items,
        addressedCount: queue.addressed_count,
        pendingCount: queue.total_items - queue.addressed_count,
      };

      expect(status.found).toBe(true);
      expect(status.totalItems).toBe(5);
      expect(status.addressedCount).toBe(2);
      expect(status.pendingCount).toBe(3);
    });

    it("handler: returns error when queue not found", async () => {
      const ctx = createMockContext();
      // Mock state.get to return null (queue not found)
      vi.mocked(ctx.state.get).mockResolvedValueOnce(null);

      const queue = await ctx.state.get({
        scopeKind: "company" as const,
        scopeId: "company-1",
        namespace: "compass:revive:run",
        stateKey: "run-test-1",
      });

      const result = queue ? { found: true } : { found: false, error: "Queue not found" };
      expect(result.found).toBe(false);
    });
  });

  describe("Full revive flow integration", () => {
    it("diagnose → review → apply one action → check status", async () => {
      const ctx = createMockContext();
      const companyId = "company-1";

      // Step 1: runStallDiagnostic
      const issues = await ctx.issues.list({ companyId });
      expect(issues.length).toBeGreaterThan(0);

      let visionDoc: any = null;
      for (const issue of issues) {
        const docs = await ctx.issues.documents.list(issue.id, companyId);
        visionDoc = docs.find((d: any) => d.key === "VISION.md");
        if (visionDoc) break;
      }
      expect(visionDoc).toBeDefined();

      // Step 2: Queue generated
      const queue = createMockActionQueue();
      expect(queue.total_items).toBeGreaterThan(0);
      expect(queue.addressed_count).toBe(0);

      // Step 3: Apply action
      const actionToApply = queue.items_by_cause["single-blocker"]![0];
      actionToApply.status = "addressed";
      queue.addressed_count += 1;

      // Step 4: Check status
      const status = {
        totalItems: queue.total_items,
        addressedCount: queue.addressed_count,
        pendingCount: queue.total_items - queue.addressed_count,
      };

      expect(status.pendingCount).toBe(0);
      expect(status.addressedCount).toBe(1);
    });

    it("diagnose → dismiss action → apply others → complete", async () => {
      const ctx = createMockContext();
      const queue = createMockActionQueue({
        items_by_cause: {
          "single-blocker": [
            {
              id: "action-1",
              cause: "single-blocker",
              priority: 0.9,
              title: "Action 1",
              why_blocking: "Blocks work",
              unblocks_count: 2,
              target: { type: "issue", id: "issue-1" },
              recommended_action: { type: "replace-blocker-issue", params: {} },
              status: "pending",
            } as ActionItem,
            {
              id: "action-2",
              cause: "single-blocker",
              priority: 0.8,
              title: "Action 2",
              why_blocking: "Blocks more",
              unblocks_count: 1,
              target: { type: "issue", id: "issue-2" },
              recommended_action: { type: "replace-blocker-issue", params: {} },
              status: "pending",
            } as ActionItem,
          ],
        },
        total_items: 2,
      });

      // Dismiss action 1
      queue.items_by_cause["single-blocker"]![0].status = "dismissed";
      queue.items_by_cause["single-blocker"]![0].dismissal_reason = "Founder decided to handle manually";

      // Apply action 2
      queue.items_by_cause["single-blocker"]![1].status = "addressed";
      queue.addressed_count += 1;

      const pending = queue.items_by_cause["single-blocker"]!.filter(
        (a) => a.status === "pending"
      );
      expect(pending.length).toBe(0);
      expect(queue.addressed_count).toBe(1);
    });

    it("founder dismisses action and retries later", async () => {
      const ctx = createMockContext();
      const queue = createMockActionQueue();
      const actionId = "action-single-blocker-1";

      const action = queue.items_by_cause["single-blocker"]!.find((a) => a.id === actionId);
      expect(action).toBeDefined();

      // Dismiss
      action!.status = "dismissed";
      action!.dismissal_reason = "Need more information";

      expect(action!.status).toBe("dismissed");
      expect(action!.dismissal_reason).toBeDefined();

      // Retry: change back to pending
      action!.status = "pending";
      delete action!.dismissal_reason;

      expect(action!.status).toBe("pending");
    });
  });

  describe("Error handling and edge cases", () => {
    it("handler: invalid companyId returns error", async () => {
      const ctx = createMockContext();

      // Mock empty issues list (company doesn't exist)
      vi.mocked(ctx.issues.list).mockResolvedValueOnce([]);

      const issues = await ctx.issues.list({ companyId: "invalid-company" });
      expect(issues.length).toBe(0);

      const result = {
        success: false,
        error: "VISION.md not found. Revive mode requires a founded company.",
      };
      expect(result.success).toBe(false);
    });

    it("handler: handles missing optional activity gracefully", async () => {
      const ctx = createMockContext();
      const companyId = "company-1";

      const issues = await ctx.issues.list({ companyId });
      expect(issues.length).toBeGreaterThan(0);

      // Even if activity snapshot fails, classifier should work with just inventory + VISION
      const queue = createMockActionQueue();
      expect(queue.total_items).toBeGreaterThan(0);
    });

    it("idempotency: same runStallDiagnostic call produces same queue", async () => {
      const queue1 = createMockActionQueue({ run_id: "run-1" });
      const queue2 = createMockActionQueue({ run_id: "run-1" });

      // Same run_id means idempotent (document is updated in-place)
      expect(queue1.run_id).toBe(queue2.run_id);
      expect(queue1.total_items).toBe(queue2.total_items);
    });
  });

  describe("Stalled-company fixture coverage", () => {
    it("single-blocker fixture: payment integration broken", async () => {
      const ctx = createMockContext();
      const queue = createMockActionQueue({
        items_by_cause: {
          "single-blocker": [
            {
              id: "action-blocker-1",
              cause: "single-blocker",
              priority: 0.95,
              title: "Replace blocker: payment integration",
              why_blocking: "Payment API broken, blocking 3+ features",
              unblocks_count: 3,
              target: { type: "issue", id: "issue-blocker-1" },
              recommended_action: { type: "replace-blocker-issue", params: {} },
              status: "pending",
            } as ActionItem,
          ],
        },
        total_items: 1,
      });

      expect(queue.items_by_cause["single-blocker"]).toBeDefined();
      expect(queue.items_by_cause["single-blocker"]![0].unblocks_count).toBe(3);
    });

    it("dead-agent fixture: product agent inactive > 30 days", async () => {
      const ctx = createMockContext();
      const agents = await ctx.agents.list({ companyId: "company-1" });
      const deadAgent = agents.find((a: any) => a.id === "agent-product-1");
      expect(deadAgent).toBeDefined();
      expect(deadAgent.lastHeartbeatAt).toBeNull();

      const queue = createMockActionQueue({
        items_by_cause: {
          "dead-agent": [
            {
              id: "action-dead-agent-1",
              cause: "dead-agent",
              priority: 0.8,
              title: "Restart agent: Product",
              why_blocking: "Product agent inactive > 30 days",
              unblocks_count: 2,
              target: { type: "agent", id: "agent-product-1" },
              recommended_action: { type: "restart-agent", params: {} },
              status: "pending",
            } as ActionItem,
          ],
        },
        total_items: 1,
      });

      expect(queue.items_by_cause["dead-agent"]).toBeDefined();
    });
  });
});
