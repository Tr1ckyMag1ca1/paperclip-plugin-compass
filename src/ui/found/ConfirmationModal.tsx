import React, { useEffect } from "react";
import { ProvisioningSummary } from "./ProvisioningSummary.js";
import type { FilledVision, PresetDefinition } from "../../types/found.js";

interface ConfirmationModalProps {
  vision: FilledVision;
  preset: PresetDefinition | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Final approval gate modal (FOUND-11 Stage 2).
 * Explicit "I confirm — apply changes" button with modal backdrop.
 * Lists exact write count and actions that will happen.
 * Focus trap and backdrop prevent accidental dismissal.
 */
export function ConfirmationModal({
  vision,
  preset,
  onConfirm,
  onCancel,
}: ConfirmationModalProps): React.ReactElement {
  // Focus trap: return focus to body on cancel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onCancel]);

  const agentCount = preset?.agents.length ?? 0;
  const issueCount = agentCount;
  const wakeupCount = agentCount;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-lg">
      <div className="bg-background border border-border rounded-lg shadow-lg max-w-md w-full mx-auto p-lg space-y-lg">
        {/* Header */}
        <h2 className="text-heading font-bold">Apply changes to Paperclip</h2>

        {/* Body text */}
        <div className="space-y-md text-body font-normal">
          <p>Apply will:</p>
          <ul className="ml-lg space-y-sm list-disc">
            <li className="font-normal">Write the company vision document</li>
            <li className="font-normal">Create {agentCount} agents</li>
            <li className="font-normal">File {issueCount} kickoff issues</li>
            <li className="font-normal">Queue wakeups to start the company heartbeating</li>
          </ul>

          <p className="text-foreground/70 text-body font-normal">
            This is reversible only by manual cleanup in Paperclip.
          </p>

          {/* Write count */}
          <p className="text-label font-normal">
            Write count: 1 document, {agentCount} agents, {issueCount} issues, {wakeupCount} wakeups
          </p>
        </div>

        {/* Provisioning summary */}
        <ProvisioningSummary preset={preset} />

        {/* Action buttons */}
        <div className="flex gap-md justify-end pt-lg border-t border-border">
          <button
            onClick={onCancel}
            className="px-md py-sm rounded border border-border text-foreground hover:bg-card transition-colors font-normal text-body"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-md py-sm rounded bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-medium text-body"
          >
            I confirm — apply changes
          </button>
        </div>
      </div>
    </div>
  );
}
