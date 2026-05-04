/**
 * Card Primitive Unit Tests
 *
 * Tests for Card component: variant control (default/muted/elevated),
 * padding control (sm/md/lg), always sharp corners (rounded-none),
 * and correct host token usage (bg-card, bg-muted, border-border).
 *
 * Note: These are property/structure tests verifying the API contract.
 * Full rendering tests with jsdom deferred to future phases.
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { Card } from "../../src/ui/primitives/Card.js";

describe("Card primitive", () => {
  it("exports Card as a named export", () => {
    expect(typeof Card).toBe("function");
  });

  it("renders with default variant and padding", () => {
    const element = Card({
      children: React.createElement("span", null, "Content"),
    });
    expect(element).toBeTruthy();
    expect(element.type).toBe("div");
  });

  it("renders default variant with bg-card and border-border", () => {
    const element = Card({
      variant: "default",
      children: React.createElement("span", null, "Test"),
    });
    const className = element.props.className as string;
    expect(className).toContain("bg-card");
    expect(className).toContain("border-border");
    expect(className).not.toContain("shadow");
  });

  it("renders muted variant with bg-muted", () => {
    const element = Card({
      variant: "muted",
      children: React.createElement("span", null, "Test"),
    });
    const className = element.props.className as string;
    expect(className).toContain("bg-muted");
    expect(className).toContain("border-border");
  });

  it("renders elevated variant with shadow-sm", () => {
    const element = Card({
      variant: "elevated",
      children: React.createElement("span", null, "Test"),
    });
    const className = element.props.className as string;
    expect(className).toContain("shadow-sm");
    expect(className).toContain("bg-card");
    expect(className).toContain("border-border");
  });

  it("renders sm padding with p-2", () => {
    const element = Card({
      padding: "sm",
      children: React.createElement("span", null, "Test"),
    });
    const className = element.props.className as string;
    expect(className).toContain("p-2");
  });

  it("renders md padding with p-4 (default)", () => {
    const element = Card({
      padding: "md",
      children: React.createElement("span", null, "Test"),
    });
    const className = element.props.className as string;
    expect(className).toContain("p-4");
  });

  it("renders lg padding with p-6", () => {
    const element = Card({
      padding: "lg",
      children: React.createElement("span", null, "Test"),
    });
    const className = element.props.className as string;
    expect(className).toContain("p-6");
  });

  it("always renders with rounded-none (sharp corners)", () => {
    const element1 = Card({
      variant: "default",
      children: React.createElement("span", null, "Test"),
    });
    const element2 = Card({
      variant: "elevated",
      children: React.createElement("span", null, "Test"),
    });
    const element3 = Card({
      variant: "muted",
      children: React.createElement("span", null, "Test"),
    });

    expect((element1.props.className as string)).toContain("rounded-none");
    expect((element2.props.className as string)).toContain("rounded-none");
    expect((element3.props.className as string)).toContain("rounded-none");
  });

  it("renders children correctly", () => {
    const testChild = React.createElement("span", { key: "test" }, "Test Content");
    const element = Card({ children: testChild });
    expect(element.props.children).toBe(testChild);
  });

  it("does not use broken spacing tokens (gap-xs, px-sm, py-sm)", () => {
    const element = Card({
      variant: "default",
      padding: "md",
      children: React.createElement("span", null, "Test"),
    });
    const className = element.props.className as string;
    expect(className).not.toMatch(/gap-xs|gap-sm|gap-md|px-sm|py-sm/);
  });

  it("combines variant and padding correctly", () => {
    const element = Card({
      variant: "elevated",
      padding: "lg",
      children: React.createElement("span", null, "Test"),
    });
    const className = element.props.className as string;
    expect(className).toContain("rounded-none");
    expect(className).toContain("bg-card");
    expect(className).toContain("shadow-sm");
    expect(className).toContain("p-6");
    expect(className).toContain("border-border");
  });
});
