/**
 * AmendmentDiff Component — Unified diff viewer in collapsible details
 *
 * Per 03-UI-SPEC.md: Lightweight unified diff renderer showing before/after
 * amendment text with syntax highlighting via color/weight contrast.
 * Displayed in collapsible <details> element for space efficiency.
 */

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AmendmentDiffProps {
  /** Proposed amendment in unified diff format (from drift detector) */
  amendment: string;
  /** Optional CSS class */
  className?: string;
}

/**
 * Renders a unified diff in proportional font with color-coded lines.
 * Wrapped in collapsible <details> for compact display.
 */
export function AmendmentDiff({
  amendment,
  className = "",
}: AmendmentDiffProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  // Parse diff lines (simple line-by-line split)
  const lines = amendment.split("\n").filter(line => line.trim().length > 0);

  return (
    <details
      open={isOpen}
      onToggle={e => setIsOpen(e.currentTarget.open)}
      className={`group ${className}`}
    >
      <summary className="cursor-pointer flex items-center gap-sm text-label font-normal text-foreground hover:text-foreground/80 transition-colors p-sm hover:bg-card rounded select-none">
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        <span>Proposed amendment:</span>
      </summary>

      {/* Diff content */}
      <div className="mt-md p-md bg-card rounded border border-border overflow-x-auto">
        <pre className="text-label font-normal leading-relaxed whitespace-pre-wrap break-words">
          {lines.map((line, idx) => {
            // Determine line type and color
            if (line.startsWith("+")) {
              return (
                <div key={idx} className="text-accent">
                  {line}
                </div>
              );
            } else if (line.startsWith("-")) {
              return (
                <div key={idx} className="text-destructive">
                  {line}
                </div>
              );
            } else {
              return (
                <div key={idx} className="text-foreground">
                  {line}
                </div>
              );
            }
          })}
        </pre>
      </div>
    </details>
  );
}
