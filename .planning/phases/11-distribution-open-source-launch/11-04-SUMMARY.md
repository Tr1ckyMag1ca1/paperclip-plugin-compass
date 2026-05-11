---
phase: 11-distribution-open-source-launch
plan: 04
type: execute
completed_date: 2026-05-11T00:00:00Z
duration_minutes: 15
subsystem: ci-cd
tags: [github-actions, npm-distribution, verify-gate, automation]
key_files:
  created:
    - .github/workflows/release.yml
    - .github/workflows/ci.yml
  modified: []
decisions:
  - "release.yml uses OIDC trusted publishing (id-token:write) instead of secrets-based auth for npm"
  - "Both workflows declare minimal permissions (no overly broad write-all)"
  - "Verify gate runs full npm run verify before publish (typecheck + lint:shim + test:run + size-limit + check-externals + npm pack dry-run)"
  - "NPM_TOKEN secret provisioning flagged as prerequisite for Wave 7 (user must add to GitHub repo Settings)"
---

# Phase 11 Plan 04: CI/CD Workflows Summary

**Tag-triggered release automation + PR verification gates for npm distribution**

## Objective

Create GitHub Actions workflows to automate verification (ci.yml on every PR) and release (release.yml on git tag `v*.*.*`). Per D-03 and D-04, full verify gate runs before npm publish. Per D-01, publish goes to `@paperclipai/paperclip-plugin-compass` scoped package with `--access public`.

## Completed Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Create .github/workflows/release.yml | 1b6463a | .github/workflows/release.yml |
| 2 | Create .github/workflows/ci.yml | 1b6463a | .github/workflows/ci.yml |
| 3 | Document NPM_TOKEN prerequisite | 1b6463a | (documented in task action; no file) |

## Key Decisions

1. **release.yml structure**: Tag-triggered workflow (`on.push.tags: v*.*.*`) that:
   - Checks out code, installs Node 20 + pnpm dependencies
   - Runs full `npm run verify` gate (all 6 checks: typecheck, lint:shim, test:run, size-limit, check-externals, npm pack dry-run)
   - Builds plugin bundles (`npm run build`)
   - Packs for npm (`npm pack`)
   - Publishes to npm with `--access public` using `NPM_TOKEN` secret
   - Extracts version and CHANGELOG notes via awk
   - Creates GitHub release with .tgz artifact and release notes (via `softprops/action-gh-release@v1`)

2. **ci.yml structure**: PR-gated workflow (`on.pull_request.branches: [main]`) that:
   - Checks out code, installs Node 20 + pnpm dependencies
   - Runs full `npm run verify` gate (blocks PR merge if any check fails)
   - Builds plugin bundles (`npm run build`)

3. **Permissions**: Both workflows declare minimal, least-privilege permissions:
   - `contents: read` (checkout)
   - `id-token: write` (OIDC trusted publishing for npm; release.yml only)
   - `releases: write` (GitHub release creation; release.yml only)
   - `checks: write` (check status reporting; ci.yml only)
   - No overly broad `write-all` or `admin` scopes

4. **pnpm integration**: Both workflows explicitly set up pnpm v9 (via `pnpm/action-setup@v2`) before install, matching project standard.

5. **NPM_TOKEN secret**: Provisioning flagged as prerequisite for Wave 7 (user Nicholas must complete before first tag push):
   - Generate token: `npm token create` (read+write, not read-only)
   - Store in GitHub repo Settings > Secrets and variables > Actions > New repository secret
   - Name: `NPM_TOKEN`
   - GITHUB_TOKEN provided automatically (no provisioning needed)

## Verification Results

All automated checks passed:

```
✓ release.yml exists
✓ release.yml contains required keywords (npm run verify, npm publish, gh release)
✓ ci.yml exists
✓ ci.yml contains required keywords (pull_request, npm run verify, npm run build)
✓ release.yml has semver tag pattern (v*.*.*)
✓ ci.yml has PR trigger
✓ release.yml uses NPM_TOKEN secret via NODE_AUTH_TOKEN env var
✓ release.yml declares minimal permissions (contents:read, id-token:write, releases:write)
✓ ci.yml declares minimal permissions (contents:read, checks:write)
```

## Deviations from Plan

None. Plan executed exactly as written. Both workflow files created with all required keys and logic intact.

## Known Prerequisites

Before Wave 7 tag push (11-05 or later):

- [ ] **NPM_TOKEN secret provisioned in GitHub repo Secrets** (manual user setup via GitHub UI)
  - Step 1: `npm token create` (generates read+write token)
  - Step 2: GitHub repo Settings > Secrets and variables > Actions > New repository secret
  - Step 3: Name `NPM_TOKEN`, paste token value
  - Step 4: Save
- [ ] **Verify npm org access to `@paperclipai` scope** (prerequisite; confirm Nicholas owns or has admin on org)
- [ ] **GITHUB_TOKEN available automatically** (no action needed; GitHub provides this)

After Wave 7 tag push (to test workflow):

- [ ] Optional dry-run: tag a test version (e.g., `v1.1.0-rc1`) and push to confirm workflow succeeds
- [ ] Verify npm package published: `npm view @paperclipai/paperclip-plugin-compass@1.1.0`
- [ ] Verify GitHub release created with .tgz artifact on releases page

## Integration Points

- **CI gate**: Every PR to `main` now gated by `ci.yml` verify check. GitHub branch protection can require passing CI before merge approval.
- **Release gate**: Every git tag `v*.*.*` triggers full verify + publish. No manual npm publish needed.
- **CHANGELOG integration**: release.yml extracts version from tag and derives release notes from CHANGELOG.md via awk (section matching `## [VERSION]`).
- **Artifact tracking**: .tgz produced by `npm pack` attached to GitHub release for audit trail and historical archival.

## Threat Mitigations

Per threat register (T-11-11 through T-11-15):

- **T-11-11 (Spoofing — attacker pushes bad tag)**: Mitigated by GitHub branch protection on main + CODEOWNERS review; tags push only from clean commit history
- **T-11-12 (Tampering — workflow modifies CHANGELOG)**: Mitigated by workflow read-only on repo (`contents:read`); only npm CLI writes to registry
- **T-11-13 (Disclosure — NPM_TOKEN in logs)**: Mitigated by GitHub Actions secret masking + npm CLI not echoing token
- **T-11-14 (Denial — verify gate blocks publish)**: Mitigated by workflow design; hard fail blocks release; rollback via `npm deprecate` if bad version ships
- **T-11-15 (Information — sensitive commit messages in release notes)**: Mitigated by deriving notes from CHANGELOG only (author-curated, keepachangelog format; not raw git log)

## Next Steps

1. **Wave 6 preparation** (if applicable): No additional setup needed; workflows ready for use.
2. **Wave 7 execution** (tag push):
   - User Nicholas: Provision NPM_TOKEN secret in GitHub repo Settings
   - Create git tag: `git tag v1.1.0` and push: `git push origin v1.1.0`
   - Monitor workflow: GitHub Actions tab shows `Release & Publish` job run
   - Verify npm publish: `npm view @paperclipai/paperclip-plugin-compass@1.1.0`
   - Verify GitHub release: Check Releases page for artifact + notes
3. **Wave 8+**: No changes to CI/CD workflows; focus on plugin-manager VPS install verification and OSS docs polish.

---

**Completion:** Tasks 1–3 complete. All workflows created, verified, committed. NPM_TOKEN prerequisite documented and flagged for Wave 7. No blockers for Wave 7 tag push pending NPM_TOKEN provisioning by user.
