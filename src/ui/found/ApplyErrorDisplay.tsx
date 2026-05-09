import React from "react";
import { AlertTriangle } from "lucide-react";

interface ApplyErrorDisplayProps {
  step: string;
  errors: string[];
  rollbackApplied?: boolean;
  rollbackErrors?: string[];
  onRetry: () => void | Promise<void>;
  onClose: () => void | Promise<void>;
}

/**
 * Inline alert for Apply failures (D-16). Not a modal.
 * Shows step, error message, rollback status, and recovery actions.
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
    <div className="space-y-4">
      <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-none">
        <div className="flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-3 flex-1">
            <h3 className="text-base font-semibold text-red-600">
              Apply failed at {step}
            </h3>

            {primaryError && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600">Error:</p>
                <p className="text-sm font-normal text-foreground/80 bg-background p-3 rounded-none border border-border">
                  {primaryError}
                </p>
              </div>
            )}

            {rollbackApplied && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Rollback completed:</p>
                {rollbackErrors.length > 0 ? (
                  <div className="space-y-1">
                    {rollbackErrors.map((err, idx) => (
                      <p key={idx} className="text-xs font-normal text-muted-foreground">
                        ✓ {err}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-normal text-muted-foreground">
                    ✓ All partial writes have been cleaned up.
                  </p>
                )}
              </div>
            )}

            <p className="text-xs font-normal text-muted-foreground">
              Next step: Check your company and retry if needed.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={() => void onClose()}
          className="px-3 py-2 rounded-none border border-border text-foreground hover:bg-muted transition-colors font-normal text-sm"
          type="button"
        >
          Close
        </button>
        <button
          onClick={() => void onRetry()}
          className="px-3 py-2 rounded-none bg-foreground text-background hover:bg-foreground/90 transition-colors font-medium text-sm"
          type="button"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
