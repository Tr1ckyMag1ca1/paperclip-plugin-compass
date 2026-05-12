/**
 * ScheduleCreationForm Component
 *
 * Per D-13, UI-SPEC: form for creating new scheduled routine.
 * Fields:
 * - Name: text input (required, max 100 chars)
 * - Mode: radio choice (Assess | Revive)
 * - Frequency: preset radio (Quarterly | Monthly | Custom)
 * - Custom cron: text input with validation (if Custom selected)
 *
 * Preset cron mappings per D-15:
 * - Quarterly = `0 9 1 1,4,7,10 *` (9am, first day of Q1/Q2/Q3/Q4)
 * - Monthly = `0 9 1 * *` (9am first of every month)
 */

import React, { useState } from "react";
import { validateCronExpression as validateCron } from "../../memory/routine.js";

interface ScheduleCreationFormProps {
  companyId: string;
  onSubmit: (payload: {
    name: string;
    mode: "Assess" | "Revive";
    cron: string;
  }) => Promise<void>;
  onCancel: () => void;
}

/**
 * Form to create new scheduled routine.
 * Per D-13: validates cron, maps presets to cron expressions.
 */
export const ScheduleCreationForm: React.FC<ScheduleCreationFormProps> = ({
  companyId,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"Assess" | "Revive">("Assess");
  const [frequencyPreset, setFrequencyPreset] = useState<"quarterly" | "monthly" | "custom">(
    "quarterly"
  );
  const [customCron, setCustomCron] = useState("");
  const [cronError, setCronError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Get cron expression from preset or custom input.
   */
  const getCron = (): string => {
    if (frequencyPreset === "quarterly") {
      return "0 9 1 1,4,7,10 *";
    } else if (frequencyPreset === "monthly") {
      return "0 9 1 * *";
    } else {
      return customCron;
    }
  };

  /**
   * Handle form submission with validation.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name
    if (!name.trim()) {
      alert("Routine name is required");
      return;
    }

    if (name.length > 100) {
      alert("Routine name must be 100 characters or less");
      return;
    }

    // Validate cron
    const cron = getCron();
    if (!validateCron(cron)) {
      setCronError("Invalid cron format. Expected 5 fields: minute hour day month weekday");
      return;
    }

    setCronError(null);

    // Submit
    setIsSubmitting(true);
    try {
      await onSubmit({ name, mode, cron });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-card rounded border border-border space-y-4"
    >
      <h3 className="text-base font-semibold font-bold">Create schedule</h3>

      {/* Name Input */}
      <div>
        <label htmlFor="routine-name" className="text-xs font-medium font-bold mb-1 block">
          Routine name <span className="text-destructive">*</span>
        </label>
        <input
          id="routine-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My quarterly audit review"
          required
          maxLength={100}
          className="w-full px-2 py-1 rounded border border-border text-sm"
          aria-required="true"
          aria-label="Routine name"
        />
        <p className="text-xs font-medium text-foreground/70 mt-1">
          {name.length}/100 characters
        </p>
      </div>

      {/* Mode Choice */}
      <div>
        <fieldset>
          <legend className="text-xs font-medium font-bold mb-2 block">Which mode?</legend>
          <div className="space-y-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="Assess"
                checked={mode === "Assess"}
                onChange={() => setMode("Assess")}
                aria-label="Run Assess drift review"
              />
              <span className="text-sm">Assess drift review</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="Revive"
                checked={mode === "Revive"}
                onChange={() => setMode("Revive")}
                aria-label="Run Revive stall diagnosis"
              />
              <span className="text-sm">Revive stall diagnosis</span>
            </label>
          </div>
        </fieldset>
      </div>

      {/* Frequency Preset */}
      <div>
        <fieldset>
          <legend className="text-xs font-medium font-bold mb-2 block">When?</legend>
          <div className="space-y-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="frequency"
                value="quarterly"
                checked={frequencyPreset === "quarterly"}
                onChange={() => {
                  setFrequencyPreset("quarterly");
                  setCronError(null);
                }}
                aria-label="Quarterly drift review"
              />
              <span className="text-sm">Quarterly drift review</span>
              <span className="text-xs font-medium text-foreground/50">(9am, 1st of Q months)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="frequency"
                value="monthly"
                checked={frequencyPreset === "monthly"}
                onChange={() => {
                  setFrequencyPreset("monthly");
                  setCronError(null);
                }}
                aria-label="Monthly trust-gate review"
              />
              <span className="text-sm">Monthly trust-gate review</span>
              <span className="text-xs font-medium text-foreground/50">(9am, 1st of month)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="frequency"
                value="custom"
                checked={frequencyPreset === "custom"}
                onChange={() => setFrequencyPreset("custom")}
                aria-label="Custom cron expression"
              />
              <span className="text-sm">Custom cron expression</span>
            </label>
          </div>
        </fieldset>
      </div>

      {/* Custom Cron Input (if Custom selected) */}
      {frequencyPreset === "custom" && (
        <div>
          <label htmlFor="custom-cron" className="text-xs font-medium font-bold mb-1 block">
            Cron expression (5-field standard) <span className="text-destructive">*</span>
          </label>
          <input
            id="custom-cron"
            type="text"
            value={customCron}
            onChange={(e) => {
              setCustomCron(e.target.value);
              setCronError(null);
            }}
            placeholder="0 9 1 1,4,7,10 *"
            className={`w-full px-2 py-1 rounded border ${
              cronError ? "border-destructive" : "border-border"
            } text-sm`}
            aria-required="true"
            aria-invalid={!!cronError}
            aria-describedby={cronError ? "cron-error" : undefined}
          />
          {cronError && (
            <p id="cron-error" className="text-xs font-medium text-destructive mt-1">
              {cronError}
            </p>
          )}
          <p className="text-xs font-medium text-foreground/70 mt-1">
            Format: minute hour day month weekday. E.g., '0 9 1 * *' = first of every
            month at 9am
          </p>
        </div>
      )}

      {/* Submit / Cancel Buttons */}
      <div className="flex gap-2 justify-end pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-3 py-2 text-xs font-medium text-foreground hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={
            !name.trim() || (frequencyPreset === "custom" && !customCron) || isSubmitting
          }
          className="px-3 py-2 text-xs font-medium bg-accent text-background rounded hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating…" : "Create schedule"}
        </button>
      </div>
    </form>
  );
};
