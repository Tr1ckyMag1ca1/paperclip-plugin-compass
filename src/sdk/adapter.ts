import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { InventorySnapshot, Mode, SchemaValidationResult } from "../types.js";
import { validateSchema } from "../primitives/schema-validator.js";

/**
 * PaperclipAdapter — XC-01 architectural chokepoint
 *
 * All Paperclip SDK calls route through this class to enforce:
 * 1. No direct Postgres access (only through SDK)
 * 2. No raw HTTP REST calls (SDK bridges host auth)
 * 3. No filesystem writes outside SDK envelope
 *
 * M2+ will add writeVision, provisionAgent, createIssue, etc.
 * All routes through this file to enforce XC-01 chokepoint.
 */
export class PaperclipAdapter {
  private ctx: PluginContext;

  constructor(ctx: PluginContext) {
    this.ctx = ctx;
  }

  /**
   * Validate that Paperclip schema matches expectations.
   * Called on plugin startup (worker setup hook).
   */
  async validateSchema(): Promise<SchemaValidationResult> {
    return validateSchema(this.ctx);
  }

  /**
   * Load inventory snapshot for the active company.
   *
   * Queries agents, issues, documents via SDK.
   * Calculates derived fields:
   * - visionExists: boolean indicating if VISION.md document is present
   * - latestHeartbeat: most recent agent heartbeat timestamp
   * - recentIssueCount: issues from last 30 days
   * - blockerCount: issues with "blocker" status or label
   *
   * Per INV-07, snapshot is exposed to mode detection as a typed payload
   * (not re-queried per mode).
   */
  async getInventorySnapshot(companyId: string): Promise<InventorySnapshot> {
    const [agents, issues] = await Promise.all([
      this.ctx.agents.list({ companyId }),
      this.ctx.issues.list({ companyId }),
    ]);

    // Calculate visionExists by checking for VISION in issue titles or descriptions
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
    const documents: any[] = [];

    // Calculate latestHeartbeat (SDK uses camelCase: lastHeartbeatAt)
    let latestHeartbeat: Date | null = null;
    for (const agent of agents) {
      if (agent.lastHeartbeatAt) {
        const heartbeat = new Date(agent.lastHeartbeatAt);
        if (!latestHeartbeat || heartbeat > latestHeartbeat) {
          latestHeartbeat = heartbeat;
        }
      }
    }

    // Filter recent issues (last 30 days) — SDK uses camelCase: createdAt
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentIssues = issues.filter((issue: any) => {
      const createdAt = new Date(issue.createdAt || issue.created_at || 0);
      return createdAt >= thirtyDaysAgo;
    });

    // Count blockers
    const blockerCount = issues.filter(
      (issue: any) =>
        issue.status === "blocked" || issue.priority === "blocker"
    ).length;

    return {
      companyId,
      agents: agents as InventorySnapshot["agents"],
      agentCount: agents.length,
      documents: documents as InventorySnapshot["documents"],
      visionExists,
      recentIssues: recentIssues as InventorySnapshot["recentIssues"],
      recentIssueCount: recentIssues.length,
      latestHeartbeat,
      blockerCount,
    };
  }

  /**
   * Get mode override for a company (if set).
   * Per D-09, override is stored in Plugin SDK worker-state (host-persisted).
   * M6 will migrate to engagement-memory document.
   */
  async getModeOverride(companyId: string): Promise<Mode | null> {
    const raw = await this.ctx.state.get({
      scopeKind: "company" as const,
      scopeId: companyId,
      namespace: "mode-override",
      stateKey: "current",
    });
    return (raw as Mode) || null;
  }

  /**
   * Set mode override for a company.
   * Per D-09, override is stored in Plugin SDK worker-state (host-persisted).
   */
  async setModeOverride(companyId: string, mode: Mode): Promise<void> {
    await this.ctx.state.set(
      {
        scopeKind: "company" as const,
        scopeId: companyId,
        namespace: "mode-override",
        stateKey: "current",
      },
      mode
    );
  }
}
