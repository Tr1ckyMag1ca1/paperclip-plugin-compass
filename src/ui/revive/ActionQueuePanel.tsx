/**
 * ActionQueuePanel Component
 *
 * Per 04-UI-SPEC.md, D-06: displays action items grouped by stall cause,
 * with priority sorting within each cause section.
 *
 * Groups and renders ActionItemCard children.
 * Cause section headers: "Stuck on a blocker", "Drifted from vision", etc.
 */

import React from "react";
import type { ActionQueue, StallCause, ActionItem } from "../../types/revive.js";
import { ActionItemCard } from "./ActionItemCard.js";

const CAUSE_HEADERS: Record<StallCause, string> = {
  "single-blocker": "Stuck on a blocker",
  "strategic-drift": "Drifted from vision",
  "broken-integration": "Integration broken",
  "governance-loop": "Stuck in approval loop",
  "dead-agent": "Agent stopped responding",
};

interface ActionQueuePanelProps {
  queue: ActionQueue;
  onActionApply?: (actionId: string) => Promise<void>;
  onActionDismiss?: (actionId: string) => Promise<void>;
}

/**
 * Renders action queue grouped by cause with priority sorting.
 * Per 04-UI-SPEC.md §ActionQueuePanel Structure.
 */
export const ActionQueuePanel: React.FC<ActionQueuePanelProps> = ({
  queue,
  onActionApply,
  onActionDismiss,
}) => {
  return (
    <div className="bg-card border border-border rounded-none p-4 space-y-4">
      {Object.entries(queue.items_by_cause).map(([cause, items]) => {
        if (!items || items.length === 0) return null;

        return (
          <section key={cause}>
            <h3 className="text-base font-semibold mb-3">
              {CAUSE_HEADERS[cause as StallCause]}
            </h3>
            <div className="space-y-3">
              {(items as ActionItem[])
                .sort((a, b) => b.priority - a.priority) // High priority first
                .map((item) => (
                  <ActionItemCard
                    key={item.id}
                    item={item}
                    onApply={onActionApply ? () => onActionApply(item.id) : undefined}
                    onDismiss={onActionDismiss ? () => onActionDismiss(item.id) : undefined}
                  />
                ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
