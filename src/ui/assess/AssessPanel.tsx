/**
 * AssessPanel Component — Main orchestrator for Assess mode
 *
 * Per 03-UI-SPEC.md, 03-CONTEXT.md (D-16):
 * State machine: empty → running → report → preview → confirming → applying → waiting-approval/complete/error
 *
 * Header shows company name + routing mode + "Run Assess" button.
 * Body cycles through states. Sticky footer with "Apply amendments" button.
 */

import React, { useState, useCallback, useEffect } from "react";
import { usePluginAction } from "@paperclipai/plugin-sdk/ui";
import { Loader } from "lucide-react";
import { DriftReportPanel } from "./DriftReportPanel.js";
import { ApprovalRoutingModal } from "./ApprovalRoutingModal.js";
import { ApprovingWaitingState } from "./ApprovingWaitingState.js";
import { ConfirmationModal } from "../found/ConfirmationModal.js";
import { ApplyProgress } from "../found/ApplyProgress.js";
import { ApplyErrorDisplay } from "../found/ApplyErrorDisplay.js";
import { useAssessRunState } from "./AssessRunState.js";
import { HelpTip } from "../primitives/HelpTip.js";
import { ContextRefreshBanner, PriorFindingsLink } from "../memory/index.js";
import type { DriftReport } from "../../types/assess.js";

type PanelState =
  | "empty"
  | "running"
  | "report"
  | "preview"
  | "confirming"
  | "applying"
  | "waiting-approval"
  | "complete"
  | "error";

interface AssessPanelProps {
  companyId: string;
  companyName: string;
  visionExists: boolean;
}

/**
 * Main Assess panel orchestrator with state machine and layout.
 */
export function AssessPanel({
  companyId,
  companyName,
  visionExists,
}: AssessPanelProps): React.ReactElement {
  const runDriftAuditAction = usePluginAction("runDriftAudit");
  const applyAmendmentsAction = usePluginAction("applyAmendments");
  const { run, isLoading: isLoadingState, saveDriftReport, setItemAccepted, setApprovalRouting: updateStateRouting, clearRun, getAcceptedItems } =
    useAssessRunState(companyId);

  // State machine
  const [panelState, setPanelState] = useState<PanelState>("empty");
  const [runProgress, setRunProgress] = useState(0);
  const [applyStep, setApplyStep] = useState<"preflight" | "doc" | "agents" | "issues" | "wakeups" | "complete" | "error">("preflight");
  const [applyProgress, setApplyProgress] = useState<{ [key: string]: boolean }>({});
  const [applyError, setApplyError] = useState<string | null>(null);
  const [errorsList, setErrorsList] = useState<string[]>([]);
  const [showRoutingModal, setShowRoutingModal] = useState(false);
  const [approvalRouting, setLocalApprovalRouting] = useState<"founder" | "founder+ceo">("founder");
  const [waitingApprovalTime, setWaitingApprovalTime] = useState<string>("");

  // Load initial state from run
  useEffect(() => {
    if (isLoadingState) return;

    if (run && run.driftReport) {
      // Resume existing run
      setPanelState("report");
      setLocalApprovalRouting(run.approvalRouting);
    } else {
      // No run in progress
      setPanelState("empty");
    }
  }, [run, isLoadingState]);

  /**
   * Handle "Run a drift audit" button click.
   */
  const handleRunAudit = useCallback(async () => {
    if (!visionExists) return;

    try {
      setPanelState("running");
      setRunProgress(0);

      // Call worker action to run drift detection
      const result = (await runDriftAuditAction({ companyId })) as {
        success?: boolean;
        driftReport?: DriftReport;
        error?: string;
      };

      if (result && result.success) {
        const report = result.driftReport as DriftReport;
        await saveDriftReport(report, approvalRouting);
        setPanelState("report");
      } else {
        setErrorsList([result?.error || "Drift audit failed"]);
        setPanelState("error");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Drift audit error";
      setErrorsList([msg]);
      setPanelState("error");
    }
  }, [companyId, visionExists, runDriftAuditAction, saveDriftReport, approvalRouting]);

  /**
   * Handle accept/reject for a drift item.
   */
  const handleAcceptItem = useCallback(
    async (itemIndex: number) => {
      if (!run) return;
      const item = run.driftReport.items[itemIndex];
      if (!item) return;

      const itemKey = `${item.visionSection}-${itemIndex}`;
      await setItemAccepted(itemKey, true);
    },
    [run, setItemAccepted]
  );

  const handleRejectItem = useCallback(
    async (itemIndex: number) => {
      if (!run) return;
      const item = run.driftReport.items[itemIndex];
      if (!item) return;

      const itemKey = `${item.visionSection}-${itemIndex}`;
      await setItemAccepted(itemKey, false);
    },
    [run, setItemAccepted]
  );

  /**
   * Handle "Apply amendments" button.
   */
  const handleApplyAmendments = useCallback(async () => {
    if (!run) return;

    try {
      setPanelState("applying");
      setApplyStep("preflight");
      setApplyProgress({});
      setApplyError(null);

      const acceptedItems = getAcceptedItems();
      if (acceptedItems.length === 0) {
        setErrorsList(["No amendments accepted"]);
        setPanelState("error");
        return;
      }

      // Call worker action to apply amendments
      const result = (await applyAmendmentsAction({
        companyId,
        acceptedItems,
        approvalRouting,
      })) as {
        success?: boolean;
        waitingForApproval?: boolean;
        error?: string;
        errors?: string[];
      };

      if (result.success) {
        if (result.waitingForApproval) {
          setPanelState("waiting-approval");
          setWaitingApprovalTime(new Date().toISOString());
        } else {
          setPanelState("complete");
        }
      } else {
        setApplyError(result.error || "Apply failed");
        setErrorsList(result.errors || [result.error || "Unknown error"]);
        setPanelState("error");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Apply error";
      setApplyError(msg);
      setErrorsList([msg]);
      setPanelState("error");
    }
  }, [run, getAcceptedItems, approvalRouting, companyId, applyAmendmentsAction]);

  /**
   * Handle "Discard audit" button.
   */
  const handleDiscardAudit = useCallback(async () => {
    if (
      !confirm("Are you sure? The drift audit results will be lost.")
    ) {
      return;
    }

    try {
      await clearRun();
      setPanelState("empty");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to discard";
      setErrorsList([msg]);
      setPanelState("error");
    }
  }, [clearRun]);

  /**
   * Handle routing mode change.
   */
  const handleSaveRouting = useCallback(
    async (routing: "founder" | "founder+ceo") => {
      setLocalApprovalRouting(routing);
      if (run) {
        await updateStateRouting(routing);
      }
      setShowRoutingModal(false);
    },
    [run, updateStateRouting]
  );

  /**
   * Get count of accepted amendments.
   */
  const acceptedCount = run ? getAcceptedItems().length : 0;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-lg space-y-md flex-shrink-0">
        <div className="flex items-start justify-between gap-md">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-display font-bold">{companyName}</h2>
              <HelpTip
                title="What does Assess mode do?"
                body="Assess compares your VISION.md against the last 30 days of agent activity, scores drift per section, and proposes amendments you can review and approve."
                details="Drift scoring is deterministic (no LLM): activity counts per VISION section vs expected baseline. Amendments are suggested edits to VISION.md text — you approve, reject, or edit each one. Approved amendments cascade to agent briefings."
                size="sm"
              />
            </div>
            <p className="text-body font-normal text-foreground/70 mt-sm">
              Audit your company's recent work against your vision document. This helps you stay aligned as you grow.
            </p>
          </div>
        </div>

        {/* Routing mode badge */}
        {run && (
          <button
            onClick={() => setShowRoutingModal(true)}
            className="text-label font-normal text-accent hover:text-accent/80 transition-colors"
            type="button"
          >
            Routing: <span className="font-bold">{run.approvalRouting}</span>
          </button>
        )}

        {/* Header buttons */}
        <div className="flex gap-md items-center">
          <button
            onClick={handleRunAudit}
            disabled={!visionExists || panelState === "running"}
            className="px-md py-sm rounded bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-normal text-body focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-xs"
            title={!visionExists
              ? "Create a vision document first by running Found mode."
              : "Compare VISION.md against the last 30 days of activity. No writes happen until you approve amendments."}
            type="button"
          >
            {panelState === "running" && <Loader className="h-4 w-4 animate-spin" />}
            Run a drift audit
          </button>

          {run && panelState !== "running" && (
            <button
              onClick={handleDiscardAudit}
              className="text-label font-normal text-foreground/70 hover:text-foreground transition-colors"
              type="button"
            >
              Discard
            </button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto p-lg">
        {panelState === "empty" && !isLoadingState && (
          <div className="text-center py-xl space-y-md">
            <p className="text-body font-normal text-foreground/70">No drift audit in progress.</p>
            <button
              onClick={handleRunAudit}
              disabled={!visionExists}
              title="Compare VISION.md against the last 30 days of activity. No writes happen until you approve amendments."
              className="px-md py-sm rounded bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-normal text-body inline-block"
              type="button"
            >
              Run a drift audit
            </button>
          </div>
        )}

        {panelState === "running" && (
          <div className="flex items-center justify-center py-xl">
            <div className="text-center space-y-md">
              <Loader className="h-8 w-8 animate-spin text-accent mx-auto" />
              <p className="text-body font-normal">Detecting drift… {runProgress}%</p>
            </div>
          </div>
        )}

        {panelState === "report" && run && (
          <>
            {/* Context refresh banner per D-08 */}
            {run.driftReport && (
              <ContextRefreshBanner
                priorOpenFindingsCount={
                  (run.driftReport as any)?.contextRefreshPreamble?.priorOpenFindingsCount || 0
                }
                deduplicatedCount={
                  (run.driftReport as any)?.contextRefreshPreamble?.deduplicatedCount || 0
                }
                onViewFindings={() => {
                  // TODO: Emit event to switch to History tab pre-filtered
                  console.log("View prior findings clicked");
                }}
              />
            )}
            <DriftReportPanel
              report={run.driftReport}
              acceptedState={run.acceptedItems}
              onAcceptItem={handleAcceptItem}
              onRejectItem={handleRejectItem}
            />
          </>
        )}

        {panelState === "applying" && (
          <ApplyProgress step={applyStep} progress={applyProgress} />
        )}

        {panelState === "complete" && (
          <div className="bg-accent/10 border border-accent rounded p-lg space-y-md">
            <p className="text-body font-bold text-accent">✓ Amendments applied!</p>
            <p className="text-label font-normal text-foreground/70">
              Your vision document has been updated and affected agents have been notified.
            </p>
          </div>
        )}

        {panelState === "waiting-approval" && (
          <ApprovingWaitingState
            submittedAt={waitingApprovalTime}
            onRefresh={async () => {
              // Refresh approval status
            }}
          />
        )}

        {panelState === "error" && (
          <ApplyErrorDisplay
            step={applyStep}
            errors={errorsList}
            onRetry={handleApplyAmendments}
            onClose={() => setPanelState("report")}
          />
        )}
      </div>

      {/* Sticky footer with Apply button */}
      {(panelState === "report" || panelState === "preview") && run && (
        <div className="border-t border-border p-lg flex-shrink-0 bg-background">
          <button
            onClick={handleApplyAmendments}
            disabled={acceptedCount === 0}
            title="Write the accepted amendments to VISION.md and route any approval-gated changes to the configured approver."
            className="w-full px-md py-sm rounded bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-medium text-body focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            Apply {acceptedCount} accepted amendment{acceptedCount !== 1 ? "s" : ""}
          </button>
        </div>
      )}

      {/* Routing modal */}
      {showRoutingModal && run && (
        <ApprovalRoutingModal
          currentRouting={run.approvalRouting}
          onSaveRouting={handleSaveRouting}
          onCancel={() => setShowRoutingModal(false)}
        />
      )}

      {/* Confirmation modal before apply */}
      {panelState === "confirming" && run && (
        <ConfirmationModal
          vision={{} as any} // Placeholder
          preset={null}
          onConfirm={handleApplyAmendments}
          onCancel={() => setPanelState("report")}
        />
      )}
    </div>
  );
}
