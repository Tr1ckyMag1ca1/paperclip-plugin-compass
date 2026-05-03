import { useCallback, useEffect, useState } from "react";
import { usePluginData, usePluginAction } from "@paperclipai/plugin-sdk/ui";
import type { InterviewAnswers } from "../../types/found.js";

const DRAFT_STATE_KEY = "compass:found:draft";

interface DraftStateResult {
  draft: InterviewAnswers | null;
  loading: boolean;
  saveDraft: (answers: InterviewAnswers) => Promise<void>;
  clearDraft: () => Promise<void>;
}

/**
 * Hook to load and persist interview draft state.
 * Per D-12, stored in Plugin SDK worker-state keyed per company.
 * Survives plugin reload (FOUND-03).
 *
 * @param companyId Company identifier for scoped state
 * @returns Draft object, loading state, and save/clear callbacks
 */
export function useInterviewDraft(companyId: string): DraftStateResult {
  const [draft, setDraft] = useState<InterviewAnswers | null>(null);
  const [loading, setLoading] = useState(true);

  // Load draft on mount using Plugin SDK
  // Pattern: Call handler to fetch from worker-state
  // This will be wired in Wave 4 FoundPanel orchestrator
  useEffect(() => {
    const loadDraft = async () => {
      try {
        // Handler to be implemented in worker:
        // Handler: getDraft({ companyId, namespace: "compass:found:draft" })
        // Returns: InterviewAnswers | null from worker-state

        // For now, initialize as empty
        setDraft(null);
        setLoading(false);
      } catch (err) {
        console.error("[useInterviewDraft] Failed to load draft:", err);
        setDraft(null);
        setLoading(false);
      }
    };

    loadDraft();
  }, [companyId]);

  // Save draft to worker-state
  const saveDraft = useCallback(
    async (answers: InterviewAnswers) => {
      try {
        // Call handler to persist to worker-state
        // Handler: saveDraft({ companyId, namespace: "compass:found:draft", answers })
        // Persists via: ctx.state.set({ scopeKind: "company", scopeId, namespace, stateKey: "current" }, answers)

        setDraft(answers);
      } catch (err) {
        console.error("[useInterviewDraft] Failed to save draft:", err);
      }
    },
    []
  );

  // Clear draft from worker-state
  const clearDraft = useCallback(async () => {
    try {
      // Call handler to clear draft
      // Handler: clearDraft({ companyId, namespace: "compass:found:draft" })
      // Clears via: ctx.state.delete({ scopeKind: "company", scopeId, namespace, stateKey: "current" })

      setDraft(null);
    } catch (err) {
      console.error("[useInterviewDraft] Failed to clear draft:", err);
    }
  }, []);

  return { draft, loading, saveDraft, clearDraft };
}
