# Phase 11: Distribution + Open-Source Launch - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-11
**Phase:** 11-distribution-open-source-launch
**Areas discussed:** npm identity + release flow, VPS install verification, Bundle audit gate, README/CHANGELOG + Aron onboarding

---

## npm Identity + Release Flow

### npm package name

| Option | Description | Selected |
|--------|-------------|----------|
| @paperclipai/paperclip-plugin-compass (Recommended) | Roadmap target; first-party convention; requires npm org access | ✓ |
| Unscoped: paperclip-plugin-compass | Keep current name; diverges from roadmap | |
| @compass-ai / personal scope | Separate scope under your control; loses first-party signal | |

**User's choice:** @paperclipai/paperclip-plugin-compass

### Version jump from current 0.3.26

| Option | Description | Selected |
|--------|-------------|----------|
| Straight to 1.1.0 (Recommended) | Matches roadmap + milestone; skip 1.0.0 | ✓ |
| 1.0.0 first, then 1.1.0 | Two npm publishes; more semver-pure | |
| 0.4.0 (pre-1.0 cautious) | Conflicts with roadmap | |

**User's choice:** Straight to 1.1.0

### Publish mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Actions on git tag (Recommended) | Push v1.1.0 tag → workflow verifies, publishes, releases | ✓ |
| Manual npm publish + gh release create | Simplest path; less reproducible | |
| changesets | PR-driven version bumps; heavy for single-plugin repo | |

**User's choice:** GitHub Actions on git tag

### Pre-publish guardrails

| Option | Description | Selected |
|--------|-------------|----------|
| Full verify gate (Recommended) | npm run verify + bundle-size + npm pack dry-run before publish | ✓ |
| Minimal: build + publish | Trust pre-merge CI; faster | |
| Verify + manual approval | Adds friction; useful for first release only | |

**User's choice:** Full verify gate

---

## VPS Install Verification

### Install path

| Option | Description | Selected |
|--------|-------------|----------|
| Plugin-manager UI install from npm (Recommended) | Tests real install path users will follow | ✓ |
| Local .tgz install via plugin-manager | Faster iteration if first publish has issues | |
| Both — tgz first, then npm | Belt-and-suspenders | |

**User's choice:** Plugin-manager UI install from npm

### Verification scope

| Option | Description | Selected |
|--------|-------------|----------|
| Mode panel smoke + screenshots (Recommended) | Open each of 5 panels, screenshot, console clean | ✓ |
| Full UAT walkthrough | Full flow per mode; ~1-2hr | |
| Scripted health check + smoke | Programmatic only; misses visual regressions | |

**User's choice:** Mode panel smoke + screenshots

### Evidence location

| Option | Description | Selected |
|--------|-------------|----------|
| 11-VERIFICATION.md + screenshots in .planning/ (Recommended) | Auditable, version-controlled with the phase | ✓ |
| GitHub release notes only | Public-facing but not in repo | |
| Both — repo + release notes | Duplicate work | |

**User's choice:** 11-VERIFICATION.md + screenshots in .planning/

### Rollback policy

| Option | Description | Selected |
|--------|-------------|----------|
| npm deprecate + patch release (Recommended) | Avoids 72hr unpublish race | ✓ |
| npm unpublish within 72hr window | Blocks version number permanently | |
| Leave broken + patch forward | Cheapest; risk of bad install | |

**User's choice:** npm deprecate + patch release

---

## Bundle Audit Gate

### Bundle size enforcement

| Option | Description | Selected |
|--------|-------------|----------|
| CI gate via size-limit (Recommended) | Hard fail blocks publish; ecosystem tooling | ✓ |
| Custom node script in npm run verify | No new dep; less ecosystem | |
| Manual audit, no gate | Not enforced; regression risk | |

**User's choice:** CI gate via size-limit

### Budget target

| Option | Description | Selected |
|--------|-------------|----------|
| UI bundle only (Recommended) | Matches Paperclip plugin UI guideline; worker is Node | ✓ |
| UI + worker combined | Stricter | |
| Per-file budgets | Most granular; more config | |

**User's choice:** UI bundle only

### Externals validation

| Option | Description | Selected |
|--------|-------------|----------|
| Audit script + size-limit assertion (Recommended) | Grep + size jump detection + peer-dep validation | ✓ |
| Visual diff vs prior bundle | Less precise | |
| Trust esbuild config | Risk if config drifts | |

**User's choice:** Audit script + size-limit assertion

### Stale self-reference dep cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Remove + audit deps in this phase (Recommended) | Part of DIST-04 prep | ✓ |
| Note for separate fix | Outside phase | |
| Leave it | Risk in consumer lockfiles | |

**User's choice:** Remove + audit deps in this phase

---

## README / CHANGELOG / Aron Onboarding

### README rewrite scope

| Option | Description | Selected |
|--------|-------------|----------|
| Light polish (Recommended) | Aron credit + lineage + screenshots + scoped install + badges | ✓ |
| Full marketing rewrite | Risk of losing accurate technical content | |
| Minimal: Aron credit + screenshots | Misses install path + lineage narrative | |

**User's choice:** Light polish

### CHANGELOG depth

| Option | Description | Selected |
|--------|-------------|----------|
| Phase-level rollup (Recommended) | keepachangelog; one bullet per phase | ✓ |
| Feature-level detail | Per-requirement; verbose | |
| High-level summary only | Loses keepachangelog standardization | |

**User's choice:** Phase-level rollup

### Aron onboarding sequence

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-launch private handoff (Recommended) | Grant access + review before tagging | |
| Publish-then-notify | Ship first, then invite + notify | ✓ |
| Soft launch — publish, await Aron review, then announce | Defer GH release + announcement | |

**User's choice:** Publish-then-notify

**Notes:** User picked publish-then-notify over the recommended pre-launch handoff — interpret as: launch velocity > coordination latency. CODEOWNERS already has `@aronprins` so structural co-maintainership is already declared; the invite is operational, not strategic.

### Issue/PR template style

| Option | Description | Selected |
|--------|-------------|----------|
| YAML form templates (Recommended) | Modern issue forms; structured triage | ✓ |
| Markdown templates only | Simpler; less structure | |
| Single generic template | Poorer triage signal | |

**User's choice:** YAML form templates

---

## Claude's Discretion

- Specific `size-limit` config syntax + threshold table layout.
- Screenshot capture tool/method (Playwright vs manual).
- GitHub Actions workflow file layout (single vs split).
- Exact CHANGELOG bullet phrasing per phase (derive from ROADMAP.md Success Criteria).
- Test company on VPS for verification.

## Deferred Ideas

- npm 2FA / publish-via-CI automation token rotation policy.
- Demo GIF / launch announcement post for README hero.
- Contributor governance docs beyond CONTRIBUTING (RFC, SECURITY.md, code of conduct).
- npm package badges beyond version + license (build status, bundle size, downloads).
- Public announcement channels (Twitter/X, HN, Paperclip community).
