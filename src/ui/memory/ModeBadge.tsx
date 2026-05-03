/**
 * ModeBadge Component
 *
 * Per D-16, UI-SPEC: displays mode label (Found/Assess/Revive/Reposition) with icon and text.
 * Small badge with neutral styling.
 */

import React from "react";
import { Rocket, Binoculars, Zap, ArrowRight } from "lucide-react";
import type { Mode } from "../../types/memory.js";

interface ModeBadgeProps {
  mode: Mode;
}

/**
 * Renders mode indicator with icon and label.
 * Per UI-SPEC: neutral text, subtle background.
 */
export const ModeBadge: React.FC<ModeBadgeProps> = ({ mode }) => {
  const icons = {
    Found: <Rocket className="w-4 h-4" />,
    Assess: <Binoculars className="w-4 h-4" />,
    Revive: <Zap className="w-4 h-4" />,
    Reposition: <ArrowRight className="w-4 h-4" />,
  };

  return (
    <span
      className="inline-flex items-center gap-xs px-xs py-xs rounded-full bg-foreground/10 text-foreground text-label font-bold"
      role="status"
      aria-label={`Mode: ${mode}`}
    >
      {icons[mode]}
      {mode}
    </span>
  );
};
