/**
 * SectionHeader Primitive Unit Tests
 *
 * Tests for SectionHeader component: title (required), subtitle (optional),
 * icon (optional lucide component), actions (optional), correct layout
 * (icon left, title+subtitle stacked, actions right), and correct host
 * token usage (text-base font-semibold, text-sm, text-muted-foreground).
 *
 * Note: These are property/structure tests verifying the API contract.
 * Full rendering tests with jsdom deferred to future phases.
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { Settings, AlertCircle } from "lucide-react";
import { SectionHeader } from "../../src/ui/primitives/SectionHeader.js";

describe("SectionHeader primitive", () => {
  it("exports SectionHeader as a named export", () => {
    expect(typeof SectionHeader).toBe("function");
  });

  it("renders title only (required prop)", () => {
    const element = SectionHeader({ title: "Test Title" });
    expect(element).toBeTruthy();
    expect(element.type).toBe("div");
  });

  it("renders title with correct typography (text-base font-semibold text-foreground)", () => {
    const element = SectionHeader({
      title: "Test Title",
    });

    // Navigate to the h3 element (it's in the contentDiv)
    const containerDiv = element as React.ReactElement;
    const innerDiv = containerDiv.props.children[0] as React.ReactElement;
    const contentDiv = innerDiv.props.children[1] as React.ReactElement;

    // contentDiv should be a div wrapping h3 and optional p
    expect(contentDiv.type).toBe("div");
    const h3Element = contentDiv.props.children[0] as React.ReactElement;

    expect(h3Element.type).toBe("h3");
    const className = h3Element.props.className as string;
    expect(className).toContain("text-base");
    expect(className).toContain("font-semibold");
    expect(className).toContain("text-foreground");
  });

  it("renders subtitle when provided with correct typography (text-sm text-muted-foreground)", () => {
    const element = SectionHeader({
      title: "Test Title",
      subtitle: "Test Subtitle",
    });

    // Navigate to the p element for subtitle
    const containerDiv = element as React.ReactElement;
    const innerDiv = containerDiv.props.children[0] as React.ReactElement;
    const contentDiv = innerDiv.props.children[1] as React.ReactElement;
    const subtitleElement = contentDiv.props.children[1] as React.ReactElement;

    expect(subtitleElement.type).toBe("p");
    const className = subtitleElement.props.className as string;
    expect(className).toContain("text-sm");
    expect(className).toContain("text-muted-foreground");
  });

  it("does not render subtitle when not provided", () => {
    const element = SectionHeader({ title: "Test Title" });

    // Check that subtitle is not in the rendered output
    const containerDiv = element as React.ReactElement;
    const innerDiv = containerDiv.props.children[0] as React.ReactElement;
    const contentDiv = innerDiv.props.children[1] as React.ReactElement;

    // contentDiv.props.children should be [h3, undefined] or just h3
    const children = contentDiv.props.children as any;
    if (Array.isArray(children)) {
      // If array, second element should be null/undefined (no subtitle rendered)
      expect(children[1]).toBeUndefined();
    } else {
      // If not array, should be just the h3 element
      expect(children.type).toBe("h3");
    }
  });

  it("renders icon with correct size and color (h-4 w-4 text-muted-foreground) when provided", () => {
    const element = SectionHeader({
      title: "Test Title",
      icon: Settings,
    });

    // Navigate to icon element
    const containerDiv = element as React.ReactElement;
    const innerDiv = containerDiv.props.children[0] as React.ReactElement;
    const iconElement = innerDiv.props.children[0] as React.ReactElement;

    expect(iconElement.type).toBe(Settings);
    const className = iconElement.props.className as string;
    expect(className).toContain("h-4");
    expect(className).toContain("w-4");
    expect(className).toContain("text-muted-foreground");
    expect(className).toContain("flex-shrink-0");
  });

  it("does not render icon when not provided", () => {
    const element = SectionHeader({ title: "Test Title" });

    // Navigate to the inner div to check for icon
    const containerDiv = element as React.ReactElement;
    const innerDiv = containerDiv.props.children[0] as React.ReactElement;
    const firstChild = innerDiv.props.children[0] as React.ReactElement | null;

    // First child should be the content div (not the icon)
    expect(firstChild?.type).not.toBe("svg");
  });

  it("renders actions slot when provided", () => {
    const actionButton = React.createElement("button", null, "Action");
    const element = SectionHeader({
      title: "Test Title",
      actions: actionButton,
    });

    // Navigate to actions container (should be the second child of outer flex)
    const containerDiv = element as React.ReactElement;
    const actionsContainer = containerDiv.props.children[1] as React.ReactElement;

    expect(actionsContainer.type).toBe("div");
    const className = actionsContainer.props.className as string;
    expect(className).toContain("flex");
    expect(className).toContain("items-center");
    expect(className).toContain("gap-2");
    expect(actionsContainer.props.children).toBe(actionButton);
  });

  it("does not render actions container when actions not provided", () => {
    const element = SectionHeader({ title: "Test Title" });

    // Navigate to outer container
    const containerDiv = element as React.ReactElement;
    const secondChild = containerDiv.props.children[1];

    // Second child should be null/falsy when actions not provided
    expect(secondChild).toBeFalsy();
  });

  it("uses correct container layout (flex items-start justify-between gap-4)", () => {
    const element = SectionHeader({ title: "Test Title" });

    expect(element.type).toBe("div");
    const className = element.props.className as string;
    expect(className).toContain("flex");
    expect(className).toContain("items-start");
    expect(className).toContain("justify-between");
    expect(className).toContain("gap-4");
  });

  it("renders all props together (title, subtitle, icon, actions)", () => {
    const actionButton = React.createElement("button", null, "Edit");
    const element = SectionHeader({
      title: "Company Agents",
      subtitle: "4 active, 2 paused",
      icon: AlertCircle,
      actions: actionButton,
    });

    expect(element).toBeTruthy();
    expect(element.type).toBe("div");
    const containerClassName = element.props.className as string;

    expect(containerClassName).toContain("flex");
    expect(containerClassName).toContain("justify-between");
  });

  it("does not use broken typography tokens (text-heading, text-body, text-label)", () => {
    const element = SectionHeader({
      title: "Test Title",
      subtitle: "Test Subtitle",
    });

    // Recursively check all props for broken tokens
    const checkForBrokenTokens = (el: any): boolean => {
      if (el?.props?.className) {
        const className = el.props.className as string;
        if (
          className.includes("text-heading") ||
          className.includes("text-body") ||
          className.includes("text-label")
        ) {
          return true;
        }
      }
      return false;
    };

    const traverseElement = (el: any): boolean => {
      if (checkForBrokenTokens(el)) return true;

      const children = el?.props?.children;
      if (Array.isArray(children)) {
        return children.some((child) => traverseElement(child));
      } else if (children && typeof children === "object") {
        return traverseElement(children);
      }
      return false;
    };

    expect(traverseElement(element)).toBe(false);
  });

  it("accepts any lucide icon component", () => {
    const icons = [Settings, AlertCircle];
    icons.forEach((Icon) => {
      const element = SectionHeader({
        title: "Test",
        icon: Icon,
      });
      expect(element).toBeTruthy();
    });
  });

  it("accepts ReactNode for actions (button, dropdown, text, etc.)", () => {
    const complexActions = React.createElement(
      "div",
      { className: "flex gap-2" },
      React.createElement("button", null, "Edit"),
      React.createElement("button", null, "Delete")
    );

    const element = SectionHeader({
      title: "Test Title",
      actions: complexActions,
    });

    expect(element).toBeTruthy();
  });

  it("renders title text correctly", () => {
    const titleText = "My Section Header";
    const element = SectionHeader({ title: titleText });

    // Navigate to h3 and check children
    const containerDiv = element as React.ReactElement;
    const innerDiv = containerDiv.props.children[0] as React.ReactElement;
    const contentDiv = innerDiv.props.children[1] as React.ReactElement;
    const h3Element = contentDiv.props.children[0] as React.ReactElement;

    expect(h3Element.props.children).toBe(titleText);
  });

  it("renders subtitle text correctly", () => {
    const subtitleText = "This is a subtitle";
    const element = SectionHeader({
      title: "Test",
      subtitle: subtitleText,
    });

    // Navigate to p and check children
    const containerDiv = element as React.ReactElement;
    const innerDiv = containerDiv.props.children[0] as React.ReactElement;
    const contentDiv = innerDiv.props.children[1] as React.ReactElement;
    const pElement = contentDiv.props.children[1] as React.ReactElement;

    expect(pElement.props.children).toBe(subtitleText);
  });
});
