import type {
  Agent as SDKAgent,
  Issue as SDKIssue,
} from "@paperclipai/plugin-sdk";
import type { PluginContext } from "@paperclipai/plugin-sdk";

export type Mode = "Found" | "Assess" | "Revive" | "Reposition";

export interface PluginConfig {
  companyId: string;
  companyPrefix: string;
}

/**
 * Agent type — maps from SDK Agent but normalizes field names
 * for consistency across the codebase.
 */
export type Agent = SDKAgent;

/**
 * Document type — placeholder for company-level documents.
 * In current implementation, VISION.md is stored as an issue document,
 * so this is a simplified interface for future company-level document support.
 */
export interface Document {
  id: string;
  key: string;
  title?: string;
}

/**
 * Issue type — maps from SDK Issue.
 * Note: SDK Issue uses priority with values like "high", "low", "critical", "medium"
 */
export type Issue = SDKIssue;

/**
 * InventorySnapshot — company state at a point in time.
 *
 * Loaded once on plugin open, then passed to mode detection
 * without re-querying (D-04, D-21, INV-07).
 */
export interface InventorySnapshot {
  companyId: string;
  agents: Agent[];
  agentCount: number;
  documents: Document[];
  visionExists: boolean;
  recentIssues: Issue[];
  recentIssueCount: number;
  latestHeartbeat: Date | null;
  blockerCount: number;
}

export interface SchemaValidationResult {
  success: boolean;
  error?: string;
}
