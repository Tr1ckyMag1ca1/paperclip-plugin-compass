/**
 * StallSummaryBadge Component
 *
 * Per 04-UI-SPEC.md, D-14: displays company stall status in header.
 * Shows days since last heartbeat + number of open blockers.
 * Format: "Stalled — {N} days no activity, {N} blocker(s)"
 */

import React from "react";
import type { InventorySnapshot } from "../../types.js";

interface StallSummaryBadgeProps {
  inventory: InventorySnapshot;
}

/**
 * Renders stall summary: days inactive + blocker count.
 * Displayed in RevivePanel header per D-14.
 */
export const StallSummaryBadge: React.FC<StallSummaryBadgeProps> = ({ inventory }) => {
  // Calculate days since last heartbeat
  const daysSinceHeartbeat = inventory.latestHeartbeat
    ? Math.floor((Date.now() - inventory.latestHeartbeat.getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const blockerCount = inventory.blockerCount || 0;

  return (
    <div className="my-md px-md py-sm bg-card rounded border border-destructive">
      <span className="text-label font-medium">
        Stalled — {daysSinceHeartbeat} days no activity, {blockerCount} blocker(s)
      </span>
    </div>
  );
};
