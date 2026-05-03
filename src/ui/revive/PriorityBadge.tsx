/**
 * PriorityBadge Component
 *
 * Inline priority indicator for ActionItemCard.
 * Per 04-UI-SPEC.md: color-coded badge (High/Medium/Low) based on priority score (0..1).
 *
 * - Low priority (0–0.33): Gray background `bg-card`, `text-foreground`
 * - Medium priority (0.33–0.66): Accent background `bg-accent/20`, `text-accent` bold
 * - High priority (0.66–1.0): Destructive background `bg-destructive/20`, `text-destructive` bold
 */

import React from "react";

interface PriorityBadgeProps {
  /** Priority score (0..1) */
  priority: number;
}

/**
 * Renders a color-coded priority badge with label.
 */
export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  let label: string;
  let bgClass: string;
  let textClass: string;

  if (priority >= 0.66) {
    label = "High";
    bgClass = "bg-destructive/20";
    textClass = "text-destructive font-bold";
  } else if (priority >= 0.33) {
    label = "Medium";
    bgClass = "bg-accent/20";
    textClass = "text-accent font-semibold";
  } else {
    label = "Low";
    bgClass = "bg-card";
    textClass = "text-foreground";
  }

  return (
    <span
      className={`px-xs py-xs rounded text-label ${bgClass} ${textClass}`}
      aria-label={`Priority: ${label}`}
    >
      {label}
    </span>
  );
};
