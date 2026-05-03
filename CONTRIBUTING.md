# Contributing to Compass

Thank you for your interest in contributing to Compass! This guide walks through the development setup, testing, and PR conventions.

## Local Development Setup

### Prerequisites

- Node.js >= 20
- pnpm >= 9.15.4

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Tr1ckyMag1ca1/paperclip-plugin-compass.git
cd paperclip-plugin-compass
pnpm install
```

### Watch-Mode Development

Start the watch-mode rebuild:

```bash
pnpm dev
```

This runs esbuild in watch mode, rebuilding worker, manifest, and UI bundles as you edit. The Paperclip host will automatically restart the plugin worker on bundle changes.

### Plugin Manager Local-Path Install (Primary Dev Workflow)

Per decision D-05, the primary dev workflow uses Paperclip's plugin manager local-path installation:

```bash
paperclip plugins add file:///path/to/paperclip-plugin-compass
```

Replace `/path/to/paperclip-plugin-compass` with the actual path to your cloned repo. This makes your local changes immediately available to your Paperclip dev instance without publishing to npm.

To update after bundling:

```bash
paperclip plugins reload compass
```

Or uninstall and re-add if the plugin manager doesn't detect the change automatically.

## Testing

### Run Tests

```bash
pnpm test
```

This runs Vitest in interactive mode.

### Run Tests Once (CI mode)

```bash
pnpm test:run
```

Vitest exits after running all tests (useful for CI pipelines).

### Test Fixtures

Per decision D-06, test fixtures use the Plugin SDK mock host only (`@paperclipai/plugin-sdk/testing` `createTestHarness`). Define fixture companies for the four mode states (founded / healthy / stalled / repositioning) in test setup. No real Paperclip dependency for CI.

Example:

```typescript
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import manifest from "../src/manifest";

const harness = createTestHarness(manifest);

// Define fixture data for your test
harness.state.set("fixture-company", {
  mode: "Assess",
  agentCount: 5,
  visionExists: true,
});
```

## Type Checking

```bash
pnpm typecheck
```

This runs the TypeScript compiler in no-emit mode. Must pass before submitting a PR.

## Build & Verification

```bash
pnpm build
```

Bundles worker, manifest, and UI. Outputs to `dist/` directory.

Verify the build:

```bash
test -f dist/manifest.js && test -f dist/worker.js && echo "Build OK"
```

## Pull Request Conventions

### Commit Message Format

Compass follows **Conventional Commits** (per decision XC-10, D-14):

```
type(scope): subject

optional body
```

**Types:**

- `feat` — new feature, endpoint, component
- `fix` — bug fix, error correction
- `test` — test-only changes
- `refactor` — code cleanup, no behavior change
- `perf` — performance improvement
- `docs` — documentation only
- `style` — formatting, whitespace
- `chore` — config, tooling, dependencies

**Scope:** Phase + plan (e.g., `01-01`, `02-03`) or subsystem name.

**Examples:**

```
feat(01-01): add SDK adapter chokepoint for XC-01

All Paperclip SDK calls now route through src/sdk/adapter.ts
to enforce no-direct-Postgres rule.
```

```
fix(schema-validator): catch undefined agent.last_heartbeat_at

Previously threw on agents with null heartbeat; now handles gracefully.
```

### PR Template

When opening a pull request, fill in:

- **Description:** What this PR does and why
- **Test plan:** How to verify the changes work
- **Verification:** Commands to run (e.g., `pnpm test`, `pnpm typecheck`)

## Code Style

- **TypeScript strict mode required** (per SKEL-07, D-08)
- No linting enforced globally, but encouraged for consistency
- Use descriptive variable names
- Keep functions focused (single responsibility)
- Comment non-obvious logic

## Architecture

All Paperclip SDK calls must route through `src/sdk/adapter.ts` (decision D-19, XC-01). This prevents direct Postgres access, enforces SDK-only usage, and establishes a single point for auth/logging.

Mode detection lives in `src/primitives/mode-detect.ts` as pure functions (decision D-20). This makes logic testable without I/O.

See `DECISIONS.md` for full architectural decisions.

## Questions?

- Open an issue on GitHub
- Check `SCHEMA.md` for Paperclip schema assumptions
- Review `DECISIONS.md` for architectural context
- Contact maintainers in `CODEOWNERS`

Thank you for contributing!
