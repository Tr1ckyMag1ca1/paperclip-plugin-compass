/**
 * EvidenceChip Component — Evidence strength indicator
 *
 * Per Phase 8 D-07: Reuses StatusBadge component from Phase 7.
 * Maps evidence strength to StatusBadge status for semantic color consistency.
 *
 * Displays:
 * - "Strong" with emerald checkmark for strong evidence
 * - "Stalled" with red X for weak evidence
 * - "Unknown" with neutral indicator for unknown strength
 */

import React from "react";
import { FileText, MessageCircle, AlertCircle } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge.js";
import type { ActivityItem } from "../../types/assess.js";

interface EvidenceChipProps {
  /** Evidence strength: strong | weak | unknown */
  strength: "strong" | "weak" | "unknown";
}

/**
 * Maps evidence strength to StatusBadge status.
 * Part of Phase 7 semantic palette lock (emerald=success, red=error, muted=unknown).
 */
function mapEvidenceStrengthToStatus(
  strength: "strong" | "weak" | "unknown"
): "healthy" | "stalled" | "unknown" {
  switch (strength) {
    case "strong":
      return "healthy";
    case "weak":
      return "stalled";
    case "unknown":
      return "unknown";
  }
}

/**
 * EvidenceChip — Thin wrapper around StatusBadge for evidence strength display.
 *
 * Reuses Phase 7 StatusBadge component to ensure semantic color consistency
 * with drift severity and confidence threshold indicators.
 *
 * @param strength Evidence strength level (strong/weak/unknown)
 */
export function EvidenceChip({ strength }: EvidenceChipProps): React.ReactElement {
  const status = mapEvidenceStrengthToStatus(strength);
  return <StatusBadge status={status} />;
}

interface EvidenceSourceChipProps {
  evidence: ActivityItem;
  onClick?: () => void;
  ariaLabel?: string;
}

function EvidenceSourceChip({
  evidence,
  onClick,
  ariaLabel,
}: EvidenceSourceChipProps): React.ReactElement {
  let icon: React.ReactNode;
  let label: string;

  if (evidence.type === "issue") {
    icon = <AlertCircle className="h-3.5 w-3.5" />;
    label = `Issue #${evidence.id}`;
  } else if (evidence.type === "comment") {
    icon = <MessageCircle className="h-3.5 w-3.5" />;
    label = `Comment in #${evidence.id}`;
  } else {
    icon = <FileText className="h-3.5 w-3.5" />;
    label = `Document: ${evidence.id}`;
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-card border border-border text-xs font-normal text-foreground transition-colors ${
        onClick ? "hover:bg-card/80 cursor-pointer" : ""
      }`}
      aria-label={ariaLabel || label}
      disabled={!onClick}
      type="button"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

interface EvidenceListProps {
  evidence: ActivityItem[];
  maxVisible?: number;
  onEvidenceClick?: (item: ActivityItem) => void;
  onExpandAll?: () => void;
}

export function EvidenceList({
  evidence,
  maxVisible = 5,
  onEvidenceClick,
  onExpandAll,
}: EvidenceListProps): React.ReactElement {
  const visible = evidence.slice(0, maxVisible);
  const hidden = evidence.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((item, idx) => (
        <EvidenceSourceChip
          key={`${item.id}-${idx}`}
          evidence={item}
          onClick={onEvidenceClick ? () => onEvidenceClick(item) : undefined}
        />
      ))}

      {hidden > 0 && onExpandAll && (
        <button
          onClick={onExpandAll}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border text-xs font-normal text-foreground hover:bg-card transition-colors"
          type="button"
        >
          See all {hidden} items
        </button>
      )}
    </div>
  );
}
