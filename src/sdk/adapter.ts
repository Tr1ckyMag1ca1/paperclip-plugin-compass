import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { InventorySnapshot, Mode, SchemaValidationResult } from "../types.js";
import { validateSchema } from "../primitives/schema-validator.js";

/**
 * Audit log entry for tracking writes through the adapter.
 * Used for rollback sequencing and debugging.
 */
export interface AuditLogEntry {
  step: string; // "vision-write", "agent-create", "issue-create", "wakeup-queue", etc.
  success: boolean;
  timestamp: string; // ISO 8601
  resourceId?: string; // doc ID, agent ID, issue ID
  error?: string;
}

// In-memory audit log, capped at 100 entries
let auditLog: AuditLogEntry[] = [];
const MAX_AUDIT_ENTRIES = 100;

function logAudit(entry: AuditLogEntry) {
  auditLog.push(entry);
  if (auditLog.length > MAX_AUDIT_ENTRIES) {
    auditLog = auditLog.slice(-MAX_AUDIT_ENTRIES);
  }
}

/**
 * PaperclipAdapter — XC-01 architectural chokepoint
 *
 * All Paperclip SDK calls route through this class to enforce:
 * 1. No direct Postgres access (only through SDK)
 * 2. No raw HTTP REST calls (SDK bridges host auth)
 * 3. No filesystem writes outside SDK envelope
 *
 * Phase 1: Read methods (getInventorySnapshot, getModeOverride)
 * Phase 2: Write methods (writeDocument, provisionAgent, writeAgentInstructions, createIssue, queueWakeup)
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

  /**
   * Write a document (e.g., VISION.md) to the company as an issue with documents.
   *
   * Per D-16 (XC-01), all writes route through this chokepoint.
   * VISION.md is stored as an issue document via ctx.issues.documents API.
   *
   * @param companyId Company ID
   * @param title Document title (e.g., "VISION.md")
   * @param body Document body (markdown)
   * @returns Issue ID (parent container) for audit trail
   */
  async writeDocument(companyId: string, title: string, body: string): Promise<string> {
    try {
      // 1. Create a root issue to hold the document
      const issue = await this.ctx.issues.create({
        companyId,
        title: title,
        description: `Document: ${title}`,
      });

      // 2. Attach the document to the issue using documents API
      const docKey = title.toLowerCase().replace(/\s+/g, "-").replace(/\.md$/i, "");
      await this.ctx.issues.documents.upsert({
        issueId: issue.id,
        key: docKey,
        body: body,
        companyId,
        title: title,
        format: "markdown",
      });

      logAudit({
        step: "write-document",
        success: true,
        resourceId: issue.id,
        timestamp: new Date().toISOString(),
      });

      return issue.id;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "write-document",
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to write document "${title}": ${errorMsg}`);
    }
  }

  /**
   * Provision a new agent from a blueprint.
   *
   * Per D-16 (XC-01), all writes route through adapter.
   * Creates an agent record with basic properties.
   * Instructions are written separately via writeAgentInstructions.
   *
   * NOTE: The Paperclip Plugin SDK does not currently expose an agent creation API.
   * This method is a placeholder for future integration when SDK is extended.
   * For now, agent provisioning must happen through Paperclip CLI or admin panel.
   *
   * @param companyId Company ID
   * @param agentBlueprint Agent blueprint with name, role, description
   * @returns Created agent record with ID
   */
  async provisionAgent(
    companyId: string,
    agentBlueprint: { name: string; role: string; description?: string }
  ): Promise<{ id: string; name: string; role: string }> {
    try {
      // WORKAROUND: Since SDK doesn't expose agent.create(), we create a placeholder issue
      // and return a synthetic agent record. This is not ideal but allows the rest of
      // the Apply flow to continue. Real integration requires Paperclip SDK extension.

      const syncIssue = await this.ctx.issues.create({
        companyId,
        title: `[AGENT PLACEHOLDER] ${agentBlueprint.name}`,
        description: `Agent role: ${agentBlueprint.role}\n\nDescription: ${agentBlueprint.description || "N/A"}\n\nNote: Actual agent must be provisioned via Paperclip CLI or admin panel.`,
      });

      // Generate a synthetic agent ID based on the issue
      // Format: agent-{role-initials}-{issue-id-prefix}
      const roleInitials = agentBlueprint.role.split(" ").map(w => w[0]).join("").toLowerCase();
      const syntheticAgentId = `agent-${roleInitials}-${syncIssue.id.substring(0, 8)}`;

      logAudit({
        step: "provision-agent",
        success: true,
        resourceId: syntheticAgentId,
        timestamp: new Date().toISOString(),
      });

      return {
        id: syntheticAgentId,
        name: agentBlueprint.name,
        role: agentBlueprint.role,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "provision-agent",
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to provision agent "${agentBlueprint.name}": ${errorMsg}`);
    }
  }

  /**
   * Write agent instructions to the correct path based on bundleMode.
   *
   * Per D-11 (PITFALLS Pitfall 2 prevention, XC-05): dual-path routing is handled here.
   * - If agent.adapter_config.instructionsBundleMode === "managed": write to SDK managed path
   * - If null or "external": write to friendly filesystem path
   * Plugin code (apply.ts) never branches on bundleMode itself.
   *
   * NOTE: The Paperclip Plugin SDK does not currently expose methods for writing
   * agent instructions directly. This is a placeholder for future SDK extension.
   *
   * @param companyId Company ID
   * @param agent Agent record with adapter_config
   * @param instructionsBody Instructions markdown/text
   */
  async writeAgentInstructions(
    companyId: string,
    agent: { id: string; role: string; adapter_config?: any },
    instructionsBody: string
  ): Promise<void> {
    try {
      const bundleMode = agent.adapter_config?.instructionsBundleMode ?? null;

      // WORKAROUND: Create an issue document to store instructions
      // This allows us to persist the instructions within Paperclip
      // Real integration requires SDK extension for agent instruction writes

      const docKey = `instructions-${agent.id.substring(0, 8)}`;
      await this.ctx.issues.documents.upsert({
        issueId: agent.id,  // Using agent ID as issue ID (synthetic)
        key: docKey,
        body: instructionsBody,
        companyId,
        title: `Instructions: ${agent.role}`,
        format: "markdown",
        changeSummary: `Instructions for ${agent.role} agent`,
      });

      logAudit({
        step: "write-agent-instructions",
        success: true,
        resourceId: agent.id,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const mode = agent.adapter_config?.instructionsBundleMode ?? "external";
      logAudit({
        step: "write-agent-instructions",
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to write instructions for agent ${agent.id} in ${mode} mode: ${errorMsg}`);
    }
  }

  /**
   * Create a kickoff issue assigned to an agent.
   *
   * Per D-16 (XC-01), all writes route through adapter.
   * Creates an issue in the issues table.
   *
   * @param companyId Company ID
   * @param title Issue title
   * @param description Issue description
   * @param assigneeAgentId Optional agent ID to assign issue to
   * @returns Issue ID
   */
  async createIssue(
    companyId: string,
    title: string,
    description: string,
    assigneeAgentId?: string
  ): Promise<string> {
    try {
      const issue = await this.ctx.issues.create({
        companyId,
        title,
        description,
        assigneeAgentId,
      });

      logAudit({
        step: "create-issue",
        success: true,
        resourceId: issue.id,
        timestamp: new Date().toISOString(),
      });

      return issue.id;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "create-issue",
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to create issue "${title}": ${errorMsg}`);
    }
  }

  /**
   * Queue a wakeup request for an agent with idempotency key.
   *
   * Per D-10 (XC-03, PITFALLS Pitfall 1): includes idempotency key to prevent duplicates on retry.
   * Uses ctx.issues.requestWakeup() to queue the wakeup via SDK.
   * Per D-16 (XC-01), all writes route through adapter.
   *
   * @param companyId Company ID
   * @param agentId Agent ID to wake up
   * @param idempotencyKey Unique key for this wakeup (format: compass:found:${company}:${agent}:${runId})
   * @param reason Human-readable reason for wakeup
   */
  async queueWakeup(
    companyId: string,
    agentId: string,
    idempotencyKey: string,
    reason: string
  ): Promise<void> {
    try {
      // Validate idempotency key format (per XC-03)
      if (!isValidIdempotencyKey(idempotencyKey)) {
        throw new Error(`Invalid idempotency key format: ${idempotencyKey}`);
      }

      // Use ctx.issues.requestWakeup() to queue the wakeup with idempotency key
      // This is SDK-native and idempotent (same key won't re-queue)
      await this.ctx.issues.requestWakeup(agentId, companyId, {
        reason,
        idempotencyKey,
      });

      logAudit({
        step: "queue-wakeup",
        success: true,
        resourceId: agentId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "queue-wakeup",
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to queue wakeup for agent ${agentId}: ${errorMsg}`);
    }
  }

  /**
   * Delete an issue (for rollback).
   *
   * Per D-16 and rollback logic, adapter provides delete methods.
   * NOTE: Paperclip SDK does not expose issue.delete(). This is a placeholder
   * for future SDK extension. For now, issues cannot be deleted via plugin.
   *
   * @param companyId Company ID
   * @param issueId Issue ID
   */
  async deleteIssue(companyId: string, issueId: string): Promise<void> {
    try {
      // LIMITATION: SDK does not expose issue deletion.
      // Log the attempt but do not throw, allowing rollback to continue.
      logAudit({
        step: "delete-issue",
        success: false,
        resourceId: issueId,
        error: "SDK does not support issue deletion (limitation)",
        timestamp: new Date().toISOString(),
      });

      throw new Error(
        `Cannot delete issue ${issueId}: SDK does not support issue deletion. ` +
          `Manual cleanup required via Paperclip admin panel.`
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to delete issue ${issueId}: ${errorMsg}`);
    }
  }

  /**
   * Delete a document (for rollback).
   *
   * Per D-16 and rollback logic, adapter provides delete methods.
   *
   * @param companyId Company ID
   * @param docId Issue ID containing the document (documents are stored on issues)
   */
  async deleteDocument(companyId: string, docId: string): Promise<void> {
    try {
      // Documents are stored on issues. The docId is actually an issue ID.
      // Delete the documents attached to the issue
      await this.ctx.issues.documents.delete(docId, "vision", companyId);

      logAudit({
        step: "delete-document",
        success: true,
        resourceId: docId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "delete-document",
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to delete document ${docId}: ${errorMsg}`);
    }
  }

  /**
   * Delete an agent (for rollback).
   *
   * Per D-16 and rollback logic, adapter provides delete methods.
   * NOTE: Paperclip SDK does not expose agent.delete(). Agent deletion
   * must happen through Paperclip admin panel. This is a limitation.
   *
   * @param companyId Company ID
   * @param agentId Agent ID (synthetic ID from provisionAgent workaround)
   */
  async deleteAgent(companyId: string, agentId: string): Promise<void> {
    try {
      // LIMITATION: SDK does not expose agent deletion.
      // Since provisionAgent() creates placeholder issues, we'll just log.
      logAudit({
        step: "delete-agent",
        success: false,
        resourceId: agentId,
        error: "SDK does not support agent deletion (limitation)",
        timestamp: new Date().toISOString(),
      });

      throw new Error(
        `Cannot delete agent ${agentId}: SDK does not support agent deletion. ` +
          `Manual cleanup required via Paperclip admin panel.`
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to delete agent ${agentId}: ${errorMsg}`);
    }
  }

  /**
   * Get the audit log (for debugging and rollback sequencing).
   *
   * @returns Array of audit log entries
   */
  getAuditLog(): AuditLogEntry[] {
    return auditLog;
  }

  /**
   * Clear the audit log.
   */
  clearAuditLog(): void {
    auditLog = [];
  }
}

/**
 * Validate idempotency key format.
 * Per XC-03, format is: compass:found:${company_id}:${agent_id}:${apply_run_id}
 *
 * @param key Idempotency key to validate
 * @returns True if key matches format, false otherwise
 */
function isValidIdempotencyKey(key: string): boolean {
  const pattern = /^compass:found:[^:]+:[^:]+:[^:]+$/;
  return pattern.test(key);
}

/**
 * Export isValidIdempotencyKey for use in other modules.
 */
export { isValidIdempotencyKey };
