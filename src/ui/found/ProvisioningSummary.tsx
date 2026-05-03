import React from "react";
import type { PresetDefinition } from "../../types/found.js";

interface ProvisioningSummaryProps {
  preset: PresetDefinition | null;
}

/**
 * Display what will be created when founder applies the interview.
 * Shows agents, kickoff issues, write counts.
 * Used in both VisionPreview and ConfirmationModal.
 */
export function ProvisioningSummary({
  preset,
}: ProvisioningSummaryProps): React.ReactElement {
  if (!preset) {
    return <div />;
  }

  const agentCount = preset.agents.length;
  const issueCount = agentCount; // One issue per agent
  const wakeupCount = agentCount; // One wakeup per agent

  return (
    <div className="space-y-md border-t border-border pt-lg">
      <h3 className="text-heading font-bold">When you apply</h3>

      <div className="space-y-md">
        {/* Agents */}
        <div>
          <p className="text-label font-normal">Agents to create</p>
          <ul className="mt-sm space-y-xs list-none">
            {preset.agents.map(agent => (
              <li key={agent.id} className="text-body text-foreground/70 font-normal">
                {agent.name} — {agent.role}
              </li>
            ))}
          </ul>
        </div>

        {/* Kickoff issues */}
        <div>
          <p className="text-label font-normal">Kickoff issues</p>
          <p className="text-body text-foreground/70 mt-xs font-normal">
            {issueCount} {issueCount === 1 ? "issue" : "issues"} filed (one per agent)
          </p>
        </div>

        {/* Write count box */}
        <div className="bg-card p-md rounded border border-border">
          <p className="text-label font-normal text-foreground">
            Total: 1 document, {agentCount} {agentCount === 1 ? "agent" : "agents"}, {issueCount}{" "}
            {issueCount === 1 ? "issue" : "issues"}, {wakeupCount}{" "}
            {wakeupCount === 1 ? "wakeup" : "wakeups"}
          </p>
        </div>
      </div>
    </div>
  );
}
