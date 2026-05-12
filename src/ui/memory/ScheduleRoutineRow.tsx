/**
 * ScheduleRoutineRow Component
 *
 * Per D-12, UI-SPEC: single routine row with name, mode, cron-readable,
 * last-run timestamp, and action buttons (Run now, Disable).
 *
 * Layout:
 * - Left: routine name + mode badge
 * - Center: cron expression (human-readable)
 * - Right: last run timestamp + action buttons
 */

import React, { useState } from "react";
import type { ScheduledRoutine } from "../../types/memory.js";
import { ModeBadge } from "./ModeBadge.js";
import { cronToReadable } from "../../memory/cron-readable.js";
import { formatDistanceToNow } from "./format-relative-time.js";

interface ScheduleRoutineRowProps {
  routine: ScheduledRoutine;
  onRunNow: () => Promise<void>;
  onDisable: () => Promise<void>;
}

/**
 * Renders single routine row with cron display, last run timestamp, and actions.
 * Per D-12, D-15: human-readable cron via cronToEnglish utility.
 */
export const ScheduleRoutineRow: React.FC<ScheduleRoutineRowProps> = ({
  routine,
  onRunNow,
  onDisable,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  const handleRunNow = async () => {
    setIsRunning(true);
    try {
      await onRunNow();
    } finally {
      setIsRunning(false);
    }
  };

  const handleDisable = async () => {
    setIsDisabling(true);
    try {
      await onDisable();
    } finally {
      setIsDisabling(false);
    }
  };

  return (
    <div className="p-3 bg-card rounded border border-border">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Left: Name + Mode */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="text-sm font-bold">{routine.name}</h4>
            <ModeBadge mode={routine.mode} />
          </div>
          <p className="text-xs font-medium text-foreground/70 mb-1">
            {cronToReadable(routine.cron)}
          </p>
          {routine.last_run_at ? (
            <p className="text-xs font-medium text-foreground/70">
              Last run: {formatDistanceToNow(new Date(routine.last_run_at), { addSuffix: true })}
            </p>
          ) : (
            <p className="text-xs font-medium text-foreground/70">Never run</p>
          )}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={handleRunNow}
            disabled={isRunning || isDisabling}
            className="px-3 py-2 text-xs font-medium text-accent hover:underline disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            aria-label={`Run check-in now for ${routine.name}`}
          >
            {isRunning ? "Running…" : "Run check-in now"}
          </button>
          <button
            onClick={handleDisable}
            disabled={isDisabling || isRunning}
            className="px-3 py-2 text-xs font-medium text-destructive hover:underline disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            aria-label={`Disable routine ${routine.name}`}
          >
            {isDisabling ? "Disabling…" : "Disable"}
          </button>
        </div>
      </div>
    </div>
  );
};
