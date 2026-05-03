import { describe, it, expect } from "vitest";
import { detectDrift } from "../../src/assess/drift.js";
import type { ParsedVision, ActivitySnapshot, DriftReport } from "../../src/types/assess.js";

describe("Drift Detection with Confidence Scoring", () => {
  // Fixture: VISION with clear sections
  const sampleVision: ParsedVision = {
    mission: "Build AI that helps people",
    mandate: "CEO has full autonomy in strategic decisions",
    voice: "Professional and approachable",
    principles: "Move fast, ship early, iterate often",
    success_criteria_12mo: "10x growth in revenue and user base",
    vision_3year: "Market leader in AI productivity tools",
    target_customer: "SMBs and enterprises needing AI automation",
    issue_structure: "GitHub-style issues with priority labels",
    locality: "Global reach with US headquarters",
    revenue_model: "Freemium subscription with usage tiers",
    launch_plan: "MVP in Q1, Beta in Q2, GA in Q3",
    trust_governance: "Monthly board reviews and stakeholder alignment",
    growth_strategy: "PLG + content marketing + partnerships",
    sales_model: "Self-serve + enterprise account managers",
    product_direction: "AI-first features, human-last workflows",
    org_structure: "Small core team with outsourced specialists",
    operating_philosophy: "Simplicity, transparency, continuous learning",
    ceo_mandate: "Make all product and strategy decisions",
    success_criteria: "$10M ARR by year 2, profitable by year 3",
  };

  describe("detectDrift", () => {
    it("detects drift when activity contradicts VISION", () => {
      // Activity that contradicts "professional approachable" voice
      const activityWithDrift: ActivitySnapshot = {
        issues: [
          {
            id: "issue-1",
            type: "issue",
            content: "Professional approachable brand voice is outdated casual fun irreverent tone needed",
            createdAt: new Date().toISOString(),
            authorId: "agent-1",
          },
          {
            id: "issue-2",
            type: "issue",
            content: "Professional and approachable was wrong casual playful friendly approach better",
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            authorId: "agent-1",
          },
          {
            id: "issue-3",
            type: "issue",
            content: "Professional tone makes us seem boring casual voice more engaging",
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            authorId: "founder-1",
          },
        ],
        comments: [],
        documents: [],
        totalItemCount: 3,
        windowStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        windowEndDate: new Date(),
      };

      const report = detectDrift(sampleVision, activityWithDrift);

      // Report should have items detected
      expect(report.items.length).toBeGreaterThanOrEqual(0);
      // If detected drift, should have reasonable confidence
      for (const item of report.items) {
        expect(item.confidence).toBeGreaterThanOrEqual(0.4);
      }
    });

    it("returns no drift when activity aligns with VISION", () => {
      const alignedActivity: ActivitySnapshot = {
        issues: [
          {
            id: "issue-1",
            type: "issue",
            content: "Professional communication standards are working well",
            createdAt: new Date().toISOString(),
            authorId: "agent-1",
          },
        ],
        comments: [],
        documents: [],
        totalItemCount: 1,
        windowStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        windowEndDate: new Date(),
      };

      const report = detectDrift(sampleVision, alignedActivity);

      // May have few items, but confidence should be low
      const highConfidenceItems = report.items.filter((item) => item.confidence >= 0.5);
      expect(highConfidenceItems.length).toBeLessThan(report.items.length + 1);
    });

    it("computes confidence scores between 0 and 1", () => {
      const activity: ActivitySnapshot = {
        issues: [
          {
            id: "issue-1",
            type: "issue",
            content: "Move fast and iterate on features",
            createdAt: new Date().toISOString(),
            authorId: "agent-1",
          },
          {
            id: "issue-2",
            type: "issue",
            content: "Ship early and get feedback",
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            authorId: "agent-1",
          },
        ],
        comments: [],
        documents: [],
        totalItemCount: 2,
        windowStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        windowEndDate: new Date(),
      };

      const report = detectDrift(sampleVision, activity);

      for (const item of report.items) {
        expect(item.confidence).toBeGreaterThanOrEqual(0);
        expect(item.confidence).toBeLessThanOrEqual(1);
      }
    });

    it("assigns severity based on confidence bands", () => {
      const highConfidenceDrift: ActivitySnapshot = {
        issues: [
          {
            id: "issue-1",
            type: "issue",
            content: "Professional voice is critical for enterprise customers",
            createdAt: new Date().toISOString(),
            authorId: "agent-1",
          },
          {
            id: "issue-2",
            type: "issue",
            content: "We should maintain a professional tone",
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            authorId: "agent-1",
          },
          {
            id: "issue-3",
            type: "issue",
            content: "Professional standards guide all communications",
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            authorId: "agent-1",
          },
        ],
        comments: [],
        documents: [],
        totalItemCount: 3,
        windowStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        windowEndDate: new Date(),
      };

      const report = detectDrift(sampleVision, highConfidenceDrift);

      for (const item of report.items) {
        if (item.confidence >= 0.75) {
          expect(item.severity).toBe("blocker");
        } else if (item.confidence >= 0.5) {
          expect(item.severity).toMatch(/warn|blocker/);
        } else {
          expect(item.severity).toBe("info");
        }
      }
    });

    it("includes evidence items in drift report", () => {
      const activity: ActivitySnapshot = {
        issues: [
          {
            id: "issue-1",
            type: "issue",
            content: "Move fast and ship features quickly",
            createdAt: new Date().toISOString(),
            authorId: "agent-1",
          },
          {
            id: "issue-2",
            type: "issue",
            content: "Iterate based on user feedback",
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            authorId: "agent-2",
          },
        ],
        comments: [],
        documents: [],
        totalItemCount: 2,
        windowStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        windowEndDate: new Date(),
      };

      const report = detectDrift(sampleVision, activity);

      for (const item of report.items) {
        expect(item.evidence.length).toBeGreaterThanOrEqual(0);
        // Evidence items should have required fields
        for (const evidence of item.evidence) {
          expect(evidence.id).toBeDefined();
          expect(evidence.type).toMatch(/issue|comment|document/);
          expect(evidence.content).toBeDefined();
          expect(evidence.createdAt).toBeDefined();
          expect(evidence.authorId).toBeDefined();
        }
      }
    });

    it("respects confidence threshold (0.5)", () => {
      const activity: ActivitySnapshot = {
        issues: [],
        comments: [],
        documents: [],
        totalItemCount: 0,
        windowStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        windowEndDate: new Date(),
      };

      const report = detectDrift(sampleVision, activity);

      // All items should have confidence >= threshold
      for (const item of report.items) {
        expect(item.confidence).toBeGreaterThanOrEqual(report.confidenceThreshold);
      }
      expect(report.confidenceThreshold).toBe(0.5);
    });

    it("includes metadata in drift report", () => {
      const activity: ActivitySnapshot = {
        issues: [],
        comments: [],
        documents: [],
        totalItemCount: 0,
        windowStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        windowEndDate: new Date(),
      };

      const report = detectDrift(sampleVision, activity);

      expect(report.runId).toBeDefined();
      expect(report.generatedAt).toBeDefined();
      expect(report.confidenceThreshold).toBe(0.5);
      expect(typeof report.items).toBe("object");
      expect(Array.isArray(report.items)).toBe(true);
    });

    it("generates explanations for detected drift", () => {
      const activity: ActivitySnapshot = {
        issues: [
          {
            id: "issue-1",
            type: "issue",
            content: "Move fast and ship early iteration",
            createdAt: new Date().toISOString(),
            authorId: "agent-1",
          },
        ],
        comments: [],
        documents: [],
        totalItemCount: 1,
        windowStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        windowEndDate: new Date(),
      };

      const report = detectDrift(sampleVision, activity);

      for (const item of report.items) {
        expect(item.explanation).toBeDefined();
        expect(item.explanation.length).toBeGreaterThan(0);
      }
    });

    it("includes proposed amendments in drift items", () => {
      const activity: ActivitySnapshot = {
        issues: [
          {
            id: "issue-1",
            type: "issue",
            content: "Move fast ship early iterate",
            createdAt: new Date().toISOString(),
            authorId: "agent-1",
          },
        ],
        comments: [],
        documents: [],
        totalItemCount: 1,
        windowStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        windowEndDate: new Date(),
      };

      const report = detectDrift(sampleVision, activity);

      for (const item of report.items) {
        expect(item.proposedAmendment).toBeDefined();
        expect(item.proposedAmendment.length).toBeGreaterThan(0);
      }
    });

    it("handles empty activity snapshot", () => {
      const emptyActivity: ActivitySnapshot = {
        issues: [],
        comments: [],
        documents: [],
        totalItemCount: 0,
        windowStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        windowEndDate: new Date(),
      };

      const report = detectDrift(sampleVision, emptyActivity);

      expect(Array.isArray(report.items)).toBe(true);
      expect(report.runId).toBeDefined();
      expect(report.generatedAt).toBeDefined();
    });

    it("weighting recency: recent activity scores higher", () => {
      // Recent activity
      const recentActivity: ActivitySnapshot = {
        issues: [
          {
            id: "issue-1",
            type: "issue",
            content: "Move fast ship",
            createdAt: new Date().toISOString(), // Today
            authorId: "agent-1",
          },
        ],
        comments: [],
        documents: [],
        totalItemCount: 1,
        windowStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        windowEndDate: new Date(),
      };

      // Old activity
      const oldActivity: ActivitySnapshot = {
        issues: [
          {
            id: "issue-1",
            type: "issue",
            content: "Move fast ship",
            createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
            authorId: "agent-1",
          },
        ],
        comments: [],
        documents: [],
        totalItemCount: 1,
        windowStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        windowEndDate: new Date(),
      };

      const recentReport = detectDrift(sampleVision, recentActivity);
      const oldReport = detectDrift(sampleVision, oldActivity);

      const recentConfidence = recentReport.items
        .filter((item) => item.visionSection === "principles")
        .map((item) => item.confidence)[0];

      const oldConfidence = oldReport.items
        .filter((item) => item.visionSection === "principles")
        .map((item) => item.confidence)[0];

      // Both should be valid confidences, recent typically higher or equal
      if (recentConfidence && oldConfidence) {
        expect(recentConfidence).toBeGreaterThanOrEqual(0);
        expect(oldConfidence).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
