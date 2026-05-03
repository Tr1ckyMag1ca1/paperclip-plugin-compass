/**
 * CustomOverrideWarning Component — Agent custom instruction override alert
 *
 * Per 03-UI-SPEC.md: Shown during Apply preview when an affected agent has
 * custom instruction overrides. Requires explicit founder confirmation before
 * proceeding with cascade.
 */

import React, { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";

interface OverrideDetail {
  agentName: string;
  sectionName: string;
  customOverride: string;
  proposedChange: string;
}

interface CustomOverrideWarningProps {
  /** Details of the override conflict */
  override: OverrideDetail;
  /** Whether confirmation is required to proceed */
  requiresConfirmation?: boolean;
  /** Callback when checkbox is toggled (if requiresConfirmation) */
  onConfirmed?: (confirmed: boolean) => void;
}

/**
 * Warning card shown when affected agent has custom overrides.
 * Requires explicit confirmation before allowing Apply to proceed.
 */
export function CustomOverrideWarning({
  override,
  requiresConfirmation = false,
  onConfirmed,
}: CustomOverrideWarningProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleConfirmChange = (checked: boolean) => {
    setIsConfirmed(checked);
    onConfirmed?.(checked);
  };

  return (
    <div className="bg-destructive/10 border border-l-4 border-l-destructive border-destructive rounded p-lg space-y-md">
      {/* Header */}
      <div className="flex gap-md items-start">
        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-heading font-bold text-destructive">
            Agent {override.agentName} has custom instructions
          </h3>
          <p className="text-body font-normal text-foreground mt-sm">
            This agent's instructions have been customized beyond the preset baseline.
            The {override.sectionName} amendment will cascade as a new work item, but
            the agent's custom overrides will not be automatically merged.
          </p>
        </div>
      </div>

      {/* Diff details (collapsible) */}
      <details
        open={isExpanded}
        onToggle={e => setIsExpanded(e.currentTarget.open)}
        className="group"
      >
        <summary className="cursor-pointer flex items-center gap-sm text-label font-normal text-foreground hover:text-foreground/80 transition-colors p-sm hover:bg-background rounded select-none">
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          <span>Review override conflict</span>
        </summary>

        {/* Diff content */}
        <div className="mt-md p-md bg-background rounded border border-border space-y-md">
          <div>
            <p className="text-label font-bold text-foreground mb-sm">Custom override:</p>
            <pre className="text-label font-normal text-foreground/70 bg-card p-sm rounded overflow-x-auto whitespace-pre-wrap">
              {override.customOverride}
            </pre>
          </div>

          <div>
            <p className="text-label font-bold text-foreground mb-sm">Proposed change:</p>
            <pre className="text-label font-normal text-accent bg-card p-sm rounded overflow-x-auto whitespace-pre-wrap">
              {override.proposedChange}
            </pre>
          </div>
        </div>
      </details>

      {/* Confirmation checkbox (if required) */}
      {requiresConfirmation && (
        <label className="flex items-start gap-md cursor-pointer group">
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={e => handleConfirmChange(e.target.checked)}
            className="mt-1 focus:outline-none focus:ring-2 focus:ring-accent rounded"
          />
          <span className="text-body font-normal text-foreground group-hover:text-foreground/80">
            I've reviewed the override conflict and approve cascading anyway
          </span>
        </label>
      )}
    </div>
  );
}

interface CustomOverrideWarningsProps {
  /** Array of override details to display */
  overrides: OverrideDetail[];
  /** Map of agentName to confirmation state */
  confirmationState?: { [agentName: string]: boolean };
  /** Callback when any override confirmation changes */
  onConfirmationChange?: (agentName: string, confirmed: boolean) => void;
}

/**
 * Container rendering multiple custom override warnings.
 * Used during Apply preview when multiple agents have overrides.
 */
export function CustomOverrideWarnings({
  overrides,
  confirmationState = {},
  onConfirmationChange,
}: CustomOverrideWarningsProps): React.ReactElement {
  return (
    <div className="space-y-md">
      <p className="text-body font-bold text-foreground">Custom instruction overrides detected:</p>
      {overrides.map(override => (
        <CustomOverrideWarning
          key={override.agentName}
          override={override}
          requiresConfirmation={true}
          onConfirmed={confirmed =>
            onConfirmationChange?.(override.agentName, confirmed)
          }
        />
      ))}
      {overrides.length > 0 && (
        <p className="text-label font-normal text-foreground/70">
          Please review and confirm for each agent before applying.
        </p>
      )}
    </div>
  );
}
