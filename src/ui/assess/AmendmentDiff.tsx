/**
 * AmendmentDiff Component — Unified diff viewer in collapsible details
 *
 * Per Phase 8 D-04, D-05: Semantic line highlighting with collapsible structure.
 * Add lines: emerald (success signal). Remove lines: red (removal signal).
 * Context lines: neutral. Structure preserved; token migration only.
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
 * Renders a unified diff in proportional font with semantic line highlighting.
 * Wrapped in collapsible <details> for compact display.
 * D-04: Add lines emerald, remove lines red, context neutral.
 * D-05: Collapsible structure preserved; pure token migration.
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
      <summary className="cursor-pointer flex items-center gap-2 text-xs font-medium text-foreground hover:text-foreground/80 transition-colors p-2 hover:bg-muted rounded-none select-none">
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        <span>Proposed amendment:</span>
      </summary>

      {/* Diff content with semantic highlighting (D-04, D-05) */}
      <div className="mt-3 p-3 bg-muted rounded-none border border-border overflow-x-auto">
        <pre className="text-xs font-normal leading-relaxed whitespace-pre-wrap break-words">
          {lines.map((line, idx) => {
            // Determine line type and apply semantic highlighting (D-04)
            if (line.startsWith("+")) {
              // Add line: emerald text + subtle bg tint (success signal)
              return (
                <div key={idx} className="text-emerald-600 bg-emerald-500/10">
                  {line}
                </div>
              );
            } else if (line.startsWith("-")) {
              // Remove line: red text + subtle bg tint (removal signal)
              return (
                <div key={idx} className="text-red-600 bg-red-500/10">
                  {line}
                </div>
              );
            } else {
              // Context line: neutral text, no background
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
