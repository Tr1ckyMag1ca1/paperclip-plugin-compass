import React from "react";
import { Check, X } from "lucide-react";

interface StatusBadgeProps {
  status: "healthy" | "stalled" | "unknown";
}

/**
 * StatusBadge — Small label for status states.
 *
 * Per UI-SPEC.md, displays:
 * - "Healthy" with green checkmark for healthy agents
 * - "Stalled" with red X for stalled agents
 * - "Unknown" with neutral indicator for unknown status
 *
 * Used in AgentCard, VISION status display, and other status-aware components.
 *
 * @param status Status state
 */
export function StatusBadge({ status }: StatusBadgeProps): React.ReactElement {
  const config = {
    healthy: {
      icon: <Check className="h-3 w-3" />,
      label: "Healthy",
      className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    stalled: {
      icon: <X className="h-3 w-3" />,
      label: "Stalled",
      className: "bg-red-500/10 text-red-500 border-red-500/20",
    },
    unknown: {
      icon: null,
      label: "Unknown",
      className: "bg-muted text-muted-foreground border-border",
    },
  }[status];

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-none text-xs font-medium border ${config.className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}
