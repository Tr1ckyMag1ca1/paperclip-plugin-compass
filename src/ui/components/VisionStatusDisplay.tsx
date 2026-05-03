import React from "react";
import { Check, X } from "lucide-react";

interface VisionStatusDisplayProps {
  visionExists: boolean;
}

/**
 * VisionStatusDisplay — Shows VISION.md presence and status.
 *
 * Per UI-SPEC.md, displays:
 * - Check icon + "VISION.md found" if VISION exists
 * - X icon + "No VISION.md — create one to get started" if missing
 * - In future, show last amendment date and section completeness
 *
 * @param visionExists Whether VISION.md exists for this company
 */
export function VisionStatusDisplay({
  visionExists,
}: VisionStatusDisplayProps): React.ReactElement {
  if (visionExists) {
    return (
      <div className="flex items-start gap-md">
        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">VISION.md found</p>
          <p className="text-xs text-foreground/60 mt-xs">
            Your company has a strategic vision document.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-md">
      <X className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-foreground">No VISION.md</p>
        <p className="text-xs text-foreground/60 mt-xs">
          Create one using Found mode to establish your company's strategic foundation.
        </p>
      </div>
    </div>
  );
}
