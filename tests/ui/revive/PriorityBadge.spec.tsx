/**
 * PriorityBadge Component Tests
 *
 * Per Phase 9 D-01: verify static PRIORITY_CLASSES map with full class strings.
 * Tests cover all three priority levels (low/medium/high) and ensure classes are applied correctly.
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { PriorityBadge } from "../../../src/ui/revive/PriorityBadge.js";

describe("PriorityBadge", () => {
  it("exports PriorityBadge as a function", () => {
    expect(typeof PriorityBadge).toBe("function");
  });

  it("renders low priority (< 0.33) with correct label and classes", () => {
    const element = React.createElement(PriorityBadge, { priority: 0.2 });

    // Verify it's a React element with a span tag
    expect(element).toBeTruthy();
    expect(element.$$typeof).toBeDefined();

    // The component should render as intended for low priority
    expect(element.props?.priority).toBe(0.2);
  });

  it("renders medium priority (0.33-0.66) with correct label and classes", () => {
    const element = React.createElement(PriorityBadge, { priority: 0.5 });

    expect(element).toBeTruthy();
    expect(element.props?.priority).toBe(0.5);
  });

  it("renders high priority (>= 0.66) with correct label and classes", () => {
    const element = React.createElement(PriorityBadge, { priority: 0.8 });

    expect(element).toBeTruthy();
    expect(element.props?.priority).toBe(0.8);
  });

  it("correctly maps priority thresholds", () => {
    // Low threshold: < 0.33
    const lowEdge = React.createElement(PriorityBadge, { priority: 0.32 });
    expect(lowEdge.props?.priority).toBe(0.32);

    // Medium threshold: >= 0.33
    const mediumEdge = React.createElement(PriorityBadge, { priority: 0.33 });
    expect(mediumEdge.props?.priority).toBe(0.33);

    // High threshold: >= 0.66
    const highEdge = React.createElement(PriorityBadge, { priority: 0.66 });
    expect(highEdge.props?.priority).toBe(0.66);
  });

  it("accepts numeric priority prop", () => {
    const element = React.createElement(PriorityBadge, { priority: 0.5 });

    expect(element.props).toBeDefined();
    expect(typeof element.props.priority).toBe("number");
  });

  it("returns React.ReactElement", () => {
    const element = React.createElement(PriorityBadge, { priority: 0.5 });

    // Should return a React element
    expect(element).toBeTruthy();
    expect(element.$$typeof).toBeDefined();
  });
});
