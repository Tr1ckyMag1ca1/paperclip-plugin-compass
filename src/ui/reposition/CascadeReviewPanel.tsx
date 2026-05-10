/**
 * CascadeReviewPanel Component — Per-agent decision interface
 *
 * Per 05-UI-SPEC.md §Phase 5: Shows affected agents and keep/apply decision buttons.
 * Default: "keep" for override agents, "apply" for others (D-10).
 * Reuses Phase 3 CustomOverrideWarning for override agent alerts.
 */

import React, { useState, useCallback } from "react";
import { ChevronLeft } from "lucide-react";
import { AgentDecisionCard } from "./AgentDecisionCard.js";
import type { CascadePlan } from "../../assess/cascade.js";

interface CascadeReviewPanelProps {
  /** Cascade plan from Wave 2 */
  cascadePlan: CascadePlan;
  /** Callback to go back to preview */
  onBack: () => void;
  /** Callback when decisions confirmed */
  onConfirm: (decisions: Record<string, "keep" | "apply">) => Promise<void>;
}

/**
 * Per-agent decision interface with keep/apply toggles.
 */
export function CascadeReviewPanel({
  cascadePlan,
  onBack,
  onConfirm,
}: CascadeReviewPanelProps): React.ReactElement {
  // Initialize decisions: "keep" for overrides, "apply" for others
  const initialDecisions = cascadePlan.affectedAgents.reduce(
    (acc, agent) => {
      const hasOverride = cascadePlan.customOverrideWarnings?.some(
        (w) => w.agentId === agent.id
      );
      acc[agent.id] = hasOverride ? "keep" : "apply";
      return acc;
    },
    {} as Record<string, "keep" | "apply">
  );

  const [decisions, setDecisions] = useState(initialDecisions);
  const [overrideConfirmations, setOverrideConfirmations] = useState<
    Record<string, boolean>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if all override agents have explicit confirmation
  const allOverridesConfirmed = cascadePlan.customOverrideWarnings?.every(
    (w) => overrideConfirmations[w.agentId] === true
  ) ?? true;

  const canConfirm = allOverridesConfirmed;

  const handleDecisionChange = useCallback(
    (agentId: string, decision: "keep" | "apply") => {
      setDecisions((prev) => ({
        ...prev,
        [agentId]: decision,
      }));
    },
    []
  );

  const handleOverrideConfirm = useCallback((agentId: string, confirmed: boolean) => {
    setOverrideConfirmations((prev) => ({
      ...prev,
      [agentId]: confirmed,
    }));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!canConfirm) return;

    try {
      setError(null);
      setIsLoading(true);
      await onConfirm(decisions);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to confirm cascade";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [decisions, canConfirm, onConfirm]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Which agents get updated?
        </h2>
        <p className="text-sm font-normal text-foreground/70 mt-1">
          These agents will receive new instructions from the repositioning.
          Skip any with custom overrides if you want to keep them.
        </p>
      </div>

      {/* Agent cards */}
      <div className="space-y-3">
        {cascadePlan.affectedAgents.map((agent) => {
          const hasOverride = cascadePlan.customOverrideWarnings?.some(
            (w) => w.agentId === agent.id
          );
          const decision = decisions[agent.id];
          const isConfirmed = overrideConfirmations[agent.id] ?? false;

          // Find affected section for this agent
          const agentIssues = cascadePlan.issuesByAgent?.[agent.id];
          const affectedSection = agentIssues && Array.isArray(agentIssues) && agentIssues.length > 0
            ? (agentIssues[0] as any)?.section || ""
            : "";

          return (
            <AgentDecisionCard
              key={agent.id}
              agent={agent}
              affectedSection={affectedSection}
              hasOverride={hasOverride ?? false}
              decision={decision}
              isOverrideConfirmed={isConfirmed}
              onDecisionChange={(d) => handleDecisionChange(agent.id, d)}
              onOverrideConfirm={(c) => handleOverrideConfirm(agent.id, c)}
            />
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm font-normal text-destructive p-3 bg-destructive/10 rounded-none border border-destructive">
          {error}
        </p>
      )}

      {/* Validation message */}
      {!canConfirm && cascadePlan.customOverrideWarnings && cascadePlan.customOverrideWarnings.length > 0 && (
        <p className="text-sm font-normal text-destructive">
          Review custom override conflicts above before continuing.
        </p>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-3">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 px-3 py-2 text-accent font-bold border border-border rounded-none hover:bg-card disabled:opacity-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 inline mr-1" />
          Back to preview
        </button>
        <button
          onClick={handleConfirm}
          disabled={!canConfirm || isLoading}
          className="flex-1 px-3 py-2 bg-accent text-white font-bold rounded-none hover:bg-accent/90 disabled:bg-foreground/20 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Loading..." : "Apply repositioning"}
        </button>
      </div>
    </div>
  );
}
