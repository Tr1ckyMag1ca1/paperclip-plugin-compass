#!/usr/bin/env node
/**
 * UIV-01: Extended Broken Pattern Verifier
 *
 * Scans all *.tsx files in src/ui/ directory for 28 documented broken Tailwind patterns.
 * Extends Phase 7 verifier to cover all 55+ components across Phase 7-10.
 *
 * Patterns checked (from UI_REDO_HANDOFF.md):
 * - Spacing: gap-xs, gap-sm, gap-md, px-xs, px-sm, px-md, py-xs, py-sm, py-md, mt-xs, mt-sm, pb-sm
 * - Typography: text-heading, text-body, text-label
 * - Colors (light-only): bg-green-50, bg-red-50, bg-slate-50, text-green-700, text-red-700, text-slate-600, text-slate-700, border-green-200, border-red-200, border-slate-200, border-slate-300
 * - Corners: rounded-lg, rounded-xl, rounded-2xl
 *
 * Usage:
 *   npx ts-node scripts/verify-broken-patterns.ts [scanPath]
 *   Default scanPath: src/ui/
 *
 * Exit code: 0 if passed, 1 if failed
 */

import { execSync } from "child_process";
import path from "path";
import process from "process";

interface PatternResult {
  pattern: string;
  count: number;
  files: string[];
}

interface VerifyResult {
  passed: boolean;
  totalHits: number;
  details: PatternResult[];
}

// Authoritative broken patterns list (from UI_REDO_HANDOFF.md)
const BROKEN_PATTERNS = [
  // Spacing tokens
  "gap-xs",
  "gap-sm",
  "gap-md",
  "px-xs",
  "px-sm",
  "px-md",
  "py-xs",
  "py-sm",
  "py-md",
  "mt-xs",
  "mt-sm",
  "pb-sm",
  // Typography tokens
  "text-heading",
  "text-body",
  "text-label",
  // Light-only colors
  "bg-green-50",
  "bg-red-50",
  "bg-slate-50",
  "text-green-700",
  "text-red-700",
  "text-slate-600",
  "text-slate-700",
  "border-green-200",
  "border-red-200",
  "border-slate-200",
  "border-slate-300",
  // Rounded corners
  "rounded-lg",
  "rounded-xl",
  "rounded-2xl",
];

async function verifyBrokenPatterns(scanPath: string): Promise<VerifyResult> {
  const results: PatternResult[] = [];
  let totalHits = 0;

  for (const pattern of BROKEN_PATTERNS) {
    // Escape regex special chars in pattern
    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Grep command: search src/ui/, exclude test files and DualRenderProbe
    // We search for word boundaries to avoid partial matches (e.g., "gap-x" matching "gap-x-2")
    // Use -E for extended regex to support word boundaries
    const grepCmd = `grep -rE "\\b${escapedPattern}\\b" "${scanPath}" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v ".test.tsx" | grep -v "DualRenderProbe.tsx" || true`;

    try {
      const output = execSync(grepCmd, { encoding: "utf-8" }).trim();

      if (output) {
        const lines = output.split("\n").filter((l) => l.trim());
        const files = [...new Set(lines.map((l) => l.split(":")[0]))].sort();

        results.push({
          pattern,
          count: lines.length,
          files,
        });

        totalHits += lines.length;
      }
    } catch (e) {
      // grep returns non-zero when no matches found; ignore
    }
  }

  return {
    passed: totalHits === 0,
    totalHits,
    details: results,
  };
}

// Main execution
async function main() {
  const scanPath = process.argv[2] || "src/ui/";

  console.log(`UIV-01 Broken Pattern Verification`);
  console.log(`==================================\n`);
  console.log(`Scan: ${scanPath} (all *.tsx, exclude *.test.tsx, exclude DualRenderProbe.tsx)`);
  console.log(`Patterns checked: ${BROKEN_PATTERNS.length}`);

  const result = await verifyBrokenPatterns(scanPath);

  console.log(`Total hits: ${result.totalHits}\n`);

  if (!result.passed) {
    console.log("Issues found:\n");
    for (const detail of result.details) {
      console.log(`  ${detail.pattern}: ${detail.count} occurrence(s)`);
      for (const file of detail.files) {
        console.log(`    - ${file}`);
      }
    }
    console.log(`\nStatus: FAILED ✗\n`);
    process.exit(1);
  } else {
    console.log(`Status: PASSED ✓\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Error running verifier:", err.message);
  process.exit(1);
});
