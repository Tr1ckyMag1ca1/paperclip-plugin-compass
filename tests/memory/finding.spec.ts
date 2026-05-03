import { describe, it, expect } from "vitest";
import {
  createFinding,
  transitionStatus,
  deduplicateAgainstOpenFindings,
  filterByStatus,
  filterByMode,
  filterByDateRange,
} from "../../src/memory/finding.js";
import type { Finding } from "../../src/types/memory.js";

describe("Finding Lifecycle Management", () => {
  describe("createFinding", () => {
    it("creates a new finding with open status", () => {
      const runId = "test-run-123";
      const finding = createFinding(runId, "Assess", "Test finding", ["issue-1", "issue-2"]);

      expect(finding.id).toBeTruthy();
      expect(finding.run_id).toBe(runId);
      expect(finding.mode).toBe("Assess");
      expect(finding.summary).toBe("Test finding");
      expect(finding.evidence_refs).toEqual(["issue-1", "issue-2"]);
      expect(finding.status).toBe("open");
      expect(finding.created_at).toBeTruthy();
      expect(finding.status_history).toHaveLength(1);
      expect(finding.status_history[0].from).toBeNull();
      expect(finding.status_history[0].to).toBe("open");
    });

    it("creates finding without evidence refs", () => {
      const finding = createFinding("run-1", "Found", "Simple finding");
      expect(finding.evidence_refs).toEqual([]);
    });

    it("generates unique IDs for each finding", () => {
      const f1 = createFinding("run-1", "Assess", "Finding 1");
      const f2 = createFinding("run-1", "Assess", "Finding 2");
      expect(f1.id).not.toBe(f2.id);
    });
  });

  describe("transitionStatus", () => {
    it("transitions from open to addressed", () => {
      const finding = createFinding("run-1", "Assess", "Test");
      const updated = transitionStatus(finding, "addressed", "run-2");

      expect(updated.status).toBe("addressed");
      expect(updated.status_history).toHaveLength(2);
      expect(updated.status_history[1].from).toBe("open");
      expect(updated.status_history[1].to).toBe("addressed");
      expect(updated.status_history[1].by_run_id).toBe("run-2");
    });

    it("transitions from open to invalidated", () => {
      const finding = createFinding("run-1", "Assess", "Test");
      const updated = transitionStatus(finding, "invalidated");

      expect(updated.status).toBe("invalidated");
      expect(updated.status_history).toHaveLength(2);
      expect(updated.status_history[1].to).toBe("invalidated");
    });

    it("throws when transitioning from addressed", () => {
      const finding = createFinding("run-1", "Assess", "Test");
      const addressed = transitionStatus(finding, "addressed");

      expect(() => {
        transitionStatus(addressed, "invalidated");
      }).toThrow(/terminal status/i);
    });

    it("throws when transitioning from invalidated", () => {
      const finding = createFinding("run-1", "Assess", "Test");
      const invalidated = transitionStatus(finding, "invalidated");

      expect(() => {
        transitionStatus(invalidated, "addressed");
      }).toThrow(/terminal status/i);
    });

    it("returns same object when transitioning to current status (idempotent)", () => {
      const finding = createFinding("run-1", "Assess", "Test");
      const sameStatus = transitionStatus(finding, "open");

      expect(sameStatus).toBe(finding); // same object reference
    });

    it("records byRunId in transition", () => {
      const finding = createFinding("run-1", "Assess", "Test");
      const updated = transitionStatus(finding, "addressed", "run-update-123");

      expect(updated.status_history[1].by_run_id).toBe("run-update-123");
    });

    it("records timestamp in transition", () => {
      const finding = createFinding("run-1", "Assess", "Test");
      const before = new Date();
      const updated = transitionStatus(finding, "addressed");
      const after = new Date();

      const transitionTime = new Date(updated.status_history[1].at);
      expect(transitionTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(transitionTime.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe("deduplicateAgainstOpenFindings", () => {
    it("includes findings not matching any open findings", () => {
      const newFindings: Finding[] = [
        createFinding("run-1", "Assess", "Different issue about performance"),
      ];
      const openFindings: Finding[] = [
        createFinding("run-0", "Assess", "Infrastructure blocker"),
      ];

      const result = deduplicateAgainstOpenFindings(newFindings, openFindings);
      expect(result).toHaveLength(1);
      expect(result[0].summary).toBe("Different issue about performance");
    });

    it("excludes findings with matching summaries", () => {
      const newFindings: Finding[] = [
        createFinding("run-1", "Assess", "Infrastructure blocker detected again"),
      ];
      const openFindings: Finding[] = [
        createFinding("run-0", "Assess", "Infrastructure blocker"),
      ];

      const result = deduplicateAgainstOpenFindings(newFindings, openFindings);
      expect(result).toHaveLength(0);
    });

    it("performs case-insensitive substring matching", () => {
      const newFindings: Finding[] = [
        createFinding("run-1", "Assess", "revenue model is broken"),
      ];
      const openFindings: Finding[] = [
        createFinding("run-0", "Assess", "revenue model"),
      ];

      const result = deduplicateAgainstOpenFindings(newFindings, openFindings);
      expect(result).toHaveLength(0);
    });

    it("returns all findings if no open findings to compare", () => {
      const newFindings: Finding[] = [
        createFinding("run-1", "Assess", "Finding 1"),
        createFinding("run-1", "Assess", "Finding 2"),
      ];

      const result = deduplicateAgainstOpenFindings(newFindings, []);
      expect(result).toHaveLength(2);
    });

    it("handles empty newFindings", () => {
      const openFindings: Finding[] = [
        createFinding("run-0", "Assess", "Something"),
      ];

      const result = deduplicateAgainstOpenFindings([], openFindings);
      expect(result).toHaveLength(0);
    });

    it("deduplicates multiple findings against multiple open findings", () => {
      const newFindings: Finding[] = [
        createFinding("run-1", "Assess", "Issue A is still open"),
        createFinding("run-1", "Assess", "Issue B is new"),
        createFinding("run-1", "Assess", "Issue C repeats from run-0"),
      ];
      const openFindings: Finding[] = [
        createFinding("run-0", "Assess", "Issue A"),
        createFinding("run-0", "Assess", "Issue C"),
      ];

      const result = deduplicateAgainstOpenFindings(newFindings, openFindings);
      expect(result).toHaveLength(1);
      expect(result[0].summary).toBe("Issue B is new");
    });
  });

  describe("filterByStatus", () => {
    it("filters findings by open status", () => {
      const f1 = createFinding("run-1", "Assess", "Open finding");
      const f2 = createFinding("run-1", "Assess", "Addressed finding");
      const f2addressed = transitionStatus(f2, "addressed");
      const findings = [f1, f2addressed];

      const result = filterByStatus(findings, "open");
      expect(result).toHaveLength(1);
      expect(result[0].summary).toBe("Open finding");
    });

    it("filters findings by addressed status", () => {
      const f1 = createFinding("run-1", "Assess", "Finding");
      const f1addressed = transitionStatus(f1, "addressed");

      const result = filterByStatus([f1addressed], "addressed");
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("addressed");
    });

    it("filters findings by invalidated status", () => {
      const f1 = createFinding("run-1", "Assess", "Finding");
      const f1invalidated = transitionStatus(f1, "invalidated");

      const result = filterByStatus([f1invalidated], "invalidated");
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("invalidated");
    });

    it("returns all findings when status is all", () => {
      const findings = [
        createFinding("run-1", "Assess", "F1"),
        transitionStatus(createFinding("run-1", "Assess", "F2"), "addressed"),
        transitionStatus(createFinding("run-1", "Assess", "F3"), "invalidated"),
      ];

      const result = filterByStatus(findings, "all");
      expect(result).toHaveLength(3);
    });
  });

  describe("filterByMode", () => {
    it("filters findings by Found mode", () => {
      const findings = [
        createFinding("run-1", "Found", "Founded"),
        createFinding("run-1", "Assess", "Assessed"),
      ];

      const result = filterByMode(findings, "Found");
      expect(result).toHaveLength(1);
      expect(result[0].mode).toBe("Found");
    });

    it("filters findings by Assess mode", () => {
      const findings = [
        createFinding("run-1", "Found", "Founded"),
        createFinding("run-1", "Assess", "Assessed"),
        createFinding("run-1", "Revive", "Revived"),
      ];

      const result = filterByMode(findings, "Assess");
      expect(result).toHaveLength(1);
      expect(result[0].mode).toBe("Assess");
    });

    it("filters findings by Revive mode", () => {
      const findings = [
        createFinding("run-1", "Revive", "Action executed"),
        createFinding("run-1", "Assess", "Drift detected"),
      ];

      const result = filterByMode(findings, "Revive");
      expect(result).toHaveLength(1);
      expect(result[0].mode).toBe("Revive");
    });

    it("filters findings by Reposition mode", () => {
      const findings = [
        createFinding("run-1", "Reposition", "Repositioned"),
        createFinding("run-1", "Assess", "Assessed"),
      ];

      const result = filterByMode(findings, "Reposition");
      expect(result).toHaveLength(1);
      expect(result[0].mode).toBe("Reposition");
    });

    it("returns all findings when mode is all", () => {
      const findings = [
        createFinding("run-1", "Found", "F1"),
        createFinding("run-1", "Assess", "F2"),
        createFinding("run-1", "Revive", "F3"),
        createFinding("run-1", "Reposition", "F4"),
      ];

      const result = filterByMode(findings, "all");
      expect(result).toHaveLength(4);
    });
  });

  describe("filterByDateRange", () => {
    it("filters findings within date range", () => {
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Create findings with different timestamps by mocking Date
      // For simplicity, we'll test the filtering logic with a single finding
      const finding = createFinding("run-1", "Assess", "Test");

      const result = filterByDateRange([finding], weekAgo, now);
      expect(result).toHaveLength(1);
    });

    it("excludes findings outside date range", () => {
      const now = new Date();
      const finding = createFinding("run-1", "Assess", "Test");

      // Future date range — should not include finding
      const future1 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const future2 = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const result = filterByDateRange([finding], future1, future2);
      expect(result).toHaveLength(0);
    });

    it("handles inclusive bounds", () => {
      const now = new Date();
      const finding = createFinding("run-1", "Assess", "Test");
      const findingTime = new Date(finding.created_at);

      // Range that exactly matches finding timestamp
      const result = filterByDateRange([finding], findingTime, findingTime);
      expect(result).toHaveLength(1);
    });

    it("filters multiple findings correctly", () => {
      const now = new Date();
      const pastWindow = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Create multiple findings
      const findings = [
        createFinding("run-1", "Assess", "F1"),
        createFinding("run-1", "Assess", "F2"),
        createFinding("run-1", "Assess", "F3"),
      ];

      const result = filterByDateRange(findings, pastWindow, now);
      expect(result).toHaveLength(3);
    });
  });
});
