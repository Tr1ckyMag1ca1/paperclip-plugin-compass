/**
 * AssessRunState Hook — Worker-State Persistence for Mid-Run Drift Reports
 *
 * Per D-17: Persists drift detection results and per-item acceptance state
 * in worker-state keyed `compass:assess:run:${company_id}`, allowing founder
 * to leave and return without re-running detection.
 *
 * State shape:
 * {
 *   runId: string (stable UUID)
 *   driftReport: DriftReport (from drift detector)
 *   acceptedItems: { [sectionKey]: boolean } (per-item state)
 *   approvalRouting: 'founder' | 'founder+ceo'
 *   generatedAt: ISO 8601
 * }
 */

import { useCallback, useEffect, useState } from "react";
import { usePluginAction } from "@paperclipai/plugin-sdk/ui";
import type { DriftReport } from "../../types/assess.js";

/**
 * Persisted assess run state in worker-state.
 * Maps to `compass:assess:run:${company_id}` namespace.
 */
export interface PersistedAssessRun {
  runId: string;
  driftReport: DriftReport;
  acceptedItems: { [itemKey: string]: boolean };
  approvalRouting: "founder" | "founder+ceo";
  generatedAt: string;
}

/**
 * Hook for managing Assess mode run state (drift report + acceptance toggles).
 *
 * Per D-17, saves to worker-state under `compass:assess:run:${company_id}`
 * so drift results persist across reload.
 *
 * Provides:
 * - Load persisted run if exists
 * - Save new drift report
 * - Update per-item acceptance state
 * - Clear run state (when discarding)
 * - Get current routing preference
 */
export function useAssessRunState(companyId: string) {
  const loadRunStateAction = usePluginAction("loadAssessRunState");
  const updateStateAction = usePluginAction("updateAssessRunState");
  const [run, setRun] = useState<PersistedAssessRun | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial state from worker-state
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const savedRun = await loadRunStateAction({ companyId });

        if (savedRun && typeof savedRun === "object") {
          setRun(savedRun as PersistedAssessRun);
        }
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load assess state");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [companyId, loadRunStateAction]);

  /**
   * Save a new drift report to worker-state, initializing acceptance state.
   */
  const saveDriftReport = useCallback(
    async (driftReport: DriftReport, routing: "founder" | "founder+ceo" = "founder") => {
      try {
        const newRun: PersistedAssessRun = {
          runId: driftReport.runId,
          driftReport,
          acceptedItems: {},
          approvalRouting: routing,
          generatedAt: new Date().toISOString(),
        };

        await updateStateAction({
          [`compass:assess:run:${companyId}`]: newRun,
        });

        setRun(newRun);
        setError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to save drift report";
        setError(msg);
        throw e;
      }
    },
    [companyId, updateStateAction]
  );

  /**
   * Update acceptance state for a single drift item.
   */
  const setItemAccepted = useCallback(
    async (itemKey: string, accepted: boolean) => {
      if (!run) return;

      const updated: PersistedAssessRun = {
        ...run,
        acceptedItems: {
          ...run.acceptedItems,
          [itemKey]: accepted,
        },
      };

      try {
        await updateStateAction({
          [`compass:assess:run:${companyId}`]: updated,
        });
        setRun(updated);
        setError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to update item state";
        setError(msg);
        throw e;
      }
    },
    [run, companyId, updateStateAction]
  );

  /**
   * Update approval routing preference.
   */
  const updateApprovalRouting = useCallback(
    async (routing: "founder" | "founder+ceo") => {
      if (!run) return;

      const updated: PersistedAssessRun = {
        ...run,
        approvalRouting: routing,
      };

      try {
        await updateStateAction({
          [`compass:assess:run:${companyId}`]: updated,
        });
        setRun(updated);
        setError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to update routing";
        setError(msg);
        throw e;
      }
    },
    [run, companyId, updateStateAction]
  );

  /**
   * Clear the entire run (when discarding audit).
   */
  const clearRun = useCallback(
    async () => {
      try {
        await updateStateAction({
          [`compass:assess:run:${companyId}`]: undefined,
        });
        setRun(null);
        setError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to clear run";
        setError(msg);
        throw e;
      }
    },
    [companyId, updateStateAction]
  );

  /**
   * Get the list of accepted amendment item keys.
   */
  const getAcceptedItems = useCallback(() => {
    if (!run) return [];
    return Object.entries(run.acceptedItems)
      .filter(([, accepted]) => accepted)
      .map(([key]) => key);
  }, [run]);

  /**
   * Check if an item is currently accepted.
   */
  const isItemAccepted = useCallback(
    (itemKey: string) => {
      return run?.acceptedItems?.[itemKey] ?? false;
    },
    [run]
  );

  return {
    run,
    isLoading,
    error,
    saveDriftReport,
    setItemAccepted,
    setApprovalRouting: updateApprovalRouting,
    clearRun,
    getAcceptedItems,
    isItemAccepted,
  };
}
