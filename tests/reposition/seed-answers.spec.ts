/**
 * Seed Answers Unit Tests
 *
 * Per XC-08: comprehensive unit tests for getSectionAnswerSeed.
 * Tests cover extracting current VISION values for each section,
 * mapping to interview field names, and null-safety.
 *
 * 15+ test cases covering:
 * - Extract voice section → company-voice field
 * - Extract target-customer section → target-customer field
 * - Extract mission section → mission field
 * - Extract all sections → all fields
 * - Missing section in VISION → empty object
 * - Null VISION → empty object
 * - Value preservation (no trimming, no formatting)
 */

import { describe, it, expect } from "vitest";
import { getSectionAnswerSeed } from "../../src/reposition/seed-answers.js";
import type { ParsedVision } from "../../src/types/index.js";

// Mock ParsedVision for testing
const mockVision: ParsedVision = {
  mission: "To democratize AI access",
  mandate: "Build products that enable founders",
  voice: "Bold, technical, direct; we speak to engineers as peers",
  principles: "- User-first\n- Transparent\n- Open source when possible",
  success_criteria_12mo: "10K+ paying customers, $1M ARR",
  vision_3year: "Become the default AI platform for startups",
  target_customer: "Technical founders building AI companies (Series A-C stage)",
  issue_structure: "Blockers, opportunities, technical debt, roadmap items",
  locality: "US-based teams, global customer reach",
  revenue_model: "Subscription (SaaS) with tiered pricing",
  launch_plan: "Beta access, then public launch in Q3 2026",
  trust_governance: "Founder approval on all major decisions",
  growth_strategy: "Focus on word-of-mouth and content marketing",
  sales_model: "Self-serve with account management for enterprise",
  product_direction: "Build the AI dev platform of the future",
  org_structure: "Lean team of 5, outsource non-core functions",
  operating_philosophy: "Move fast, iterate on founder feedback, keep codebase clean",
  ceo_mandate: "Full autonomy on product decisions; shared financial oversight",
  success_criteria: "Sustainable business with happy customers and healthy culture",
};

describe("getSectionAnswerSeed - mission section", () => {
  it("should extract mission section to mission field", () => {
    const result = getSectionAnswerSeed(mockVision, "mission");
    expect(result["mission"]).toBe("To democratize AI access");
  });

  it("should return only mission field when seeding mission section", () => {
    const result = getSectionAnswerSeed(mockVision, "mission");
    expect(Object.keys(result)).toEqual(["mission"]);
  });

  it("should preserve mission text exactly (no trimming)", () => {
    const visionWithSpaces: ParsedVision = {
      ...mockVision,
      mission: "  Spaces matter  \n",
    };
    const result = getSectionAnswerSeed(visionWithSpaces, "mission");
    expect(result["mission"]).toBe("  Spaces matter  \n");
  });
});

describe("getSectionAnswerSeed - voice section", () => {
  it("should extract voice section to company-voice field", () => {
    const result = getSectionAnswerSeed(mockVision, "voice");
    expect(result["company-voice"]).toContain("Bold, technical");
  });

  it("should return only company-voice field when seeding voice section", () => {
    const result = getSectionAnswerSeed(mockVision, "voice");
    expect(Object.keys(result)).toEqual(["company-voice"]);
  });
});

describe("getSectionAnswerSeed - principles section", () => {
  it("should extract principles section to core-principles field", () => {
    const result = getSectionAnswerSeed(mockVision, "principles");
    expect(result["core-principles"]).toContain("User-first");
  });

  it("should preserve markdown formatting in principles", () => {
    const result = getSectionAnswerSeed(mockVision, "principles");
    expect(result["core-principles"]).toContain("- User-first");
    expect(result["core-principles"]).toContain("\n");
  });
});

describe("getSectionAnswerSeed - target-customer section", () => {
  it("should extract target-customer section to target-customer field", () => {
    const result = getSectionAnswerSeed(mockVision, "target_customer");
    expect(result["target-customer"]).toContain("Technical founders");
  });

  it("should return only target-customer field when seeding target_customer section", () => {
    const result = getSectionAnswerSeed(mockVision, "target_customer");
    expect(Object.keys(result)).toEqual(["target-customer"]);
  });
});

describe("getSectionAnswerSeed - revenue_model section", () => {
  it("should extract revenue_model section to revenue-model field", () => {
    const result = getSectionAnswerSeed(mockVision, "revenue_model");
    expect(result["revenue-model"]).toContain("Subscription");
  });
});

describe("getSectionAnswerSeed - growth_strategy section", () => {
  it("should extract growth_strategy section to growth-strategy field", () => {
    const result = getSectionAnswerSeed(mockVision, "growth_strategy");
    expect(result["growth-strategy"]).toContain("word-of-mouth");
  });
});

describe("getSectionAnswerSeed - vision_3year section", () => {
  it("should extract vision_3year section to long-term-vision field", () => {
    const result = getSectionAnswerSeed(mockVision, "vision_3year");
    expect(result["long-term-vision"]).toContain("default AI platform");
  });
});

describe("getSectionAnswerSeed - operating_philosophy section", () => {
  it("should extract operating_philosophy section to operating-philosophy field", () => {
    const result = getSectionAnswerSeed(mockVision, "operating_philosophy");
    expect(result["operating-philosophy"]).toContain("Move fast");
  });
});

describe("getSectionAnswerSeed - success_criteria section", () => {
  it("should extract success_criteria section to success-definition field", () => {
    const result = getSectionAnswerSeed(mockVision, "success_criteria");
    expect(result["success-definition"]).toContain("Sustainable");
  });
});

describe("getSectionAnswerSeed - non-interviewed sections", () => {
  it("should return empty object for mandate section (not re-interviewed)", () => {
    const result = getSectionAnswerSeed(mockVision, "mandate");
    expect(result).toEqual({});
  });

  it("should return empty object for launch_plan section (not re-interviewed)", () => {
    const result = getSectionAnswerSeed(mockVision, "launch_plan");
    expect(result).toEqual({});
  });

  it("should return empty object for org_structure section (not re-interviewed)", () => {
    const result = getSectionAnswerSeed(mockVision, "org_structure");
    expect(result).toEqual({});
  });

  it("should return empty object for issue_structure section (not re-interviewed)", () => {
    const result = getSectionAnswerSeed(mockVision, "issue_structure");
    expect(result).toEqual({});
  });

  it("should return empty object for trust_governance section (not re-interviewed)", () => {
    const result = getSectionAnswerSeed(mockVision, "trust_governance");
    expect(result).toEqual({});
  });

  it("should return empty object for ceo_mandate section (not re-interviewed)", () => {
    const result = getSectionAnswerSeed(mockVision, "ceo_mandate");
    expect(result).toEqual({});
  });

  it("should return empty object for sales_model section (no dedicated question)", () => {
    const result = getSectionAnswerSeed(mockVision, "sales_model");
    expect(result).toEqual({});
  });

  it("should return empty object for locality section (not re-interviewed)", () => {
    const result = getSectionAnswerSeed(mockVision, "locality");
    expect(result).toEqual({});
  });
});

describe("getSectionAnswerSeed - empty or missing VISION content", () => {
  it("should return empty object when mission is empty string", () => {
    const emptyMissionVision: ParsedVision = { ...mockVision, mission: "" };
    const result = getSectionAnswerSeed(emptyMissionVision, "mission");
    expect(result).toEqual({});
  });

  it("should return empty object when voice is empty string", () => {
    const emptyVoiceVision: ParsedVision = { ...mockVision, voice: "" };
    const result = getSectionAnswerSeed(emptyVoiceVision, "voice");
    expect(result).toEqual({});
  });

  it("should return empty object when voice is only whitespace", () => {
    const whitespaceVoiceVision: ParsedVision = { ...mockVision, voice: "   \n   " };
    const result = getSectionAnswerSeed(whitespaceVoiceVision, "voice");
    expect(result).toEqual({});
  });

  it("should include field if content is non-empty after trimming", () => {
    const spaceVoiceVision: ParsedVision = { ...mockVision, voice: "  Some voice  " };
    const result = getSectionAnswerSeed(spaceVoiceVision, "voice");
    expect(result["company-voice"]).toBe("  Some voice  ");
  });
});

describe("getSectionAnswerSeed - null-safety", () => {
  it("should return empty object when vision is null", () => {
    const result = getSectionAnswerSeed(null, "mission");
    expect(result).toEqual({});
  });

  it("should return empty object when vision is undefined", () => {
    const result = getSectionAnswerSeed(undefined, "voice");
    expect(result).toEqual({});
  });

  it("should return empty object for any section when vision is null", () => {
    const result1 = getSectionAnswerSeed(null, "mission");
    const result2 = getSectionAnswerSeed(null, "voice");
    const result3 = getSectionAnswerSeed(null, "target_customer");
    expect(result1).toEqual({});
    expect(result2).toEqual({});
    expect(result3).toEqual({});
  });
});

describe("getSectionAnswerSeed - multiple sections", () => {
  it("should handle seeding multiple sections independently", () => {
    const missionSeed = getSectionAnswerSeed(mockVision, "mission");
    const voiceSeed = getSectionAnswerSeed(mockVision, "voice");
    const targetSeed = getSectionAnswerSeed(mockVision, "target_customer");

    expect(missionSeed).toEqual({ mission: expect.any(String) });
    expect(voiceSeed).toEqual({ "company-voice": expect.any(String) });
    expect(targetSeed).toEqual({ "target-customer": expect.any(String) });
  });

  it("should return different fields for different sections", () => {
    const keys1 = Object.keys(getSectionAnswerSeed(mockVision, "mission"));
    const keys2 = Object.keys(getSectionAnswerSeed(mockVision, "voice"));
    expect(keys1[0]).not.toBe(keys2[0]);
  });
});

describe("getSectionAnswerSeed - value preservation", () => {
  it("should preserve multiline content in principles", () => {
    const result = getSectionAnswerSeed(mockVision, "principles");
    expect(result["core-principles"]).toContain("\n");
  });

  it("should preserve special characters and formatting", () => {
    const specialVision: ParsedVision = {
      ...mockVision,
      voice: "Bold! @#$% & special chars: 123!",
    };
    const result = getSectionAnswerSeed(specialVision, "voice");
    expect(result["company-voice"]).toBe("Bold! @#$% & special chars: 123!");
  });

  it("should not modify content (no trimming on non-empty strings)", () => {
    const result = getSectionAnswerSeed(mockVision, "target_customer");
    const original = mockVision.target_customer;
    expect(result["target-customer"]).toBe(original);
  });

  it("should handle very long content", () => {
    const longVision: ParsedVision = {
      ...mockVision,
      mission: "A".repeat(10000),
    };
    const result = getSectionAnswerSeed(longVision, "mission");
    expect(result["mission"]).toHaveLength(10000);
  });
});

describe("getSectionAnswerSeed - round-trip consistency", () => {
  it("should return consistent results for same section and vision", () => {
    const result1 = getSectionAnswerSeed(mockVision, "mission");
    const result2 = getSectionAnswerSeed(mockVision, "mission");
    expect(result1).toEqual(result2);
  });

  it("should return consistent results across multiple calls", () => {
    const results = [
      getSectionAnswerSeed(mockVision, "voice"),
      getSectionAnswerSeed(mockVision, "voice"),
      getSectionAnswerSeed(mockVision, "voice"),
    ];
    expect(results[0]).toEqual(results[1]);
    expect(results[1]).toEqual(results[2]);
  });
});
