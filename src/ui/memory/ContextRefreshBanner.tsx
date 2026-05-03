/**
 * ContextRefreshBanner Component
 *
 * Per D-08, D-09, UI-SPEC: informational banner in Assess mode showing context of prior findings.
 *
 * Displays:
 * "Assessed against N prior findings still open. This helps prevent duplicate recommendations."
 *
 * With optional link to view prior findings in History tab (pre-filtered by status=open + mode=Assess).
 *
 * Usage: rendered at top of DriftReportPanel in AssessPanel.
 */

import React from "react";

interface ContextRefreshBannerProps {
  priorOpenFindingsCount: number;
  deduplicatedCount?: number;
  onViewFindings?: () => void;
}

/**
 * Renders context-refresh banner for Assess mode.
 * Per D-08, UI-SPEC: light background with optional accent left border.
 */
export const ContextRefreshBanner: React.FC<ContextRefreshBannerProps> = ({
  priorOpenFindingsCount,
  deduplicatedCount = 0,
  onViewFindings,
}) => {
  if (priorOpenFindingsCount === 0) return null;

  const findingLabel =
    priorOpenFindingsCount === 1 ? "finding" : "findings";
  const deduplicationText =
    deduplicatedCount > 0
      ? ` (${deduplicatedCount} ${deduplicatedCount === 1 ? "is" : "are"} ${deduplicatedCount === 1 ? "a" : ""} repeat${deduplicatedCount === 1 ? "" : "s"} of earlier issues)`
      : "";

  return (
    <div className="p-md bg-card border-l-4 border-accent rounded mb-md">
      <p className="text-body text-foreground/90">
        Assessed against{" "}
        {onViewFindings ? (
          <button
            onClick={onViewFindings}
            className="text-accent hover:underline font-bold"
            aria-label={`View ${priorOpenFindingsCount} prior findings`}
          >
            {priorOpenFindingsCount} {findingLabel} from prior audits
          </button>
        ) : (
          <span className="font-bold">
            {priorOpenFindingsCount} {findingLabel} from prior audits
          </span>
        )}{" "}
        still open{deduplicationText}. This helps prevent duplicate recommendations.
      </p>
    </div>
  );
};
