import React from "react";

interface ColorSwatchProps {
  label: string;
  className: string;
}

/**
 * Single color swatch for verification.
 *
 * Renders a small square with the specified Tailwind class and a label.
 */
function ColorSwatch({ label, className }: ColorSwatchProps): React.ReactElement {
  return (
    <div className="flex gap-2 items-center">
      <div
        className={`w-8 h-8 border border-border flex-shrink-0 ${className}`}
        title={label}
      />
      <span className="text-xs text-foreground">{label}</span>
    </div>
  );
}

/**
 * OklchProbe — Dev-only component verifying Phase 7 color tokens.
 *
 * Renders all Phase 7 color tokens in both light and dark contexts side-by-side
 * for founder visual verification of OKLCH format and opacity modifiers.
 *
 * DEV-ONLY: Removed before Phase 7 ship (UIV-01 requirement).
 *
 * Success criteria for founder visual inspection:
 * - All swatches render (no missing classes)
 * - Opacity modifiers are visually distinct (/10 lighter than /20)
 * - Light column colors match light host theme
 * - Dark column colors match dark host theme
 * - No color "fallback" (bright pink/magenta indicating missing Tailwind class)
 */
export function OklchProbe(): React.ReactElement {
  return (
    <div className="grid grid-cols-2 gap-8 p-8 bg-background min-h-screen">
      {/* Left column: forced light mode */}
      <div className="light">
        <h2 className="text-base font-semibold text-foreground mb-6">Light Mode</h2>
        <div className="space-y-4">
          {/* Surface tokens */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Surfaces</h3>
            <div className="space-y-2">
              <ColorSwatch label="bg-card" className="bg-card" />
              <ColorSwatch label="bg-muted" className="bg-muted" />
              <ColorSwatch label="border-border" className="border-border" />
              <ColorSwatch label="text-foreground (sample)" className="bg-background" />
              <ColorSwatch label="text-muted-foreground (sample)" className="bg-background" />
            </div>
          </div>

          {/* Semantic colors with opacity modifiers */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Semantic - Emerald</h3>
            <div className="space-y-2">
              <ColorSwatch label="bg-emerald-500/10" className="bg-emerald-500/10" />
              <ColorSwatch label="bg-emerald-500/20" className="bg-emerald-500/20" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Semantic - Red</h3>
            <div className="space-y-2">
              <ColorSwatch label="bg-red-500/10" className="bg-red-500/10" />
              <ColorSwatch label="bg-red-500/20" className="bg-red-500/20" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Semantic - Blue</h3>
            <div className="space-y-2">
              <ColorSwatch label="bg-blue-500/10" className="bg-blue-500/10" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Semantic - Yellow</h3>
            <div className="space-y-2">
              <ColorSwatch label="bg-yellow-500/10" className="bg-yellow-500/10" />
            </div>
          </div>
        </div>
      </div>

      {/* Right column: forced dark mode */}
      <div className="dark">
        <h2 className="text-base font-semibold text-foreground mb-6">Dark Mode</h2>
        <div className="space-y-4">
          {/* Surface tokens */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Surfaces</h3>
            <div className="space-y-2">
              <ColorSwatch label="bg-card" className="bg-card" />
              <ColorSwatch label="bg-muted" className="bg-muted" />
              <ColorSwatch label="border-border" className="border-border" />
              <ColorSwatch label="text-foreground (sample)" className="bg-background" />
              <ColorSwatch label="text-muted-foreground (sample)" className="bg-background" />
            </div>
          </div>

          {/* Semantic colors with opacity modifiers */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Semantic - Emerald</h3>
            <div className="space-y-2">
              <ColorSwatch label="bg-emerald-500/10" className="bg-emerald-500/10" />
              <ColorSwatch label="bg-emerald-500/20" className="bg-emerald-500/20" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Semantic - Red</h3>
            <div className="space-y-2">
              <ColorSwatch label="bg-red-500/10" className="bg-red-500/10" />
              <ColorSwatch label="bg-red-500/20" className="bg-red-500/20" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Semantic - Blue</h3>
            <div className="space-y-2">
              <ColorSwatch label="bg-blue-500/10" className="bg-blue-500/10" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Semantic - Yellow</h3>
            <div className="space-y-2">
              <ColorSwatch label="bg-yellow-500/10" className="bg-yellow-500/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
