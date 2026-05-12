#!/usr/bin/env node
// Guard: Paperclip host provides React, react-dom, react/jsx-runtime, and zod via
// bare-specifier shims. Bundling these into dist/ui/index.js creates duplicate instances
// and breaks hook sharing, useState identity checks, and error boundaries.
// This script audits the built UI bundle to ensure the CODE from these dependencies
// is NOT bundled. External import statements are OK; bundled implementations are not.
//
// Fails CI if forbidden code (not just imports) appears in the final build output.

import { readFileSync } from "node:fs";

const BUNDLE_PATH = "dist/ui/index.js";

let bundleContent;
try {
  bundleContent = readFileSync(BUNDLE_PATH, "utf8");
} catch (err) {
  console.error(`externals guard: bundle not found at ${BUNDLE_PATH}`);
  console.error("Build dist/ui/index.js first: npm run build");
  process.exit(1);
}

// React-specific implementation markers that should NOT appear in the bundle
// if react is properly external. These are internal React symbols that indicate
// the react runtime itself has been bundled.
const REACT_MARKERS = [
  // React hook fiber implementation
  /\$\$ReactDispatcher/,
  /executeDispatcherFn/,
  /resetHooksAfterThrow/,
  // React component class implementation
  /ClassComponent\s*:/,
  /forwardRef_SUSPENSE/,
  // Zod implementation markers
  /ZodError\s*\{/,
  /ZodType\s*{/,
];

const violations = [];

for (const marker of REACT_MARKERS) {
  if (marker.test(bundleContent)) {
    violations.push(`  Found react/zod implementation marker: ${marker}`);
  }
}

// Also check for esbuild comments that indicate bundled node_modules.
// Match react@ as a path component (preceded by / or @, to avoid matching
// lucide-react@ or other "*-react" packages which are allowed to bundle).
const bundledReactPattern = /\/\/ node_modules\/[^\n]*[/@]react@/;
if (bundledReactPattern.test(bundleContent)) {
  violations.push(`  Found bundled react in node_modules reference comments`);
}

if (violations.length > 0) {
  console.error("externals guard: FAILED — forbidden code bundled in output:");
  for (const v of violations) {
    console.error(v);
  }
  console.error(
    "\nWhy: Host provides these APIs via bare-specifier shims.\n" +
      "Bundling creates duplicate instances and breaks hook identity, useState, and error boundaries.\n" +
      "Fix: esbuild.config.mjs must have 'external' rules for: react, react-dom, react/jsx-runtime, zod",
  );
  process.exit(1);
}

console.log("externals guard: OK (0 violations)");
