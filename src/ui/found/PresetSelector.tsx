import React, { useCallback } from "react";
import type { PresetDefinition } from "../../types/found.js";

interface PresetSelectorProps {
  presets: PresetDefinition[];
  selected: string | null;
  onSelect: (presetId: string) => void;
  disabled?: boolean;
}

/**
 * Radio button group for founding preset selection.
 * Per D-14, locked after selection to prevent re-render of branching questions.
 * Placement: start or mid-interview (decided by FoundPanel orchestrator).
 */
export function PresetSelector({
  presets,
  selected,
  onSelect,
  disabled = false,
}: PresetSelectorProps): React.ReactElement {
  const handleSelectPreset = useCallback(
    (presetId: string) => {
      if (!disabled) {
        onSelect(presetId);
      }
    },
    [disabled, onSelect]
  );

  return (
    <div className="space-y-md">
      <label className="text-label font-normal">
        Choose a founding preset <span className="text-accent">*</span>
      </label>
      <div className="space-y-sm">
        {presets.map(preset => (
          <label
            key={preset.id}
            className={`flex gap-md p-md border border-border rounded transition-colors ${
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-card"
            }`}
          >
            <input
              type="radio"
              name="preset"
              value={preset.id}
              checked={selected === preset.id}
              onChange={() => handleSelectPreset(preset.id)}
              disabled={disabled}
              className="cursor-pointer mt-0.5"
            />
            <div className="flex-1">
              <div className="text-body font-normal">{preset.name}</div>
              <div className="text-label font-normal text-foreground/70 mt-xs">
                {preset.description}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
