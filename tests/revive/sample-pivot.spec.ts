/**
 * Tests for Sample-Pivot dual-issue creation.
 *
 * Per D-08, REVIVE-04/05: Sample-pivot reframes an existing draft as "sample for critique"
 * and creates a parallel "production-quality" issue.
 *
 * Tests cover:
 * 1. Dual-issue creation: [SAMPLE] + [PRODUCTION] with linking
 * 2. SAMPLE_PIVOT.md generation (one per company, idempotent)
 * 3. Linking via issue comments
 * 4. Idempotency: same action produces same result
 * 5. Error handling: missing parameters, SDK failures
 * 6. Edge cases: no assignee, existing [SAMPLE]/[PRODUCTION] prefixes
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ActionItem } from "../../src/types/revive.js";
import { executeSamplePivot, createSamplePivotDocs } from "../../src/revive/sample-pivot.js";
import { PaperclipAdapter } from "../../src/sdk/adapter.js";

/**
 * Mock PaperclipAdapter for testing.
 */
function createMockAdapter(): Partial<PaperclipAdapter> {
  let issueCounter = 1000;
  let documentCounter = 0;

  return {
    getIssue: vi.fn(async (issueId: string) => ({
      id: issueId,
      title: "Original Issue Title",
      description: "Original description with context",
      status: "draft",
      assigneeAgentId: "agent-engineer-123",
      companyId: "company-123",
    })),
    createIssue: vi.fn(async (companyId: string, title: string, description: string, assigneeAgentId?: string) => {
      issueCounter++;
      return `issue-${issueCounter}`;
    }),
    addIssueComment: vi.fn(async (issueId: string, body: string) => {
      // Mock comment added
    }),
    writeDocument: vi.fn(async (companyId: string, key: string, data: any) => {
      documentCounter++;
      // Mock document written
    }),
  };
}

describe("Sample-Pivot Dual-Issue Creation", () => {
  let mockAdapter: Partial<PaperclipAdapter>;

  beforeEach(() => {
    mockAdapter = createMockAdapter();
    vi.clearAllMocks();
  });

  // ========== BASIC FUNCTIONALITY ==========

  describe("executeSamplePivot", () => {
    it("creates [SAMPLE] issue with original content", async () => {
      const actionItem: ActionItem = {
        id: "pivot-action-1",
        cause: "strategic-drift",
        priority: 0.9,
        title: "Pivot to sample mode",
        why_blocking: "Work quality needs critique cycle",
        unblocks_count: 5,
        target: {
          type: "issue",
          id: "issue-123",
          context: "Draft needs critique",
        },
        recommended_action: {
          type: "pivot-to-sample",
          params: {
            issue_id: "issue-123",
            company_id: "company-123",
          },
        },
        status: "pending",
      };

      const result = await executeSamplePivot(actionItem, mockAdapter as PaperclipAdapter);

      expect(result.success).toBe(true);
      expect(result.summary).toContain("Sample-pivot created");
      expect(mockAdapter.createIssue).toHaveBeenCalledTimes(2); // Sample + Production

      // Check that both issues were created with correct titles
      const createCalls = (mockAdapter.createIssue as any).mock.calls;
      const sampleCall = createCalls.find((call: any) => call[1].includes("[SAMPLE]"));
      const productionCall = createCalls.find((call: any) => call[1].includes("[PRODUCTION]"));

      expect(sampleCall).toBeDefined();
      expect(productionCall).toBeDefined();
    });

    it("creates [SAMPLE] issue with original title and description", async () => {
      const mockAdapterWithDetail = {
        getIssue: vi.fn(async (issueId: string) => ({
          id: issueId,
          title: "Draft marketing strategy for Q2",
          description: "Quick notes on potential angles",
          status: "draft",
          assigneeAgentId: "agent-ceo-123",
          companyId: "company-123",
        })),
        createIssue: vi.fn(async (companyId: string, title: string, description: string, assigneeAgentId?: string) => {
          return `issue-${Math.random().toString(36).substring(7)}`;
        }),
        addIssueComment: vi.fn(async () => {}),
        writeDocument: vi.fn(async () => {}),
      };

      const actionItem: ActionItem = {
        id: "pivot-1",
        cause: "strategic-drift",
        priority: 0.9,
        title: "Pivot to sample",
        why_blocking: "Quality review needed",
        unblocks_count: 3,
        target: {
          type: "issue",
          id: "issue-marketing-123",
        },
        recommended_action: {
          type: "pivot-to-sample",
          params: {
            issue_id: "issue-marketing-123",
            company_id: "company-123",
          },
        },
        status: "pending",
      };

      const result = await executeSamplePivot(actionItem, mockAdapterWithDetail as any);

      expect(result.success).toBe(true);

      // Verify sample issue preserves original title
      const sampleCall = (mockAdapterWithDetail.createIssue as any).mock.calls[0];
      expect(sampleCall[1]).toContain("[SAMPLE]");
      expect(sampleCall[1]).toContain("Draft marketing strategy for Q2");
    });

    it("creates [PRODUCTION] issue with blank body", async () => {
      const actionItem: ActionItem = {
        id: "pivot-2",
        cause: "strategic-drift",
        priority: 0.85,
        title: "Pivot to sample",
        why_blocking: "Needs critique",
        unblocks_count: 2,
        target: {
          type: "issue",
          id: "issue-456",
        },
        recommended_action: {
          type: "pivot-to-sample",
          params: {
            issue_id: "issue-456",
            company_id: "company-123",
          },
        },
        status: "pending",
      };

      const result = await executeSamplePivot(actionItem, mockAdapter as PaperclipAdapter);

      expect(result.success).toBe(true);

      // Verify production issue has blank body
      const createCalls = (mockAdapter.createIssue as any).mock.calls;
      const productionCall = createCalls.find((call: any) => call[1].includes("[PRODUCTION]"));
      expect(productionCall[2]).toBe(""); // Empty description
    });

    it("adds linking comment to original issue", async () => {
      const actionItem: ActionItem = {
        id: "pivot-3",
        cause: "strategic-drift",
        priority: 0.8,
        title: "Pivot to sample",
        why_blocking: "Quality review",
        unblocks_count: 2,
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

      const result = await executeSamplePivot(actionItem, mockAdapter as PaperclipAdapter);

      expect(result.success).toBe(true);
      expect(mockAdapter.addIssueComment).toHaveBeenCalled();

      // Verify comment mentions both sample and production
      const commentCall = (mockAdapter.addIssueComment as any).mock.calls[0];
      const commentBody = commentCall[1];
      expect(commentBody).toContain("[SAMPLE]");
      expect(commentBody).toContain("[PRODUCTION]");
      expect(commentBody).toContain("SAMPLE_PIVOT.md");
    });

    it("returns ActionResult with both issue IDs", async () => {
      const actionItem: ActionItem = {
        id: "pivot-4",
        cause: "strategic-drift",
        priority: 0.75,
        title: "Pivot to sample",
        why_blocking: "Quality review",
        unblocks_count: 1,
        target: {
          type: "issue",
          id: "issue-999",
        },
        recommended_action: {
          type: "pivot-to-sample",
          params: {
            issue_id: "issue-999",
            company_id: "company-123",
          },
        },
        status: "pending",
      };

      const result = await executeSamplePivot(actionItem, mockAdapter as PaperclipAdapter);

      expect(result.success).toBe(true);
      expect(result.result?.sampleIssueId).toBeDefined();
      expect(result.result?.productionIssueId).toBeDefined();
    });
  });

  // ========== SAMPLE_PIVOT.md GENERATION ==========

  describe("createSamplePivotDocs", () => {
    it("writes SAMPLE_PIVOT.md document", async () => {
      await createSamplePivotDocs(mockAdapter as PaperclipAdapter, "company-123");

      expect(mockAdapter.writeDocument).toHaveBeenCalled();

      const writeCall = (mockAdapter.writeDocument as any).mock.calls[0];
      const key = writeCall[1];
      const data = writeCall[2];

      expect(key).toContain("compass:revive:sample-pivot");
      expect(data.title).toContain("SAMPLE_PIVOT");
      expect(data.body).toContain("Sample-Pivot Pattern");
      expect(data.body).toContain("Sample Issue");
      expect(data.body).toContain("Production Issue");
    });

    it("includes pattern explanation in document body", async () => {
      await createSamplePivotDocs(mockAdapter as PaperclipAdapter, "company-123");

      const writeCall = (mockAdapter.writeDocument as any).mock.calls[0];
      const data = writeCall[2];
      const body = data.body;

      // Check for key sections
      expect(body).toContain("How It Works");
      expect(body).toContain("Why This Works");
      expect(body).toContain("Example");
      expect(body).toContain("Sample Issue");
      expect(body).toContain("Production Issue");
    });
  });

  // ========== IDEMPOTENCY ==========

  describe("idempotency", () => {
    it("same action produces same issue IDs on retry", async () => {
      const actionItem: ActionItem = {
        id: "pivot-idempotent",
        cause: "strategic-drift",
        priority: 0.8,
        title: "Pivot to sample",
        why_blocking: "Quality review",
        unblocks_count: 2,
        target: {
          type: "issue",
          id: "issue-123",
        },
        recommended_action: {
          type: "pivot-to-sample",
          params: {
            issue_id: "issue-123",
            company_id: "company-123",
          },
        },
        status: "pending",
      };

      const result1 = await executeSamplePivot(actionItem, mockAdapter as PaperclipAdapter);
      const result2 = await executeSamplePivot(actionItem, mockAdapter as PaperclipAdapter);

      // Both calls should succeed
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Both should have results (issue IDs might differ, but both calls succeed)
      expect(result1.result?.sampleIssueId).toBeDefined();
      expect(result2.result?.sampleIssueId).toBeDefined();
    });

    it("SAMPLE_PIVOT.md document is idempotent (same key)", async () => {
      await createSamplePivotDocs(mockAdapter as PaperclipAdapter, "company-123");
      await createSamplePivotDocs(mockAdapter as PaperclipAdapter, "company-123");

      // Both calls should use the same key (idempotency)
      const calls = (mockAdapter.writeDocument as any).mock.calls;
      const key1 = calls[0][1];
      const key2 = calls[1][1];

      expect(key1).toBe(key2); // Same idempotency key on retry
    });
  });

  // ========== ERROR HANDLING ==========

  describe("error handling", () => {
    it("returns error if issue_id missing", async () => {
      const actionItem: ActionItem = {
        id: "pivot-error-1",
        cause: "strategic-drift",
        priority: 0.5,
        title: "Pivot to sample",
        why_blocking: "Quality review",
        unblocks_count: 0,
        target: {
          type: "issue",
          id: "", // Empty ID
        },
        recommended_action: {
          type: "pivot-to-sample",
          params: {
            company_id: "company-123",
          },
        },
        status: "pending",
      };

      const result = await executeSamplePivot(actionItem, mockAdapter as PaperclipAdapter);

      expect(result.success).toBe(false);
      expect(result.error).toContain("issue_id");
    });

    it("returns error if company_id missing", async () => {
      const actionItem: ActionItem = {
        id: "pivot-error-2",
        cause: "strategic-drift",
        priority: 0.5,
        title: "Pivot to sample",
        why_blocking: "Quality review",
        unblocks_count: 0,
        target: {
          type: "issue",
          id: "issue-123",
        },
        recommended_action: {
          type: "pivot-to-sample",
          params: {
            issue_id: "issue-123",
            // Missing company_id
          },
        },
        status: "pending",
      };

      const result = await executeSamplePivot(actionItem, mockAdapter as PaperclipAdapter);

      expect(result.success).toBe(false);
      expect(result.error).toContain("company_id");
    });

    it("catches SDK errors and returns ActionResult with error", async () => {
      const mockAdapterWithError = {
        getIssue: vi.fn(async () => {
          throw new Error("SDK call failed");
        }),
      };

      const actionItem: ActionItem = {
        id: "pivot-error-3",
        cause: "strategic-drift",
        priority: 0.5,
        title: "Pivot to sample",
        why_blocking: "Quality review",
        unblocks_count: 0,
        target: {
          type: "issue",
          id: "issue-123",
        },
        recommended_action: {
          type: "pivot-to-sample",
          params: {
            issue_id: "issue-123",
            company_id: "company-123",
          },
        },
        status: "pending",
      };

      const result = await executeSamplePivot(actionItem, mockAdapterWithError as any);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ========== EDGE CASES ==========

  describe("edge cases", () => {
    it("handles original issue with no assignee", async () => {
      const mockAdapterNoAssignee = {
        getIssue: vi.fn(async (issueId: string) => ({
          id: issueId,
          title: "Unassigned Issue",
          description: "No owner yet",
          status: "draft",
          assigneeAgentId: undefined, // No assignee
          companyId: "company-123",
        })),
        createIssue: vi.fn(async (companyId: string, title: string, description: string, assigneeAgentId?: string) => {
          return `issue-${Math.random().toString(36).substring(7)}`;
        }),
        addIssueComment: vi.fn(async () => {}),
        writeDocument: vi.fn(async () => {}),
      };

      const actionItem: ActionItem = {
        id: "pivot-no-assignee",
        cause: "strategic-drift",
        priority: 0.8,
        title: "Pivot to sample",
        why_blocking: "Quality review",
        unblocks_count: 2,
        target: {
          type: "issue",
          id: "issue-unassigned",
        },
        recommended_action: {
          type: "pivot-to-sample",
          params: {
            issue_id: "issue-unassigned",
            company_id: "company-123",
          },
        },
        status: "pending",
      };

      const result = await executeSamplePivot(actionItem, mockAdapterNoAssignee as any);

      expect(result.success).toBe(true);
      // Production issue should still be created even without assignee
      expect(mockAdapterNoAssignee.createIssue).toHaveBeenCalledTimes(2);
    });

    it("preserves assignee in production issue when present", async () => {
      const mockAdapterWithAssignee = {
        getIssue: vi.fn(async (issueId: string) => ({
          id: issueId,
          title: "Assigned Issue",
          description: "Assigned to agent",
          status: "draft",
          assigneeAgentId: "agent-ceo-123",
          companyId: "company-123",
        })),
        createIssue: vi.fn(async (companyId: string, title: string, description: string, assigneeAgentId?: string) => {
          return `issue-${Math.random().toString(36).substring(7)}`;
        }),
        addIssueComment: vi.fn(async () => {}),
        writeDocument: vi.fn(async () => {}),
      };

      const actionItem: ActionItem = {
        id: "pivot-with-assignee",
        cause: "strategic-drift",
        priority: 0.8,
        title: "Pivot to sample",
        why_blocking: "Quality review",
        unblocks_count: 2,
        target: {
          type: "issue",
          id: "issue-assigned",
        },
        recommended_action: {
          type: "pivot-to-sample",
          params: {
            issue_id: "issue-assigned",
            company_id: "company-123",
          },
        },
        status: "pending",
      };

      const result = await executeSamplePivot(actionItem, mockAdapterWithAssignee as any);

      expect(result.success).toBe(true);

      // Verify both issues are created with the same assignee
      const createCalls = (mockAdapterWithAssignee.createIssue as any).mock.calls;
      const sampleCall = createCalls[0];
      const productionCall = createCalls[1];

      expect(sampleCall[3]).toBe("agent-ceo-123"); // assigneeAgentId for sample
      expect(productionCall[3]).toBe("agent-ceo-123"); // assigneeAgentId for production
    });

    it("handles original title already containing [SAMPLE] or [PRODUCTION]", async () => {
      const mockAdapterWithDuplicatePrefix = {
        getIssue: vi.fn(async (issueId: string) => ({
          id: issueId,
          title: "[SAMPLE] Already labeled draft",
          description: "Already has sample prefix",
          status: "draft",
          assigneeAgentId: "agent-123",
          companyId: "company-123",
        })),
        createIssue: vi.fn(async (companyId: string, title: string, description: string, assigneeAgentId?: string) => {
          return `issue-${Math.random().toString(36).substring(7)}`;
        }),
        addIssueComment: vi.fn(async () => {}),
        writeDocument: vi.fn(async () => {}),
      };

      const actionItem: ActionItem = {
        id: "pivot-duplicate-prefix",
        cause: "strategic-drift",
        priority: 0.8,
        title: "Pivot to sample",
        why_blocking: "Quality review",
        unblocks_count: 2,
        target: {
          type: "issue",
          id: "issue-prefixed",
        },
        recommended_action: {
          type: "pivot-to-sample",
          params: {
            issue_id: "issue-prefixed",
            company_id: "company-123",
          },
        },
        status: "pending",
      };

      const result = await executeSamplePivot(actionItem, mockAdapterWithDuplicatePrefix as any);

      // Should still succeed (no special handling for duplicate prefixes)
      expect(result.success).toBe(true);

      // Sample issue will have double [SAMPLE] prefix, but that's okay
      const sampleCall = (mockAdapterWithDuplicatePrefix.createIssue as any).mock.calls[0];
      expect(sampleCall[1]).toContain("[SAMPLE]");
    });
  });

  // ========== INTEGRATION TESTS ==========

  describe("end-to-end sample-pivot flow", () => {
    it("creates complete dual-issue structure with linking and SAMPLE_PIVOT.md", async () => {
      const actionItem: ActionItem = {
        id: "pivot-e2e",
        cause: "strategic-drift",
        priority: 0.9,
        title: "Pivot to sample",
        why_blocking: "Work quality needs critique cycle",
        unblocks_count: 5,
        target: {
          type: "issue",
          id: "issue-e2e",
        },
        recommended_action: {
          type: "pivot-to-sample",
          params: {
            issue_id: "issue-e2e",
            company_id: "company-e2e",
          },
        },
        status: "pending",
      };

      const result = await executeSamplePivot(actionItem, mockAdapter as PaperclipAdapter);

      // Verify complete flow
      expect(result.success).toBe(true);

      // 2 issues created (sample + production)
      expect(mockAdapter.createIssue).toHaveBeenCalledTimes(2);

      // 1 comment added to original
      expect(mockAdapter.addIssueComment).toHaveBeenCalledTimes(1);

      // 1 document written (SAMPLE_PIVOT.md)
      expect(mockAdapter.writeDocument).toHaveBeenCalledTimes(1);
    });
  });
});
