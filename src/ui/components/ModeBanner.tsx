import React from "react";
import { Compass } from "lucide-react";
import type { InventorySnapshot, Mode } from "../../types.js";

interface ModeBannerProps {
  inventory: InventorySnapshot;
  detectedMode: Mode;
  override: Mode | null;
  onOverrideChange: (mode: Mode) => void;
}

/**
 * ModeBanner — Displays detected company mode and override dropdown.
 *
 * Per D-03 (mode banner at top with override dropdown) and UI-SPEC.md,
 * renders:
 * - Mode label (e.g., "Assess mode")
 * - Founder-readable description (e.g., "your company is healthy...")
 * - Override dropdown with four action-focused labels
 *
 * On dropdown change, calls onOverrideChange which persists to Plugin SDK state
 * (D-09, MODE-03).
 *
 * @param inventory Inventory snapshot (used for context in future)
 * @param detectedMode Auto-detected mode
 * @param override Stored founder override (if any)
 * @param onOverrideChange Callback when founder changes dropdown
 */
export function ModeBanner({
  inventory,
  detectedMode,
  override,
  onOverrideChange,
}: ModeBannerProps): React.ReactElement {
  const currentMode = override || detectedMode;

  return (
    <div className="border-b bg-card px-lg py-lg">
      <div className="flex items-center justify-between gap-md">
        <div className="flex items-start gap-md flex-1">
          <Compass className="h-5 w-5 mt-1 text-accent flex-shrink-0" />
          <div>
            <h2 className="text-heading font-semibold leading-tight">
              {getModeLabel(currentMode)}
            </h2>
            <p className="text-body text-foreground/70 mt-xs">
              {getModeBannerCopy(currentMode)}
            </p>
          </div>
        </div>

        {/* Mode override dropdown (D-09, MODE-03) */}
        <select
          value={currentMode}
          onChange={(e) => onOverrideChange(e.target.value as Mode)}
          className="rounded border border-border bg-background px-md py-sm text-sm font-medium text-foreground hover:bg-accent/5 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="Found">Found a new company</option>
          <option value="Assess">Run a fresh audit</option>
          <option value="Revive">Get unstuck</option>
          <option value="Reposition">Pivot strategy</option>
        </select>
      </div>
    </div>
  );
}

/**
 * Get mode label for display (e.g., "Assess mode").
 *
 * Per UI-SPEC.md copywriting contract, mode label is the technical name
 * followed by "mode" (e.g., "Assess mode", "Found mode").
 *
 * @param mode The company's current mode
 * @returns Display label
 */
function getModeLabel(mode: Mode): string {
  const labels: Record<Mode, string> = {
    Found: "Found mode",
    Assess: "Assess mode",
    Revive: "Revive mode",
    Reposition: "Reposition mode",
  };
  return labels[mode];
}

/**
 * Get mode banner copy (founder-readable description).
 *
 * Per UI-SPEC.md copywriting contract, copy describes what Compass can do
 * in this mode (action-focused, not technical).
 *
 * @param mode The company's current mode
 * @returns Founder-readable description
 */
function getModeBannerCopy(mode: Mode): string {
  const copy: Record<Mode, string> = {
    Found:
      "No company yet. Let's create a strategic foundation with the vision quest.",
    Assess:
      "Your company is healthy. Compass can audit drift since the last review.",
    Revive:
      "Your company is stalled. Let's diagnose the blocker and unlock progress.",
    Reposition:
      "Your company is healthy. Let's execute a strategic shift together.",
  };
  return copy[mode];
}
