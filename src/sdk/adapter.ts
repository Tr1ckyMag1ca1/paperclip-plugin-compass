import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { InventorySnapshot, Mode, SchemaValidationResult } from "../types";
import { validateSchema } from "../primitives/schema-validator";

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
    const [agents, issues, documents] = await Promise.all([
      this.ctx.agents.list(),
      this.ctx.issues.list(),
      this.ctx.documents.list(),
    ]);

    // Calculate visionExists
    const visionExists = documents.some(
      (doc) =>
        doc.title === "VISION.md" ||
        doc.title === "VISION" ||
        doc.title?.toLowerCase() === "vision.md"
    );

    // Calculate latestHeartbeat
    let latestHeartbeat: Date | null = null;
    for (const agent of agents) {
      if (agent.last_heartbeat_at) {
        const heartbeat = new Date(agent.last_heartbeat_at);
        if (!latestHeartbeat || heartbeat > latestHeartbeat) {
          latestHeartbeat = heartbeat;
        }
      }
    }

    // Filter recent issues (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentIssues = issues.filter((issue) => {
      const createdAt = new Date(issue.created_at);
      return createdAt >= thirtyDaysAgo;
    });

    // Count blockers
    const blockerCount = issues.filter(
      (issue) =>
        issue.status === "blocked" ||
        (issue.description &&
          issue.description.toLowerCase().includes("blocker"))
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
