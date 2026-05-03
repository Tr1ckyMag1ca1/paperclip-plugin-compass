# Phase 1: Skeleton + Inventory + Mode Detection - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-02
**Phase:** 01-Skeleton + Inventory + Mode Detection
**Areas discussed:** Chassis bootstrap, Inventory snapshot UX, Local dev workflow, M1 chat panel scope, Schema validation strictness, Mode override persistence, Two-maintainer governance docs, Sidebar entry visual identity

---

## Chassis Bootstrap

### How do we bootstrap Compass's chassis?

| Option | Description | Selected |
|--------|-------------|----------|
| create-paperclip-plugin scaffolder + port | Use Paperclip's official scaffolder for clean SDK-aligned shell. Then selectively port company-wizard patterns as needed. | ✓ |
| Fork company-wizard wholesale | Clone the wizard repo, rename, strip wizard-specific code. | |
| Hybrid — scaffolder shell + wizard subtree | Scaffolder for chassis; copy wizard's preset/module/provisioning code as a vendored subdirectory. | |

**User's choice:** create-paperclip-plugin scaffolder + port

### Wizard credit + collab

| Option | Description | Selected |
|--------|-------------|----------|
| README credit + GitHub issue | Open issue thanking yesterday-ai + linking to compass repo. README cites company-wizard prominently. | ✓ |
| PR back upstream contributing changes | Anything we improve gets PR'd back to wizard repo. | |
| Silent reuse — just MIT credit in LICENSE | Minimal acknowledgment. | |

**User's choice:** README credit + GitHub issue

---

## Inventory Snapshot UX

### What does the founder see first when Compass opens?

| Option | Description | Selected |
|--------|-------------|----------|
| Mode banner + collapsible sections | Top: detected mode with override dropdown. Below: collapsible sections (Agents, Documents, Recent Activity, VISION status). | ✓ |
| Card grid | Each inventory dimension is a card. | |
| Minimal table + detail-on-click | Single compact table of agents + status; everything else accessed via tabs/links. | |

**User's choice:** Mode banner + collapsible sections

### Inventory data freshness

| Option | Description | Selected |
|--------|-------------|----------|
| Fetch on open, manual refresh button | Inventory loads when plugin opens. Refresh button to re-fetch. No background polling. | ✓ |
| Fetch on open + auto-refresh every 30s | Live-feeling. Costs SDK calls every 30s per open instance. | |
| Fetch on open only, no refresh | Founder closes/reopens to refresh. | |

**User's choice:** Fetch on open, manual refresh button

---

## Local Dev Workflow

### How do devs run Compass against local Paperclip?

| Option | Description | Selected |
|--------|-------------|----------|
| Plugin manager local-path install | Per Paperclip docs: plugin manager accepts absolute filesystem path. `pnpm dev` watch mode rebuilds; Paperclip auto-restarts plugin worker. Closest to prod path. | ✓ |
| npm link into paperclip-temp | Standard Node link pattern. | |
| Both, document both in CONTRIBUTING | Cover both paths. | |

**User's choice:** Plugin manager local-path install

### Test fixtures for inventory

| Option | Description | Selected |
|--------|-------------|----------|
| Mock SDK harness only | Plugin SDK ships `createTestHarness` with mock host. Define fixture companies in test setup. | ✓ |
| Mock harness + optional integration tier against real local Paperclip | Tier 1 = mock (CI). Tier 2 = integration against running paperclip-temp. | |
| Real Paperclip required for all tests | Highest fidelity, slowest. | |

**User's choice:** Mock SDK harness only

---

## M1 Chat Panel Scope

### Chat panel in Phase 1 — what ships?

| Option | Description | Selected |
|--------|-------------|----------|
| Visible shell + mode-routing classifier | Chat input visible, classifier wired to route freeform text to detected mode (MODE-04). No conversation responses yet. | ✓ |
| Placeholder only | Greyed-out 'Coming soon' panel. Defer all chat work to M2+. | |
| Functional with canned responses | Chat replies with hardcoded helpful messages per mode. | |

**User's choice:** Visible shell + mode-routing classifier

---

## Schema Validation Strictness

### How strictly does Compass validate Paperclip schema on plugin load?

| Option | Description | Selected |
|--------|-------------|----------|
| Smoke query + version pin | On load: SDK smoke query for each table Compass touches. Plus declared compatible Paperclip SDK version range in package.json peerDependencies. | ✓ |
| Full runtime type-check via zod | Wrap every SDK return in zod schemas. | |
| Defer until first write — trust Plugin SDK types | Only validate when Compass would actually write. | |

**User's choice:** Smoke query + version pin

---

## Mode Override Persistence

### When founder overrides auto-detected mode, how long does override stick?

| Option | Description | Selected |
|--------|-------------|----------|
| Per-company sticky, plugin-state document | Override saved into engagement-memory document. | ✓ (with M1-read-only resolution below) |
| Session-only | Override resets on plugin reload. | |
| Per-company sticky with auto-reset on state change | Like option 1, but auto-clears if inventory changes mode-relevant signals. | |

**User's choice:** Per-company sticky

### M1 read-only conflict — sticky override = a Paperclip write

| Option | Description | Selected |
|--------|-------------|----------|
| Plugin worker local storage in M1, migrate to Paperclip doc in M6 | M1 keeps override sticky via Plugin SDK worker-state. M6 migrates to engagement-memory doc. | ✓ |
| Session-only in M1, sticky in M3+ | Accept session-only for M1. Sticky lands when first write happens. | |
| Carve M1 read-only exception for override doc | Allow the single override-storage write in M1. | |

**User's choice:** Plugin worker local storage in M1, migrate to Paperclip doc in M6

---

## Two-Maintainer Governance Docs

### Which governance docs land in M1?

| Option | Description | Selected |
|--------|-------------|----------|
| README + LICENSE | Required for public OSS. README credits Aron + cites wizard. MIT LICENSE. | ✓ |
| CODEOWNERS | GitHub CODEOWNERS routing PRs to founder + Aron. | ✓ |
| DECISIONS.md | Decision log for two-maintainer alignment. | ✓ |
| CONTRIBUTING.md | Local dev setup, test commands, PR conventions. | ✓ |

**User's choice:** All four (SCHEMA.md ships regardless via SKEL-12)

### Issue + PR templates in M1?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, basic templates | Bug / feature-request issue templates + PR template. | ✓ |
| Defer to M2+ | Lower polish in M1. | |

**User's choice:** Yes, basic templates

---

## Sidebar Entry Visual Identity

### Sidebar entry icon + label in M1 manifest?

| Option | Description | Selected |
|--------|-------------|----------|
| Compass icon + 'Compass' label | Lucide compass-rose icon (or Paperclip equivalent). Label: 'Compass'. | ✓ |
| Generic icon + 'Compass' label | Placeholder icon (e.g., Lucide Settings). | |
| Custom SVG, founder picks now | Founder provides custom asset. | |

**User's choice:** Compass icon + 'Compass' label

### Plugin name confirmation

| Option | Description | Selected |
|--------|-------------|----------|
| Ship M1 as 'Compass' | Confirmed earlier. Rename pre-v1.0 if founder picks something else. | ✓ |
| Pause M1 to pick final name | Decide name now. | |

**User's choice:** Ship M1 as 'Compass'

---

## Claude's Discretion

- React component file layout inside `src/ui/` (chat panel + manual panel + inline-preview placeholder must be distinct)
- Test file naming + colocation pattern (Vitest + mock-host harness)
- esbuild config knobs not covered by `@paperclipai/plugin-sdk/bundlers` presets
- Error rendering style for schema validation failures (must be founder-readable, not stack-trace dump)

## Deferred Ideas

- Sticky override migration to engagement-memory document (M6 work per D-09)
- PR upstream contribution loop with company-wizard
- Auto-refresh / live polling for inventory (rejected for M1)
- zod-based runtime type-check on every SDK return (rejected for M1)
- Custom branded SVG sidebar icon (M2+ polish)
- Final plugin name change before v1.0 launch
