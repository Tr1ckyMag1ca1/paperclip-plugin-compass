/**
 * SchedulesSection Component
 *
 * Per D-12, D-13: displays active routines list + collapsible creation form.
 *
 * Layout:
 * - Header: "Scheduled check-ins" + count
 * - Routines list: ScheduleRoutineRow per routine
 * - Create button / form toggle
 * - Empty state when no routines
 */

import React, { useState } from "react";
import { useMemory } from "./MemoryState.js";
import { ScheduleRoutineRow } from "./ScheduleRoutineRow.js";
import { ScheduleCreationForm } from "./ScheduleCreationForm.js";

interface SchedulesSectionProps {
  companyId: string;
}

/**
 * SchedulesSection — manages routine list and creation form.
 * Per D-12: lists active routines with cron-readable, last run, and actions.
 */
export const SchedulesSection: React.FC<SchedulesSectionProps> = ({ companyId }) => {
  const { history, deleteRoutine, runRoutineNow, createRoutine } = useMemory(companyId);
  const [showForm, setShowForm] = useState(false);

  const routines = history?.routines || [];

  const handleDelete = async (routineId: string) => {
    const routine = routines.find((r) => r.id === routineId);
    if (routine && window.confirm(`Disable routine "${routine.name}"?`)) {
      await deleteRoutine(routineId);
    }
  };

  const handleRunNow = async (routineId: string) => {
    await runRoutineNow(routineId);
  };

  const handleCreateSubmit = async (payload: {
    name: string;
    mode: "Assess" | "Revive";
    cron: string;
  }) => {
    await createRoutine(payload.name, payload.mode, payload.cron);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold font-bold mb-1">Scheduled check-ins</h3>
        <p className="text-xs font-medium text-foreground/70">
          These routines automatically trigger Compass modes on a schedule.
        </p>
      </div>

      {/* Routines List or Empty State */}
      {routines.length === 0 && !showForm ? (
        <p className="text-xs font-medium text-foreground/70 py-4">
          No scheduled check-ins yet. Create one to auto-trigger Assess or Revive on a
          schedule.
        </p>
      ) : (
        <div className="space-y-2">
          {routines.map((routine) => (
            <ScheduleRoutineRow
              key={routine.id}
              routine={routine}
              onRunNow={() => handleRunNow(routine.id)}
              onDisable={() => handleDelete(routine.id)}
            />
          ))}
        </div>
      )}

      {/* Creation Form (Collapsible) or Create Button */}
      {showForm ? (
        <ScheduleCreationForm
          companyId={companyId}
          onSubmit={handleCreateSubmit}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs font-medium text-accent hover:underline"
        >
          Create schedule
        </button>
      )}
    </div>
  );
};
