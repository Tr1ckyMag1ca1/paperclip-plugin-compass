/**
 * RevivePanel Component — Main orchestrator for Revive mode
 *
 * Per 04-UI-SPEC.md, D-14, D-15, 04-CONTEXT.md:
 * State machine: empty → diagnosing → queue → applying → complete/error
 *
 * Header shows company name + stall summary badge + "Diagnose" CTA.
 * Body cycles through states. Sticky footer with progress and "Review and apply" button.
 */

import React, { useState, useCallback, useEffect } from "react";
import { usePluginAction, usePluginData } from "@paperclipai/plugin-sdk/ui";
import { Loader } from "lucide-react";
import { ActionQueuePanel } from "./ActionQueuePanel.js";
import { StallSummaryBadge } from "./StallSummaryBadge.js";
import { useReviveRunState } from "./ReviveRunState.js";
import type { ActionQueue, ActionItem } from "../../types/revive.js";
import type { InventorySnapshot } from "../../types.js";

type PanelState = "empty" | "diagnosing" | "queue" | "error";

interface RevivePanelProps {
  companyId: string;
  companyName: string;
}

/**
 * Main Revive panel orchestrator with state machine and layout.
 * Per D-14, D-15: header + stall summary + Diagnose CTA + ActionQueuePanel + sticky footer.
 */
export function RevivePanel({ companyId, companyName }: RevivePanelProps): React.ReactElement {
  const classifyStallAction = usePluginAction("classifyStall");
  const { data: inventory } = usePluginData<InventorySnapshot>("getInventory", { companyId });

  const { queue, saveQueue } = useReviveRunState(companyId);
  const [panelState, setPanelState] = useState<PanelState>("empty");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load initial state from cached queue
  useEffect(() => {
    if (queue && queue.items_by_cause) {
      setPanelState("queue");
    } else {
      setPanelState("empty");
    }
  }, [queue]);

  /**
   * Handle "Find what's blocking this company" button click.
   * Calls worker action to run classifier.
   */
  const handleDiagnose = useCallback(async () => {
    if (!inventory) return;

    try {
      setIsLoading(true);
      setPanelState("diagnosing");
      setErrorMessage(null);

      // Call worker action to run classifier
      const result = (await classifyStallAction({
        companyId,
      })) as {
        success?: boolean;
        queue?: ActionQueue;
        error?: string;
      };

      if (result && result.success && result.queue) {
        await saveQueue(result.queue);
        setPanelState("queue");
      } else {
        setErrorMessage(result?.error || "Diagnosis failed");
        setPanelState("error");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Diagnosis failed");
      setPanelState("error");
    } finally {
      setIsLoading(false);
    }
  }, [companyId, inventory, classifyStallAction, saveQueue]);

  const handleDismissAction = async (actionId: string) => {
    if (!queue) return;

    // Update queue to mark action as dismissed
    const updatedItems_by_cause = Object.fromEntries(
      Object.entries(queue.items_by_cause).map(([cause, items]) => [
        cause,
        items.map((item) =>
          item.id === actionId ? { ...item, status: "dismissed" as const } : item
        ),
      ])
    );

    const updatedQueue: ActionQueue = {
      ...queue,
      items_by_cause: updatedItems_by_cause as Record<any, ActionItem[]>,
      addressed_count: queue.addressed_count + 1,
    };

    try {
      await saveQueue(updatedQueue);
    } catch (error) {
      console.error("Failed to dismiss action:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Fixed Header */}
      <header className="p-lg border-b border-border">
        <h1 className="text-display font-bold mb-sm">{companyName}</h1>
        <p className="text-body text-foreground/70 mb-md">Fix what's blocking this company</p>

        {inventory && <StallSummaryBadge inventory={inventory} />}

        <button
          onClick={handleDiagnose}
          disabled={isLoading || panelState === "diagnosing"}
          className="mt-md w-full px-lg py-md bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-md"
        >
          {isLoading || panelState === "diagnosing" ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Diagnosing…
            </>
          ) : (
            "Find what's blocking this company"
          )}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-lg">
        {panelState === "diagnosing" ? (
          <div className="text-center py-3xl">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-md text-accent" />
            <p className="text-body text-foreground/70">Analyzing blockers…</p>
          </div>
        ) : panelState === "error" ? (
          <div className="text-center py-3xl">
            <p className="text-heading font-bold mb-md text-destructive">Diagnosis failed</p>
            <p className="text-body text-foreground/70">{errorMessage || "Something went wrong"}</p>
          </div>
        ) : !queue || queue.total_items === 0 ? (
          <EmptyReviveState />
        ) : (
          <ActionQueuePanel
            queue={queue}
            onActionDismiss={handleDismissAction}
          />
        )}
      </main>

      {/* Sticky Footer */}
      {queue && queue.total_items > 0 && panelState === "queue" && (
        <footer className="sticky bottom-0 border-t border-border bg-card p-lg flex justify-between items-center gap-md">
          <span className="text-label text-foreground/70">
            {queue.addressed_count} of {queue.total_items} addressed
          </span>
          <button
            disabled={queue.addressed_count === 0}
            className="px-lg py-md bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Review and apply
          </button>
        </footer>
      )}
    </div>
  );
}

/**
 * Empty state shown when company is not stalled.
 */
const EmptyReviveState: React.FC = () => (
  <div className="text-center py-3xl">
    <h2 className="text-heading font-bold mb-md">This company isn't stalled</h2>
    <p className="text-body mb-lg text-foreground/70">
      No blocking issues detected. Try Assess for a strategic audit instead.
    </p>
  </div>
);
