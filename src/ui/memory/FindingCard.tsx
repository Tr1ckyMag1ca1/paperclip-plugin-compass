/**
 * FindingCard Component
 *
 * Per D-10, D-11, UI-SPEC: displays single finding with summary, evidence chips,
 * status badge, and status-change buttons.
 *
 * Layout per Phase 4 ActionItemCard pattern:
 * - Header: summary + timestamp + mode + status badges
 * - Evidence section: chips showing issue/document IDs
 * - Status history: collapsible section (optional)
 * - Action buttons: sticky footer with Mark addressed/Mark invalidated
 */

import React, { useState } from "react";
import type { Finding, FindingStatus } from "../../types/memory.js";
import { FindingStatusBadge } from "./FindingStatusBadge.js";
import { ModeBadge } from "./ModeBadge.js";
import { formatDistanceToNow } from "./format-relative-time.js";

interface FindingCardProps {
  finding: Finding;
  onMarkAddressed?: (findingId: string) => Promise<void>;
  onMarkInvalidated?: (findingId: string) => Promise<void>;
}

interface StatusChangeConfirmationProps {
  open: boolean;
  finding: Finding;
  newStatus: FindingStatus;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Simple confirmation modal for status change.
 */
const StatusChangeConfirmationModal: React.FC<StatusChangeConfirmationProps> = ({
  open,
  finding,
  newStatus,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  if (!open) return null;

  const actionLabel =
    newStatus === "addressed" ? "Mark as addressed" : "Mark as invalidated";

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-background p-lg rounded border border-border w-full max-w-sm mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-heading font-bold mb-md">Confirm status change</h3>
        <p className="text-body text-foreground/70 mb-lg">
          Are you sure you want to {newStatus} this finding?
        </p>

        <div className="flex gap-sm justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-md py-sm text-label text-foreground border border-border rounded hover:bg-background disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-md py-sm text-label bg-accent text-background rounded hover:bg-accent/90 disabled:opacity-50"
          >
            {isLoading ? "Confirming…" : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Renders single finding card with summary, evidence, status, and action buttons.
 * Per D-10, D-11: evidence chips reuse Phase 3 pattern (simplified here).
 */
export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  onMarkAddressed,
  onMarkInvalidated,
}) => {
  const [showStatusModal, setShowStatusModal] = useState<FindingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (newStatus: FindingStatus) => {
    setIsLoading(true);
    try {
      if (newStatus === "addressed") {
        await onMarkAddressed?.(finding.id);
      } else if (newStatus === "invalidated") {
        await onMarkInvalidated?.(finding.id);
      }
      setShowStatusModal(null);
    } finally {
      setIsLoading(false);
    }
  };

  const canMarkAddressed = finding.status === "open" || finding.status === "invalidated";
  const canMarkInvalidated = finding.status === "open" || finding.status === "addressed";

  return (
    <>
      <div className="p-md bg-card rounded border border-border">
        {/* Header: Summary + Timestamp + Badges */}
        <div className="flex items-start justify-between gap-md mb-md">
          <div className="flex-1">
            <h4 className="text-body font-bold">{finding.summary}</h4>
            <p className="text-label text-foreground/70 mt-xs">
              {formatDistanceToNow(new Date(finding.created_at), { addSuffix: true })}
            </p>
          </div>
          <div className="flex gap-xs flex-shrink-0">
            <ModeBadge mode={finding.mode} />
            <FindingStatusBadge status={finding.status} />
          </div>
        </div>

        {/* Evidence Section */}
        {finding.evidence_refs.length > 0 && (
          <div className="mt-md">
            <p className="text-label font-bold mb-xs">Evidence:</p>
            <div className="flex flex-wrap gap-xs">
              {finding.evidence_refs.map((ref, idx) => (
                <span
                  key={idx}
                  className="inline-block px-xs py-xs rounded-full bg-foreground/10 text-label text-foreground/70 whitespace-nowrap"
                  title={ref}
                >
                  {ref.length > 20 ? `${ref.substring(0, 17)}…` : ref}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Status History (collapsible, optional) */}
        {finding.status_history.length > 0 && (
          <details className="mt-md">
            <summary className="text-label font-bold cursor-pointer text-foreground/70">
              Status history ({finding.status_history.length} changes)
            </summary>
            <div className="mt-sm space-y-xs ml-md">
              {finding.status_history.map((transition, idx) => (
                <p key={idx} className="text-label text-foreground/50">
                  {transition.from || "Created"} → {transition.to} at{" "}
                  {new Date(transition.at).toLocaleString()}
                </p>
              ))}
            </div>
          </details>
        )}

        {/* Status Change Buttons */}
        <div className="flex gap-xs mt-md flex-wrap">
          {canMarkAddressed && (
            <button
              onClick={() => setShowStatusModal("addressed")}
              disabled={isLoading}
              className="text-label text-accent hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Mark this finding as addressed"
            >
              Mark addressed
            </button>
          )}
          {canMarkInvalidated && (
            <button
              onClick={() => setShowStatusModal("invalidated")}
              disabled={isLoading}
              className="text-label text-foreground/70 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Mark this finding as invalidated"
            >
              Mark invalidated
            </button>
          )}
        </div>
      </div>

      {/* Status Change Confirmation Modal */}
      <StatusChangeConfirmationModal
        open={showStatusModal !== null}
        finding={finding}
        newStatus={showStatusModal || "open"}
        onConfirm={() => handleStatusChange(showStatusModal || "open")}
        onCancel={() => setShowStatusModal(null)}
        isLoading={isLoading}
      />
    </>
  );
};
