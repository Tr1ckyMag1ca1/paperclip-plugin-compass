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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-lg max-w-md shadow-lg">
        <h2 className="text-display font-bold mb-md">Switch to sample mode for this issue</h2>

        <p className="text-body mb-lg">
          We'll keep your current draft as a sample to critique, and open a fresh production
          issue for the improved version. This is a known pattern from how vision-quest companies
          unstick themselves.
        </p>

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
            {isLoading ? "Creating…" : "Create sample & production"}
          </button>
        </div>
      </div>
    </div>
  );
};
