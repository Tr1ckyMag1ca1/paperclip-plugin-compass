/**
 * PriorityBadge Component
 *
 * Inline priority indicator for ActionItemCard.
 * Per Phase 9 UI-SPEC.md (D-01): color-coded badge (High/Medium/Low) based on priority score (0..1).
 *
 * - Low priority (0–0.33): Muted palette (`text-muted-foreground`, `bg-muted`)
 * - Medium priority (0.33–0.66): Yellow warning palette (`text-yellow-600`, `bg-yellow-500/10`)
 * - High priority (0.66–1.0): Red critical palette (`text-red-600`, `bg-red-500/10`)
 *
 * Uses static PRIORITY_CLASSES map (Tailwind JIT-safe per D-02).
 */

import React from "react";

interface PriorityBadgeProps {
  /** Priority score (0..1) */
  priority: number;
}

/**
 * Static priority color map per Phase 9 D-01.
 * Full class strings for Tailwind JIT safety (no dynamic ternaries).
 */
const PRIORITY_CLASSES: Record<"low" | "medium" | "high", string> = {
  low: "px-2 py-1 text-xs font-medium text-muted-foreground bg-muted rounded-none",
  medium: "px-2 py-1 text-xs font-medium text-yellow-600 bg-yellow-500/10 rounded-none",
  high: "px-2 py-1 text-xs font-medium text-red-600 bg-red-500/10 rounded-none",
};

/**
 * Renders a color-coded priority badge with label.
 */
export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  let label: string;
  let severityKey: "low" | "medium" | "high";

  if (priority >= 0.66) {
    label = "High";
    severityKey = "high";
  } else if (priority >= 0.33) {
    label = "Medium";
    severityKey = "medium";
  } else {
    label = "Low";
    severityKey = "low";
  }

  const classes = PRIORITY_CLASSES[severityKey];

  return (
    <span
      className={classes}
      aria-label={`Priority: ${label}`}
    >
      {label}
    </span>
  );
};
