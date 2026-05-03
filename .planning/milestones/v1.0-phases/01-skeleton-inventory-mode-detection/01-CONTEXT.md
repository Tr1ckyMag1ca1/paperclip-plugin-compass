# Phase 1: Skeleton + Inventory + Mode Detection - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers a Paperclip plugin that loads cleanly into a local Paperclip dev instance, registers a "Compass" sidebar entry, and renders a read-only diagnostic dashboard. The dashboard runs three operations on the active company: an **inventory snapshot** (DB + filesystem + git via Plugin SDK), **deterministic hard-rules mode detection** (Found / Assess / Revive / Reposition), and a **mode override surface** the founder can use to override the detection. **Zero writes occur to Paperclip in Phase 1** (INV-05, XC-06). The plugin must be installable via npm AND via the Paperclip plugin manager (https://docs.paperclip.ing/#/administration/plugins/plugins).

24 v1 requirements covered: SKEL-01..12, INV-01..07, MODE-01..04, XC-01, XC-06.

</domain>

<decisions>
## Implementation Decisions

### Chassis Bootstrap
- **D-01:** Bootstrap with `create-paperclip-plugin` scaffolder (Paperclip's official scaffolder in `~/Development/paperclip-temp/packages/plugins/create-paperclip-plugin/`), then selectively port company-wizard patterns (preset library, module system, AI/manual toggle, inline file editing, provisioning) as needed in later milestones. Modern, SDK-aligned, easier upgrade story.
- **D-02:** Credit yesterday-ai (company-wizard) prominently in README. Open a GitHub issue against `yesterday-ai/paperclip-plugin-company-wizard` thanking maintainers and linking to compass repo (per PROMPT instructions).

### Inventory Snapshot UX
- **D-03:** Mode banner at top (e.g., "Assess mode — healthy company") with override dropdown. Below: collapsible sections for Agents, Documents, Recent Activity, VISION status. Founder scans top-down, drills as needed.
- **D-04:** Inventory fetches on plugin open. Manual "Refresh" button to re-fetch. No auto-polling. Predictable SDK call cost.

### Local Dev Workflow
- **D-05:** Document Plugin Manager local-path install as the primary dev workflow in CONTRIBUTING.md. `pnpm dev` in compass repo runs watch-mode rebuild; Paperclip auto-restarts the plugin worker on bundle change. Closest to production install path.
- **D-06:** Test fixtures use the Plugin SDK mock host only (`@paperclipai/plugin-sdk/testing` `createTestHarness`). Define fixture companies for the four mode states (founded / healthy / stalled / repositioning) in test setup. No real Paperclip dependency for CI.

### Chat Panel Scope (M1)
- **D-07:** Ship the chat input UI shell in M1 with the lightweight keyword classifier (MODE-04) wired to route freeform text to the detected mode. **No conversation responses in M1** — modes activate response handling in M2-M5. Lets us validate routing logic in M1 before any mode owns the chat.

### Schema Validation
- **D-08:** On plugin load, run an SDK smoke query against each table Compass touches (`agents`, `issues`, `issue_comments`, `documents`, `issue_documents`, `agent_wakeup_requests`, `approvals`, `routines`). Surface a clear error to the founder if any query fails. Plus declare a compatible Paperclip SDK version range in `package.json` `peerDependencies`. Fast, fails clearly if Paperclip schema drifted.

### Mode Override Persistence
- **D-09:** In M1, sticky override is stored in **Plugin SDK worker-state** (host-persisted, per-plugin-instance, per-company). This preserves M1's read-only-against-Paperclip-DB rule. M6 migrates the override to the engagement-memory document when memory infra ships. Founder doesn't re-pick override every session.

### Two-Maintainer Governance Docs (all land in M1)
- **D-10:** README.md — credits Aron Prins prominently, cites company-wizard, links to vision-quest origin
- **D-11:** LICENSE — MIT
- **D-12:** CODEOWNERS — routes PRs to founder + Aron (placeholder for Aron's GitHub handle until co-maintainership confirmed)
- **D-13:** DECISIONS.md — decision log for two-maintainer alignment, seeded with Phase-1 decisions captured here
- **D-14:** CONTRIBUTING.md — local dev setup (per D-05), test commands (per D-06), PR conventions, Conventional Commits
- **D-15:** SCHEMA.md — documents Paperclip schema assumptions Compass depends on (SKEL-12 deliverable)
- **D-16:** GitHub issue + PR templates — basic bug / feature-request issue templates + PR template referencing CONTRIBUTING

### Sidebar Entry Visual Identity
- **D-17:** Sidebar entry uses a compass-rose icon (Lucide `compass` or Paperclip's icon-set equivalent) with label "Compass". Locked in M1 manifest. Easy to swap later.
- **D-18:** Plugin name "Compass" confirmed for M1. PROMPT notes founder may rename pre-v1.0; rename is cheap if it happens.

### Cross-Cutting (load-bearing in M1)
- **D-19:** All Paperclip access in M1 routes through a single `src/sdk/adapter.ts` chokepoint (XC-01). Even read-only operations go through it — establishes the architectural rule before M2 starts writing.
- **D-20:** Mode detection lives in `src/primitives/mode-detect.ts` as pure functions taking `InventorySnapshot` and returning `Mode`. No I/O. Easily unit-testable.
- **D-21:** Inventory snapshot is exposed to mode controllers as a typed payload (`InventorySnapshot` interface) — not re-queried per mode (INV-07).

### Claude's Discretion
- React component file layout inside `src/ui/` (Claude picks structure during planning; constraint: chat panel + manual panel + inline-preview placeholder must be distinct components)
- Test file naming + colocation pattern (Claude picks; constraint: Vitest + mock-host harness)
- esbuild config knobs not covered by `@paperclipai/plugin-sdk/bundlers` presets (Claude picks defaults)
- Error rendering style for schema validation failures (Claude picks; constraint: founder-readable, not stack-trace dump)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning artifacts
- `.planning/PROJECT.md` — project context, requirements, decisions, constraints
- `.planning/REQUIREMENTS.md` — 67 v1 requirements with traceability to phases
- `.planning/ROADMAP.md` — 6-phase structure with success criteria
- `.planning/STATE.md` — project memory and current focus
- `PROMPT.md` — original build spec (architecture diagram, Paperclip schema cheatsheet, "Don't do" list, milestone acceptance criteria)
- `COLLAB.md` — Aron Prins co-maintainership outreach context

### Research outputs
- `.planning/research/SUMMARY.md` — synthesis of all research
- `.planning/research/STACK.md` — TS 5.7.3 + React 19 (peer) + esbuild via `@paperclipai/plugin-sdk/bundlers` + Vitest 3.0.5; React must NOT be bundled
- `.planning/research/FEATURES.md` — table stakes vs differentiators vs anti-features per mode
- `.planning/research/ARCHITECTURE.md` — three-layer plugin pattern (manifest + worker + UI), SDK adapter chokepoint, mode controllers as thin orchestrators
- `.planning/research/PITFALLS.md` — BLOCKER pitfalls (wakeup duplication, dual-path misrouting, approval bypass, schema coupling) and HIGH-priority pitfalls (production-VPS blast radius, engagement memory rot, cascade side effects)

### Paperclip core (read-only references for plugin authoring)
- `~/Development/paperclip-temp/doc/adapter-plugin.md` — adapter + plugin spec
- `~/Development/paperclip-temp/doc/plugins/PLUGIN_SPEC.md` — plugin manifest, worker, UI contract; install process; capability model
- `~/Development/paperclip-temp/doc/plugins/PLUGIN_AUTHORING_GUIDE.md` — authoring patterns, bundler presets, testing harness
- `~/Development/paperclip-temp/packages/plugins/sdk/` — Plugin SDK source (types, adapter API, bundler presets, testing harness)
- `~/Development/paperclip-temp/packages/plugins/create-paperclip-plugin/` — official scaffolder (Compass bootstraps from this per D-01)
- `~/Development/paperclip-temp/packages/plugins/examples/plugin-hello-world-example/` — minimal reference plugin
- `~/Development/paperclip-temp/packages/plugins/examples/plugin-kitchen-sink-example/` — full SDK feature-set reference
- `~/Development/paperclip-temp/packages/plugins/examples/plugin-file-browser-example/` — SDK pattern for reading filesystem state
- `~/Development/paperclip-temp/ui/src/plugins/` — host UI plugin integration layer (sidebar registration, panel mounting)

### Working external plugin reference (Compass's nearest analog)
- `~/Development/Paperclip/plugin-file-viewer/package.json` — package shape for a published Paperclip plugin
- `~/Development/Paperclip/plugin-file-viewer/esbuild.config.mjs` — build config example
- `~/Development/Paperclip/plugin-file-viewer/tsconfig.json` — TS config (extends Paperclip base)
- `~/Development/Paperclip/plugin-file-viewer/CLAUDE.md` — any plugin-author notes

### Paperclip plugin manager (install path Compass must work in)
- https://docs.paperclip.ing/#/administration/plugins/plugins — plugin manager install / registration / lifecycle

### Chassis source (patterns to selectively port in later milestones)
- https://github.com/yesterday-ai/paperclip-plugin-company-wizard — plugin chassis we credit and pull patterns from

### Vision-quest content origin (relevant from M2 onward; included for orientation)
- https://github.com/aronprins/paperclip-vision/blob/main/SKILL.md — strategic interview structure
- https://github.com/aronprins/paperclip-vision/tree/main/references — VISION.md template, Amendment Protocol

### Paperclip ecosystem (operational context, not direct dependencies)
- `~/Development/paperclip-manifest/README.md` — Manifest LLM routing setup (live across all 45 founder agents — Compass should not assume any specific model)

</canonical_refs>

<code_context>
## Existing Code Insights

Compass repo is empty (only PROMPT.md, README.md, COLLAB.md, .planning/, CLAUDE.md). All references below are to nearby Paperclip code Compass will study.

### Reusable Assets (from paperclip-temp + plugin-file-viewer)
- **`@paperclipai/plugin-sdk/bundlers`** — esbuild preset helpers; auto-generate worker/manifest/UI configs. Compass uses these directly per D-01 — no custom esbuild config beyond what the presets need.
- **`@paperclipai/plugin-sdk/testing` `createTestHarness`** — mock host for Vitest. Compass uses this exclusively for tests (D-06).
- **Plugin SDK worker-state API** — host-persisted per-plugin-instance state. Compass uses this in M1 for mode-override persistence (D-09).
- **`create-paperclip-plugin` scaffolder** — generates the manifest + worker + UI three-layer skeleton (D-01).
- **Lucide icon set (or Paperclip's icon equivalent)** — sidebar icon (D-17). Confirm during planning which icon set Paperclip ships.

### Established Patterns
- **Three-layer plugin** — manifest + worker (data-plane) + UI (React) — proven by file-viewer and kitchen-sink example. Compass adopts wholesale.
- **Plugin SDK only for all DB/agent/issue/document access** — no direct Postgres, no raw HTTP. Compass enforces this via the single `src/sdk/adapter.ts` chokepoint (D-19, XC-01).
- **TypeScript strict mode + tsconfig extends Paperclip base** — all first-party plugins follow; Compass matches (SKEL-07).
- **React as peer dep, never bundled** — Paperclip host loads React 19 globally; bundling breaks hooks + creates conflicts (SKEL-05; from STACK.md research).
- **Conventional Commits** — used across Paperclip ecosystem; Compass adopts (XC-10, D-14).

### Integration Points
- **Sidebar registration** — via plugin manifest entry; Paperclip host UI mounts the entry per `~/Development/paperclip-temp/ui/src/plugins/` patterns.
- **Plugin manager install path** — both npm registry (`@paperclipai/paperclip-plugin-compass`) and local-filesystem-path (used by D-05 dev workflow) per `https://docs.paperclip.ing/#/administration/plugins/plugins`.
- **SDK adapter chokepoint** — `src/sdk/adapter.ts` is the single edge between Compass and Paperclip. Phase 2+ writes flow through here; Phase 1 only reads, but the file ships in M1 to enforce the rule architecturally.

</code_context>

<specifics>
## Specific Ideas

- Mode banner copy must be founder-readable, not "MODE_DETECTED=ASSESS" engineer-speak. E.g., "Assess mode — your company is healthy. Compass can audit drift since the last review."
- Override dropdown should label modes by what they do, not what they are: "Run a fresh audit" / "Get unstuck" / "Pivot strategy" / "Found a new company".
- Schema validation error UX should tell the founder which Paperclip version Compass expects vs what it found, with a one-line "what to do" (e.g., "Update Compass: `paperclip plugins update compass`").
- Plugin manager registration discoverability is open — confirm during planning whether Paperclip plugin registry has a curated list or accepts arbitrary npm packages.

</specifics>

<deferred>
## Deferred Ideas

Captured during discussion but belong in later milestones — do not act on in Phase 1.

- **Sticky override migration to engagement-memory document** — M6 work (per D-09)
- **PR upstream contribution loop with company-wizard** — interesting but adds maintenance overhead; not committed for v1
- **Auto-refresh / live polling for inventory** — option rejected for M1 (D-04); could revisit if founders ask
- **zod-based runtime type-check on every SDK return** — option rejected for M1 (D-08); revisit if smoke query proves insufficient
- **Custom SVG sidebar icon** — D-17 ships with Lucide compass; could replace with branded asset later (M2+ polish)
- **Final plugin name change** — confirm rename window before v1.0 launch (D-18)

</deferred>

---

*Phase: 1-Skeleton + Inventory + Mode Detection*
*Context gathered: 2026-05-02*
