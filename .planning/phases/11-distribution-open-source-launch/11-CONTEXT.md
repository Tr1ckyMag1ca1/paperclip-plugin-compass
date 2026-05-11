# Phase 11: Distribution + Open-Source Launch - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship Compass v1.1 publicly. Publish to npm under `@paperclipai/paperclip-plugin-compass`, verify install on the live Paperclip VPS plugin-manager, finish OSS docs (CHANGELOG, `.github/` templates, README polish), and complete Aron Prins co-maintainer onboarding.

**In scope:** package rename + scoping, version bump to 1.1.0, CI-driven npm publish on tag, bundle size + externals enforcement, VPS install verification with screenshot evidence, CHANGELOG init, README polish, `.github/` issue/PR YAML form templates, Aron repo collaborator grant + notification.

**Out of scope:** new product features, new mode panels, additional verification gates beyond DIST-04 bundle audit, marketing site, blog/launch posts, expanded contributor governance docs (e.g., RFC process, security policy beyond MIT LICENSE).

</domain>

<decisions>
## Implementation Decisions

### npm Identity + Release Flow
- **D-01:** Package name = `@paperclipai/paperclip-plugin-compass`. Requires npm org access to `@paperclipai` scope; rename current unscoped `paperclip-plugin-compass` and publish as new scoped package. Old unscoped versions stay published but get deprecation notice pointing to new name.
- **D-02:** Version = `1.1.0` (skip 1.0.0). Roadmap target; matches milestone naming; v1.0 already shipped internally so 1.1.0 is the first public release.
- **D-03:** Publish mechanism = GitHub Actions on git tag `v*.*.*`. Workflow runs verify gates, builds, publishes via `NPM_TOKEN` secret, creates GitHub release with `.tgz` artifact attached and release notes derived from CHANGELOG.
- **D-04:** Pre-publish guardrails = full verify gate. Workflow runs `npm run verify` (typecheck + lint:shim + test:run) + bundle-size check + `npm pack` dry-run before `npm publish`. Hard fail blocks the release.

### VPS Install Verification
- **D-05:** Install path = plugin-manager UI install from npm registry on live Paperclip VPS (Tailscale `100.79.31.30:3100`, container `docker-server-1`). Tests the real install path users will follow.
- **D-06:** "Renders without errors end-to-end" = open each of the 5 mode panels (Found, Assess, Revive, Reposition, History) on a real test company, capture screenshot, confirm zero console errors. Mode panel smoke + screenshots scope; not full per-mode UAT walkthrough.
- **D-07:** Evidence stored in `.planning/phases/11-distribution-open-source-launch/11-VERIFICATION.md` with screenshots committed under `evidence/` subdir. Auditable, version-controlled with the phase.
- **D-08:** Rollback policy for post-publish breakage = `npm deprecate @paperclipai/paperclip-plugin-compass@<bad-version>` with reason, then ship patch release (e.g., 1.1.1). Avoid `npm unpublish` to keep history clean and dodge the 72hr policy window.

### Bundle Audit Gate
- **D-09:** Enforcement = `size-limit` package wired into `npm run verify` script and CI workflow. Hard fail blocks publish.
- **D-10:** Budget = UI bundle only (`dist/ui/**/*.js`) <200KB gzipped. Worker is Node-side, no browser-shipping concern, not gated by size-limit.
- **D-11:** Externals validation = audit script greps built UI for absence of `react/jsx-runtime` (and other externalized) symbols + `size-limit` catches accidental bundling via size jump. Script also validates `peerDependencies` entries (`react`, `react-dom`).
- **D-12:** Package cleanup as part of DIST-04 prep: remove stale self-reference dep `"paperclip-plugin-compass": "0.2.0"` from `dependencies`. Full dep audit; confirm `peerDependencies` covers React 18+/19 and `react-dom`; confirm `zod` is consumed via SDK (not bundled separately); confirm `lucide-react` is bundled (not external).

### README / CHANGELOG / .github
- **D-13:** README scope = light polish on existing README.md. Add Aron Prins co-maintainer credit, `paperclip-vision` lineage link, per-mode screenshots (5 PNGs), npm install snippet with scoped package name, badges (npm version, license). Preserve current structure and copy.
- **D-14:** CHANGELOG depth = keepachangelog format, phase-level rollup. v1.0 entry lists each of the 6 phases (mode panels, engagement memory, scheduled check-ins, etc.) as `Added` bullets. v1.1 entry lists UI parity migration phases 7–10 plus distribution phase 11. Readable, not per-requirement exhaustive.
- **D-15:** `.github/` templates = YAML form templates (modern GitHub issue forms). Three issue templates: `bug-report.yml` (with repro steps, plugin version, paperclip-host version fields), `feature.yml` (use case, mode affected), `question.yml` (free-form). PR template stays markdown with checklist.

### Aron Onboarding
- **D-16:** Sequence = publish-then-notify. Ship v1.1.0 first, then send Aron repo collaborator invite + npm install link + paperclip-vision lineage credit. CODEOWNERS already lists `@aronprins` globally (no path scoping); confirm/update GitHub handle before invite.

### Claude's Discretion
- Specific `size-limit` config syntax + threshold table layout — implementer's call.
- Screenshot capture tool/method (Playwright vs manual) — implementer's call; both acceptable as long as PNGs land in `evidence/`.
- GitHub Actions workflow file layout (single workflow vs split verify/publish) — implementer's call.
- Exact CHANGELOG bullet phrasing per phase — derive from ROADMAP.md Success Criteria.
- Test company on VPS for verification — pick any existing test instance or provision one.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `.planning/ROADMAP.md` §"Phase 11: Distribution + Open-Source Launch" — Phase goal, dependencies, requirements DIST-01..04 + OSS-01..06, success criteria.
- `.planning/REQUIREMENTS.md` lines 77–89 — Full requirement text for DIST and OSS items.
- `.planning/PROJECT.md` — Project constraints (MIT, distribution dual-path, Aron co-maintainership).
- `CLAUDE.md` — Project tech stack constraints (TypeScript, esbuild, peer-dep React, Plugin SDK only).

### Repository artifacts to update or create
- `package.json` — rename, version bump, dep cleanup, paperclipPlugin metadata verify.
- `README.md` — polish (Aron credit, screenshots, scoped install snippet, lineage link).
- `CONTRIBUTING.md` — already committed; review for npm-scope mentions only if needed.
- `LICENSE` — already committed (MIT); confirm matches `package.json#license`.
- `CODEOWNERS` — already committed (`* @nicholasrhodes @aronprins`); verify Aron's GH handle is correct.
- `CHANGELOG.md` — CREATE (keepachangelog, phase-level rollup, v1.0 + v1.1).
- `.github/ISSUE_TEMPLATE/bug-report.yml` — CREATE.
- `.github/ISSUE_TEMPLATE/feature.yml` — CREATE.
- `.github/ISSUE_TEMPLATE/question.yml` — CREATE.
- `.github/ISSUE_TEMPLATE/config.yml` — CREATE (disable blank issues, link to discussions if any).
- `.github/PULL_REQUEST_TEMPLATE.md` — CREATE.
- `.github/workflows/release.yml` — CREATE (tag-triggered verify + publish + GH release).
- `.github/workflows/ci.yml` — CREATE or update (per-PR verify + size-limit).
- `scripts/check-externals.mjs` — CREATE (greps built UI for externalized symbols).
- `.size-limit.json` (or `size-limit` in package.json) — CREATE (UI bundle budget).

### External docs
- https://docs.paperclip.ing/#/administration/plugins/plugins — Paperclip plugin-manager install flow.
- https://keepachangelog.com/en/1.1.0/ — CHANGELOG format spec.
- https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms — GitHub issue forms YAML syntax.
- https://github.com/ai/size-limit — `size-limit` config and CI integration.
- https://docs.npmjs.com/cli/v10/commands/npm-publish — npm publish flags, 2FA, access tokens.
- https://docs.npmjs.com/policies/unpublish — npm 72hr unpublish policy + deprecation guidance.

### Prior phase decisions carried forward
- D-05 (Phase 7+): plugin-manager local-path install is primary dev workflow. Affects CONTRIBUTING.md content already committed.
- Phase 9 verification gates (React shim guard, live host mount smoke, SDK payload audit) — `npm run lint:shim` is part of verify gate referenced in D-04.

### Reference plugin source repos
- `~/Development/paperclip-temp/` — Paperclip core mirror; check plugin-manager flow + manifest validation.
- `~/Development/Paperclip/plugin-file-viewer/` — sibling plugin reference for npm distribution patterns (per CLAUDE.md tech-stack notes).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `npm run verify` script in `package.json` — already wires typecheck + lint:shim + test:run; extend with size-limit + check-externals + npm pack dry-run for release workflow.
- `scripts/check-react-shim.mjs` — existing pattern for build-time audit scripts; model `check-externals.mjs` on it.
- `esbuild.config.mjs` — already configures externals (React, react-dom). Source of truth for what should NOT appear in `dist/ui`.
- `README.md` — current structure (Table of Contents, Four Modes table, Quick Start, Installation, Development, Contributing) is solid; D-13 polish keeps this skeleton.
- `CONTRIBUTING.md` — references D-05 plugin-manager local-path install workflow; no rewrite needed.
- `CODEOWNERS` — already lists both maintainers globally; just verify GH handles.

### Established Patterns
- Verification artifacts live in `.planning/phases/<NN>-<slug>/<NN>-VERIFICATION.md` with supporting files in subdirs (`evidence/`, `reports/`). Matches D-07.
- Atomic commits per task (GSD norm); release workflow should similarly atomic-commit version bumps and CHANGELOG entries.
- Phase 9 introduced React shim guard via `lint:shim` script; the same audit-script pattern applies to externals validation (D-11).

### Integration Points
- `package.json#paperclipPlugin` metadata feeds plugin-manager during install (DIST-01); rename must update this if paths change (they shouldn't — only `name` field changes).
- GitHub Actions secrets: `NPM_TOKEN` (publish), `GITHUB_TOKEN` (release create) — both need provisioning before tag.
- npm org access to `@paperclipai` scope — prerequisite blocker; if Nicholas doesn't own it, coordinate with Paperclip org admin before Phase 11 execution.

### Bundle Size Baseline
- Current `dist/ui` = ~140KB uncompressed (~40-50KB gzipped est.). Well under 200KB target. Headroom exists; size-limit budget can be set tight (e.g., 80KB gzipped) to catch regressions early.
- Current `dist/worker.js` = 436KB. Not browser-shipped; no gate.

</code_context>

<specifics>
## Specific Ideas

- VPS access details: SSH to `paperclip-vps` (Tailscale `100.79.31.30:3100`), container `docker-server-1`. (From auto-memory `paperclip_vps_access.md`.)
- Plugin upgrade flow on the host (from auto-memory `compass_v033_root_cause.md`) — relevant if 1.1.0 install needs to coexist with or replace existing 0.3.x install on VPS.
- Aron's GH handle for CODEOWNERS verification: currently `@aronprins`; confirm before sending invite (D-16).
- Screenshot evidence should cover both light and dark host themes (per Phase 7-10 dark-mode work), to validate UI parity ships visibly.

</specifics>

<deferred>
## Deferred Ideas

- npm 2FA / publish-via-CI automation token rotation policy — set up once for v1.1.0; revisit if compromised. Not blocking phase scope.
- Demo GIF / launch announcement post for README hero — D-13 chose light polish; full marketing rewrite deferred.
- Contributor governance docs beyond CONTRIBUTING (RFC process, SECURITY.md, code of conduct) — not in OSS-01..06 requirements; future phase.
- npm package badges beyond version + license (build status, bundle size, downloads) — optional; add later when CI is stable.
- Public announcement channels (Twitter/X, HN, Paperclip community) — separate post-launch task; D-16 publish-then-notify covers Aron only.

</deferred>

---

*Phase: 11-distribution-open-source-launch*
*Context gathered: 2026-05-11*
