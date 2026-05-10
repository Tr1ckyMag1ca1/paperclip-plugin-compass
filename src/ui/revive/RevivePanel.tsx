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
import { HelpTip } from "../primitives/HelpTip.js";
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
      <header className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-base font-semibold">{companyName}</h1>
          <HelpTip
            title="What does Revive mode do?"
            body="Revive runs a stall classifier over this company's recent activity, identifies the most likely root cause, and queues unblocking actions for you to approve."
            details="Inputs: heartbeat history, blocker counts, agent error states, governance approval queue. The classifier groups detected stalls by cause (single-agent failure / governance loop / dead agent / drift) and emits an ActionQueue. Each action is dismissible; only those you approve are applied."
            size="sm"
          />
        </div>
        <p className="text-sm text-foreground/70 mb-3">Fix what's blocking this company</p>

        {inventory && <StallSummaryBadge inventory={inventory} />}

        <button
          onClick={handleDiagnose}
          disabled={isLoading || panelState === "diagnosing"}
          title="Run the stall classifier and queue unblocking actions for review"
          className="mt-3 w-full px-4 py-3 bg-accent text-white rounded-none hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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
      <main className="flex-1 overflow-y-auto p-4">
        {panelState === "diagnosing" ? (
          <div className="text-center py-3xl">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-3 text-accent" />
            <p className="text-sm text-foreground/70">Analyzing blockers…</p>
          </div>
        ) : panelState === "error" ? (
          <div className="text-center py-3xl">
            <p className="text-base font-semibold mb-3 text-destructive">Diagnosis failed</p>
            <p className="text-sm text-foreground/70">{errorMessage || "Something went wrong"}</p>
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
        <footer className="sticky bottom-0 border-t border-border bg-card p-4 flex justify-between items-center gap-3">
          <span className="text-xs font-medium text-foreground/70">
            {queue.addressed_count} of {queue.total_items} addressed
          </span>
          <button
            disabled={queue.addressed_count === 0}
            className="px-4 py-3 bg-accent text-white rounded-none hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
    <h2 className="text-base font-semibold mb-3">This company isn't stalled</h2>
    <p className="text-sm mb-4 text-foreground/70">
      No blocking issues detected. Try Assess for a strategic audit instead.
    </p>
  </div>
);
