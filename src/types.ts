import type { PluginContext } from "@paperclipai/plugin-sdk";

export type Mode = "Found" | "Assess" | "Revive" | "Reposition";

export interface PluginConfig {
  companyId: string;
  companyPrefix: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  created_at: string;
  last_heartbeat_at?: string;
}

export interface Document {
  id: string;
  title: string;
  latest_body: string;
  created_at: string;
  updated_at: string;
}

export interface Issue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

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
