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
      className: "bg-green-50 text-green-700 border-green-200",
    },
    stalled: {
      icon: <X className="h-3 w-3" />,
      label: "Stalled",
      className: "bg-red-50 text-red-700 border-red-200",
    },
    unknown: {
      icon: null,
      label: "Unknown",
      className: "bg-slate-50 text-slate-600 border-slate-200",
    },
  }[status];

  return (
    <div
      className={`inline-flex items-center gap-xs px-sm py-xs rounded text-xs font-medium border ${config.className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}
