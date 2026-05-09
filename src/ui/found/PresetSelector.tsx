import React, { useCallback } from "react";
import { Card } from "../primitives/Card.js";
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
    <Card variant="default" padding="md">
      <div className="space-y-3">
        <label className="text-xs font-medium">
          Choose a founding preset <span className="text-emerald-600">*</span>
        </label>
        <div className="space-y-2">
          {presets.map(preset => (
            <label
              key={preset.id}
              className={`flex gap-3 p-3 border border-border rounded-none transition-colors ${
                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-muted"
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
                <div className="text-sm font-normal">{preset.name}</div>
                <div className="text-xs font-normal text-muted-foreground mt-1">
                  {preset.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </Card>
  );
}
