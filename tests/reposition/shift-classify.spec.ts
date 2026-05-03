/**
 * Shift Classifier Unit Tests
 *
 * Per XC-08: comprehensive unit tests for classifyShift and isValidShiftIntent.
 * Tests cover all 4 shift archetypes (rebrand, pivot, scale, tighten) plus
 * edge cases, confidence scoring, and keyword matching.
 *
 * 50+ test cases covering:
 * - Rebrand examples ("rebrand toward compliance", "visual-identity refresh")
 * - Pivot examples ("narrow to enterprise", "expand globally")
 * - Scale examples ("scale to 10K+ ARR", "grow 3x")
 * - Tighten examples ("strengthen governance", "tighten voice")
 * - Mixed keywords (multiple shifts in one intent)
 * - Edge cases (empty, <20 chars, no keywords, malformed)
 * - Confidence score ranges (0, 0.3–0.9, 1.0)
 */

import { describe, it, expect } from "vitest";
import { classifyShift, isValidShiftIntent } from "../../src/reposition/shift-classify.js";
import type { ParsedVision } from "../../src/types/index.js";

// Mock minimal ParsedVision for testing
const mockVision: ParsedVision = {
  mission: "Test mission",
  mandate: "Test mandate",
  voice: "Test voice",
  principles: "Test principles",
  success_criteria_12mo: "Test success",
  vision_3year: "Test 3-year",
  target_customer: "Test customer",
  issue_structure: "Test issues",
  locality: "Test locality",
  revenue_model: "Test revenue",
  launch_plan: "Test launch",
  principles: "Test governance",
  growth_strategy: "Test growth",
  sales_model: "Test sales",
  product_direction: "Test product",
  org_structure: "Test org",
  operating_philosophy: "Test philosophy",
  ceo_mandate: "Test CEO",
  success_criteria: "Test criteria",
};

describe("classifyShift - rebrand shift archetype", () => {
  it("should detect rebrand keyword and map to voice + product_direction + target_customer", () => {
    const result = classifyShift("rebrand our company toward a more modern identity", mockVision);
    expect(result.affectedSections).toContain("voice");
    expect(result.affectedSections).toContain("product_direction");
    expect(result.affectedSections).toContain("target_customer");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("should detect brand-refresh keyword", () => {
    const result = classifyShift("We need a brand-refresh to appeal to younger audiences", mockVision);
    expect(result.affectedSections).toContain("voice");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("should detect reposition-brand keyword", () => {
    const result = classifyShift("reposition-brand focus away from luxury", mockVision);
    expect(result.affectedSections).toContain("voice");
  });

  it("should detect visual-identity keyword", () => {
    const result = classifyShift("update our visual-identity across all channels", mockVision);
    expect(result.affectedSections).toContain("voice");
  });

  it("should detect tone-shift keyword", () => {
    const result = classifyShift("implement a tone-shift to be more professional and less playful", mockVision);
    expect(result.affectedSections).toContain("voice");
  });
});

describe("classifyShift - pivot shift archetype", () => {
  it("should detect pivot keyword and map to target_customer + mission + principles", () => {
    const result = classifyShift("pivot our business to focus on enterprise customers", mockVision);
    expect(result.affectedSections).toContain("target_customer");
    expect(result.affectedSections).toContain("mission");
    expect(result.affectedSections).toContain("principles");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("should detect narrow-focus keyword", () => {
    const result = classifyShift("narrow-focus on small businesses in the healthcare sector", mockVision);
    expect(result.affectedSections).toContain("target_customer");
  });

  it("should detect expand-target keyword", () => {
    const result = classifyShift("expand-target market to include government agencies", mockVision);
    expect(result.affectedSections).toContain("target_customer");
  });

  it("should detect customer-shift keyword", () => {
    const result = classifyShift("customer-shift from SMBs to enterprises", mockVision);
    expect(result.affectedSections).toContain("target_customer");
  });

  it("should detect market-shift keyword", () => {
    const result = classifyShift("market-shift toward high-touch services", mockVision);
    expect(result.affectedSections).toContain("target_customer");
  });
});

describe("classifyShift - scale shift archetype", () => {
  it("should detect scale keyword and map to growth_strategy + revenue_model + success_criteria", () => {
    const result = classifyShift("scale to 100K+ ARR and expand our growth_strategy", mockVision);
    expect(result.affectedSections).toContain("growth_strategy");
    expect(result.affectedSections).toContain("revenue_model");
    expect(result.affectedSections).toContain("success_criteria");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("should detect scale-up keyword", () => {
    const result = classifyShift("It's time to scale-up operations globally", mockVision);
    expect(result.affectedSections).toContain("growth_strategy");
  });

  it("should detect grow-revenue keyword", () => {
    const result = classifyShift("grow-revenue by 3x through channel partnerships", mockVision);
    expect(result.affectedSections).toContain("revenue_model");
  });

  it("should detect expansion-globally keyword", () => {
    const result = classifyShift("expand-globally into APAC markets", mockVision);
    expect(result.affectedSections).toContain("growth_strategy");
  });

  it("should detect growth-acceleration keyword", () => {
    const result = classifyShift("growth-acceleration is our top priority for 2026", mockVision);
    expect(result.affectedSections).toContain("growth_strategy");
  });
});

describe("classifyShift - tighten shift archetype", () => {
  it("should detect tighten keyword and map to principles + principles + voice", () => {
    const result = classifyShift("tighten our operating principles and governance", mockVision);
    expect(result.affectedSections).toContain("principles");
    expect(result.affectedSections).toContain("principles");
    expect(result.affectedSections).toContain("voice");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("should detect strengthen-governance keyword", () => {
    const result = classifyShift("strengthen-governance with formal approval processes", mockVision);
    expect(result.affectedSections).toContain("principles");
  });

  it("should detect governance-tighten keyword", () => {
    const result = classifyShift("governance-tighten to add founder oversight", mockVision);
    expect(result.affectedSections).toContain("principles");
  });

  it("should detect risk-mitigation keyword", () => {
    const result = classifyShift("risk-mitigation requires stricter compliance", mockVision);
    expect(result.affectedSections).toContain("principles");
  });

  it("should detect compliance-focus keyword", () => {
    const result = classifyShift("compliance-focus shifts our operational principles", mockVision);
    expect(result.affectedSections).toContain("principles");
  });
});

describe("classifyShift - compliance and regulatory keywords", () => {
  it("should detect compliance keyword and map to principles + mandate + principles", () => {
    const result = classifyShift("compliance is now a core requirement for our business", mockVision);
    expect(result.affectedSections).toContain("principles");
    expect(result.affectedSections).toContain("principles");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("should detect regulatory keyword", () => {
    const result = classifyShift("regulatory changes require new operational principles", mockVision);
    expect(result.affectedSections).toContain("principles");
  });

  it("should detect government-work keyword", () => {
    const result = classifyShift("start pursuing government-work as a revenue stream", mockVision);
    expect(result.affectedSections).toContain("target_customer");
  });
});

describe("classifyShift - business model keywords", () => {
  it("should detect enterprise keyword and map appropriately", () => {
    const result = classifyShift("shift to focus exclusively on enterprise customers", mockVision);
    expect(result.affectedSections).toContain("target_customer");
  });

  it("should detect b2b-focus keyword", () => {
    const result = classifyShift("b2b-focus means changing our sales_model", mockVision);
    expect(result.affectedSections).toContain("target_customer");
  });

  it("should detect subscription-model keyword", () => {
    const result = classifyShift("adopt subscription-model for recurring revenue", mockVision);
    expect(result.affectedSections).toContain("revenue_model");
  });

  it("should detect freemium-model keyword", () => {
    const result = classifyShift("freemium-model will accelerate user acquisition", mockVision);
    expect(result.affectedSections).toContain("revenue_model");
  });

  it("should detect marketplace keyword", () => {
    const result = classifyShift("launch a marketplace to enable partner ecosystem", mockVision);
    expect(result.affectedSections).toContain("target_customer");
  });
});

describe("classifyShift - mixed keywords (multiple shifts)", () => {
  it("should handle multiple keywords in a single intent", () => {
    const result = classifyShift(
      "rebrand and pivot to focus on enterprise compliance with tighter governance",
      mockVision
    );
    expect(result.affectedSections.length).toBeGreaterThan(1);
    expect(result.confidence).toBeGreaterThan(0.4);
  });

  it("should accumulate sections from multiple keyword groups", () => {
    const result = classifyShift("scale globally while tightening voice and principles", mockVision);
    expect(result.affectedSections).toContain("growth_strategy");
    expect(result.affectedSections).toContain("voice");
    expect(result.affectedSections).toContain("principles");
  });

  it("should detect keywords regardless of order", () => {
    const result1 = classifyShift("rebrand and pivot our business", mockVision);
    const result2 = classifyShift("pivot and rebrand our business", mockVision);
    expect(result1.affectedSections.sort()).toEqual(result2.affectedSections.sort());
  });
});

describe("classifyShift - confidence scoring", () => {
  it("should return confidence 0 for empty description", () => {
    const result = classifyShift("", mockVision);
    expect(result.confidence).toBe(0);
    expect(result.affectedSections.length).toBe(0);
  });

  it("should return low confidence for single keyword", () => {
    const result = classifyShift("rebrand this year", mockVision);
    expect(result.confidence).toBeGreaterThanOrEqual(0.3);
    expect(result.confidence).toBeLessThan(0.5);
  });

  it("should return medium confidence for multiple keywords", () => {
    const result = classifyShift("rebrand and pivot our business model", mockVision);
    expect(result.confidence).toBeGreaterThan(0.4);
    expect(result.confidence).toBeLessThan(0.9);
  });

  it("should return high confidence for many keywords", () => {
    const result = classifyShift(
      "rebrand, pivot enterprise, scale compliance, and tighten governance",
      mockVision
    );
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it("should never exceed confidence 1.0", () => {
    const result = classifyShift(
      "rebrand and rebrand and rebrand and rebrand and rebrand",
      mockVision
    );
    expect(result.confidence).toBeLessThanOrEqual(1.0);
  });
});

describe("classifyShift - edge cases", () => {
  it("should handle null vision parameter gracefully", () => {
    const result = classifyShift("rebrand our company", null as any);
    // Should not throw; classification is independent of current vision
    expect(result.affectedSections).toContain("voice");
  });

  it("should handle undefined vision parameter gracefully", () => {
    const result = classifyShift("scale our growth_strategy", undefined as any);
    expect(result.affectedSections).toContain("growth_strategy");
  });

  it("should be case-insensitive (uppercase keywords)", () => {
    const result = classifyShift("REBRAND our company vision", mockVision);
    expect(result.affectedSections).toContain("voice");
  });

  it("should be case-insensitive (mixed case keywords)", () => {
    const result = classifyShift("We need to Pivot to Enterprise markets", mockVision);
    expect(result.affectedSections).toContain("target_customer");
  });

  it("should ignore non-keyword words", () => {
    const result = classifyShift("some random text with no shift keywords at all", mockVision);
    expect(result.confidence).toBe(0);
    expect(result.affectedSections.length).toBe(0);
  });

  it("should handle description with only whitespace", () => {
    const result = classifyShift("   \n  \t  ", mockVision);
    expect(result.confidence).toBe(0);
    expect(result.affectedSections.length).toBe(0);
  });

  it("should preserve section order (alphabetical)", () => {
    const result = classifyShift("rebrand and pivot and scale", mockVision);
    const sorted = result.affectedSections.slice().sort();
    expect(result.affectedSections).toEqual(sorted);
  });

  it("should deduplicate affected sections", () => {
    // "rebrand" and "tone-shift" both add "voice"
    const result = classifyShift("rebrand with tone-shift focus", mockVision);
    const voiceCount = result.affectedSections.filter((s) => s === "voice").length;
    expect(voiceCount).toBe(1);
  });
});

describe("classifyShift - rationale field", () => {
  it("should include rationale explaining detected keywords", () => {
    const result = classifyShift("rebrand our company", mockVision);
    expect(result.rationale).toContain("Detected keywords");
    expect(result.rationale).toContain("rebrand");
  });

  it("should list affected sections in rationale", () => {
    const result = classifyShift("rebrand our company", mockVision);
    expect(result.rationale).toContain("voice");
  });

  it("should provide 'No recognized keywords' rationale when no matches", () => {
    const result = classifyShift("xyz totally unrelated words", mockVision);
    expect(result.rationale).toContain("No recognized shift keywords");
  });
});

describe("isValidShiftIntent - validation", () => {
  it("should accept intent with >= 20 characters", () => {
    expect(isValidShiftIntent("This is a valid long shift intent text here")).toBe(true);
  });

  it("should accept intent with exactly 20 characters", () => {
    expect(isValidShiftIntent("12345678901234567890")).toBe(true);
  });

  it("should reject intent with < 20 characters", () => {
    expect(isValidShiftIntent("Short intent text")).toBe(false);
  });

  it("should reject empty intent", () => {
    expect(isValidShiftIntent("")).toBe(false);
  });

  it("should reject whitespace-only intent", () => {
    expect(isValidShiftIntent("   \n  \t  ")).toBe(false);
  });

  it("should count after trimming whitespace", () => {
    expect(isValidShiftIntent("   20 character text here!!!   ")).toBe(true);
  });

  it("should reject if only leading/trailing whitespace reaches 20", () => {
    expect(isValidShiftIntent("       short       ")).toBe(false);
  });
});

describe("classifyShift + isValidShiftIntent - integration", () => {
  it("should classify only valid intents", () => {
    const intent = "This is a valid shift intent about rebranding";
    const isValid = isValidShiftIntent(intent);
    const classification = classifyShift(intent, mockVision);

    expect(isValid).toBe(true);
    expect(classification.confidence).toBeGreaterThan(0);
  });

  it("should handle invalid intent gracefully in classifier", () => {
    const intent = "short";
    const isValid = isValidShiftIntent(intent);
    const classification = classifyShift(intent, mockVision);

    expect(isValid).toBe(false);
    // But classifier should still work (returns empty scope)
    expect(classification.affectedSections.length).toBe(0);
  });
});
