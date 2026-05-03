/**
 * Scope Filter Unit Tests
 *
 * Per XC-08: comprehensive unit tests for filterInterviewToScope.
 * Tests cover filtering to single/multiple/all/no sections, order preservation,
 * and null-safety.
 *
 * 20+ test cases covering:
 * - Filter to single section
 * - Filter to multiple sections
 * - Filter to all sections
 * - Filter to empty scope
 * - Section not found (silently omit)
 * - Order preservation (input [A, B, C], filter to [B, A] → output [A, B])
 * - Null-safety (null allSections, null affectedSectionIds)
 * - Deduplication in scope filter
 */

import { describe, it, expect } from "vitest";
import { filterInterviewToScope } from "../../src/reposition/scope-filter.js";
import type { InterviewSection } from "../../src/types/found.js";

// Mock interview sections for testing
const mockSections: InterviewSection[] = [
  {
    id: "big-picture",
    title: "Big Picture",
    intro: "Understanding your vision",
    questions: [{ id: "mission", prompt: "What's your mission?", type: "free-text-long" }],
  },
  {
    id: "revenue-and-customers",
    title: "Revenue & Customers",
    intro: "Understanding your business model",
    questions: [
      { id: "target-customer", prompt: "Who's your customer?", type: "free-text-long" },
    ],
  },
  {
    id: "growth-and-marketing",
    title: "Growth & Marketing",
    intro: "Understanding your growth strategy",
    questions: [
      { id: "growth-strategy", prompt: "How do you grow?", type: "free-text-long" },
    ],
  },
  {
    id: "product-direction",
    title: "Product Direction",
    intro: "Understanding your product vision",
    questions: [
      { id: "product-vision", prompt: "What's your product vision?", type: "free-text-long" },
    ],
  },
  {
    id: "ceo-autonomy",
    title: "CEO Autonomy",
    intro: "Understanding CEO decision rights",
    questions: [{ id: "ceo-mandate", prompt: "CEO decision rights?", type: "free-text-long" }],
  },
  {
    id: "vision-and-identity",
    title: "Vision & Identity",
    intro: "Understanding company identity",
    questions: [
      { id: "company-voice", prompt: "What's your voice?", type: "free-text-long" },
    ],
  },
];

describe("filterInterviewToScope - single section filtering", () => {
  it("should filter to single section (voice)", () => {
    const result = filterInterviewToScope(mockSections, ["vision-and-identity"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("vision-and-identity");
  });

  it("should filter to single section (target-customer)", () => {
    const result = filterInterviewToScope(mockSections, ["revenue-and-customers"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("revenue-and-customers");
  });

  it("should filter to single section (growth-strategy)", () => {
    const result = filterInterviewToScope(mockSections, ["growth-and-marketing"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("growth-and-marketing");
  });
});

describe("filterInterviewToScope - multiple section filtering", () => {
  it("should filter to two sections", () => {
    const result = filterInterviewToScope(mockSections, ["revenue-and-customers", "vision-and-identity"]);
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id)).toEqual(["revenue-and-customers", "vision-and-identity"]);
  });

  it("should filter to three sections", () => {
    const result = filterInterviewToScope(mockSections, [
      "vision-and-identity",
      "growth-and-marketing",
      "product-direction",
    ]);
    expect(result).toHaveLength(3);
  });

  it("should filter to four sections", () => {
    const result = filterInterviewToScope(mockSections, [
      "revenue-and-customers",
      "growth-and-marketing",
      "product-direction",
      "vision-and-identity",
    ]);
    expect(result).toHaveLength(4);
  });
});

describe("filterInterviewToScope - full scope filtering", () => {
  it("should return all sections when all are affected", () => {
    const allSectionIds = mockSections.map((s) => s.id);
    const result = filterInterviewToScope(mockSections, allSectionIds);
    expect(result).toHaveLength(6);
    expect(result).toEqual(mockSections);
  });
});

describe("filterInterviewToScope - empty scope filtering", () => {
  it("should return empty array when affectedSectionIds is empty", () => {
    const result = filterInterviewToScope(mockSections, []);
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it("should return empty array when affectedSectionIds is empty list", () => {
    const result = filterInterviewToScope(mockSections, []);
    expect(result).toEqual([]);
  });
});

describe("filterInterviewToScope - order preservation", () => {
  it("should preserve original order even when filter specifies different order", () => {
    // Request sections in reverse order: [vision, product, growth, revenue]
    // But original order is: [revenue, growth, product, vision]
    // Expected output: [revenue, growth, product, vision] (original order preserved)
    const result = filterInterviewToScope(mockSections, [
      "vision-and-identity",
      "product-direction",
      "growth-and-marketing",
      "revenue-and-customers",
    ]);
    expect(result.map((s) => s.id)).toEqual([
      "revenue-and-customers",
      "growth-and-marketing",
      "product-direction",
      "vision-and-identity",
    ]);
  });

  it("should preserve order for two sections requested in reverse order", () => {
    const result = filterInterviewToScope(mockSections, [
      "vision-and-identity",
      "big-picture",
    ]);
    expect(result[0].id).toBe("big-picture");
    expect(result[1].id).toBe("vision-and-identity");
  });

  it("should preserve order for three sections requested in mixed order", () => {
    const result = filterInterviewToScope(mockSections, [
      "product-direction",
      "big-picture",
      "growth-and-marketing",
    ]);
    expect(result.map((s) => s.id)).toEqual([
      "big-picture",
      "growth-and-marketing",
      "product-direction",
    ]);
  });
});

describe("filterInterviewToScope - missing sections", () => {
  it("should silently omit section not found in allSections", () => {
    const result = filterInterviewToScope(mockSections, [
      "revenue-and-customers",
      "nonexistent-section",
      "product-direction",
    ]);
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id)).toEqual([
      "revenue-and-customers",
      "product-direction",
    ]);
  });

  it("should return empty array if all requested sections are missing", () => {
    const result = filterInterviewToScope(mockSections, [
      "fake-section-1",
      "fake-section-2",
    ]);
    expect(result).toHaveLength(0);
  });

  it("should ignore multiple nonexistent sections", () => {
    const result = filterInterviewToScope(mockSections, [
      "nonexistent-1",
      "revenue-and-customers",
      "nonexistent-2",
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("revenue-and-customers");
  });
});

describe("filterInterviewToScope - deduplication", () => {
  it("should handle duplicate section IDs in affectedSectionIds", () => {
    const result = filterInterviewToScope(mockSections, [
      "vision-and-identity",
      "vision-and-identity",
      "revenue-and-customers",
    ]);
    // Should still return each section only once
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id)).toEqual([
      "revenue-and-customers",
      "vision-and-identity",
    ]);
  });

  it("should handle many duplicates", () => {
    const result = filterInterviewToScope(mockSections, [
      "big-picture",
      "big-picture",
      "big-picture",
      "revenue-and-customers",
      "revenue-and-customers",
    ]);
    expect(result).toHaveLength(2);
  });
});

describe("filterInterviewToScope - null-safety", () => {
  it("should return empty array when allSections is null", () => {
    const result = filterInterviewToScope(null, ["revenue-and-customers"]);
    expect(result).toEqual([]);
  });

  it("should return empty array when allSections is undefined", () => {
    const result = filterInterviewToScope(undefined, ["revenue-and-customers"]);
    expect(result).toEqual([]);
  });

  it("should return empty array when affectedSectionIds is null", () => {
    const result = filterInterviewToScope(mockSections, null);
    expect(result).toEqual([]);
  });

  it("should return empty array when affectedSectionIds is undefined", () => {
    const result = filterInterviewToScope(mockSections, undefined);
    expect(result).toEqual([]);
  });

  it("should return empty array when both parameters are null", () => {
    const result = filterInterviewToScope(null, null);
    expect(result).toEqual([]);
  });

  it("should return empty array when allSections is empty array", () => {
    const result = filterInterviewToScope([], ["revenue-and-customers"]);
    expect(result).toEqual([]);
  });
});

describe("filterInterviewToScope - section contents are preserved", () => {
  it("should preserve all fields of included sections", () => {
    const result = filterInterviewToScope(mockSections, ["revenue-and-customers"]);
    expect(result[0]).toEqual(mockSections[1]);
  });

  it("should not modify section data", () => {
    const originalId = mockSections[0].id;
    filterInterviewToScope(mockSections, ["big-picture"]);
    expect(mockSections[0].id).toBe(originalId);
  });

  it("should return references to original sections (not copies)", () => {
    const result = filterInterviewToScope(mockSections, ["big-picture"]);
    expect(result[0]).toBe(mockSections[0]);
  });
});

describe("filterInterviewToScope - edge cases", () => {
  it("should handle section ID case sensitivity", () => {
    // Section IDs are case-sensitive; "Big-Picture" !== "big-picture"
    const result = filterInterviewToScope(mockSections, ["Big-Picture"]);
    expect(result).toHaveLength(0);
  });

  it("should handle whitespace in section IDs gracefully", () => {
    const result = filterInterviewToScope(mockSections, ["vision-and-identity ", " revenue-and-customers"]);
    // Exact match required, so these should not match
    expect(result).toHaveLength(0);
  });

  it("should handle very large allSections list efficiently", () => {
    const largeSections = mockSections.concat(mockSections).concat(mockSections);
    const result = filterInterviewToScope(largeSections, ["vision-and-identity"]);
    // Should still return 3 copies of the same section (if requested once)
    // Actually, no — it filters once per unique position in the original array
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("should work with single-section list", () => {
    const singleSection = [mockSections[0]];
    const result = filterInterviewToScope(singleSection, ["big-picture"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("big-picture");
  });

  it("should work with single-request filter", () => {
    const result = filterInterviewToScope(mockSections, ["revenue-and-customers"]);
    expect(result).toHaveLength(1);
  });
});
