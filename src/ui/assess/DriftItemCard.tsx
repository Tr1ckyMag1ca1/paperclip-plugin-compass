/**
 * DriftItemCard Component — Individual drift item with confidence, evidence, amendment
 *
 * Per 03-UI-SPEC.md: Shows a single drift item with:
 * - Confidence bar with percentage
 * - Evidence chips (max 5, with "See all" expand)
 * - Amendment diff in collapsible details
 * - Accept/Reject toggle buttons
 */

import React from "react";
import { Check, X } from "lucide-react";
import { ConfidenceBar } from "./ConfidenceBar.js";
import { EvidenceList } from "./EvidenceChip.js";
import { AmendmentDiff } from "./AmendmentDiff.js";
import type { DriftItem, ActivityItem } from "../../types/assess.js";

interface DriftItemCardProps {
  /** The drift item to render */
  item: DriftItem;
  /** Current acceptance state (true = accept, false = reject, null = undecided) */
  acceptedState: boolean | null;
  /** Callback when Accept button is clicked */
  onAccept: () => void;
  /** Callback when Reject button is clicked */
  onReject: () => void;
  /** Optional callback when evidence chip is clicked */
  onEvidenceClick?: (evidence: ActivityItem) => void;
  /** Optional callback to expand all evidence items */
  onExpandAllEvidence?: () => void;
}

/**
 * Card displaying a single drift item with controls for accept/reject.
 */
export function DriftItemCard({
  item,
  acceptedState,
  onAccept,
  onReject,
  onEvidenceClick,
  onExpandAllEvidence,
}: DriftItemCardProps): React.ReactElement {
  const isAccepted = acceptedState === true;
  const isRejected = acceptedState === false;

  // Map severity to badge styling
  const severityColor: Record<string, string> = {
    info: "text-foreground/70",
    warn: "text-accent",
    blocker: "text-destructive",
  };

  return (
    <div className="bg-background border border-border rounded-lg overflow-hidden">
      {/* Header with confidence bar */}
      <div className="p-lg border-b border-border space-y-md">
        <div className="flex items-start justify-between gap-md">
          <div className="flex-1">
            <ConfidenceBar confidence={item.confidence} />
          </div>
          <span className={`text-label font-normal whitespace-nowrap ${severityColor[item.severity]}`}>
            {item.severity}
          </span>
        </div>
      </div>

      {/* Body with evidence and amendment */}
      <div className="p-lg space-y-lg">
        {/* Evidence section */}
        <div className="space-y-sm">
          <h4 className="text-heading font-bold">Evidence</h4>
          <EvidenceList
            evidence={item.evidence}
            maxVisible={5}
            onEvidenceClick={onEvidenceClick}
            onExpandAll={onExpandAllEvidence}
          />
        </div>

        {/* Amendment diff section */}
        <div className="space-y-sm">
          <AmendmentDiff amendment={item.proposedAmendment} />
        </div>

        {/* Explanation text */}
        <p className="text-body font-normal text-foreground/70">
          {item.explanation}
        </p>
      </div>

      {/* Accept/Reject buttons */}
      <div className="p-lg border-t border-border flex gap-md justify-end">
        <button
          onClick={onReject}
          className={`px-md py-sm rounded font-normal text-body transition-colors flex items-center gap-xs ${
            isRejected
              ? "bg-card border border-border text-foreground"
              : "border border-border text-foreground hover:bg-card"
          }`}
          aria-pressed={isRejected}
          type="button"
        >
          <X className="h-4 w-4" />
          Reject
        </button>
        <button
          onClick={onAccept}
          className={`px-md py-sm rounded font-normal text-body transition-colors flex items-center gap-xs ${
            isAccepted
              ? "bg-accent text-accent-foreground border border-accent"
              : "border border-border text-foreground hover:bg-card"
          }`}
          aria-pressed={isAccepted}
          type="button"
        >
          <Check className="h-4 w-4" />
          Accept
        </button>
      </div>
    </div>
  );
}
