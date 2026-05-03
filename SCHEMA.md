# Paperclip Schema Assumptions

This document outlines the Paperclip database schema Compass depends on. Use this as a reference if the plugin fails on a new Paperclip version.

## Minimum Requirements

- **Paperclip SDK Version:** v1.0.0 or later
- **Paperclip Host Version:** 1.0.0 or later (plugin API v1 support required)

## Tables and Fields

Compass interacts with the following Paperclip tables via the Plugin SDK (never direct Postgres):

### agents

**Purpose:** AI agents provisioned in the company.

**Required fields:**
- `id` (string, primary key)
- `role` (string) — e.g., "CEO", "CMO", "Engineer"
- `status` (string) — e.g., "active", "paused", "archived"
- `last_heartbeat_at` (timestamp, nullable) — most recent agent heartbeat
- `adapter_config` (JSON, nullable) — contains `instructionsBundleMode` (enum: 'managed' | null) for dual-path instructions

**Optional fields (read if present, not required):**
- `name` (string)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**SDK Access:** `ctx.agents.list()` — returns agents for the company scope

---

### issues

**Purpose:** Operational issues and blockers.

**Required fields:**
- `id` (string, primary key)
- `identifier` (string) — user-facing issue ID (e.g., "ACME-001")
- `title` (string)
- `status` (string) — e.g., "open", "blocked", "resolved", "closed"
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Optional fields:**
- `description` (text)
- `assignee_agent_id` (string, nullable)

**SDK Access:** `ctx.issues.list()` — returns issues for the company scope

---

### documents

**Purpose:** Long-form documents (VISION.md, engagement memory, etc.).

**Required fields:**
- `id` (string, primary key)
- `title` (string) — document name (e.g., "VISION.md", "compass-engagement-history")
- `latest_body` (text) — most recent document content
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Optional fields:**
- `version` (integer) — version number
- `author_agent_id` (string, nullable)

**SDK Access:** `ctx.documents.list()` — returns documents for the company scope

**Special handling in Compass:**
- VISION.md detection: looks for `title === "VISION.md"` (case-insensitive)
- Engagement memory: stored as `compass-engagement-history` document (M6+)

---

### approvals (Phase 2+)

**Purpose:** Two-stage approval routing for amendments.

**Required fields:**
- `id` (string, primary key)
- `type` (string) — e.g., "vision_amendment", "agent_provision"
- `status` (string) — e.g., "pending", "approved", "rejected"
- `payload` (JSON) — proposed change details
- `decided_by_user_id` (string, nullable) — founder's decision

**SDK Access:** `ctx.approvals.list()`, `ctx.approvals.create()`, `ctx.approvals.update()`

---

### agent_wakeup_requests (Phase 2+)

**Purpose:** Idempotent heartbeat queue for founder-triggered agent actions.

**Required fields:**
- `id` (string, primary key)
- `agent_id` (string)
- `idempotency_key` (string, unique per agent) — prevents duplicate wakeups on retry
- `status` (string) — e.g., "queued", "executed", "failed"
- `created_at` (timestamp)

**SDK Access:** `ctx.agentWakeupRequests.create()`, `ctx.agentWakeupRequests.list()`

---

### routines (Phase 6+)

**Purpose:** Scheduled check-in tasks (e.g., monthly strategic reviews).

**Required fields:**
- `id` (string, primary key)
- `title` (string)
- `schedule` (string) — cron or human-readable (e.g., "monthly", "quarterly")
- `status` (string) — e.g., "active", "paused"
- `created_at` (timestamp)

**SDK Access:** `ctx.routines.list()`, `ctx.routines.create()`

---

## Schema Validation

Compass runs a schema validation smoke query on plugin startup (decision D-08). This query tests:

```typescript
await Promise.all([
  ctx.agents.list(),
  ctx.issues.list(),
  ctx.documents.list(),
]);
```

If any query fails, the plugin exits with a founder-readable error:

```
Compass requires Paperclip SDK v1.0.0+. Validation failed: {error.message}. See SCHEMA.md.
```

To debug:

1. Check the full error message in Paperclip logs
2. Verify your Paperclip version matches the minimum requirement
3. Confirm you have agent/issue/document access via the plugin manifest capabilities
4. Contact maintainers if the issue persists

## Phase-Specific Requirements

### Phase 1 (Read-Only)

Only reads: `agents.list()`, `issues.list()`, `documents.list()`

### Phase 2+ (Writes)

Adds: `documents.create()`, `documents.update()`, `agents.create()`, `issues.create()`, `approvals.create()`

See decision D-19 (XC-01) — all writes route through `src/sdk/adapter.ts` chokepoint.

---

**Last updated:** 2026-05-03 (Phase 1 Execution)
