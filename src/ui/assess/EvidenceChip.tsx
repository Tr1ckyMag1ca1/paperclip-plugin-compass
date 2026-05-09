/**
 * EvidenceChip Component — Evidence strength indicator
 *
 * Per Phase 8 D-07: Reuses StatusBadge component from Phase 7.
 * Maps evidence strength to StatusBadge status for semantic color consistency.
 *
 * Displays:
 * - "Strong" with emerald checkmark for strong evidence
 * - "Stalled" with red X for weak evidence
 * - "Unknown" with neutral indicator for unknown strength
 */

import React from "react";
import { StatusBadge } from "../components/StatusBadge.js";

interface EvidenceChipProps {
  /** Evidence strength: strong | weak | unknown */
  strength: "strong" | "weak" | "unknown";
}

/**
 * Maps evidence strength to StatusBadge status.
 * Part of Phase 7 semantic palette lock (emerald=success, red=error, muted=unknown).
 */
function mapEvidenceStrengthToStatus(
  strength: "strong" | "weak" | "unknown"
): "healthy" | "stalled" | "unknown" {
  switch (strength) {
    case "strong":
      return "healthy";
    case "weak":
      return "stalled";
    case "unknown":
      return "unknown";
  }
}

/**
 * EvidenceChip — Thin wrapper around StatusBadge for evidence strength display.
 *
 * Reuses Phase 7 StatusBadge component to ensure semantic color consistency
 * with drift severity and confidence threshold indicators.
 *
 * @param strength Evidence strength level (strong/weak/unknown)
 */
export function EvidenceChip({ strength }: EvidenceChipProps): React.ReactElement {
  const status = mapEvidenceStrengthToStatus(strength);
  return <StatusBadge status={status} />;
}
