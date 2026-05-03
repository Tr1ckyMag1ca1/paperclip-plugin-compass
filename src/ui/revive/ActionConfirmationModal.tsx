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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-lg max-w-md shadow-lg max-h-[80vh] overflow-y-auto">
        <h2 className="text-display font-bold mb-md">Apply this action?</h2>

        <div className="mb-lg text-body">
          <p className="font-semibold mb-sm">{action.title}</p>
          <p className="text-foreground/70 mb-md">
            Unlocks {action.unblocks_count || 1} downstream issue(s)
          </p>

          <div className="text-label text-foreground/70 bg-background rounded p-md">
            <p className="font-semibold mb-sm">This will:</p>
            <ul className="list-disc list-inside space-y-xs">
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

        <div className="flex gap-md">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-md py-sm border border-border rounded hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-md py-sm bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Applying…" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
};
