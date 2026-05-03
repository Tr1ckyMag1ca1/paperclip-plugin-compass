# Domain Pitfalls: Paperclip Plugins & Autonomous AI Org Tools

**Domain:** Paperclip plugins + autonomous AI organization strategy consultants
**Researched:** 2026-05-02
**Scope:** Pitfalls specific to writing back into live multi-agent company systems, plugin SDK boundaries, approval flows, and strategic-advisor UX failure modes

This research extends the PROMPT.md "Don't do" list with deeper ecosystem warnings discovered from Paperclip plugin history, vision-quest collaboration patterns, and autonomous agent governance research.

---

## Critical Pitfalls (BLOCKER)

### Pitfall 1: Wakeup Duplication via Missing Idempotency Key

**What goes wrong:**
Plugin queues multiple agent_wakeup_requests for the same work (e.g., cascade plan creates 5 agents, plugin retries on partial failure, duplicate wakeups fire). Agents wake up 2–3x, execute the same task multiple times, produce duplicate outputs, flood issue comments, bloat company state.

**Why it happens:**
- Plugin call to `agent_wakeup_requests` API doesn't include `idempotency_key` parameter
- Retry logic in apply step re-queues without checking if wakeup already exists
- Paperclip heartbeat poller sees duplicate queue entries and respects them as distinct work

**Consequences:**
- Agents repeatedly execute the same task (e.g., weekly check-in runs 3x in one day)
- Issue comments spam: 15 comments instead of 5 from duplicate runs
- Founder confusion: "Why did my agent work three times?"
- Data pollution: duplicate documents, duplicate metrics, compound cascades
- Trust erosion: plugin appears flaky or broken

**Prevention:**
- **Code pattern:** Every `agent_wakeup_requests` insert must include a stable `idempotency_key` derived from the change itself (e.g., `sha256(agentId + "cascade-found-mode-" + timestamp.toDate().toISOString().slice(0,10))`)
- **Test:** Unit tests that verify idempotency key generation; integration tests that verify second apply with same payload generates no new wakeup entries
- **Documentation:** Add explicit warning to wakeup queueing code: "idempotency_key is required — see PR #2550 for reasoning"
- **Runtime check:** Before queuing, query existing `agent_wakeup_requests` table for same `idempotency_key` and status; if `queued` or `pending`, skip insert

**Detection:**
- Founder notices agent runs 2–3x for a single apply action
- Issue shows duplicated comments from same agent within 1–5 minute window
- Wakeup request table shows multiple rows with same `agent_id`, `source`, `reason` but different IDs

**Phase to address:** M1 (Skeleton + Inventory) — build wakeup queueing helpers with idempotency enforcement before any mode writes wakeups

**Severity:** BLOCKER

**References:**
- Paperclip issue history references PR #2550 "enforce idempotency key in enqueueWakeup to prevent duplicate runs"
- Company Wizard may inherit this if not fixed upstream; verify during fork

---

### Pitfall 2: Dual-Path Agent Instruction Misrouting

**What goes wrong:**
Plugin writes agent instructions to wrong filesystem path. Managed-mode agents get written to external path (`/agents/Role/AGENTS.md`) which the heartbeat never reads. External-mode agents get written to UUID-based Paperclip path they can't find. Agent runs with stale instructions. Founder sees changes don't apply.

**Why it happens:**
- Plugin checks `adapter_config.instructionsBundleMode` but misses null-coalescing (managed mode is often `null`, not `"managed"`)
- Copy-pasted code assumes all agents use one mode
- Plugin write targets hardcoded path instead of checking `adapter_config.instructionsFilePath` or `instructionsRootPath`
- Dual-path awareness documented in PROMPT.md but not enforced in code review

**Consequences:**
- Founder applies Found mode provisioning, agents created but never read their instructions
- Cascade plan writes brand/voice changes to wrong path; agents keep old voice
- Revive mode proposes fixes but they don't land
- Founder wastes debug time: "I approved the changes, why didn't the agent change behavior?"
- Trust damage: plugin appears to silently fail

**Prevention:**
- **Code pattern:** Every agent instruction write must check `agents[].adapter_config`:
  ```
  const bundleMode = agent.adapter_config?.instructionsBundleMode ?? null; // null = external
  const targetPath = bundleMode === "managed"
    ? `/companies/${companyId}/agents/${agent.id}/instructions/`
    : agent.adapter_config.instructionsRootPath;
  if (!targetPath) throw new Error(`agent ${agent.id}: no instruction path found`);
  ```
- **Test:** Unit tests for both paths; integration tests that verify a write to a managed-mode agent lands in UUID path, write to external agent lands in root path
- **Runtime check:** After every agent creation, query the agent record back and validate both `instructionsBundleMode` and the path that will be used
- **Code review:** Mandate explicit path validation in every PR that touches agent instruction writes

**Detection:**
- Founder notices agent instructions don't reflect changes hours after apply
- Heartbeat logs show agent ran with cached/stale instructions
- Direct filesystem check reveals mismatch: changes exist in one path but not the path the heartbeat reads

**Phase to address:** M1 (Skeleton) — document dual-path awareness in code; M2 (Found) — implement and test both paths before provisioning agents

**Severity:** BLOCKER

**References:**
- Paperclip issues #2443, #2599, #3615 document external bundle mode bugs
- Company Wizard fork must inherit dual-path checking or add it during Compass build
- PROMPT.md already lists "Don't write to /agents/<role>/ for managed-mode agents" but needs code enforcement

---

### Pitfall 3: Approval Gate Bypass (Silent Amendment Without Founder Confirmation)

**What goes wrong:**
Plugin Apply step commits VISION.md amendments automatically without final founder confirmation gate. Founder intended "show me what changed," not "apply all my answers immediately." VISION.md drifts from founder's actual mental model. Strategic decisions founder didn't review get encoded into VISION, cascade to agent instructions.

**Why it happens:**
- Found/Assess/Reposition modes generate VISION amendments
- Inline preview shows the diff
- Founder assumes "inline preview = final confirmation required"
- But Apply step skips re-confirmation gate (designed to auto-apply once preview shown)
- Founder didn't read the small-print disclosure that preview alone = commitment

**Consequences:**
- Founder gets blindsided by strategic changes actually landing
- VISION.md recorded founder's initial answers, not refined thinking after re-reading
- CEO agent inherits misaligned directives from unreviewed VISION
- Amendment cascade creates issues for teams to execute a direction founder didn't finalize
- Trust violation: "I felt like I was just previewing, not confirming"

**Prevention:**
- **Code pattern:** Apply step must show a two-stage confirmation:
  1. Inline preview (editable)
  2. Final gate with clear language: "You are about to commit these changes. This cannot be undone. Founder must review. Confirm? [Yes/No]"
- **UX pattern:** Final confirmation modal includes:
  - Summary of what's changing (VISION sections, agent instructions, cascade scope)
  - Read-only view of the changes
  - Explicit warning: "This change is permanent"
  - Require explicit button click: "I confirm these changes" (not a checkbox)
- **Memory:** Log every apply action with founder's explicit confirmation timestamp to engagement memory
- **Test:** Integration test that verifies Apply step without final confirmation gate doesn't write to DB

**Detection:**
- Founder says "I didn't approve that" hours after Apply completed
- Engagement memory shows no confirmation log for an apply action that changed VISION
- Audit trail shows VISION changed without corresponding approval in approval requests table

**Phase to address:** M2 (Found) — enforce before Apply step ships; verify in M3/M4/M5 that all modes have the gate

**Severity:** BLOCKER

**References:**
- Paperclip Vision SKILL.md warns: "If VISION.md changes, explicit founder approval required"
- Amendment Protocol section explicitly lists "default-NO, dated changelog on YES"
- PROMPT.md already says "don't auto-edit VISION.md without founder approval" — this codifies the UX gate

---

### Pitfall 4: Schema Coupling & Paperclip Version Drift

**What goes wrong:**
Compass hardcodes assumptions about Paperclip schema (e.g., `agents.adapter_config` structure, `issue_documents.key` format, `routines.schedule` cron syntax). Paperclip releases v2.0, schema changes slightly (new field, field type, dropped field). Compass queries break, type mismatches, silent data loss. Founder updates Paperclip and Compass stops working.

**Why it happens:**
- PROMPT.md provides a "schema cheatsheet" that captures schema state at time of writing
- Schema cheatsheet may be stale by the time Compass ships
- Paperclip evolves; minor schema changes don't make headlines
- Compass doesn't version-pin Paperclip dependency or validate schema on startup
- Company Wizard may have similar drift (inherited problem)

**Consequences:**
- Plugin fails silently on certain queries (wrong column type, missing field)
- Found mode provisions agents but doesn't create issues (missing key in response)
- Assess mode queries last 30 days of activity, gets no results (date field type changed)
- Founder upgrades Paperclip, Compass plugin becomes inert
- Root cause hard to diagnose: "Everything worked yesterday, now silent failures"

**Prevention:**
- **Code pattern:** Add schema version validation on plugin load:
  ```
  async function validateSchema(ctx) {
    const tableStructure = await ctx.db.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'agents'"
    );
    const hasAdapterConfig = tableStructure.some(col => col.column_name === 'adapter_config');
    if (!hasAdapterConfig) throw new Error("Paperclip schema mismatch: expected agents.adapter_config");
  }
  ```
- **Test:** Unit tests that mock different schema versions and verify graceful error handling
- **Documentation:** Add SCHEMA.md file that documents every field Compass depends on, with version when it was introduced/changed
- **Runtime:** Log schema validation on every plugin startup; fail loudly if mismatch detected
- **Dependency:** Pin Paperclip plugin-sdk to major version range; update SCHEMA.md and test matrix when Paperclip bumps major version

**Detection:**
- Plugin stops processing after Paperclip upgrade
- Logs show `column_name is undefined` or `undefined is not iterable` on schema-dependent queries
- Manual schema check shows field exists but type changed (e.g., `schedule` was string, now jsonb)

**Phase to address:** M1 (Skeleton) — add schema validation and SCHEMA.md documentation; update before each Paperclip minor version bump

**Severity:** BLOCKER

**References:**
- Schema migration research shows version coupling is a leading cause of silent failures
- Paperclip may release major versions without notice in early ecosystem
- Company Wizard fork may need same validation before Compass uses it

---

## High-Priority Pitfalls

### Pitfall 5: Engagement Memory Rot (Stale Findings Drive Stale Recommendations)

**What goes wrong:**
Plugin stores engagement history per company (last drift review, prior findings, open recommendations). Founder runs Compass once, it captures state. 3 months later, Compass re-runs Assess mode and recommends the same amendments, unaware they were already addressed. Or prior findings were invalidated by new context (hired a CFO, pivoted product) but plugin doesn't know. Compass recommends killing a problem that's already solved.

**Why it happens:**
- Engagement memory stores snapshots, not streaming updates
- Founder makes changes outside Compass (manual VISION edits, agent decisions, business pivot) but doesn't update memory
- Compass has no way to know context changed unless explicitly told
- Plugin lacks a "context refresh" step before re-running recommendations

**Consequences:**
- Founder sees "drift detected" for changes they already made
- Recommend "hire a head of product" when that role exists but is new
- Propose brand refresh when market shifted but VISION wasn't updated
- Compass feels stale, out-of-touch, not respecting founder's intelligence
- Founder stops trusting recommendations

**Prevention:**
- **Code pattern:** Assess mode begins with a "context refresh" step:
  1. Display prior findings from engagement memory
  2. Ask founder: "What's changed since last check-in? [major pivot / new hire / market shift / nothing major]"
  3. Update engagement memory with new context
  4. Run drift analysis with new context in scope
- **Memory structure:** Store not just findings but also timestamp, context snapshot, and a "status" field (open/addressed/invalidated)
- **UX pattern:** Before proposing amendments, surface prior amendments and their status:
  - "We recommended hiring a CFO in March. Did you? [Yes/No]"
  - If Yes, update memory and skip that recommendation
  - If No, ask why (blocker / deprioritized / not needed) and adjust confidence
- **Test:** Integration test that runs Assess twice with context change in between, verifies recommendations differ

**Detection:**
- Founder says "I already did that" or "that doesn't apply anymore"
- Engagement memory shows old findings without update timestamps
- Plugin makes recommendations that contradict founder's stated changes

**Phase to address:** M3 (Assess) — build context refresh into Assess flow; M6 (Engagement Memory) — persist context and status fields

**Severity:** HIGH

**References:**
- Strategic consultant best practices: always validate prior findings before new recommendations
- Paperclip Vision warns about discovering existing VISION.md and updating vs. replacing
- Founder workflow preference: automate everything, respect prior decisions

---

### Pitfall 6: Cascade Plan Side Effects (Uncontrolled Blast Radius)

**What goes wrong:**
Founder approves a brand change in Reposition mode. Plugin generates cascade plan that touches voice, messaging, agent instructions, product tagline, sales copy. But a new agent was just hired yesterday to experiment with a narrow positioning. Cascade plan kills the experiment without asking. Or cascade assumes all agents speak the same voice, but the Support agent uses different tone than GTM agent. Blanket update breaks the intentional variance.

**Why it happens:**
- Cascade plan generator (M3/M4/M5) builds a tree of "affected components"
- Assumes all agents in scope need the same change
- Doesn't model agent-specific overrides or experiments-in-progress
- Doesn't ask founder "should this apply to X experiment?" or "does agent Y have a reason for different voice?"

**Consequences:**
- Cascade creates issues for agents to update instructions
- Agent loses a custom tuning (e.g., Support agent tone calibrated for customer empathy)
- Experiment killed before it had time to show results
- Founder wastes time reverting unintended changes
- Trust erosion: "Compass changed things I didn't ask for"

**Prevention:**
- **Code pattern:** Before generating cascade plan, query for:
  - New agents (created in last 30 days) — mark as "auto-exclude, confirm to include?"
  - Agents with custom instruction content (doesn't match standard template) — mark as "custom-override detected, skip?"
  - Issues tagged with "experiment" — check if cascade intersects; ask before proceeding
- **UX pattern:** Cascade plan preview shows:
  - Scope: "Will affect 5 agents (4 standard, 1 custom-override, 1 new)"
  - Granular controls: checkbox per agent/component to include/exclude
  - Warnings: "Agent: Support has custom voice; change will override. Continue? [Yes/No]"
- **Memory:** Track agent creation dates and custom overrides in engagement memory
- **Test:** Integration test with mixed agent population (standard, custom, new); verify founder can granularly control cascade

**Detection:**
- Founder complains "why did you change the Support agent's voice?"
- Custom agent instructions overwritten with generic template
- New experiment agent's instructions modified without founder request
- Cascade creates issues for all agents, but founder only wanted 3

**Phase to address:** M4 (Revive) and M5 (Reposition) — add agent screening and granular controls before cascade generation

**Severity:** HIGH

**References:**
- Autonomous agent governance research: match changes to agent role and context, not blanket policies
- Paperclip memory context: founder values surgical changes over broad sweeps
- Strategic pivot lesson: a brand change doesn't mean every agent tone changes

---

### Pitfall 7: Sample-Pivot Confusion (Treating Production as Draft, Losing Work)

**What goes wrong:**
Revive mode proposes "sample-pivot" pattern: tag existing work as samples for critique pass, create new production-ready versions. But founder misunderstands: doesn't realize existing work is being demoted. Or plugin implements it wrong: creates "critique pass" issue but never closes the production issue. Or plugin deletes sample documents thinking they're backups. Work appears lost.

**Why it happens:**
- Sample-pivot is a new pattern in Compass, not a standard Paperclip concept
- UX doesn't make it obvious what "sample" means: draft? throwaway? kept for reference?
- Plugin documentation unclear about whether samples are deleted, archived, or kept alongside production
- Founder's mental model: "my agent's work is production-ready" conflicts with "let me critique it as samples first"

**Consequences:**
- Founder thinks work was deleted when it was just re-scoped
- Samples never get critiqued, issue stays open forever
- Production work created but agents still send output to old sample issue
- Founder loses track of what's real vs. practice
- Trust damage: "Compass lost my work"

**Prevention:**
- **Code pattern:** Sample-pivot creates two issues explicitly:
  - **Sample issue** (old work): Title = "[SAMPLE] Original Agent Work for Critique", marked read-only with notice "This is now a draft/sample. See <Production Issue> for current work."
  - **Production issue** (new): Title = "[PRODUCTION] Agent Work (Post-Critique)", marked as active work, backlinks to sample
  - Issue relationship: production issue has `related_to: sample_issue_id` in document metadata
- **UX pattern:** Before applying sample-pivot, show founder a visual diagram:
  - Left side: "Before — work flows here"
  - Right side: "After — work flows here; old issue becomes read-only sample"
  - Explicit checkbox: "I understand existing work is being demoted to draft for critique. Proceed? [Yes/No]"
- **Memory:** Document in engagement memory when sample-pivot was applied, which issues were affected, which production issue is now active
- **Docs:** Add SAMPLE_PIVOT.md explaining the pattern in plain language: "Samples are not deleted; they become reference material while the team builds production-ready work"
- **Test:** Integration test that applies sample-pivot, verifies both sample and production issues exist, old work is readable

**Detection:**
- Founder asks "where did my work go?" after sample-pivot
- Agents still writing to old sample issue instead of new production issue
- Sample and production issues are out of sync

**Phase to address:** M4 (Revive) — implement with extreme clarity in UX; include detailed memory and docs

**Severity:** HIGH

**References:**
- Paperclip Vision describes sample-pivot as emerging pattern for stalled companies
- Founder trust depends on work never being silently lost
- Production-VPS blast radius: founder can't afford to lose or misplace work on a live company

---

## Moderate Pitfalls

### Pitfall 8: Two-Maintainer Code Review Gaps (Aron + Founder, Quorum Block Missing)

**What goes wrong:**
Compass is built for two maintainers: Aron Prins (vision-quest, strategic patterns) and founder (Paperclip integration, Compass-specific logic). One maintainer proposes a change that the other would veto, but both are traveling. Change merges without veto. Or a critical bug ships because review was light. Or conflicting decisions on Amendment Protocol interpretation happen without discussion.

**Why it happens:**
- Two-person governance requires quorum for critical decisions, but no explicit enforcement
- No CODEOWNERS file or branch protection rules requiring both reviewers
- No decision log for Amendment Protocol or cascade plan semantics
- Async work across timezones; hard to sync before merge

**Consequences:**
- Strategic direction drifts from Aron's intent
- Plugin shipped with Paperclip SDK misuse
- Amendment Protocol implemented wrong by one maintainer
- No way to trace why a decision was made
- Upstream contribution (Company Wizard, Paperclip Vision) may be sidelined in a later release

**Prevention:**
- **Code governance:** Create CODEOWNERS file with both maintainers listed:
  ```
  * @aronprins @founder_github
  src/modes/amend*.ts @aronprins  # Strategic logic, Aron final say
  src/plugin/sdk.ts @founder_github   # Paperclip integration, founder final say
  .planning/DECISIONS.md @aronprins @founder_github  # Both required
  ```
- **Decision log:** Create .planning/DECISIONS.md documenting major decisions:
  - Amendment Protocol enforcement specifics
  - Cascade plan scope rules (what changes should cascade)
  - Idempotency key strategy
  - Each decision includes: rationale, alternative considered, owner (Aron / founder)
- **Async process:** Before merge, at least one maintainer must approve; if strategic change, require both within 48 hours or escalate
- **Test:** Code review checklist in PR template asks: "Does this change a strategic decision? If yes, does DECISIONS.md cover it?"
- **Collab structure:** Assume Aron is consultant/advisor with final say on vision-quest content; founder has final say on Paperclip integration; DECISIONS.md shows the boundary

**Detection:**
- Maintainers disagree on shipped behavior
- No record of why a design decision was made
- Code implements Amendment Protocol differently than documented

**Phase to address:** M1 (Skeleton) — set up governance before code starts; refresh before M2 (Found)

**Severity:** MEDIUM

**References:**
- Paperclip CONTRIBUTING.md requires PR template and code review discipline
- PROMPT.md assumes Aron Prins joins as co-maintainer
- Open-source projects with 2 maintainers need explicit governance to avoid drift

---

### Pitfall 9: Drift Detection False Positives / Negatives (Assess Mode Noise)

**What goes wrong:**
Assess mode compares VISION sections vs. last 30 days of agent activity. But:
- False positives: Agent posted a market-research issue that mentioned a competitor, Assess flags it as "brand drift" when it was just research
- False negatives: Agent silently ignored voice guidelines for 2 weeks, Assess misses it because comments are sparse
- Drift window is arbitrary (30 days): recent major shift takes 31 days to detect; old stale behavior detected on day 1

**Why it happens:**
- Drift detection is heuristic: keyword matching, tone analysis, issue topic classification
- 30-day window is fixed, doesn't account for company velocity or intent
- Founder's intent in VISION can be ambiguous ("be bold" vs. "be cautious")
- Agent behavior is noisy: one off-brand comment doesn't mean the agent drifted

**Consequences:**
- Founder sees 50 drift items, dismisses all as noise, stops trusting Assess mode
- Real drift (agent ignoring voice for weeks) goes undetected until it's a crisis
- Unnecessary amendments created, wasting energy on false signals
- Founder calibrates drift threshold too high, missing early warnings

**Prevention:**
- **Code pattern:** Drift report includes confidence scores per finding:
  - HIGH: Multiple signals align (tone analysis + topic + explicit contradiction)
  - MEDIUM: Single strong signal (direct quote that contradicts VISION)
  - LOW: Ambiguous match (agent mentioned competitor in research context)
- **UX pattern:** Assess report shows drift items sorted by confidence; default-hide LOW confidence items; founder can toggle
- **Window tuning:** Assess mode asks founder: "How quickly do you expect to see strategy reflected in agent work? [days / weeks / months]" and adjusts 30-day default
- **Memory:** Store founder's feedback on prior drift items ("this was fine, not drift"; "this was real drift") and tune detection rules
- **Test:** Unit tests with synthetic agent activity; verify both false positive and false negative rates; test edge cases (competitor research, tone variation, new agent onboarding)

**Detection:**
- Founder dismisses most drift items as noise
- Real drift goes undetected until founder notices manually
- Assess mode recommendations feel misaligned with actual agent behavior

**Phase to address:** M3 (Assess) — build confidence scoring into drift report; add tuning knobs in UX

**Severity:** MEDIUM

**References:**
- Strategic consultant best practice: high signal-to-noise ratio on recommendations
- Paperclip agent activity is noisy; single comments don't mean drift
- Founder workflow: wants surgical recommendations, not fire hoses

---

### Pitfall 10: Production-VPS Blast Radius (Compass Breaks a Live Company)

**What goes wrong:**
Compass is a plugin running against a real, heartbeating Paperclip company (Pictor.pro, Candlewood Lake Weekly, RaiseYourGlass.ai). Plugin has a bug: writes corrupt agent instructions, queues 100 duplicate wakeups, deletes a document, or cascade plan creates issues with invalid assignees. Company heartbeat fails, agents hang, founder loses revenue/work momentum. Compass broke production.

**Why it happens:**
- Plugin writes directly to live DB via Plugin SDK
- No staging environment; testing is local, production is live
- Apply step has minimal validation before write
- Cascade plan generates issues without checking if assignee agent exists
- Wakeup queueing happens before DB writes; if write fails, wakeups fire anyway for non-existent work

**Consequences:**
- Company heartbeat fails or becomes unstable
- Agents hang or produce errors
- Founder loses hours/days debugging
- Trust damage: "A plugin broke my company"
- Reputational damage: Compass known to have blown up a live company

**Prevention:**
- **Code pattern:** Every Apply step must:
  1. Validate all writes will succeed (simulate, don't execute)
  2. Check referential integrity (assignee exists, document exists, company exists)
  3. Wrap all DB writes in a transaction with rollback on error
  4. Log every change with timestamp and actor (plugin ID)
- **UX pattern:** Apply preview shows:
  - What will be written (document count, issue count, agent changes)
  - Validation results: "All referential checks passed" or "WARNING: assignee agent not found"
  - Data loss risk: "This will delete 0 documents, modify 5, create 3"
- **Testing:** Integration tests against mock Paperclip API that includes failure injection (missing agent, invalid JSON, DB unavailable); verify rollback and error reporting
- **Monitoring:** After Apply, check company heartbeat status for 1 minute; if heartbeat fails, log critical alert
- **Docs:** Add SAFETY.md documenting all validation checks and rollback guarantees

**Detection:**
- Company heartbeat stops after Compass Apply
- DB logs show malformed data or orphaned references
- Founder reports "plugin broke my company"

**Phase to address:** M1 (Skeleton) — build validation and rollback into Apply framework; test every milestone with production safety in mind

**Severity:** HIGH

**References:**
- Paperclip memory: founder runs Compass on real companies that can't go down
- Plugin SDK best practice: always validate before write, always rollback on error
- Company Wizard may have similar risks; audit during fork

---

### Pitfall 11: Open-Source Distribution Security (npm Supply Chain, Manifest Validation)

**What goes wrong:**
Compass published to npm. Attacker compromises the account or npm registry. Malicious version published that:
- Reads Paperclip API keys from founder's environment
- Exfiltrates company documents to attacker
- Injects backdoor into agent instructions
- Or: founder's team member fork Compass for internal use, accidentally leaves Paperclip API key in manifest comment, commits to private repo, GitHub org gets breached, key exposed

**Why it happens:**
- npm packages can include arbitrary scripts (install hooks, build hooks)
- Manifest-based attacks: manifest looks clean but install scripts exfiltrate secrets
- No validation that plugin manifest is signed or from trusted source
- Paperclip plugin manager may auto-update without founder reviewing changes
- Secrets (API keys, credentials) may leak in code or config

**Consequences:**
- Founder's Paperclip instance compromised
- All companies' documents exposed
- Agent instructions modified, agents behave unexpectedly
- Cascading trust failure across ecosystem

**Prevention:**
- **Code pattern:** No hardcoded secrets; all Paperclip credentials passed via environment or Paperclip's secret API
- **Manifest:** Plugin manifest includes a checksum or signature; Paperclip plugin manager verifies before load
- **CI/CD:** npm publish requires 2FA and audit log; only approved maintainers can publish
- **Security audit:** Third-party security review before v1.0 release
- **Docs:** Add SECURITY.md documenting:
  - No API key storage in code
  - No install hooks or build scripts that exfiltrate data
  - Checksum/signature verification process
  - Vulnerability reporting procedure (per Paperclip SECURITY.md policy)
- **Test:** Automated scanning of node_modules for malicious packages; npm audit in CI
- **Dependency review:** Minimize dependencies; audit each one for known vulns; use npm ci --ignore-scripts in lockdown mode

**Detection:**
- Founder's API key found in Compass source code
- npm package contains suspicious install scripts
- Plugin-manager warns about unverified manifest
- Third-party security scan flags exfiltration vectors

**Phase to address:** M1 (Skeleton) — set up CI/CD with npm audit and 2FA; M6 final push — third-party security review

**Severity:** HIGH

**References:**
- npm ecosystem saw multiple supply chain attacks in 2025–2026 (Axios, others)
- Manifest-based attacks are hard to detect with traditional scanning
- Paperclip SECURITY.md policy: report vulns privately, not in public issues
- Founder runs Compass on prod companies; compromise = catastrophic

---

## Lower-Priority Pitfalls

### Pitfall 12: Approval Request Queue Feedback Loop (Founder Forgets to Decide)

**What goes wrong:**
Assess mode generates VISION amendment with cost-benefit analysis. Routes to founder's approval queue. Founder sees it, thinks "I'll decide later." A week passes. Founder forgets about it. Plugin keeps re-surfacing the recommendation. Or: multiple amendments pile up, founder only approves 50% but plugin cascades all of them as if approved. Decisions linger in limbo.

**Why it happens:**
- Founder has limited context-switching capacity
- Amendment queued in `approvals` table, but no urgent notification
- Plugin doesn't differentiate "founder saw and said no" vs. "founder hasn't seen"
- Cascade plan assumes all approvals are YES without checking status first

**Consequences:**
- Amendments languish in limbo for weeks
- Founder forgets what problem the amendment solves
- Plugin recommends cascading changes on a half-decided amendment
- Founder frustration: "I don't remember approving this"

**Prevention:**
- **Code pattern:** Cascade plan checks amendment status before generating issues:
  ```
  if (amendment.status !== 'approved') {
    throw new Error(`Cannot cascade: amendment ${amendmentId} not approved`);
  }
  ```
- **UX pattern:** Approval queue in Compass sidebar shows:
  - Pending approvals with age (e.g., "pending 3 days")
  - One-click approve/reject with reason
  - Automatic escalation: if pending >7 days, surface in daily digest
- **Memory:** Store founder's approval history (approve date, reject date, reason) in engagement memory
- **Docs:** Add approval workflow documentation explaining the flow and expected timeline

**Detection:**
- Approval queue shows months-old pending amendments
- Cascade plan blocked waiting for approval
- Founder doesn't remember an amendment they approved weeks ago

**Phase to address:** M3 (Assess) — build approval status checks into cascade generator; M6 — add escalation to daily digest

**Severity:** MEDIUM

**References:**
- Autonomous agent governance research: approval workflows need clear SLAs and escalation
- Founder workflow: async decision-making, not real-time

---

### Pitfall 13: Interview Fatigue (Strategic Questions Too Deep, Founder Abandons)

**What goes wrong:**
Found mode runs full 6-section vision-quest interview (50–80 questions). Founder gets 40% through, gets tired, starts skipping questions or answering shallow. Plugin generates VISION.md based on incomplete data. VISION is vague, unhelpful, agents confused.

**Why it happens:**
- Full vision-quest interview is comprehensive and deep
- Founder is non-developer, not used to long Q&A sessions
- No progress indicator; founder doesn't know how many questions left
- No "save and resume later" feature; founder forced to finish in one session

**Consequences:**
- VISION.md full of placeholder answers and vagueness
- Agents lack clarity on purpose/voice/brand
- Founder frustrated: "I didn't answer these properly"
- Found mode outcome is low-quality, not useful

**Prevention:**
- **Code pattern:** Add interview state persistence:
  - Save answers after each section
  - On re-open, prompt: "Resume interview from section 3? [Resume / Start Over]"
  - Allow founder to edit prior answers before final VISION generation
- **UX pattern:** 
  - Progress bar: "Section 3 of 6 (15 minutes)"
  - Section summaries: after each section, show a preview of how answers will shape VISION
  - Breathing room: allow founder to review answers before moving to next section
- **Interview design:** For non-developer founder, condense vision-quest to essential sections (3–4 instead of 6) in first pass; mark advanced sections optional
- **Test:** Usability test with non-developer founder; measure completion rate and answer quality

**Detection:**
- Founder abandons interview mid-way
- Generated VISION.md has vague/placeholder answers
- Founder complains about interview length

**Phase to address:** M2 (Found) — add interview state persistence and progress indicators; condense for founder audience

**Severity:** MEDIUM

**References:**
- Founder is non-developer, prefers automated/hard-coded workflows
- Interview fatigue is a known pattern in strategic tools
- Paperclip Vision interview is designed for consultants, not automated tools; may need adaptation

---

### Pitfall 14: Drift Detection Staleness (30-Day Window, Recent Shift Undetected)

**What goes wrong:**
Founder ships a major strategic pivot: pivot from B2B to B2C, rebrand colors, hire new GTM lead. VISION.md updated. But Assess mode drift window is 30 days. Compass just ran 25 days ago, won't detect the pivot drift until day 56. Founder runs Assess manually on day 31, misses the window, gets no alerts. Or: drift window is too broad (30 days) and false positives overwhelm signal.

**Why it happens:**
- 30-day drift window is hardcoded in PROMPT.md as the default
- Doesn't account for founder's actual business velocity
- Window is fixed, not tuned per company

**Consequences:**
- Founder doesn't discover brand drift until weeks after pivot
- Agents continue with old positioning while founder pushed new strategy
- Assess mode feels out-of-sync with company pace

**Prevention:**
- **Code pattern:** Assess mode is parameterizable:
  - Drift window: founder can set to 7/14/30/60 days at setup or override per run
  - Default: 30 days for mature companies, 7 days for new companies (fast-moving)
- **UX pattern:** Assess mode shows:
  - "Last drift check: X days ago"
  - "Drift window: 30 days. Change? [7 / 14 / 30 / 60 days]"
- **Automation:** Scheduled quarterly drift check (M6 routines) with tuned window per company
- **Memory:** Store founder's preferred drift window and velocity in engagement memory

**Detection:**
- Founder runs Assess, gets no drift detected, but major pivot happened
- Drift window too broad, overwhelmed with false positives

**Phase to address:** M3 (Assess) — make drift window tunable; M6 — add per-company defaults

**Severity:** MEDIUM

**References:**
- Founder workflow: company velocity varies wildly (startup sprints vs. mature steady-state)
- 30-day default may work for some, not others

---

## Summary Table: Pitfalls by Phase & Severity

| Pitfall | Phase | Severity | Key Prevention |
|---------|-------|----------|-----------------|
| Wakeup Duplication | M1 | BLOCKER | Idempotency key enforcement |
| Dual-Path Misrouting | M1–M2 | BLOCKER | Explicit path validation per mode |
| Approval Gate Bypass | M2 | BLOCKER | Two-stage confirmation before Apply |
| Schema Coupling | M1 | BLOCKER | Schema validation + version pinning |
| Engagement Memory Rot | M3–M6 | HIGH | Context refresh step + status tracking |
| Cascade Side Effects | M4–M5 | HIGH | Agent screening + granular controls |
| Sample-Pivot Confusion | M4 | HIGH | Clear UX + dual-issue pattern + docs |
| Blast Radius (Prod) | M1+ | HIGH | Validation + rollback + monitoring |
| Security (npm) | M1 + M6 | HIGH | No hardcoded secrets + 2FA + audit |
| Two-Maintainer Gaps | M1+ | MEDIUM | CODEOWNERS + DECISIONS.md |
| Drift False Pos/Neg | M3 | MEDIUM | Confidence scoring + tuning knobs |
| Approval Limbo | M3–M6 | MEDIUM | Status checks + escalation |
| Interview Fatigue | M2 | MEDIUM | State persistence + progress bars |
| Drift Staleness | M3–M6 | MEDIUM | Tunable window + automation |

---

## Production-VPS Blast Radius: Why This Matters

Compass runs against **live, heartbeating Paperclip companies** that founders depend on for revenue and work. Unlike a typical plugin (batch tool, analysis tool, read-only dashboard), Compass **writes to agent instructions, creates issues, queues wakeups, and cascades changes**. A bug in Compass can:

- **Freeze a company's heartbeat** (corrupt instructions, invalid issue data)
- **Lose work** (delete or overwrite documents)
- **Flood agents with duplicate tasks** (wakeup duplication)
- **Misalign strategy** (unapproved VISION amendments)

This makes every pitfall above **high-touch and high-consequence**. Testing must include:
- Integration tests against mock Paperclip API with failure injection
- Manual testing against a real Paperclip instance before each Milestone
- Founder sign-off before any Apply action goes to production companies
- Monitoring/alerting on company heartbeat health post-Apply

---

## Phase-by-Phase Research Flags

| Phase | Risk | Mitigation |
|-------|------|-----------|
| M1: Skeleton | Schema coupling, wakeup framework, dual-path awareness | Validate schema on load, build idempotency into wakeup helpers, document paths |
| M2: Found | Approval gate, interview design, provisioning correctness | Two-stage confirmation, state persistence, provisioning validation against mock API |
| M3: Assess | Drift false pos/neg, approval limbo, engagement memory | Confidence scoring, status checks, context refresh step |
| M4: Revive | Sample-pivot clarity, cascade screening, custom overrides | Clear UX + dual-issue pattern, agent screening, memory tracking |
| M5: Reposition | Cascade side effects, uncontrolled scope | Granular controls, old-decision detection |
| M6: Engagement Memory | Memory rot, two-maintainer governance, security review | Status tracking, decision log, third-party security audit |

---

## Sources & References

- [Paperclip plugin-spec](https://github.com/paperclipai/paperclip/blob/master/doc/plugins/PLUGIN_SPEC.md) — idempotency key pattern, Plugin SDK API
- [Paperclip issue #2550](https://github.com/paperclipai/paperclip/issues) — enforce idempotency in wakeup requests
- [Paperclip issues #2443, #2599, #3615](https://github.com/paperclipai/paperclip/issues) — dual-path instruction bundling bugs
- [Paperclip Vision SKILL.md](https://github.com/aronprins/paperclip-vision/blob/main/SKILL.md) — Amendment Protocol, founder approval patterns
- [Autonomous agent governance research](https://mckinsey.com) — approval workflows, autonomy levels, cascading decision challenges
- [npm supply chain attacks](https://unit42.paloaltonetworks.com/monitoring-npm-supply-chain-attacks/) — manifest validation, install hook risks
- [Schema migration best practices](https://atlasgo.io/) — version coupling, drift detection
- [Paperclip memory CLAUDE.md](file:///Users/nicholasrhodes/.claude/projects) — founder workflow, production-VPS criticality
