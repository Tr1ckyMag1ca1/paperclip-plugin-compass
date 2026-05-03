/**
 * RepositionRunState Hook — Worker-State Persistence for Reposition Runs
 *
 * Per D-14: Persists reposition run state (intent, scope, answers, amendments, cascade plan)
 * in worker-state keyed `compass:reposition:run:${company_id}`, allowing founder
 * to leave and return without re-running the entire flow.
 *
 * State shape:
 * {
 *   companyId: string
 *   runId: string (stable UUID)
 *   phase: "intent" | "scope-confirm" | ... | "complete" | "error"
 *   intent: string
 *   shiftScope: ShiftScope
 *   userScope: VisionSectionId[]
 *   interviewAnswers: InterviewAnswers
 *   amendments: Amendment[]
 *   cascadePlan?: CascadePlan
 *   approvalRouting: "founder" | "founder+ceo"
 *   createdAt: ISO 8601
 * }
 */

import { useCallback, useEffect, useState } from "react";
import { usePluginAction } from "@paperclipai/plugin-sdk/ui";
import type { RepositionRunState } from "../../types/reposition.js";

/**
 * Hook for managing Reposition mode run state persistence.
 *
 * Per D-14, saves to worker-state under `compass:reposition:run:${company_id}`
 * so run state persists across reload.
 *
 * Provides:
 * - Load persisted run if exists
 * - Save/update run state
 * - Clear run state (when discarding or apply completes)
 */
export function useRepositionRunState(companyId: string) {
  const loadRunStateAction = usePluginAction("loadRepositionRunState");
  const updateStateAction = usePluginAction("updateRepositionRunState");
  const [run, setRun] = useState<RepositionRunState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial state from worker-state
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const savedRun = await loadRunStateAction({ companyId });

        if (savedRun && typeof savedRun === "object") {
          setRun(savedRun as RepositionRunState);
        }
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load reposition state");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [companyId, loadRunStateAction]);

  /**
   * Save partial updates to run state, merging with existing state.
   * Auto-generates runId if not exists.
   */
  const saveRepositionRun = useCallback(
    async (updates: Partial<RepositionRunState>) => {
      try {
        const runId = run?.runId || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `run-${Date.now()}`);
        const now = new Date().toISOString();

        const updatedRun: RepositionRunState = {
          companyId,
          runId,
          phase: "intent",
          intent: "",
          shiftScope: { affectedSections: [], confidence: 0, rationale: "" },
          userScope: [],
          scopedInterview: [],
          interviewAnswers: {},
          amendments: [],
          approvalRouting: "founder",
          createdAt: run?.createdAt || now,
          ...run,
          ...updates,
        };

        await updateStateAction({
          [`compass:reposition:run:${companyId}`]: updatedRun,
        });

        setRun(updatedRun);
        setError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to save reposition state";
        setError(msg);
        throw e;
      }
    },
    [companyId, run, updateStateAction]
  );

  /**
   * Clear run state (when discarding or successful apply).
   */
  const clearRun = useCallback(async () => {
    try {
      await updateStateAction({
        [`compass:reposition:run:${companyId}`]: null,
      });

      setRun(null);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to clear reposition state";
      setError(msg);
      throw e;
    }
  }, [companyId, updateStateAction]);

  return {
    run,
    isLoading,
    error,
    saveRepositionRun,
    clearRun,
  };
}
