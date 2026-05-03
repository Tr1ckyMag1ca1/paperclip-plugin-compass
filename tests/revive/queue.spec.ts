/**
 * Tests for Action Queue Serialization and Document Writer
 *
 * Per D-04, D-05: Action queue persists in Paperclip documents table.
 * Queue is serialized to JSON and stored with idempotency key based on run_id.
 *
 * Tests cover:
 * 1. Serialization: ActionQueue → JSON string with formatting
 * 2. Deserialization round-trip: JSON → ActionQueue
 * 3. Document writing: writeActionQueueDocument with idempotency key
 * 4. Idempotency: same queue written twice uses same key
 * 5. Queue structure: items_by_cause, addressed_count, total_items, etc.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ActionQueue, ActionItem } from "../../src/types/revive.js";
import { serializeActionQueue, writeActionQueueDocument } from "../../src/revive/queue.js";
import { PaperclipAdapter } from "../../src/sdk/adapter.js";

/**
 * Mock PaperclipAdapter for testing.
 */
function createMockAdapter(): Partial<PaperclipAdapter> {
  return {
    writeDocument: vi.fn(async (companyId: string, key: string, data: any) => {
      // Mock document written
    }),
  };
}

describe("Action Queue Serialization and Document Writer", () => {
  let mockAdapter: Partial<PaperclipAdapter>;

  beforeEach(() => {
    mockAdapter = createMockAdapter();
    vi.clearAllMocks();
  });

  // ========== SERIALIZATION ==========

  describe("serializeActionQueue", () => {
    it("returns valid JSON string", () => {
      const queue: ActionQueue = {
        run_id: "run-123",
        company_id: "company-123",
        created_at: "2026-05-03T12:00:00Z",
        causes: ["single-blocker", "strategic-drift"],
        items_by_cause: {
          "single-blocker": [
            {
              id: "action-1",
              cause: "single-blocker",
              priority: 0.95,
              title: "Replace blocker",
              why_blocking: "Stuck for 14 days",
              unblocks_count: 3,
              target: { type: "issue", id: "issue-123" },
              recommended_action: {
                type: "replace-blocker-issue",
                params: { issue_id: "issue-123" },
              },
              status: "pending",
            },
          ],
          "strategic-drift": [],
          "broken-integration": [],
          "governance-loop": [],
          "dead-agent": [],
        },
        total_items: 1,
        addressed_count: 0,
        confidence: {
          "single-blocker": 0.95,
          "strategic-drift": 0.3,
          "broken-integration": 0,
          "governance-loop": 0,
          "dead-agent": 0,
        },
      };

      const serialized = serializeActionQueue(queue);

      expect(typeof serialized).toBe("string");
      expect(serialized.length > 0).toBe(true);

      // Should be parseable as JSON
      const parsed = JSON.parse(serialized);
      expect(parsed).toBeDefined();
    });

    it("includes proper formatting (indentation)", () => {
      const queue: ActionQueue = {
        run_id: "run-456",
        company_id: "company-456",
        created_at: "2026-05-03T12:00:00Z",
        causes: ["single-blocker"],
        items_by_cause: {
          "single-blocker": [],
          "strategic-drift": [],
          "broken-integration": [],
          "governance-loop": [],
          "dead-agent": [],
        },
        total_items: 0,
        addressed_count: 0,
        confidence: {
          "single-blocker": 0,
          "strategic-drift": 0,
          "broken-integration": 0,
          "governance-loop": 0,
          "dead-agent": 0,
        },
      };

      const serialized = serializeActionQueue(queue);

      // Check for indentation (JSON.stringify with 2-space indent)
      expect(serialized).toContain("\n"); // Has newlines
      expect(serialized.indexOf("  ") > 0).toBe(true); // Has indentation
    });

    it("preserves all ActionQueue fields", () => {
      const actionItem: ActionItem = {
        id: "action-test",
        cause: "single-blocker",
        priority: 0.85,
        title: "Test action",
        why_blocking: "Testing serialization",
        unblocks_count: 2,
        target: { type: "issue", id: "issue-999" },
        recommended_action: {
          type: "reassign-issue",
          params: { new_agent_id: "agent-new" },
        },
        status: "addressed",
        dismissal_reason: "Completed externally",
      };

      const queue: ActionQueue = {
        run_id: "run-789",
        company_id: "company-789",
        created_at: "2026-05-03T14:30:00Z",
        causes: ["single-blocker"],
        items_by_cause: {
          "single-blocker": [actionItem],
          "strategic-drift": [],
          "broken-integration": [],
          "governance-loop": [],
          "dead-agent": [],
        },
        total_items: 1,
        addressed_count: 1,
        confidence: {
          "single-blocker": 0.9,
          "strategic-drift": 0,
          "broken-integration": 0,
          "governance-loop": 0,
          "dead-agent": 0,
        },
      };

      const serialized = serializeActionQueue(queue);
      const parsed = JSON.parse(serialized) as ActionQueue;

      // Verify all fields preserved
      expect(parsed.run_id).toBe(queue.run_id);
      expect(parsed.company_id).toBe(queue.company_id);
      expect(parsed.created_at).toBe(queue.created_at);
      expect(parsed.total_items).toBe(queue.total_items);
      expect(parsed.addressed_count).toBe(queue.addressed_count);
      expect(parsed.items_by_cause["single-blocker"][0].id).toBe(actionItem.id);
      expect(parsed.items_by_cause["single-blocker"][0].status).toBe("addressed");
      expect(parsed.items_by_cause["single-blocker"][0].dismissal_reason).toBe("Completed externally");
    });
  });

  // ========== DOCUMENT WRITING ==========

  describe("writeActionQueueDocument", () => {
    it("calls adapter.writeDocument with correct parameters", async () => {
      const queue: ActionQueue = {
        run_id: "run-write-1",
        company_id: "company-write-1",
        created_at: "2026-05-03T12:00:00Z",
        causes: ["single-blocker"],
        items_by_cause: {
          "single-blocker": [],
          "strategic-drift": [],
          "broken-integration": [],
          "governance-loop": [],
          "dead-agent": [],
        },
        total_items: 0,
        addressed_count: 0,
        confidence: {
          "single-blocker": 0,
          "strategic-drift": 0,
          "broken-integration": 0,
          "governance-loop": 0,
          "dead-agent": 0,
        },
      };

      await writeActionQueueDocument(mockAdapter as PaperclipAdapter, "company-write-1", queue);

      expect(mockAdapter.writeDocument).toHaveBeenCalled();

      const call = (mockAdapter.writeDocument as any).mock.calls[0];
      expect(call[0]).toBe("company-write-1"); // companyId
      expect(call[1]).toContain("compass:revive:action-queue"); // key
      expect(call[1]).toContain("run-write-1"); // run_id in key
    });

    it("writes document with idempotency key based on run_id", async () => {
      const queue: ActionQueue = {
        run_id: "run-idempotent-123",
        company_id: "company-idempotent",
        created_at: "2026-05-03T12:00:00Z",
        causes: [],
        items_by_cause: {
          "single-blocker": [],
          "strategic-drift": [],
          "broken-integration": [],
          "governance-loop": [],
          "dead-agent": [],
        },
        total_items: 0,
        addressed_count: 0,
        confidence: {
          "single-blocker": 0,
          "strategic-drift": 0,
          "broken-integration": 0,
          "governance-loop": 0,
          "dead-agent": 0,
        },
      };

      await writeActionQueueDocument(mockAdapter as PaperclipAdapter, "company-idempotent", queue);

      const call = (mockAdapter.writeDocument as any).mock.calls[0];
      const key = call[1];
      const data = call[2];

      // Key should follow format: compass:revive:action-queue:{run_id}
      expect(key).toBe(`compass:revive:action-queue:${queue.run_id}`);

      // Data should include idempotency_key
      expect(data.idempotency_key).toBe(key);
    });

    it("document title includes run_id", async () => {
      const queue: ActionQueue = {
        run_id: "run-title-test",
        company_id: "company-title",
        created_at: "2026-05-03T12:00:00Z",
        causes: [],
        items_by_cause: {
          "single-blocker": [],
          "strategic-drift": [],
          "broken-integration": [],
          "governance-loop": [],
          "dead-agent": [],
        },
        total_items: 0,
        addressed_count: 0,
        confidence: {
          "single-blocker": 0,
          "strategic-drift": 0,
          "broken-integration": 0,
          "governance-loop": 0,
          "dead-agent": 0,
        },
      };

      await writeActionQueueDocument(mockAdapter as PaperclipAdapter, "company-title", queue);

      const call = (mockAdapter.writeDocument as any).mock.calls[0];
      const data = call[2];

      expect(data.title).toContain("Revive Action Queue");
      expect(data.title).toContain("run-title-test");
    });

    it("document body is serialized ActionQueue JSON", async () => {
      const queue: ActionQueue = {
        run_id: "run-body-test",
        company_id: "company-body",
        created_at: "2026-05-03T12:00:00Z",
        causes: ["single-blocker"],
        items_by_cause: {
          "single-blocker": [],
          "strategic-drift": [],
          "broken-integration": [],
          "governance-loop": [],
          "dead-agent": [],
        },
        total_items: 0,
        addressed_count: 0,
        confidence: {
          "single-blocker": 0.5,
          "strategic-drift": 0,
          "broken-integration": 0,
          "governance-loop": 0,
          "dead-agent": 0,
        },
      };

      await writeActionQueueDocument(mockAdapter as PaperclipAdapter, "company-body", queue);

      const call = (mockAdapter.writeDocument as any).mock.calls[0];
      const data = call[2];
      const body = data.body;

      // Body should be JSON
      const parsed = JSON.parse(body) as ActionQueue;
      expect(parsed.run_id).toBe("run-body-test");
      expect(parsed.total_items).toBe(0);
      expect(parsed.confidence["single-blocker"]).toBe(0.5);
    });
  });

  // ========== IDEMPOTENCY ==========

  describe("idempotency", () => {
    it("same queue written twice uses same key", async () => {
      const queue: ActionQueue = {
        run_id: "run-idempotency-final",
        company_id: "company-idempotency",
        created_at: "2026-05-03T12:00:00Z",
        causes: [],
        items_by_cause: {
          "single-blocker": [],
          "strategic-drift": [],
          "broken-integration": [],
          "governance-loop": [],
          "dead-agent": [],
        },
        total_items: 0,
        addressed_count: 0,
        confidence: {
          "single-blocker": 0,
          "strategic-drift": 0,
          "broken-integration": 0,
          "governance-loop": 0,
          "dead-agent": 0,
        },
      };

      await writeActionQueueDocument(mockAdapter as PaperclipAdapter, "company-idempotency", queue);
      await writeActionQueueDocument(mockAdapter as PaperclipAdapter, "company-idempotency", queue);

      const call1 = (mockAdapter.writeDocument as any).mock.calls[0];
      const call2 = (mockAdapter.writeDocument as any).mock.calls[1];

      const key1 = call1[1];
      const key2 = call2[1];

      // Both writes should use the same key (idempotency)
      expect(key1).toBe(key2);
      expect(key1).toBe(`compass:revive:action-queue:${queue.run_id}`);
    });

    it("different run_ids produce different keys", async () => {
      const queue1: ActionQueue = {
        run_id: "run-1",
        company_id: "company-123",
        created_at: "2026-05-03T12:00:00Z",
        causes: [],
        items_by_cause: {
          "single-blocker": [],
          "strategic-drift": [],
          "broken-integration": [],
          "governance-loop": [],
          "dead-agent": [],
        },
        total_items: 0,
        addressed_count: 0,
        confidence: {
          "single-blocker": 0,
          "strategic-drift": 0,
          "broken-integration": 0,
          "governance-loop": 0,
          "dead-agent": 0,
        },
      };

      const queue2: ActionQueue = {
        run_id: "run-2",
        company_id: "company-123",
        created_at: "2026-05-03T12:00:00Z",
        causes: [],
        items_by_cause: {
          "single-blocker": [],
          "strategic-drift": [],
          "broken-integration": [],
          "governance-loop": [],
          "dead-agent": [],
        },
        total_items: 0,
        addressed_count: 0,
        confidence: {
          "single-blocker": 0,
          "strategic-drift": 0,
          "broken-integration": 0,
          "governance-loop": 0,
          "dead-agent": 0,
        },
      };

      await writeActionQueueDocument(mockAdapter as PaperclipAdapter, "company-123", queue1);
      await writeActionQueueDocument(mockAdapter as PaperclipAdapter, "company-123", queue2);

      const call1 = (mockAdapter.writeDocument as any).mock.calls[0];
      const call2 = (mockAdapter.writeDocument as any).mock.calls[1];

      const key1 = call1[1];
      const key2 = call2[1];

      // Different run_ids should produce different keys
      expect(key1).not.toBe(key2);
      expect(key1).toContain("run-1");
      expect(key2).toContain("run-2");
    });
  });

  // ========== ROUND-TRIP TESTS ==========

  describe("round-trip serialization", () => {
    it("serialize → write → read → deserialize produces same queue", async () => {
      const originalQueue: ActionQueue = {
        run_id: "run-roundtrip",
        company_id: "company-roundtrip",
        created_at: "2026-05-03T13:45:00Z",
        causes: ["single-blocker", "strategic-drift"],
        items_by_cause: {
          "single-blocker": [
            {
              id: "action-rt-1",
              cause: "single-blocker",
              priority: 0.9,
              title: "Replace blocker",
              why_blocking: "Stuck",
              unblocks_count: 2,
              target: { type: "issue", id: "issue-rt-1" },
              recommended_action: {
                type: "replace-blocker-issue",
                params: { issue_id: "issue-rt-1" },
              },
              status: "pending",
            },
          ],
          "strategic-drift": [
            {
              id: "action-rt-2",
              cause: "strategic-drift",
              priority: 0.75,
              title: "Surface amendment",
              why_blocking: "Vision drift",
              unblocks_count: 1,
              target: { type: "vision_section", id: "business-model" },
              recommended_action: {
                type: "surface-amendment-needed",
                params: { reason: "Needs review" },
              },
              status: "pending",
            },
          ],
          "broken-integration": [],
          "governance-loop": [],
          "dead-agent": [],
        },
        total_items: 2,
        addressed_count: 0,
        confidence: {
          "single-blocker": 0.9,
          "strategic-drift": 0.75,
          "broken-integration": 0,
          "governance-loop": 0,
          "dead-agent": 0,
        },
      };

      // Serialize
      const serialized = serializeActionQueue(originalQueue);

      // Write (would go to Paperclip documents)
      await writeActionQueueDocument(mockAdapter as PaperclipAdapter, originalQueue.company_id, originalQueue);

      // Read (would come from Paperclip documents)
      const call = (mockAdapter.writeDocument as any).mock.calls[0];
      const writtenBody = call[2].body;

      // Deserialize
      const deserializedQueue = JSON.parse(writtenBody) as ActionQueue;

      // Verify all fields match
      expect(deserializedQueue.run_id).toBe(originalQueue.run_id);
      expect(deserializedQueue.company_id).toBe(originalQueue.company_id);
      expect(deserializedQueue.created_at).toBe(originalQueue.created_at);
      expect(deserializedQueue.total_items).toBe(originalQueue.total_items);
      expect(deserializedQueue.addressed_count).toBe(originalQueue.addressed_count);

      // Verify cause lists match
      expect(deserializedQueue.causes).toEqual(originalQueue.causes);

      // Verify items match
      expect(deserializedQueue.items_by_cause["single-blocker"][0].id).toBe("action-rt-1");
      expect(deserializedQueue.items_by_cause["strategic-drift"][0].id).toBe("action-rt-2");

      // Verify confidence scores match
      expect(deserializedQueue.confidence["single-blocker"]).toBe(0.9);
      expect(deserializedQueue.confidence["strategic-drift"]).toBe(0.75);
    });
  });

  // ========== EDGE CASES ==========

  describe("edge cases", () => {
    it("handles empty queue (no action items)", async () => {
      const emptyQueue: ActionQueue = {
        run_id: "run-empty",
        company_id: "company-empty",
        created_at: "2026-05-03T12:00:00Z",
        causes: [],
        items_by_cause: {
          "single-blocker": [],
          "strategic-drift": [],
          "broken-integration": [],
          "governance-loop": [],
          "dead-agent": [],
        },
        total_items: 0,
        addressed_count: 0,
        confidence: {
          "single-blocker": 0,
          "strategic-drift": 0,
          "broken-integration": 0,
          "governance-loop": 0,
          "dead-agent": 0,
        },
      };

      const serialized = serializeActionQueue(emptyQueue);
      expect(serialized).toBeDefined();

      const parsed = JSON.parse(serialized);
      expect(parsed.total_items).toBe(0);
      expect(parsed.items_by_cause["single-blocker"].length).toBe(0);
    });

    it("handles queue with all items addressed", async () => {
      const addressedQueue: ActionQueue = {
        run_id: "run-all-addressed",
        company_id: "company-addressed",
        created_at: "2026-05-03T12:00:00Z",
        causes: ["single-blocker"],
        items_by_cause: {
          "single-blocker": [
            {
              id: "action-resolved-1",
              cause: "single-blocker",
              priority: 0.9,
              title: "Resolved action",
              why_blocking: "Was blocking",
              unblocks_count: 1,
              target: { type: "issue", id: "issue-resolved" },
              recommended_action: {
                type: "mark-blocker-resolved",
                params: { issue_id: "issue-resolved" },
              },
              status: "addressed",
            },
          ],
          "strategic-drift": [],
          "broken-integration": [],
          "governance-loop": [],
          "dead-agent": [],
        },
        total_items: 1,
        addressed_count: 1,
        confidence: {
          "single-blocker": 0.9,
          "strategic-drift": 0,
          "broken-integration": 0,
          "governance-loop": 0,
          "dead-agent": 0,
        },
      };

      await writeActionQueueDocument(mockAdapter as PaperclipAdapter, "company-addressed", addressedQueue);

      const call = (mockAdapter.writeDocument as any).mock.calls[0];
      const data = call[2];
      const parsed = JSON.parse(data.body);

      expect(parsed.total_items).toBe(1);
      expect(parsed.addressed_count).toBe(1);
      expect(parsed.items_by_cause["single-blocker"][0].status).toBe("addressed");
    });
  });
});
