/**
 * EvidenceChip Component — Source reference for drift evidence
 *
 * Per 03-UI-SPEC.md: Displays individual evidence source (Issue / Comment / Document)
 * with icon, source label, and optional click-to-navigate. Includes "See all" expand
 * when more than 5 items.
 */

import React from "react";
import { FileText, MessageCircle, AlertCircle } from "lucide-react";
import type { ActivityItem } from "../../types/assess.js";

interface EvidenceChipProps {
  /** Evidence item to display */
  evidence: ActivityItem;
  /** Optional callback when chip is clicked (e.g., navigate to source) */
  onClick?: () => void;
  /** Accessibility label for the chip */
  ariaLabel?: string;
}

/**
 * Small badge-style chip showing evidence source with icon and label.
 */
export function EvidenceChip({
  evidence,
  onClick,
  ariaLabel,
}: EvidenceChipProps): React.ReactElement {
  // Determine icon and label based on type
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
      className={`inline-flex items-center gap-xs px-sm py-xs rounded-full bg-card border border-border text-label font-normal text-foreground transition-colors ${
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
  /** Array of evidence items */
  evidence: ActivityItem[];
  /** Max items to show before "See all" button (default 5) */
  maxVisible?: number;
  /** Callback when evidence chip is clicked */
  onEvidenceClick?: (item: ActivityItem) => void;
  /** Show "See all" expand button */
  onExpandAll?: () => void;
}

/**
 * Renders a list of evidence chips with "See all" expand option.
 */
export function EvidenceList({
  evidence,
  maxVisible = 5,
  onEvidenceClick,
  onExpandAll,
}: EvidenceListProps): React.ReactElement {
  const visible = evidence.slice(0, maxVisible);
  const hidden = evidence.length - visible.length;

  return (
    <div className="flex flex-wrap gap-xs">
      {visible.map((item, idx) => (
        <EvidenceChip
          key={`${item.id}-${idx}`}
          evidence={item}
          onClick={onEvidenceClick ? () => onEvidenceClick(item) : undefined}
        />
      ))}

      {hidden > 0 && onExpandAll && (
        <button
          onClick={onExpandAll}
          className="inline-flex items-center gap-xs px-sm py-xs rounded-full border border-border text-label font-normal text-foreground hover:bg-card transition-colors"
          type="button"
        >
          See all {hidden} items
        </button>
      )}
    </div>
  );
}
