<!-- GSD:project-start source:PROJECT.md -->
## Project

**Compass — Paperclip Plugin**

Compass is a Paperclip plugin that acts as a strategic consultant for any Paperclip-hosted AI company at any lifecycle stage. It founds new companies, audits existing ones, revives stalled ones, and repositions mature ones — all from inside Paperclip's plugin sidebar with no separate Claude Code session, SSH, or shell scripting required. It combines the plugin chassis from `yesterday-ai/paperclip-plugin-company-wizard` with the strategic-interview depth of `aronprins/paperclip-vision`, ported into a single in-app surface for Paperclip founders.

**Core Value:** Founders get one in-app surface for strategic + operational guidance across the full company lifecycle, with every change written natively into Paperclip (documents, agents, issues, comments, wakeups) — no founder-side tooling roundtrip.

### Constraints

- **Tech stack**: TypeScript + React, matching company-wizard conventions and Paperclip plugin standard
- **API surface**: Paperclip Plugin SDK only — no direct Postgres, no raw HTTP REST, no filesystem writes outside the SDK envelope
- **Distribution**: Must work as both npm public package AND Paperclip plugin-manager install (per https://docs.paperclip.ing/#/administration/plugins/plugins)
- **Audience**: Open-source community — broader UX, docs, contribution guidelines required (not a single-tenant tool)
- **Mode detection**: Hard deterministic rules — VISION exists? heartbeats recent? blockers piling? Predictable, debuggable, no LLM tax for classification
- **Drift window**: 30-day lookback for Assess mode (default; not user-configurable in v1)
- **Vision-quest interview**: Full 6-section depth (no condensed mode in v1)
- **Approval routing**: Per-company config — `founder` (default) | `founder+ceo` | configurable
- **Memory storage**: `documents` table only — no new schema migrations to Paperclip core
- **Safety**: Never auto-edit VISION.md without explicit founder confirmation gate, even within Apply step
- **License**: MIT
- **Co-maintainership**: README credits + repo structure assume Aron Prins joins as second maintainer
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

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
- `dist/worker.js` — plugin worker entrypoint (Node.js/esbuild output)
- `dist/manifest.js` — exported manifest object (CommonJS, esbuild output)
- `dist/ui/` — React bundle directory for plugin UI (ES module bundle, esbuild output)
### Testing & Quality
| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| **Vitest** | ^3.0.5 | Unit tests (mode detection, drift logic, schema parsing) | Paperclip standard test runner; compatible with Playwright for E2E |
| **@paperclipai/plugin-test-harness** | ^1.0.0 (from SDK) | Mock Paperclip host for plugin logic testing | Test `getData`/`performAction` handlers, event subscriptions, state writes without a real instance |
| **Node --test** | (built-in) | Logic tests for non-TypeScript utilities | Optional fallback for pure JS; rarely needed in typed codebase |
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
## Distribution & Installation
### npm Package Structure
- Paperclip plugin manager reads `package.json#paperclipPlugin` to locate manifest + worker + UI bundle
- Host validates `manifest.js` exports a `PaperclipPluginManifestV1` object
- UI bundle loaded dynamically from `dist/ui/` as ES modules
- npm distribution is portable across Paperclip instances
### Plugin Manager Installation
- Manifest must export `id`, `apiVersion`, `version`, `displayName`, `categories`, `capabilities`, `entrypoints` (worker, ui), and optional `ui.slots`
- Worker must export default `Plugin` object from `definePlugin()`, with optional `setup`, `onHealth`, event handlers
- UI entry must export named components matching declared slot `exportName`s
## Build Configuration
### esbuild.config.mjs (reference implementation)
- Raw imports (Tailwind CSS processing, markdown templates): Use `?raw` query imports in esbuild plugin
- PostCSS pipelines: company-wizard uses Tailwind v4; Compass can inherit or extend
### TypeScript Configuration
### npm scripts
## Plugin Conventions (from company-wizard)
### Manifest Structure
### Worker Entry Structure
### UI Entry Structure
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
- Paperclip host already loads React 19 globally
- Bundling React creates conflicts, duplicate instances, broken hooks
- Plugin UI runs as same-origin ES modules, not iframes — shares React context with host
- Keep plugin bundle < 200KB by excluding React
- `zod` (already in SDK, but safe to re-export)
- `lucide-react` (bundled, ~50KB gzipped)
- utility libraries
## Plugin API Version & SDK Contract
- **Plugin API Version:** 1 (declared in manifest)
- **Plugin SDK Version:** ^1.0.0 (from npm)
- **Minimum Paperclip Host:** 1.0.0 (plugin API v1 support required)
- SDK 1.x → API version 1
- SDK 2.x (future) → API version 2 with breaking changes
- Host supports multiple API versions simultaneously (v1 plugins work on v2 hosts for 6+ months)
## Installation for Development
# Install into local Paperclip instance
## Distribution Checklist
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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
