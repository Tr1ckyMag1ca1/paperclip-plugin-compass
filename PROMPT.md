# Build Prompt — Compass (Paperclip Plugin)

Paste this prompt into a fresh Claude Code session, Codex, or any AI builder. Self-contained — no prior context needed beyond this file + the two source repositories.

---

## Project

Build a Paperclip plugin called **Compass** (working name; founder may rename — confirm before launch). Compass acts as a strategic consultant for any Paperclip-hosted AI company at any lifecycle stage. It founds new companies, audits existing ones, revives stalled ones, and repositions mature ones.

The plugin combines and extends two existing tools in the Paperclip ecosystem:

- **Company Wizard** — `https://github.com/yesterday-ai/paperclip-plugin-company-wizard` — provides the plugin shell, provisioning, presets, modules, and AI/manual mode UX. Fork as the starting chassis.
- **Paperclip Vision** — `https://github.com/aronprins/paperclip-vision` by Aron Prins — provides the strategic interview depth, VISION.md authoring, Amendment Protocol, and operating philosophy framework. Port the markdown content into the plugin's interview flow.

Aron Prins gets prominent credit in README + has been offered co-maintainership (see `COLLAB.md` in this project for outreach draft). Build with the assumption Aron may join the project as a maintainer; structure the codebase so his contributions integrate cleanly.

## Goals

1. Founders running Paperclip companies have a single in-app surface for strategic + operational guidance across the company lifecycle.
2. Paperclip-schema-native: no founder Claude Code session, no SSH, no heredoc quoting, no dual-path agent instruction rediscovery.
3. Each mode produces structured deliverables (VISION.md, drift report, action queue, calibration brief) directly into Paperclip as `documents`, `issues`, `issue_comments`.
4. Apply step queues `agent_wakeup_requests` so changes land on next heartbeat without manual cron waiting.

## Mode taxonomy

| Mode | Trigger | Outputs |
|---|---|---|
| **Found** | No `docs/VISION.md`, no agents | VISION.md, BOOTSTRAP.md (if needed), agent provisioning per chosen preset, kickoff issues |
| **Assess** | VISION exists, agents heartbeating | Drift report, per-area calibration brief, optional VISION amendments |
| **Revive** | VISION exists, no recent heartbeats, blockers piling | Diagnostic report, founder-action queue, sample-pivot if applicable |
| **Reposition** | Healthy + Founder-initiated strategic shift | Targeted VISION amendments, brand/voice/scope deltas, cascade plan |

Mode auto-detects on plugin open. Founder can override. Free-form chat input ("competitor showed up, need to rebrand") routes to the right mode via classifier.

## Architecture

```
plugin entry (sidebar)
  ↓
inventory step  (DB + filesystem + git → snapshot doc shown to founder)
  ↓
mode detection  (auto + user override)
  ↓
mode-specific flow
  ↓
inline preview  (founder edits proposed changes)
  ↓
apply step  (writes natively: documents, agents, issues, comments, wakeups)
  ↓
engagement memory persisted  (per-company plugin state across sessions)
```

Each mode shares: chat surface, manual surface, inventory, inline-preview, apply, wakeup. Plugin handles dual-path agent instruction storage automatically.

## What to inherit from each source

### From Company Wizard (TypeScript fork)

- Plugin manifest + Paperclip plugin integration patterns
- Sidebar entry + main panel + chat panel UX shells
- Preset library (`fast`, `quality`, `startup`, `secure`, `gtm`, `launch-mvp`, `repo-maintenance`, etc.) — keep all
- Module system + role fallback logic — keep
- AI mode + manual mode toggle — keep
- Inline file editing before apply — keep
- Provisioning code that calls Paperclip API — keep
- npm packaging conventions — keep

### From Paperclip Vision (port markdown content into plugin code)

Read `https://github.com/aronprins/paperclip-vision/blob/main/SKILL.md` and `https://github.com/aronprins/paperclip-vision/tree/main/references` and port:

- Strategic interview structure (6 sections covering big picture, revenue & customers, growth & marketing, product direction, CEO autonomy, vision & identity) — replaces wizard's lighter interview in `Found` mode
- VISION.md template structure (mission, 12-mo goal, 3-yr vision, target customer, voice, issue structure, locality, revenue model, launch plan, trust governance, growth strategy, sales model, product direction, org structure, operating philosophy, CEO mandate, principles, amendment protocol, success criteria) — port as the VISION.md generator output
- Amendment Protocol (default-NO, dated changelog entry on YES) — port as default section in every generated VISION.md
- Research → Plan → Execute operating philosophy — port as default section
- Audience model framing (primary / secondary / representative reader) — port into interview prompts
- Voice / red lines / principles articulation patterns — port

### Drop from Paperclip Vision

- Step-0 folder-scan logic (replaced by deeper inventory step)
- `bootstrap-template.md` (CEO_BOOTSTRAP.md) — Paperclip already has its own bootstrap mechanism via `BOOTSTRAP.md` + Wizard provisioning; the standalone CEO bootstrap doc was redundant

### Net new (no precedent)

- Mode detection logic (Found / Assess / Revive / Reposition)
- Inventory step that reads DB + filesystem + git natively
- Drift report generator (compares VISION sections vs recent agent activity)
- Revival diagnostic flowchart (single-blocker / drift / governance loop / dead agent → unblock recommendation)
- Sample-pivot pattern (reframe existing work as samples for critique pass; build production fresh under calibrated standard)
- Founder-action queue (single doc enumerating Founder's blocking actions in priority order)
- Engagement memory (per-company persisted plugin state)
- Dual-path agent instruction awareness (read `agents.adapter_config->>'instructionsBundleMode'`; route writes to external path or UUID-based managed path accordingly)
- Scheduled strategic check-ins via Paperclip routines

## Paperclip schema cheatsheet (you will need this)

```sql
-- Core tables for inventory + write operations:
agents (id, company_id, name, role, title, status, reports_to,
        adapter_config jsonb, last_heartbeat_at)
  └── adapter_config->>'instructionsBundleMode': 'managed' | NULL (external)
  └── adapter_config->>'instructionsFilePath': absolute path to AGENTS.md
  └── adapter_config->>'instructionsRootPath': dir containing AGENTS/SOUL/HEARTBEAT/TOOLS/skills

issues (id, company_id, project_id, goal_id, title, description, status,
        priority, assignee_agent_id, issue_number, identifier, created_by_user_id)

issue_comments (id, company_id, issue_id, author_agent_id, author_user_id, body)

issue_documents (id, company_id, issue_id, document_id, key)

documents (id, company_id, title, latest_body, latest_revision_id)

company_secrets (id, company_id, name, provider, description)
  └── values stored encrypted; access via Paperclip secret API, not SELECT

approvals (id, company_id, type, requested_by_agent_id, status, payload jsonb,
           decision_note, decided_by_user_id, decided_at)

agent_wakeup_requests (id, company_id, agent_id, source, trigger_detail, reason,
                       requested_by_actor_type, requested_by_actor_id,
                       idempotency_key, status)

routines (id, company_id, project_id, title, description, assignee_agent_id,
          schedule cron, status)
```

Critical patterns:

- **Dual-path agent instructions:** managed mode reads from UUID-based path under `/companies/<co-uuid>/agents/<agent-uuid>/instructions/`. External mode reads from a friendly path the agent's `adapter_config.instructionsRootPath` specifies. Plugin must always inspect `adapter_config` to know which to write.
- **Issue identifiers:** company-scoped sequential, format `<SLUG>-NNN` (e.g., `CAN-198`). Compute next number via `MAX(issue_number) + 1` for the company.
- **Wakeup queueing:** insert into `agent_wakeup_requests` with `status='queued'`, an `idempotency_key`, and a `reason`. Paperclip's heartbeat poller picks up.
- **Document linkage:** `documents` is the content; `issue_documents` links a document to an issue with a `key`. UI surfaces docs via `/CAN/issues/CAN-NN#document-<key>` URLs.

## Build milestones (each shippable as its own PR)

### Milestone 1 — Skeleton + Inventory + Mode Detection (read-only)

Fork company-wizard. Rename to compass. Add Mode detection logic. Add inventory step that reads DB + filesystem + git and renders a snapshot. **No write actions yet.** Ship as a diagnostic dashboard founders can use to see their company's current state.

Acceptance:
- Plugin installs via npm into Paperclip
- Sidebar entry "Compass" opens main panel
- Main panel auto-detects mode (Found / Assess / Revive / Reposition) on the active company and shows the inventory snapshot
- Founder can override mode classification
- No DB writes happen in this milestone

### Milestone 2 — Found mode

Port vision-quest interview structure into the `Found` flow. Replace wizard's lighter interview. Generate VISION.md draft with full vision-quest structure (mission / audience / voice / issue structure / locality / revenue / launch plan / trust governance / growth / sales / product / org / operating philosophy / mandate / principles / amendment protocol / success criteria). Inline preview before apply. Apply writes VISION.md, provisions agents per chosen preset, creates kickoff issues, queues wakeups.

Acceptance:
- New empty company can be founded from chat or manual mode
- Generated VISION.md matches vision-quest structure
- Agents provisioned per selected preset
- All wakeups queued so company starts heartbeating immediately

### Milestone 3 — Assess mode

Build drift report generator. Compare VISION sections vs recent agent activity (last 30 days of issues, comments, edition outputs, etc.). Surface drift items in chat with proposed amendments. Founder confirms or pushes back. Apply writes VISION amendments + cascades changes to relevant agents.

Acceptance:
- Active companies can run a drift review on demand
- Drift report identifies gaps between VISION and observed behavior
- Amendment proposals route through Amendment Protocol (CEO review → founder approval)
- Cascade plan generates downstream issues for affected pods

### Milestone 4 — Revive mode

Build revival diagnostic flowchart (single-blocker / strategic drift / broken integration / governance loop / dead agent). Auto-classify based on inventory. Propose unblocks. Implement sample-pivot pattern as one-click action ("treat existing drafts as samples for critique pass"). Generate founder-action queue.

Acceptance:
- Stalled companies can run revival diagnostic
- Plugin classifies stall cause and proposes specific unblocks
- Sample-pivot reframes existing work as samples + creates critique-pass issue
- Founder-action queue enumerates blocking items in priority order

### Milestone 5 — Reposition mode

Lightest version of vision-quest re-run scoped to deltas. Founder describes the strategic shift; plugin proposes targeted VISION amendments + brand/voice/scope cascade plan. Apply runs through Amendment Protocol.

Acceptance:
- Healthy companies can run a Reposition pass
- Output is targeted (only the changed sections) not a full vision rewrite
- Cascade plan covers brand/voice/structure changes across affected pods

### Milestone 6 — Engagement memory + scheduled check-ins

Add per-company persisted plugin state (last engagement date, prior findings, open recommendations). Add ability to schedule recurring strategic check-ins via Paperclip routines (quarterly drift review, monthly trust-gate review).

Acceptance:
- Plugin remembers prior engagement findings across sessions
- Routines can be scheduled to auto-trigger Assess or Revive mode periodically
- Findings surface as a per-company "history" tab in the plugin UI

## Coding guidance

- Match company-wizard's TypeScript + React conventions
- Use Paperclip's plugin API for all DB writes — never direct SQL from plugin code
- For SOUL.md / AGENTS.md / HEARTBEAT.md / TOOLS.md content generation, use markdown templates parameterized by interview answers
- Validation gates: pre-apply, plugin runs the vision-quest "Quality Checklist" (every section populated, no placeholders, mandate complete, etc.)
- Tests: unit tests on mode detection, drift detection, sample-pivot logic. Integration tests via mock Paperclip API.
- Conventional commits format. Reference issues on the plugin repo.

## Don't do

- Don't read `company_secrets` values directly — only key names. Paperclip's secret API handles values.
- Don't write to `/agents/<role>/` filesystem paths for managed-mode agents. Always check `adapter_config.instructionsBundleMode` and route accordingly.
- Don't queue wakeups without an `idempotency_key`. Causes duplicates on retry.
- Don't auto-edit VISION.md without Founder approval. Even in apply step, surface a final "you are about to commit this — confirm" gate.
- Don't ship Milestone N without Milestone N-1 acceptance criteria green.

## When stuck

If you discover schema or API surfaces this prompt didn't anticipate, document them in `SCHEMA.md` for future iterations. If a design question lands without a clear answer, propose 2-3 options with tradeoffs and ping the founder before deciding.

## Repository setup

- Create new repository: `paperclip-plugin-compass` (or whatever working name lands; confirm with founder before pushing)
- Initial commit: README + PROMPT (this file) + COLLAB outreach + license (MIT)
- Push to GitHub under founder's account or new org
- Open issue against `aronprins/paperclip-vision` linking to this repo and the COLLAB outreach
- Open issue against `yesterday-ai/paperclip-plugin-company-wizard` thanking them for the plugin shell + linking to this repo

## First task

Begin Milestone 1. Fork company-wizard locally, rename, get the plugin loading in a development Paperclip instance with the new sidebar entry. Don't start coding modes until the shell loads cleanly.
