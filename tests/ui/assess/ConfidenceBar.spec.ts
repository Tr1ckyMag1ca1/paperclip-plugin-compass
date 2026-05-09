/**
 * ConfidenceBar Unit Tests
 *
 * Tests for ConfidenceBar component: threshold-driven fill color map,
 * correct width percentage calculation, and host token usage.
 *
 * Thresholds (Phase 8 D-08):
 * - High (>0.75): bg-emerald-500
 * - Medium (0.4–0.75): bg-yellow-500
 * - Low (<0.4): bg-red-500
 *
 * Track: bg-muted, rounded-none, h-2 (8px fixed height)
 * Label: text-xs font-medium text-muted-foreground
 *
 * Note: These are property/structure tests verifying the React element API contract.
 * Full DOM rendering tests with jsdom deferred to future phases.
 */

import React from "react";
import { describe, it, expect } from "vitest";
import { ConfidenceBar } from "../../../src/ui/assess/ConfidenceBar.js";

describe("ConfidenceBar thresholds", () => {
  it("exports ConfidenceBar as a named export", () => {
    expect(typeof ConfidenceBar).toBe("function");
  });

  it("renders root container as div", () => {
    const result = ConfidenceBar({ confidence: 0.5 });
    expect(result.type).toBe("div");
  });

  it("root container has flex layout with gap-2", () => {
    const result = ConfidenceBar({ confidence: 0.5 });
    const className = result.props.className as string;
    expect(className).toContain("flex");
    expect(className).toContain("items-center");
    expect(className).toContain("gap-2");
  });

  it("track div has bg-muted rounded-none h-2", () => {
    const result = ConfidenceBar({ confidence: 0.5 });
    const trackDiv = result.props.children[0];
    const trackClassName = trackDiv.props.className as string;
    expect(trackClassName).toContain("bg-muted");
    expect(trackClassName).toContain("rounded-none");
    expect(trackClassName).toContain("h-2");
  });

  it("track div has flex-1 overflow-hidden", () => {
    const result = ConfidenceBar({ confidence: 0.5 });
    const trackDiv = result.props.children[0];
    const trackClassName = trackDiv.props.className as string;
    expect(trackClassName).toContain("flex-1");
    expect(trackClassName).toContain("overflow-hidden");
  });

  it("fill div has h-full and transition classes", () => {
    const result = ConfidenceBar({ confidence: 0.5 });
    const trackDiv = result.props.children[0];
    const fillDiv = trackDiv.props.children;
    const fillClassName = fillDiv.props.className as string;
    expect(fillClassName).toContain("h-full");
    expect(fillClassName).toContain("transition-all");
    expect(fillClassName).toContain("duration-300");
  });

  it("high confidence (0.9) produces emerald fill class", () => {
    const result = ConfidenceBar({ confidence: 0.9 });
    const trackDiv = result.props.children[0];
    const fillDiv = trackDiv.props.children;
    const fillClassName = fillDiv.props.className as string;
    expect(fillClassName).toContain("bg-emerald-500");
  });

  it("medium confidence (0.6) produces yellow fill class", () => {
    const result = ConfidenceBar({ confidence: 0.6 });
    const trackDiv = result.props.children[0];
    const fillDiv = trackDiv.props.children;
    const fillClassName = fillDiv.props.className as string;
    expect(fillClassName).toContain("bg-yellow-500");
  });

  it("low confidence (0.3) produces red fill class", () => {
    const result = ConfidenceBar({ confidence: 0.3 });
    const trackDiv = result.props.children[0];
    const fillDiv = trackDiv.props.children;
    const fillClassName = fillDiv.props.className as string;
    expect(fillClassName).toContain("bg-red-500");
  });

  it("boundary: 0.75 (medium threshold)", () => {
    const result = ConfidenceBar({ confidence: 0.75 });
    const trackDiv = result.props.children[0];
    const fillDiv = trackDiv.props.children;
    const fillClassName = fillDiv.props.className as string;
    expect(fillClassName).toContain("bg-yellow-500");
  });

  it("boundary: 0.76 (just above high threshold)", () => {
    const result = ConfidenceBar({ confidence: 0.76 });
    const trackDiv = result.props.children[0];
    const fillDiv = trackDiv.props.children;
    const fillClassName = fillDiv.props.className as string;
    expect(fillClassName).toContain("bg-emerald-500");
  });

  it("boundary: 0.4 (low/medium threshold)", () => {
    const result = ConfidenceBar({ confidence: 0.4 });
    const trackDiv = result.props.children[0];
    const fillDiv = trackDiv.props.children;
    const fillClassName = fillDiv.props.className as string;
    expect(fillClassName).toContain("bg-yellow-500");
  });

  it("boundary: 0.39 (just below medium threshold)", () => {
    const result = ConfidenceBar({ confidence: 0.39 });
    const trackDiv = result.props.children[0];
    const fillDiv = trackDiv.props.children;
    const fillClassName = fillDiv.props.className as string;
    expect(fillClassName).toContain("bg-red-500");
  });

  it("displays label by default", () => {
    const result = ConfidenceBar({ confidence: 0.75 });
    const children = result.props.children as React.ReactElement[];
    expect(children.length).toBe(2);
  });

  it("can hide label with label={false}", () => {
    const result = ConfidenceBar({ confidence: 0.75, label: false });
    const children = result.props.children as (React.ReactElement | false | null)[];
    const nonNullChildren = children.filter(child => child !== false && child !== null);
    expect(nonNullChildren.length).toBe(1);
  });

  it("label has text-xs font-medium text-muted-foreground", () => {
    const result = ConfidenceBar({ confidence: 0.6 });
    const children = result.props.children as React.ReactElement[];
    const label = children[1];
    const labelClassName = label.props.className as string;
    expect(labelClassName).toContain("text-xs");
    expect(labelClassName).toContain("font-medium");
    expect(labelClassName).toContain("text-muted-foreground");
  });

  it("label has whitespace-nowrap w-12 text-right", () => {
    const result = ConfidenceBar({ confidence: 0.6 });
    const children = result.props.children as React.ReactElement[];
    const label = children[1];
    const labelClassName = label.props.className as string;
    expect(labelClassName).toContain("whitespace-nowrap");
    expect(labelClassName).toContain("w-12");
    expect(labelClassName).toContain("text-right");
  });

  it("does not use broken spacing tokens", () => {
    const result = ConfidenceBar({ confidence: 0.5 });
    const className = result.props.className as string;
    expect(className).not.toMatch(/gap-sm|gap-md|px-sm|py-sm|p-sm|p-md/);
  });

  it("does not use broken color tokens in root", () => {
    const result = ConfidenceBar({ confidence: 0.5 });
    const className = result.props.className as string;
    expect(className).not.toMatch(/bg-accent|text-accent|text-destructive/);
  });

  it("does not use broken rounded tokens", () => {
    const result = ConfidenceBar({ confidence: 0.5 });
    const trackDiv = result.props.children[0];
    const trackClassName = trackDiv.props.className as string;
    expect(trackClassName).not.toMatch(/\brounded\b(?!-none)|rounded-lg/);
  });

  it("fill width style contains percentage for 50% confidence", () => {
    const result = ConfidenceBar({ confidence: 0.5 });
    const trackDiv = result.props.children[0];
    const fillDiv = trackDiv.props.children;
    const styleAttr = fillDiv.props.style as Record<string, string>;
    expect(styleAttr.width).toBe("50%");
  });

  it("fill width style contains percentage for 75% confidence", () => {
    const result = ConfidenceBar({ confidence: 0.75 });
    const trackDiv = result.props.children[0];
    const fillDiv = trackDiv.props.children;
    const styleAttr = fillDiv.props.style as Record<string, string>;
    expect(styleAttr.width).toBe("75%");
  });
});
