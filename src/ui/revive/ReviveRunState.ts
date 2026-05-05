/**
 * ReviveRunState Hook
 *
 * Per 04-UI-SPEC.md, D-15: hook for persisting Revive diagnosis in worker-state
 * across panel reloads.
 *
 * Stores action queue so founder can resume partial diagnosis.
 * Pattern mirrors Phase 3 useAssessRunState.
 */

import { useCallback, useEffect, useState } from "react";
import { usePluginAction } from "@paperclipai/plugin-sdk/ui";
import type { ActionQueue } from "../../types/revive.js";

/**
 * Hook to persist and retrieve Revive run state from worker-state.
 *
 * Provides methods to load/save action queue across panel reloads.
 * Per D-15: stored under key `compass:revive:run:current`.
 */
export function useReviveRunState(companyId: string) {
  const loadRunStateAction = usePluginAction("loadReviveRunState");
  const updateStateAction = usePluginAction("updateReviveRunState");
  const [queue, setQueue] = useState<ActionQueue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial state from worker-state
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const savedQueue = await loadRunStateAction({ companyId });

        if (savedQueue && typeof savedQueue === "object") {
          setQueue(savedQueue as ActionQueue);
        }
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load revive state");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [companyId]);

  /**
   * Save action queue to worker-state.
   */
  const saveQueue = useCallback(
    async (newQueue: ActionQueue) => {
      try {
        await updateStateAction({
          [`compass:revive:run:${companyId}`]: newQueue,
        });
        setQueue(newQueue);
        setError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to save revive state";
        setError(msg);
        throw e;
      }
    },
    [companyId, updateStateAction]
  );

  /**
   * Clear the run state (when discarding).
   */
  const clearQueue = useCallback(
    async () => {
      try {
        await updateStateAction({
          [`compass:revive:run:${companyId}`]: undefined,
        });
        setQueue(null);
        setError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to clear revive state";
        setError(msg);
        throw e;
      }
    },
    [companyId, updateStateAction]
  );

  return {
    queue,
    isLoading,
    error,
    saveQueue,
    clearQueue,
  };
}
