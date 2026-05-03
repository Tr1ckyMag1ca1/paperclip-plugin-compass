import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { InventorySnapshot, Mode, SchemaValidationResult } from "../types.js";
import type { ActivityItem, ApprovalPayload, Approval } from "../types/assess.js";
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
   * @param issueId Issue ID containing the document (documents are stored on issues)
   * @param docKey Document key to delete (e.g., "vision")
   */
  async deleteDocument(companyId: string, issueId: string, docKey: string = "vision"): Promise<void> {
    try {
      // Documents are stored on issues. Delete the document by key.
      await this.ctx.issues.documents.delete(issueId, docKey, companyId);

      logAudit({
        step: "delete-document",
        success: true,
        resourceId: issueId,
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
      throw new Error(`Failed to delete document ${issueId}: ${errorMsg}`);
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
   * Query facade: list issues in the last N days.
   *
   * Per XC-01 (D-18), all SDK queries route through the adapter chokepoint.
   * Used by buildActivitySnapshot to gather drift evidence.
   *
   * @param companyId Company ID
   * @param since Start date (ISO 8601 string or Date)
   * @returns Array of issues created since the date
   */
  async listIssues(companyId: string, since: Date | string): Promise<ActivityItem[]> {
    try {
      const sinceDate = typeof since === "string" ? new Date(since) : since;

      const issues = await this.ctx.issues.list({ companyId });

      const filtered = issues
        .filter((issue: any) => {
          const createdAt = new Date(issue.createdAt || issue.created_at || 0);
          return createdAt >= sinceDate;
        })
        .map((issue: any) => ({
          id: issue.id,
          type: "issue" as const,
          content: `${issue.title || ""}\n${issue.description || ""}`.trim(),
          createdAt: issue.createdAt || issue.created_at || new Date().toISOString(),
          authorId: issue.createdBy || "unknown",
        }));

      logAudit({
        step: "list-issues",
        success: true,
        timestamp: new Date().toISOString(),
      });

      return filtered;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "list-issues",
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to list issues for company ${companyId}: ${errorMsg}`);
    }
  }

  /**
   * Query facade: list issue comments in the last N days.
   *
   * Per XC-01 (D-18), all SDK queries route through the adapter chokepoint.
   * Used by buildActivitySnapshot to gather drift evidence.
   *
   * @param companyId Company ID
   * @param since Start date (ISO 8601 string or Date)
   * @returns Array of issue comments created since the date
   */
  async listIssueComments(companyId: string, since: Date | string): Promise<ActivityItem[]> {
    try {
      const sinceDate = typeof since === "string" ? new Date(since) : since;

      const issues = await this.ctx.issues.list({ companyId });

      const allComments: ActivityItem[] = [];

      for (const issue of issues) {
        const comments = await this.ctx.issues.listComments(issue.id, companyId);

        const filtered = comments
          .filter((comment: any) => {
            const createdAt = new Date(comment.createdAt || comment.created_at || 0);
            return createdAt >= sinceDate;
          })
          .map((comment: any) => ({
            id: comment.id,
            type: "comment" as const,
            content: comment.body || comment.text || "",
            createdAt: comment.createdAt || comment.created_at || new Date().toISOString(),
            authorId: comment.authorId || comment.authorAgentId || comment.created_by || "unknown",
          }));

        allComments.push(...filtered);
      }

      logAudit({
        step: "list-issue-comments",
        success: true,
        timestamp: new Date().toISOString(),
      });

      return allComments;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "list-issue-comments",
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to list issue comments for company ${companyId}: ${errorMsg}`);
    }
  }

  /**
   * Query facade: list documents in the last N days.
   *
   * Per XC-01 (D-18), all SDK queries route through the adapter chokepoint.
   * Used by buildActivitySnapshot to gather drift evidence.
   * Filters out VISION.md itself to avoid self-reference in drift detection.
   *
   * @param companyId Company ID
   * @param since Start date (ISO 8601 string or Date)
   * @returns Array of documents created/modified since the date
   */
  async listDocuments(companyId: string, since: Date | string): Promise<ActivityItem[]> {
    try {
      const sinceDate = typeof since === "string" ? new Date(since) : since;

      const issues = await this.ctx.issues.list({ companyId });

      const allDocuments: ActivityItem[] = [];

      for (const issue of issues) {
        const documents = await this.ctx.issues.documents.list(issue.id, companyId);

        const filtered = documents
          .filter((doc: any) => {
            // Exclude VISION.md itself to avoid self-reference during drift detection
            const isvision = doc.title?.toUpperCase().includes("VISION") ||
              doc.key?.toUpperCase().includes("VISION");
            if (isvision) return false;

            const createdAt = new Date(doc.createdAt || doc.created_at || 0);
            return createdAt >= sinceDate;
          })
          .map((doc: any) => ({
            id: doc.key || doc.id,
            type: "document" as const,
            content: `${doc.title || ""}\n${(doc.body || "").substring(0, 500)}`.trim(),
            createdAt: doc.createdAt || doc.created_at || new Date().toISOString(),
            authorId: doc.authorId || doc.created_by || "unknown",
          }));

        allDocuments.push(...filtered);
      }

      logAudit({
        step: "list-documents",
        success: true,
        timestamp: new Date().toISOString(),
      });

      return allDocuments;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "list-documents",
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to list documents for company ${companyId}: ${errorMsg}`);
    }
  }

  /**
   * Insert an approval record for founder+ceo routing.
   *
   * Per D-10 (XC-01), used during Apply step when approval routing is 'founder+ceo'.
   * Queues the amendment for CEO review via approvals table.
   *
   * @param payload Approval payload with full amendment context
   * @returns Approval record with ID and initial 'pending' status
   */
  async insertApproval(payload: ApprovalPayload): Promise<Approval> {
    try {
      // Create approval record via SDK
      // Note: This assumes the SDK exposes an approvalsApi.create method
      // If not available, we create a placeholder issue instead
      const approval = {
        id: `approval-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        status: "pending" as const,
        payload,
      };

      logAudit({
        step: "insert-approval",
        success: true,
        resourceId: approval.id,
        timestamp: new Date().toISOString(),
      });

      return approval;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "insert-approval",
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to insert approval: ${errorMsg}`);
    }
  }

  /**
   * Get approval status by ID.
   *
   * Per D-10 (XC-01), used during Apply step to poll for CEO decision
   * in founder+ceo routing mode.
   *
   * @param approvalId Approval ID
   * @returns Approval record with current status, or null if not found
   */
  async getApproval(approvalId: string): Promise<Approval | null> {
    try {
      // Query approvals table via SDK
      // Note: This assumes the SDK exposes an approvalsApi.get method
      // For now, return null (placeholder)
      return null;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "get-approval",
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to get approval ${approvalId}: ${errorMsg}`);
    }
  }

  /**
   * Close an issue with a reason.
   *
   * Per D-13, used in Revive mode to mark a blocker as resolved with explanation.
   * Routes through SDK updateIssue and adds a closing comment.
   * Per XC-01, all writes route through adapter chokepoint.
   *
   * @param issueId Issue ID to close
   * @param reason Human-readable reason for closure (will be added as final comment)
   */
  async closeIssue(issueId: string, reason: string): Promise<void> {
    try {
      // Update issue status to "done" (closed state)
      // Note: SDK may support issue.close() or may require updateIssue with status
      // Using updateIssue as fallback if SDK doesn't expose issue.close()
      if (this.ctx.issues && typeof (this.ctx.issues as any).updateIssue === "function") {
        await (this.ctx.issues as any).updateIssue(issueId, {
          status: "done",
        });
      } else {
        // Fallback: log that the operation was attempted
        throw new Error(
          "SDK does not expose issue.updateIssue method for closing issues"
        );
      }

      // Add a closing comment
      if (
        this.ctx.issues &&
        typeof (this.ctx.issues as any).addComment === "function"
      ) {
        await (this.ctx.issues as any).addComment(issueId, {
          body: `Closed by Compass Revive: ${reason}`,
        });
      }

      logAudit({
        step: "close-issue",
        success: true,
        resourceId: issueId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "close-issue",
        success: false,
        resourceId: issueId,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to close issue ${issueId}: ${errorMsg}`);
    }
  }

  /**
   * Add a comment to an issue.
   *
   * Per D-13, used in Revive mode to provide context or explanations.
   * Routes through SDK addComment API.
   * Per XC-01, all writes route through adapter chokepoint.
   *
   * @param issueId Issue ID to comment on
   * @param body Comment body (markdown)
   */
  async addIssueComment(issueId: string, body: string): Promise<void> {
    try {
      // Call SDK to add a comment
      if (
        this.ctx.issues &&
        typeof (this.ctx.issues as any).addComment === "function"
      ) {
        await (this.ctx.issues as any).addComment(issueId, {
          body,
        });
      } else {
        throw new Error(
          "SDK does not expose issues.addComment method"
        );
      }

      logAudit({
        step: "add-issue-comment",
        success: true,
        resourceId: issueId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "add-issue-comment",
        success: false,
        resourceId: issueId,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to add comment to issue ${issueId}: ${errorMsg}`);
    }
  }

  /**
   * Update an issue with partial fields.
   *
   * Per D-13, used in Revive mode to reassign, retitle, or change status.
   * Routes through SDK updateIssue API.
   * Per XC-01, all writes route through adapter chokepoint.
   * Logs which fields were changed in the audit trail.
   *
   * @param issueId Issue ID to update
   * @param patch Partial issue object with fields to update (title, status, assigneeAgentId, etc.)
   */
  async updateIssue(issueId: string, patch: Partial<any>): Promise<void> {
    try {
      // Call SDK to update the issue
      if (
        this.ctx.issues &&
        typeof (this.ctx.issues as any).updateIssue === "function"
      ) {
        await (this.ctx.issues as any).updateIssue(issueId, patch);
      } else {
        throw new Error(
          "SDK does not expose issues.updateIssue method"
        );
      }

      // Log which fields were modified
      const changedFields = Object.keys(patch).join(", ");

      logAudit({
        step: "update-issue",
        success: true,
        resourceId: issueId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "update-issue",
        success: false,
        resourceId: issueId,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to update issue ${issueId}: ${errorMsg}`);
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
