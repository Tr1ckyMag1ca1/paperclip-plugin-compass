/**
 * FindingStatusBadge Component
 *
 * Per D-12, UI-SPEC: displays finding status (open/addressed/invalidated) with color coding.
 * - open = accent (current, active findings)
 * - addressed = green (resolved findings)
 * - invalidated = muted/gray (no longer relevant)
 *
 * Simple badge: no interaction, text label only.
 */

import React from "react";
import type { FindingStatus } from "../../types/memory.js";

interface FindingStatusBadgeProps {
  status: FindingStatus;
}

/**
 * Renders colored badge for finding status.
 * Per UI-SPEC: px-xs py-xs (4px inline, 2px vertical).
 */
export const FindingStatusBadge: React.FC<FindingStatusBadgeProps> = ({ status }) => {
  const styleClass = {
    open: "bg-accent/20 text-accent",
    addressed: "bg-green-500/20 text-green-600",
    invalidated: "bg-foreground/10 text-foreground/50",
  }[status];

  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`inline-block px-xs py-xs rounded-full text-label font-bold ${styleClass}`}
      role="status"
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  );
};
