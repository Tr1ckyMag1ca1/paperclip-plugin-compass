---
phase: 01-skeleton-inventory-mode-detection
plan: 01
subsystem: Plugin Skeleton + SDK Adapter + Governance
tags:
  - infrastructure
  - typescript
  - paperclip-plugin
dependency_graph:
  requires:
    - Project initialization (PROMPT.md, research completed)
  provides:
    - Plugin manifest and worker entry points
    - SDK adapter chokepoint (XC-01)
    - Schema validation infrastructure
    - Governance docs and contributor guidelines
  affects:
    - All downstream plans (Plans 2–3 depend on this skeleton)
tech_stack:
  added:
    - TypeScript 5.7.3 (strict mode)
    - esbuild 0.27.3 (bundling)
    - @paperclipai/plugin-sdk 1.0.0
    - Vitest 3.0.5 (testing foundation)
  patterns:
    - Three-layer plugin: manifest → worker → UI
    - SDK adapter chokepoint for all Paperclip calls
    - Schema validation on startup
    - Plugin SDK worker-state for mode override persistence
key_files:
  created:
    - package.json
    - tsconfig.json
    - esbuild.config.mjs
    - src/manifest.ts
    - src/worker.ts
    - src/types.ts
    - src/sdk/adapter.ts
    - src/primitives/schema-validator.ts
    - README.md
    - LICENSE
    - CODEOWNERS
    - DECISIONS.md
    - CONTRIBUTING.md
    - SCHEMA.md
    - .github/ISSUE_TEMPLATE/bug.md
    - .github/ISSUE_TEMPLATE/feature.md
    - .github/PULL_REQUEST_TEMPLATE.md
  modified: []
decisions:
  - D-01: Bootstrap with create-paperclip-plugin scaffolder
  - D-02: Credit yesterday-ai with upstream issue
  - D-05: Local plugin manager install as primary dev workflow
  - D-08: Schema validation smoke query on startup
  - D-09: Mode override persistence in worker-state (migrate to engagement memory in M6)
  - D-10 through D-16: Governance docs (README, LICENSE, CODEOWNERS, DECISIONS, CONTRIBUTING, SCHEMA, GitHub templates)
  - D-17: Sidebar icon is Lucide compass
  - D-19: SDK adapter chokepoint (XC-01)
  - D-20: Mode detection as pure functions
  - D-21: Inventory snapshot as typed payload
metrics:
  tasks_completed: 4
  files_created: 17
  commits: 4
  duration_minutes: 38
  duration: 2026-05-03T05:37:28Z to 2026-05-03T06:15:00Z
---

# Phase 01 Plan 01: Plugin Skeleton + SDK Adapter + Governance Summary

## Objective

Bootstrap Compass as a production-ready Paperclip plugin with a clean architectural foundation. Deliver the plugin skeleton (manifest + worker + SDK adapter chokepoint), project configuration (TypeScript strict, esbuild bundler, pnpm), and governance infrastructure (README credits, CODEOWNERS, DECISIONS.md).

## What Was Built

### 1. Plugin Project Infrastructure (Task 1)

**Files:**
- `package.json` — declares @paperclipai/plugin-sdk v1.0.0 as dependency, React 19+ as peer, dev tools (TypeScript 5.7.3, esbuild 0.27.3, Vitest 3.0.5)
- `tsconfig.json` — strict mode enabled, ES2022 target, supports JSX/React
- `esbuild.config.mjs` — uses SDK bundler presets to auto-generate worker/manifest/UI bundler contexts, watch mode support

**Why it matters:** Establishes the modern, SDK-aligned build pipeline. React is peer dependency (not bundled), preventing conflicts with host's React 19. Strict TypeScript enforces type safety.

**Verification:**
```bash
pnpm install && pnpm build
# Outputs: dist/worker.js, dist/manifest.js, dist/ui/
```

### 2. Plugin Manifest and Worker with Schema Validation (Task 2)

**Files:**
- `src/manifest.ts` — exports PaperclipPluginManifestV1 with sidebar slot for MainPanel; declares read-only capabilities (agents/issues/documents read, state write for override)
- `src/worker.ts` — plugin setup with schema validation smoke query (tests agents.list(), issues.list(), documents.list() on startup); health check returning "ok"

**Why it matters:** Manifest registers "Compass" in Paperclip sidebar with compass icon (D-17). Worker validates schema on load — if validation fails, founder sees: "Compass requires Paperclip SDK v1.0.0+. Validation failed: {error}. See SCHEMA.md." This prevents cryptic runtime errors later.

**Verification:** Plugin loads cleanly in Paperclip dev instance; no manifest or worker errors in logs.

### 3. SDK Adapter Chokepoint and Type Foundation (Task 3)

**Files:**
- `src/sdk/adapter.ts` — PaperclipAdapter class enforces XC-01 architectural rule: all Paperclip SDK calls route through this single file. Implements:
  - `validateSchema()` — startup schema validation
  - `getInventorySnapshot()` — loads agents, issues, documents; calculates visionExists, latestHeartbeat, recentIssueCount, blockerCount
  - `getModeOverride()` / `setModeOverride()` — persists mode override in worker-state (per D-09, will migrate to engagement-memory doc in M6)
- `src/primitives/schema-validator.ts` — standalone validateSchema utility for test reusability
- `src/types.ts` — declares Mode ("Found" | "Assess" | "Revive" | "Reposition"), InventorySnapshot interface with all fields used throughout Phase 1

**Why it matters:** XC-01 chokepoint prevents direct Postgres access, enforces SDK-only usage, and establishes a single point for auth/logging. Plan 2+ writes (VISION edits, agent provisioning, issues) will all route through this file, ensuring architectural safety from day one. Types provide compile-time contract for all downstream code.

**Verification:**
```bash
pnpm typecheck  # No errors
grep -r "ctx\\.agents\\|ctx\\.issues\\|ctx\\.documents" src/ | grep -v adapter.ts  # Should return empty (all calls route through adapter)
```

### 4. Governance and Contributor Infrastructure (Task 4)

**Files:**
- `README.md` — Credits Aron Prins and vision-quest prominently; links to company-wizard; documents installation (npm + plugin manager local-path) and development (pnpm dev)
- `LICENSE` — MIT (per D-11)
- `CODEOWNERS` — routes all PRs to @nicholasrhodes @aronprins (two-maintainer model per D-12)
- `DECISIONS.md` — Decision log seeded with Phase 1 decisions D-01 through D-21, each with context and rationale (per D-13)
- `CONTRIBUTING.md` — Local dev setup (pnpm install, pnpm dev watch-mode), test commands (pnpm test), plugin manager local-path install workflow (D-05), PR conventions (Conventional Commits format per XC-10)
- `SCHEMA.md` — Documents Paperclip schema Compass depends on: agents table, issues, documents, approvals, agent_wakeup_requests, routines. Lists required fields and minimum SDK version (per D-15)
- `.github/ISSUE_TEMPLATE/bug.md` — Bug report template
- `.github/ISSUE_TEMPLATE/feature.md` — Feature request template
- `.github/PULL_REQUEST_TEMPLATE.md` — PR template referencing CONTRIBUTING.md

**Why it matters:** Establishes open-source governance from day one; two-maintainer model with Aron Prins (offer pending). Clear contributor onboarding (CONTRIBUTING.md) and architectural context (DECISIONS.md) accelerate future work. SCHEMA.md future-proofs against drift on new Paperclip versions.

**Verification:** All files present and human-readable; README credits visible on GitHub; CONTRIBUTING.md references the local-path workflow that Plan 2 testers will use.

---

## Deviations from Plan

None. Plan executed exactly as written.

---

## Architecture Decisions Locked In

1. **XC-01 Chokepoint (D-19):** All Paperclip SDK calls, including reads, route through `src/sdk/adapter.ts`. This prevents direct Postgres, enforces SDK-only usage, and establishes a single point for auth/logging/instrumentation.

2. **Schema Validation on Startup (D-08):** Plugin validates agents/issues/documents tables on load. Founder sees clear error if schema is incompatible. Prevents silent failures at runtime.

3. **Mode Override Persistence in Worker-State (D-09):** Founder's mode override is stored in Plugin SDK worker-state (host-persisted), not in Paperclip DB. This preserves Phase 1's read-only-against-Paperclip rule. Phase 6 will migrate to engagement-memory document when memory infra ships.

4. **Typed Inventory Snapshot (D-21):** All mode-detection logic receives a single `InventorySnapshot` typed object, not re-queried per mode. Reduces SDK call cost and ensures consistency.

5. **Pure Function Mode Detection (D-20):** Mode detection (planned for Plan 3) lives in `src/primitives/mode-detect.ts` as pure functions taking InventorySnapshot and returning Mode. No I/O, highly testable.

---

## Known Limitations

### Phase 1 Scope (Read-Only)

- No VISION.md writes (locked until Found mode in Phase 2)
- No agent provisioning (locked until Phase 2)
- No approval routing (locked until Phase 2+)
- No chat responses (D-07: chat routing shell only; responses in M2-M5)
- No UI implementation (Plan 2 adds MainPanel component structure; Plan 3 adds UI logic)

These are intentional scope boundaries, not bugs. Each is explicitly planned for a downstream phase.

---

## Test Commands

### Type Check
```bash
pnpm typecheck
```

### Build
```bash
pnpm build
```

### Test (interactive)
```bash
pnpm test
```

### Test (CI mode)
```bash
pnpm test:run
```

---

## Next Steps

**Plan 2 (Mode Detection + Inventory Loading):**
- Implement mode-detection logic in `src/primitives/mode-detect.ts` (pure functions)
- Implement inventory loading UI shell (no data binding yet)
- Add basic mode override dropdown in UI
- Write tests for mode detection with fixture companies

**Plan 3 (Main UI Panel + Chat Shell):**
- Implement MainPanel React component (sidebarPanel slot)
- Add inventory display sections (Agents, Documents, Activity, VISION status)
- Add chat input panel with lightweight keyword classifier (MODE-04 routing)
- Wire MainPanel to adapter.getInventorySnapshot() and mode detection
- Add error boundary and loading states

---

## Commits

| Commit | Message |
|--------|---------|
| 5b42d5f | feat(01-01): set up plugin project structure and TypeScript configuration |
| 2197881 | feat(01-01): create plugin manifest and worker with schema validation |
| 2767a0c | feat(01-01): establish SDK adapter chokepoint and schema validator utilities |
| 7d6d573 | docs(01-01): add governance and contributor documentation |

---

## Requirements Coverage

**SKEL (Skeleton — 12 total):**
- ✓ SKEL-01: Plugin loads cleanly without manifest or runtime errors
- ✓ SKEL-02: Sidebar entry "Compass" registered (manifest declares sidebarPanel slot)
- ✓ SKEL-04: Manifest + worker establish foundation for Plan 2
- ✓ SKEL-05: React 19 peer dependency, never bundled (package.json)
- ✓ SKEL-06: Installable via npm (@paperclipai/paperclip-plugin-compass) and local plugin manager (CONTRIBUTING.md)
- ✓ SKEL-07: TypeScript strict mode enabled (tsconfig.json)
- ✓ SKEL-09: README credits Aron Prins and vision-quest
- ✓ SKEL-10: CODEOWNERS establishes two-maintainer governance
- ✓ SKEL-11: MIT license in place
- ✓ SKEL-12: SCHEMA.md documents Paperclip assumptions

**INV (Inventory — 7 total):**
- ✓ INV-06: Schema validation utilities (src/primitives/schema-validator.ts)
- ✓ INV-07: InventorySnapshot as typed payload (src/types.ts)

**XC (Cross-Cutting — 10 total):**
- ✓ XC-01: SDK adapter chokepoint (src/sdk/adapter.ts)

**Deferred to Plan 2+:**
- INV-01 through INV-05, MODE-01 through MODE-04, and remaining XC requirements

---

## Self-Check

- ✓ All created files exist (verified with `test -f`)
- ✓ All commits exist in git log
- ✓ package.json correctly declares @paperclipai/plugin-sdk v1.0.0
- ✓ tsconfig.json has strict: true
- ✓ esbuild.config.mjs uses createPluginBundlerPresets
- ✓ src/manifest.ts exports PaperclipPluginManifestV1
- ✓ src/worker.ts implements definePlugin with setup hook and schema validation
- ✓ src/sdk/adapter.ts defines PaperclipAdapter class with XC-01 methods
- ✓ src/types.ts defines Mode type and InventorySnapshot interface
- ✓ README.md credits Aron Prins and vision-quest
- ✓ LICENSE is MIT
- ✓ CODEOWNERS routes to two maintainers
- ✓ DECISIONS.md documents D-01 through D-21
- ✓ CONTRIBUTING.md documents pnpm dev workflow
- ✓ SCHEMA.md documents Paperclip tables and fields
- ✓ GitHub issue and PR templates created

---

**Plan Status:** COMPLETE  
**Created:** 2026-05-03 06:15:00 UTC  
**Duration:** 38 minutes
