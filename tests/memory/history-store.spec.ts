import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getEngagementHistory,
  createEngagementHistory,
  updateEngagementHistory,
  recordFindingsToHistory,
} from "../../src/memory/history-store.js";
import { createFinding } from "../../src/memory/finding.js";
import type { EngagementHistory, Finding } from "../../src/types/memory.js";

// Mock adapter
const createMockAdapter = () => ({
  getDocumentByKey: vi.fn(),
  writeDocument: vi.fn(),
});

// Mock context with state management
const createMockContext = () => ({
  state: {
    get: vi.fn().mockResolvedValue(undefined),
    set: vi.fn().mockResolvedValue(undefined),
  },
});

describe("Engagement History Store", () => {
  let mockAdapter: any;
  let mockContext: any;

  beforeEach(() => {
    mockAdapter = createMockAdapter();
    mockContext = createMockContext();
  });

  describe("getEngagementHistory", () => {
    it("returns null when document doesn't exist", async () => {
      mockContext.state.get.mockReturnValue(undefined);
      mockAdapter.getDocumentByKey.mockResolvedValue(null);

      const result = await getEngagementHistory(mockContext, mockAdapter, "company-1");

      expect(result).toBeNull();
      expect(mockAdapter.getDocumentByKey).toHaveBeenCalledWith("company-1", "compass-engagement-history");
    });

    it("reads document and parses JSON from markdown", async () => {
      mockContext.state.get.mockReturnValue(undefined);

      const mockHistory: EngagementHistory = {
        version: 1,
        company_id: "company-1",
        last_engaged_at: new Date().toISOString(),
        findings: [],
        routines: [],
      };

      const markdown = `# Engagement History

## Recent Findings

No findings yet.

## Raw Data

\`\`\`json
${JSON.stringify(mockHistory)}
\`\`\`
`;

      mockAdapter.getDocumentByKey.mockResolvedValue(markdown);

      const result = await getEngagementHistory(mockContext, mockAdapter, "company-1");

      expect(result).toEqual(mockHistory);
      expect(result?.version).toBe(1);
      expect(result?.company_id).toBe("company-1");
    });

    it("caches result in worker state with TTL", async () => {
      mockContext.state.get.mockReturnValue(undefined);

      const mockHistory: EngagementHistory = {
        version: 1,
        company_id: "company-1",
        last_engaged_at: new Date().toISOString(),
        findings: [],
        routines: [],
      };

      const markdown = `\`\`\`json\n${JSON.stringify(mockHistory)}\n\`\`\``;
      mockAdapter.getDocumentByKey.mockResolvedValue(markdown);

      const result1 = await getEngagementHistory(mockContext, mockAdapter, "company-1");
      const result2 = await getEngagementHistory(mockContext, mockAdapter, "company-1");

      expect(result1).toEqual(mockHistory);
      expect(result2).toEqual(mockHistory);
      expect(mockContext.state.set).toHaveBeenCalled();
    });

    it("returns cached result when not stale", async () => {
      const cacheEntry = {
        data: {
          version: 1,
          company_id: "company-1",
          last_engaged_at: new Date().toISOString(),
          findings: [],
          routines: [],
        } as EngagementHistory,
        cachedAt: Date.now(),
        ttlMs: 60000,
      };

      mockContext.state.get.mockResolvedValue(cacheEntry);

      const result = await getEngagementHistory(mockContext, mockAdapter, "company-1");

      expect(result).toEqual(cacheEntry.data);
      expect(mockAdapter.getDocumentByKey).not.toHaveBeenCalled();
    });

    it("refetches when cache is stale", async () => {
      const staleEntry = {
        data: {
          version: 1,
          company_id: "company-1",
          last_engaged_at: new Date().toISOString(),
          findings: [],
          routines: [],
        } as EngagementHistory,
        cachedAt: Date.now() - 70000, // Older than TTL
        ttlMs: 60000,
      };

      mockContext.state.get.mockResolvedValueOnce(staleEntry);

      const newHistory: EngagementHistory = {
        version: 1,
        company_id: "company-1",
        last_engaged_at: new Date().toISOString(),
        findings: [createFinding("run-1", "Assess", "New finding")],
        routines: [],
      };

      const markdown = `\`\`\`json\n${JSON.stringify(newHistory)}\n\`\`\``;
      mockAdapter.getDocumentByKey.mockResolvedValue(markdown);

      const result = await getEngagementHistory(mockContext, mockAdapter, "company-1");

      expect(result).toEqual(newHistory);
      expect(mockAdapter.getDocumentByKey).toHaveBeenCalled();
    });
  });

  describe("createEngagementHistory", () => {
    it("creates new engagement history with correct structure", async () => {
      mockAdapter.writeDocument.mockResolvedValue("doc-id");

      const result = await createEngagementHistory(mockContext, mockAdapter, "company-1");

      expect(result.version).toBe(1);
      expect(result.company_id).toBe("company-1");
      expect(result.findings).toEqual([]);
      expect(result.routines).toEqual([]);
      expect(result.last_engaged_at).toBeTruthy();
    });

    it("writes document via adapter", async () => {
      mockAdapter.writeDocument.mockResolvedValue("doc-id");

      await createEngagementHistory(mockContext, mockAdapter, "company-1");

      expect(mockAdapter.writeDocument).toHaveBeenCalledWith(
        "company-1",
        "Engagement History",
        expect.stringContaining("Engagement History")
      );
    });

    it("updates cache after creation", async () => {
      mockAdapter.writeDocument.mockResolvedValue("doc-id");

      await createEngagementHistory(mockContext, mockAdapter, "company-1");

      expect(mockContext.state.set).toHaveBeenCalledWith(
        expect.objectContaining({
          scopeKind: "company",
          scopeId: "company-1",
          namespace: "memory-cache",
          stateKey: "engagement-history",
        }),
        expect.objectContaining({
          data: expect.objectContaining({
            version: 1,
            company_id: "company-1",
          }),
        })
      );
    });
  });

  describe("updateEngagementHistory", () => {
    it("writes updated history via adapter", async () => {
      mockAdapter.writeDocument.mockResolvedValue("doc-id");

      const history: EngagementHistory = {
        version: 1,
        company_id: "company-1",
        last_engaged_at: new Date().toISOString(),
        findings: [createFinding("run-1", "Assess", "Test finding")],
        routines: [],
      };

      await updateEngagementHistory(mockContext, mockAdapter, "company-1", history);

      expect(mockAdapter.writeDocument).toHaveBeenCalledWith(
        "company-1",
        "Engagement History",
        expect.stringContaining("Engagement History")
      );
    });

    it("invalidates cache after update", async () => {
      mockAdapter.writeDocument.mockResolvedValue("doc-id");

      const history: EngagementHistory = {
        version: 1,
        company_id: "company-1",
        last_engaged_at: new Date().toISOString(),
        findings: [],
        routines: [],
      };

      await updateEngagementHistory(mockContext, mockAdapter, "company-1", history);

      expect(mockContext.state.set).toHaveBeenCalledWith(
        expect.objectContaining({
          scopeKind: "company",
          scopeId: "company-1",
          namespace: "memory-cache",
          stateKey: "engagement-history",
        }),
        null
      );
    });

    it("includes recent findings in markdown representation", async () => {
      mockAdapter.writeDocument.mockResolvedValue("doc-id");

      const now = new Date().toISOString();
      const history: EngagementHistory = {
        version: 1,
        company_id: "company-1",
        last_engaged_at: now,
        findings: [
          createFinding("run-1", "Assess", "Finding 1"),
          createFinding("run-1", "Assess", "Finding 2"),
        ],
        routines: [],
      };

      await updateEngagementHistory(mockContext, mockAdapter, "company-1", history);

      const call = mockAdapter.writeDocument.mock.calls[0];
      const markdown = call[2];
      expect(markdown).toContain("Finding 1");
      expect(markdown).toContain("Finding 2");
      expect(markdown).toContain("Assess");
    });
  });

  describe("recordFindingsToHistory", () => {
    it("appends findings to existing history", async () => {
      const existing: EngagementHistory = {
        version: 1,
        company_id: "company-1",
        last_engaged_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        findings: [createFinding("run-0", "Found", "Initial finding")],
        routines: [],
      };

      const existingMarkdown = `\`\`\`json\n${JSON.stringify(existing)}\n\`\`\``;
      mockContext.state.get.mockReturnValue(undefined);
      mockAdapter.getDocumentByKey.mockResolvedValue(existingMarkdown);
      mockAdapter.writeDocument.mockResolvedValue("doc-id");

      const newFindings = [createFinding("run-1", "Assess", "New finding from assess")];

      await recordFindingsToHistory(
        mockContext,
        mockAdapter,
        "company-1",
        "run-1",
        "Assess",
        newFindings
      );

      // Verify write was called
      expect(mockAdapter.writeDocument).toHaveBeenCalled();

      // Check that the written data includes both old and new findings
      const writeCall = mockAdapter.writeDocument.mock.calls[0];
      const markdown = writeCall[2];
      expect(markdown).toContain("Initial finding");
      expect(markdown).toContain("New finding from assess");
    });

    it("creates history if not exists", async () => {
      mockContext.state.get.mockReturnValue(undefined);
      mockAdapter.getDocumentByKey.mockResolvedValue(null);
      mockAdapter.writeDocument.mockResolvedValue("doc-id");

      const findings = [createFinding("run-1", "Found", "First finding")];

      await recordFindingsToHistory(
        mockContext,
        mockAdapter,
        "company-1",
        "run-1",
        "Found",
        findings
      );

      // Should have written the document
      expect(mockAdapter.writeDocument).toHaveBeenCalled();
    });

    it("updates last_engaged_at timestamp", async () => {
      const existingMarkdown = `\`\`\`json
{
  "version": 1,
  "company_id": "company-1",
  "last_engaged_at": "2026-01-01T00:00:00.000Z",
  "findings": [],
  "routines": []
}
\`\`\``;

      mockContext.state.get.mockReturnValue(undefined);
      mockAdapter.getDocumentByKey.mockResolvedValue(existingMarkdown);
      mockAdapter.writeDocument.mockResolvedValue("doc-id");

      const findings = [createFinding("run-1", "Assess", "New")];

      const before = new Date();
      await recordFindingsToHistory(
        mockContext,
        mockAdapter,
        "company-1",
        "run-1",
        "Assess",
        findings
      );
      const after = new Date();

      const writeCall = mockAdapter.writeDocument.mock.calls[0];
      const markdown = writeCall[2];

      // Extract last_engaged_at from markdown
      const jsonMatch = markdown.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        const engagementTime = new Date(parsed.last_engaged_at);
        expect(engagementTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(engagementTime.getTime()).toBeLessThanOrEqual(after.getTime());
      }
    });

    it("handles multiple findings in single record call", async () => {
      mockContext.state.get.mockReturnValue(undefined);
      mockAdapter.getDocumentByKey.mockResolvedValue(null);
      mockAdapter.writeDocument.mockResolvedValue("doc-id");

      const findings = [
        createFinding("run-1", "Assess", "Finding 1"),
        createFinding("run-1", "Assess", "Finding 2"),
        createFinding("run-1", "Assess", "Finding 3"),
      ];

      await recordFindingsToHistory(
        mockContext,
        mockAdapter,
        "company-1",
        "run-1",
        "Assess",
        findings
      );

      // Second writeDocument call is from updateEngagementHistory (after findings added)
      const writeCall = mockAdapter.writeDocument.mock.calls[1] || mockAdapter.writeDocument.mock.calls[0];
      const markdown = writeCall[2];

      expect(markdown).toContain("Finding 1");
      expect(markdown).toContain("Finding 2");
      expect(markdown).toContain("Finding 3");
    });
  });
});
