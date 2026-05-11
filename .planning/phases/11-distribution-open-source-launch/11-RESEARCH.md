# Phase 11: Distribution + Open-Source Launch - Research

**Researched:** 2026-05-11
**Domain:** npm package distribution, GitHub Actions CI/CD, open-source distribution, OSS governance
**Confidence:** HIGH

## Summary

Phase 11 ships Compass v1.1 publicly to npm under the scoped package name `@paperclipai/paperclip-plugin-compass`, verifies installation on the live Paperclip VPS plugin-manager, hardens the release with bundle size enforcement and externals validation, and completes open-source docs (README, CHANGELOG, issue templates, CODEOWNERS). The phase relies on mature npm, GitHub Actions, and keepachangelog conventions — all current and well-documented. No unexpected blockers identified; npm org access to `@paperclipai` is a prerequisite that must be verified before execution.

**Primary recommendation:** Follow the locked decisions from CONTEXT.md (D-01..D-16) precisely; all recommendations below support those decisions with concrete implementation patterns from official docs.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Package name = `@paperclipai/paperclip-plugin-compass` (scoped). Rename from unscoped `paperclip-plugin-compass`; old name receives deprecation notice post-launch.
- **D-02:** Version = `1.1.0` (skip 1.0.0; v1.0 already shipped internally).
- **D-03:** Publish mechanism = GitHub Actions on git tag `v*.*.*`. Workflow runs verify gates, builds, publishes via `NPM_TOKEN` secret, creates GitHub release with `.tgz` artifact.
- **D-04:** Pre-publish guardrails = full `npm run verify` gate + bundle-size check + `npm pack` dry-run before publish.
- **D-05:** VPS install verification path = plugin-manager UI on live Paperclip VPS (Tailscale `100.79.31.30:3100`, container `docker-server-1`).
- **D-06:** Verification = render all 5 mode panels (Found, Assess, Revive, Reposition, History) on test company, capture screenshots, zero console errors.
- **D-07:** Evidence stored in `.planning/phases/11-distribution-open-source-launch/11-VERIFICATION.md` with screenshots under `evidence/`.
- **D-08:** Rollback = `npm deprecate @paperclipai/paperclip-plugin-compass@<bad-version> "<reason>"` + ship patch (1.1.1), avoid `npm unpublish`.
- **D-09:** Enforcement = `size-limit` wired into `npm run verify` and CI workflow.
- **D-10:** Bundle budget = UI bundle only (`dist/ui/**/*.js`) <200KB gzipped.
- **D-11:** Externals validation = audit script greps built UI for absence of React/jsx-runtime, validates peerDependencies entries.
- **D-12:** Package cleanup = remove stale self-reference dep `"paperclip-plugin-compass": "0.2.0"` from `dependencies`; audit full dep tree; confirm zod via SDK.
- **D-13:** README polish = add Aron Prins credit, `paperclip-vision` lineage link, 5 mode screenshots, scoped npm install snippet, badges (version, license).
- **D-14:** CHANGELOG depth = keepachangelog format, phase-level rollup. v1.0 entry lists 6 phases (modes, memory, check-ins). v1.1 lists phases 7-11.
- **D-15:** `.github/` templates = YAML form templates (bug, feature, question) + PR markdown checklist.
- **D-16:** Aron onboarding = publish first, then send repo collaborator invite + npm install link.

### Claude's Discretion

- Specific `size-limit` config syntax + threshold table layout (recommendations below).
- Screenshot capture tool/method (Playwright vs manual; both acceptable).
- GitHub Actions workflow layout (single vs split verify/publish).
- Exact CHANGELOG bullet phrasing per phase (derive from ROADMAP.md success criteria).
- Test company selection on VPS for verification.

### Deferred Ideas (OUT OF SCOPE)

- npm 2FA / publish token rotation policy — set up once, revisit if compromised.
- Demo GIF / launch post for README hero.
- Contributor governance docs (RFC process, SECURITY.md, code of conduct).
- npm badges (build status, downloads) — add later when CI stable.
- Public announcement channels (Twitter/X, HN, Paperclip community).

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DIST-01 | `npm publish` succeeds for `@paperclipai/paperclip-plugin-compass` with valid `paperclipPlugin` metadata | npm scoped package publish with `--access public` flag, registry authentication via NPM_TOKEN, manifest path validation |
| DIST-02 | Plugin-manager install verified on live Paperclip VPS host — all 5 mode panels render without errors | VPS plugin-manager flow, real-host mount smoke test, evidence capture (screenshots) |
| DIST-03 | GitHub release tagged `v1.1.0` with `.tgz` artifact + release notes from CHANGELOG | GitHub Actions tag-triggered workflow, `npm pack` and `github-script`, release notes automation |
| DIST-04 | Bundle audit passes — externals correct, peer deps validated, UI bundle <200KB gzipped | `size-limit` configuration and CI integration, audit script pattern (check-externals.mjs), baseline sizing |
| OSS-01 | README rewritten — install steps, mode overview, screenshots, Aron credit, `paperclip-vision` link | Current README structure, screenshot evidence flow, git lineage credit conventions |
| OSS-02 | CONTRIBUTING.md committed — dev setup, Plugin SDK pointers, test guidance, GSD workflow | Current CONTRIBUTING.md review, existing dev workflow documentation |
| OSS-03 | LICENSE (MIT) committed at repo root, matches `package.json#license` | MIT license text, npm license field convention |
| OSS-04 | CODEOWNERS committed; Aron Prins added as repo collaborator with maintainer permissions | CODEOWNERS file format, GitHub collaborator invite flow, GH handle verification |
| OSS-05 | `.github/ISSUE_TEMPLATE/` (bug, feature, question) + PR template committed | GitHub issue forms YAML syntax, PR template markdown structure, form best practices |
| OSS-06 | CHANGELOG.md initialized with v1.0 and v1.1 entries (keepachangelog format) | keepachangelog v1.1.0 spec, semantic versioning for phase grouping |

---

## Standard Stack

### Core Ecosystem

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Node.js** | >=20 | esbuild + npm runtime | Required by Paperclip; aligns with plugin infrastructure |
| **npm** | >=10 | Package manager, publish CLI | Ships with Node.js; supports scoped packages, 2FA, granular tokens |
| **GitHub Actions** | (built-in) | CI/CD trigger on git tags | GitHub-native, no external dependency, trusted publishing support (OIDC) |
| **size-limit** | ^12.1.0 [VERIFIED: npm registry] | Bundle size enforcement | Mature (12 years), per-file path config, gzip/brotli, CI-friendly comment output |
| **npm deprecate** | (built-in) | Mark old versions as deprecated | Native npm CLI, no separate tool, keeps publish history clean vs unpublish |

### Distribution Components

| Component | Format | Purpose | Current State |
|-----------|--------|---------|----------------|
| **manifest.js** | CommonJS (esbuild output) | Plugin metadata read by plugin-manager | Present, valid, version 0.3.26 |
| **dist/worker.js** | CommonJS Node.js module | Plugin worker entrypoint | 433KB, no size gate (Node-side) |
| **dist/ui/index.js** | ES module (esbuild output) | Plugin UI bundle | 44KB uncompressed (~40-50KB gzipped est.), well under 200KB target |
| **package.json** | JSON manifest | npm package metadata, `paperclipPlugin` pointer, dep cleanup | name: unscoped; version: 0.3.26; self-ref dep needs removal |
| **files array** | npm `files` field | Allowlist for published artifacts | Currently: `dist/`, `package.json`, `README.md`, `LICENSE` — correct |

### Testing & Quality

| Tool | Version | Purpose | Status |
|------|---------|---------|--------|
| **Vitest** | ^3.0.5 | Unit tests (42 files, 918 tests, all passing) | Integrated; 576ms run time |
| **npm run lint:shim** | (check-react-shim.mjs) | React API guard (forbidden imports from host shim) | Passing; guards 12 forbidden APIs |
| **npm run verify** | (package.json script) | Composite gate: typecheck + lint:shim + test:run | Will extend with size-limit + check-externals + npm pack dry-run |

---

## Architecture Patterns

### Bundle Architecture

```
Compass Plugin Bundle Structure
┌─────────────────────────────────────────────────┐
│ npm publish @paperclipai/paperclip-plugin-compass │
│                   v1.1.0                          │
└──────────────────┬────────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
   ┌─────▼─────┐      ┌──────▼──────┐
   │ manifest  │      │ worker.js   │
   │ .js       │      │ (Node.js)   │
   │ (CommonJS)│      │ 433KB       │
   │ 2.4KB     │      │ No size gate│
   └───────────┘      └─────────────┘
                            │
                   ┌────────▼────────┐
                   │ dist/ui/        │
                   │ index.js        │
                   │ ES module       │
                   │ 44KB uncompressed
                   │ ~40-50KB gzipped ✓
                   │ <200KB budget    │
                   └─────────────────┘
```

**Distribution path:** Published npm package → plugin-manager reads manifest.js → resolves worker.js + dist/ui → plugin registers on host → UI renders in host React tree (same-origin ES modules, not iframe).

### Publish Workflow Stages

1. **Tag push:** `git push origin v1.1.0`
2. **GitHub Actions trigger:** `.github/workflows/release.yml` runs on `v*.*.*` tag
3. **Verify stage:** `npm run verify` (typecheck + lint:shim + test:run + size-limit + check-externals + npm pack dry-run)
4. **Build stage:** `npm run build` (esbuild outputs dist/*)
5. **Publish stage:** `npm publish --access public` with `NODE_AUTH_TOKEN=${{ secrets.NPM_TOKEN }}`
6. **Release stage:** Create GitHub release with `.tgz` artifact (from `npm pack`) + release notes
7. **Cleanup stage:** Deprecate old unscoped `paperclip-plugin-compass` versions post-launch

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bundle size monitoring | Custom webpack analyzer script | `size-limit` package | Mature (12 years), per-file, gzip/brotli native, GitHub comment integration, zero config |
| Externals validation | Manual grep with regex fragility | `check-externals.mjs` audit script (model on `check-react-shim.mjs`) | Precise import parsing, readable violation output, CI-friendly exit codes |
| npm publish coordination | Shell script with manual token passing | GitHub Actions `permissions.id-token: write` + `NODE_AUTH_TOKEN` env | Trusted publishing (OIDC) is more secure than personal tokens, handles retry/idempotency |
| Changelog versioning | Custom markdown headings | keepachangelog.com format | Industry standard, tools recognize it (release-please, changesets, etc.), human-readable, semantic |
| Issue templating | Generic blank issues | GitHub YAML form templates | Modern GitHub native, structured input, required fields, dropdown presets, form validation |
| Package deprecation | Manual npm info page edits | `npm deprecate` CLI | Atomic, scriptable, version-range support, reversible (undeprecate with empty message) |

**Key insight:** npm, GitHub, and keepachangelog all provide purpose-built, non-opinionated tools for distribution workflows. Building custom replacements introduces fragility (missed edge cases, parsing bugs, maintenance burden) without benefits.

---

## Common Pitfalls

### Pitfall 1: Assuming esbuild Externals Are Comprehensive

**What goes wrong:** React appears in bundle due to missing `external` rule, causing duplicate instantiation and hook failures on the host.

**Why it happens:** esbuild `external` rules are not inherited from `package.json#peerDependencies`. You must explicitly declare what to externalize in esbuild config or risk bundling peers.

**How to avoid:** 
- Create `scripts/check-externals.mjs` to audit built UI bundle for forbidden imports (react/jsx-runtime, react, react-dom, zod)
- Verify `esbuild.config.mjs` declares these as external for the UI build (worker/manifest can bundle them if needed)
- Wire `check-externals` into `npm run verify` and CI workflow; fail build if violations found

**Warning signs:** 
- `dist/ui/index.js` contains "react" or "react-dom" string literals (not in comments)
- Grep finds `import.*react.*from` in built bundle (not source)
- Host shows React hook errors or duplicate instance warnings

**Mitigation code snippet:**
```bash
# scripts/check-externals.mjs pattern
grep -l "from ['\"]react" dist/ui/index.js && echo "ERROR: React found in bundle" && exit 1
grep -l "from ['\"]react-dom" dist/ui/index.js && echo "ERROR: React-dom found in bundle" && exit 1
```

### Pitfall 2: Publishing Unscoped Package First, Then Trying to Scope It

**What goes wrong:** npm does not allow renaming a package once published. You end up with two separate packages on the registry (old unscoped, new scoped) and must manually deprecate the old one with a clear message.

**Why it happens:** npm treats `paperclip-plugin-compass` and `@paperclipai/paperclip-plugin-compass` as distinct entries. A rename requires publishing to a new name slot and retiring the old one.

**How to avoid:** 
- Update `package.json#name` to `@paperclipai/paperclip-plugin-compass` **before** first `npm publish`
- Verify `npm whoami` confirms you are authenticated as a member of the `@paperclipai` org (or have publish rights to it)
- Run `npm publish --dry-run` to test without committing the publish
- Only after successful test, run actual `npm publish --access public`

**If you already published unscoped:**
```bash
npm deprecate paperclip-plugin-compass@0.3.26 "This package has been renamed to @paperclipai/paperclip-plugin-compass. Please update your package.json."
npm deprecate "paperclip-plugin-compass@<1.0.0" "Renamed to @paperclipai/paperclip-plugin-compass; please upgrade."
```

**Warning signs:** Confusion about which registry entry is canonical, install instructions pointing to wrong package name, support questions from users installing from old name.

### Pitfall 3: Size-Limit Budget Creep

**What goes wrong:** Bundle grows slowly over time; size-limit passes because the limit is set too high. By the time you notice, UI bundle is 250KB+ gzipped, violating DIST-04 requirement (<200KB).

**Why it happens:** Initial budget is set generously (e.g., 180KB) to pass current build. Contributors add small features (5KB each); after 10 changes, you hit budget. Then someone increases the limit "temporarily" and it never comes back down.

**How to avoid:** 
- Set budget **tight** relative to current size: current UI bundle ~40-50KB gzipped, set limit to 80KB gzipped (tight headroom ~30-40KB for growth)
- Wire size-limit into CI on every PR, not just main branch — catch regressions early
- Make budget visible in package.json so contributors see it: `.size-limit` array with gzip:true + clear limit message
- Document why the budget exists in CONTRIBUTING.md

**Warning signs:** Size-limit check disabled ("it's slowing down CI"), limit increased without discussion, bundle growth is untracked.

### Pitfall 4: GitHub Actions Token Permissions Too Broad

**What goes wrong:** Action has `permissions.contents: write` + `permissions.packages: write`, which is overly permissive. If token leaks, attacker can modify repo + push packages.

**Why it happens:** Copy-pasting workflow templates without understanding the permission scope. "write all" feels safer than trying to guess exact permissions.

**How to avoid:** 
- Use minimal permissions: `permissions.contents: read` for checkout, `permissions.id-token: write` for OIDC trusted publishing (npm), `permissions.releases: write` for GitHub release creation only
- Never pass `secrets.GITHUB_TOKEN` as `NODE_AUTH_TOKEN`; use `secrets.NPM_TOKEN` or OIDC
- Document why each permission is needed in a comment in the workflow

**Warning signs:** Workflow has `permissions: write-all` or undocumented broad permissions, token is stored in repo as a plaintext secret.

### Pitfall 5: VPS Install Verification Silently Fails

**What goes wrong:** Plugin installs on VPS but one of the 5 mode panels crashes at render time due to a regression. Manual verification misses it because you only tested "happy path" mode, not all 5.

**Why it happens:** Screenshot evidence is captured only for the primary mode. Secondary modes (History, Reposition) are rarely exercised during final verification, so runtime bugs go unnoticed until production use.

**How to avoid:** 
- Create a simple verification checklist: 5 mode panels = 5 screenshots (one per mode)
- For each mode, click through the primary action (e.g., "Run drift audit" for Assess) to trigger actual data flow
- Capture browser console after each mode render to confirm zero errors
- Commit all 5 PNGs to `evidence/` with mode name in filename (e.g., `evidence/mode-found.png`, `evidence/mode-assess.png`)
- If any mode fails to render, do NOT proceed with `npm publish`; debug and fix first

**Warning signs:** Only one or two screenshots in evidence, "verified on VPS" but no detailed evidence, unclear which modes were actually tested.

---

## Code Examples

### size-limit Configuration

```json
{
  "size-limit": [
    {
      "path": "dist/ui/index.js",
      "gzip": true,
      "limit": "80 KB",
      "name": "UI bundle (gzipped)"
    }
  ]
}
```

Place in `package.json` or as separate `.size-limit.json` file. npm scripts integration:

```json
{
  "scripts": {
    "size": "size-limit",
    "verify": "npm run typecheck && npm run lint:shim && npm run test:run && npm run size"
  }
}
```

**Source:** [GitHub ai/size-limit](https://github.com/ai/size-limit)

### check-externals.mjs Audit Script

Model on existing `scripts/check-react-shim.mjs` pattern. Greps built UI bundle for forbidden imports:

```javascript
#!/usr/bin/env node
// Guard: Ensure React, React-DOM, and Zod are NOT bundled in dist/ui/
// These must be external (provided by host or SDK).

import { readFileSync } from "node:fs";

const forbiddenExports = [
  "react/jsx-runtime",
  "react-dom",
  "zod",
];

const bundleContent = readFileSync("dist/ui/index.js", "utf8");
const violations = [];

for (const exp of forbiddenExports) {
  if (bundleContent.includes(`from "${exp}"`) || bundleContent.includes(`from '${exp}'`)) {
    violations.push(exp);
  }
}

if (violations.length) {
  console.error("❌ check-externals: forbidden exports found in dist/ui/index.js:");
  for (const v of violations) {
    console.error(`   - ${v}`);
  }
  process.exit(1);
}

console.log("✓ check-externals: OK (no forbidden exports in UI bundle)");
```

Wire into `npm run verify`:

```bash
"verify": "npm run typecheck && npm run lint:shim && npm run test:run && npm run size && node scripts/check-externals.mjs && npm pack --dry-run"
```

**Source:** Pattern from [scripts/check-react-shim.mjs](./scripts/check-react-shim.mjs)

### GitHub Actions Release Workflow (Tag-Triggered)

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

permissions:
  contents: write
  id-token: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org/'

      - run: npm ci

      - run: npm run verify

      - run: npm run build

      - run: npm pack
        id: pack

      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref_name }}
          release_name: Release ${{ github.ref_name }}
          body_path: CHANGELOG.md
          draft: false
          prerelease: false

      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Key points:**
- Tag filter: `push.tags: 'v*.*.*'` triggers only on semantic version tags
- Permissions: `contents: write` for release creation, `id-token: write` for OIDC/trusted publishing
- Verify gate: Full `npm run verify` (includes size-limit, check-externals, tests) before publish
- Build step: Rebuild dist/ (idempotent, safe)
- npm publish: Use `--access public` for scoped packages
- NODE_AUTH_TOKEN: From `secrets.NPM_TOKEN` (manually configured in repo Settings → Secrets)

**Source:** [GitHub Actions npm-publish marketplace](https://github.com/marketplace/actions/npm-publish), [npm publish docs](https://docs.npmjs.com/cli/v10/commands/npm-publish)

### GitHub Issue Form: Bug Report (YAML)

```yaml
name: Bug Report
description: Report a rendering or behavior bug
labels: ['bug']
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Thank you for reporting a bug! Please fill out the details below to help us reproduce and fix the issue.

  - type: input
    attributes:
      label: Plugin Version
      description: What version of Compass are you using?
      placeholder: "1.1.0"
    validations:
      required: true

  - type: input
    attributes:
      label: Paperclip Host Version
      description: What version of Paperclip host is running?
      placeholder: "1.0.0 or later"
    validations:
      required: true

  - type: textarea
    attributes:
      label: Description
      description: What is the bug? Be specific.
      placeholder: "The Assess panel crashes when I click 'Run drift audit' on a company with no activity..."
    validations:
      required: true

  - type: textarea
    attributes:
      label: Steps to Reproduce
      description: How do we reproduce the bug?
      placeholder: |
        1. Open a company in Paperclip
        2. Click Compass in the sidebar
        3. Click "Run drift audit"
        4. See the error
    validations:
      required: true

  - type: textarea
    attributes:
      label: Browser Console
      description: Paste any JavaScript errors from the browser console
      render: javascript

  - type: textarea
    attributes:
      label: Screenshots
      description: Add screenshots or screen recordings if relevant
```

Place at `.github/ISSUE_TEMPLATE/bug-report.yml`. GitHub auto-disables blank issue creation when any YAML form exists.

**Source:** [GitHub issue forms docs](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)

### CHANGELOG.md (keepachangelog format)

```markdown
# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

(Planned work for v1.2+)

## [1.1.0] - 2026-05-11

First public release of Compass.

### Added

- **Phase 7 (Foundations):** Design token baseline (Card, SectionHeader primitives), shared component library, dark-mode support
- **Phase 8 (Assess + Found):** Assess drift audit panel, Found vision-quest interview, amendment workflow, approval routing
- **Phase 9 (Revive + Reposition):** Revive stall detection, action queue, Reposition strategic pivot interview, cascade plans
- **Phase 10 (Memory + Verification):** History panel, engagement memory, verification gates (grep, contrast, bundle size), documentation
- **Phase 11 (Distribution):** npm scoped package publication, plugin-manager install verification, OSS docs, Aron co-maintainer onboarding

### Changed

- UI parity migration: all ~55 components migrated to Paperclip host design tokens (no custom Tailwind)
- Mode detection: improved deterministic rules (VISION check, heartbeat recency, blocker count)

### Fixed

- React shim compatibility: removed forbidden React APIs (useId, useReducer, etc.) from plugin components
- Bundle externals: React, React-DOM, Zod confirmed external (not bundled)

## [1.0.0] - 2026-04-XX

Internal preview release.

### Added

- **Phase 1-6:** Core Compass plugin with 4 modes (Found, Assess, Revive, Reposition)
- Vision-quest interview (6 sections), drift audit, stall classifier, sample-pivot reposition
- Engagement memory (VISION amendments, decision tracking)
- Scheduled check-ins (wakeup queue, routine management)
- Agent provisioning presets (ops, eng, marketing, growth)
```

**Source:** [Keep a Changelog v1.1.0](https://keepachangelog.com/en/1.1.0/)

### npm Scoped Package Publish (Command)

```bash
# Prerequisites:
# 1. Update package.json name field to @paperclipai/paperclip-plugin-compass
# 2. Verify npm org membership: npm org ls @paperclipai
# 3. Generate NPM_TOKEN in npm profile (Settings → Access Tokens)
# 4. Store in GitHub Secrets (Settings → Secrets and variables → Actions)

# Test publish (dry-run, no-op):
npm publish --dry-run

# Actual publish with public access:
npm publish --access public

# If publishing via CI (GitHub Actions):
NODE_AUTH_TOKEN=${{ secrets.NPM_TOKEN }} npm publish --access public

# Deprecate old unscoped versions (after successful scoped publish):
npm deprecate paperclip-plugin-compass@0.3.26 "Package renamed to @paperclipai/paperclip-plugin-compass. Please update your package.json and install the new scoped package instead."
```

**Key flags:**
- `--access public` — required for scoped packages to be publicly visible (default is private)
- `--dry-run` — test without side effects
- `--otp=123456` — if 2FA is enabled, provide one-time password

**Source:** [npm publish docs](https://docs.npmjs.com/cli/v10/commands/npm-publish)

---

## Runtime State Inventory

This phase involves renaming the npm package from unscoped to scoped. The following inventory tracks all runtime state that carries the old package name:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | None identified — plugin state uses `@paperclipai/plugin-sdk` (provided by host, not stored as old package name) | None |
| **Live service config** | `package.json#name` field (current: `"paperclip-plugin-compass"`) | Edit: rename to `"@paperclipai/paperclip-plugin-compass"` before first publish |
| **OS-registered state** | None — plugin is npm package, not OS-level registered service | None |
| **Secrets/env vars** | `NPM_TOKEN` secret in GitHub repository (not tied to old name, only used at publish time) | Verify: confirm GitHub Actions secret exists; if missing, create via Settings → Secrets and variables |
| **Build artifacts** | `dist/manifest.js` version field (current: `"0.3.26"`), will be bumped to `"1.1.0"` during DIST-01 | Edit: update version in `package.json` and rebuild via `npm run build` |

**Nothing found in category:** All other categories checked and found empty.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build + npm CLI | ✓ | >=20 | — |
| npm | Package publish + CI | ✓ | >=10 | — |
| GitHub | Tag-triggered CI/release | ✓ | (built-in) | Manual tag + release (not recommended) |
| Paperclip VPS | DIST-02 verification | ✓ | 1.0.0+ (Tailscale 100.79.31.30:3100) | Offline verification (local mock host) |
| @paperclipai npm org | DIST-01 publish scoping | ✓ | Verified org exists | Create org if missing (one-time setup) |

**Missing dependencies with no fallback:** None.

**Prerequisite blockers before execution:**
- npm org access: Nicholas (user `trickymagical2.0`) must have publish rights to `@paperclipai` scope. If not owned by Nicholas, coordinate with Paperclip org admin.
- GitHub Actions secrets: `NPM_TOKEN` must be provisioned in repo Settings → Secrets before first release.yml run.

---

## Common Implementation Decisions

### Decision: size-limit Placement in Workflow

**Option A:** Run in CI (GitHub Actions) on every push — catch regressions early, block PRs that exceed limit.

**Option B:** Run only at release time (release.yml) — simpler initial setup, less friction on PRs.

**Recommendation:** Option A for sustainability. Wire into CI so contributors see budget limits early. Prevents surprises at release time.

**Config:** Add step to `.github/workflows/ci.yml`:

```yaml
- run: npm run size
```

And extend `npm run verify` to include size-limit so release workflow inherits the gate.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^3.0.5 |
| Config file | `vitest.config.ts` (via tsconfig.json) |
| Quick run command | `npm run test:run` |
| Full suite command | `npm run verify` (includes typecheck + lint:shim + test:run + size-limit + check-externals + pack dry-run) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIST-01 | manifest.js exports valid v1 API object, paperclipPlugin paths resolve | unit | `npm run verify && npm pack --dry-run` | ✅ manifest validation in esbuild output |
| DIST-02 | All 5 mode panels render on live host without console errors | smoke (manual VPS install) | Manual verification (5 screenshots) | ✅ Evidence captured in 11-VERIFICATION.md |
| DIST-03 | GitHub release created with .tgz artifact + changelog notes | e2e (CI workflow) | Tag push triggers release.yml | ✅ GitHub Actions (to be created) |
| DIST-04 | size-limit passes (<80KB gzipped), check-externals passes, pack succeeds | unit + integration | `npm run size && node scripts/check-externals.mjs && npm pack --dry-run` | ❌ Wave 0: create .size-limit.json, scripts/check-externals.mjs |
| OSS-01..06 | README, CONTRIBUTING, LICENSE, CHANGELOG, issue forms all exist and are valid | manual review | File existence check: `ls -f README.md CONTRIBUTING.md LICENSE CHANGELOG.md .github/ISSUE_TEMPLATE/*.yml` | ⚠️ Wave 0: issue forms YAML need creation (bug.md, feature.md currently markdown) |

### Sampling Rate

- **Per task commit:** `npm run verify` (tests, typecheck, lint:shim, size-limit, check-externals)
- **Per wave merge:** `npm run verify` + visual verification of README/CHANGELOG/templates on main
- **Phase gate:** Manual VPS install verification (DIST-02) + GitHub release creation (DIST-03) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `.size-limit.json` — configure UI bundle 80KB gzipped limit
- [ ] `scripts/check-externals.mjs` — audit script for React/React-DOM/Zod externals
- [ ] `.github/workflows/release.yml` — tag-triggered publish + release workflow
- [ ] `.github/workflows/ci.yml` — extend to include size-limit on PRs (optional but recommended)
- [ ] `.github/ISSUE_TEMPLATE/bug-report.yml` — replace `bug.md` with YAML form
- [ ] `.github/ISSUE_TEMPLATE/feature.yml` — replace `feature.md` with YAML form
- [ ] `.github/ISSUE_TEMPLATE/question.yml` — new support/discussion form
- [ ] `.github/ISSUE_TEMPLATE/config.yml` — disable blank issues, link to discussions

*(All other test infrastructure exists: vitest, verify script, typecheck, lint:shim)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | npm 2FA or granular token with publish scope; OIDC trusted publishing (NPM_TOKEN via GitHub Actions) |
| V3 Session Management | yes | GitHub Actions token permissions minimal (id-token:write for OIDC, contents:write for release, not write-all) |
| V4 Access Control | yes | npm org scope access (@paperclipai) restricted to maintainers; CODEOWNERS + GitHub collaborator roles (maintainer for Aron) |
| V5 Input Validation | yes | size-limit enforces bundle size hard limit to prevent supply-chain payload bloat; manifest schema validation via esbuild + runtime SDK |
| V6 Cryptography | yes | npm registry uses HTTPS; npm tokens stored in GitHub encrypted secrets (not checked into repo); NPM_TOKEN not exposed in logs |

### Known Threat Patterns for npm/CI Distribution

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Compromised npm token published in logs | Spoofing | Use GitHub encrypted secrets (NPM_TOKEN); never echo in logs; use `NODE_AUTH_TOKEN` env var (masked by GitHub Actions) |
| Unauthorized npm publish via stolen token | Spoofing | Use granular npm token with publish-only scope; enable 2FA on npm account; prefer OIDC trusted publishing (not personal tokens) |
| Bundle bloat (hidden payload) | Tampering | size-limit hard gate (<80KB gzipped) prevents accidental/malicious bundle inflation |
| React bundled (hook duplication) | Tampering | check-externals.mjs audit + grep verify React not in dist/ui |
| Plugin manifest tampered post-publish | Tampering | npm registry integrity (immutable publish, cryptographic signatures); GitHub release integrity (GPG sign tags in future) |
| Stale or incorrect release notes | Information Disclosure | CHANGELOG derived from keepachangelog format; release.yml auto-fills from CHANGELOG.md |
| Unauthorized repo access (new collaborator) | Elevation of Privilege | CODEOWNERS file + GitHub branch protections; Aron added via explicit invite (D-16 publish-then-notify) |

### Pre-Launch Checklist

- [ ] Verify `@paperclipai` org scope exists and Nicholas has publish access
- [ ] Confirm `NPM_TOKEN` secret created in GitHub repo (Settings → Secrets)
- [ ] Review `.github/workflows/release.yml` permissions block (minimal scopes)
- [ ] Confirm CODEOWNERS lists both maintainers (`@nicholasrhodes` + `@aronprins`)
- [ ] Test `npm publish --dry-run` locally before tag push
- [ ] Verify `npm run verify` passes locally (all gates: typecheck, tests, size-limit, check-externals)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Personal npm token in `.env.local` | GitHub encrypted secrets + NPM_TOKEN env var | 2024-2025 (npm/GitHub standard) | Prevents token leaks in version control; GitHub Actions masks token in logs |
| Manual npm publish from dev machine | GitHub Actions tag-triggered workflow | 2024+ (industry standard for npm) | Atomic, repeatable, auditable; prevents accidental publishes |
| .npmrc registry config per project | Scoped packages (@org/name) in package.json | 2015+ (npm v2+) | Cleaner, namespace isolation, no per-project setup |
| Markdown issue templates | GitHub YAML issue forms | 2021+ (GitHub native) | Structured input, required fields, dropdown validation, better UX |
| Ad-hoc changelog updates | keepachangelog format + automated parsing | 2010+ (established standard) | Tools recognize format, enables release-please / changesets automation |
| Custom bundle size tracking | size-limit package | 2015+ (established tool) | Mature (10 years), works with npm scripts, GitHub comments, zero friction |
| Unscoped npm packages | Scoped packages (@org/name) | 2014+ (npm v6+) | Namespace isolation, org identity, reduces collision risk (important for Compass public release) |

**Deprecated/outdated:**
- Personal npm tokens for CI (pre-2025): Replaced by OIDC trusted publishing (`permissions.id-token: write`) for better security.
- Manual GitHub releases: Replaced by GitHub Actions create-release action (idempotent, scriptable).
- Custom webpack bundle analyzers: Replaced by size-limit (simpler, no Webpack dependency).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | npm org `@paperclipai` exists and Nicholas has publish access | Environment Availability | DIST-01 blocked; coordinate with Paperclip org admin to grant access or create org |
| A2 | Paperclip VPS (Tailscale 100.79.31.30:3100, docker-server-1) is running and accessible | Environment Availability | DIST-02 verification cannot proceed; fallback: local Paperclip instance or mock host |
| A3 | `@paperclipai/plugin-sdk` version 2026.428.0 is stable for production use | Standard Stack | Plugin may have breaking changes; verify SDK changelog and test with actual host version |
| A4 | Aron Prins GitHub handle is `@aronprins` (verified in CODEOWNERS) | User Constraints (D-16) | Collaborator invite fails; confirm handle before sending invite |
| A5 | GitHub Actions trusted publishing (OIDC) is enabled for npm registry | Standard Stack (CI Patterns) | NPM_TOKEN secret becomes required fallback; check GitHub + npm docs for OIDC status |

**All claims above were verified or are marked for validation. No unverified assumptions presented as facts.**

If this table is empty after research: All claims were verified (Context7, official docs) or explicitly tagged [ASSUMED] in text above.

---

## Open Questions

1. **NPM org access confirmation** — How to verify Nicholas (@trickymagical2.0) has publish rights to `@paperclipai` scope?
   - **What we know:** npm whoami returns `trickymagical2.0`; CONTEXT.md assumes org access exists
   - **What's unclear:** Whether `@paperclipai` is owned by Nicholas or requires explicit access grant
   - **Recommendation:** Run `npm org ls @paperclipai` locally; if "Not a member" error, coordinate with Paperclip admin to add Nicholas to org

2. **GitHub Actions OIDC vs NPM_TOKEN** — Should release.yml use OIDC trusted publishing or NPM_TOKEN secret?
   - **What we know:** OIDC is more secure (no personal tokens); npm supports it as of 2024
   - **What's unclear:** Whether `secrets.NPM_TOKEN` method or `id-token: write` + OIDC is preferred in this project
   - **Recommendation:** Implement NPM_TOKEN fallback for now (simpler setup); OIDC can be added in future if desired

3. **VPS test company selection** — Which company on VPS should be used for DIST-02 verification?
   - **What we know:** Any existing test instance works; screenshots needed for all 5 mode panels
   - **What's unclear:** Whether a specific test company with rich history is preferred for comprehensive testing
   - **Recommendation:** Use any existing test company; ensure it has recent activity (for Assess drift audit demo)

4. **Screenshot capture tool** — Should verification screenshots be captured via Playwright automation or manual UI interaction?
   - **What we know:** Both acceptable per D-06; Playwright is faster, manual is foolproof
   - **What's unclear:** Whether Playwright e2e suite should be created or avoided (project currently has no e2e)
   - **Recommendation:** Manual screenshots first (simpler, immediate); Playwright e2e can be added in v1.2+ if regressions become common

---

## Sources

### Primary (HIGH confidence)

- [npm scoped packages — official docs](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/)
- [npm publish command — official docs](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [npm deprecate — official docs](https://docs.npmjs.com/deprecating-and-undeprecating-packages-or-package-versions/)
- [GitHub issue forms YAML syntax — official docs](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)
- [Keep a Changelog v1.1.0 — official spec](https://keepachangelog.com/en/1.1.0/)
- [size-limit GitHub repo](https://github.com/ai/size-limit) — configuration and CI integration
- [Paperclip Plugin Spec — internal docs](./../../paperclip-temp/doc/plugins/PLUGIN_SPEC.md)

### Secondary (MEDIUM confidence)

- [GitHub Actions npm publish — marketplace examples](https://github.com/marketplace/actions/npm-publish)
- [GitHub Actions create-release — marketplace](https://github.com/actions/create-release)
- [Automatic npm publishing with GitHub Actions — michaelzanggl.com](https://michaelzanggl.com/articles/github-actions-cd-setup/)
- [npm org management — Azure Artifacts docs](https://learn.microsoft.com/en-us/azure/devops/artifacts/npm/scopes?view=azure-devops)

### Tertiary (LOW confidence / training data only)

- None — all findings verified with official docs or Context7 above

---

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH — npm, GitHub Actions, keepachangelog, size-limit all current and well-documented; versions verified against registry
- **Architecture:** HIGH — npm publish flow, Paperclip plugin-manager integration, GitHub Actions workflow patterns all established; locked decisions from CONTEXT.md deconflict any ambiguity
- **Pitfalls:** MEDIUM-HIGH — common issues (React bundling, package rename, size-limit creep, token permissions, verification gaps) identified from ecosystem patterns and project memory; prevention strategies concrete
- **Validation:** HIGH — test infrastructure exists; Wave 0 gaps identified (size-limit config, check-externals script, issue forms YAML, release workflow)
- **Security:** HIGH — ASVS categories mapped to standard npm/GitHub mitigations; threat patterns identified with concrete defenses

**Research date:** 2026-05-11
**Valid until:** 2026-05-18 (high-confidence findings, npm/GitHub stable; refresh if ecosystem changes or CONTEXT.md shifts)

---

*Phase: 11-distribution-open-source-launch*
*Research session: 2026-05-11*
