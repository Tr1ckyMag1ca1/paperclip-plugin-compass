import { describe, it, expect } from "vitest";
import {
  formatAmendment,
  formatChangelog,
  applyAmendmentToVision,
} from "../../src/assess/amendment.js";
import type { ParsedVision, AmendmentLogEntry } from "../../src/types/assess.js";

describe("Amendment Formatting and Application", () => {
  const sampleVision: ParsedVision = {
    mission: "Build AI that helps people",
    mandate: "CEO has full autonomy",
    voice: "Professional and approachable",
    principles: "Move fast, ship early, iterate often",
    success_criteria_12mo: "10x growth in revenue",
    vision_3year: "Market leader in AI",
    target_customer: "SMBs and enterprises",
    issue_structure: "GitHub-style issues",
    locality: "Global reach",
    revenue_model: "Freemium subscription",
    launch_plan: "MVP in Q1, Beta in Q2",
    trust_governance: "Monthly board reviews",
    growth_strategy: "PLG + content marketing",
    sales_model: "Self-serve + enterprise",
    product_direction: "AI-first features",
    org_structure: "Small core team",
    operating_philosophy: "Simplicity and transparency",
    ceo_mandate: "Make all product decisions",
    success_criteria: "$10M ARR by year 2",
  };

  describe("formatAmendment", () => {
    it("produces unified diff format for section changes", () => {
      const current = "Professional and approachable";
      const proposed = "Casual and fun";

      const amendment = formatAmendment(current, proposed);

      expect(amendment.delta).toBeDefined();
      expect(amendment.delta.length).toBeGreaterThan(0);
      expect(amendment.diffLines).toBeDefined();
      expect(Array.isArray(amendment.diffLines)).toBe(true);
    });

    it("includes removed lines with minus prefix", () => {
      const current = "Old content here";
      const proposed = "New content here";

      const amendment = formatAmendment(current, proposed);

      // Delta should contain removed content
      expect(amendment.delta.includes("Old content") || amendment.delta.includes("-")).toBe(true);
    });

    it("includes added lines with plus prefix", () => {
      const current = "Original";
      const proposed = "Updated content";

      const amendment = formatAmendment(current, proposed);

      // Delta should contain added content
      expect(amendment.delta.includes("Updated") || amendment.delta.includes("+")).toBe(true);
    });

    it("truncates long lines to fit sidebar width", () => {
      const longCurrent =
        "This is an extremely long line that should be truncated to fit in the sidebar display";
      const proposed = "Short";

      const amendment = formatAmendment(longCurrent, proposed);

      // All diff lines should be reasonably short (60 chars max)
      for (const line of amendment.diffLines) {
        expect(line.length).toBeLessThanOrEqual(70); // Allow for prefix
      }
    });

    it("limits diffLines to 5 items", () => {
      const current = "line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8";
      const proposed = "new1\nnew2\nnew3\nnew4\nnew5\nnew6\nnew7\nnew8";

      const amendment = formatAmendment(current, proposed);

      expect(amendment.diffLines.length).toBeLessThanOrEqual(6); // 5 changes + potential "more" line
    });

    it("handles no changes gracefully", () => {
      const content = "Same content";

      const amendment = formatAmendment(content, content);

      expect(amendment.delta).toContain("No changes");
      expect(amendment.diffLines[0]).toContain("no changes");
    });

    it("handles multiline content", () => {
      const current = "Line 1\nLine 2\nLine 3";
      const proposed = "Line 1\nModified Line 2\nLine 3";

      const amendment = formatAmendment(current, proposed);

      expect(amendment.delta.length).toBeGreaterThan(0);
      expect(amendment.diffLines.length).toBeGreaterThan(0);
    });
  });

  describe("formatChangelog", () => {
    it("formats changelog entry as markdown list item", () => {
      const entry: AmendmentLogEntry = {
        timestamp: "2026-05-03T12:00:00Z",
        section: "voice",
        reason: "Updated voice section after Q2 drift audit",
        founderIdentity: "founder@example.com",
      };

      const log = formatChangelog(entry);

      expect(log).toContain("- ");
      expect(log).toContain("2026-05-03T12:00:00Z");
      expect(log).toContain("Updated voice section after Q2 drift audit");
    });

    it("includes timestamp and reason in correct format", () => {
      const entry: AmendmentLogEntry = {
        timestamp: "2026-05-01T10:30:00Z",
        section: "mandate",
        reason: "Adjusted CEO autonomy after board review",
      };

      const log = formatChangelog(entry);

      expect(log).toMatch(/^- \d{4}-\d{2}-\d{2}T/);
      expect(log).toContain(":");
    });

    it("omits founder identity from formatted output", () => {
      const entryWithId: AmendmentLogEntry = {
        timestamp: "2026-05-03T12:00:00Z",
        section: "voice",
        reason: "Updated voice",
        founderIdentity: "secret-founder-id",
      };

      const log = formatChangelog(entryWithId);

      // Formatted changelog should only contain timestamp and reason, not identity
      expect(log).not.toContain("secret-founder-id");
      expect(log).toContain("2026-05-03T12:00:00Z");
      expect(log).toContain("Updated voice");
    });

    it("handles special characters in reason", () => {
      const entry: AmendmentLogEntry = {
        timestamp: "2026-05-03T12:00:00Z",
        section: "principles",
        reason: "Adjusted after feedback: move fast & ship early!",
      };

      const log = formatChangelog(entry);

      expect(log).toContain("move fast & ship early!");
    });
  });

  describe("applyAmendmentToVision", () => {
    it("updates specified section with new content", () => {
      const newVoice = "Casual and friendly";
      const reason = "Adjusted based on user feedback";

      const updated = applyAmendmentToVision(
        sampleVision,
        "voice",
        newVoice,
        reason
      );

      expect(updated.voice).toBe(newVoice);
    });

    it("appends amendment entry to amendments array", () => {
      const newContent = "Updated mandate";
      const reason = "After board review";

      const updated = applyAmendmentToVision(
        sampleVision,
        "mandate",
        newContent,
        reason
      );

      expect(updated.amendments).toBeDefined();
      expect(updated.amendments?.length).toBeGreaterThan(0);
    });

    it("creates amendment log entry with correct fields", () => {
      const reason = "Test amendment";
      const updated = applyAmendmentToVision(
        sampleVision,
        "voice",
        "New voice",
        reason
      );

      const entry = updated.amendments?.[0];
      expect(entry?.timestamp).toBeDefined();
      expect(entry?.section).toBe("voice");
      expect(entry?.reason).toBe(reason);
    });

    it("includes founder identity in amendment entry if provided", () => {
      const founderIdentity = "founder@example.com";
      const updated = applyAmendmentToVision(
        sampleVision,
        "voice",
        "New content",
        "Test",
        founderIdentity
      );

      const entry = updated.amendments?.[0];
      expect(entry?.founderIdentity).toBe(founderIdentity);
    });

    it("does not mutate original vision object", () => {
      const originalVoice = sampleVision.voice;
      const newVoice = "Completely new voice";

      applyAmendmentToVision(sampleVision, "voice", newVoice, "Test");

      expect(sampleVision.voice).toBe(originalVoice);
    });

    it("preserves other sections unchanged", () => {
      const updated = applyAmendmentToVision(
        sampleVision,
        "voice",
        "New voice",
        "Update voice"
      );

      expect(updated.mission).toBe(sampleVision.mission);
      expect(updated.mandate).toBe(sampleVision.mandate);
      expect(updated.principles).toBe(sampleVision.principles);
    });

    it("appends multiple amendments in order", () => {
      let current = sampleVision;

      current = applyAmendmentToVision(
        current,
        "voice",
        "New voice",
        "First amendment"
      );

      current = applyAmendmentToVision(
        current,
        "mandate",
        "New mandate",
        "Second amendment"
      );

      expect(current.amendments?.length).toBe(2);
      expect(current.amendments?.[0].reason).toBe("First amendment");
      expect(current.amendments?.[1].reason).toBe("Second amendment");
    });

    it("preserves existing amendments and adds new ones", () => {
      const visionWithAmendments: ParsedVision = {
        ...sampleVision,
        amendments: [
          {
            timestamp: "2026-05-01T12:00:00Z",
            section: "voice",
            reason: "Previous amendment",
          },
        ],
      };

      const updated = applyAmendmentToVision(
        visionWithAmendments,
        "mandate",
        "New mandate",
        "New amendment"
      );

      expect(updated.amendments?.length).toBe(2);
      expect(updated.amendments?.[0].reason).toBe("Previous amendment");
      expect(updated.amendments?.[1].reason).toBe("New amendment");
    });

    it("creates timestamp in ISO 8601 format", () => {
      const updated = applyAmendmentToVision(
        sampleVision,
        "voice",
        "New voice",
        "Test"
      );

      const timestamp = updated.amendments?.[0].timestamp;
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("Integration", () => {
    it("format amendment, create changelog, apply to vision", () => {
      const currentVoice = sampleVision.voice;
      const proposedVoice = "Casual and fun";

      // Step 1: Format amendment
      const amendment = formatAmendment(currentVoice, proposedVoice);
      expect(amendment.delta.length).toBeGreaterThan(0);

      // Step 2: Apply amendment to vision
      const updated = applyAmendmentToVision(
        sampleVision,
        "voice",
        proposedVoice,
        "Updated voice after drift audit"
      );
      expect(updated.voice).toBe(proposedVoice);

      // Step 3: Format changelog entry
      const logEntry = updated.amendments?.[0];
      expect(logEntry).toBeDefined();

      const log = formatChangelog(logEntry!);
      expect(log).toContain("Updated voice after drift audit");
    });
  });
});
