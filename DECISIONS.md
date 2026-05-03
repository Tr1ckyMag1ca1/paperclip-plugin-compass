# Decision Log

This document tracks architectural and implementation decisions for Compass. Decisions are logged by phase and carry rationale for future maintainers.

## Phase 1: Skeleton + Inventory + Mode Detection

### D-01: Bootstrap with create-paperclip-plugin scaffolder

**Decision:** Use Paperclip's official `create-paperclip-plugin` scaffolder as the bootstrap point, then selectively port company-wizard patterns (preset library, module system, AI/manual toggle, inline file editing, provisioning) as needed in later milestones.

**Rationale:** Modern, SDK-aligned, easier upgrade story than forking company-wizard wholesale.

---

### D-02: Credit yesterday-ai and open upstream issue

**Decision:** Credit yesterday-ai (company-wizard) prominently in README. Open a GitHub issue against `yesterday-ai/paperclip-plugin-company-wizard` thanking maintainers and linking to compass repo.

**Rationale:** Proper attribution to source code we're building on; establishes relationship with upstream maintainers.

---

### D-03: Mode banner + collapsible inventory sections

**Decision:** Mode banner at top (e.g., "Assess mode — healthy company") with override dropdown. Below: collapsible sections for Agents, Documents, Recent Activity, VISION status. Founder scans top-down, drills as needed.

**Rationale:** Founder-centric UX; mode is the primary decision point; details drill-down on demand.

---

### D-04: Inventory fetches on open, manual refresh only

**Decision:** Inventory fetches on plugin open. Manual "Refresh" button to re-fetch. No auto-polling. Predictable SDK call cost.

**Rationale:** Reduces unnecessary SDK calls; founder controls when data is fresh; predictable load on Paperclip host.

---

### D-05: Local dev workflow via plugin manager local-path install

**Decision:** Document Plugin Manager local-path install as the primary dev workflow in CONTRIBUTING.md. `pnpm dev` in compass repo runs watch-mode rebuild; Paperclip auto-restarts the plugin worker on bundle change.

**Rationale:** Closest to production install path; minimizes setup friction; no separate tooling needed.

---

### D-06: Test fixtures use mock host only

**Decision:** Test fixtures use the Plugin SDK mock host only (`@paperclipai/plugin-sdk/testing` `createTestHarness`). Define fixture companies for the four mode states (founded / healthy / stalled / repositioning) in test setup. No real Paperclip dependency for CI.

**Rationale:** Fast, isolated tests; no DB dependency; aligns with SDK testing patterns.

---

### D-07: Chat input shell with keyword classifier routing (no responses in M1)

**Decision:** Ship the chat input UI shell in M1 with the lightweight keyword classifier (MODE-04) wired to route freeform text to the detected mode. **No conversation responses in M1** — modes activate response handling in M2-M5. Lets us validate routing logic in M1 before any mode owns the chat.

**Rationale:** Validates core routing pattern early; defers response complexity to mode-specific implementations; reduces M1 scope.

---

### D-08: Schema validation smoke query on plugin startup

**Decision:** On plugin load, run an SDK smoke query against each table Compass touches (`agents`, `issues`, `issue_comments`, `documents`, `issue_documents`, `agent_wakeup_requests`, `approvals`, `routines`). Surface a clear error to the founder if any query fails. Plus declare a compatible Paperclip SDK version range in `package.json` `peerDependencies`.

**Rationale:** Fast, fails clearly if Paperclip schema drifted; prevents cryptic runtime errors later; founder sees actionable message.

---

### D-09: Mode override persistence in worker-state (migrate to engagement-memory in M6)

**Decision:** In M1, sticky override is stored in **Plugin SDK worker-state** (host-persisted, per-plugin-instance, per-company). This preserves M1's read-only-against-Paperclip-DB rule. M6 migrates the override to the engagement-memory document when memory infra ships.

**Rationale:** Avoids DB writes in read-only Phase 1; leverages SDK's native persistence mechanism; simplifies M6 migration (move state → doc).

---

### D-10: README credits prominent + links

**Decision:** README.md credits Aron Prins prominently, cites company-wizard, links to vision-quest origin.

**Rationale:** Proper attribution; attracts co-maintainer interest; acknowledges source traditions.

---

### D-11: MIT License

**Decision:** Project is MIT licensed.

**Rationale:** Matches company-wizard and ecosystem preference; permissive, widely adopted.

---

### D-12: CODEOWNERS routes to two maintainers

**Decision:** CODEOWNERS file routes all PRs to founder + Aron Prins (placeholder for Aron's GitHub handle until co-maintainership confirmed).

**Rationale:** Establishes two-maintainer governance from day one; ensures review coverage.

---

### D-13: DECISIONS.md seeded with Phase 1 decisions

**Decision:** DECISIONS.md logs all Phase 1 decisions (D-01 through D-21) for two-maintainer alignment.

**Rationale:** Explicit decision history aids future debugging; second maintainer stays oriented.

---

### D-14: CONTRIBUTING.md + Conventional Commits

**Decision:** CONTRIBUTING.md documents local dev setup (per D-05), test commands (per D-06), PR conventions using Conventional Commits format.

**Rationale:** Clear contributor onboarding; aligns with Paperclip ecosystem practice.

---

### D-15: SCHEMA.md documents Paperclip schema assumptions

**Decision:** SCHEMA.md documents Paperclip schema assumptions Compass depends on: agents table (id, role, status, last_heartbeat_at, adapter_config), issues, documents, approvals, agent_wakeup_requests, routines. Lists required fields in each table. Notes minimum SDK version.

**Rationale:** Future-proofs against schema drift; aids debugging if plugin fails on new Paperclip version.

---

### D-16: GitHub issue + PR templates

**Decision:** GitHub issue templates (bug, feature request) + pull request template reference CONTRIBUTING.md (Conventional Commits, test requirements).

**Rationale:** Standardizes contributor submissions; reduces friction for external PRs.

---

### D-17: Sidebar icon is compass-rose (Lucide compass)

**Decision:** Sidebar entry uses a compass-rose icon (Lucide `compass` or Paperclip's icon-set equivalent) with label "Compass". Locked in M1 manifest.

**Rationale:** Visually distinct; matches sidebar entry pattern; easy to swap later if branded asset emerges.

---

### D-18: Plugin name "Compass" confirmed for M1

**Decision:** Plugin name "Compass" confirmed. PROMPT notes founder may rename pre-v1.0; rename is cheap if it happens.

**Rationale:** Clear, memorable name; aligns with strategic consultant positioning; not over-committed.

---

### D-19: SDK adapter chokepoint (XC-01)

**Decision:** All Paperclip access in M1 routes through a single `src/sdk/adapter.ts` chokepoint (XC-01). Even read-only operations go through it — establishes the architectural rule before M2 starts writing.

**Rationale:** Enforces SDK-only rule architecturally; prevents accidental direct Postgres or raw HTTP calls; single point for auth/logging; simplifies M2+ writes.

---

### D-20: Mode detection as pure functions in src/primitives/mode-detect.ts

**Decision:** Mode detection lives in `src/primitives/mode-detect.ts` as pure functions taking `InventorySnapshot` and returning `Mode`. No I/O. Easily unit-testable.

**Rationale:** Decouples detection logic from UI/SDK; highly testable; matches pure-function pattern from company-wizard.

---

### D-21: Inventory snapshot as typed payload (not re-queried per mode)

**Decision:** Inventory snapshot is exposed to mode controllers as a typed payload (`InventorySnapshot` interface) — not re-queried per mode (INV-07).

**Rationale:** Reduces SDK call cost; ensures all modes see consistent snapshot; simplifies mode logic.

---

**Last updated:** 2026-05-03 (Phase 1 Plan Execution)
