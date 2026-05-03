/**
 * Cascade Orchestrator for Assess Mode
 *
 * Per D-12, D-13, D-14 (ASSESS-05, ASSESS-08):
 * After VISION.md amendments are accepted and applied, identifies affected agents
 * per amended section and creates kickoff issues to cascade changes downstream.
 *
 * Agent Screening (D-13):
 * - Excludes newly-provisioned agents (created_at < 7 days ago AND last_heartbeat_at is null)
 * - Reason: Don't overload agents that haven't started yet
 *
 * Custom Override Detection (D-14):
 * - For each affected agent, checks if adapter_config.instructions diverge from baseline
 * - Surfaces warnings to founder for explicit confirmation
 *
 * Sequential Execution (XC-02):
 * - Creates one issue per affected agent
 * - Links back to assessment via issue body reference
 * - Queues wakeup with assess-namespaced idempotency key
 * - Tracks created IDs for rollback
 */

import type { Agent } from "../types.js";
import type {
  ParsedVision,
  DriftItem,
  ActivityItem,
} from "../types/assess.js";
import { PaperclipAdapter, type AuditLogEntry } from "../sdk/adapter.js";
import { generateAssessIdempotencyKey } from "../found/idempotency.js";

/**
 * Amendment — represents one accepted drift item destined for VISION write.
 *
 * Used by cascade to determine affected agents by section.
 */
export interface Amendment {
  section: keyof ParsedVision;
  currentContent: string;
  proposedContent: string;
  evidence: ActivityItem[];
  confidence: number;
  reason: string;
  runId: string;
}

/**
 * OverrideWarning — signals that an affected agent has custom instructions.
 *
 * Per D-14, founder must explicitly confirm override cascades per-agent.
 */
export interface OverrideWarning {
  agentId: string;
  agentName: string;
  agentRole: string;
  hasCustomOverrides: boolean;
  override_snippet?: string; // First 100 chars of divergence
  reason: string; // Why custom override is flagged
}

/**
 * IssuePlan — proposed issue for one affected agent.
 *
 * Used by cascade orchestration to track what will be created.
 */
export interface IssuePlan {
  title: string;
  description: string;
  assigneeAgentId: string;
}

/**
 * CascadePlan — output of planCascade, ready for sequential execution.
 *
 * Per D-12, contains all affected agents, override warnings, and proposed issues.
 */
export interface CascadePlan {
  /** Agents affected by accepted amendments (screened, non-newly-provisioned) */
  affectedAgents: Agent[];

  /** Warnings for agents with custom instruction overrides */
  customOverrideWarnings: OverrideWarning[];

  /** Proposed issues, keyed by agent ID */
  issuesByAgent: { [agentId: string]: IssuePlan };

  /** Timestamp when plan was generated */
  generatedAt: string;
}

/**
 * CascadeResult — result of executeCascade, tracking created resources.
 *
 * Per XC-02, tracks issue IDs and wakeup IDs for rollback in reverse order.
 */
export interface CascadeResult {
  /** True if all cascade issues created and wakeups queued */
  success: boolean;

  /** Array of created issue IDs (in order of creation) */
  createdIssueIds: string[];

  /** Array of agent IDs that were woken up */
  wakenAgentIds: string[];

  /** Errors encountered (non-empty if success === false) */
  errors?: string[];

  /** Full audit log of cascade operations */
  auditLog?: AuditLogEntry[];
}

/**
 * Detect which agents should be notified about amendments.
 *
 * Per D-12: maps section type to customer-facing agent roles.
 * Returns list of roles that should receive cascade issues.
 */
function determineAffectedRoles(section: keyof ParsedVision): string[] {
  // Map VISION sections to affected agent roles
  const sectionRoleMap: Record<string, string[]> = {
    // Voice/principles → customer-facing agents
    voice: ["customer-success", "sales", "marketing", "product"],
    principles: ["customer-success", "sales", "marketing", "product"],

    // Revenue/launch → finance + operations
    revenue_model: ["cfo", "operations"],
    launch_plan: ["cfo", "operations"],

    // Product direction → engineering
    product_direction: ["cto", "vp-eng"],

    // Org/philosophy → all agents
    org_structure: [], // Empty = all agents (fallback)
    operating_philosophy: [],

    // Default to all agents for other sections
  };

  const roles = sectionRoleMap[section as string];
  return roles !== undefined ? roles : []; // Empty array = all agents (inclusive default)
}

/**
 * Screen agents for cascade eligibility.
 *
 * Per D-13: exclude newly-provisioned agents (created < 7 days ago AND no heartbeat).
 * These agents shouldn't receive cascade issues until they've started their initial setup.
 */
function isEligibleForCascade(agent: Agent): boolean {
  const createdAt = new Date(agent.createdAt);
  const now = new Date();
  const daysOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

  // Exclude if < 7 days old AND no heartbeat recorded
  const isNewlyProvisioned = daysOld < 7 && !agent.lastHeartbeatAt;

  return !isNewlyProvisioned;
}

/**
 * Detect if agent has custom instruction overrides.
 *
 * Per D-14: compares agent.adapter_config.instructions against a baseline.
 * Baseline for v1: empty/default (no overrides yet in foundational agents).
 */
function detectCustomOverrides(agent: Agent): { hasOverrides: boolean; snippet?: string } {
  const config = (agent as any).adapter_config;

  if (!config || !config.instructions) {
    return { hasOverrides: false };
  }

  const instructions = config.instructions;

  // If instructions field is non-empty and not a default template, flag as override
  const isCustom = instructions.length > 0 &&
    !instructions.includes("Provisional instructions") &&
    !instructions.includes("See VISION.md");

  if (isCustom) {
    // Return first 100 chars as snippet
    return {
      hasOverrides: true,
      snippet: instructions.substring(0, 100),
    };
  }

  return { hasOverrides: false };
}

/**
 * Plan cascade issues for affected agents.
 *
 * Per D-12, D-13, D-14:
 * 1. For each accepted amendment, determine affected agents by section
 * 2. Screen out newly-provisioned agents (created < 7d + no heartbeat)
 * 3. Detect custom overrides and surface warnings
 * 4. Build proposed issues per agent
 *
 * @param vision Parsed VISION.md (used to determine affected roles)
 * @param acceptedAmendments Array of amendments founder accepted
 * @param agents Full company agent roster
 * @returns CascadePlan with affected agents, warnings, and proposed issues
 */
export function planCascade(
  vision: ParsedVision,
  acceptedAmendments: Amendment[],
  agents: Agent[]
): CascadePlan {
  const affectedAgentIds = new Set<string>();
  const allAffectedRoles = new Set<string>();

  // Collect all affected roles from all amendments
  for (const amendment of acceptedAmendments) {
    const rolesForSection = determineAffectedRoles(amendment.section);

    if (rolesForSection.length === 0) {
      // Empty = all agents affected by this section
      agents.forEach(a => affectedAgentIds.add(a.id));
    } else {
      // Add agents matching these roles
      rolesForSection.forEach(role => allAffectedRoles.add(role));
    }
  }

  // Add agents matching collected roles
  for (const agent of agents) {
    const agentRole = (agent as any).role || "";
    if (allAffectedRoles.has(agentRole)) {
      affectedAgentIds.add(agent.id);
    }
  }

  // Screen: remove newly-provisioned agents
  const screened = agents.filter(
    a => affectedAgentIds.has(a.id) && isEligibleForCascade(a)
  );

  // Detect overrides and build warnings
  const customOverrideWarnings: OverrideWarning[] = [];
  const issuesByAgent: { [agentId: string]: IssuePlan } = {};

  for (const agent of screened) {
    const override = detectCustomOverrides(agent);

    if (override.hasOverrides) {
      customOverrideWarnings.push({
        agentId: agent.id,
        agentName: (agent as any).name || agent.id,
        agentRole: (agent as any).role || "unknown",
        hasCustomOverrides: true,
        override_snippet: override.snippet,
        reason: "Agent has custom instruction overrides. Cascade will overlay amendments.",
      });
    }

    // Build proposed issue for this agent
    const amendmentSummary = acceptedAmendments
      .map(a => `- ${a.section}: ${a.reason}`)
      .join("\n");

    issuesByAgent[agent.id] = {
      title: `[Cascade from Assess] Review company vision amendments`,
      description: `Company VISION.md has been amended based on recent drift audit.

## Amendments Applied
${amendmentSummary}

## What This Means for You
Your instructions and work priorities may be affected by these changes. Review VISION.md and adjust your approach as needed.

## Next Steps
1. Read VISION.md
2. Update your instructions/priorities accordingly
3. Respond with confirmation in comments

Assessment run ID: ${acceptedAmendments[0]?.runId || "unknown"}`,
      assigneeAgentId: agent.id,
    };
  }

  return {
    affectedAgents: screened,
    customOverrideWarnings,
    issuesByAgent,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Execute cascade plan: create issues and queue wakeups.
 *
 * Per D-12, XC-02: sequential loop creating one issue per affected agent,
 * linking back to assessment, and queuing wakeup with assess idempotency key.
 *
 * On any failure, halt and return error (caller decides rollback strategy).
 *
 * @param adapter Paperclip adapter
 * @param cascade CascadePlan from planCascade
 * @param companyId Company ID
 * @param assessRunId Assessment run UUID (stable across retries)
 * @returns CascadeResult with created IDs, wakeup tracking, errors
 */
export async function executeCascade(
  adapter: PaperclipAdapter,
  cascade: CascadePlan,
  companyId: string,
  assessRunId: string
): Promise<CascadeResult> {
  const result: CascadeResult = {
    success: false,
    createdIssueIds: [],
    wakenAgentIds: [],
    errors: [],
  };

  // Sequential loop: create issue per agent, then queue wakeup
  for (const agent of cascade.affectedAgents) {
    const plan = cascade.issuesByAgent[agent.id];

    if (!plan) {
      result.errors?.push(`No issue plan for agent ${agent.id}`);
      return result; // Halt on missing plan
    }

    // 1. Create cascade issue
    try {
      const issueId = await adapter.createIssue(
        companyId,
        plan.title,
        plan.description,
        agent.id
      );

      result.createdIssueIds.push(issueId);

      // Add assessment linking to issue body (per D-12, for audit trail)
      const linkingComment = `compass:assess:cascade:${assessRunId}`;
      // Note: In v1, we embed this in the description. Phase 6 may add separate linking.
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors?.push(`Failed to create issue for agent ${agent.id}: ${msg}`);
      return result; // Halt on issue creation failure
    }

    // 2. Queue wakeup with assess-namespaced idempotency key
    try {
      const idempotencyKey = generateAssessIdempotencyKey(companyId, assessRunId, agent.id);
      await adapter.queueWakeup(
        companyId,
        agent.id,
        idempotencyKey,
        `VISION.md amended in Assess mode. Review cascade issue for details.`
      );

      result.wakenAgentIds.push(agent.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors?.push(`Failed to queue wakeup for agent ${agent.id}: ${msg}`);
      return result; // Halt on wakeup failure
    }
  }

  result.success = true;
  result.errors = undefined; // Clear errors on success
  return result;
}
