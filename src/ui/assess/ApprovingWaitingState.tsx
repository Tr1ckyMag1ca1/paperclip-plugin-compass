/**
 * ApprovingWaitingState Component — CEO approval waiting state
 *
 * Per 03-UI-SPEC.md: Shown when amendments are queued for CEO review
 * in founder+ceo mode. Displays submission time and refresh button.
 */

import React, { useEffect, useState } from "react";
import { RefreshCw, Clock } from "lucide-react";

interface ApprovingWaitingStateProps {
  /** ISO 8601 timestamp when approval was requested */
  submittedAt: string;
  /** Callback to refresh approval status */
  onRefresh: () => Promise<void>;
  /** Optional callback to cancel the approval request */
  onCancel?: () => Promise<void>;
}

/**
 * Panel shown when waiting for CEO approval in founder+ceo routing mode.
 */
export function ApprovingWaitingState({
  submittedAt,
  onRefresh,
  onCancel,
}: ApprovingWaitingStateProps): React.ReactElement {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeAgo, setTimeAgo] = useState<string>("");

  // Update time-ago display
  useEffect(() => {
    const updateTimeAgo = () => {
      const submitted = new Date(submittedAt);
      const now = new Date();
      const diffMs = now.getTime() - submitted.getTime();
      const diffMins = Math.round(diffMs / 60000);

      if (diffMins < 1) {
        setTimeAgo("just now");
      } else if (diffMins === 1) {
        setTimeAgo("1 minute ago");
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins} minutes ago`);
      } else {
        const diffHours = Math.round(diffMins / 60);
        setTimeAgo(`${diffHours} hour${diffHours > 1 ? "s" : ""} ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, [submittedAt]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      await onRefresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to refresh approval status";
      setError(msg);
      setIsRefreshing(false);
    }
  };

  const handleCancel = async () => {
    if (!onCancel) return;

    try {
      setIsCancelling(true);
      setError(null);
      await onCancel();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to cancel approval request";
      setError(msg);
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main waiting state card */}
      <div className="bg-card border border-border rounded-none shadow-lg p-4 space-y-4">
        {/* Icon and heading */}
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-base font-semibold">Waiting for CEO approval</h2>
            <p className="text-sm font-normal text-foreground/70 mt-2">
              Amendments submitted {timeAgo} for review. Your CEO agent will respond shortly.
            </p>
          </div>
        </div>

        {/* Helper text */}
        <p className="text-xs font-medium text-foreground/70">
          Your CEO agent is reviewing the proposed changes. You'll be notified when a decision is made.
        </p>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-none p-3">
            <p className="text-xs font-medium text-red-600">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t border-border">
          {onCancel && (
            <button
              onClick={handleCancel}
              disabled={isCancelling || isRefreshing}
              className="px-3 py-2 text-emerald-600 font-normal text-sm hover:text-emerald-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 rounded-none"
              type="button"
            >
              {isCancelling ? "Cancelling…" : "Cancel request"}
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isCancelling}
            className="px-3 py-2 rounded-none bg-emerald-500 text-white hover:bg-emerald-600 transition-colors font-medium text-sm flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-emerald-600 disabled:opacity-50"
            type="button"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>
    </div>
  );
}
