/**
 * ConfidenceBar Component — Threshold-driven confidence visualization
 *
 * Per Phase 8 D-08: Renders a horizontal bar (8px height) showing drift confidence
 * with threshold-driven semantic colors:
 * - High (>0.75): Emerald (success, confident)
 * - Medium (0.4–0.75): Yellow (warning, moderately confident)
 * - Low (<0.4): Red (error, low confidence)
 *
 * Includes inline percentage label to the right.
 */

import React from "react";

interface ConfidenceBarProps {
  /** Confidence score (0.0 to 1.0) */
  confidence: number;
  /** Optional CSS class override */
  className?: string;
  /** Whether to show the label (default true) */
  label?: boolean;
}

/**
 * Threshold-driven fill color map.
 * Maps confidence levels to semantic color classes per Phase 7 D-04 palette.
 */
const CONFIDENCE_FILL_CLASSES = {
  high: "bg-emerald-500",
  medium: "bg-yellow-500",
  low: "bg-red-500",
};

/**
 * Calculate confidence level based on score thresholds.
 *
 * Thresholds (per Phase 8 D-08):
 * - High: confidence > 0.75
 * - Medium: 0.4 <= confidence <= 0.75
 * - Low: confidence < 0.4
 */
function getConfidenceLevel(
  confidence: number
): "high" | "medium" | "low" {
  if (confidence > 0.75) return "high";
  if (confidence >= 0.4) return "medium";
  return "low";
}

/**
 * ConfidenceBar — Threshold-driven confidence visualization.
 *
 * Displays a horizontal progress bar with semantic color fill determined by
 * confidence threshold. Track uses host muted surface; fill color from
 * CONFIDENCE_FILL_CLASSES map. Label displays percentage, right-aligned.
 *
 * @param confidence Confidence score (0–1 range)
 * @param label Whether to show percentage label (default true)
 * @param className Optional additional CSS classes
 */
export function ConfidenceBar({
  confidence,
  label = true,
  className = "",
}: ConfidenceBarProps): React.ReactElement {
  // Clamp to 0..1
  const normalized = Math.max(0, Math.min(1, confidence));
  const percentage = Math.round(normalized * 100);
  const level = getConfidenceLevel(normalized);
  const fillClass = CONFIDENCE_FILL_CLASSES[level];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Track + fill */}
      <div className="flex-1 h-2 bg-muted rounded-none overflow-hidden">
        <div
          className={`h-full ${fillClass} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
          role="meter"
          aria-label={`Confidence: ${percentage}%`}
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Percentage label */}
      {label && (
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap w-12 text-right">
          {percentage}%
        </span>
      )}
    </div>
  );
}
