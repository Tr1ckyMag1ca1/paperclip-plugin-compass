import { describe, it, expect } from "vitest";
import {
  classifyStall,
  scoreBlockerSeverity,
  scoreDriftConfidence,
  scoreIntegrationHealth,
  scoreGovernanceLoop,
  scoreAgentHealth,
} from "../../src/revive/classify.js";
import type {
  InventorySnapshot,
  Agent,
  Issue,
} from "../../src/types.js";
import type {
  ParsedVision,
  ActivitySnapshot,
  DriftReport,
} from "../../src/types/assess.js";

/**
 * Minimal test fixtures for classify.ts heuristics.
 * Each test case builds a fixture with specific characteristics to trigger
 * one of the 5 causes.
 */

// Helper: empty VISION (placeholder)
const emptyVision: ParsedVision = {
  mission: "Build things",
  mandate: "Do good",
  voice: "Direct",
  principles: "Move fast",
  success_criteria_12mo: "1M users",
  vision_3year: "Global scale",
  target_customer: "Everyone",
  issue_structure: "GitHub",
  locality: "SF",
  revenue_model: "B2B",
  launch_plan: "Beta",
  trust_governance: "Transparent",
  growth_strategy: "Viral",
  sales_model: "Direct",
  product_direction: "AI-first",
  org_structure: "Flat",
  operating_philosophy: "Autonomous",
  ceo_mandate: "Ship fast",
  success_criteria: "Profitability",
};

// Helper: empty activity (no issues, comments, documents)
const emptyActivity: ActivitySnapshot = {
  issues: [],
  comments: [],
  documents: [],
  totalItemCount: 0,
  windowStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  windowEndDate: new Date(),
};

describe("Revive Mode: Stall Cause Classification", () => {
  // ===== BLOCKER CAUSE TESTS =====

  describe("scoreBlockerSeverity (single-blocker cause)", () => {
    it("returns 0 if no issues are stuck > 14 days", () => {
      const snapshot: InventorySnapshot = {
        companyId: "test-company",
        agents: [],
        agentCount: 0,
        documents: [],
        visionExists: true,
        recentIssues: [
          {
            id: "issue-1",
            title: "Minor task",
            description: "Only 5 days old",
            status: "todo" as const,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          } as any as Issue,
        ],
        recentIssueCount: 1,
        latestHeartbeat: new Date(),
        blockerCount: 0,
      };

      const score = scoreBlockerSeverity(snapshot, emptyActivity);
      expect(score).toBe(0);
    });

    it("returns > 0 if issue stuck > 14 days with 3+ downstream", () => {
      const now = new Date();
      const snapshot: InventorySnapshot = {
        companyId: "test-company",
        agents: [],
        agentCount: 0,
        documents: [],
        visionExists: true,
        recentIssues: [
          {
            id: "blocker-issue",
            title: "Critical blocker",
            description: "Stuck for 20 days",
            status: "todo" as const,
            createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          } as any as Issue,
          {
            id: "downstream-1",
            title: "Depends on blocker-issue",
            description: "Waiting for blocker-issue to resolve",
            status: "todo" as const,
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          } as any as Issue,
          {
            id: "downstream-2",
            title: "Also blocked by blocker-issue",
            description: "Blocked by blocker-issue",
            status: "todo" as const,
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          } as any as Issue,
          {
            id: "downstream-3",
            title: "Third dependency",
            description: "Related to blocker-issue fix",
            status: "todo" as const,
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          } as any as Issue,
        ],
        recentIssueCount: 4,
        latestHeartbeat: new Date(),
        blockerCount: 1,
      };

      const score = scoreBlockerSeverity(snapshot, emptyActivity);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it("returns low score if issue stuck 13 days (just under threshold)", () => {
      const snapshot: InventorySnapshot = {
        companyId: "test-company",
        agents: [],
        agentCount: 0,
        documents: [],
        visionExists: true,
        recentIssues: [
          {
            id: "almost-stuck",
            title: "13 day old issue",
            description: "Just under threshold",
            status: "todo" as const,
            createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
          } as any as Issue,
        ],
        recentIssueCount: 1,
        latestHeartbeat: new Date(),
        blockerCount: 0,
      };

      const score = scoreBlockerSeverity(snapshot, emptyActivity);
      expect(score).toBe(0);
    });

    it("increases score with longer stuck duration", () => {
      const buildSnapshot = (daysStuck: number, downstreamCount: number) => {
        const now = new Date();
        const issues: Issue[] = [
          {
            id: "blocker",
            title: `Stuck ${daysStuck} days`,
            description: "Main blocker",
            status: "todo" as const,
            createdAt: new Date(now.getTime() - daysStuck * 24 * 60 * 60 * 1000).toISOString(),
          } as any as Issue,
        ];

        // Add downstream issues
        for (let i = 0; i < downstreamCount; i++) {
          issues.push({
            id: `downstream-${i}`,
            title: `Downstream ${i}`,
            description: "Related to blocker",
            status: "todo" as const,
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          } as any as Issue);
        }

        return {
          companyId: "test",
          agents: [],
          agentCount: 0,
          documents: [],
          visionExists: true,
          recentIssues: issues,
          recentIssueCount: issues.length,
          latestHeartbeat: new Date(),
          blockerCount: 1,
        } as InventorySnapshot;
      };

      const score20days = scoreBlockerSeverity(
        buildSnapshot(20, 3),
        emptyActivity
      );
      const score30days = scoreBlockerSeverity(
        buildSnapshot(30, 3),
        emptyActivity
      );

      expect(score20days).toBeGreaterThan(0);
      expect(score30days).toBeGreaterThanOrEqual(score20days);
    });
  });

  // ===== DRIFT CAUSE TESTS =====

  describe("scoreDriftConfidence (strategic-drift cause)", () => {
    it("returns 0 if no drift report provided", () => {
      const score = scoreDriftConfidence(undefined);
      expect(score).toBe(0);
    });

    it("returns 0 if drift report has no high-confidence items (< 0.7)", () => {
      const driftReport: DriftReport = {
        items: [
          {
            visionSection: "mission" as any,
            confidence: 0.4,
            severity: "info" as const,
            evidence: [],
            proposedAmendment: "Lower confidence",
            explanation: "Low confidence drift",
          },
        ],
        runId: "run-123",
        generatedAt: new Date().toISOString(),
        companyId: "test",
        confidenceThreshold: 0.5,
        totalItemsDetected: 1,
      };

      const score = scoreDriftConfidence(driftReport);
      expect(score).toBe(0);
    });

    it("returns > 0 if drift report has 3+ high-confidence items (>= 0.7)", () => {
      const driftReport: DriftReport = {
        items: [
          {
            visionSection: "mission" as any,
            confidence: 0.8,
            severity: "warn" as const,
            evidence: [],
            proposedAmendment: "Update 1",
            explanation: "Drift 1",
          },
          {
            visionSection: "mandate" as any,
            confidence: 0.75,
            severity: "warn" as const,
            evidence: [],
            proposedAmendment: "Update 2",
            explanation: "Drift 2",
          },
          {
            visionSection: "voice" as any,
            confidence: 0.72,
            severity: "warn" as const,
            evidence: [],
            proposedAmendment: "Update 3",
            explanation: "Drift 3",
          },
        ],
        runId: "run-123",
        generatedAt: new Date().toISOString(),
        companyId: "test",
        confidenceThreshold: 0.5,
        totalItemsDetected: 3,
      };

      const score = scoreDriftConfidence(driftReport);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it("returns lower score if only 1 high-confidence item (vs 3+ items)", () => {
      const driftReport: DriftReport = {
        items: [
          {
            visionSection: "mission" as any,
            confidence: 0.8,
            severity: "warn" as const,
            evidence: [],
            proposedAmendment: "Update",
            explanation: "Single high-confidence drift",
          },
        ],
        runId: "run-123",
        generatedAt: new Date().toISOString(),
        companyId: "test",
        confidenceThreshold: 0.5,
        totalItemsDetected: 1,
      };

      const singleScore = scoreDriftConfidence(driftReport);

      // Compare to 3+ items scenario
      const multiReport: DriftReport = {
        items: [
          {
            visionSection: "mission" as any,
            confidence: 0.8,
            severity: "warn" as const,
            evidence: [],
            proposedAmendment: "Update",
            explanation: "Multi drift",
          },
          {
            visionSection: "mandate" as any,
            confidence: 0.8,
            severity: "warn" as const,
            evidence: [],
            proposedAmendment: "Update",
            explanation: "Multi drift",
          },
          {
            visionSection: "voice" as any,
            confidence: 0.8,
            severity: "warn" as const,
            evidence: [],
            proposedAmendment: "Update",
            explanation: "Multi drift",
          },
        ],
        runId: "run-123",
        generatedAt: new Date().toISOString(),
        companyId: "test",
        confidenceThreshold: 0.5,
        totalItemsDetected: 3,
      };

      const multiScore = scoreDriftConfidence(multiReport);
      expect(singleScore).toBeLessThan(multiScore); // Single item scores lower
    });
  });

  // ===== INTEGRATION CAUSE TESTS =====

  describe("scoreIntegrationHealth (broken-integration cause)", () => {
    it("returns 0 if no error keywords in comments", () => {
      const snapshot: InventorySnapshot = {
        companyId: "test",
        agents: [],
        agentCount: 0,
        documents: [],
        visionExists: true,
        recentIssues: [],
        recentIssueCount: 0,
        latestHeartbeat: new Date(),
        blockerCount: 0,
      };

      const activity: ActivitySnapshot = {
        issues: [],
        comments: [
          {
            id: "comment-1",
            type: "comment" as const,
            content: "Great work on the refactor!",
            createdAt: new Date().toISOString(),
            authorId: "user-1",
          },
        ],
        documents: [],
        totalItemCount: 1,
        windowStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        windowEndDate: new Date(),
      };

      const score = scoreIntegrationHealth(snapshot, activity);
      expect(score).toBe(0);
    });

    it("returns > 0 if error keywords found in comments", () => {
      const snapshot: InventorySnapshot = {
        companyId: "test",
        agents: [],
        agentCount: 0,
        documents: [],
        visionExists: true,
        recentIssues: [],
        recentIssueCount: 0,
        latestHeartbeat: new Date(),
        blockerCount: 0,
      };

      const activity: ActivitySnapshot = {
        issues: [],
        comments: [
          {
            id: "comment-1",
            type: "comment" as const,
            content: "SDK integration failing, adapter throws error on connection",
            createdAt: new Date().toISOString(),
            authorId: "user-1",
          },
        ],
        documents: [],
        totalItemCount: 1,
        windowStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        windowEndDate: new Date(),
      };

      const score = scoreIntegrationHealth(snapshot, activity);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  // ===== GOVERNANCE LOOP CAUSE TESTS =====

  describe("scoreGovernanceLoop (governance-loop cause)", () => {
    it("returns 0 if 'needs review' appears < 3 times", () => {
      const activity: ActivitySnapshot = {
        issues: [],
        comments: [
          {
            id: "c1",
            type: "comment" as const,
            content: "Marked as needs review",
            createdAt: new Date().toISOString(),
            authorId: "user-1",
          },
          {
            id: "c2",
            type: "comment" as const,
            content: "Now in review again",
            createdAt: new Date().toISOString(),
            authorId: "user-1",
          },
        ],
        documents: [],
        totalItemCount: 2,
        windowStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        windowEndDate: new Date(),
      };

      const score = scoreGovernanceLoop(activity);
      expect(score).toBe(0);
    });

    it("returns > 0 if 'needs review' appears 3+ times", () => {
      const activity: ActivitySnapshot = {
        issues: [],
        comments: [
          {
            id: "c1",
            type: "comment" as const,
            content: "Marked as needs review",
            createdAt: new Date().toISOString(),
            authorId: "user-1",
          },
          {
            id: "c2",
            type: "comment" as const,
            content: "Back in review again",
            createdAt: new Date().toISOString(),
            authorId: "user-1",
          },
          {
            id: "c3",
            type: "comment" as const,
            content: "Still needs review",
            createdAt: new Date().toISOString(),
            authorId: "user-1",
          },
          {
            id: "c4",
            type: "comment" as const,
            content: "needs review one more time",
            createdAt: new Date().toISOString(),
            authorId: "user-1",
          },
        ],
        documents: [],
        totalItemCount: 4,
        windowStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        windowEndDate: new Date(),
      };

      const score = scoreGovernanceLoop(activity);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  // ===== DEAD AGENT CAUSE TESTS =====

  describe("scoreAgentHealth (dead-agent cause)", () => {
    it("returns 0 if agents have recent heartbeats", () => {
      const snapshot: InventorySnapshot = {
        companyId: "test",
        agents: [
          {
            id: "agent-1",
            name: "Active Agent",
            role: "Engineer",
            status: "active" as const,
            lastHeartbeatAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          } as any as Agent,
        ],
        agentCount: 1,
        documents: [],
        visionExists: true,
        recentIssues: [
          {
            id: "issue-1",
            title: "Task for agent-1",
            description: "Open task",
            status: "todo" as const,
            assigneeAgentId: "agent-1",
            createdAt: new Date().toISOString(),
          } as any as Issue,
        ],
        recentIssueCount: 1,
        latestHeartbeat: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        blockerCount: 0,
      };

      const score = scoreAgentHealth(snapshot, emptyActivity);
      expect(score).toBe(0);
    });

    it("returns > 0 if agent has no heartbeat > 30 days with open issues", () => {
      const snapshot: InventorySnapshot = {
        companyId: "test",
        agents: [
          {
            id: "agent-dead",
            name: "Dead Agent",
            role: "Engineer",
            status: "inactive" as const,
            lastHeartbeatAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
          } as any as Agent,
        ],
        agentCount: 1,
        documents: [],
        visionExists: true,
        recentIssues: [
          {
            id: "issue-1",
            title: "Unfinished task",
            description: "Open",
            status: "todo" as const,
            assigneeAgentId: "agent-dead",
            createdAt: new Date().toISOString(),
          } as any as Issue,
        ],
        recentIssueCount: 1,
        latestHeartbeat: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        blockerCount: 0,
      };

      const score = scoreAgentHealth(snapshot, emptyActivity);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it("returns 0 if stale agent has no assigned open issues", () => {
      const snapshot: InventorySnapshot = {
        companyId: "test",
        agents: [
          {
            id: "agent-idle",
            name: "Idle Agent",
            role: "Engineer",
            status: "inactive" as const,
            lastHeartbeatAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
          } as any as Agent,
        ],
        agentCount: 1,
        documents: [],
        visionExists: true,
        recentIssues: [], // No issues assigned to this agent
        recentIssueCount: 0,
        latestHeartbeat: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        blockerCount: 0,
      };

      const score = scoreAgentHealth(snapshot, emptyActivity);
      expect(score).toBe(0);
    });
  });

  // ===== FULL CLASSIFICATION TESTS =====

  describe("classifyStall (full classification)", () => {
    it("returns empty causes array if no stall detected", () => {
      const healthySnapshot: InventorySnapshot = {
        companyId: "healthy-company",
        agents: [
          {
            id: "agent-1",
            name: "Alice",
            role: "Engineer",
            status: "active" as const,
            lastHeartbeatAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          } as any as Agent,
        ],
        agentCount: 1,
        documents: [],
        visionExists: true,
        recentIssues: [
          {
            id: "task-1",
            title: "Feature: Add dark mode",
            description: "New feature request",
            status: "in_progress" as const,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          } as any as Issue,
        ],
        recentIssueCount: 1,
        latestHeartbeat: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        blockerCount: 0,
      };

      const classification = classifyStall(
        healthySnapshot,
        emptyVision,
        emptyActivity
      );

      expect(classification.companyId).toBe("healthy-company");
      expect(classification.causes.length).toBe(0);
    });

    it("returns single-blocker as top cause when blocker score is highest", () => {
      const now = new Date();
      const blockerSnapshot: InventorySnapshot = {
        companyId: "blocker-company",
        agents: [
          {
            id: "agent-1",
            name: "Alice",
            role: "Engineer",
            status: "active" as const,
            lastHeartbeatAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          } as any as Agent,
        ],
        agentCount: 1,
        documents: [],
        visionExists: true,
        recentIssues: [
          {
            id: "blocker",
            title: "Critical: Payment system broken",
            description: "Stuck for 20 days",
            status: "todo" as const,
            createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          } as any as Issue,
          {
            id: "downstream-1",
            title: "Blocked by blocker",
            description: "Related to blocker issue",
            status: "todo" as const,
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          } as any as Issue,
          {
            id: "downstream-2",
            title: "Waiting on blocker fix",
            description: "Depends on blocker issue",
            status: "todo" as const,
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          } as any as Issue,
          {
            id: "downstream-3",
            title: "Can't move forward",
            description: "Related to blocker",
            status: "todo" as const,
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          } as any as Issue,
        ],
        recentIssueCount: 4,
        latestHeartbeat: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        blockerCount: 1,
      };

      const classification = classifyStall(
        blockerSnapshot,
        emptyVision,
        emptyActivity
      );

      expect(classification.causes.length).toBeGreaterThan(0);
      expect(classification.causes[0]).toBe("single-blocker");
      expect(classification.confidence["single-blocker"]).toBeGreaterThan(0);
    });

    it("returns drift as top cause when drift score is highest", () => {
      const snapshot: InventorySnapshot = {
        companyId: "drift-company",
        agents: [
          {
            id: "agent-1",
            name: "Alice",
            role: "Engineer",
            status: "active" as const,
            lastHeartbeatAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          } as any as Agent,
        ],
        agentCount: 1,
        documents: [],
        visionExists: true,
        recentIssues: [],
        recentIssueCount: 0,
        latestHeartbeat: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        blockerCount: 0,
      };

      const driftReport: DriftReport = {
        items: [
          {
            visionSection: "mission" as any,
            confidence: 0.8,
            severity: "warn" as const,
            evidence: [],
            proposedAmendment: "Update mission",
            explanation: "Drift detected",
          },
          {
            visionSection: "mandate" as any,
            confidence: 0.75,
            severity: "warn" as const,
            evidence: [],
            proposedAmendment: "Update mandate",
            explanation: "Drift detected",
          },
          {
            visionSection: "voice" as any,
            confidence: 0.72,
            severity: "warn" as const,
            evidence: [],
            proposedAmendment: "Update voice",
            explanation: "Drift detected",
          },
        ],
        runId: "run-123",
        generatedAt: new Date().toISOString(),
        companyId: "drift-company",
        confidenceThreshold: 0.5,
        totalItemsDetected: 3,
      };

      const classification = classifyStall(
        snapshot,
        emptyVision,
        emptyActivity,
        driftReport
      );

      expect(classification.causes.length).toBeGreaterThan(0);
      expect(classification.causes[0]).toBe("strategic-drift");
      expect(classification.confidence["strategic-drift"]).toBeGreaterThan(0);
    });

    it("returns all causes with confidence scores ranked by confidence", () => {
      const snapshot: InventorySnapshot = {
        companyId: "multi-stall",
        agents: [
          {
            id: "agent-dead",
            name: "Dead",
            role: "Engineer",
            status: "inactive" as const,
            lastHeartbeatAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
          } as any as Agent,
        ],
        agentCount: 1,
        documents: [],
        visionExists: true,
        recentIssues: [
          {
            id: "task-1",
            title: "Open task",
            description: "Assigned to dead agent",
            status: "todo" as const,
            assigneeAgentId: "agent-dead",
            createdAt: new Date().toISOString(),
          } as any as Issue,
        ],
        recentIssueCount: 1,
        latestHeartbeat: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        blockerCount: 0,
      };

      const activity: ActivitySnapshot = {
        issues: [],
        comments: [
          {
            id: "c1",
            type: "comment" as const,
            content: "SDK integration error",
            createdAt: new Date().toISOString(),
            authorId: "user-1",
          },
        ],
        documents: [],
        totalItemCount: 1,
        windowStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        windowEndDate: new Date(),
      };

      const classification = classifyStall(
        snapshot,
        emptyVision,
        activity
      );

      // Should have dead-agent and broken-integration
      expect(classification.causes.length).toBeGreaterThan(0);

      // Causes should be ranked by confidence (descending)
      for (let i = 0; i < classification.causes.length - 1; i++) {
        const currentConfidence = classification.confidence[classification.causes[i]];
        const nextConfidence = classification.confidence[classification.causes[i + 1]];
        expect(currentConfidence).toBeGreaterThanOrEqual(nextConfidence);
      }
    });

    it("includes timestamp in classification", () => {
      const snapshot: InventorySnapshot = {
        companyId: "test",
        agents: [],
        agentCount: 0,
        documents: [],
        visionExists: true,
        recentIssues: [],
        recentIssueCount: 0,
        latestHeartbeat: new Date(),
        blockerCount: 0,
      };

      const beforeTime = new Date();
      const classification = classifyStall(snapshot, emptyVision, emptyActivity);
      const afterTime = new Date();

      expect(classification.timestamp).toBeDefined();
      const classifyTime = new Date(classification.timestamp);
      expect(classifyTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime() - 100);
      expect(classifyTime.getTime()).toBeLessThanOrEqual(afterTime.getTime() + 100);
    });
  });
});
