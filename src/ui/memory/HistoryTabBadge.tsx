/**
 * HistoryTabBadge Component
 *
 * Per D-11, UI-SPEC: displays count of findings in History tab header.
 * Shows as pill badge with accent color when open findings exist.
 *
 * Usage: shown in MainPanel tab header next to "History" label.
 */

import React from "react";

interface HistoryTabBadgeProps {
  count: number;
  hasOpenFindings?: boolean;
}

/**
 * Renders count badge for History tab.
 * Per UI-SPEC: accent color if open findings exist, gray otherwise.
 */
export const HistoryTabBadge: React.FC<HistoryTabBadgeProps> = ({
  count,
  hasOpenFindings = false,
}) => {
  if (count === 0) return null;

  const label = count === 1 ? "1 finding" : `${count} findings`;

  return (
    <span
      className={`inline-block ml-xs px-xs py-xs rounded-full text-label font-bold ${
        hasOpenFindings
          ? "bg-accent/20 text-accent"
          : "bg-foreground/10 text-foreground/70"
      }`}
      role="status"
      aria-label={label}
    >
      ({count})
    </span>
  );
};
