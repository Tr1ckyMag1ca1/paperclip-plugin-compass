---
phase: 11-distribution-open-source-launch
plan: 02
subsystem: distribution
status: complete
duration: "~25 minutes"
completed: 2026-05-11
tags: [bundle-size, externals-audit, npm-verify]
requirements: [DIST-04]
---

# Phase 11 Plan 02: Bundle Size Enforcement Summary

**One-liner:** Created size-limit config (80KB gzipped UI limit) and externals audit script to catch accidentally bundled React/zod while validating the npm verify pipeline.

## Execution Overview

All 3 tasks completed. Fixed 1 critical integration issue (React being transitively bundled via lucide-react).

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Create .size-limit.json | dcce879 | ✓ Complete |
| 2 | Create check-externals.mjs | 2e1b1ed | ✓ Complete |
| 3 | Wire size+externals into verify | 57466ce | ✓ Complete |
| — | Add size-limit dependency | 181f829 | ✓ Dependency |
| — | Add @size-limit/preset-app | edd10e1 | ✓ Dependency |
| — | Fix React bundling + refine script | c1775ef | ✓ Rule 1 Fix |

**Final commits:** 6 commits total (3 task + 3 deviations)

## Deliverables

### .size-limit.json
- Targets `dist/ui/index.js` with 80KB gzipped limit
- Provides ~30-40KB headroom from current ~8.5KB baseline
- Configured to use @size-limit/preset-app for accurate browser bundle measurement

### scripts/check-externals.mjs
- Audits built UI bundle for accidentally bundled React/zod code
- Detects bundled code via internal implementation markers (React fiber, Zod types)
- Detects bundled node_modules references in esbuild comments
- Distinguishes external imports (OK) from bundled code (violations)

### package.json extensions
- Added `npm run size` script for standalone size-limit invocation
- Extended `npm run verify` pipeline to 6 sequential stages:
  1. `npm run typecheck` — TypeScript type checking
  2. `npm run lint:shim` — React shim API guard
  3. `npm run test:run` — Vitest suite (918 tests)
  4. `npm run size` — Bundle size gate (80KB limit)
  5. `node ./scripts/check-externals.mjs` — Externals audit
  6. `npm pack --dry-run` — Tarball validation

### esbuild.config.mjs
- Added lucide-react to external rules in UI preset
- Prevents transitive bundling of React via lucide-react dependency
- Host must provide both React and lucide-react via shims

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] React transitively bundled via lucide-react**
- **Found during:** Task 3 verification (check-externals failed)
- **Issue:** esbuild marked react/react-dom as external, but lucide-react (bundled) depends on react. This caused react to be bundled transitively.
- **Root cause:** esbuild's `external` option only prevents direct bundling; dependencies of bundled modules are still included.
- **Fix:** Added lucide-react to external array in esbuild UI config. Updated check-externals.mjs to detect bundled code (not just import statements) to distinguish between external imports (OK) and bundled implementations (violations).
- **Files modified:** esbuild.config.mjs, scripts/check-externals.mjs
- **Commits:** c1775ef (fix), plus c1775ef also includes the refined check-externals logic

**2. [Rule 2 - Missing Critical Functionality] size-limit not installed**
- **Found during:** Task 3 (npm run verify stage 4)
- **Issue:** size-limit package missing from devDependencies, causing verify pipeline to fail
- **Fix:** Installed size-limit@^12.1.0 and @size-limit/preset-app@^12.1.0 as devDependencies
- **Files modified:** package.json, pnpm-lock.yaml
- **Commits:** 181f829, edd10e1

## Verification Results

**Full npm run verify pipeline:**

```
✓ npm run typecheck
  → TypeScript strict mode passes

✓ npm run lint:shim  
  → react-shim guard: OK (0 forbidden imports)

✓ npm run test:run
  → Test Files 42 passed (42)
  → Tests 918 passed (918)
  → Duration 2.90s

✓ npm run size
  → Size limit: 80 kB
  → Size: 8.58 kB gzipped ✓ (well under limit)
  → Loading time: 168 ms on slow 3G
  → Running time: 17 ms on Snapdragon 410

✓ node ./scripts/check-externals.mjs
  → externals guard: OK (0 violations)

✓ npm pack --dry-run
  → Tarball generated: 241.2 kB compressed
  → Unpacked: 1.3 MB
  → 9 files validated
```

**Bundle composition:**
- dist/ui/index.js: 8.58 kB gzipped (external: react, react-dom, react/jsx-runtime, lucide-react)
- dist/worker.js: 443 KB (Node.js entrypoint, not size-gated)
- dist/manifest.js: 2.5 kB

## Key Links

| From | To | Via | Pattern |
|------|-----|-----|---------|
| esbuild.config.mjs | .size-limit.json | external rules match targets | react/react-dom/lucide-react in both |
| package.json#scripts.verify | scripts/check-externals.mjs | npm verify invokes check-externals | "check-externals" in verify string |
| package.json#scripts.verify | size-limit | npm verify invokes size runner | "npm run size" in verify string |

## Threat Surface

No new threats introduced. Mitigations for existing threats confirmed:

| Threat | Component | Mitigation | Status |
|--------|-----------|-----------|--------|
| T-11-04: React bundling | check-externals.mjs | Post-build audit fails if react code found | ✓ Verified |
| T-11-05: Bundle growth undetected | .size-limit.json + CI | 80KB gzipped limit enforced pre-publish | ✓ Verified |
| T-11-06: npm pack tampering | npm pack --dry-run | Dry-run validates structure pre-publish | ✓ Verified |

## Metrics

- **Duration:** ~25 minutes (including dependency install, debugging, re-builds)
- **Files created:** 1 (.size-limit.json, scripts/check-externals.mjs)
- **Files modified:** 3 (package.json, esbuild.config.mjs, scripts/check-externals.mjs)
- **Tests passing:** 918/918 (no regressions)
- **Bundle size:** 8.58 kB gzipped (11% of 80 KB limit)
- **Commits:** 6 total

## Self-Check

- ✓ .size-limit.json created with dist/ui/index.js target and 80KB limit
- ✓ scripts/check-externals.mjs created with bundled-code detection
- ✓ package.json#scripts.verify extended to 6 stages
- ✓ package.json#scripts.size script added
- ✓ npm run verify passes end-to-end (all 6 stages + 918 tests)
- ✓ size-limit and @size-limit/preset-app installed
- ✓ esbuild.config.mjs marks lucide-react external
- ✓ check-externals.mjs detects bundled code (not false-positives on imports)
- ✓ All commits present and verified

**Status:** PASSED - Plan execution complete, all success criteria met.
