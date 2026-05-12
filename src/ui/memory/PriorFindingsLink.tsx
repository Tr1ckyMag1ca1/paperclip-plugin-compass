/**
 * PriorFindingsLink Component
 *
 * Per D-11, UI-SPEC: small link component in mode panel headers.
 *
 * Displays: "View N prior findings" as inline link.
 * Behavior: clicking opens History tab pre-filtered by status=open + mode.
 *
 * Usage: rendered in Found/Assess/Revive/Reposition panel headers when
 * relevant open findings exist.
 */

import React from "react";

interface PriorFindingsLinkProps {
  findingCount: number;
  onViewFindings: () => void;
}

/**
 * Renders link to prior findings.
 * Per UI-SPEC: text link with accent color, underline on hover.
 */
export const PriorFindingsLink: React.FC<PriorFindingsLinkProps> = ({
  findingCount,
  onViewFindings,
}) => {
  if (findingCount === 0) return null;

  const label =
    findingCount === 1 ? "View 1 prior finding" : `View ${findingCount} prior findings`;

  return (
    <button
      onClick={onViewFindings}
      className="text-xs font-medium text-accent hover:underline font-bold"
      aria-label={label}
    >
      {label}
    </button>
  );
};
