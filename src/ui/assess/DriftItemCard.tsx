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

// Static severity color classes map (Phase 8 D-02, UIA-02)
// Full class strings for Tailwind JIT safety
const SEVERITY_CLASSES: Record<"low" | "medium" | "high", string> = {
  low: "text-muted-foreground",
  medium: "text-yellow-600 bg-yellow-500/10",
  high: "text-red-600 bg-red-500/10",
};

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

  return (
    <div className="bg-card border border-border rounded-none overflow-hidden">
      {/* Header with confidence bar */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <ConfidenceBar confidence={item.confidence} />
          </div>
          <span className={`text-xs font-medium whitespace-nowrap ${SEVERITY_CLASSES[item.severity as "low" | "medium" | "high"]}`}>
            {item.severity}
          </span>
        </div>
      </div>

      {/* Body with evidence and amendment */}
      <div className="p-4 space-y-4">
        {/* Evidence section */}
        <div className="space-y-2">
          <h4 className="text-base font-semibold">Evidence</h4>
          <EvidenceList
            evidence={item.evidence}
            maxVisible={5}
            onEvidenceClick={onEvidenceClick}
            onExpandAll={onExpandAllEvidence}
          />
        </div>

        {/* Amendment diff section */}
        <div className="space-y-2">
          <AmendmentDiff amendment={item.proposedAmendment} />
        </div>

        {/* Explanation text */}
        <p className="text-sm font-normal text-foreground/70">
          {item.explanation}
        </p>
      </div>

      {/* Accept/Reject buttons */}
      <div className="p-4 border-t border-border flex gap-3 justify-end">
        <button
          onClick={onReject}
          className={`px-3 py-2 rounded-none font-normal text-sm transition-colors flex items-center gap-1 ${
            isRejected
              ? "bg-card border border-border text-foreground"
              : "border border-border text-foreground hover:bg-muted"
          }`}
          aria-pressed={isRejected}
          type="button"
        >
          <X className="h-4 w-4" />
          Reject
        </button>
        <button
          onClick={onAccept}
          className={`px-3 py-2 rounded-none font-normal text-sm transition-colors flex items-center gap-1 ${
            isAccepted
              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
              : "border border-border text-foreground hover:bg-muted"
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
