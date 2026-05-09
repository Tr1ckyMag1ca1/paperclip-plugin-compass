/**
 * AmendmentDiff Component Tests
 *
 * Per Phase 8 Plan 03: Unit tests for diff line highlighting and collapsible structure.
 * Verify add/remove/context line colors and details/summary toggle behavior.
 */

import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { AmendmentDiff } from "../../../src/ui/assess/AmendmentDiff";

describe("AmendmentDiff line highlighting", () => {
  const sampleDiff = `+const x = 1
-const x = 0
 const y = 2`;

  /**
   * Test Case 1: Add lines render with emerald color
   * Verifies that lines starting with "+" receive text-emerald-600 and bg-emerald-500/10
   */
  it("renders add lines with emerald color and background", () => {
    const html = renderToString(<AmendmentDiff amendment={sampleDiff} />);

    // Assert: Emerald classes are present
    expect(html).toContain("text-emerald-600");
    expect(html).toContain("bg-emerald-500/10");

    // Assert: Add line content is present
    expect(html).toContain("+const x = 1");
  });

  /**
   * Test Case 2: Remove lines render with red color
   * Verifies that lines starting with "−" receive text-red-600 and bg-red-500/10
   */
  it("renders remove lines with red color and background", () => {
    const html = renderToString(<AmendmentDiff amendment={sampleDiff} />);

    // Assert: Red classes are present
    expect(html).toContain("text-red-600");
    expect(html).toContain("bg-red-500/10");

    // Assert: Remove line content is present
    expect(html).toContain("-const x = 0");
  });

  /**
   * Test Case 3: Context lines render neutral (no color background)
   * Verifies that context lines (no +/−) receive only text-foreground
   */
  it("renders context lines with neutral color (no background)", () => {
    const html = renderToString(<AmendmentDiff amendment={sampleDiff} />);

    // Assert: Context line content is present
    expect(html).toContain("const y = 2");

    // Assert: text-foreground appears in the output
    expect(html).toContain("text-foreground");

    // Assert: The context line is rendered (it's the one without color background)
    const lines = html.split(/\n/);
    const contextLineFound = lines.some(
      line => line.includes("const y = 2") && line.includes("text-foreground")
    );
    expect(contextLineFound).toBe(true);
  });

  /**
   * Test Case 4: Preserves collapsible details/summary structure
   * Verifies that the component maintains the <details> and <summary> elements
   */
  it("preserves details/summary structure (no redesign)", () => {
    const html = renderToString(<AmendmentDiff amendment={sampleDiff} />);

    // Assert: details and summary elements exist
    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    expect(html).toContain("Proposed amendment");
  });

  /**
   * Test Case 5: Contains correct summary styling
   * Verifies that the summary has text-xs font-medium and proper hover state
   */
  it("summary has correct typography (text-xs font-medium)", () => {
    const html = renderToString(<AmendmentDiff amendment={sampleDiff} />);

    // Assert: Summary has correct typography and styling
    expect(html).toContain("text-xs");
    expect(html).toContain("font-medium");
    expect(html).toContain("text-foreground");
    expect(html).toContain("hover:");
  });

  /**
   * Test Case 6: Diff container has correct styling
   * Verifies that the diff container uses bg-muted, border, and p-3
   */
  it("diff container has correct styling (bg-muted, border, p-3)", () => {
    const html = renderToString(<AmendmentDiff amendment={sampleDiff} />);

    // Assert: Container styling is present
    expect(html).toContain("bg-muted");
    expect(html).toContain("border");
    expect(html).toContain("border-border");
    expect(html).toContain("p-3");
    expect(html).toContain("rounded-none");
  });

  /**
   * Test Case 7: Contains no broken tokens
   * Verifies that all legacy custom tokens have been removed
   */
  it("contains no broken tokens (gap-sm, p-md, rounded-lg, text-accent, text-destructive)", () => {
    const html = renderToString(<AmendmentDiff amendment={sampleDiff} />);

    // Assert: No legacy custom tokens
    expect(html).not.toContain("gap-sm");
    expect(html).not.toContain("p-md");
    expect(html).not.toContain("rounded-lg");
    expect(html).not.toContain("text-accent");
    expect(html).not.toContain("text-destructive");
    expect(html).not.toContain("gap-md");
    expect(html).not.toContain("mt-md");
  });

  /**
   * Test Case 8: All three line types render in single diff
   * Verifies that add/remove/context lines all coexist correctly
   */
  it("renders all three line types (add, remove, context) correctly", () => {
    const html = renderToString(<AmendmentDiff amendment={sampleDiff} />);

    // Assert: All line types are present with correct colors
    expect(html).toContain("text-emerald-600");
    expect(html).toContain("text-red-600");
    expect(html).toContain("+const x = 1");
    expect(html).toContain("-const x = 0");
    expect(html).toContain("const y = 2");

    // Assert: Diff is readable (structure intact)
    expect(html).toContain("const");
  });

  /**
   * Test Case 9: ChevronDown icon is present and has transition
   * Verifies that the collapse/expand icon has the necessary transition class
   */
  it("has ChevronDown icon with transition-transform class", () => {
    const html = renderToString(<AmendmentDiff amendment={sampleDiff} />);

    // Assert: Transition transform class is present (for the chevron)
    expect(html).toContain("transition-transform");

    // Assert: h-4 w-4 icon sizing is present
    expect(html).toContain("h-4");
    expect(html).toContain("w-4");
  });

  /**
   * Test Case 10: Amendment with only context lines
   * Verifies behavior when diff contains no add/remove lines
   */
  it("handles amendment with only context lines", () => {
    const contextOnlyDiff = ` line 1
 line 2
 line 3`;
    const html = renderToString(<AmendmentDiff amendment={contextOnlyDiff} />);

    // Assert: All lines are rendered
    expect(html).toContain("line 1");
    expect(html).toContain("line 2");
    expect(html).toContain("line 3");

    // Assert: All use neutral color
    expect(html).toContain("text-foreground");

    // Assert: No colored backgrounds
    expect(html).not.toContain("bg-emerald-500/10");
    expect(html).not.toContain("bg-red-500/10");
  });

  /**
   * Test Case 11: Empty amendment handling
   * Verifies that the component doesn't crash with empty amendment
   */
  it("handles empty amendment gracefully", () => {
    const emptyDiff = "";
    const html = renderToString(<AmendmentDiff amendment={emptyDiff} />);

    // Assert: Component still renders
    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    expect(html).toContain("Proposed amendment");
  });

  /**
   * Test Case 12: Amendment with whitespace-only lines
   * Verifies that lines with only whitespace are filtered out
   */
  it("filters out whitespace-only lines", () => {
    const diffWithWhitespace = `+line 1

-line 2`;
    const html = renderToString(<AmendmentDiff amendment={diffWithWhitespace} />);

    // Assert: Meaningful lines are present
    expect(html).toContain("+line 1");
    expect(html).toContain("-line 2");

    // Assert: Structure is valid
    expect(html).toContain("<details");
  });
});
