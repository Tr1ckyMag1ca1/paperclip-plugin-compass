/**
 * AmendmentPreview Component — Per-section amendment diff display
 *
 * Per 05-UI-SPEC.md §Phase 4: Shows generated amendments before cascade review.
 * Reuses Phase 3 AmendmentDiff component, displays all amendments expanded by default.
 */

import React, { useCallback, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { AmendmentDiff } from "../assess/AmendmentDiff.js";
import type { Amendment, VisionSectionId } from "../../types/reposition.js";

// Map section IDs to human-readable labels
const SECTION_LABELS: Record<VisionSectionId, string> = {
  mission: "Mission",
  mandate: "Mandate",
  voice: "Voice",
  principles: "Principles",
  success_criteria_12mo: "Success Criteria (12-month)",
  success_criteria: "Success Criteria (long-term)",
  vision_3year: "Vision (3-year)",
  growth_strategy: "Growth Strategy",
  revenue_model: "Revenue Model",
  issue_structure: "Issue Structure",
  target_customer: "Target Customer",
  launch_plan: "Launch Plan",
  trust_governance: "Trust Governance",
  sales_model: "Sales Model",
  product_direction: "Product Direction",
  org_structure: "Org Structure",
  operating_philosophy: "Operating Philosophy",
  ceo_mandate: "CEO Mandate",
  locality: "Locality",
};

interface AmendmentPreviewProps {
  /** Amendments to display */
  amendments: Amendment[];
  /** Callback to go back to interview */
  onBack: () => void;
  /** Callback to continue to cascade review */
  onContinue: () => Promise<void>;
}

/**
 * Amendment preview with per-section diffs, reuses Phase 3 AmendmentDiff.
 */
export function AmendmentPreview({
  amendments,
  onBack,
  onContinue,
}: AmendmentPreviewProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      await onContinue();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to continue";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [onContinue]);

  return (
    <div className="space-y-lg">
      {/* Header */}
      <div>
        <h2 className="text-display font-bold text-foreground">
          Review the proposed changes
        </h2>
      </div>

      {/* Amendments list */}
      <div className="space-y-lg">
        {amendments.map((amendment) => {
          const sectionLabel = SECTION_LABELS[amendment.section] || amendment.section;

          // Format as unified diff for AmendmentDiff component
          const diff = `- ${amendment.currentContent}\n+ ${amendment.proposedContent}`;

          return (
            <div key={amendment.section} className="border border-border rounded p-4 space-y-3">
              <h3 className="text-base font-semibold font-bold text-foreground">
                {sectionLabel}
              </h3>

              <div className="text-xs font-medium font-normal text-foreground/70">
                {amendment.reason}
              </div>

              <AmendmentDiff amendment={diff} />
            </div>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm font-normal text-destructive p-3 bg-destructive/10 rounded border border-destructive">
          {error}
        </p>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-3">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 px-4 py-3 text-accent font-bold border border-border rounded hover:bg-card disabled:opacity-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 inline mr-sm" />
          Back to interview
        </button>
        <button
          onClick={handleContinue}
          disabled={isLoading}
          className="flex-1 px-4 py-3 bg-accent text-white font-bold rounded hover:bg-accent/90 disabled:bg-foreground/20 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Loading..." : "Review cascade"}
        </button>
      </div>
    </div>
  );
}
