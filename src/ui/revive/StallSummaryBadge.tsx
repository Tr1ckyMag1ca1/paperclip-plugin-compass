/**
 * StallSummaryBadge Component
 *
 * Per Phase 9 UI-SPEC.md (D-02): displays company stall status in header.
 * Shows days since last heartbeat + number of open blockers.
 * Format: "Stalled — {N} days no activity, {N} blocker(s)"
 *
 * Uses static STALL_SEVERITY_CLASSES map (Tailwind JIT-safe, reuses Phase 8 D-01 pattern).
 */

import React from "react";
import type { InventorySnapshot } from "../../types.js";

interface StallSummaryBadgeProps {
  inventory: InventorySnapshot;
}

/**
 * Static stall severity color map per Phase 9 D-02.
 * Reuses Phase 8 D-01 severity pattern for consistency.
 * Full class strings for Tailwind JIT safety.
 */
const STALL_SEVERITY_CLASSES: Record<"low" | "medium" | "high", string> = {
  low: "px-3 py-2 text-xs font-medium text-muted-foreground bg-muted rounded-none",
  medium: "px-3 py-2 text-xs font-medium text-yellow-600 bg-yellow-500/10 rounded-none",
  high: "px-3 py-2 text-xs font-medium text-red-600 bg-red-500/10 rounded-none",
};

/**
 * Renders stall summary: days inactive + blocker count.
 * Displayed in RevivePanel header with severity-based color coding.
 */
export const StallSummaryBadge: React.FC<StallSummaryBadgeProps> = ({ inventory }) => {
  // Calculate days since last heartbeat
  const daysSinceHeartbeat = inventory.latestHeartbeat
    ? Math.floor((Date.now() - new Date(inventory.latestHeartbeat).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const blockerCount = inventory.blockerCount || 0;

  // Determine severity based on days and blocker count
  let severity: "low" | "medium" | "high";
  if (daysSinceHeartbeat > 14 || blockerCount > 3) {
    severity = "high";
  } else if (daysSinceHeartbeat > 7 || blockerCount > 1) {
    severity = "medium";
  } else {
    severity = "low";
  }

  const severityClasses = STALL_SEVERITY_CLASSES[severity];

  return (
    <div className={severityClasses}>
      <span>
        Stalled — {daysSinceHeartbeat} days no activity, {blockerCount} blocker(s)
      </span>
    </div>
  );
};
