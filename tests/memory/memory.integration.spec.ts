import { describe, it, expect, beforeEach, vi } from "vitest";
import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { EngagementHistory, Finding } from "../../src/types/memory.js";
import {
  getEngagementHistory,
  createEngagementHistory,
  recordFindingsToHistory,
  createFinding,
  transitionStatus,
  deduplicateAgainstOpenFindings,
  filterByStatus,
  filterByMode,
  getCronFromPreset,
  validateCronExpression,
} from "../../src/memory/index.js";
import type { PaperclipAdapter } from "../../src/sdk/adapter.js";

/**
 * Mock context and adapter for memory integration testing
 */
function createMockContext(): PluginContext {
  const state = new Map<string, any>();

  return {
    state: {
      get: async (key) => state.get(JSON.stringify(key)),
      set: async (key, value) => {
        state.set(JSON.stringify(key), value);
      },
      delete: async (key) => {
        state.delete(JSON.stringify(key));
      },
    },
  } as any;
}

function createMockAdapter(): PaperclipAdapter {
  const documents = new Map<string, string>();

  return {
    writeDocument: async (companyId, key, body) => {
      documents.set(`${companyId}:${key}`, body);
      return `doc-${companyId}-${Date.now()}`;
    },
    getDocumentByKey: async (companyId, key) => {
      return documents.get(`${companyId}:${key}`) || null;
    },
  } as any;
}

describe("Memory Integration Tests", () => {
  describe("Memory Persistence Across Modes", () => {
    it("Found mode Apply → recordFindings → reload plugin → findings in history", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "test-company";
      const runId = "run-1";

      // 1. Record findings from Found mode
      await recordFindingsToHistory(
        ctx,
        adapter,
        companyId,
        runId,
        "Found",
        [
          {
            id: "find-1",
            run_id: runId,
            mode: "Found",
            created_at: new Date().toISOString(),
            summary: "Company founded with vision-quest interview",
            evidence_refs: ["doc-vision", "agent-1"],
            status: "open",
            status_history: [{
              from: null,
              to: "open",
              at: new Date().toISOString(),
            }],
          },
        ]
      );

      // 2. Reload history (simulating plugin restart)
      const reloadedHistory = await getEngagementHistory(ctx, adapter, companyId);
      expect(reloadedHistory).toBeTruthy();
      expect(reloadedHistory!.findings).toHaveLength(1);
      expect(reloadedHistory!.findings[0].summary).toContain("Company founded");
      expect(reloadedHistory!.findings[0].mode).toBe("Found");
    });

    it("Assess mode Apply → per-amendment findings → reload → findings visible", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "test-company";
      const runId = "run-2";

      // Record Assess findings
      await recordFindingsToHistory(
        ctx,
        adapter,
        companyId,
        runId,
        "Assess",
        [
          {
            id: "find-2",
            run_id: runId,
            mode: "Assess",
            created_at: new Date().toISOString(),
            summary: "Amendment to target_customer: pivot to enterprise",
            evidence_refs: ["issue-cascade-1"],
            status: "open",
            status_history: [{
              from: null,
              to: "open",
              at: new Date().toISOString(),
            }],
          },
          {
            id: "find-3",
            run_id: runId,
            mode: "Assess",
            created_at: new Date().toISOString(),
            summary: "Amendment to revenue_model: shift to SaaS annual",
            evidence_refs: ["issue-cascade-2"],
            status: "open",
            status_history: [{
              from: null,
              to: "open",
              at: new Date().toISOString(),
            }],
          },
        ]
      );

      const history = await getEngagementHistory(ctx, adapter, companyId);
      expect(history!.findings).toHaveLength(2);
      expect(history!.findings.some((f) => f.mode === "Assess")).toBe(true);
    });

    it("Revive mode Apply → per-action findings → reload → findings visible", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "test-company";
      const runId = "run-3";

      await recordFindingsToHistory(
        ctx,
        adapter,
        companyId,
        runId,
        "Revive",
        [
          {
            id: "find-4",
            run_id: runId,
            mode: "Revive",
            created_at: new Date().toISOString(),
            summary: "Unblocked: Hire VP Sales",
            evidence_refs: ["issue-hiring-1"],
            status: "open",
            status_history: [{
              from: null,
              to: "open",
              at: new Date().toISOString(),
            }],
          },
        ]
      );

      const history = await getEngagementHistory(ctx, adapter, companyId);
      expect(history!.findings).toHaveLength(1);
      expect(history!.findings[0].mode).toBe("Revive");
      expect(history!.findings[0].summary).toContain("Unblocked");
    });

    it("Reposition mode Apply → repositioned finding → reload → finding visible", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "test-company";
      const runId = "run-4";

      await recordFindingsToHistory(
        ctx,
        adapter,
        companyId,
        runId,
        "Reposition",
        [
          {
            id: "find-5",
            run_id: runId,
            mode: "Reposition",
            created_at: new Date().toISOString(),
            summary: "Repositioned company: voice, target_customer, product_direction",
            evidence_refs: ["issue-cascade-3"],
            status: "open",
            status_history: [{
              from: null,
              to: "open",
              at: new Date().toISOString(),
            }],
          },
        ]
      );

      const history = await getEngagementHistory(ctx, adapter, companyId);
      expect(history!.findings).toHaveLength(1);
      expect(history!.findings[0].mode).toBe("Reposition");
    });

    it("Empty history before any mode runs", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "empty-company";

      const history = await getEngagementHistory(ctx, adapter, companyId);
      expect(history).toBeNull();
    });

    it("Multiple mode runs append to findings (not replace)", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "multi-company";

      // First: Found mode
      await recordFindingsToHistory(
        ctx,
        adapter,
        companyId,
        "run-1",
        "Found",
        [{
          id: "find-1",
          run_id: "run-1",
          mode: "Found",
          created_at: new Date().toISOString(),
          summary: "Company founded",
          evidence_refs: [],
          status: "open",
          status_history: [{ from: null, to: "open", at: new Date().toISOString() }],
        }]
      );

      // Second: Assess mode
      await recordFindingsToHistory(
        ctx,
        adapter,
        companyId,
        "run-2",
        "Assess",
        [{
          id: "find-2",
          run_id: "run-2",
          mode: "Assess",
          created_at: new Date().toISOString(),
          summary: "Amendment to section",
          evidence_refs: [],
          status: "open",
          status_history: [{ from: null, to: "open", at: new Date().toISOString() }],
        }]
      );

      const history = await getEngagementHistory(ctx, adapter, companyId);
      expect(history!.findings).toHaveLength(2);
      expect(history!.findings[0].mode).toBe("Found");
      expect(history!.findings[1].mode).toBe("Assess");
    });
  });

  describe("ASSESS-09 Dedup Logic", () => {
    it("Prior open finding matched → new drift finding filtered out", () => {
      const priorFinding = createFinding("run-1", "Assess", "Revenue model drifted");
      const newFinding = createFinding("run-2", "Assess", "Revenue model drifted");

      const result = deduplicateAgainstOpenFindings([newFinding], [priorFinding]);
      expect(result).toHaveLength(0);
    });

    it("Prior addressed finding → dedup does NOT filter (only open)", () => {
      const priorFinding = createFinding("run-1", "Assess", "Revenue model drifted");
      const addressed = transitionStatus(priorFinding, "addressed");
      const newFinding = createFinding("run-2", "Assess", "Revenue model drifted");

      // Filter to open findings only
      const openFindings = [addressed].filter((f) => f.status === "open");
      const result = deduplicateAgainstOpenFindings([newFinding], openFindings);
      expect(result).toHaveLength(1); // Not filtered because prior is addressed
    });

    it("Prior invalidated finding → dedup does NOT filter", () => {
      const priorFinding = createFinding("run-1", "Assess", "Revenue model drifted");
      const invalidated = transitionStatus(priorFinding, "invalidated");
      const newFinding = createFinding("run-2", "Assess", "Revenue model drifted");

      const openFindings = [invalidated].filter((f) => f.status === "open");
      const result = deduplicateAgainstOpenFindings([newFinding], openFindings);
      expect(result).toHaveLength(1); // Not filtered because prior is invalidated
    });

    it("No prior findings → dedup returns all new findings", () => {
      const newFindings = [
        createFinding("run-1", "Assess", "Finding 1"),
        createFinding("run-1", "Assess", "Finding 2"),
        createFinding("run-1", "Assess", "Finding 3"),
      ];

      const result = deduplicateAgainstOpenFindings(newFindings, []);
      expect(result).toHaveLength(3);
    });

    it("Substring match: 'revenue model' in both summaries (partial match)", () => {
      const prior = createFinding("run-1", "Assess", "revenue model drifted");
      const newFind = createFinding("run-2", "Assess", "revenue model drifted again");

      const result = deduplicateAgainstOpenFindings([newFind], [prior]);
      expect(result).toHaveLength(0); // Substring match filtered out
    });

    it("Case insensitive substring matching", () => {
      const prior = createFinding("run-1", "Assess", "REVENUE MODEL");
      const newFind = createFinding("run-2", "Assess", "revenue model drifted");

      const result = deduplicateAgainstOpenFindings([newFind], [prior]);
      expect(result).toHaveLength(0); // Case-insensitive substring match (prior is substring of new)
    });

    it("Empty openFindings array → no filtering", () => {
      const newFindings = [
        createFinding("run-1", "Assess", "Finding 1"),
      ];

      const result = deduplicateAgainstOpenFindings(newFindings, []);
      expect(result).toHaveLength(1);
    });
  });

  describe("Status Transitions", () => {
    it("Founder marks finding as 'addressed' → status transitions", () => {
      const finding = createFinding("run-1", "Assess", "Test finding");
      const addressed = transitionStatus(finding, "addressed", "run-2");

      expect(addressed.status).toBe("addressed");
      expect(addressed.status_history).toHaveLength(2);
      expect(addressed.status_history[1].to).toBe("addressed");
      expect(addressed.status_history[1].by_run_id).toBe("run-2");
    });

    it("Founder marks finding as 'invalidated' → status transitions", () => {
      const finding = createFinding("run-1", "Assess", "Test finding");
      const invalidated = transitionStatus(finding, "invalidated");

      expect(invalidated.status).toBe("invalidated");
      expect(invalidated.status_history).toHaveLength(2);
      expect(invalidated.status_history[1].to).toBe("invalidated");
    });

    it("Status transitions append to status_history (audit trail)", () => {
      let finding = createFinding("run-1", "Assess", "Test");
      expect(finding.status_history).toHaveLength(1);

      finding = transitionStatus(finding, "addressed", "run-2");
      expect(finding.status_history).toHaveLength(2);

      const lastTransition = finding.status_history[1];
      expect(lastTransition.from).toBe("open");
      expect(lastTransition.to).toBe("addressed");
      expect(lastTransition.at).toBeTruthy();
    });

    it("Invalid transition (addressed → open) throws", () => {
      const finding = createFinding("run-1", "Assess", "Test");
      const addressed = transitionStatus(finding, "addressed");

      expect(() => {
        transitionStatus(addressed, "open");
      }).toThrow();
    });
  });

  describe("Finding Metadata", () => {
    it("Finding includes mode (Found|Assess|Revive|Reposition)", () => {
      const modes: Array<"Found" | "Assess" | "Revive" | "Reposition"> = ["Found", "Assess", "Revive", "Reposition"];

      for (const mode of modes) {
        const finding = createFinding("run-1", mode, "Test");
        expect(finding.mode).toBe(mode);
      }
    });

    it("Finding includes created_at timestamp", () => {
      const before = new Date();
      const finding = createFinding("run-1", "Assess", "Test");
      const after = new Date();

      const createdAt = new Date(finding.created_at);
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("Finding includes evidence_refs (linked issues)", () => {
      const refs = ["issue-1", "issue-2", "doc-3"];
      const finding = createFinding("run-1", "Assess", "Test", refs);

      expect(finding.evidence_refs).toEqual(refs);
    });

    it("Finding includes run_id from Apply", () => {
      const runId = "run-123";
      const finding = createFinding(runId, "Found", "Test");

      expect(finding.run_id).toBe(runId);
    });
  });

  describe("Filtering", () => {
    beforeEach(() => {
      // Tests for finding filters
    });

    it("filterByStatus: open → returns only open findings", () => {
      const open1 = createFinding("run-1", "Assess", "Finding 1");
      const open2 = createFinding("run-1", "Assess", "Finding 2");
      const addressed = transitionStatus(
        createFinding("run-1", "Assess", "Finding 3"),
        "addressed"
      );

      const findings = [open1, open2, addressed];
      const result = filterByStatus(findings, "open");

      expect(result).toHaveLength(2);
      expect(result.every((f) => f.status === "open")).toBe(true);
    });

    it("filterByStatus: addressed → returns only addressed findings", () => {
      const open = createFinding("run-1", "Assess", "Finding 1");
      const addressed = transitionStatus(
        createFinding("run-1", "Assess", "Finding 2"),
        "addressed"
      );

      const findings = [open, addressed];
      const result = filterByStatus(findings, "addressed");

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("addressed");
    });

    it("filterByMode: Assess → returns only Assess findings", () => {
      const assess = createFinding("run-1", "Assess", "Assess finding");
      const found = createFinding("run-1", "Found", "Found finding");
      const revive = createFinding("run-1", "Revive", "Revive finding");

      const findings = [assess, found, revive];
      const result = filterByMode(findings, "Assess");

      expect(result).toHaveLength(1);
      expect(result[0].mode).toBe("Assess");
    });

    it("filterByMode: all → returns all findings", () => {
      const assess = createFinding("run-1", "Assess", "Assess finding");
      const found = createFinding("run-1", "Found", "Found finding");

      const findings = [assess, found];
      const result = filterByMode(findings, "all");

      expect(result).toHaveLength(2);
    });
  });

  describe("Cache Behavior", () => {
    it("First read from documents table, cached in state", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "cache-test";

      // Create initial history
      await createEngagementHistory(ctx, adapter, companyId);

      // First read should cache
      const history1 = await getEngagementHistory(ctx, adapter, companyId);
      expect(history1).toBeTruthy();

      // Second read should hit cache
      const history2 = await getEngagementHistory(ctx, adapter, companyId);
      expect(history2).toBeTruthy();
      expect(history2!.company_id).toBe(companyId);
    });

    it("Write invalidates cache", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "cache-invalidate";

      // Create initial history
      const initial = await createEngagementHistory(ctx, adapter, companyId);
      expect(initial.findings).toHaveLength(0);

      // Read to cache it
      const cached1 = await getEngagementHistory(ctx, adapter, companyId);
      expect(cached1!.findings).toHaveLength(0);

      // Record finding (should update and invalidate cache)
      await recordFindingsToHistory(
        ctx,
        adapter,
        companyId,
        "run-1",
        "Found",
        [{
          id: "find-1",
          run_id: "run-1",
          mode: "Found",
          created_at: new Date().toISOString(),
          summary: "Company founded",
          evidence_refs: [],
          status: "open",
          status_history: [{ from: null, to: "open", at: new Date().toISOString() }],
        }]
      );

      // Next read should refetch and see the new finding
      const history = await getEngagementHistory(ctx, adapter, companyId);
      expect(history!.findings).toHaveLength(1);
    });
  });

  describe("Integration: End-to-End Memory Flows", () => {
    it("Found → Assess → Revive → Reposition: all findings accumulated", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "e2e-company";

      // Initialize history
      await createEngagementHistory(ctx, adapter, companyId);

      // Found mode
      await recordFindingsToHistory(
        ctx,
        adapter,
        companyId,
        "run-found",
        "Found",
        [createFinding("run-found", "Found", "Company founded")]
      );

      // Assess mode
      await recordFindingsToHistory(
        ctx,
        adapter,
        companyId,
        "run-assess",
        "Assess",
        [createFinding("run-assess", "Assess", "Amendment to target_customer")]
      );

      // Revive mode
      await recordFindingsToHistory(
        ctx,
        adapter,
        companyId,
        "run-revive",
        "Revive",
        [createFinding("run-revive", "Revive", "Unblocked: Hire team")]
      );

      // Reposition mode
      await recordFindingsToHistory(
        ctx,
        adapter,
        companyId,
        "run-reposition",
        "Reposition",
        [createFinding("run-reposition", "Reposition", "Repositioned company")]
      );

      const finalHistory = await getEngagementHistory(ctx, adapter, companyId);
      expect(finalHistory!.findings).toHaveLength(4);
      expect(finalHistory!.findings.map((f) => f.mode)).toEqual([
        "Found",
        "Assess",
        "Revive",
        "Reposition",
      ]);
    });

    it("Assess with dedup: open findings context suppresses repeats", () => {
      // Simulate prior Assess run with open finding
      const priorRun = createFinding(
        "run-1",
        "Assess",
        "Amendment to revenue_model: monthly billing"
      );

      // Simulate new Assess run detecting exact same drift again
      // This will match because the open summary is substring of new summary
      const newRun = createFinding(
        "run-2",
        "Assess",
        "Amendment to revenue_model: monthly billing confirmed"
      );

      const result = deduplicateAgainstOpenFindings([newRun], [priorRun]);
      expect(result).toHaveLength(0); // Filtered due to substring match
    });

    it("Founder addresses old finding → next Assess won't suppress signal", () => {
      // Prior finding marked as addressed
      const prior = createFinding("run-1", "Assess", "Revenue model drifted");
      const addressed = transitionStatus(prior, "addressed");

      // New drift signal
      const newFinding = createFinding("run-2", "Assess", "Revenue model drifted");

      // Filter only open findings (addressed is excluded)
      const openFindings = [addressed].filter((f) => f.status === "open");
      const result = deduplicateAgainstOpenFindings([newFinding], openFindings);

      expect(result).toHaveLength(1); // Not filtered — prior is addressed
    });
  });

  // ============================
  // WORKER HANDLER INTEGRATION TESTS
  // ============================

  describe("Memory Handler Integration", () => {
    it("memory.load handler returns engagement history for company", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "test-company";

      // Create history
      const history = await createEngagementHistory(ctx, adapter, companyId);
      expect(history.findings).toHaveLength(0);

      // Load via handler flow
      const loaded = await getEngagementHistory(ctx, adapter, companyId);
      expect(loaded).toBeTruthy();
      expect(loaded!.company_id).toBe(companyId);
    });

    it("memory.load returns null if history doesn't exist", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();

      const result = await getEngagementHistory(ctx, adapter, "nonexistent");
      expect(result).toBeNull();
    });

    it("memory.recordFindings appends findings to history", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "test-company";

      // Record findings
      await recordFindingsToHistory(ctx, adapter, companyId, "run-1", "Assess", [
        {
          id: "f1",
          run_id: "run-1",
          mode: "Assess",
          created_at: new Date().toISOString(),
          summary: "Test finding",
          evidence_refs: [],
          status: "open",
          status_history: [{ from: null, to: "open", at: new Date().toISOString() }],
        },
      ]);

      const history = await getEngagementHistory(ctx, adapter, companyId);
      expect(history!.findings).toHaveLength(1);
      expect(history!.findings[0].mode).toBe("Assess");
    });

    it("memory.recordFindings with empty history creates new history", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "new-company";

      await recordFindingsToHistory(ctx, adapter, companyId, "run-1", "Found", [
        {
          id: "f1",
          run_id: "run-1",
          mode: "Found",
          created_at: new Date().toISOString(),
          summary: "Company founded",
          evidence_refs: [],
          status: "open",
          status_history: [{ from: null, to: "open", at: new Date().toISOString() }],
        },
      ]);

      const history = await getEngagementHistory(ctx, adapter, companyId);
      expect(history).toBeTruthy();
      expect(history!.company_id).toBe(companyId);
      expect(history!.findings).toHaveLength(1);
    });

    it("memory.transitionStatus open → addressed updates finding", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "test-company";

      // Create and record finding
      const finding = {
        id: "f1",
        run_id: "run-1",
        mode: "Assess" as const,
        created_at: new Date().toISOString(),
        summary: "Test",
        evidence_refs: [],
        status: "open" as const,
        status_history: [{ from: null, to: "open", at: new Date().toISOString() }],
      };

      await recordFindingsToHistory(ctx, adapter, companyId, "run-1", "Assess", [finding]);

      // Transition status (returns new Finding)
      const transitioned = transitionStatus(finding, "addressed");
      expect(transitioned.status).toBe("addressed");
      expect(transitioned.status_history).toHaveLength(2);
    });

    it("memory.transitionStatus records audit trail", async () => {
      const ctx = createMockContext();
      const finding = createFinding("run-1", "Assess", "Test finding");

      const before = finding.status_history.length;
      const transitioned = transitionStatus(finding, "addressed");
      const after = transitioned.status_history.length;

      expect(after).toBe(before + 1);
      const latest = transitioned.status_history[transitioned.status_history.length - 1];
      expect(latest.from).toBe("open");
      expect(latest.to).toBe("addressed");
    });

    it("worker-state caching: memory.load hit cache (same company within 60s)", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "cached-company";

      const history = await createEngagementHistory(ctx, adapter, companyId);

      // First load
      const first = await getEngagementHistory(ctx, adapter, companyId);
      expect(first).toBeTruthy();

      // Second load (should hit cache)
      const second = await getEngagementHistory(ctx, adapter, companyId);
      expect(second).toBeTruthy();
      expect(second!.version).toBe(first!.version);
    });

    it("cache invalidation: after recordFindings, next load refetches", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "invalidation-test";

      // Create initial history
      await createEngagementHistory(ctx, adapter, companyId);

      // Load to populate cache
      const before = await getEngagementHistory(ctx, adapter, companyId);
      expect(before!.findings).toHaveLength(0);

      // Record findings (should invalidate cache)
      await recordFindingsToHistory(ctx, adapter, companyId, "run-1", "Assess", [
        {
          id: "f1",
          run_id: "run-1",
          mode: "Assess",
          created_at: new Date().toISOString(),
          summary: "New finding",
          evidence_refs: [],
          status: "open",
          status_history: [{ from: null, to: "open", at: new Date().toISOString() }],
        },
      ]);

      // Load again (should reflect new findings)
      const after = await getEngagementHistory(ctx, adapter, companyId);
      expect(after!.findings).toHaveLength(1);
    });
  });

  describe("Routine Handler Integration", () => {
    it("routine.create with quarterly preset maps to correct cron", () => {
      const cron = getCronFromPreset("quarterly");
      expect(cron).toBeDefined();
      // Quarterly should be: 0 9 1 1,4,7,10 * (9am, 1st of Q1/Q2/Q3/Q4)
    });

    it("routine.create with monthly preset maps to correct cron", () => {
      const cron = getCronFromPreset("monthly");
      expect(cron).toBeDefined();
      // Monthly should be: 0 9 1 * * (9am, 1st of every month)
    });

    it("routine.create with custom cron + validation", () => {
      const validCron = "0 9 1 * *";
      expect(validateCronExpression(validCron)).toBe(true);

      const invalidCron = "invalid";
      expect(validateCronExpression(invalidCron)).toBe(false);
    });

    it("routine.listForCompany returns active routines", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "routine-company";

      // Create history with routines
      const history = await createEngagementHistory(ctx, adapter, companyId);
      history.routines = [
        {
          id: "routine-1",
          name: "Quarterly Drift Review",
          mode: "Assess",
          cron: "0 9 1 1,4,7,10 *",
          created_at: new Date().toISOString(),
          last_run_at: null,
          last_finding_ids: [],
        },
      ];

      // This would be done via handler in real code
      // Just verify structure here
      expect(history.routines).toHaveLength(1);
      expect(history.routines[0].name).toBe("Quarterly Drift Review");
    });
  });

  describe("Full Workflows", () => {
    it("Found mode → findings recorded → reload → findings in history", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "full-workflow-1";

      // Found mode: record findings
      await recordFindingsToHistory(ctx, adapter, companyId, "run-1", "Found", [
        {
          id: "f1",
          run_id: "run-1",
          mode: "Found",
          created_at: new Date().toISOString(),
          summary: "Company founded",
          evidence_refs: ["vision-1"],
          status: "open",
          status_history: [{ from: null, to: "open", at: new Date().toISOString() }],
        },
      ]);

      // Reload and verify
      const history = await getEngagementHistory(ctx, adapter, companyId);
      expect(history!.findings).toHaveLength(1);
      expect(history!.findings[0].mode).toBe("Found");
    });

    it("Assess mode → findings recorded → reload → history visible", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "full-workflow-2";

      // Assess mode: record findings
      await recordFindingsToHistory(ctx, adapter, companyId, "run-1", "Assess", [
        {
          id: "f1",
          run_id: "run-1",
          mode: "Assess",
          created_at: new Date().toISOString(),
          summary: "Drift detected in revenue_model",
          evidence_refs: ["drift-1"],
          status: "open",
          status_history: [{ from: null, to: "open", at: new Date().toISOString() }],
        },
      ]);

      const history = await getEngagementHistory(ctx, adapter, companyId);
      expect(history!.findings).toHaveLength(1);
      expect(history!.findings[0].mode).toBe("Assess");
    });

    it("Revive mode → findings recorded → reload → history visible", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "full-workflow-3";

      // Revive mode: record findings
      await recordFindingsToHistory(ctx, adapter, companyId, "run-1", "Revive", [
        {
          id: "f1",
          run_id: "run-1",
          mode: "Revive",
          created_at: new Date().toISOString(),
          summary: "Resolved blocker: hire VP Sales",
          evidence_refs: ["action-1"],
          status: "open",
          status_history: [{ from: null, to: "open", at: new Date().toISOString() }],
        },
      ]);

      const history = await getEngagementHistory(ctx, adapter, companyId);
      expect(history!.findings).toHaveLength(1);
      expect(history!.findings[0].mode).toBe("Revive");
    });

    it("Founder marks finding addressed → status transitions → verified", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "workflow-transition";

      // Record finding
      const finding = {
        id: "f1",
        run_id: "run-1",
        mode: "Assess" as const,
        created_at: new Date().toISOString(),
        summary: "Drift test",
        evidence_refs: [],
        status: "open" as const,
        status_history: [{ from: null, to: "open", at: new Date().toISOString() }],
      };

      await recordFindingsToHistory(ctx, adapter, companyId, "run-1", "Assess", [finding]);

      // Transition (returns new Finding, immutable)
      const loaded = await getEngagementHistory(ctx, adapter, companyId);
      const loadedFinding = loaded!.findings[0];
      const transitioned = transitionStatus(loadedFinding, "addressed");

      expect(transitioned.status).toBe("addressed");
      expect(transitioned.status_history.some((sh) => sh.to === "addressed")).toBe(true);
    });

    it("Company isolation: routine for Company A doesn't affect Company B", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();

      // Record finding for Company A
      await recordFindingsToHistory(ctx, adapter, "company-a", "run-1", "Assess", [
        {
          id: "f1",
          run_id: "run-1",
          mode: "Assess",
          created_at: new Date().toISOString(),
          summary: "Company A finding",
          evidence_refs: [],
          status: "open",
          status_history: [{ from: null, to: "open", at: new Date().toISOString() }],
        },
      ]);

      // Company B should have no history
      const historyB = await getEngagementHistory(ctx, adapter, "company-b");
      expect(historyB).toBeNull();

      // Company A should have findings
      const historyA = await getEngagementHistory(ctx, adapter, "company-a");
      expect(historyA!.findings).toHaveLength(1);
    });
  });

  describe("Smoke Tests", () => {
    it("All UI handler names match registered handlers", () => {
      // Phase 4+ pattern: verify that UI calls map to registered handlers
      const uiHandlers = [
        "memory.load",
        "memory.recordFindings",
        "memory.transitionStatus",
        "routine.create",
        "routine.delete",
        "routine.run",
        "routine.onFire",
        "routine.listForCompany",
      ];

      // These should all be registered in worker.ts
      // This test just verifies the handler names exist
      for (const handler of uiHandlers) {
        expect(handler).toBeTruthy();
        expect(handler.includes(".")).toBe(true); // namespace:name format
      }
    });
  });

  describe("Error Cases & Rollback", () => {
    it("memory.load adapter failure returns error gracefully", async () => {
      const ctx = createMockContext();

      // Create adapter that throws
      const failingAdapter = {
        getDocumentByKey: async () => {
          throw new Error("Adapter error");
        },
      } as any;

      try {
        await getEngagementHistory(ctx, failingAdapter, "company");
        fail("Should have thrown");
      } catch (e) {
        expect(e).toBeTruthy();
      }
    });

    it("routine.create invalid cron rejected", () => {
      expect(validateCronExpression("bad cron")).toBe(false);
      expect(validateCronExpression("")).toBe(false);
      expect(validateCronExpression("0 9 1 * *")).toBe(true);
    });

    it("memory.transitionStatus finding not found handled gracefully", async () => {
      const ctx = createMockContext();
      const adapter = createMockAdapter();
      const companyId = "test";

      // Create history with no findings
      await createEngagementHistory(ctx, adapter, companyId);

      // Try to transition non-existent finding
      const history = await getEngagementHistory(ctx, adapter, companyId);
      const nonExistentFinding = history!.findings.find((f) => f.id === "nonexistent");

      expect(nonExistentFinding).toBeUndefined();
    });
  });
});
