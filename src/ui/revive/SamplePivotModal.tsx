/**
 * SamplePivotModal Component
 *
 * Per 04-UI-SPEC.md, D-08, D-16: modal explaining the sample-pivot pattern.
 *
 * Displays pattern explanation (2-3 sentences) and confirms dual-issue creation.
 * After apply, shows result: sample issue link + production issue link + SAMPLE_PIVOT.md.
 */

import React from "react";

interface SamplePivotModalProps {
  actionId: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

/**
 * Renders sample-pivot confirmation modal.
 * Per 04-UI-SPEC.md §Sample-Pivot Modal.
 */
export const SamplePivotModal: React.FC<SamplePivotModalProps> = ({
  actionId,
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
      <div className="bg-card border border-border rounded-none p-4 max-w-md shadow-lg gap-3 flex flex-col">
        <h2 className="text-base font-semibold">Switch to sample mode for this issue</h2>

        <p className="text-sm mb-3">
          We'll keep your current draft as a sample to critique, and open a fresh production
          issue for the improved version. This is a known pattern from how vision-quest companies
          unstick themselves.
        </p>

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
            {isLoading ? "Creating…" : "Create sample & production"}
          </button>
        </div>
      </div>
    </div>
  );
};
