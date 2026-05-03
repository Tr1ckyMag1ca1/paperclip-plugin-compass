/**
 * DriftReportPanel Component — Grouped drift report by VISION section
 *
 * Per 03-UI-SPEC.md: Renders all drift items grouped by VISION section,
 * with section headers and severity badges. Scrollable main panel.
 */

import React, { useMemo } from "react";
import { DriftItemCard } from "./DriftItemCard.js";
import type { DriftReport, DriftItem, ActivityItem } from "../../types/assess.js";

/** Mapping of section keys to readable section names */
const SECTION_NAMES: Record<string, string> = {
  mission: "Mission",
  mandate: "Mandate",
  voice: "Voice",
  principles: "Principles",
  success_criteria_12mo: "12-Month Success Criteria",
  vision_3year: "3-Year Vision",
  target_customer: "Target Customer",
  issue_structure: "Issue Structure",
  locality: "Locality",
  revenue_model: "Revenue Model",
  launch_plan: "Launch Plan",
  trust_governance: "Trust & Governance",
  growth_strategy: "Growth Strategy",
  sales_model: "Sales Model",
  product_direction: "Product Direction",
  org_structure: "Organizational Structure",
  operating_philosophy: "Operating Philosophy",
  ceo_mandate: "CEO Mandate",
  success_criteria: "Success Criteria",
};

interface DriftReportPanelProps {
  /** The drift report from detector */
  report: DriftReport;
  /** Map of item keys to acceptance state */
  acceptedState: { [key: string]: boolean | null };
  /** Callback when Accept button clicked for an item */
  onAcceptItem: (itemIndex: number) => void;
  /** Callback when Reject button clicked for an item */
  onRejectItem: (itemIndex: number) => void;
  /** Optional callback when evidence is clicked */
  onEvidenceClick?: (evidence: ActivityItem) => void;
  /** Optional callback to expand all evidence */
  onExpandAllEvidence?: (itemIndex: number) => void;
}

/**
 * Renders drift report grouped by VISION section with individual item cards.
 */
export function DriftReportPanel({
  report,
  acceptedState,
  onAcceptItem,
  onRejectItem,
  onEvidenceClick,
  onExpandAllEvidence,
}: DriftReportPanelProps): React.ReactElement {
  // Group items by section
  const groupedItems = useMemo(() => {
    const groups: Record<string, DriftItem[]> = {};

    report.items.forEach(item => {
      const section = item.visionSection as string;
      if (!groups[section]) {
        groups[section] = [];
      }
      groups[section].push(item);
    });

    return groups;
  }, [report.items]);

  // Determine section order based on VISION template
  const sectionOrder = [
    "mission",
    "mandate",
    "voice",
    "principles",
    "success_criteria_12mo",
    "vision_3year",
    "target_customer",
    "issue_structure",
    "locality",
    "revenue_model",
    "launch_plan",
    "trust_governance",
    "growth_strategy",
    "sales_model",
    "product_direction",
    "org_structure",
    "operating_philosophy",
    "ceo_mandate",
    "success_criteria",
  ];

  const orderedSections = sectionOrder.filter(s => groupedItems[s]);

  return (
    <div className="space-y-xl">
      {orderedSections.map(sectionKey => {
        const items = groupedItems[sectionKey];
        const sectionName = SECTION_NAMES[sectionKey] || sectionKey;

        // Calculate max severity in this section
        const severities = items.map(i => i.severity);
        const maxSeverity = severities.includes("blocker")
          ? "blocker"
          : severities.includes("warn")
            ? "warn"
            : "info";

        const severityColor: Record<string, string> = {
          info: "text-foreground/70",
          warn: "text-accent",
          blocker: "text-destructive",
        };

        return (
          <section key={sectionKey} className="space-y-md">
            {/* Section header */}
            <div className="flex items-center gap-md">
              <h3 className="text-heading font-bold">
                {sectionName} — {items.length} drift detected
              </h3>
              <span className={`text-label font-normal ${severityColor[maxSeverity]}`}>
                {maxSeverity}
              </span>
            </div>

            {/* Drift items for this section */}
            <div className="space-y-md">
              {items.map((item, idx) => {
                // Create a stable key for this item across the whole report
                const itemKey = `${sectionKey}-${idx}`;
                const state = acceptedState[itemKey] ?? null;

                return (
                  <DriftItemCard
                    key={itemKey}
                    item={item}
                    acceptedState={state}
                    onAccept={() => onAcceptItem(idx)}
                    onReject={() => onRejectItem(idx)}
                    onEvidenceClick={onEvidenceClick}
                    onExpandAllEvidence={
                      onExpandAllEvidence ? () => onExpandAllEvidence(idx) : undefined
                    }
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      {report.items.length === 0 && (
        <div className="text-center py-xl space-y-md">
          <p className="text-body font-normal text-foreground/70">
            No drift detected. Your company is aligned with the vision.
          </p>
        </div>
      )}
    </div>
  );
}
