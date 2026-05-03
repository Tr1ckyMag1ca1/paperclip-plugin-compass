import React from "react";
import { Clock } from "lucide-react";
import type { Agent } from "../../types.js";
import { StatusBadge } from "./StatusBadge.js";

interface AgentCardProps {
  agent: Agent;
}

/**
 * AgentCard — Card displaying agent name, role, status, and last heartbeat.
 *
 * Per UI-SPEC.md, renders:
 * - Agent name + role (e.g., "Engineer — AI Engineer")
 * - Status badge (healthy/stalled/unknown)
 * - Last heartbeat timestamp (relative time, e.g., "2 hours ago")
 *
 * Card is read-only in M1 (no interactions).
 *
 * @param agent Agent to display
 */
export function AgentCard({ agent }: AgentCardProps): React.ReactElement {
  const status = getAgentStatus(agent);
  const heartbeatLabel = getHeartbeatLabel(agent.lastHeartbeatAt);

  return (
    <div className="rounded border border-border bg-card px-md py-md">
      <div className="flex items-start justify-between gap-md">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground">
            {agent.name}
          </h3>
          <p className="text-xs text-foreground/60 mt-xs">{agent.role}</p>
          <div className="flex items-center gap-xs mt-md text-xs text-foreground/60">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span>{heartbeatLabel}</span>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

/**
 * Determine agent status based on last heartbeat and other signals.
 *
 * Per MODE-02 logic:
 * - "healthy" if last heartbeat is recent (< 7 days ago)
 * - "stalled" if no recent heartbeat (>= 7 days)
 * - "unknown" if no heartbeat data available
 *
 * @param agent Agent to check
 * @returns Status string
 */
function getAgentStatus(
  agent: Agent
): "healthy" | "stalled" | "unknown" {
  if (!agent.lastHeartbeatAt) {
    return "unknown";
  }

  const daysSinceHeartbeat =
    (Date.now() - new Date(agent.lastHeartbeatAt).getTime()) /
    (1000 * 60 * 60 * 24);

  return daysSinceHeartbeat < 7 ? "healthy" : "stalled";
}

/**
 * Format last heartbeat as relative time label.
 *
 * Per UI-SPEC.md, displays:
 * - "2 hours ago" for recent heartbeats
 * - "5 days ago" for older heartbeats
 * - "No recent heartbeat" if no heartbeat or not in last 30 days
 *
 * @param lastHeartbeatAt ISO 8601 timestamp or null
 * @returns Human-readable label
 */
function getHeartbeatLabel(lastHeartbeatAt: string | null): string {
  if (!lastHeartbeatAt) {
    return "No recent heartbeat";
  }

  const heartbeat = new Date(lastHeartbeatAt);
  const now = new Date();
  const diffMs = now.getTime() - heartbeat.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }
  if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return "No recent heartbeat";
}
