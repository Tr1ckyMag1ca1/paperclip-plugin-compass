# Phase 9: Revive + Reposition Panels — Context

**Status:** Ready for /gsd-plan-phase
**Depends on:** Phase 8 (complete)

<domain>
## Phase Boundary

Migrate Revive (~10 components) and Reposition (~10 components) mode panels to host shadcn tokens. Match the Phase 8 pattern: Tailwind-native spacing, semantic palette, sharp corners, dark-mode parity.

In scope:
- Revive: RevivePanel, ActionItemCard, PriorityBadge, StallSummaryBadge, ActionQueuePanel, ActionConfirmationModal, SamplePivotModal.
- Reposition: RepositionPanel, RepositionInterviewFlow, IntentEntry, ScopeConfirmation, CascadeReviewPanel.
- Token swaps per UI_REDO_HANDOFF.md migration map.
- Severity / priority → class map refactor (mirror UIA-02 pattern).

Out of scope:
- Memory / History panel (Phase 10).
- Behavior changes — reskin only.
- New dependencies, plugin Tailwind config, CSS-in-JS.
</domain>

<verification_gate>
## Verification Gate (MUST PASS before marking phase complete)

Phase 8 verify was static-only (grep + file existence) and missed three live-runtime bugs (PluginPageProps contract, useId shim crash, getInventory secret leak — all post-ship hotfixes 2026-05-10). Phase 9 verify expands scope:

### 1. Static checks (existing pattern)
- `npm run typecheck` — clean
- `npm run test:run` — all passing
- Grep: zero broken token references in `src/ui/revive/` and `src/ui/reposition/` (gap-xs/sm/md/lg, px-md, py-sm, rounded-lg/xl, light-only colors)
- Severity → class maps are static const records, not template literals

### 2. React shim guard (NEW — required)
- `npm run lint:shim` — 0 forbidden React imports across `src/`
- Forbidden list (host shim does not export): `useId`, `useReducer`, `useLayoutEffect`, `useImperativeHandle`, `useDebugValue`, `useDeferredValue`, `useTransition`, `useSyncExternalStore`, `useInsertionEffect`, `useActionState`, `useOptimistic`, `useFormStatus`
- Source: `scripts/check-react-shim.mjs`
- Why: importing any of these throws SyntaxError at module load, breaks entire UI registration, falls back to host placeholder. Static reskin verify cannot detect this.

### 3. Live host mount smoke test (NEW — required per panel)
For each migrated panel, mount in real Paperclip host and verify:
- Plugin page renders panel content (NOT host placeholder `<displayName>: <displayName>`)
- Panel receives `{context}` prop per `PluginPageProps`; companyId path works AND no-companyId path renders explicit message
- Browser console shows no `[plugin-loader] Failed to load UI module` errors
- Light + dark mode visual parity with host shell (screenshot diff)

Mount procedure:
- VPS: `ssh paperclip-vps` → container `docker-server-1`, port 3100
- Test companies: ALE (`086b697e-072a-42ca-80ee-f3712fa63704`), BUS (`824f2949-2c77-48ff-92fb-fdf84f9c5c4a`)
- Upgrade: `POST /api/plugins/:pluginId/upgrade` with `{version}` (admin session). Sleep ~15s for npm propagation.
- DB caveat: host `lifecycle.upgrade` silently freezes `plugins.version` row — workaround: SQL `UPDATE plugins SET version=..., manifest_json=...` after upgrade.
- Verify with browser DevTools console + screenshots (`/browse` skill).

### 4. Plugin SDK payload audit (NEW — required for any new bridge handler)
- Any `getX` handler returning data from `ctx.agents.list()`, `ctx.issues.list()`, `ctx.documents.list()` MUST sanitize via explicit allowlist before crossing the UI bridge.
- Forbidden fields: `adapterConfig.env` (LLM API keys, DATABASE_URL), `assigneeAdapterOverrides`, `executionWorkspaceSettings`.
- Reference: `src/primitives/inventory.ts` post-0.3.25 sanitization pattern.
- Phase 9 panels mostly read existing data — re-audit any new bridge handler introduced.

### 5. UAT (existing pattern)
- All UIR-* and UIRP-* requirements visually demonstrable in host shell.
</verification_gate>

<known_pitfalls>
## Known Pitfalls (carry from Phase 8 hotfixes)

1. **PluginPageProps contract** — host slot mounts pass `{context}` prop with `companyId`. Panels must read from `props.context` first, fall back to `useHostContext()`. Render explicit message when no companyId; do NOT sit at "Loading..." (text matches bg in dark mode = invisible).

2. **React shim missing hooks** — see verification gate item 2. If a Phase 9 component needs ID generation, mirror `HelpTip.tsx` module-counter + useRef pattern (NOT `useId`).

3. **DB / version sync** — bump BOTH `package.json` and `src/manifest.ts` version on every release. Host writes `manifest.version` to DB, not package.json.

4. **Plugin config save shape** — `{configJson: {...}}`, NOT `{config: {...}}`.
</known_pitfalls>

<references>
- Phase 8 SUMMARY + VERIFICATION: `.planning/phases/08-assess-found-panels/`
- Migration map: `UI_REDO_HANDOFF.md`
- Host token baseline: `~/Development/paperclip-temp/ui/src/index.css`
- Shim guard: `scripts/check-react-shim.mjs`
- Memory: `.claude/projects/.../memory/compass_v033_root_cause.md` (host bugs + workarounds)
</references>
