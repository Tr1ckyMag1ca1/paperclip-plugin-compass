/**
 * ActionItemCard Component
 *
 * Per 04-UI-SPEC.md, D-05, D-06: displays a single action item in the queue.
 *
 * Layout:
 * - Header: priority badge | title | status
 * - Body: description + consequence ("Unlocks N issues")
 * - Actions: primary CTA | Dismiss | Explain
 * - Collapsible explanation (on Explain click)
 */

import React, { useState } from "react";
import type { ActionItem } from "../../types/revive.js";
import { PriorityBadge } from "./PriorityBadge.js";
import { SamplePivotModal } from "./SamplePivotModal.js";
import { ActionConfirmationModal } from "./ActionConfirmationModal.js";

interface ActionItemCardProps {
  item: ActionItem;
  onApply?: () => Promise<void>;
  onDismiss?: () => Promise<void>;
}

/**
 * Renders a single action card per D-05, D-06.
 * Opens modals for confirmation based on action type.
 */
export const ActionItemCard: React.FC<ActionItemCardProps> = ({
  item,
  onApply,
  onDismiss,
}) => {
  const [showExplain, setShowExplain] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setIsApplying(true);
    try {
      await onApply?.();
      setShowConfirm(false);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      <div className="p-md bg-card rounded border border-border">
        {/* Header: Priority | Title | Status */}
        <div className="flex items-start gap-md mb-md">
          <PriorityBadge priority={item.priority} />
          <div className="flex-1">
            <h4 className="text-body font-bold">{item.title}</h4>
            <p className="text-label text-foreground/70 mt-xs">
              Unlocks {item.unblocks_count || 1} downstream issue(s)
            </p>
          </div>
          <span className="text-label text-foreground/70 whitespace-nowrap">
            {item.status === "pending"
              ? "Pending"
              : item.status === "addressed"
                ? "✓ Addressed"
                : "× Dismissed"}
          </span>
        </div>

        {/* Body: Description */}
        <p className="text-body mb-md">{item.why_blocking}</p>

        {/* Action Buttons */}
        <div className="flex gap-md">
          <button
            onClick={handleApply}
            disabled={item.status !== "pending" || isApplying}
            className="flex-1 px-md py-sm bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplying ? "Applying…" : getActionButtonLabel(item.recommended_action.type)}
          </button>
          <button
            onClick={() => setShowExplain(!showExplain)}
            className="px-md py-sm text-foreground border border-border rounded hover:bg-background"
          >
            Explain
          </button>
          <button
            onClick={() => onDismiss?.()}
            disabled={item.status !== "pending"}
            className="px-md py-sm text-destructive border border-border rounded hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Dismiss
          </button>
        </div>

        {/* Collapsible Explanation */}
        {showExplain && (
          <div
            className="mt-md p-md bg-background rounded text-body"
            role="region"
            aria-expanded="true"
          >
            <p className="font-semibold mb-sm">{item.title}</p>
            <p>{item.why_blocking}</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && item.recommended_action.type === "pivot-to-sample" ? (
        <SamplePivotModal
          actionId={item.id}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      ) : (
        <ActionConfirmationModal
          action={item}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
};

/**
 * Get the primary CTA button label based on action type.
 * Per 04-UI-SPEC.md: specific verb + noun.
 */
function getActionButtonLabel(type: string): string {
  const labels: Record<string, string> = {
    "replace-blocker-issue": "Replace this issue",
    "reassign-issue": "Reassign to agent",
    "nudge-agent-with-context-doc": "Brief the agent",
    "pivot-to-sample": "Switch to sample mode",
    "mark-blocker-resolved": "Mark resolved",
    "restart-agent": "Restart agent",
    "surface-amendment-needed": "Review in Assess",
  };
  return labels[type] || "Apply action";
}
