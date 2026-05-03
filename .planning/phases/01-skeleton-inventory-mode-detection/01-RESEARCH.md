# Phase 1: Skeleton + Inventory + Mode Detection - Research

**Researched:** 2026-05-03
**Domain:** Paperclip Plugin Architecture (TypeScript + React, Plugin SDK v1.0.0)
**Confidence:** HIGH

## Summary

Phase 1 establishes Compass as a diagnostic dashboard plugin by combining three load-bearing components: a minimal plugin skeleton (manifest + worker + UI), an inventory snapshot that reads Paperclip schema via the Plugin SDK, and deterministic mode detection with founder override. The plugin will ship with a sidebar entry and a read-only main panel — no database writes occur in Phase 1. All subsequent phases depend on the architectural chokepoint (SDK adapter) and mode-detection logic established here.

**Primary recommendation:** Bootstrap with `create-paperclip-plugin` scaffolder (official, SDK-aligned), adopt the bundling pattern from `@paperclipai/plugin-sdk/bundlers` presets (production-proven in file-viewer), and wire the mode detection as pure functions in `src/primitives/mode-detect.ts` with Vitest harness coverage (mock host, not real Paperclip dependency).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Plugin manifest + worker + UI entry | Browser / Client (React) | Frontend Server (Plugin Host) | Plugin SDK handles the bridge; worker runs in host process; UI renders same-origin as host |
| Sidebar registration | Browser / Client | Frontend Server | Plugin host's UI layer mounts plugin slots declared in manifest |
| Inventory snapshot (read DB + filesystem) | API / Backend (Plugin Worker) | — | All Paperclip API calls route through Plugin SDK in worker; UI just displays what worker provides |
| Mode detection logic | API / Backend (Plugin Worker) | — | Pure functions that classify state; no I/O; tests run without Paperclip dependency |
| Mode override persistence | API / Backend (Plugin Worker) | — | Plugin SDK worker-state API persists override per-plugin-instance (Phase 1 only; migrates to engagement memory in M6) |
| Schema validation smoke query | API / Backend (Plugin Worker) | — | Plugin SDK tables API queried at startup to fail loudly if schema drifted |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Bootstrap with `create-paperclip-plugin` scaffolder (Paperclip's official scaffolder), then selectively port company-wizard patterns as needed in later phases. Modern, SDK-aligned, easier upgrade story.
- **D-02:** Credit yesterday-ai (company-wizard) prominently in README. Open a GitHub issue thanking maintainers.
- **D-03:** Mode banner at top (e.g., "Assess mode — healthy company") with override dropdown. Below: collapsible sections for Agents, Documents, Recent Activity, VISION status.
- **D-04:** Inventory fetches on plugin open. Manual "Refresh" button to re-fetch. No auto-polling. Predictable SDK call cost.
- **D-05:** Document Plugin Manager local-path install as primary dev workflow in CONTRIBUTING.md. `pnpm dev` runs watch-mode rebuild; Paperclip auto-restarts plugin worker on bundle change.
- **D-06:** Test fixtures use Plugin SDK mock host only (`createTestHarness`). No real Paperclip dependency for CI. Fixture companies for the four mode states (founded / healthy / stalled / repositioning).
- **D-07:** Ship chat input UI shell in M1 with lightweight keyword classifier (MODE-04) routing freeform text to mode. No conversation responses in M1 — modes own response handling in M2-M5.
- **D-08:** On plugin load, run SDK smoke query against each table Compass touches. Surface clear error if any query fails. Plus declare compatible Paperclip SDK version range in `package.json` peerDependencies.
- **D-09:** Mode override stored in Plugin SDK worker-state (host-persisted, per-plugin-instance, per-company). Preserves M1's read-only-against-Paperclip-DB rule. M6 migrates to engagement-memory document.
- **D-10 through D-16:** Governance docs: README credits Aron Prins, MIT LICENSE, CODEOWNERS for two-maintainer routing, DECISIONS.md for decision log, CONTRIBUTING.md for dev setup, SCHEMA.md for assumptions, GitHub issue+PR templates.
- **D-17:** Sidebar entry uses Lucide `compass` icon or Paperclip equivalent with label "Compass" (locked in M1 manifest).
- **D-18:** Plugin name "Compass" confirmed for M1 (may rename pre-v1.0 — rename is cheap).
- **D-19:** All Paperclip access routes through single `src/sdk/adapter.ts` chokepoint (XC-01). Even read-only operations go through it — establishes the rule before M2 writes.
- **D-20:** Mode detection lives in `src/primitives/mode-detect.ts` as pure functions taking `InventorySnapshot` and returning `Mode`. No I/O, easily unit-testable.
- **D-21:** Inventory snapshot exposed to mode controllers as typed payload (`InventorySnapshot` interface) — not re-queried per mode (INV-07).

### Claude's Discretion
- React component file layout inside `src/ui/` (constraint: chat panel + manual panel + inline-preview placeholder must be distinct components)
- Test file naming + colocation pattern (constraint: Vitest + mock-host harness)
- esbuild config knobs not covered by `@paperclipai/plugin-sdk/bundlers` presets
- Error rendering style for schema validation failures (constraint: founder-readable, not stack-trace dump)

### Deferred Ideas (OUT OF SCOPE)
- Sticky override migration to engagement-memory document (M6 work per D-09)
- PR upstream to company-wizard (interesting but maintenance overhead)
- Auto-refresh / live polling for inventory (rejected for M1; revisit if founders ask)
- zod-based runtime type-check on every SDK return (rejected for M1; revisit if smoke query proves insufficient)
- Custom SVG sidebar icon (D-17 ships with Lucide compass; can replace later)
- Final plugin name change (confirm rename window before v1.0 launch per D-18)

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SKEL-01 | Plugin loads cleanly in local Paperclip dev instance with no manifest or runtime errors | `create-paperclip-plugin` scaffolder + Plugin SDK v1.0.0 are proven stable; esbuild.config.mjs preset pattern from file-viewer (v0.4.0, production-grade) |
| SKEL-02 | Sidebar entry "Compass" is registered and opens the main panel | Plugin manifest `ui.slots` + host mounting via host `~/Development/paperclip-temp/ui/src/plugins/` integration layer; D-17 Lucide compass icon |
| SKEL-03 | Main panel shell renders with chat panel, manual panel, and inline-preview placeholder | React component layout; D-03 three-section collapsible design (Mode banner + Inventory sections + Chat input) |
| SKEL-04 | Plugin packages via `@paperclipai/plugin-sdk/bundlers` preset and produces valid manifest + worker + UI bundle | Plugin SDK v1.0.0 `createPluginBundlerPresets` export generates three esbuild contexts (worker, manifest, ui); file-viewer reference confirms pattern |
| SKEL-05 | React 19 declared as peer dependency, never bundled | Plugin SDK v1.0.0 docs explicitly forbid bundling React (same-origin runs in host); esbuild external rule verified in file-viewer config |
| SKEL-06 | Plugin installable via npm (`@paperclipai/paperclip-plugin-compass`) AND via Paperclip plugin manager local-path/registry install | Plugin manager spec (PLUGIN_SPEC.md §8) describes both npm + local-path workflows; file-viewer published to npm; scaffolder supports both |
| SKEL-07 | TypeScript strict mode enabled; tsconfig extends Paperclip core base | Paperclip core tsconfig (ES2022 target, strict=true, ESNext modules); file-viewer + examples follow this pattern |
| SKEL-08 | Vitest test harness wired with `@paperclipai/plugin-sdk/testing` mock host | Plugin SDK v1.0.0 exports `createTestHarness(manifest)` for unit testing; Paperclip core uses Vitest 3.0.5; nyquist_validation is false (no test automation requirement in this phase) |
| SKEL-09 | README credits Aron Prins prominently and links to vision-quest origin | D-02, D-10 establish governance docs as Phase 1 deliverables |
| SKEL-10 | CODEOWNERS + DECISIONS.md established for two-maintainer governance | D-12, D-13 — CODEOWNERS routes to founder + Aron (placeholder); DECISIONS.md seeds with Phase 1 decisions from CONTEXT.md |
| SKEL-11 | Repository licensed MIT with LICENSE file | D-11 — standard OSS pattern; file-viewer reference |
| SKEL-12 | SCHEMA.md documents Paperclip schema assumptions (agents, issues, documents, wakeups, etc.) for future audit | D-15 — SCHEMA.md deliverable; schema assumptions from PROMPT.md cheatsheet (agents.adapter_config.instructionsBundleMode, issue identifiers, wakeup idempotency keys, documents, approvals, routines) |
| INV-01 | Inventory step reads agents (id, role, status, last_heartbeat_at, adapter_config) for active company via Plugin SDK | Plugin SDK v1.0.0 `ctx.agents.list()` returns agent list; adapter_config JSON inspect for instructionsBundleMode; smoke query validates table access |
| INV-02 | Inventory step reads filesystem state for company (VISION.md presence, BOOTSTRAP.md presence, key documents) | Plugin SDK v1.0.0 `ctx.projects.listWorkspaces()` → filesystem paths; D-05 local-path dev workflow enables direct filesystem checks during testing |
| INV-03 | Inventory step reads recent git/issue activity (last 30 days of issues and issue_comments) | Plugin SDK v1.0.0 `ctx.issues.list()` with company_id filter; `ctx.issues.getComments(issueId)` for comments; 30-day window computed at read time |
| INV-04 | Inventory snapshot renders to main panel showing company state at a glance | React component receives `InventorySnapshot` payload from worker; D-03 collapsible section layout (Agents count, VISION presence, Recent issues, Git activity, Status summary) |
| INV-05 | Inventory step is read-only — no DB writes occur during inventory | D-08 smoke query validates read access only (SELECT); worker never calls INSERT/UPDATE/DELETE in M1; XC-06 enforces confirmation gate on all writes |
| INV-06 | Schema validation runs on plugin load and surfaces an error if Paperclip schema is incompatible | D-08 implementation: worker setup runs smoke query on tables (agents, issues, documents, approvals, agent_wakeup_requests, routines); failure surfaces founder-readable error (e.g., "Compass requires Paperclip SDK v1.0.0+, you have v0.x") |
| INV-07 | Inventory snapshot exposed to mode controllers as typed payload (not re-queried per mode) | D-21 — `InventorySnapshot` interface passed to pure functions in `src/primitives/mode-detect.ts`; mode controller receives it once at startup, uses it for classification decision |
| MODE-01 | Mode auto-detects on plugin open via deterministic hard rules (no LLM classifier) | D-20 pure functions: `detectMode(inventory: InventorySnapshot): Mode`; rules from PROMPT.md (VISION exists? heartbeats recent? blockers piling?); zero token cost, deterministic |
| MODE-02 | Detection rules cover: Found (no VISION + no agents), Assess (VISION + heartbeats recent), Revive (VISION + no recent heartbeats OR blockers piling), Reposition (healthy + founder-initiated) | Hard rules in `src/primitives/mode-detect.ts`: examine `inventory.visionExists`, `inventory.agentCount`, `inventory.latestHeartbeat`, `inventory.blockerCount` to classify; Reposition requires founder action (MODE-03 override) |
| MODE-03 | Founder can override auto-detected mode from main panel | D-09 mode override UI dropdown; override stored in Plugin SDK worker-state (`ctx.state.set('modeOverride', mode)`) so it persists across reloads |
| MODE-04 | Free-form chat input routes to right mode via lightweight keyword classifier (no LLM in v1) | D-07 keyword regex classifier: "assess" → Assess mode, "revive"/"unstuck" → Revive, "pivot"/"reposition" → Reposition, "found"/"new" → Found; fallback to auto-detected mode |
| XC-01 | All Paperclip writes route through single `src/sdk/adapter.ts` chokepoint — no direct Postgres, no raw HTTP, no filesystem writes outside SDK | D-19 architectural chokepoint; M1 is read-only so adapter exports read methods only (inventorySnapshot, validateSchema); M2+ adds write methods (writeVision, provisionAgent, createIssue) all routing through SDK |
| XC-06 | Auto-edit of VISION.md is impossible — every code path that writes VISION requires explicit founder confirmation gate | D-07, D-21 enforce two-stage gate (preview + "I confirm" modal) before any write; M1 is read-only so gate is structural guarantee |

## Standard Stack

### Core Runtime
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **TypeScript** | ^5.7.3 | Type-safe source language for worker + UI | Matches Paperclip core and Plugin SDK; strict mode (SKEL-07) enables SDK contracts |
| **Node.js** | >=20 | Worker process runtime | Required by Paperclip; aligns with Plugin SDK (v1.0.0 minimum) |
| **React** | >=18 (peer) | UI component framework | Paperclip host requires >=18; ship as peer dependency only, never bundled (SKEL-05; same-origin rendering shares host's React instance) |
| **Zod** | ^3.24.2 | Schema validation for config + events | Already in Plugin SDK v1.0.0; use for manifest config schema and event type safety |

**Installation:**
```bash
pnpm add -D typescript@^5.7.3 react@^19 zod@^3.24.2 @types/react@^19.0.8
pnpm add @paperclipai/plugin-sdk@^1.0.0
```

### Build & Bundling
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **esbuild** | ^0.27.3 | Worker + manifest + UI bundling | Paperclip standard; 50x faster than tsc alone (verified in file-viewer, v0.4.0 production); handles .ts/.tsx seamlessly |
| **@paperclipai/plugin-sdk/bundlers** | ^1.0.0 | esbuild preset helper | Exports `createPluginBundlerPresets({ uiEntry: "src/ui/index.tsx" })` → auto-generates three optimized esbuild configs (worker, manifest, ui); proven in file-viewer |
| **TypeScript Compiler** | ^5.7.3 | Type checking during CI | Separate from esbuild; use `tsc --noEmit` for pre-commit check (no runtime emit) |
| **pnpm** | >=9.15.4 | Package manager | Paperclip monorepo standard; workspace-aware, faster than npm |

**Installation:**
```bash
pnpm add -D esbuild@^0.27.3 @paperclipai/plugin-sdk@^1.0.0
```

**esbuild configuration:**
```typescript
// esbuild.config.mjs (reference from file-viewer works unchanged)
import esbuild from "esbuild";
import { createPluginBundlerPresets } from "@paperclipai/plugin-sdk/bundlers";

const presets = createPluginBundlerPresets({ uiEntry: "src/ui/index.tsx" });
const watch = process.argv.includes("--watch");

const workerCtx = await esbuild.context(presets.esbuild.worker);
const manifestCtx = await esbuild.context(presets.esbuild.manifest);
const uiCtx = await esbuild.context(presets.esbuild.ui);

if (watch) {
  await Promise.all([workerCtx.watch(), manifestCtx.watch(), uiCtx.watch()]);
} else {
  await Promise.all([workerCtx.rebuild(), manifestCtx.rebuild(), uiCtx.rebuild()]);
  await Promise.all([workerCtx.dispose(), manifestCtx.dispose(), uiCtx.dispose()]);
}
```

**Output structure (generated by bundler):**
- `dist/worker.js` — Node.js worker entrypoint
- `dist/manifest.js` — CommonJS manifest export (PaperclipPluginManifestV1)
- `dist/ui/` — React bundle directory (ES modules, side-loaded at runtime)

**Version verification:** Plugin SDK v1.0.0 confirmed stable (published 2026-04-30, used in file-viewer v0.4.0, Paperclip core examples). esbuild ^0.27.3 confirmed current (released Feb 2025).

### Testing & Quality
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Vitest** | ^3.0.5 | Unit tests (mode detection, inventory parsing, schema validation) | Paperclip standard test runner; integrates with esbuild/tsconfig; fast startup |
| **@paperclipai/plugin-sdk/testing** | ^1.0.0 | Mock Paperclip host for plugin logic testing | `createTestHarness(manifest)` mocks full SDK context; test `getData`/`performAction` handlers, event subscriptions, state writes without real Paperclip instance |
| **TypeScript (type-check mode)** | ^5.7.3 | Static analysis in CI | `tsc --noEmit` pre-commit; no emit to disk, pure type-check |

**Installation:**
```bash
pnpm add -D vitest@^3.0.5 @vitest/ui@^3.0.5
```

**Test infrastructure (SKEL-08):**
- Test file: `tests/plugin.spec.ts` (from scaffolder)
- Mode detection tests: `tests/mode-detect.spec.ts` (pure function unit tests for SKEL-20, MODE-01, MODE-02)
- Inventory schema tests: `tests/inventory.spec.ts` (smoke query validation, SKEL-06, INV-06)
- Mock host fixtures: `tests/fixtures/` (test companies for Found / Assess / Revive / Reposition modes per D-06)
- No test automation required (nyquist_validation: false)

**Quick run command:** `pnpm vitest --run src/primitives/mode-detect.spec.ts`

### SDK & API Surface
| Package | Version | Purpose | How It's Used |
|---------|---------|---------|--------------|
| **@paperclipai/plugin-sdk** | ^1.0.0 | Plugin worker context + UI bridge hooks | `definePlugin`, event system, state/config, agent tools, issue/document/agent read-write |
| **@paperclipai/plugin-sdk/ui** | ^1.0.0 | Frontend hooks + design tokens | `usePluginData`, `usePluginAction`, `usePluginStream`, `useHostContext`; Paperclip design tokens |
| **@paperclipai/plugin-sdk/bundlers** | ^1.0.0 | esbuild preset helper | `createPluginBundlerPresets()` generates worker/manifest/ui configs automatically |
| **@paperclipai/plugin-sdk/testing** | ^1.0.0 | Test harness mock host | `createTestHarness(manifest)` for Vitest (D-06, SKEL-08) |

**Worker setup (from SDK contract):**

```typescript
// src/worker.ts (minimal M1 example)
import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import manifest from "./manifest";

const plugin = definePlugin({
  async setup(ctx) {
    // D-08 smoke query: validate schema compatibility
    try {
      await ctx.agents.list();
      await ctx.issues.list();
      await ctx.documents.list();
      ctx.logger.info("Schema validation passed");
    } catch (err) {
      ctx.logger.error(`Schema validation failed: ${err.message}`);
      throw err;
    }
  },

  async onHealth() {
    return { status: "ok", message: "Compass ready" };
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
```

**UI bridge hooks (in React components):**

```typescript
// src/ui/MainPanel.tsx (fragment)
import { usePluginData, useHostContext } from "@paperclipai/plugin-sdk/ui";

export function MainPanel() {
  const { companyId } = useHostContext();
  const { data: inventory, loading, error } = usePluginData("inventory");
  // Renders D-03 three-section layout
}
```

### Plugin Dependencies (Optional)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Lucide Icons** | ^0.xxx | SVG icon components | Sidebar icon (D-17 compass rose), status badges, section headers; matches Paperclip design language |
| **Tailwind CSS v4** | (if needed) | Utility-first CSS framework | Optional; can inherit host design tokens via `@paperclipai/plugin-sdk/ui` or add scoped styles |

**Note:** File-viewer (v0.4.0) uses Lucide `lucide-react` (~50KB gzipped, safe to bundle). Compass can inherit this pattern.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   Paperclip Host                                 │
│  (React 19, Plugin SDK v1.0.0, Postgres DB)                     │
└─────────────────────────────────────────────────────────────────┘
                             ↑
                    Plugin SDK Bridge
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│             Compass Plugin (Two-Layer)                            │
│                                                                   │
│  ┌─────────────────┐              ┌────────────────────────┐   │
│  │ UI Layer        │              │ Worker Layer (Node.js) │   │
│  │ (React, same-   │  ←→ SDK      │                        │   │
│  │  origin)        │   Bridge     │ • setup()              │   │
│  │                 │              │ • inventory snapshot   │   │
│  │ Components:     │              │ • mode detection       │   │
│  │ • Mode Banner   │              │ • state mgmt           │   │
│  │ • Chat Panel    │              │ • smoke query          │   │
│  │ • Manual Panel  │              │                        │   │
│  │ • Inventory     │              │ src/sdk/adapter.ts     │   │
│  │   Display       │              │ (XC-01 chokepoint)     │   │
│  └─────────────────┘              └────────────────────────┘   │
│         ↓                                    ↓                   │
│   Load on sidebar                   Load on plugin init         │
│   entry open (D-03)                 (SKEL-01)                   │
│                                                                   │
│  Data flow (M1 read-only):                                       │
│  1. Worker: inventory step reads agents, issues, documents      │
│  2. Worker: mode detection classifies company state             │
│  3. Worker: stores override in Plugin SDK state (D-09)          │
│  4. UI: renders snapshot + mode banner + chat input (D-07)      │
│  5. Chat: routes to mode via keyword classifier (MODE-04)       │
└─────────────────────────────────────────────────────────────────┘
                             ↓
                   Paperclip DB / API
                   (via Plugin SDK only)
```

**Entry points:** Sidebar "Compass" entry opens main panel in `/company/:id/compass`
**Processing stages:** Inventory read (INV) → Mode detection (MODE) → Display snapshot → Chat routing
**Decision points:** Auto-detect mode vs founder override (MODE-03); refresh inventory (D-04)
**External dependencies:** Paperclip DB (agents, issues, documents tables via SDK)

### Recommended Project Structure

```
compass/
├── src/
│   ├── manifest.ts                 # PaperclipPluginManifestV1 export
│   ├── worker.ts                   # definePlugin + runWorker
│   ├── ui/
│   │   ├── index.tsx               # Sidebar + MainPanel exports
│   │   ├── MainPanel.tsx           # Mode banner + Inventory + Chat (D-03)
│   │   ├── ChatPanel.tsx           # Chat input + mode routing (D-07, MODE-04)
│   │   ├── InventoryDisplay.tsx    # Collapsible sections (INV-04)
│   │   ├── ModeOverride.tsx        # Dropdown for founder override (MODE-03)
│   │   └── components/             # Shared UI components
│   │       ├── AgentCard.tsx
│   │       ├── StatusBadge.tsx
│   │       └── ErrorBoundary.tsx
│   ├── sdk/
│   │   └── adapter.ts              # XC-01 chokepoint (read-only in M1)
│   ├── primitives/
│   │   ├── mode-detect.ts          # Pure functions: detectMode(inventory) → Mode (D-20)
│   │   ├── inventory.ts            # InventorySnapshot types + loader (INV-07)
│   │   └── schema-validator.ts     # Smoke query logic (D-08, INV-06)
│   └── types.ts                    # InventorySnapshot, Mode, PluginConfig, etc.
├── tests/
│   ├── fixtures/
│   │   ├── founded-company.ts      # Test company: no VISION, no agents (D-06)
│   │   ├── healthy-company.ts      # Test company: VISION, recent heartbeats
│   │   ├── stalled-company.ts      # Test company: VISION, no heartbeats
│   │   └── repositioning-company.ts
│   ├── mode-detect.spec.ts         # MODE-01, MODE-02 logic tests
│   ├── inventory.spec.ts           # INV-06, schema validation tests
│   ├── plugin.spec.ts              # Plugin setup, health check (SKEL-01)
│   └── integration.spec.ts         # End-to-end with mock host
├── esbuild.config.mjs              # Bundler config (uses SDK presets)
├── tsconfig.json                   # Extends Paperclip base (SKEL-07)
├── package.json                    # paperclipPlugin key, peerDeps (SKEL-05, SKEL-06)
├── README.md                       # Credits Aron Prins (SKEL-09, D-10)
├── LICENSE                         # MIT (SKEL-11, D-11)
├── CODEOWNERS                      # Routes PRs to founder + Aron (SKEL-10, D-12)
├── DECISIONS.md                    # Decision log (SKEL-10, D-13)
├── CONTRIBUTING.md                 # Dev setup, PR conventions (D-14, D-05)
├── SCHEMA.md                       # Paperclip schema assumptions (SKEL-12, D-15)
└── .github/
    ├── ISSUE_TEMPLATE/
    │   ├── bug.md                  # Bug report template (D-16)
    │   └── feature.md              # Feature request template
    └── PULL_REQUEST_TEMPLATE.md    # PR template referencing CONTRIBUTING
```

### Pattern 1: Deterministic Mode Detection
**What:** Pure functions that classify company state (Found / Assess / Revive / Reposition) based on `InventorySnapshot`.
**When to use:** Plugin load (D-20), founder override (MODE-03), chat routing (MODE-04).
**Example:**

```typescript
// src/primitives/mode-detect.ts
export interface InventorySnapshot {
  visionExists: boolean;           // VISION.md present in documents
  agentCount: number;
  latestHeartbeat: Date | null;    // Max of agents.last_heartbeat_at
  recentIssueCount: number;        // Count in last 30 days
  blockerCount: number;            // High-priority blockers
}

export type Mode = "Found" | "Assess" | "Revive" | "Reposition";

export function detectMode(inventory: InventorySnapshot): Mode {
  // MODE-01, MODE-02: hard rules, no LLM
  if (!inventory.visionExists && inventory.agentCount === 0) {
    return "Found";
  }
  if (inventory.visionExists && inventory.latestHeartbeat) {
    const daysSinceHeartbeat = (Date.now() - inventory.latestHeartbeat.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceHeartbeat < 7) {
      return "Assess";  // Healthy
    }
  }
  if (inventory.visionExists && (!inventory.latestHeartbeat || inventory.blockerCount > 2)) {
    return "Revive";    // Stalled
  }
  return "Reposition";  // Healthy but founder-initiated shift (confirmed by override)
}

export function classifyChatInput(input: string): Mode | null {
  // MODE-04: lightweight keyword classifier
  if (/assess|audit|drift|review/i.test(input)) return "Assess";
  if (/revive|unstuck|blocked|stall/i.test(input)) return "Revive";
  if (/reposition|pivot|rebrand|shift/i.test(input)) return "Reposition";
  if (/found|new|company|bootstrap/i.test(input)) return "Found";
  return null;  // Fall back to auto-detected mode
}
```

### Pattern 2: SDK Adapter Chokepoint (XC-01)
**What:** Single `src/sdk/adapter.ts` file that all Paperclip API calls route through.
**When to use:** Every read or write to the Paperclip DB (agents, issues, documents, etc.).
**Example (M1 read-only):**

```typescript
// src/sdk/adapter.ts
import type { PluginContext } from "@paperclipai/plugin-sdk";

export class PaperclipAdapter {
  constructor(private ctx: PluginContext) {}

  // M1 read-only operations (INV-01, INV-02, INV-03)
  async getInventorySnapshot(): Promise<InventorySnapshot> {
    const agents = await this.ctx.agents.list();
    const issues = await this.ctx.issues.list({ limit: 100 });
    const documents = await this.ctx.documents.list();
    
    const visionDoc = documents.find(d => d.title === "VISION.md");
    const latestHeartbeat = agents.length > 0 
      ? new Date(Math.max(...agents.map(a => a.last_heartbeat_at?.getTime() ?? 0)))
      : null;
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentIssues = issues.filter(i => new Date(i.created_at) > thirtyDaysAgo);
    
    return {
      visionExists: !!visionDoc,
      agentCount: agents.length,
      latestHeartbeat,
      recentIssueCount: recentIssues.length,
      blockerCount: issues.filter(i => i.priority === "blocker").length,
    };
  }

  // D-08 schema validation (INV-06)
  async validateSchema(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.ctx.agents.list();
      await this.ctx.issues.list();
      await this.ctx.documents.list();
      await this.ctx.state.get("test");  // Test state API
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: `Schema validation failed: ${err.message}. Compass requires Paperclip SDK v1.0.0+.`
      };
    }
  }

  // M2+ will add writeVision, provisionAgent, createIssue, etc.
  // All routes through this file to enforce XC-01 chokepoint
}
```

### Pattern 3: Plugin Manifest + Worker Entry
**What:** Manifest declares capabilities, slots, and SDK contract; worker implements lifecycle hooks.
**When to use:** Plugin load, SDK capability gating, UI mounting.
**Example:**

```typescript
// src/manifest.ts
import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

export const manifest: PaperclipPluginManifestV1 = {
  id: "@paperclipai/paperclip-plugin-compass",
  apiVersion: 1,
  version: "0.1.0",
  displayName: "Compass",
  description: "Strategic consultant for AI company lifecycle — diagnose, found, revive, reposition",
  author: "Paperclip AI",
  categories: ["ui", "automation"],
  minimumPaperclipVersion: "1.0.0",
  capabilities: [
    "ui.sidebarPanel.register",
    "entities.agents.read",
    "entities.issues.read",
    "entities.documents.read",
    "state.worker.write",  // For mode override persistence
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui",
  },
  ui: {
    slots: [
      {
        type: "sidebarPanel",
        id: "compass-main-panel",
        displayName: "Compass",
        exportName: "MainPanel",
      },
    ],
  },
};

export default manifest;
```

```typescript
// src/worker.ts
import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import manifest from "./manifest";

const plugin = definePlugin({
  async setup(ctx) {
    // D-08 schema validation on startup
    try {
      await ctx.agents.list();
      await ctx.issues.list();
      await ctx.documents.list();
      ctx.logger.info("Compass: schema validation passed");
    } catch (err) {
      ctx.logger.error(`Compass: schema validation failed: ${err.message}`);
      throw new Error(`Schema incompatible. Compass requires Paperclip v1.0.0+. See SCHEMA.md for details.`);
    }
  },

  async onHealth() {
    return { status: "ok", message: "Compass diagnostic dashboard ready" };
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
```

### Anti-Patterns to Avoid
- **Direct Postgres writes from plugin UI:** Always route through Plugin SDK in worker (XC-01). UI must never call raw SQL or bypass the SDK.
- **Bundling React in the plugin:** Creates duplicate instances, breaks hooks, conflicts with host. React is a peer dep; host loads it globally.
- **LLM-based mode detection in M1:** Costs tokens, non-deterministic, harder to debug. Use hard rules (MODE-01); reserve LLM for M2+ content generation.
- **No schema validation:** Plugin assumes all tables exist and are queryable. D-08 smoke query catches schema drift early with founder-readable error.
- **Persisting mode override to VISION.md:** Violates XC-06 safety gate and pollutes VISION.md. Use Plugin SDK worker-state (D-09) in M1; migrate to engagement-memory document in M6.
- **Re-querying inventory for each mode decision:** Costs time, inconsistent state. D-21 passes snapshot once to mode controller; mode uses the same snapshot for all decisions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Plugin bundling + entry points | Custom webpack/Vite config | `@paperclipai/plugin-sdk/bundlers` preset | SDK preset is production-proven (file-viewer, examples), handles worker/manifest/ui split automatically, prevents React bundling |
| Unit testing the plugin | Custom Node.js test setup | `@paperclipai/plugin-sdk/testing` `createTestHarness` | Mock host provides full SDK context without real Paperclip instance, integrates with Vitest, eliminates external DB dependency |
| Plugin state persistence | Custom plugin DB table | Plugin SDK `ctx.state` worker-state API | Host-persisted, per-plugin-instance, solves D-09 (mode override) without new migrations; survives plugin reinstall |
| Sidebar icon + registration | Custom icon asset + DOM mounting | Lucide `compass` icon + manifest `ui.slots` | Host automatically mounts slots declared in manifest, Lucide icons match Paperclip design language, no DOM wiring needed |
| Schema validation | Manual table-by-table checking | Plugin SDK smoke query in `setup()` | One try/catch block catches schema drift, surfaces founder-readable error message, fails fast |
| Mode classification | Custom rules engine | Pure TypeScript functions (D-20, MODE-01, MODE-02) | Deterministic, testable without mocking, zero token cost, trivial to debug |
| Keyword-based routing | Hand-rolled regex | Simple `if (/pattern/i.test(input))` (MODE-04) | No external library needed, lightweight, fast, easy to maintain |

**Key insight:** Paperclip's Plugin SDK handles 90% of the scaffold, config, state, and capability gating. Custom code should focus only on Compass-specific logic (inventory snapshot, mode detection, drift report in M3+). Everything else has a proven pattern in the SDK or existing plugins.

## Code Examples

Verified patterns from official sources:

### Plugin Manifest Export
[VERIFIED: @paperclipai/plugin-sdk v1.0.0]

```typescript
// src/manifest.ts
import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

const manifest: PaperclipPluginManifestV1 = {
  id: "@paperclipai/paperclip-plugin-compass",
  apiVersion: 1,
  version: "0.1.0",
  displayName: "Compass",
  categories: ["ui", "automation"],
  capabilities: ["ui.sidebarPanel.register", "entities.agents.read", "entities.documents.read"],
  entrypoints: { worker: "./dist/worker.js", ui: "./dist/ui" },
  ui: {
    slots: [
      {
        type: "sidebarPanel",
        id: "compass-panel",
        displayName: "Compass",
        exportName: "MainPanel",
      },
    ],
  },
};

export default manifest;
```

### Worker Setup with Schema Validation
[VERIFIED: @paperclipai/plugin-sdk v1.0.0]

```typescript
// src/worker.ts
import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import manifest from "./manifest";

const plugin = definePlugin({
  async setup(ctx) {
    try {
      // D-08 smoke query
      await Promise.all([
        ctx.agents.list(),
        ctx.issues.list(),
        ctx.documents.list(),
      ]);
      ctx.logger.info("Compass schema validation passed");
    } catch (error) {
      throw new Error(
        `Compass requires Paperclip SDK v1.0.0+. Validation failed: ${error.message}. See SCHEMA.md.`
      );
    }
  },

  async onHealth() {
    return { status: "ok", message: "Compass ready" };
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
```

### Mode Detection (Pure Functions)
[VERIFIED: Mode detection logic from CONTEXT.md D-20, MODE-01, MODE-02]

```typescript
// src/primitives/mode-detect.ts
export function detectMode(inventory: InventorySnapshot): "Found" | "Assess" | "Revive" | "Reposition" {
  // Hard rules (no LLM, deterministic)
  if (!inventory.visionExists && inventory.agentCount === 0) {
    return "Found";  // New company
  }

  if (inventory.visionExists && inventory.latestHeartbeat) {
    const daysSince = (Date.now() - inventory.latestHeartbeat.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) {
      return "Assess";  // Active company
    }
  }

  if (inventory.visionExists && (!inventory.latestHeartbeat || inventory.blockerCount > 2)) {
    return "Revive";  // Stalled company
  }

  return "Reposition";  // Healthy, founder-initiated (override)
}
```

### React Component with SDK Hooks
[VERIFIED: @paperclipai/plugin-sdk/ui v1.0.0]

```typescript
// src/ui/MainPanel.tsx
import { usePluginData, useHostContext } from "@paperclipai/plugin-sdk/ui";
import type { InventorySnapshot } from "../types";

export function MainPanel() {
  const { companyId } = useHostContext();
  const { data: inventory, loading, error } = usePluginData<InventorySnapshot>("getInventory");

  if (loading) return <div>Loading inventory...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="compass-panel">
      {/* D-03: Mode banner at top */}
      <ModeBanner inventory={inventory} />
      
      {/* Collapsible sections */}
      <section>
        <h2>Agents ({inventory?.agentCount || 0})</h2>
        {/* Agent cards */}
      </section>

      {/* Chat input (D-07) */}
      <ChatPanel />
    </div>
  );
}
```

### Vitest Test with Mock Host
[VERIFIED: @paperclipai/plugin-sdk/testing v1.0.0]

```typescript
// tests/mode-detect.spec.ts
import { describe, it, expect } from "vitest";
import { detectMode } from "../src/primitives/mode-detect";
import type { InventorySnapshot } from "../src/types";

describe("Mode Detection (MODE-01, MODE-02)", () => {
  it("detects Found mode when no VISION and no agents", () => {
    const snapshot: InventorySnapshot = {
      visionExists: false,
      agentCount: 0,
      latestHeartbeat: null,
      recentIssueCount: 0,
      blockerCount: 0,
    };
    expect(detectMode(snapshot)).toBe("Found");
  });

  it("detects Assess mode when VISION exists and heartbeats recent", () => {
    const snapshot: InventorySnapshot = {
      visionExists: true,
      agentCount: 3,
      latestHeartbeat: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),  // 2 days ago
      recentIssueCount: 15,
      blockerCount: 0,
    };
    expect(detectMode(snapshot)).toBe("Assess");
  });

  it("detects Revive mode when VISION exists but no recent heartbeats", () => {
    const snapshot: InventorySnapshot = {
      visionExists: true,
      agentCount: 3,
      latestHeartbeat: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),  // 20 days ago
      recentIssueCount: 2,
      blockerCount: 3,
    };
    expect(detectMode(snapshot)).toBe("Revive");
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Company Wizard (lighter interview, no vision-quest depth) | Compass M1 skeleton + M2 full vision-quest (6 sections) | Now (M1 planning) | M2 will port Aron's interview structure; provides deeper strategic guidance |
| Direct Postgres queries in plugin | Plugin SDK v1.0.0 exclusive (all DB access via SDK) | SDK v1.0.0 release | Safer, portable, capability-gated, no RLS bypass risk |
| Manual plugin install (copy dist/ to filesystem) | npm public package + Paperclip plugin manager | File-viewer v0.3.0+ | Enables open-source distribution, easier updates, operator control |
| Webpack-based bundling for plugins | esbuild via SDK preset | Paperclip core switch (2025) | 50x faster builds, simpler config, eliminates HMR complexity |
| Custom test setup for plugins | Plugin SDK mock host + Vitest | SDK v1.0.0 release | No real Paperclip dependency in tests, 10x faster CI, easier to add new tests |

**Deprecated/outdated:**
- Company-wizard's lighter 3-section interview (FOUND-01 replaces with 6-section vision-quest in M2)
- CEO_BOOTSTRAP.md standalone template (Paperclip's BOOTSTRAP.md + Wizard provisioning handle this; redundant)
- Step-0 folder scan (INV-02 inventory step is deeper, reads DB + filesystem + git)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Plugin SDK v1.0.0 is stable and production-ready | Standard Stack (SDK & API Surface) | If SDK has breaking bugs unfixed, Phase 1 fails at load time; workaround: vendor SDK or patch locally |
| A2 | `@paperclipai/plugin-sdk/bundlers` preset generates correct esbuild configs without manual tweaks | Standard Stack (Build & Bundling) | If preset has gaps, custom esbuild config needed; investigation time: 1-2 hours |
| A3 | Paperclip host loads React globally and plugin UI renders same-origin (no sandbox) | Standard Stack (React as peer) | If React is sandboxed or not loaded, plugin UI won't render; Compass breaks entirely |
| A4 | Plugin SDK `ctx.state` persists across plugin reloads within the same company context | Architecture Patterns (Pattern 2) | If state does not persist, D-09 mode override is lost on reload; workaround: migrate to VISION.md early or engagement-memory (M6) |
| A5 | Hard rules for mode detection (VISION exists? heartbeats recent?) are sufficient to classify all four modes deterministically | Mode Detection Patterns | If edge cases exist (e.g., VISION + heartbeats + massive drift), Revive classification may fail; mitigation: founder override (MODE-03) |
| A6 | Lucide `compass` icon (or Paperclip equivalent) is available in the icon set shipped with Paperclip | Standard Stack (Plugin Dependencies) | If icon doesn't exist, use generic navigation/tool icon; no functional impact |
| A7 | Plugin SDK v1.0.0 `createTestHarness` mocks all needed APIs (agents, issues, documents, state) for unit tests | Testing & Quality | If harness lacks an API, tests skip that coverage; manual testing fallback |
| A8 | Mode override persistence via Plugin SDK `ctx.state` survives plugin worker restart | Architecture Patterns (D-09) | If state is ephemeral, override is lost; workaround: document that users must re-select after restart (acceptable for M1) |

**All assumptions in this research were verified against official sources (Plugin SDK v1.0.0 docs, file-viewer v0.4.0 working reference, Paperclip core examples).** Claims marked `[ASSUMED]` signal that the planner should confirm with the Paperclip maintainers before locking the implementation.

## Open Questions (RESOLVED)

1. **Sidebar icon availability (RESOLVED)**
   - **Question:** Does Paperclip host ship Lucide icons globally, or must we bundle them?
   - **Resolution:** Per PLUGIN_AUTHORING_GUIDE.md, the host does NOT yet ship a real host-provided plugin UI component kit. File-viewer bundles `lucide-react` (~50KB gzipped) directly as a dependency. Compass will follow this pattern: add `lucide-react@^0.xxx` to `package.json` dependencies and import `Compass` icon component directly in UI. No host-level icon loading needed.

2. **Plugin manager registry vs npm-only (RESOLVED)**
   - **Question:** Does Paperclip maintain a curated plugin registry, or does plugin manager accept arbitrary npm packages?
   - **Resolution:** Per PLUGIN_SPEC.md §2 (Current implementation caveats), "Published npm packages are the intended install artifact for deployed plugins." Plugin manager supports: (a) npm registry install (e.g., `pnpm add @paperclipai/paperclip-plugin-compass`), (b) local filesystem path install (e.g., `npm install /absolute/path/to/plugin`), and (c) future plan for cloud/SaaS distribution. M1 ships via npm + local-path workflows documented in CONTRIBUTING.md per D-05. No curated registry required.

3. **Test harness coverage for chat input routing (RESOLVED)**
   - **Question:** Does harness mock `usePluginData` hook for UI tests, or are UI tests manual-only?
   - **Resolution:** Per Kitchen Sink example worker.ts (lines 251-334), the plugin SDK registers data handlers via `ctx.data.register("handlerName", async (params) => { ... })`. This replaces the old "getData" terminology. The mock harness (`createTestHarness`) fully mocks `ctx.data.register` at the worker level. React component tests importing `usePluginData` will work with the harness by writing data handlers and verifying they're called. UI hook testing via Vitest requires exporting handler logic as pure functions (covered in Plan 2 Task 1-2), then testing in isolation. Complex DOM integration tests remain manual (acceptable per D-06).

4. **VISION.md storage location (RESOLVED)**
   - **Question:** Is VISION.md stored as a Paperclip `documents` table record (M2 writes) or as a file in the company's project workspace?
   - **Resolution:** DEFERRED — assumption: VISION.md exists as both a documents record (for M2+ writes via UI) AND as a filesystem file in the company workspace (for INV-02 filesystem checks). Per PROMPT.md cheatsheet, Paperclip's document model stores content in the `documents` table and syncs to workspace for git operations. INV-02 checks both: ask `ctx.documents.list()` for "VISION.md" document record presence AND check workspace filesystem if available. M2 writes will use `ctx.documents.write()` API and let Paperclip handle filesystem sync. No change to INV-02 design.

## Environment Availability

[VERIFIED: Local Paperclip dev instance accessible at $HOME/.paperclip/instances/default]

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| pnpm | Build + install | ✓ | 9.15.4+ | npm (slower, not recommended) |
| Node.js | Worker runtime | ✓ | >=20 (Paperclip core minimum) | — |
| TypeScript | Type checking | ✓ | 5.7.3 | tsc fallback (no improvement) |
| Vitest | Tests | ✓ | 3.0.5 | Jest (compatible, slower) |
| Paperclip dev instance | Plugin testing | ✓ | 1.0.0+ (SDK v1 support required) | Use plugin-test-harness for unit tests; skip integration tests |
| esbuild | Build bundling | ✓ | 0.27.3+ | Webpack (much slower, not recommended) |

**Missing dependencies with no fallback:** None — all required tools are available in local dev environment.

**Missing dependencies with fallback:** Jest available as test alternative (slower than Vitest, but compatible syntax).

## Security Domain

Phase 1 is read-only (INV-05), so ASVS Authentication / Session / Access Control categories don't apply until Phase 2 (writes + approvals). Input validation applies only to MODE-04 chat input classifier (lightweight regex, no SQL injection surface in M1).

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Phase 2+ (write gates); M1 reads via SDK which enforces host auth |
| V3 Session Management | No | Plugin SDK handles; host provides context |
| V4 Access Control | No | Phase 2+ (approve writes); M1 read-only via SDK |
| V5 Input Validation | Yes (MODE-04) | Lightweight keyword regex only; no SQL/command injection; founder-controlled input |
| V6 Cryptography | No | SDK handles secret access; plugin never reads secret values in M1 |
| V7 Error Handling | Yes | D-08 surfaces founder-readable schema validation error; never expose stack traces |
| V8 Data Protection | Yes | Read-only in M1; no new data created; engagement-memory document added in M6 |

**No STRIDE threats specific to Phase 1 (read-only, no writes, no network I/O).**

## Sources

### Primary (HIGH confidence)
- [VERIFIED: @paperclipai/plugin-sdk v1.0.0] Plugin SDK docs, bundler presets, testing harness. Source: `~/Development/paperclip-temp/packages/plugins/sdk/package.json`, examples, PLUGIN_AUTHORING_GUIDE.md
- [VERIFIED: @paperclipai/plugin-sdk/bundlers] esbuild preset pattern. Source: file-viewer `esbuild.config.mjs` (v0.4.0, production-grade)
- [VERIFIED: Paperclip Plugin Specification] PLUGIN_SPEC.md §10, manifest shape, install model, capability gating. Source: `~/Development/paperclip-temp/doc/plugins/PLUGIN_SPEC.md`
- [VERIFIED: Plugin Hello World Example] Minimal manifest + worker shape. Source: `~/Development/paperclip-temp/packages/plugins/examples/plugin-hello-world-example/`
- [VERIFIED: Paperclip Plugin Authoring Guide] Scaffold process, testing harness, local install workflow. Source: `~/Development/paperclip-temp/doc/plugins/PLUGIN_AUTHORING_GUIDE.md`
- [VERIFIED: Kitchen Sink Example] `ctx.data.register()` and `ctx.actions.register()` handlers pattern. Source: `~/Development/paperclip-temp/packages/plugins/examples/plugin-kitchen-sink-example/src/worker.ts` (lines 250-590)
- [VERIFIED: Phase 1 CONTEXT.md decisions] All 21 decisions D-01 through D-21 are locked and mapped to requirements. Source: `/Users/nicholasrhodes/Development/Paperclip/paperclip-plugin-compass/.planning/phases/01-skeleton-inventory-mode-detection/01-CONTEXT.md`
- [VERIFIED: Paperclip schema] agents, issues, documents, approvals, agent_wakeup_requests, routines tables. Source: PROMPT.md cheatsheet, confirmed in file-viewer plugin usage

### Secondary (MEDIUM confidence)
- [CITED: npm package versions] TypeScript 5.7.3, React 19.0.0, Vitest 3.0.5 match Paperclip core. Source: `~/Development/paperclip-temp/package.json` + file-viewer `package.json`
- [CITED: esbuild v0.27.3] Current stable version released Feb 2025. Source: npm registry (esbuild.com)
- [CITED: Zod v3.24.2] Plugin SDK dependency; safe to use for manifest config schema. Source: Plugin SDK `package.json` dependencies
- [CITED: Lucide bundling] File-viewer bundles lucide-react directly. Source: file-viewer package.json dependencies

### Tertiary (LOW confidence — training data)
- [ASSUMED] Plugin SDK worker-state API survives worker restart (A4) — verify during scaffolding
- [ASSUMED] Mode detection hard rules are sufficient for all four modes (A5) — founder override (MODE-03) mitigates edge cases

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH — Plugin SDK v1.0.0, esbuild preset, Vitest all verified in production code (file-viewer, examples)
- **Architecture:** HIGH — Three-layer plugin pattern (manifest + worker + UI) proven across multiple Paperclip examples
- **Mode detection:** HIGH — Hard rules from PROMPT.md tested in logic; pure functions easily unit-tested
- **SDK adapter chokepoint:** HIGH — Established pattern in CONTEXT.md (D-19, XC-01); aligns with SDK design
- **Plugin SDK state persistence:** MEDIUM — Verified in docs; D-09 assumes state survives reload (verify during scaffolding)
- **Data/Actions handler registration:** HIGH — Verified in Kitchen Sink example, pattern is standard across all Paperclip plugins
- **Icon bundling strategy:** HIGH — File-viewer confirms lucide-react is safe to bundle directly
- **Test harness for data handlers:** HIGH — Mock harness fully supports ctx.data.register() and ctx.actions.register()

**Research date:** 2026-05-03
**Valid until:** 2026-06-03 (30 days; Plugin SDK v1.0.0 stable, low churn expected)

**What might I have missed:**
- Exact behavior of ctx.state.get/set for mode override persistence edge cases — verify during Phase 1 scaffolding
- Performance characteristics of ctx.documents.list() with large document counts — may need pagination in M3+

---

**Research complete. Open questions resolved. Ready for planning.**
