/**
 * ConfidenceBar Component — Inline confidence visualization
 *
 * Per 03-UI-SPEC.md: Renders a horizontal bar (8px height) showing drift confidence
 * with color-coded zones:
 * - Red (0.0–0.33): Low confidence
 * - Yellow (0.33–0.66): Medium confidence
 * - Green (0.66–1.0): High confidence
 *
 * Includes inline percentage label.
 */

import React from "react";

interface ConfidenceBarProps {
  /** Confidence score (0.0 to 1.0) */
  confidence: number;
  /** Optional CSS class override */
  className?: string;
}

export function ConfidenceBar({
  confidence,
  className = "",
}: ConfidenceBarProps): React.ReactElement {
  // Clamp to 0..1
  const normalized = Math.max(0, Math.min(1, confidence));
  const percentage = Math.round(normalized * 100);

  // Determine color zone
  let colorClass: string;
  if (normalized < 0.33) {
    colorClass = "bg-destructive";
  } else if (normalized < 0.66) {
    colorClass = "bg-accent";
  } else {
    colorClass = "bg-accent";
  }

  return (
    <div className={`flex items-center gap-sm ${className}`}>
      {/* Bar container */}
      <div className="flex-1 h-[8px] bg-card rounded overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-300`}
          style={{ width: `${normalized * 100}%` }}
          role="meter"
          aria-label={`Confidence: ${percentage}%`}
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Percentage label */}
      <span className="text-label font-normal text-foreground/70 w-12 text-right">
        {percentage}%
      </span>
    </div>
  );
}
