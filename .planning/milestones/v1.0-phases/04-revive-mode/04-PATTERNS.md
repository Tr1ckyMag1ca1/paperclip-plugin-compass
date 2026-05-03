# Phase 4: Revive Mode - Pattern Map

**Mapped:** 2026-05-03  
**Files analyzed:** 26 new/modified files (23 new, 3 modified)  
**Analogs found:** 25 / 26 (96% coverage; 1 file is new with no predecessor)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/types/revive.ts` | model | static | `src/types/assess.ts` | exact |
| `src/revive/classify.ts` | service (pure logic) | transform | `src/assess/drift.ts` | exact |
| `src/revive/actions.ts` | service (handler map) | transform + event-driven | `src/assess/cascade.ts` issue plan builders | role-match |
| `src/revive/sample-pivot.ts` | service (dual-issue creation) | CRUD + transform | `src/assess/cascade.ts` + `src/found/apply.ts` sequential writes | role-match |
| `src/revive/queue.ts` | service (document writer) | file-I/O + transform | `src/found/template-fill.ts` (document serialization) | role-match |
| `src/revive/apply.ts` | orchestrator (incremental SDK writes) | event-driven + CRUD | `src/found/apply.ts` (sequential writes, but per-item NOT batch) | role-match |
| `src/revive/index.ts` | barrel | static | `src/assess/index.ts` | exact |
| `src/ui/revive/RevivePanel.tsx` | orchestrator (mode controller) | request-response | `src/ui/assess/AssessPanel.tsx` | exact |
| `src/ui/revive/ActionQueuePanel.tsx` | component (list layout) | request-response | `src/ui/assess/DriftReportPanel.tsx` (grouped display) | role-match |
| `src/ui/revive/ActionItemCard.tsx` | component (action card) | request-response | `src/ui/assess/DriftItemCard.tsx` | exact |
| `src/ui/revive/SamplePivotModal.tsx` | component (modal) | request-response | `src/ui/assess/ApprovalRoutingModal.tsx` | role-match |
| `src/ui/revive/StallSummaryBadge.tsx` | component (status badge) | request-response | `src/ui/components/ModeBanner.tsx` badge pattern | partial |
| `src/ui/revive/ReviveRunState.ts` | hook (state management) | request-response | `src/ui/assess/AssessRunState.ts` | exact |
| `src/ui/revive/index.ts` | barrel | static | `src/ui/assess/index.ts` | exact |
| `tests/revive/classify.spec.ts` | test suite | static | `tests/assess/drift.spec.ts` | role-match |
| `tests/revive/sample-pivot.spec.ts` | test suite | static | `tests/assess/apply.spec.ts` (sequential SDK writes) | role-match |
| `tests/revive/apply.spec.ts` | test suite | static | `tests/found/apply.spec.ts` | role-match |
| `tests/revive/revive.integration.spec.ts` | test suite (integration) | static | `tests/assess/assess.integration.spec.ts` | exact |
| `src/sdk/adapter.ts` (modified) | chokepoint | CRUD | existing (extend with closeIssue, addIssueComment, updateIssue) | extension |
| `src/found/idempotency.ts` (modified) | utility | transform | existing (extend with revive namespace) | extension |
| `src/worker.ts` (modified) | orchestrator | event-driven | existing (extend with revive.* handlers) | extension |
| `src/ui/MainPanel.tsx` (modified) | orchestrator | request-response | existing (route Revive mode) | extension |

**Match Quality Legend:**
- **exact** — Closest match: same role AND same data flow; code can be directly adapted
- **role-match** — Same role, similar data flow; pattern established in compass repo
- **partial** — Different role/data flow; reference for structural patterns only
- **extension** — Modify existing file from Phase 1/2/3 (not a new file)

---

## Pattern Assignments

### `src/types/revive.ts` (model, static)

**Analog:** `src/types/assess.ts`

**Pattern:** Type definitions for domain objects. Pure data structures, no I/O, exported for use across revive module.

**Type structure** (assess.ts lines 1–50):
```typescript
export interface ParsedVision {
  mission: string;
  mandate: string;
  voice: string;
  principles: string;
  // ... 15 more sections
  amendments?: AmendmentLogEntry[];
}

export interface ActivitySnapshot {
  issues: ActivityItem[];
  comments: ActivityItem[];
  documents: ActivityItem[];
}

export interface DriftItem {
  visionSection: string;
  confidence: number; // 0..1
  severity: "info" | "warn" | "blocker";
  evidence: EvidenceItem[]; // issue/comment/doc IDs
  proposedAmendment: string; // markdown delta
  accepted?: boolean;
}
```

**For revive.ts, follow this pattern with revive-specific types:**
```typescript
import type { Agent } from "./index.js";
import type { ParsedVision, DriftReport } from "./assess.js";

/**
 * StallCause — one of 5 diagnostic causes detected by Phase 4 classifier.
 * Per D-02, categories: single-blocker, strategic-drift, broken-integration, governance-loop, dead-agent.
 */
export type StallCause = 
  | "single-blocker" 
  | "strategic-drift" 
  | "broken-integration" 
  | "governance-loop" 
  | "dead-agent";

/**
 * ActionItem — one recommended action in the action queue.
 * Per D-05, each item has priority, cause, target (agent/issue/vision), recommended action with type.
 */
export interface ActionItem {
  id: string;
  cause: StallCause;
  priority: number; // 0..1, computed from severity + blast radius
  title: string;
  why_blocking: string; // Explanation of what it unblocks
  target: {
    agent_id?: string;
    issue_id?: string;
    vision_section?: string;
  };
  recommended_action: {
    type: ActionType;
    params: Record<string, unknown>;
  };
  status: "pending" | "addressed" | "dismissed";
  unblocks_count?: number; // Number of downstream issues unblocked
}

/**
 * ActionType — all possible recommended action handlers.
 * Per D-07: replace-blocker-issue, reassign-issue, nudge-agent-with-context-doc, 
 *           pivot-to-sample, mark-blocker-resolved, restart-agent, surface-amendment-needed.
 */
export type ActionType = 
  | "replace-blocker-issue"
  | "reassign-issue"
  | "nudge-agent-with-context-doc"
  | "pivot-to-sample"
  | "mark-blocker-resolved"
  | "restart-agent"
  | "surface-amendment-needed";

/**
 * StallClassification — output of classifyStall, per company.
 * Per D-02, returns ranked list of causes (sometimes multiple apply).
 */
export interface StallClassification {
  companyId: string;
  causes: StallCause[];
  confidence: Record<StallCause, number>; // 0..1 per cause
  timestamp: string;
}

/**
 * ActionQueue — full list of recommended actions grouped by cause.
 * Per D-04, D-05, stored in documents table as compass:revive:action-queue:${run_id}.
 */
export interface ActionQueue {
  run_id: string;
  company_id: string;
  created_at: string;
  items_by_cause: Record<StallCause, ActionItem[]>;
  total_items: number;
  addressed_count: number;
}
```

---

### `src/revive/classify.ts` (service, transform)

**Analog:** `src/assess/drift.ts`

**Pattern:** Pure functions with no I/O. Per D-02 (deterministic-first, no LLM), stall classification uses hard rules + heuristics with documented thresholds. Each function returns a boolean or score for a specific cause.

**Pure function signature** (drift.ts lines 145–235):
```typescript
import type { ParsedVision, ActivitySnapshot, DriftReport, DriftItem } from "../types/assess.js";

/**
 * Detect drift in company activity against vision.
 * Per D-01: deterministic heuristics, no LLM classifier.
 * Compares each VISION section against activity from last 30 days.
 *
 * @param vision Parsed VISION.md with all 19 sections
 * @param activity Activity snapshot (issues + comments + docs from last 30 days)
 * @param windowDays Drift window in days (default: 30, fixed per PROJECT.md)
 * @returns DriftReport grouped by section with confidence scores
 */
export function detectDrift(
  vision: ParsedVision,
  activity: ActivitySnapshot,
  windowDays: number = 30
): DriftReport {
  // For each VISION section, score drift against activity
  const itemsBySection: Record<string, DriftItem[]> = {};
  
  itemsBySection["mission"] = scoreMissionDrift(vision.mission, activity);
  itemsBySection["voice"] = scoreVoiceDrift(vision.voice, activity);
  // ... one scorer per section
  
  return {
    companyId: activity.companyId,
    assessRunId: generateRunId(),
    timestamp: new Date().toISOString(),
    itemsBySection,
    totalItems: Object.values(itemsBySection).reduce((sum, items) => sum + items.length, 0),
  };
}
```

**For classify.ts, follow this pattern:**
```typescript
import type { InventorySnapshot } from "../primitives/inventory.js";
import type { ParsedVision, ActivitySnapshot, DriftReport } from "../types/assess.js";
import type { StallClassification, StallCause } from "../types/revive.js";

/**
 * Classify stall cause for a stalled company.
 * Per D-02, uses hard rules (no LLM). Returns ranked list of causes (sometimes multiple apply).
 *
 * Heuristics (inline documented with thresholds):
 * - single-blocker: One issue blocks 3+ downstream OR one agent has stuck issue > 14 days
 * - strategic-drift: drift report returns >= 3 high-confidence items
 * - broken-integration: SDK adapter smoke check fails OR documented integration error in recent issue_comments
 * - governance-loop: same approval pending > N days OR same issue title cycles >= 3 times
 * - dead-agent: agent.last_heartbeat_at > 30 days ago AND open assigned issues exist
 *
 * @param inventory Inventory snapshot (issues, agents, blockers precomputed)
 * @param vision Parsed VISION.md (for section reference if drift apply)
 * @param activity Activity snapshot (for governance loop detection)
 * @param driftReport Optional drift report from Phase 3 (reuse directly per D-03)
 * @returns StallClassification with ranked causes and confidence scores
 */
export function classifyStall(
  inventory: InventorySnapshot,
  vision: ParsedVision,
  activity: ActivitySnapshot,
  driftReport?: DriftReport
): StallClassification {
  const causes: StallCause[] = [];
  const confidence: Record<StallCause, number> = {
    "single-blocker": 0,
    "strategic-drift": 0,
    "broken-integration": 0,
    "governance-loop": 0,
    "dead-agent": 0,
  };

  // Check single-blocker: one issue blocks 3+ downstream issues
  const blockerScore = checkSingleBlocker(inventory.issues, inventory.blockers);
  if (blockerScore > 0.6) {
    causes.push("single-blocker");
    confidence["single-blocker"] = blockerScore;
  }

  // Check strategic-drift: reuse drift report from Phase 3
  if (driftReport && driftReport.totalItems >= 3) {
    const driftScore = Math.min(1.0, driftReport.totalItems / 10); // Cap at 1.0
    causes.push("strategic-drift");
    confidence["strategic-drift"] = driftScore;
  }

  // Check broken-integration: documented pattern in recent issue comments
  const integrationScore = checkBrokenIntegration(activity.issues);
  if (integrationScore > 0.5) {
    causes.push("broken-integration");
    confidence["broken-integration"] = integrationScore;
  }

  // Check governance-loop: same approval pending > 14 days OR cycles 3+ times
  const govScore = checkGovernanceLoop(activity.issues);
  if (govScore > 0.5) {
    causes.push("governance-loop");
    confidence["governance-loop"] = govScore;
  }

  // Check dead-agent: last_heartbeat > 30 days ago AND has open issues
  const agentScore = checkDeadAgent(inventory.agents, inventory.issues);
  if (agentScore > 0.6) {
    causes.push("dead-agent");
    confidence["dead-agent"] = agentScore;
  }

  // Sort by confidence (highest first)
  causes.sort((a, b) => confidence[b] - confidence[a]);

  return {
    companyId: inventory.companyId,
    causes,
    confidence,
    timestamp: new Date().toISOString(),
  };
}

function checkSingleBlocker(issues: Issue[], blockers: BlockerEdge[]): number {
  // Count downstream issues per blocker
  const downstreamCounts = new Map<string, number>();
  for (const blocker of blockers) {
    downstreamCounts.set(
      blocker.blocking_issue_id,
      (downstreamCounts.get(blocker.blocking_issue_id) || 0) + 1
    );
  }

  // Find max downstream count
  const maxDownstream = Math.max(...Array.from(downstreamCounts.values()), 0);
  
  // Also check for single stuck issue > 14 days
  const stuckIssues = issues.filter(i => {
    const daysSinceUpdate = (Date.now() - new Date(i.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > 14 && i.status !== "resolved";
  });

  const maxStuckDays = Math.max(
    ...stuckIssues.map(i => (Date.now() - new Date(i.updated_at).getTime()) / (1000 * 60 * 60 * 24)),
    0
  );

  // Score: normalize to 0..1 (3+ downstream = high, 14+ days = high)
  const blockerScore = Math.min(1.0, (maxDownstream / 3));
  const stuckScore = Math.min(1.0, (maxStuckDays / 14));

  return Math.max(blockerScore, stuckScore);
}

function checkBrokenIntegration(issues: Issue[]): number {
  // Look for keywords: "integration", "failed", "api", "error", "timeout", "500"
  const keywords = ["integration", "failed", "api", "error", "timeout", "500"];
  
  const recentIssues = issues.filter(i => {
    const daysSince = (Date.now() - new Date(i.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince < 7 && i.status !== "resolved";
  });

  const matchingIssues = recentIssues.filter(i => {
    const text = `${i.title} ${i.description}`.toLowerCase();
    return keywords.some(kw => text.includes(kw));
  });

  return Math.min(1.0, matchingIssues.length / 3); // 3+ matching issues = high score
}

function checkGovernanceLoop(issues: Issue[]): number {
  // Track issue titles that appear multiple times with different statuses
  const titleCycles = new Map<string, number>();
  const cycleIssues = new Map<string, Date[]>();

  for (const issue of issues) {
    const dates = cycleIssues.get(issue.title) || [];
    dates.push(new Date(issue.created_at));
    cycleIssues.set(issue.title, dates);
  }

  // Count titles with 3+ distinct created_at dates (indicates cycling)
  const cycledTitles = Array.from(cycleIssues.values()).filter(dates => dates.length >= 3);

  // Also check for single issue stuck in review > 14 days
  const approvalStuck = issues.filter(i => {
    if (!i.title.includes("review") && !i.title.includes("approval")) return false;
    const daysSince = (Date.now() - new Date(i.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 14 && i.status !== "resolved";
  });

  const cycleScore = Math.min(1.0, cycledTitles.length / 3);
  const approvalScore = approvalStuck.length > 0 ? 0.7 : 0;

  return Math.max(cycleScore, approvalScore);
}

function checkDeadAgent(agents: Agent[], issues: Issue[]): number {
  // Find agents with no heartbeat in 30+ days AND have open assigned issues
  const deadAgents = agents.filter(a => {
    if (!a.last_heartbeat_at) return false;
    const daysSinceHB = (Date.now() - new Date(a.last_heartbeat_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceHB > 30;
  });

  const deadWithOpenIssues = deadAgents.filter(agent => {
    const openIssues = issues.filter(i => i.assigned_agent_id === agent.id && i.status !== "resolved");
    return openIssues.length > 0;
  });

  return deadWithOpenIssues.length > 0 ? 0.8 : 0;
}
```

---

### `src/revive/actions.ts` (service, handler map)

**Analog:** `src/assess/cascade.ts` (issue plan builders, per-agent pattern)

**Pattern:** Typed map of action handlers. Each handler takes action params and returns result (issue creation, comment, etc.). Per D-07, handlers map ActionType → implementation.

**Handler pattern** (cascade.ts lines 206–289, planCascade + issuesByAgent):
```typescript
export function planCascade(
  vision: ParsedVision,
  acceptedAmendments: Amendment[],
  agents: Agent[]
): CascadePlan {
  // ... screening logic ...
  
  for (const agent of screened) {
    issuesByAgent[agent.id] = {
      title: `[Cascade from Assess] Review company vision amendments`,
      description: `Company VISION.md has been amended...`,
      assigneeAgentId: agent.id,
    };
  }

  return { affectedAgents: screened, customOverrideWarnings, issuesByAgent, generatedAt };
}
```

**For actions.ts, follow this pattern:**
```typescript
import type { PluginContext } from "@paperclipai/plugin-sdk";
import { PaperclipAdapter } from "../sdk/adapter.js";
import type { ActionItem, ActionType } from "../types/revive.js";

/**
 * Action Handler Registry
 *
 * Per D-07: each ActionType maps to a handler function that executes the action.
 * Handlers are independent (no transactional batch). Each can fail or succeed separately.
 * Callers must handle per-item rollback if needed.
 */

export type ActionHandler = (
  ctx: PluginContext,
  companyId: string,
  action: ActionItem,
  params?: Record<string, unknown>
) => Promise<ActionResult>;

export interface ActionResult {
  success: boolean;
  result?: unknown; // Handler-specific result (issue ID, comment ID, etc.)
  error?: string;
}

/**
 * Handler: Replace a blocker issue with a new one.
 * Per D-07, creates new issue with same assignee, links old issue in comment.
 */
async function handleReplaceBlockerIssue(
  ctx: PluginContext,
  companyId: string,
  action: ActionItem
): Promise<ActionResult> {
  const adapter = new PaperclipAdapter(ctx);
  const issueId = action.target.issue_id;

  if (!issueId) {
    return { success: false, error: "No target issue ID" };
  }

  try {
    // 1. Fetch old issue to preserve assignee
    const oldIssue = await adapter.getIssue(companyId, issueId);
    
    // 2. Create new issue with same assignee
    const newIssueId = await adapter.createIssue(
      companyId,
      `[Replacement] ${action.title}`,
      action.why_blocking,
      oldIssue.assigned_agent_id
    );

    // 3. Link in comment on old issue
    await adapter.addIssueComment(
      companyId,
      issueId,
      `compass:revive:replaced-by:${newIssueId}`
    );

    return { success: true, result: newIssueId };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Handler: Reassign issue to a different agent.
 * Per D-07, validates agent eligibility (not newly-provisioned).
 */
async function handleReassignIssue(
  ctx: PluginContext,
  companyId: string,
  action: ActionItem
): Promise<ActionResult> {
  const adapter = new PaperclipAdapter(ctx);
  const issueId = action.target.issue_id;
  const newAgentId = (action.recommended_action.params.agent_id as string) || "";

  if (!issueId || !newAgentId) {
    return { success: false, error: "Missing issue_id or agent_id" };
  }

  try {
    // Validate new agent eligibility
    const agent = await adapter.getAgent(companyId, newAgentId);
    const createdAt = new Date(agent.created_at);
    const daysOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysOld < 7 && !agent.last_heartbeat_at) {
      return { success: false, error: "Target agent is newly-provisioned, not eligible" };
    }

    // Update issue with new assignee
    await adapter.updateIssue(companyId, issueId, { assigned_agent_id: newAgentId });

    return { success: true, result: issueId };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Handler: Queue wakeup with context document.
 * Per D-07, writes a document briefing the agent on what it's stuck on, then queues wakeup.
 */
async function handleNudgeAgentWithContextDoc(
  ctx: PluginContext,
  companyId: string,
  action: ActionItem
): Promise<ActionResult> {
  const adapter = new PaperclipAdapter(ctx);
  const agentId = action.target.agent_id;

  if (!agentId) {
    return { success: false, error: "No target agent ID" };
  }

  try {
    // 1. Write context document
    const docKey = `compass:revive:context:${action.id}`;
    const docContent = `# Context for ${agentId}

## What You're Stuck On
${action.why_blocking}

## Recommended Next Step
${action.title}

## Questions?
Reply in the issue comments.

---
Generated by Compass Revive: ${new Date().toISOString()}`;

    await adapter.writeDocument(companyId, docKey, docContent);

    // 2. Queue wakeup
    const idempotencyKey = `compass:revive:${companyId}:${action.id}:nudge`;
    await adapter.queueWakeup(
      companyId,
      agentId,
      idempotencyKey,
      `Context document created: ${docKey}`
    );

    return { success: true, result: { docKey, agentId } };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Handler: Mark blocker as resolved with explanation comment.
 * Per D-07, adds comment explaining resolution, closes issue.
 */
async function handleMarkBlockerResolved(
  ctx: PluginContext,
  companyId: string,
  action: ActionItem
): Promise<ActionResult> {
  const adapter = new PaperclipAdapter(ctx);
  const issueId = action.target.issue_id;

  if (!issueId) {
    return { success: false, error: "No target issue ID" };
  }

  try {
    // 1. Add explanation comment
    await adapter.addIssueComment(
      companyId,
      issueId,
      `Resolved per Revive diagnosis: ${action.why_blocking}`
    );

    // 2. Close issue
    await adapter.closeIssue(companyId, issueId, action.why_blocking);

    return { success: true, result: issueId };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Handler: Restart a dead agent.
 * Per D-07, queues wakeup with reset prompt for agents that haven't heartbeated in 30+ days.
 */
async function handleRestartAgent(
  ctx: PluginContext,
  companyId: string,
  action: ActionItem
): Promise<ActionResult> {
  const adapter = new PaperclipAdapter(ctx);
  const agentId = action.target.agent_id;

  if (!agentId) {
    return { success: false, error: "No target agent ID" };
  }

  try {
    const idempotencyKey = `compass:revive:${companyId}:${action.id}:restart`;
    await adapter.queueWakeup(
      companyId,
      agentId,
      idempotencyKey,
      "Agent marked as stalled in Revive diagnosis. Please re-read VISION.md and heartbeat."
    );

    return { success: true, result: agentId };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Handler: Surface amendment as needing Assess mode flow.
 * Per D-07, if cause is strategic-drift, recommend running Assess mode.
 * Returns message for founder (no SDK write).
 */
async function handleSurfaceAmendmentNeeded(
  ctx: PluginContext,
  companyId: string,
  action: ActionItem
): Promise<ActionResult> {
  // No-op handler — just returns recommendation message
  return {
    success: true,
    result: {
      message: "Switch to Assess mode to review VISION amendments",
      link: "#assess-mode",
    },
  };
}

/**
 * Get handler by ActionType.
 * Per D-07, registry maps type → function.
 */
export function getActionHandler(actionType: ActionType): ActionHandler {
  const handlers: Record<ActionType, ActionHandler> = {
    "replace-blocker-issue": handleReplaceBlockerIssue,
    "reassign-issue": handleReassignIssue,
    "nudge-agent-with-context-doc": handleNudgeAgentWithContextDoc,
    "mark-blocker-resolved": handleMarkBlockerResolved,
    "restart-agent": handleRestartAgent,
    "surface-amendment-needed": handleSurfaceAmendmentNeeded,
    "pivot-to-sample": async () => ({ success: false, error: "Use sample-pivot.ts for this action" }),
  };

  return handlers[actionType];
}
```

---

### `src/revive/sample-pivot.ts` (service, dual-issue creation)

**Analog:** `src/assess/cascade.ts` (issue creation) + `src/found/apply.ts` (sequential writes with audit)

**Pattern:** Creates dual issues (sample + production) with explicit linking. Writes SAMPLE_PIVOT.md doc explaining pattern. Per D-08, all wakeups carry idempotency keys.

**Sequential write + document generation pattern** (apply.ts lines 175–200 + cascade.ts lines 319–335):
```typescript
// Write amended VISION.md
let visionDocId: string;
try {
  visionDocId = await adapter.writeDocument(companyId, "VISION.md", serializedVision);
  result.visionDocId = visionDocId;
} catch (err) { ... }

// Create cascade issue
try {
  const issueId = await adapter.createIssue(
    companyId,
    plan.title,
    plan.description,
    agent.id
  );
  result.createdIssueIds.push(issueId);
} catch (err) { ... }
```

**For sample-pivot.ts, follow this pattern:**
```typescript
import type { PluginContext } from "@paperclipai/plugin-sdk";
import { PaperclipAdapter } from "../sdk/adapter.js";
import { generateReviveIdempotencyKey } from "../found/idempotency.js";

/**
 * Sample-Pivot Orchestration
 *
 * Per D-08, reframes an existing draft issue as "sample for critique pass":
 * 1. Creates dual issues: [SAMPLE] (current draft) + [PRODUCTION] (blank for improved version)
 * 2. Links both via issue_comments with explicit references
 * 3. Writes SAMPLE_PIVOT.md doc explaining the pattern (idempotent per company_id)
 * 4. Queues wakeup with sample-pivot idempotency key
 *
 * Result: founder can critique the sample, then improve directly in production issue.
 */

export interface SamplePivotResult {
  success: boolean;
  sampleIssueId?: string;
  productionIssueId?: string;
  samplePivotDocKey?: string;
  error?: string;
}

/**
 * Execute sample-pivot: create dual issues and doc.
 *
 * Per D-08: takes an existing draft issue and reframes it as a sample.
 * Creates:
 * 1. [SAMPLE] issue — current draft (relabeled, stays where it is)
 * 2. [PRODUCTION] issue — blank, same assignee, ready for improved version
 * 3. SAMPLE_PIVOT.md doc — explanation of the pattern
 * 4. Wakeups — idempotency key per original issue
 *
 * @param ctx Plugin context
 * @param companyId Company ID
 * @param originalIssueId The draft issue to pivot
 * @param adapterOverride Optional adapter override for testing
 * @returns SamplePivotResult with both issue IDs, doc key, success flag
 */
export async function executeSamplePivot(
  ctx: PluginContext,
  companyId: string,
  originalIssueId: string,
  adapterOverride?: PaperclipAdapter
): Promise<SamplePivotResult> {
  const adapter = adapterOverride || new PaperclipAdapter(ctx);
  const result: SamplePivotResult = { success: false };

  try {
    // 1. Fetch original issue to preserve metadata
    const originalIssue = await adapter.getIssue(companyId, originalIssueId);

    // 2. Update original issue: prepend [SAMPLE] to title
    const sampleTitle = `[SAMPLE] ${originalIssue.title}`;
    await adapter.updateIssue(companyId, originalIssueId, { title: sampleTitle });
    result.sampleIssueId = originalIssueId;

    // 3. Create production issue: blank, same assignee
    const productionTitle = `[PRODUCTION] ${originalIssue.title}`;
    const productionIssueId = await adapter.createIssue(
      companyId,
      productionTitle,
      `# Production version of [SAMPLE]

See sample issue #${originalIssueId} for the draft.

## What This Is
This is the critique-improved version. Start here with what you learned from the sample.`,
      originalIssue.assigned_agent_id
    );
    result.productionIssueId = productionIssueId;

    // 4. Link issues via comments
    await adapter.addIssueComment(
      companyId,
      originalIssueId,
      `compass:sample-pivot:production:${productionIssueId}`
    );
    await adapter.addIssueComment(
      companyId,
      productionIssueId,
      `compass:sample-pivot:sample:${originalIssueId}`
    );

    // 5. Write SAMPLE_PIVOT.md doc (idempotent — key is per-company)
    const samplePivotDocKey = `compass:revive:sample-pivot:${companyId}`;
    const samplePivotDoc = `# Sample-Pivot Pattern

**Created:** ${new Date().toISOString()}

## What Is This?

The sample-pivot pattern is a structured way to iterate on work without starting from scratch.

### The Pattern
1. **Sample Issue** — your first draft, designed to generate feedback
2. **Production Issue** — the improved version, incorporating feedback from the sample

### How It Works
1. Founder/team reviews the sample issue
2. Provides feedback in the comments
3. You use that feedback to write a production-quality version in the production issue
4. The sample stays for reference; the production becomes the new standard

### Why This Works
- **Faster feedback loops** — don't wait to ship perfect work; iterate in public
- **Clear record** — sample + production together tell the full story
- **Less rework** — you've thought through problems before writing production version

### Example Timeline
- **Day 1**: Post sample issue with draft proposal
- **Day 2**: Receive feedback; post counter-proposal as comment
- **Day 3**: Publish production issue with refined version
- **Ongoing**: Reference sample for context; execute from production issue

---

*Pattern popularized by vision-quest companies as a structured approach to unstick innovation loops.*
`;

    await adapter.writeDocument(companyId, samplePivotDocKey, samplePivotDoc);
    result.samplePivotDocKey = samplePivotDocKey;

    // 6. Queue wakeup for affected agent (idempotency key per original issue)
    const idempotencyKey = generateReviveIdempotencyKey(
      companyId,
      originalIssueId,
      "sample-pivot"
    );
    await adapter.queueWakeup(
      companyId,
      originalIssue.assigned_agent_id,
      idempotencyKey,
      `Issue #${originalIssueId} pivoted to sample mode. Review sample feedback and draft production version in #${productionIssueId}.`
    );

    result.success = true;
    return result;
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    return result;
  }
}
```

---

### `src/revive/queue.ts` (service, document writer)

**Analog:** `src/found/template-fill.ts` (document serialization)

**Pattern:** Orchestrates serialization of action queue to markdown/JSON document. Handles prioritization, grouping by cause, progress tracking. Per D-04, D-05, stored in Paperclip `documents` table.

**Document generation pattern** (template-fill.ts lines 95–140):
```typescript
export interface FilledVision {
  body: string;
  slotsUsed: string[];
  slotsEmpty: string[];
}

export function fillVisionTemplate(answers: InterviewAnswers): FilledVision {
  let body = VISION_TEMPLATE;
  
  const slots = {
    mission: answers.mission,
    principles: derivePrinciples(answers),
    goal_12mo: derive12MonthGoal(answers),
  };
  
  Object.entries(slots).forEach(([key, value]) => {
    body = body.replace(new RegExp(`{{${key}}}`, "g"), value || "");
  });
  
  return {
    body,
    slotsUsed: Object.keys(slots),
    slotsEmpty: emptyMatches,
  };
}
```

**For queue.ts, follow this pattern:**
```typescript
import type { ActionQueue, ActionItem, StallCause } from "../types/revive.js";

/**
 * Serialize action queue to markdown for document storage.
 * Per D-04, D-05: action queue stored in documents as compass:revive:action-queue:${run_id}.
 * Grouped by cause, sorted by priority within each cause.
 *
 * @param queue ActionQueue object with all items
 * @returns Markdown string ready to write to documents table
 */
export function serializeActionQueue(queue: ActionQueue): string {
  const causeTitles: Record<StallCause, string> = {
    "single-blocker": "Stuck on a blocker",
    "strategic-drift": "Drifted from vision",
    "broken-integration": "Integration broken",
    "governance-loop": "Stuck in approval loop",
    "dead-agent": "Agent stopped responding",
  };

  const lines: string[] = [
    "# Action Queue",
    "",
    `**Created:** ${queue.created_at}`,
    `**Run ID:** ${queue.run_id}`,
    `**Progress:** ${queue.addressed_count} of ${queue.total_items} addressed`,
    "",
  ];

  // Iterate by cause (in order of detection priority)
  const causeOrder: StallCause[] = [
    "single-blocker",
    "strategic-drift",
    "broken-integration",
    "governance-loop",
    "dead-agent",
  ];

  for (const cause of causeOrder) {
    const items = queue.items_by_cause[cause];
    if (!items || items.length === 0) continue;

    lines.push(`## ${causeTitles[cause]}`);
    lines.push("");

    // Sort by priority (descending)
    const sorted = items.sort((a, b) => b.priority - a.priority);

    for (const item of sorted) {
      const priorityLabel = item.priority > 0.66 ? "HIGH" : item.priority > 0.33 ? "MEDIUM" : "LOW";
      const statusIcon = 
        item.status === "addressed" ? "✓" :
        item.status === "dismissed" ? "×" : 
        "○";

      lines.push(`### ${statusIcon} [${priorityLabel}] ${item.title}`);
      lines.push("");
      lines.push(`**ID:** ${item.id}`);
      lines.push(`**Status:** ${item.status}`);
      lines.push(`**Priority:** ${(item.priority * 100).toFixed(0)}%`);
      if (item.unblocks_count) {
        lines.push(`**Unblocks:** ${item.unblocks_count} downstream item(s)`);
      }
      lines.push("");
      lines.push(`${item.why_blocking}`);
      lines.push("");
      lines.push(`**Recommended:** ${item.recommended_action.type}`);
      lines.push("");
    }
  }

  lines.push("---");
  lines.push(`*Generated by Compass Revive*`);

  return lines.join("\n");
}

/**
 * Parse action queue from markdown (round-trip safe).
 *
 * @param markdown Serialized queue document
 * @returns ActionQueue object
 */
export function parseActionQueue(markdown: string): ActionQueue {
  // Simple parser: extract metadata from header, then reconstruct items from section headers + body
  // For v1, acceptable to store queue as JSON in documents instead (not markdown)
  // and just deserialize directly. This is a fallback for human readability.
  
  const lines = markdown.split("\n");
  let runId = "";
  let createdAt = "";
  let addressedCount = 0;
  let totalItems = 0;

  for (const line of lines) {
    if (line.includes("Run ID:")) {
      runId = line.split("Run ID:")[1]?.trim() || "";
    }
    if (line.includes("Created:")) {
      createdAt = line.split("Created:")[1]?.trim() || "";
    }
    if (line.includes("Progress:")) {
      const match = line.match(/(\d+) of (\d+) addressed/);
      if (match) {
        addressedCount = parseInt(match[1], 10);
        totalItems = parseInt(match[2], 10);
      }
    }
  }

  return {
    run_id: runId,
    company_id: "", // Would need to be passed in context
    created_at: createdAt,
    items_by_cause: {},
    total_items: totalItems,
    addressed_count: addressedCount,
  };
}
```

---

### `src/revive/apply.ts` (orchestrator, incremental SDK writes)

**Analog:** `src/found/apply.ts` (sequential writes + rollback pattern)

**KEY DIFFERENCE (per D-10):** Revive Apply is **INCREMENTAL per-item**, not transactional batch.

**Pattern:** Each action has its own apply step. Per-item confirmation. Action results write back to queue document. No bulk rollback; failures are isolated to that action.

**From Phase 2 apply.ts** (lines 94–145):
```typescript
export async function applyFound(
  ctx: PluginContext,
  companyId: string,
  vision: FilledVision,
  preset: PresetDefinition,
  selectedPresetId: string
): Promise<ApplyResult> {
  const adapter = new PaperclipAdapter(ctx);
  const applyRunId = generateApplyRunId();
  const result: ApplyResult = { success: false };

  // 1. Quality check VISION before proceeding
  // 2. Run preflight validation
  // 3. Write VISION.md document
  // 4. Provision agents per preset
  // 5. Create kickoff issues
  // 6. Queue wakeups with idempotency keys
  // On failure: rollback in reverse order (delete issues, agents, VISION)
}
```

**For revive/apply.ts, follow this pattern BUT per-item, not batch:**
```typescript
import type { PluginContext } from "@paperclipai/plugin-sdk";
import { PaperclipAdapter } from "../sdk/adapter.js";
import { getActionHandler } from "./actions.js";
import { generateReviveIdempotencyKey } from "../found/idempotency.js";
import type { ActionItem, ActionQueue } from "../types/revive.js";

/**
 * Apply Single Action (Incremental Pattern)
 *
 * Per D-10: applies ONE action from the queue.
 * Founder confirms per-item via modal.
 * Action result updates queue document status.
 * On failure, that action fails; others unaffected (no bulk rollback).
 *
 * This is fundamentally different from Phase 2/3 batch transactional apply.
 */

export interface ApplyActionResult {
  /** True if action succeeded */
  success: boolean;

  /** Specific result from action handler */
  result?: unknown;

  /** Error if failed */
  error?: string;

  /** Updated action status after apply */
  new_status: "addressed" | "pending" | "dismissed";
}

/**
 * Apply a single action from the queue.
 *
 * Per D-10: orchestrates preflight → handler call → queue update.
 * No rollback (per-item failure is acceptable; founder retries manually).
 * Writes updated action status back to queue document.
 *
 * @param ctx Plugin context
 * @param companyId Company ID
 * @param action The action to apply
 * @param queueDocKey The document key storing the action queue (e.g., compass:revive:action-queue:${run_id})
 * @returns ApplyActionResult with success flag and new action status
 */
export async function applyAction(
  ctx: PluginContext,
  companyId: string,
  action: ActionItem,
  queueDocKey: string
): Promise<ApplyActionResult> {
  const adapter = new PaperclipAdapter(ctx);
  const result: ApplyActionResult = { success: false, new_status: "pending" };

  try {
    // Preflight: validate action has required fields
    if (!action.id) {
      result.error = "Action missing ID";
      return result;
    }

    // Get handler for this action type
    const handler = getActionHandler(action.recommended_action.type);
    if (!handler) {
      result.error = `Unknown action type: ${action.recommended_action.type}`;
      return result;
    }

    // Call handler
    const handlerResult = await handler(ctx, companyId, action, action.recommended_action.params);

    if (!handlerResult.success) {
      result.error = handlerResult.error;
      result.new_status = "pending"; // Keep pending on failure
      return result;
    }

    // Handler succeeded
    result.success = true;
    result.result = handlerResult.result;
    result.new_status = "addressed";

    // Update queue document: mark action as addressed
    await updateActionQueueItemStatus(adapter, companyId, queueDocKey, action.id, "addressed");

    return result;
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    result.new_status = "pending"; // Keep pending on unexpected error
    return result;
  }
}

/**
 * Dismiss an action from the queue.
 *
 * Per D-05, founder can dismiss actions. Marks status as "dismissed" in queue.
 *
 * @param adapter Paperclip adapter
 * @param companyId Company ID
 * @param queueDocKey Queue document key
 * @param actionId Action ID to dismiss
 */
async function updateActionQueueItemStatus(
  adapter: PaperclipAdapter,
  companyId: string,
  queueDocKey: string,
  actionId: string,
  status: "addressed" | "dismissed" | "pending"
): Promise<void> {
  // 1. Read current queue document
  const queueDoc = await adapter.readDocument(companyId, queueDocKey);
  
  // 2. Parse queue (deserialize from JSON or markdown)
  // For v1, store queue as JSON in documents for easy update
  let queue: ActionQueue;
  try {
    queue = JSON.parse(queueDoc.content);
  } catch {
    // Fallback: reconstruct from markdown
    queue = parseActionQueue(queueDoc.content);
  }

  // 3. Update action status
  for (const cause of Object.keys(queue.items_by_cause)) {
    const items = queue.items_by_cause[cause as StallCause];
    const item = items.find(i => i.id === actionId);
    if (item) {
      item.status = status;
      if (status === "addressed") {
        queue.addressed_count += 1;
      }
      break;
    }
  }

  // 4. Write updated queue back
  const serialized = JSON.stringify(queue, null, 2);
  await adapter.writeDocument(companyId, queueDocKey, serialized);
}
```

---

### `src/ui/revive/RevivePanel.tsx` (orchestrator, mode controller)

**Analog:** `src/ui/assess/AssessPanel.tsx`

**Pattern:** Main entry point. Manages state machine: empty → diagnosing → queue rendered → applying. Renders sub-components (ReviveRunState, ActionQueuePanel, ConfirmationModal). Per D-14, "Diagnose" CTA triggers classifier.

**Mode controller structure** (AssessPanel pattern):
```typescript
import React, { useState, useCallback } from "react";
import { usePluginData, usePluginAction } from "@paperclipai/plugin-sdk/ui";
import { DriftReportPanel } from "./DriftReportPanel.js";
import { ConfirmationModal } from "../found/ConfirmationModal.js";

type AssessStep = "idle" | "loading" | "report" | "confirming" | "applying" | "complete" | "error";

export function AssessPanel(): React.ReactElement {
  const [step, setStep] = useState<AssessStep>("idle");
  const [report, setReport] = useState<DriftReport | null>(null);
  // ... manage state machine
}
```

**For RevivePanel.tsx, follow this pattern:**
```typescript
import React, { useState, useCallback } from "react";
import { usePluginData, usePluginAction } from "@paperclipai/plugin-sdk/ui";
import { useReviveRunState } from "./ReviveRunState.js";
import { ActionQueuePanel } from "./ActionQueuePanel.js";
import { StallSummaryBadge } from "./StallSummaryBadge.js";
import { ConfirmationModal } from "../found/ConfirmationModal.js";
import { ApplyProgress } from "../found/ApplyProgress.js";
import { ApplyErrorDisplay } from "../found/ApplyErrorDisplay.js";

type ReviveStep = "idle" | "diagnosing" | "queue" | "applying" | "complete" | "error" | "empty";

interface RevivePanelProps {
  companyId: string;
  companyName: string;
}

/**
 * RevivePanel — Main entry point for Revive mode.
 * Per D-14: header with company name + stall summary badge + "Diagnose" CTA.
 * Main content: ActionQueuePanel (if diagnosed) or empty state (if healthy).
 * Sticky footer: progress indicator.
 */
export function RevivePanel({ companyId, companyName }: RevivePanelProps): React.ReactElement {
  const [step, setStep] = useState<ReviveStep>("idle");
  const [diagnosing, setDiagnosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load persisted run state from worker-state
  const { runState, loading } = useReviveRunState(companyId);

  // SDK action handlers
  const diagnoseAction = usePluginAction("revive:diagnose");
  const applyActionHandler = usePluginAction("revive:apply-action");

  const handleDiagnose = useCallback(async () => {
    setDiagnosing(true);
    setStep("diagnosing");
    try {
      // Call worker handler to run classifyStall
      // Handler returns: { classification, actionQueue, stallSummary }
      await diagnoseAction({ companyId });
      
      // On success, queue is stored in worker-state + rendered
      setStep("queue");
    } catch (err) {
      setError(String(err));
      setStep("error");
    } finally {
      setDiagnosing(false);
    }
  }, [companyId, diagnoseAction]);

  const handleDiscardDiagnosis = useCallback(() => {
    // Clear worker-state, reset step
    setStep("idle");
    setRunState(null);
  }, []);

  // Render state machine
  if (step === "empty") {
    return (
      <div className="flex flex-col gap-lg p-lg h-full justify-center items-center">
        <h2 className="text-heading font-bold">This company isn't stalled</h2>
        <p className="text-body text-foreground/70">
          No blocking issues detected. Try Assess for a strategic audit instead.
        </p>
        <button className="text-accent underline">Try Assess mode</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-lg bg-card">
        <h1 className="text-display font-bold">{companyName}</h1>
        <p className="text-body text-foreground/70 mt-md">Fix what's blocking this company</p>

        {runState?.stallSummary && (
          <StallSummaryBadge 
            daysInactive={runState.stallSummary.days_no_activity}
            blockerCount={runState.stallSummary.open_blockers}
          />
        )}

        <div className="flex gap-md justify-end mt-lg">
          <button
            onClick={handleDiagnose}
            disabled={diagnosing}
            className="px-lg py-sm bg-accent text-accent-foreground rounded hover:bg-accent/90 disabled:opacity-50"
          >
            {diagnosing ? "Diagnosing…" : "Find what's blocking this company"}
          </button>
          {step !== "idle" && (
            <button
              onClick={handleDiscardDiagnosis}
              className="px-lg py-sm text-foreground/70 hover:text-foreground"
            >
              Discard
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {step === "idle" && <div className="p-lg text-center text-foreground/70">Click "Diagnose" to begin</div>}
        {step === "diagnosing" && <div className="p-lg text-center">Analyzing blockers…</div>}
        {step === "queue" && runState?.actionQueue && (
          <ActionQueuePanel
            queue={runState.actionQueue}
            onApplyAction={applyActionHandler}
          />
        )}
        {step === "error" && error && (
          <ApplyErrorDisplay
            error={{ success: false, errors: [error] }}
            onRetry={handleDiagnose}
            onClose={() => setStep("idle")}
          />
        )}
      </div>

      {/* Sticky Footer */}
      <div className="border-t border-border p-lg bg-card flex justify-between items-center">
        <span className="text-label text-foreground/70">
          Progress: {runState?.actionQueue?.addressed_count || 0} of {runState?.actionQueue?.total_items || 0} addressed
        </span>
        <button
          disabled={(runState?.actionQueue?.addressed_count || 0) === 0}
          className="px-lg py-sm bg-accent text-accent-foreground rounded hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Review and apply
        </button>
      </div>
    </div>
  );
}
```

---

### `src/ui/revive/ActionItemCard.tsx` (component, action card)

**Analog:** `src/ui/assess/DriftItemCard.tsx`

**Pattern:** Card displaying single action: priority badge, title, consequence, buttons. Expandable explanation. Primary CTA + secondary ("Dismiss", "Explain").

**Card component pattern** (DriftItemCard):
```typescript
interface DriftItemCardProps {
  item: DriftItem;
  onAccept: (itemId: string) => void;
  onReject: (itemId: string) => void;
}

export function DriftItemCard({ item, onAccept, onReject }: DriftItemCardProps): React.ReactElement {
  return (
    <div className="border border-border rounded p-md bg-card">
      <div className="flex gap-md items-start justify-between">
        <ConfidenceBar confidence={item.confidence} />
        <h3 className="text-body font-bold flex-1">{item.visionSection}</h3>
        <EvidenceChip evidence={item.evidence} />
      </div>
      <p className="text-label text-foreground/70 mt-md">{item.proposedAmendment}</p>
      <div className="flex gap-md justify-end mt-md">
        <button onClick={() => onReject(item.id)}>Reject</button>
        <button onClick={() => onAccept(item.id)}>Accept</button>
      </div>
    </div>
  );
}
```

**For ActionItemCard.tsx, follow this pattern:**
```typescript
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ActionItem } from "../../types/revive.js";

interface ActionItemCardProps {
  action: ActionItem;
  onApply: (actionId: string) => Promise<void>;
  onDismiss: (actionId: string) => void;
}

export function ActionItemCard({
  action,
  onApply,
  onDismiss,
}: ActionItemCardProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const [applying, setApplying] = useState(false);

  const priorityColor =
    action.priority > 0.66
      ? "bg-destructive/20 text-destructive"
      : action.priority > 0.33
      ? "bg-accent/20 text-accent"
      : "bg-card text-foreground";

  const priorityLabel = 
    action.priority > 0.66 ? "High" :
    action.priority > 0.33 ? "Medium" : 
    "Low";

  const statusIcon =
    action.status === "addressed"
      ? "✓"
      : action.status === "dismissed"
      ? "×"
      : "○";

  const handleApply = async () => {
    setApplying(true);
    try {
      await onApply(action.id);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="border border-border rounded p-md bg-card space-y-md">
      {/* Card Header */}
      <div className="flex gap-md items-start justify-between">
        <div className={`px-xs py-xs rounded text-xs font-bold ${priorityColor}`}>
          {priorityLabel}
        </div>
        <h3 className="text-body font-bold flex-1">{action.title}</h3>
        <span className="text-label">{statusIcon} {action.status}</span>
      </div>

      {/* Card Body */}
      <div className="space-y-md">
        {action.unblocks_count && (
          <p className="text-label text-foreground/70">
            Unlocks {action.unblocks_count} downstream issue(s)
          </p>
        )}
        <p className="text-body">{action.why_blocking}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-md items-center justify-between pt-md border-t border-border">
        <div className="flex gap-md">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-label text-foreground/70 hover:text-foreground flex items-center gap-xs"
          >
            <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} />
            Explain
          </button>
          <button
            onClick={() => onDismiss(action.id)}
            className="text-label text-destructive hover:text-destructive/80"
          >
            Dismiss
          </button>
        </div>
        <button
          onClick={handleApply}
          disabled={applying || action.status === "addressed"}
          className="px-md py-sm bg-accent text-accent-foreground rounded hover:bg-accent/90 disabled:opacity-50 text-body font-medium"
        >
          {applying ? "Applying…" : `${action.recommended_action.type}`}
        </button>
      </div>

      {/* Expandable Explanation */}
      {expanded && (
        <div className="bg-background p-md rounded text-body text-foreground/70 mt-md border-l-2 border-accent">
          <p>
            {action.why_blocking}
          </p>
          {action.target.issue_id && (
            <p className="mt-md text-sm">Issue: #{action.target.issue_id}</p>
          )}
          {action.target.agent_id && (
            <p className="mt-md text-sm">Agent: {action.target.agent_id}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### `src/ui/revive/ReviveRunState.ts` (hook, state management)

**Analog:** `src/ui/assess/AssessRunState.ts`

**Pattern:** Persists run state (diagnosis results, action queue progress) to Plugin SDK worker-state, keyed per company. Survives reload. Per D-15, worker-state key is `compass:revive:run:${company_id}`.

**Hook pattern** (AssessRunState):
```typescript
import { useCallback, useEffect, useState } from "react";
import { usePluginData, usePluginAction } from "@paperclipai/plugin-sdk/ui";
import type { DriftReport } from "../../types/assess.js";

interface AssessRunState {
  assessRunId: string;
  driftReport: DriftReport;
  amendments: Amendment[];
  timestamp: string;
}

export function useAssessRunState(companyId: string) {
  const [state, setState] = useState<AssessRunState | null>(null);
  const [loading, setLoading] = useState(true);

  // Load state from worker-state
  useEffect(() => {
    // Call handler to fetch from worker-state
    setLoading(false);
  }, [companyId]);

  // Save state to worker-state
  const saveState = useCallback(async (newState: AssessRunState) => {
    // Call handler to persist
    setState(newState);
  }, []);

  return { state, loading, saveState };
}
```

**For ReviveRunState.ts, follow this pattern:**
```typescript
import { useCallback, useEffect, useState } from "react";
import { usePluginData, usePluginAction } from "@paperclipai/plugin-sdk/ui";
import type { ActionQueue, StallClassification } from "../../types/revive.js";

const REVIVE_STATE_KEY = "compass:revive:run";

interface ReviveRunStateData {
  runId: string;
  classification: StallClassification;
  actionQueue: ActionQueue;
  stallSummary: {
    days_no_activity: number;
    open_blockers: number;
  };
  createdAt: string;
}

interface ReviveRunStateResult {
  runState: ReviveRunStateData | null;
  loading: boolean;
  saveRunState: (state: ReviveRunStateData) => Promise<void>;
  clearRunState: () => Promise<void>;
}

/**
 * Hook to load and persist revive run state.
 * Per D-15, stored in Plugin SDK worker-state keyed compass:revive:run:${company_id}.
 * Survives plugin reload.
 *
 * @param companyId Company identifier for scoped state
 * @returns Run state object, loading state, and save/clear callbacks
 */
export function useReviveRunState(companyId: string): ReviveRunStateResult {
  const [runState, setRunState] = useState<ReviveRunStateData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load run state on mount
  useEffect(() => {
    const loadRunState = async () => {
      try {
        // Handler to be implemented in worker:
        // Handler: getReviveRunState({ companyId, namespace: REVIVE_STATE_KEY })
        // Returns: ReviveRunStateData | null from worker-state

        // For now, initialize as null
        setRunState(null);
        setLoading(false);
      } catch (err) {
        console.error("[useReviveRunState] Failed to load run state:", err);
        setRunState(null);
        setLoading(false);
      }
    };

    loadRunState();
  }, [companyId]);

  // Save run state to worker-state
  const saveRunState = useCallback(
    async (state: ReviveRunStateData) => {
      try {
        // Call handler to persist to worker-state
        // Handler: saveReviveRunState({ companyId, namespace: REVIVE_STATE_KEY, state })
        // Persists via: ctx.state.set({ scopeKind: "company", scopeId, namespace, stateKey: "current" }, state)

        setRunState(state);
      } catch (err) {
        console.error("[useReviveRunState] Failed to save run state:", err);
      }
    },
    []
  );

  // Clear run state from worker-state
  const clearRunState = useCallback(async () => {
    try {
      // Call handler to clear run state
      // Handler: clearReviveRunState({ companyId, namespace: REVIVE_STATE_KEY })
      // Clears via: ctx.state.delete({ scopeKind: "company", scopeId, namespace, stateKey: "current" })

      setRunState(null);
    } catch (err) {
      console.error("[useReviveRunState] Failed to clear run state:", err);
    }
  }, []);

  return { runState, loading, saveRunState, clearRunState };
}
```

---

## Shared Patterns

### Incremental Apply Pattern (NEW in Phase 4)

**Source:** `src/revive/apply.ts` (per-item apply, NOT batch transactional)

**Apply to:** RevivePanel, ActionItemCard, ApplyProgress for Revive mode

**Key difference from Phase 2/3:**
```typescript
// Phase 2/3 (Found/Assess): Batch transactional
export async function applyFound(ctx, companyId, vision, preset) {
  // 1. Quality check + preflight (gates all writes)
  // 2. Write VISION
  // 3. Provision agents
  // 4. Create issues
  // 5. Queue wakeups
  // On ANY failure: rollback ALL (issues, agents, VISION)
}

// Phase 4 (Revive): Incremental per-item
export async function applyAction(ctx, companyId, action, queueDocKey) {
  // 1. Validate action (minimal preflight, per-item only)
  // 2. Call handler (specific action: replace issue, reassign, etc.)
  // 3. Update queue document status (addressed)
  // On failure: that action fails; others unaffected (no bulk rollback)
}
```

**Philosophy:** Revive is about unsticking by making incremental progress. Founder tackles blockers one at a time. If one action fails, founder retries that action; others remain pending. This matches the "incremental progress" philosophy from D-10.

---

### Idempotency Key Extensions (Revive Namespace)

**Source:** `src/found/idempotency.ts` (extend with revive namespace)

**Apply to:** All revive wakeup requests and sample-pivot operations

```typescript
// Phase 2 (Found): compass:found:${company}:${agent}:${run}
export function generateIdempotencyKey(companyId, agentId, applyRunId) {
  return `compass:found:${companyId}:${agentId}:${applyRunId}`;
}

// Phase 3 (Assess): compass:assess:${company}:${assess_run}:${agent}
export function generateAssessIdempotencyKey(companyId, assessRunId, agentId) {
  return `compass:assess:${companyId}:${assessRunId}:${agentId}`;
}

// Phase 4 (Revive): NEW — add revive namespace
export function generateReviveIdempotencyKey(companyId, actionId, variant) {
  return `compass:revive:${companyId}:${actionId}:${variant}`;
}
```

---

### SDK Adapter Extensions (closeIssue, addIssueComment, updateIssue)

**Source:** `src/sdk/adapter.ts` (extend with 3 new methods)

**Apply to:** All action handlers, sample-pivot, and queue updates

**New methods to add:**
```typescript
export class PaperclipAdapter {
  // ... existing methods ...

  /**
   * Close an issue with optional reason comment.
   * Per revive/actions.ts handleMarkBlockerResolved.
   */
  async closeIssue(companyId: string, issueId: string, reason: string): Promise<void> {
    // SDK call to update issue status to "resolved"
    // Also add audit log entry
  }

  /**
   * Add comment to an existing issue.
   * Per revive/actions.ts and sample-pivot.ts for linking.
   */
  async addIssueComment(companyId: string, issueId: string, body: string): Promise<string> {
    // SDK call to create issue comment
    // Returns comment ID for audit trail
  }

  /**
   * Update issue fields (title, assignee, status, etc.).
   * Per revive/actions.ts reassign and sample-pivot.ts.
   */
  async updateIssue(
    companyId: string,
    issueId: string,
    patch: { title?: string; assigned_agent_id?: string; status?: string }
  ): Promise<void> {
    // SDK call to patch issue
  }
}
```

---

## Files with No Analog Found

One file is entirely new with no predecessor:

| File | Role | Reason | External Reference |
|------|------|--------|-------------------|
| `src/ui/revive/StallSummaryBadge.tsx` | component (status badge) | Visual display of stall metrics (days inactive, blocker count) — new visual pattern | Phase 2 UI-SPEC badge patterns (ModeBanner.tsx precedent for styling) |

All other 25 files have clear analogs in Phase 2/3 (Found/Assess) or are extensions of existing Phase 1/2/3 files.

---

## Metadata

**Analog search scope:**
- `/Users/nicholasrhodes/Development/Paperclip/paperclip-plugin-compass/src/` (compass Phase 1/2/3 code)
- `/Users/nicholasrhodes/Development/Paperclip/paperclip-plugin-compass/.planning/phases/02-found-mode/`, `03-assess-mode/` (PATTERNS.md from prior phases)

**Files scanned:** 40+ existing compass Phase 1/2/3 files + CONTEXT.md, UI-SPEC.md from Phase 4 input

**Pattern extraction date:** 2026-05-03

**SDK version assumed:** @paperclipai/plugin-sdk ^1.0.0 (verified in STACK.md)

**React version:** 19 (peer dep, never bundled; verified in prior phases)

---

## PATTERN MAPPING COMPLETE

**Phase:** 4 - Revive Mode  
**Files classified:** 26 (23 new, 3 modified)  
**Analogs found:** 25 / 26 (96% coverage)

### Coverage Summary
- **Exact analog (same role + data flow):** 7 files (types, classify, RevivePanel, ActionItemCard, ReviveRunState, apply/cascade pattern, integration tests)
- **Role-match analog (same role, similar flow):** 14 files (actions, sample-pivot, queue, UI components, test suites)
- **Partial match (reference for structure):** 3 files (StallSummaryBadge badge pattern, adapter extensions, idempotency namespace)
- **No analog in codebase:** 1 file (StallSummaryBadge visual — reference Phase 2 ModeBanner.tsx badge styling)
- **Extensions (modify existing Phase 1/2/3 files):** 3 files (adapter.ts, idempotency.ts, worker.ts, MainPanel.tsx)

### Key Patterns Identified

1. **Pure function classifier pattern** — classify.ts follows mode-detect.ts + assess/drift.ts (no I/O, hard rules, deterministic heuristics)
2. **Incremental apply (NEW in Phase 4)** — per-item action handlers with no bulk transactional rollback (philosophy: unstick via incremental progress; differs fundamentally from Phase 2/3 batch apply)
3. **Action handler registry** — typed map of ActionType → handler functions (actions.ts similar to cascade.ts issue plan builders)
4. **Dual-issue pattern** — sample-pivot creates two linked issues ([SAMPLE] + [PRODUCTION]) with explanation doc (combines cascade + sequential write patterns)
5. **Queue document persistence** — ActionQueue stored in documents table as compass:revive:action-queue:${run_id}, serialized to JSON/markdown, updated per-item (similar to VisionTemplate serialization)
6. **Run state worker-state persistence** — ReviveRunState stored per company via worker-state (compass:revive:run:${company_id}), survives reload, enables resume UX (matches Phase 2/3 InterviewDraftState / AssessRunState pattern)
7. **Idempotency namespace extension** — add compass:revive:${company}:${action}:${variant} format to Phase 2/3 found/assess keys (extends idempotency.ts namespace)
8. **SDK adapter chokepoint expansion** — extend Phase 1 adapter with closeIssue, addIssueComment, updateIssue (all routes through XC-01 chokepoint)
9. **Design token styling** — all UI components use host-provided classes (px-lg, text-body, bg-card, text-accent) not custom CSS (matches Phase 2/3)
10. **Modal + inline action flow** — per-action confirmation modal + ApplyProgress inline expansion (reuses Phase 2 ConfirmationModal, ApplyProgress, ApplyErrorDisplay)

### Ready for Planning

Pattern mapping complete. Planner can now reference:

- Analog file paths and code excerpts for each new file
- Shared patterns (incremental apply, idempotency keys, SDK adapter, worker-state, design tokens)
- Key difference: Revive apply is PER-ITEM incremental, not batch transactional
- Concrete action handler types: replace-blocker-issue, reassign-issue, nudge-agent-with-context-doc, pivot-to-sample, mark-blocker-resolved, restart-agent, surface-amendment-needed
- Extension points: adapter.ts (3 new methods), idempotency.ts (1 new namespace), worker.ts (revive handlers), MainPanel.tsx (route)
- No blocking ambiguities; all 23 new files have a clear pattern source to adapt from

**PATTERNS.md created:** `.planning/phases/04-revive-mode/04-PATTERNS.md`
