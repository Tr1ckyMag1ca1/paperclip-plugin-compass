import React from "react";
import { Card } from "../primitives/Card.js";
import { SectionHeader } from "../primitives/SectionHeader.js";
import type { PresetDefinition } from "../../types/found.js";

interface ProvisioningSummaryProps {
  preset: PresetDefinition | null;
}

/**
 * Display what will be created when founder applies the interview.
 * Shows agents, kickoff issues, write counts.
 * Used in both VisionPreview and ConfirmationModal.
 * Per D-14: Uses Card variant=default + SectionHeader primitive.
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
    <Card variant="default" padding="md">
      <SectionHeader title="When you apply" />

      <div className="mt-4 space-y-3">
        {/* Agents */}
        <div>
          <p className="text-xs font-medium text-foreground">Agents to create</p>
          <ul className="mt-2 space-y-1 list-none">
            {preset.agents.map(agent => (
              <li key={agent.id} className="text-sm text-foreground/70 font-normal">
                {agent.name} — {agent.role}
              </li>
            ))}
          </ul>
        </div>

        {/* Kickoff issues */}
        <div>
          <p className="text-xs font-medium text-foreground">Kickoff issues</p>
          <p className="text-sm text-foreground/70 mt-1 font-normal">
            {issueCount} {issueCount === 1 ? "issue" : "issues"} filed (one per agent)
          </p>
        </div>

        {/* Write count box */}
        <div className="bg-muted p-3 rounded-none border border-border mt-3">
          <p className="text-xs font-medium text-foreground">
            Total: 1 document, {agentCount} {agentCount === 1 ? "agent" : "agents"}, {issueCount}{" "}
            {issueCount === 1 ? "issue" : "issues"}, {wakeupCount}{" "}
            {wakeupCount === 1 ? "wakeup" : "wakeups"}
          </p>
        </div>
      </div>
    </Card>
  );
}
