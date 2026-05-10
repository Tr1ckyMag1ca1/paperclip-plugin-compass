/**
 * ActionConfirmationModal Component
 *
 * Per 04-UI-SPEC.md, D-10: single-confirm gate for per-action apply.
 *
 * Lighter than Phase 2/3 two-stage gate (only one confirmation step).
 * Shows action title, what's unblocked, list of writes.
 */

import React from "react";
import type { ActionItem } from "../../types/revive.js";

interface ActionConfirmationModalProps {
  action: ActionItem;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

/**
 * Renders per-action confirmation modal (single-confirm gate).
 * Per 04-UI-SPEC.md §Per-Action Confirmation Modal.
 */
export const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({
  action,
  onConfirm,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-none p-4 max-w-md shadow-lg max-h-[80vh] overflow-y-auto gap-3 flex flex-col">
        <h2 className="text-base font-semibold">Apply this action?</h2>

        <div className="gap-3 flex flex-col text-sm">
          <p className="font-semibold">{action.title}</p>
          <p className="text-muted-foreground">
            Unlocks {action.unblocks_count || 1} downstream issue(s)
          </p>

          <div className="text-xs font-medium text-muted-foreground bg-muted rounded-none p-3">
            <p className="font-semibold mb-2">This will:</p>
            <ul className="space-y-2">
              <li>Update issue</li>
              <li>
                {action.recommended_action.type === "pivot-to-sample"
                  ? "Create dual issues (sample + production)"
                  : "Create downstream issue(s)"}
              </li>
              <li>Queue agent wakeup</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-xs font-medium border border-border bg-muted text-foreground rounded-none hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-xs font-medium bg-foreground text-background rounded-none hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Applying…" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
};
