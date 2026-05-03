/**
 * IntentEntry Component — Shift description textarea
 *
 * Per 05-UI-SPEC.md §Phase 1: Founder enters free-text shift description.
 * Validates minimum 20 characters (D-15), auto-persists to worker-state on blur.
 * Reuses Phase 2 textarea pattern from InterviewSection.tsx.
 */

import React, { useState, useCallback } from "react";
import { isValidShiftIntent } from "../../reposition/shift-classify.js";

interface IntentEntryProps {
  /** Callback when founder clicks Continue */
  onContinue: (intent: string) => Promise<void>;
  /** Optional initial value (for resume) */
  initialValue?: string;
}

/**
 * Shift description textarea with 20-char minimum validation.
 * Auto-persists to worker-state on blur.
 */
export function IntentEntry({
  onContinue,
  initialValue = "",
}: IntentEntryProps): React.ReactElement {
  const [intent, setIntent] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = isValidShiftIntent(intent);

  const handleContinue = useCallback(async () => {
    if (!isValid) return;

    try {
      setError(null);
      setIsLoading(true);
      await onContinue(intent);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to continue";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [intent, isValid, onContinue]);

  return (
    <div className="space-y-lg">
      {/* Header */}
      <div>
        <h2 className="text-heading font-bold text-foreground">Describe the shift</h2>
      </div>

      {/* Textarea */}
      <textarea
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        placeholder="Describe the shift in plain English. Examples: 'rebrand toward compliance', 'narrow focus to enterprise customers', 'tighten our voice'."
        className="w-full p-lg min-h-24 bg-card border border-border rounded text-body font-normal text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
      />

      {/* Helper text */}
      <p className="text-body font-normal text-foreground/70">
        Be specific about the direction change, not just internal improvements.
      </p>

      {/* Error message */}
      {error && (
        <p className="text-body font-normal text-destructive">
          {error}
        </p>
      )}

      {/* Character count and validation */}
      <div className="flex items-baseline justify-between">
        <p className={`text-label font-normal ${intent.length >= 20 ? "text-foreground/70" : "text-destructive"}`}>
          {intent.length} characters
          {intent.length < 20 && ` (minimum 20 required)`}
        </p>
      </div>

      {/* Continue button */}
      <button
        onClick={handleContinue}
        disabled={!isValid || isLoading}
        className="w-full px-lg py-md bg-accent text-white font-bold rounded hover:bg-accent/90 disabled:bg-foreground/20 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Loading..." : "Continue"}
      </button>
    </div>
  );
}
