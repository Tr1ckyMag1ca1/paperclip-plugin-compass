import type { PluginContext } from "@paperclipai/plugin-sdk";
import type {
  Agent,
  Document,
  Issue,
  InventorySnapshot,
} from "../types.js";

/**
 * Load inventory snapshot for a company.
 *
 * Per INV-01 through INV-03, reads:
 * - Agents (id, role, status, last_heartbeat_at)
 * - Documents (presence of VISION.md) via issue documents
 * - Issues (recent activity, last 30 days)
 *
 * Per INV-07, returns typed InventorySnapshot payload for mode detection.
 * Snapshot is loaded once on plugin open, then passed to mode detection
 * without re-querying (D-04, D-21).
 *
 * @param ctx Plugin SDK context (provides agents, issues APIs)
 * @param companyId The company ID to load inventory for
 * @returns InventorySnapshot with all fields populated
 */
export async function loadInventory(
  ctx: PluginContext,
  companyId: string
): Promise<InventorySnapshot> {
  // Fetch agents and issues in parallel
  const [agents, issues] = await Promise.all([
    ctx.agents.list({ companyId }),
    ctx.issues.list({ companyId, limit: 100 }),
  ]);

  // Check for VISION document by examining issue title patterns or description
  // (VISION is typically stored as an issue or referenced in issue data)
  let visionExists = false;
  for (const issue of issues) {
    if (
      issue.title?.toUpperCase().includes("VISION") ||
      issue.description?.toUpperCase().includes("VISION.MD")
    ) {
      visionExists = true;
      break;
    }
  }

  // Placeholder documents array (future company-level document support)
  const documents: Document[] = [];

  // Calculate latestHeartbeat
  const latestHeartbeat = calculateLatestHeartbeat(agents);

  // Calculate recentIssues (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentIssues = issues.filter((issue: any) => {
    // SDK uses createdAt (camelCase)
    const createdAt = new Date(issue.createdAt || issue.created_at || 0);
    return createdAt > thirtyDaysAgo;
  });

  // Calculate blockerCount (issues with "blocked" status or "blocker" priority)
  const blockerCount = issues.filter(
    (issue: any) => issue.status === "blocked" || issue.priority === "blocker"
  ).length;

  // Allowlist non-secret fields. SDK ctx.agents.list() returns the raw row
  // including adapterConfig.env (LLM API keys, DATABASE_URL) and runtimeConfig
  // — never expose those to the UI consumer.
  const sanitizedAgents = (agents as any[]).map((a) => ({
    id: a.id,
    companyId: a.companyId,
    name: a.name,
    role: a.role,
    title: a.title,
    icon: a.icon,
    status: a.status,
    reportsTo: a.reportsTo,
    capabilities: a.capabilities,
    lastHeartbeatAt: a.lastHeartbeatAt,
    pausedAt: a.pausedAt,
    pauseReason: a.pauseReason,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    urlKey: a.urlKey,
  })) as Agent[];

  // Issue rows can carry assigneeAdapterOverrides + executionWorkspaceSettings
  // which may contain credentials. Strip before returning.
  const sanitizeIssue = (i: any) => {
    const {
      assigneeAdapterOverrides: _o,
      executionWorkspaceSettings: _s,
      ...rest
    } = i;
    return rest;
  };

  return {
    companyId,
    agents: sanitizedAgents,
    agentCount: agents.length,
    documents,
    visionExists,
    recentIssues: recentIssues.map(sanitizeIssue) as Issue[],
    recentIssueCount: recentIssues.length,
    latestHeartbeat,
    blockerCount,
  };
}

/**
 * Calculate the latest heartbeat timestamp from a list of agents.
 *
 * Helper function for testability and reusability.
 * SDK Agent uses camelCase: lastHeartbeatAt
 *
 * @param agents List of agents
 * @returns Most recent heartbeat timestamp, or null if no agents have heartbeats
 */
export function calculateLatestHeartbeat(agents: Agent[]): Date | null {
  if (agents.length === 0) return null;

  let latestHeartbeat: Date | null = null;

  for (const agent of agents) {
    if (agent.lastHeartbeatAt) {
      const heartbeat = new Date(agent.lastHeartbeatAt);
      if (!latestHeartbeat || heartbeat > latestHeartbeat) {
        latestHeartbeat = heartbeat;
      }
    }
  }

  return latestHeartbeat;
}

// Export types for consumers (re-exported from src/types.ts for convenience)
export type { Agent, Document, Issue, InventorySnapshot };
