# Technology Stack: Paperclip Plugin Compass

**Project:** Compass (Paperclip Plugin for strategic consulting)  
**Researched:** 2026-05-02  
**Confidence:** HIGH (verified against Paperclip core v1.0, Plugin SDK 1.0, company-wizard 0.1.16, and file-viewer 0.4.0 reference implementations)

## Recommended Stack

### Core Runtime

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **TypeScript** | ^5.7.3 | Type-safe source language for worker + UI | Matches Paperclip core and all first-party plugins; strict mode enables Plugin SDK contracts and reduces bugs |
| **Node.js** | >=20 | Worker process runtime | Required by Paperclip; aligns with esbuild and plugin infrastructure |
| **React** | >=18 (peer) | UI component framework | Paperclip host requires >=18; ship as peer dependency, not bundled |
| **Zod** | ^3.24.2 | Schema validation for config + events | Already in Plugin SDK; use for manifest config schema and event type safety |

### Build & Bundling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **esbuild** | ^0.27.3 | Worker + manifest + UI bundling | Paperclip standard; 50x faster than tsc alone; handles .ts/.tsx/.css seamlessly |
| **TypeScript Compiler** | ^5.7.3 | Type checking during builds | Separate from esbuild; use `tsc --noEmit` for CI/pre-commit |
| **pnpm** | >=9.15.4 | Package manager | Paperclip monorepo standard; faster than npm/yarn; workspace-aware |

**Build Artifacts:**
- `dist/worker.js` — plugin worker entrypoint (Node.js/esbuild output)
- `dist/manifest.js` — exported manifest object (CommonJS, esbuild output)
- `dist/ui/` — React bundle directory for plugin UI (ES module bundle, esbuild output)

### Testing & Quality

| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| **Vitest** | ^3.0.5 | Unit tests (mode detection, drift logic, schema parsing) | Paperclip standard test runner; compatible with Playwright for E2E |
| **@paperclipai/plugin-test-harness** | ^1.0.0 (from SDK) | Mock Paperclip host for plugin logic testing | Test `getData`/`performAction` handlers, event subscriptions, state writes without a real instance |
| **Node --test** | (built-in) | Logic tests for non-TypeScript utilities | Optional fallback for pure JS; rarely needed in typed codebase |

**No dedicated linter/formatter discovered in Paperclip core** (as of 2026-05). Recommend:
- **Prettier** (optional): Code formatting consistency across open-source contributors
- **ESLint** (optional): Catch unused variables, invalid patterns (company-wizard does not enforce globally)

### SDK & API Surface

| Package | Version | Purpose | Why |
|---------|---------|---------|-----|
| **@paperclipai/plugin-sdk** | ^1.0.0 | Plugin worker context + UI bridge hooks | The complete public API for Paperclip plugins; published to npm; includes `definePlugin`, event system, state/config management, agent tools, issue/document/agent/goal read-write, and UI bridge |
| **@paperclipai/plugin-sdk/ui** | ^1.0.0 (subpath export) | Frontend hooks + shared components + design tokens | `usePluginData`, `usePluginAction`, `usePluginStream`, `useHostContext`; components like `MetricCard`, `StatusBadge`, `DataTable`, `LogView`, `ActionBar`; Paperclip design tokens |
| **@paperclipai/plugin-sdk/bundlers** | ^1.0.0 (subpath export) | esbuild preset helper function | `createPluginBundlerPresets({ uiEntry: "src/ui/index.tsx" })` generates worker/manifest/ui esbuild configs automatically |
| **@paperclipai/plugin-sdk/testing** | ^1.0.0 (subpath export) | Test harness mock host | `createTestHarness(manifest)` for unit testing; mocks full SDK context |

### Plugin Dependencies

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Lucide Icons** (via company-wizard) | ^0.xxx | SVG icon components | For interview UI, charts, status badges; matches Paperclip design language |
| **Tailwind CSS v4** | (if custom styling needed) | Utility-first CSS framework | Company-wizard uses Tailwind; Compass can inherit preset styles from host or add scoped styles |
| **Zod** (via SDK) | ^3.24.2 | Runtime schema validation | Already a Plugin SDK dependency; use for `instanceConfigSchema` in manifest |
| **React Router** (optional) | ^7.1.5 (Paperclip host version) | Routing within plugin panels | Only if Compass needs multi-panel navigation; host already routes plugins to slots |

**Do NOT bundle React or React-DOM** — Paperclip provides both at runtime. Declare as `peerDependencies` in `package.json` with `optional: true` in meta.

## Distribution & Installation

### npm Package Structure

**`package.json` metadata:**
```json
{
  "name": "@paperclipai/paperclip-plugin-compass",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "paperclipPlugin": {
    "manifest": "./dist/manifest.js",
    "worker": "./dist/worker.js",
    "ui": "./dist/ui/"
  }
}
```

**Delivery:**
1. **npm Registry** (primary): Publish to npmjs.com as `@paperclipai/paperclip-plugin-compass` for automated Paperclip plugin manager discovery
2. **GitHub Releases**: Attach `.tgz` artifacts for direct installation via local path

**Why this structure:**
- Paperclip plugin manager reads `package.json#paperclipPlugin` to locate manifest + worker + UI bundle
- Host validates `manifest.js` exports a `PaperclipPluginManifestV1` object
- UI bundle loaded dynamically from `dist/ui/` as ES modules
- npm distribution is portable across Paperclip instances

### Plugin Manager Installation

**Via npm (recommended for open source):**
```bash
pnpm paperclipai plugin install @paperclipai/paperclip-plugin-compass
```

**Via local path (development):**
```bash
pnpm paperclipai plugin install /absolute/path/to/paperclip-plugin-compass
```

**Format expected by host:**
- Manifest must export `id`, `apiVersion`, `version`, `displayName`, `categories`, `capabilities`, `entrypoints` (worker, ui), and optional `ui.slots`
- Worker must export default `Plugin` object from `definePlugin()`, with optional `setup`, `onHealth`, event handlers
- UI entry must export named components matching declared slot `exportName`s

## Build Configuration

### esbuild.config.mjs (reference implementation)

Use Paperclip's preset builder:

```javascript
import esbuild from "esbuild";
import { createPluginBundlerPresets } from "@paperclipai/plugin-sdk/bundlers";

const presets = createPluginBundlerPresets({ 
  uiEntry: "src/ui/index.tsx"
});
const watch = process.argv.includes("--watch");

const workerCtx = await esbuild.context(presets.esbuild.worker);
const manifestCtx = await esbuild.context(presets.esbuild.manifest);
const uiCtx = await esbuild.context(presets.esbuild.ui);

if (watch) {
  await Promise.all([
    workerCtx.watch(), 
    manifestCtx.watch(), 
    uiCtx.watch()
  ]);
  console.log("esbuild watch mode enabled");
} else {
  await Promise.all([
    workerCtx.rebuild(), 
    manifestCtx.rebuild(), 
    uiCtx.rebuild()
  ]);
  await Promise.all([
    workerCtx.dispose(), 
    manifestCtx.dispose(), 
    uiCtx.dispose()
  ]);
}
```

**Custom plugin support:**
- Raw imports (Tailwind CSS processing, markdown templates): Use `?raw` query imports in esbuild plugin
- PostCSS pipelines: company-wizard uses Tailwind v4; Compass can inherit or extend

### TypeScript Configuration

**Extend Paperclip's base tsconfig (if in same monorepo):**

```json
{
  "extends": "../../../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "lib": ["ES2023", "DOM"],
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

**Standalone (outside Paperclip monorepo):**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "lib": ["ES2022", "DOM"],
    "jsx": "react-jsx",
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["dist", "node_modules"]
}
```

### npm scripts

```json
{
  "scripts": {
    "build": "node ./esbuild.config.mjs",
    "dev": "node ./esbuild.config.mjs --watch",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "prepublishOnly": "npm run build && npm run typecheck && npm run test:run"
  }
}
```

## Plugin Conventions (from company-wizard)

### Manifest Structure

```typescript
// src/manifest.ts
import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

const manifest: PaperclipPluginManifestV1 = {
  id: "paperclip.compass",
  apiVersion: 1,
  version: "1.0.0",
  displayName: "Compass: Strategic Consultant",
  description: "Guide companies through founding, assessment, revival, and repositioning.",
  author: "Paperclip AI + Aron Prins",
  categories: ["automation", "ui"],
  capabilities: [
    "ui.sidebar.register",
    "ui.page.register",
    "companies.read",
    "issues.create",
    "issues.update",
    "issue.comments.create",
    "issue.documents.write",
    "agent.read",
    "goals.read",
    "activity.read",
    "events.subscribe"
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui",
  },
  ui: {
    slots: [
      {
        type: "sidebar",
        id: "compass-sidebar",
        displayName: "Compass",
        exportName: "CompassSidebar"
      },
      {
        type: "page",
        id: "compass-main",
        displayName: "Compass",
        exportName: "CompassMainPage",
        routePath: "compass"
      }
    ]
  }
};

export default manifest;
```

### Worker Entry Structure

```typescript
// src/worker.ts
import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";

const plugin = definePlugin({
  async setup(ctx) {
    ctx.logger.info("Compass plugin initialized");
    
    // Register event subscriptions
    ctx.events.on("company.updated", async (event) => {
      // Handle event
    });
    
    // Register UI data handlers
    ctx.data.register("inventory", async (params) => {
      return { /* inventory snapshot */ };
    });
    
    ctx.data.register("mode-detection", async (params) => {
      return { mode: "found" | "assess" | "revive" | "reposition" };
    });
  },

  async onHealth() {
    return { status: "ok", message: "Compass ready" };
  }
});

export default plugin;
runWorker(plugin, import.meta.url);
```

### UI Entry Structure

```typescript
// src/ui/index.tsx
import React from "react";
import { usePluginData, usePluginAction, useHostContext } from "@paperclipai/plugin-sdk/ui";

export function CompassSidebar() {
  const { companyId } = useHostContext();
  const { data: modeData, loading } = usePluginData("mode-detection", { companyId });

  return (
    <div>
      {loading ? <Spinner /> : <ModeDisplay mode={modeData.mode} />}
    </div>
  );
}

export function CompassMainPage() {
  // Full multi-panel interview experience
  return <InterviewFlow />;
}
```

## Alternatives Considered & Why Not

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| **Build Tool** | esbuild | Webpack / Vite | esbuild is Paperclip standard; faster builds; simpler config; no HMR complexity needed for plugin bundles |
| **Test Runner** | Vitest | Jest / Node --test | Vitest integrates with esbuild/tsconfig; faster startup; Paperclip core uses Vitest |
| **React Version** | 19 (peer) | 18 / 17 | Paperclip host requires >=18; v19 is production-ready 2026; peer dep avoids bundle duplication |
| **CSS Framework** | (None required) | styled-components / emotion | Use host design tokens + Tailwind utility classes from `@paperclipai/plugin-sdk/ui`; no additional CSS-in-JS needed |
| **HTTP Client** | Fetch API (built-in) | axios / got | Fetch + Plugin SDK bridge eliminate need for standalone HTTP; host validates routes |
| **State Management** | Plugin SDK ctx.state | Redux / Zustand | Plugin SDK provides `ctx.state` with scoped namespaces; no middleware needed for plugin-local state |
| **Form Validation** | Zod (already in SDK) | io-ts / yup | SDK bundles Zod; it's the Paperclip standard |
| **Icon Set** | Lucide (company-wizard) | Heroicons / FontAwesome | Lucide matches company-wizard precedent + Paperclip's usage; open source; modern |
| **Linter/Formatter** | None mandated | ESLint + Prettier | Paperclip core does not enforce globally; optional for team contributor experience; company-wizard does not use |

## Peer Dependencies & Bundling Rules

**React/React-DOM:** MUST be peer dependencies, NEVER bundled.

Why:
- Paperclip host already loads React 19 globally
- Bundling React creates conflicts, duplicate instances, broken hooks
- Plugin UI runs as same-origin ES modules, not iframes — shares React context with host
- Keep plugin bundle < 200KB by excluding React

**package.json:**
```json
{
  "peerDependencies": {
    "react": ">=18"
  },
  "peerDependenciesMeta": {
    "react": {
      "optional": true
    }
  }
}
```

**All other dependencies:** Bundle normally (esbuild default). Examples:
- `zod` (already in SDK, but safe to re-export)
- `lucide-react` (bundled, ~50KB gzipped)
- utility libraries

## Plugin API Version & SDK Contract

- **Plugin API Version:** 1 (declared in manifest)
- **Plugin SDK Version:** ^1.0.0 (from npm)
- **Minimum Paperclip Host:** 1.0.0 (plugin API v1 support required)

**Compatibility:**
- SDK 1.x → API version 1
- SDK 2.x (future) → API version 2 with breaking changes
- Host supports multiple API versions simultaneously (v1 plugins work on v2 hosts for 6+ months)

## Installation for Development

```bash
# Install into local Paperclip instance
curl -X POST http://127.0.0.1:3100/api/plugins/install \
  -H "Content-Type: application/json" \
  -d '{"packageName":"/absolute/path/to/paperclip-plugin-compass","isLocalPath":true}'
```

Host watches local-path plugins for file changes → auto-restarts worker on rebuild.

## Distribution Checklist

Before releasing Compass v1.0:

- [ ] `dist/manifest.js` exports `PaperclipPluginManifestV1` (TypeScript-first, esbuild outputs CommonJS)
- [ ] `dist/worker.js` exports default plugin from `definePlugin()` and calls `runWorker()`
- [ ] `dist/ui/index.{ts,tsx}` exports named components for all declared slots
- [ ] `package.json#paperclipPlugin` points to correct paths
- [ ] React is peer dependency, not bundled (esbuild external rule)
- [ ] `npm run build && npm run typecheck && npm run test:run` all pass
- [ ] `npm publish` pushes to `@paperclipai/paperclip-plugin-compass`
- [ ] GitHub release includes `.tgz` artifact for local installs
- [ ] README credits Aron Prins and links to `paperclip-vision` repo

## Sources

- Paperclip Plugin Specification: `/Users/nicholasrhodes/Development/paperclip-temp/doc/plugins/PLUGIN_SPEC.md`
- Paperclip Plugin Authoring Guide: `/Users/nicholasrhodes/Development/paperclip-temp/doc/plugins/PLUGIN_AUTHORING_GUIDE.md`
- Paperclip Core package.json (TypeScript 5.7.3, React 19.0.0, Vitest 3.0.5, Node >=20)
- Plugin SDK 1.0.0 package.json with subpath exports (worker, ui, bundlers, testing)
- Company Wizard reference (esbuild config, manifest shape, preset usage)
- File Viewer 0.4.0 reference (npm distribution, dev workflow, GitHub-based standalone plugin)
- Plugin Hello World example (minimal manifest + worker shape)
- Paperclip root tsconfig.json (ES2022 target, strict mode, ESNext modules)
