#!/usr/bin/env node
// Guard: Paperclip host React shim (getShimBlobUrl("react")) re-exports a curated
// subset of React APIs. Importing anything outside the allowlist crashes the entire
// UI module at instantiation (SyntaxError "does not provide an export named ...").
// See .claude memory: compass_v033_root_cause.md
//
// Fails CI if any src/**/*.{ts,tsx} imports a forbidden React API from "react".

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const FORBIDDEN = new Set([
  "useId",
  "useReducer",
  "useLayoutEffect",
  "useImperativeHandle",
  "useDebugValue",
  "useDeferredValue",
  "useTransition",
  "useSyncExternalStore",
  "useInsertionEffect",
  "useActionState",
  "useOptimistic",
  "useFormStatus",
]);

const ROOT = new URL("../src/", import.meta.url).pathname;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

const violations = [];
const importRe = /import\s*(?:type\s+)?\{([^}]+)\}\s*from\s*["']react["']/g;

for (const file of walk(ROOT)) {
  const src = readFileSync(file, "utf8");
  let m;
  while ((m = importRe.exec(src)) !== null) {
    const names = m[1].split(",").map((s) => s.trim().replace(/\s+as\s+\w+$/, ""));
    for (const n of names) {
      if (FORBIDDEN.has(n)) {
        const line = src.slice(0, m.index).split("\n").length;
        violations.push({ file: relative(process.cwd(), file), line, name: n });
      }
    }
  }
}

if (violations.length) {
  console.error("react-shim guard: forbidden imports from \"react\":");
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  imports '${v.name}' — host shim does not export this`);
  }
  console.error(
    "\nWhy: Paperclip host's React bare-specifier shim re-exports a curated subset.\n" +
      "Forbidden imports throw SyntaxError at module load and prevent UI registration.\n" +
      "Workaround: replace with primitives from the allowlist (useState, useRef, useEffect, etc.)\n" +
      "or implement equivalent behavior locally (see HelpTip module-counter pattern).",
  );
  process.exit(1);
}

console.log("react-shim guard: OK (0 forbidden imports)");
