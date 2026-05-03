/**
 * ScopeConfirmation Component — Section selection via checkboxes
 *
 * Per 05-UI-SPEC.md §Phase 2: Founder reviews and overrides classified scope.
 * Displays all 18 VISION sections as checkboxes, pre-checks classified sections,
 * allows founder to toggle any section on/off. Requires minimum 1 selected.
 */

import React, { useState, useCallback, useMemo } from "react";
import type { VisionSectionId, ShiftScope } from "../../types/reposition.js";

const VISION_SECTIONS: Array<{ id: VisionSectionId; label: string }> = [
  { id: "mission", label: "Mission" },
  { id: "mandate", label: "Mandate" },
  { id: "voice", label: "Voice" },
  { id: "principles", label: "Principles" },
  { id: "success_criteria_12mo", label: "Success Criteria (12-month)" },
  { id: "success_criteria", label: "Success Criteria (long-term)" },
  { id: "vision_3year", label: "Vision (3-year)" },
  { id: "growth_strategy", label: "Growth Strategy" },
  { id: "revenue_model", label: "Revenue Model" },
  { id: "issue_structure", label: "Issue Structure" },
  { id: "target_customer", label: "Target Customer" },
  { id: "launch_plan", label: "Launch Plan" },
  { id: "trust_governance", label: "Trust Governance" },
  { id: "sales_model", label: "Sales Model" },
  { id: "product_direction", label: "Product Direction" },
  { id: "org_structure", label: "Org Structure" },
  { id: "operating_philosophy", label: "Operating Philosophy" },
  { id: "ceo_mandate", label: "CEO Mandate" },
  { id: "locality", label: "Locality" },
];

interface ScopeConfirmationProps {
  /** Classified scope from shift classifier */
  classifiedScope: ShiftScope;
  /** Callback when founder confirms scope */
  onConfirm: (selectedSections: VisionSectionId[]) => Promise<void>;
  /** Callback to go back to intent */
  onBack: () => void;
}

/**
 * Checkbox list for VISION section selection with founder override capability.
 */
export function ScopeConfirmation({
  classifiedScope,
  onConfirm,
  onBack,
}: ScopeConfirmationProps): React.ReactElement {
  const [selectedSections, setSelectedSections] = useState<Set<VisionSectionId>>(
    new Set(classifiedScope.affectedSections)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = selectedSections.size >= 1;

  const handleToggleSection = useCallback((sectionId: VisionSectionId) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!isValid) return;

    try {
      setError(null);
      setIsLoading(true);
      await onConfirm(Array.from(selectedSections));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to confirm scope";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSections, isValid, onConfirm]);

  const classifiedSet = useMemo(
    () => new Set(classifiedScope.affectedSections),
    [classifiedScope]
  );

  return (
    <div className="space-y-lg">
      {/* Header */}
      <div>
        <h2 className="text-heading font-bold text-foreground">Which sections change?</h2>
        <p className="text-body font-normal text-foreground/70 mt-sm">
          These sections will be re-interviewed. Add or remove any.
        </p>
      </div>

      {/* Classifier rationale */}
      <div className="p-md bg-card rounded border border-border">
        <p className="text-label font-normal text-foreground/70">
          {classifiedScope.rationale}
        </p>
      </div>

      {/* Checkbox list */}
      <div className="space-y-sm">
        {VISION_SECTIONS.map(({ id, label }) => {
          const isChecked = selectedSections.has(id);
          const wasClassified = classifiedSet.has(id);

          return (
            <label
              key={id}
              className="flex items-center gap-md cursor-pointer group p-sm hover:bg-card rounded transition-colors"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => handleToggleSection(id)}
                className="w-4 h-4 rounded border border-border checked:bg-accent checked:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <span className="text-body font-normal text-foreground flex-1">
                {label}
              </span>
              {!wasClassified && (
                <span className="text-label font-normal text-foreground/70">
                  (optional)
                </span>
              )}
            </label>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-body font-normal text-destructive">
          {error}
        </p>
      )}

      {/* Validation message */}
      {!isValid && selectedSections.size === 0 && (
        <p className="text-body font-normal text-destructive">
          Select at least 1 section to continue.
        </p>
      )}

      {/* Buttons */}
      <div className="flex gap-md pt-md">
        <button
          onClick={onBack}
          className="flex-1 px-lg py-md text-accent font-bold border border-border rounded hover:bg-card transition-colors"
        >
          ← Back to shift description
        </button>
        <button
          onClick={handleConfirm}
          disabled={!isValid || isLoading}
          className="flex-1 px-lg py-md bg-accent text-white font-bold rounded hover:bg-accent/90 disabled:bg-foreground/20 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Loading..." : "Continue to interview"}
        </button>
      </div>
    </div>
  );
}
