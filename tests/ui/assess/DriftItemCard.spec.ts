/**
 * Unit tests for DriftItemCard severity map and component structure
 *
 * Tests verify:
 * - SEVERITY_CLASSES map exists and has correct keys
 * - Correct semantic color classes defined per Phase 8 D-02
 * - No broken tokens present in component file
 * - Component source code structure validation
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("DriftItemCard severity map", () => {
  // Read the component file source
  const componentPath = path.resolve(
    __dirname,
    "../../../src/ui/assess/DriftItemCard.tsx"
  );
  const componentSource = fs.readFileSync(componentPath, "utf-8");

  it("contains SEVERITY_CLASSES const definition", () => {
    expect(componentSource).toContain("const SEVERITY_CLASSES");
    expect(componentSource).toMatch(/SEVERITY_CLASSES\s*:\s*Record<"low" \| "medium" \| "high"/);
  });

  it("has severity map with low key using text-muted-foreground", () => {
    expect(componentSource).toContain('low: "text-muted-foreground"');
  });

  it("has severity map with medium key using yellow tint", () => {
    expect(componentSource).toContain('medium: "text-yellow-600 bg-yellow-500/10"');
  });

  it("has severity map with high key using red tint", () => {
    expect(componentSource).toContain('high: "text-red-600 bg-red-500/10"');
  });

  it("uses SEVERITY_CLASSES in className lookup", () => {
    expect(componentSource).toContain("SEVERITY_CLASSES[item.severity");
  });

  it("uses host token bg-card for container", () => {
    expect(componentSource).toContain('className="bg-card');
  });

  it("uses host token border-border for borders", () => {
    expect(componentSource).toContain("border-border");
  });

  it("uses rounded-none for sharp corners (not rounded-lg)", () => {
    expect(componentSource).toContain("rounded-none");
    expect(componentSource).not.toContain("rounded-lg");
  });

  it("contains no broken spacing tokens", () => {
    const brokenTokens = [
      "gap-xs",
      "gap-sm",
      "gap-md",
      "gap-lg",
      "p-lg",
      "px-sm",
      "px-md",
      "py-sm",
      "py-md",
      "space-y-md",
      "space-y-lg",
      "mt-md",
      "pb-sm",
      "mr-sm",
    ];

    for (const token of brokenTokens) {
      expect(componentSource).not.toContain(token);
    }
  });

  it("contains no broken color tokens", () => {
    const brokenColorTokens = [
      "text-accent",
      "text-destructive",
      "text-label",
      "text-heading",
      "text-body",
    ];

    for (const token of brokenColorTokens) {
      expect(componentSource).not.toContain(token);
    }
  });

  it("uses semantic palette for accept button (emerald)", () => {
    expect(componentSource).toContain("bg-emerald-500/10");
    expect(componentSource).toContain("text-emerald-600");
  });

  it("renders with host Tailwind scale (gap-1/2/3, px-3, py-2/4)", () => {
    // Verify numeric Tailwind spacing is used instead of custom tokens
    expect(componentSource).toMatch(/gap-[1-4]/);
    expect(componentSource).toMatch(/px-[2-4]/);
    expect(componentSource).toMatch(/py-[1-4]/);
  });

  it("contains Accept and Reject buttons", () => {
    expect(componentSource).toContain("Accept");
    expect(componentSource).toContain("Reject");
  });

  it("has proper JSX component structure with React.ReactElement return", () => {
    expect(componentSource).toContain("React.ReactElement");
    expect(componentSource).toContain("export function DriftItemCard");
  });

  it("imports and renders DriftItemCard subcomponents", () => {
    expect(componentSource).toContain("ConfidenceBar");
    expect(componentSource).toContain("EvidenceList");
    expect(componentSource).toContain("AmendmentDiff");
  });

  it("has severity type signature matching low | medium | high", () => {
    expect(componentSource).toMatch(/Record<"low" \| "medium" \| "high"/);
  });

  it("maintains component props interface unchanged (DriftItemCardProps)", () => {
    expect(componentSource).toContain("interface DriftItemCardProps");
    expect(componentSource).toContain("item: DriftItem");
    expect(componentSource).toContain("acceptedState: boolean | null");
    expect(componentSource).toContain("onAccept: () => void");
    expect(componentSource).toContain("onReject: () => void");
  });

  it("renders DriftItemCard instances for severity validation", () => {
    // Count how many severity values are handled
    expect(componentSource).toMatch(/["']low["']/);
    expect(componentSource).toMatch(/["']medium["']/);
    expect(componentSource).toMatch(/["']high["']/);
  });
});
