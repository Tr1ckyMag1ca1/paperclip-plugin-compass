#!/usr/bin/env node
// Guard: Paperclip host provides React, react-dom, react/jsx-runtime, and zod via
// bare-specifier shims. Bundling these into dist/ui/index.js creates duplicate instances
// and breaks hook sharing, useState identity checks, and error boundaries.
// This script audits the built UI bundle to ensure these dependencies are NOT bundled.
//
// Fails CI if any forbidden imports appear in the final build output.

import { readFileSync } from "node:fs";

const FORBIDDEN = ["react", "react-dom", "react/jsx-runtime", "zod"];
const BUNDLE_PATH = "dist/ui/index.js";

let violations = [];

// Check if bundle exists
let bundleContent;
try {
  bundleContent = readFileSync(BUNDLE_PATH, "utf8");
} catch (err) {
  console.error(`externals guard: bundle not found at ${BUNDLE_PATH}`);
  console.error("Build dist/ui/index.js first: npm run build");
  process.exit(1);
}

// Regex to match import statements
// Pattern: from 'package' or from "package" or from `package`
// Avoid false positives in comments and string literals by looking for actual import syntax
const importPattern = /from\s+['"`]([^'"`]+)['"`]/g;

let match;
const foundImports = new Map();

while ((match = importPattern.exec(bundleContent)) !== null) {
  const importedModule = match[1];
  if (FORBIDDEN.includes(importedModule)) {
    if (!foundImports.has(importedModule)) {
      foundImports.set(importedModule, 0);
    }
    foundImports.set(importedModule, foundImports.get(importedModule) + 1);
    violations.push(importedModule);
  }
}

if (violations.length > 0) {
  console.error("externals guard: FAILED — forbidden imports detected in bundle:");
  for (const [module, count] of foundImports.entries()) {
    console.error(`  '${module}' found ${count} time(s)`);
  }
  console.error(
    "\nWhy: Host provides these APIs via bare-specifier shims.\n" +
      "Bundling creates duplicate instances and breaks hook identity, useState, and error boundaries.\n" +
      "Fix: esbuild.config.mjs must have 'external' rules for: react, react-dom, zod",
  );
  process.exit(1);
}

console.log("externals guard: OK (0 violations)");
