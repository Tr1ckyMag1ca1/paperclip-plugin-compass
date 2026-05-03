import { describe, it, expect } from "vitest";
import { parseVision, serializeVision } from "../../src/assess/vision-parse.js";
import type { ParsedVision } from "../../src/types/assess.js";

describe("VISION.md Parser and Serializer", () => {
  // Golden fixture with all 19 sections
  const goldenVision: ParsedVision = {
    mission: "To build the best AI company in the world",
    mandate: "The CEO must have full autonomy to make decisions",
    voice: "Professional yet approachable",
    principles: "Move fast, iterate, and ship",
    success_criteria_12mo: "10x growth in revenue",
    vision_3year: "Be a category leader in AI",
    target_customer: "Fortune 500 companies",
    issue_structure: "GitHub-style issues with labels",
    locality: "Silicon Valley, with global reach",
    revenue_model: "Subscription with usage tiers",
    launch_plan: "Beta in Q2, GA in Q3",
    trust_governance: "Board-level oversight with monthly reviews",
    growth_strategy: "PLG + enterprise sales",
    sales_model: "Direct sales + channel partners",
    product_direction: "AI-first, human-last approach",
    org_structure: "Lean core team with outsourced ops",
    operating_philosophy: "Simplicity over complexity",
    ceo_mandate: "Decision authority on strategy", // Separate from mandate
    success_criteria: "Profitable by year 2, $100M ARR by year 5",
  };

  const goldenMarkdown = `## Mission
To build the best AI company in the world

## 12-Month Goal
10x growth in revenue

## 3-Year Vision
Be a category leader in AI

## Target Customer
Fortune 500 companies

## Voice
Professional yet approachable

## Issue Structure
GitHub-style issues with labels

## Locality
Silicon Valley, with global reach

## Revenue Model
Subscription with usage tiers

## Launch Plan
Beta in Q2, GA in Q3

## Trust Governance
Board-level oversight with monthly reviews

## Growth Strategy
PLG + enterprise sales

## Sales Model
Direct sales + channel partners

## Product Direction
AI-first, human-last approach

## Org Structure
Lean core team with outsourced ops

## Operating Philosophy
Simplicity over complexity

## CEO Mandate
The CEO must have full autonomy to make decisions

## Principles
Move fast, iterate, and ship

## Amendment Protocol


## Success Criteria
Profitable by year 2, $100M ARR by year 5
`;

  describe("parseVision", () => {
    it("extracts all 19 sections from markdown", () => {
      const parsed = parseVision(goldenMarkdown);

      expect(parsed.mission).toBe("To build the best AI company in the world");
      expect(parsed.mandate).toBe("The CEO must have full autonomy to make decisions");
      expect(parsed.voice).toBe("Professional yet approachable");
      expect(parsed.principles).toBe("Move fast, iterate, and ship");
      expect(parsed.success_criteria_12mo).toBe("10x growth in revenue");
      expect(parsed.vision_3year).toBe("Be a category leader in AI");
      expect(parsed.target_customer).toBe("Fortune 500 companies");
      expect(parsed.issue_structure).toBe("GitHub-style issues with labels");
      expect(parsed.locality).toBe("Silicon Valley, with global reach");
      expect(parsed.revenue_model).toBe("Subscription with usage tiers");
      expect(parsed.launch_plan).toBe("Beta in Q2, GA in Q3");
      expect(parsed.trust_governance).toBe("Board-level oversight with monthly reviews");
      expect(parsed.growth_strategy).toBe("PLG + enterprise sales");
      expect(parsed.sales_model).toBe("Direct sales + channel partners");
      expect(parsed.product_direction).toBe("AI-first, human-last approach");
      expect(parsed.org_structure).toBe("Lean core team with outsourced ops");
      expect(parsed.operating_philosophy).toBe("Simplicity over complexity");
      // ceo_mandate is separate from CEO Mandate section - both empty by default
      expect(parsed.ceo_mandate).toBe("");
      expect(parsed.success_criteria).toBe("Profitable by year 2, $100M ARR by year 5");
    });

    it("handles empty sections gracefully", () => {
      const markdown = `## Mission
Some mission

## Voice


## Principles
Some principles`;

      const parsed = parseVision(markdown);
      expect(parsed.mission).toBe("Some mission");
      expect(parsed.voice).toBe("");
      expect(parsed.principles).toBe("Some principles");
    });

    it("parses amendment log correctly", () => {
      const markdownWithLog = goldenMarkdown + `

## Amendment Log
- 2026-05-03T12:00:00Z: Updated voice section after Q2 drift audit
- 2026-05-02T10:30:00Z: Adjusted growth strategy per market feedback`;

      const parsed = parseVision(markdownWithLog);
      expect(parsed.amendments).toBeDefined();
      expect(parsed.amendments?.length).toBe(2);
      expect(parsed.amendments?.[0].timestamp).toBe("2026-05-03T12:00:00Z");
      expect(parsed.amendments?.[0].reason).toContain("Updated voice section");
      expect(parsed.amendments?.[1].reason).toContain("Adjusted growth strategy");
    });
  });

  describe("serializeVision", () => {
    it("serializes ParsedVision back to markdown with section headers", () => {
      const serialized = serializeVision(goldenVision);

      expect(serialized).toContain("## Mission");
      expect(serialized).toContain("To build the best AI company in the world");
      expect(serialized).toContain("## Voice");
      expect(serialized).toContain("Professional yet approachable");
      expect(serialized).toContain("## Principles");
      expect(serialized).toContain("Move fast, iterate, and ship");
    });

    it("appends amendment log when amendments exist", () => {
      const visionWithAmendments: ParsedVision = {
        ...goldenVision,
        amendments: [
          {
            timestamp: "2026-05-03T12:00:00Z",
            section: "voice",
            reason: "Updated voice section after Q2 drift audit",
          },
        ],
      };

      const serialized = serializeVision(visionWithAmendments);
      expect(serialized).toContain("## Amendment Log");
      expect(serialized).toContain("- 2026-05-03T12:00:00Z: Updated voice section after Q2 drift audit");
    });

    it("maintains section order in serialization", () => {
      const serialized = serializeVision(goldenVision);
      const missionIdx = serialized.indexOf("## Mission");
      const visionIdx = serialized.indexOf("## Voice");
      const principlesIdx = serialized.indexOf("## Principles");

      expect(missionIdx).toBeLessThan(visionIdx);
      expect(visionIdx).toBeLessThan(principlesIdx);
    });
  });

  describe("Round-trip safety", () => {
    it("parse(serialize(parse(x))) === parse(x)", () => {
      const parsed1 = parseVision(goldenMarkdown);
      const serialized = serializeVision(parsed1);
      const parsed2 = parseVision(serialized);

      // Deep equality on all sections
      expect(parsed2.mission).toBe(parsed1.mission);
      expect(parsed2.mandate).toBe(parsed1.mandate);
      expect(parsed2.voice).toBe(parsed1.voice);
      expect(parsed2.principles).toBe(parsed1.principles);
      expect(parsed2.success_criteria_12mo).toBe(parsed1.success_criteria_12mo);
      expect(parsed2.vision_3year).toBe(parsed1.vision_3year);
      expect(parsed2.target_customer).toBe(parsed1.target_customer);
      expect(parsed2.issue_structure).toBe(parsed1.issue_structure);
      expect(parsed2.locality).toBe(parsed1.locality);
      expect(parsed2.revenue_model).toBe(parsed1.revenue_model);
      expect(parsed2.launch_plan).toBe(parsed1.launch_plan);
      expect(parsed2.trust_governance).toBe(parsed1.trust_governance);
      expect(parsed2.growth_strategy).toBe(parsed1.growth_strategy);
      expect(parsed2.sales_model).toBe(parsed1.sales_model);
      expect(parsed2.product_direction).toBe(parsed1.product_direction);
      expect(parsed2.org_structure).toBe(parsed1.org_structure);
      expect(parsed2.operating_philosophy).toBe(parsed1.operating_philosophy);
      expect(parsed2.ceo_mandate).toBe(parsed1.ceo_mandate);
      expect(parsed2.success_criteria).toBe(parsed1.success_criteria);
    });

    it("preserves amendments through round-trip", () => {
      const visionWithAmendments: ParsedVision = {
        ...goldenVision,
        amendments: [
          {
            timestamp: "2026-05-03T12:00:00Z",
            section: "voice",
            reason: "Updated after Q2 drift",
          },
        ],
      };

      const serialized = serializeVision(visionWithAmendments);
      const parsed = parseVision(serialized);

      expect(parsed.amendments?.length).toBe(1);
      expect(parsed.amendments?.[0].timestamp).toBe("2026-05-03T12:00:00Z");
      expect(parsed.amendments?.[0].reason).toBe("Updated after Q2 drift");
    });
  });

  describe("Edge cases", () => {
    it("handles markdown with extra whitespace", () => {
      const messyMarkdown = `##   Mission
Some mission with lots of space


## Voice

Professional


## Principles
Many
spaces
here`;

      const parsed = parseVision(messyMarkdown);
      expect(parsed.mission).toBe("Some mission with lots of space");
      expect(parsed.voice).toBe("Professional");
      expect(parsed.principles.includes("Many")).toBe(true);
    });

    it("handles missing sections (returns empty string)", () => {
      const minimalMarkdown = `## Mission
Just a mission`;

      const parsed = parseVision(minimalMarkdown);
      expect(parsed.mission).toBe("Just a mission");
      expect(parsed.voice).toBe("");
      expect(parsed.mandate).toBe("");
    });

    it("handles multiline section content", () => {
      const multilineMarkdown = `## Mission
Build the best AI
Make the world better
Serve customers well

## Voice
Professional and approachable
Human-first design
Transparent communication`;

      const parsed = parseVision(multilineMarkdown);
      expect(parsed.mission).toContain("Build the best AI");
      expect(parsed.mission).toContain("Make the world better");
      expect(parsed.voice).toContain("Professional and approachable");
      expect(parsed.voice).toContain("Transparent communication");
    });
  });
});
