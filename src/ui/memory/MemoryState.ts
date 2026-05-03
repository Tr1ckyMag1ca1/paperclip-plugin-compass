/**
 * MemoryState Hook — Worker-State Persistence for Engagement History
 *
 * Per D-03: Persists engagement history (findings + routines) in worker-state
 * keyed `compass:memory:${company_id}` with 60s TTL, allowing founder to leave
 * and return without re-fetching.
 *
 * Provides methods for:
 * - Loading engagement history with cache
 * - Recording findings after Apply success
 * - Transitioning finding status with audit trail
 * - Creating/deleting/running scheduled routines
 */

import { useCallback, useEffect, useState } from "react";
import { usePluginAction } from "@paperclipai/plugin-sdk/ui";
import type { EngagementHistory, Finding, FindingStatus, ScheduledRoutine } from "../../types/memory.js";

/**
 * Hook state interface for useMemory.
 */
export interface MemoryHookState {
  history: EngagementHistory | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  recordFindings: (runId: string, mode: string, items: any[]) => Promise<void>;
  updateFindingStatus: (findingId: string, newStatus: FindingStatus) => Promise<void>;
  createRoutine: (name: string, mode: "Assess" | "Revive", cronPreset: string) => Promise<void>;
  deleteRoutine: (routineId: string) => Promise<void>;
  runRoutineNow: (routineId: string) => Promise<void>;
}

/**
 * useMemory — hook for managing engagement history and routines.
 *
 * Per D-03, loads from worker-state cache. Per D-06, D-07, coordinates
 * finding recording post-apply. Per D-12-15, manages scheduled routine CRUD.
 *
 * All operations route through usePluginAction hooks, delegating to worker handlers.
 */
export function useMemory(companyId: string): MemoryHookState {
  const [history, setHistory] = useState<EngagementHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Worker action hooks (per SDK pattern)
  const loadMemory = usePluginAction("memory.load");
  const postFindings = usePluginAction("memory.recordFindings");
  const updateStatus = usePluginAction("memory.transitionStatus");
  const createRtn = usePluginAction("routine.create");
  const deleteRtn = usePluginAction("routine.delete");
  const runRtn = usePluginAction("routine.run");

  /**
   * Refetch engagement history from worker (cache-backed per D-03).
   */
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loadMemory({ companyId });
      setHistory((result as any)?.history || null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load engagement history";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [companyId, loadMemory]);

  // Load on mount
  useEffect(() => {
    refetch();
  }, [companyId, refetch]);

  /**
   * Record findings from a completed Apply run.
   * Per D-06: called post-apply success in Found, Assess, Revive, Reposition modes.
   */
  const recordFindings = useCallback(
    async (runId: string, mode: string, items: any[]) => {
      try {
        await postFindings({ companyId, runId, mode, items });
        await refetch();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to record findings";
        setError(msg);
      }
    },
    [companyId, postFindings, refetch]
  );

  /**
   * Transition finding status (open -> addressed -> invalidated).
   * Per D-05: records audit trail via status_history.
   */
  const updateFindingStatus = useCallback(
    async (findingId: string, newStatus: FindingStatus) => {
      try {
        await updateStatus({ companyId, findingId, newStatus });
        await refetch();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to update finding status";
        setError(msg);
      }
    },
    [companyId, updateStatus, refetch]
  );

  /**
   * Create new scheduled routine.
   * Per D-13: validates cron before posting to routines table.
   */
  const createRoutine = useCallback(
    async (name: string, mode: "Assess" | "Revive", cronPreset: string) => {
      try {
        await createRtn({ companyId, name, mode, cronPreset });
        await refetch();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to create routine";
        setError(msg);
      }
    },
    [companyId, createRtn, refetch]
  );

  /**
   * Delete (disable) routine.
   * Per D-12: marks routine as inactive.
   */
  const deleteRoutine = useCallback(
    async (routineId: string) => {
      try {
        await deleteRtn({ companyId, routineId });
        await refetch();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to delete routine";
        setError(msg);
      }
    },
    [companyId, deleteRtn, refetch]
  );

  /**
   * Run routine immediately (fire on-demand).
   * Per D-14: dispatches to appropriate mode audit, records findings.
   */
  const runRoutineNow = useCallback(
    async (routineId: string) => {
      try {
        await runRtn({ companyId, routineId });
        await refetch();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to run routine";
        setError(msg);
      }
    },
    [companyId, runRtn, refetch]
  );

  return {
    history,
    loading,
    error,
    refetch,
    recordFindings,
    updateFindingStatus,
    createRoutine,
    deleteRoutine,
    runRoutineNow,
  };
}
