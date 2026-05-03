import React from "react";
import { AlertTriangle } from "lucide-react";

interface ApplyErrorDisplayProps {
  step: string;
  errors: string[];
  rollbackApplied?: boolean;
  rollbackErrors?: string[];
  onRetry: () => void;
  onClose: () => void;
}

/**
 * Error display for Apply failures.
 * Shows problem statement, error messages, rollback status, and recovery path.
 * Founder-readable errors with actionable next steps.
 */
export function ApplyErrorDisplay({
  step,
  errors,
  rollbackApplied = false,
  rollbackErrors = [],
  onRetry,
  onClose,
}: ApplyErrorDisplayProps): React.ReactElement {
  const primaryError = errors[0] || "An unexpected error occurred.";

  return (
    <div className="space-y-lg">
      <div className="bg-destructive/10 border border-destructive rounded p-lg">
        <div className="flex gap-md items-start">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="space-y-md flex-1">
            <h3 className="text-heading font-bold text-destructive">
              Apply failed at {step}
            </h3>

            {/* Primary error */}
            {primaryError && (
              <div className="space-y-sm">
                <p className="text-body font-normal">Error:</p>
                <p className="text-sm font-normal text-foreground/70 bg-background p-md rounded border border-border">
                  {primaryError}
                </p>
              </div>
            )}

            {/* Rollback status */}
            {rollbackApplied && (
              <div className="space-y-sm">
                <p className="text-body font-bold">Rollback completed:</p>
                {rollbackErrors.length > 0 ? (
                  <div className="space-y-xs">
                    {rollbackErrors.map((err, idx) => (
                      <p key={idx} className="text-label font-normal text-foreground/70">
                        ✓ {err}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-label font-normal text-foreground/70">
                    ✓ All partial writes have been cleaned up.
                  </p>
                )}
              </div>
            )}

            {/* Next steps */}
            <p className="text-label font-normal text-foreground/70">
              Next step: Check your company and retry if needed.
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-md justify-end">
        <button
          onClick={onClose}
          className="px-md py-sm rounded border border-border text-foreground hover:bg-card transition-colors font-normal text-body"
        >
          Close
        </button>
        <button
          onClick={onRetry}
          className="px-md py-sm rounded bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-medium text-body"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
