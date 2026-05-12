/**
 * AgentDecisionCard Component — Single agent decision card
 *
 * Per 05-UI-SPEC.md §Phase 5: Shows agent metadata + keep/apply decision buttons.
 * If agent has custom overrides, shows CustomOverrideWarning and gates "Apply" on checkbox.
 * Reuses Phase 3 CustomOverrideWarning component.
 */

import React from "react";
import { CustomOverrideWarning } from "../assess/CustomOverrideWarning.js";
import type { Agent } from "../../types.js";

interface AgentDecisionCardProps {
  /** Agent being decided on */
  agent: Agent;
  /** VISION section affected for this agent */
  affectedSection: string;
  /** Whether agent has custom instruction overrides */
  hasOverride: boolean;
  /** Current decision: "keep" or "apply" */
  decision: "keep" | "apply";
  /** Whether override conflict has been confirmed */
  isOverrideConfirmed: boolean;
  /** Callback when decision changes */
  onDecisionChange: (decision: "keep" | "apply") => void;
  /** Callback when override confirmation changes */
  onOverrideConfirm: (confirmed: boolean) => void;
}

/**
 * Agent decision card with keep/apply toggle and override warning.
 */
export function AgentDecisionCard({
  agent,
  affectedSection,
  hasOverride,
  decision,
  isOverrideConfirmed,
  onDecisionChange,
  onOverrideConfirm,
}: AgentDecisionCardProps): React.ReactElement {
  // Determine if Apply button should be enabled
  const canApply = !hasOverride || isOverrideConfirmed;

  return (
    <div className="bg-card rounded border border-border overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-background border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {agent.name} — {agent.role || "Agent"}
            </h3>
            {affectedSection && (
              <p className="text-xs font-medium font-normal text-foreground/70 mt-1">
                Current: {affectedSection}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-3">
        {/* Custom override warning */}
        {hasOverride && (
          <CustomOverrideWarning
            override={{
              agentName: agent.name,
              sectionName: affectedSection,
              customOverride: "Custom agent configuration",
              proposedChange: `Updated ${affectedSection} from reposition`,
            }}
            requiresConfirmation={true}
            onConfirmed={onOverrideConfirm}
          />
        )}

        {/* Decision buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onDecisionChange("keep")}
            className={`flex-1 px-3 py-2 font-bold rounded transition-colors ${
              decision === "keep"
                ? "bg-foreground text-background"
                : "bg-card border border-border text-foreground hover:bg-background"
            }`}
          >
            Keep custom
          </button>
          <button
            onClick={() => onDecisionChange("apply")}
            disabled={!canApply}
            className={`flex-1 px-3 py-2 font-bold rounded transition-colors ${
              decision === "apply"
                ? "bg-accent text-white"
                : canApply
                ? "bg-card border border-border text-foreground hover:bg-background"
                : "bg-foreground/20 text-foreground/40 cursor-not-allowed"
            }`}
          >
            Apply repositioning
          </button>
        </div>
      </div>
    </div>
  );
}
