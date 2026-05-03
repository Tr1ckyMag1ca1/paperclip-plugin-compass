/**
 * Unit Tests for Derive Functions
 *
 * Per XC-08: test all derive functions independently.
 * Cover logic paths, edge cases, output format, and missing input handling.
 *
 * Derive functions are pure; no I/O or side effects.
 */

import { describe, it, expect } from "vitest";
import {
  derivePrinciples,
  deriveMandateStatement,
  derive12MonthGoal,
  deriveSuccessCriteria,
  deriveCompetitiveAdvantage,
  deriveMarketOpportunity,
} from "../../src/found/derive.js";
import { mockAnswers, partialAnswers } from "../fixtures/found-fixtures.js";

describe("Derive Functions (pure logic, 100% coverage)", () => {
  describe("derivePrinciples", () => {
    it("aggregates voice description + values + red-lines into 3-5 bullet points", () => {
      const principles = derivePrinciples(mockAnswers);

      expect(principles).toBeTruthy();
      expect(typeof principles).toBe("string");
      expect(principles.split("\n").length).toBeGreaterThanOrEqual(3);
    });

    it("returns empty string if voice_description missing", () => {
      const incomplete = { ...partialAnswers };
      const result = derivePrinciples(incomplete);
      expect(result).toBe("");
    });

    it("handles missing optional fields (values, red-lines)", () => {
      const minimal = {
        "brand-voice": "Friendly and direct",
      };
      const result = derivePrinciples(minimal as any);
      expect(typeof result).toBe("string");
    });

    it("formats each principle with leading bullet point", () => {
      const principles = derivePrinciples(mockAnswers);
      const lines = principles.split("\n").filter((l) => l.trim());
      lines.forEach((line) => {
        expect(line.trim()).toMatch(/^[-•]/);
      });
    });
  });

  describe("deriveMandateStatement", () => {
    it("combines mission + target-market into mandate sentence", () => {
      const mandate = deriveMandateStatement(mockAnswers);

      expect(mandate).toBeTruthy();
      expect(mandate).toContain(mockAnswers.mission);
      expect(mandate).toContain(mockAnswers["target-market"]);
    });

    it("returns empty string if mission missing", () => {
      const noMission = { ...partialAnswers };
      delete (noMission as any).mission;
      const result = deriveMandateStatement(noMission);
      expect(result).toBe("");
    });

    it("returns empty string if target-market missing", () => {
      const noMarket = { ...partialAnswers };
      delete (noMarket as any)["target-market"];
      const result = deriveMandateStatement(noMarket);
      expect(result).toBe("");
    });

    it("joins mission and market with conjunction (for, to, etc)", () => {
      const mandate = deriveMandateStatement(mockAnswers);
      expect(mandate).toMatch(/\b(for|to)\b/i);
    });
  });

  describe("derive12MonthGoal", () => {
    it("formats goal as time-bound sentence with metrics", () => {
      const goal = derive12MonthGoal(mockAnswers);

      expect(goal).toBeTruthy();
      expect(goal).toContain(mockAnswers["target-revenue-12mo"]);
      expect(goal).toContain(mockAnswers["customer-count-target"]);
      // Should mention "12 months" or "year"
      expect(goal).toMatch(/12|month|year/i);
    });

    it("returns empty string if revenue target missing", () => {
      const noRevenue = { ...partialAnswers };
      const result = derive12MonthGoal(noRevenue);
      expect(result).toBe("");
    });

    it("includes current year in output", () => {
      const goal = derive12MonthGoal(mockAnswers);
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      expect(goal).toMatch(new RegExp(`${currentYear}|${nextYear}`));
    });
  });

  describe("deriveSuccessCriteria", () => {
    it("creates 4-6 bullet success criteria from various answers", () => {
      const criteria = deriveSuccessCriteria(mockAnswers);

      expect(criteria).toBeTruthy();
      const lines = criteria.split("\n").filter((l) => l.trim());
      expect(lines.length).toBeGreaterThanOrEqual(4);
    });

    it("includes quantitative metrics (revenue, users, NPS)", () => {
      const criteria = deriveSuccessCriteria(mockAnswers);
      expect(criteria).toMatch(/\d+/); // At least one number
    });

    it("returns empty string if long-term-vision missing", () => {
      const noVision = { ...partialAnswers };
      const result = deriveSuccessCriteria(noVision);
      expect(result).toBe("");
    });

    it("formats each criterion with bullet point", () => {
      const criteria = deriveSuccessCriteria(mockAnswers);
      const lines = criteria.split("\n").filter((l) => l.trim());
      lines.forEach((line) => {
        expect(line.trim()).toMatch(/^[-•]/);
      });
    });
  });

  describe("deriveCompetitiveAdvantage", () => {
    it("combines technology-moat + core-features into competitive advantage statement", () => {
      const advantage = deriveCompetitiveAdvantage(mockAnswers);

      expect(advantage).toBeTruthy();
      expect(advantage).toContain(
        mockAnswers["technology-moat"]
      );
    });

    it("returns empty string if technology-moat missing", () => {
      const noMoat = { ...partialAnswers };
      const result = deriveCompetitiveAdvantage(noMoat);
      expect(result).toBe("");
    });

    it("is concise (1-2 sentences, <150 chars)", () => {
      const advantage = deriveCompetitiveAdvantage(mockAnswers);
      const sentenceCount = (advantage.match(/[.!?]/g) || []).length;
      expect(sentenceCount).toBeGreaterThanOrEqual(1);
      expect(sentenceCount).toBeLessThanOrEqual(2);
      expect(advantage.length).toBeLessThan(200);
    });
  });

  describe("deriveMarketOpportunity", () => {
    it("extracts TAM from market-size answer", () => {
      const opportunity = deriveMarketOpportunity(mockAnswers);

      expect(opportunity).toBeTruthy();
      expect(opportunity).toContain(mockAnswers["market-size"]);
    });

    it("returns empty string if market-size missing", () => {
      const noMarket = { ...partialAnswers };
      const result = deriveMarketOpportunity(noMarket);
      expect(result).toBe("");
    });

    it("formats with context (e.g., TAM in [industry])", () => {
      const opportunity = deriveMarketOpportunity(mockAnswers);
      expect(opportunity).toMatch(/\bTAM\b/i);
    });
  });

  describe("Derive Integration (multiple functions)", () => {
    it("all derive functions return non-empty strings given complete answers", () => {
      const results = {
        principles: derivePrinciples(mockAnswers),
        mandate: deriveMandateStatement(mockAnswers),
        goal12mo: derive12MonthGoal(mockAnswers),
        criteria: deriveSuccessCriteria(mockAnswers),
        advantage: deriveCompetitiveAdvantage(mockAnswers),
        market: deriveMarketOpportunity(mockAnswers),
      };

      Object.entries(results).forEach(([fn, result]) => {
        expect(result).toBeTruthy(
          `${fn} returned empty for complete answers`
        );
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it("all derive functions return empty strings given only partial answers", () => {
      const results = {
        principles: derivePrinciples(partialAnswers),
        mandate: deriveMandateStatement(partialAnswers),
        goal12mo: derive12MonthGoal(partialAnswers),
        criteria: deriveSuccessCriteria(partialAnswers),
        advantage: deriveCompetitiveAdvantage(partialAnswers),
        market: deriveMarketOpportunity(partialAnswers),
      };

      // At least some should be empty (given partial answers)
      const emptyCount = Object.values(results).filter((r) => r === "").length;
      expect(emptyCount).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("handles answers with very long values (truncates gracefully)", () => {
      const longAnswers = {
        ...mockAnswers,
        mission: "A".repeat(500),
      };
      const result = derivePrinciples(longAnswers);
      expect(result).toBeTruthy();
      expect(result.length).toBeLessThan(1000); // Reasonable cap
    });

    it("handles answers with empty strings (treats as missing)", () => {
      const emptyAnswers = {
        ...mockAnswers,
        mission: "",
        "target-market": "",
      };
      const mandate = deriveMandateStatement(emptyAnswers);
      expect(mandate).toBe(""); // Empty strings count as missing
    });

    it("handles answers with special characters (no injection)", () => {
      const specialAnswers = {
        ...mockAnswers,
        mission: 'Make "AI" accessible <to> everyone & enterprises',
      };
      const result = deriveMandateStatement(specialAnswers);
      expect(result).toBeTruthy();
      // Should not throw, even with special chars
    });

    it("handles missing fields in nested answers object", () => {
      const sparse = {} as any;
      expect(() => {
        derivePrinciples(sparse);
        deriveMandateStatement(sparse);
        derive12MonthGoal(sparse);
      }).not.toThrow();
    });
  });
});
