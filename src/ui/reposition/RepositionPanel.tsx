/**
 * RepositionPanel Component — Main orchestrator for Reposition mode
 *
 * Per 05-UI-SPEC.md, D-13 (state machine), D-14 (worker-state persistence):
 * State machine: empty → intent → scope-confirm → interview → preview → cascade-review →
 * confirming → applying → complete/waiting-approval/error
 *
 * Persists run state via useRepositionRunState hook for durability across plugin reloads.
 * Reuses Phase 2/3 components: InterviewSection, SectionNavRail, QuestionRenderer,
 * ConfirmationModal, ApplyProgress, ApplyErrorDisplay, AmendmentDiff, CustomOverrideWarning.
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { usePluginAction } from "@paperclipai/plugin-sdk/ui";
import { ChevronLeft, AlertCircle } from "lucide-react";
import { IntentEntry } from "./IntentEntry.js";
import { ScopeConfirmation } from "./ScopeConfirmation.js";
import { RepositionInterviewFlow } from "./RepositionInterviewFlow.js";
import { AmendmentPreview } from "./AmendmentPreview.js";
import { CascadeReviewPanel } from "./CascadeReviewPanel.js";
import { useRepositionRunState } from "./RepositionRunState.js";
import { ConfirmationModal, ApplyProgress, ApplyErrorDisplay } from "../found/index.js";
import { ApprovingWaitingState } from "../assess/ApprovingWaitingState.js";
import type {
  RepositionRunState,
  ShiftScope,
  Amendment,
  VisionSectionId,
} from "../../types/reposition.js";
import type { InterviewAnswers } from "../../types/found.js";
import type { CascadePlan } from "../../assess/cascade.js";

type RepositionStep =
  | "empty"
  | "intent"
  | "scope-confirm"
  | "interview"
  | "preview"
  | "cascade-review"
  | "confirming"
  | "applying"
  | "complete"
  | "waiting-approval"
  | "error";

interface RepositionPanelProps {
  companyId: string;
  companyName: string;
  visionExists: boolean;
}

/**
 * RepositionPanel — Orchestrates Reposition mode end-to-end.
 * Manages state machine, run persistence, and delegate to specialized components.
 */
export function RepositionPanel({
  companyId,
  companyName,
  visionExists,
}: RepositionPanelProps): React.ReactElement {
  // State machine
  const [step, setStep] = useState<RepositionStep>("empty");
  const [intent, setIntent] = useState<string>("");
  const [shiftScope, setShiftScope] = useState<ShiftScope | null>(null);
  const [userScope, setUserScope] = useState<VisionSectionId[]>([]);
  const [interviewAnswers, setInterviewAnswers] = useState<InterviewAnswers>({});
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [cascadePlan, setCascadePlan] = useState<CascadePlan | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyStep, setApplyStep] = useState<string>("preflight");
  const [waitingApprovalTime, setWaitingApprovalTime] = useState<string>("");

  // Retrieve current VISION and approval routing from Plugin SDK context
  const getCurrentVisionAction = usePluginAction("getCurrentVision");
  const getApprovalRoutingAction = usePluginAction("getApprovalRouting");
  const classifyShiftAction = usePluginAction("classifyShift");
  const generateAmendmentsAction = usePluginAction("generateAmendments");
  const planCascadeAction = usePluginAction("planCascade");
  const applyRepositionAction = usePluginAction("applyReposition");

  // Persist run state via hook
  const {
    run: cachedRun,
    isLoading: isLoadingRun,
    saveRepositionRun,
    clearRun,
  } = useRepositionRunState(companyId);

  // Resume from cached state on mount
  useEffect(() => {
    if (isLoadingRun) return;

    if (cachedRun && cachedRun.intent) {
      // Resume existing run
      setIntent(cachedRun.intent);
      setShiftScope(cachedRun.shiftScope);
      setUserScope(cachedRun.userScope);
      setInterviewAnswers(cachedRun.interviewAnswers);
      setAmendments(cachedRun.amendments);
      if (cachedRun.cascadePlan) setCascadePlan(cachedRun.cascadePlan);

      // Resume from last saved phase
      setStep(cachedRun.phase as RepositionStep);
    } else {
      // No cached run
      setStep("empty");
    }
  }, [cachedRun, isLoadingRun]);

  // Handler: Intent submission
  const handleIntentSubmit = useCallback(
    async (submittedIntent: string) => {
      try {
        setIntent(submittedIntent);

        // Call worker to classify shift
        const result = (await classifyShiftAction({
          companyId,
          description: submittedIntent,
        })) as { success?: boolean; scope?: ShiftScope; error?: string };

        if (result.success && result.scope) {
          const scope = result.scope as ShiftScope;
          setShiftScope(scope);
          setUserScope(scope.affectedSections);

          // Persist and advance
          await saveRepositionRun({
            companyId,
            phase: "scope-confirm",
            intent: submittedIntent,
            shiftScope: scope,
            userScope: scope.affectedSections,
          });

          setStep("scope-confirm");
        } else {
          setApplyError(result.error || "Failed to classify shift");
          setStep("error");
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Intent submission error";
        setApplyError(msg);
        setStep("error");
      }
    },
    [companyId, classifyShiftAction, saveRepositionRun]
  );

  // Handler: Scope confirmation
  const handleScopeConfirm = useCallback(
    async (selectedSections: VisionSectionId[]) => {
      try {
        setUserScope(selectedSections);

        // Persist and advance
        await saveRepositionRun({
          companyId,
          phase: "interview",
          intent,
          shiftScope: shiftScope!,
          userScope: selectedSections,
        });

        setStep("interview");
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Scope confirmation error";
        setApplyError(msg);
        setStep("error");
      }
    },
    [companyId, intent, shiftScope, saveRepositionRun]
  );

  // Handler: Interview completion
  const handleInterviewComplete = useCallback(
    async (answers: InterviewAnswers) => {
      try {
        setInterviewAnswers(answers);

        // Call worker to generate amendments
        const result = (await generateAmendmentsAction({
          companyId,
          answers,
          affectedSections: userScope,
        })) as { success?: boolean; amendments?: Amendment[]; error?: string };

        if (result.success && result.amendments) {
          const amps = result.amendments as Amendment[];
          setAmendments(amps);

          // Persist and advance
          await saveRepositionRun({
            companyId,
            phase: "preview",
            intent,
            shiftScope: shiftScope!,
            userScope,
            interviewAnswers: answers,
            amendments: amps,
          });

          setStep("preview");
        } else {
          setApplyError(result.error || "Failed to generate amendments");
          setStep("error");
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Interview completion error";
        setApplyError(msg);
        setStep("error");
      }
    },
    [companyId, userScope, intent, shiftScope, generateAmendmentsAction, saveRepositionRun]
  );

  // Handler: Preview continue
  const handlePreviewContinue = useCallback(async () => {
    try {
      // Call worker to plan cascade
      const result = (await planCascadeAction({
        companyId,
        amendments,
      })) as { success?: boolean; plan?: CascadePlan; error?: string };

      if (result.success && result.plan) {
        const plan = result.plan as CascadePlan;
        setCascadePlan(plan);

        // Persist and advance
        await saveRepositionRun({
          companyId,
          phase: "cascade-review",
          intent,
          shiftScope: shiftScope!,
          userScope,
          interviewAnswers,
          amendments,
          cascadePlan: plan,
        });

        setStep("cascade-review");
      } else {
        setApplyError(result.error || "Failed to plan cascade");
        setStep("error");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Preview continue error";
      setApplyError(msg);
      setStep("error");
    }
  }, [companyId, amendments, intent, shiftScope, userScope, interviewAnswers, planCascadeAction, saveRepositionRun]);

  // Handler: Cascade review confirmation (decisions submitted)
  const handleCascadeConfirm = useCallback(async () => {
    // Move to final confirmation modal
    setStep("confirming");
  }, []);

  // Handler: Apply (from confirmation modal)
  const handleApply = useCallback(async () => {
    try {
      setStep("applying");
      setApplyStep("preflight");

      // Get approval routing
      const routingResult = (await getApprovalRoutingAction({
        companyId,
      })) as { success?: boolean; routing?: string; error?: string };

      const routing = routingResult.success ? (routingResult.routing as "founder" | "founder+ceo") : "founder";

      // Call worker to apply reposition
      const result = (await applyRepositionAction({
        companyId,
        intent,
        amendments,
        cascadePlan,
        approvalRouting: routing,
      })) as {
        success?: boolean;
        waitingForApproval?: boolean;
        error?: string;
      };

      if (result.success) {
        if (result.waitingForApproval) {
          setStep("waiting-approval");
          setWaitingApprovalTime(new Date().toISOString());
          // Clear cached run after successful apply
          await clearRun();
        } else {
          setStep("complete");
          // Clear cached run
          await clearRun();
        }
      } else {
        setApplyError(result.error || "Apply failed");
        setStep("error");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Apply error";
      setApplyError(msg);
      setStep("error");
    }
  }, [companyId, intent, amendments, cascadePlan, getApprovalRoutingAction, applyRepositionAction, clearRun]);

  // Handler: Error retry
  const handleErrorRetry = useCallback(async () => {
    setApplyError(null);
    setStep("intent");
  }, []);

  // Handler: Close error
  const handleErrorClose = useCallback(async () => {
    setApplyError(null);
    await clearRun();
    setStep("empty");
  }, [clearRun]);

  // Handler: Back navigation
  const handleBackFromScope = useCallback(() => {
    setStep("intent");
  }, []);

  const handleBackFromInterview = useCallback(() => {
    setStep("scope-confirm");
  }, []);

  const handleBackFromPreview = useCallback(() => {
    setStep("interview");
  }, []);

  const handleBackFromCascade = useCallback(() => {
    setStep("preview");
  }, []);

  const handleCancelConfirm = useCallback(() => {
    setStep("cascade-review");
  }, []);

  // Handler: Discard
  const handleDiscard = useCallback(async () => {
    if (
      !confirm("Are you sure? Your reposition flow will be lost.")
    ) {
      return;
    }

    try {
      await clearRun();
      setStep("empty");
      setIntent("");
      setShiftScope(null);
      setUserScope([]);
      setInterviewAnswers({});
      setAmendments([]);
      setCascadePlan(null);
      setApplyError(null);
    } catch (error) {
      console.error("Failed to discard:", error);
    }
  }, [clearRun]);

  // Get current VISION for interview pre-filling
  const [currentVision, setCurrentVision] = useState<any>(null);
  useEffect(() => {
    (async () => {
      try {
        const result = (await getCurrentVisionAction({
          companyId,
        })) as { success?: boolean; vision?: any };
        if (result.success && result.vision) {
          setCurrentVision(result.vision);
        }
      } catch (error) {
        console.error("Failed to load vision:", error);
      }
    })();
  }, [companyId, getCurrentVisionAction]);

  // Render based on step
  if (isLoadingRun) {
    return (
      <div className="flex items-center justify-center p-lg min-h-96">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-md"></div>
          <p className="text-body text-foreground/70">Loading reposition state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 bg-background border-b border-border p-lg z-10">
        <div className="flex items-start justify-between gap-lg">
          <div>
            <h1 className="text-display font-bold text-foreground">{companyName}</h1>
            <p className="text-body font-normal text-foreground/70 mt-xs">
              Describe the strategic shift and we'll guide you through updating your company.
            </p>
          </div>

          {step !== "empty" && (
            <button
              onClick={handleDiscard}
              className="text-body font-normal text-destructive hover:text-destructive/80 transition-colors"
            >
              Discard shift
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-lg">
        {!visionExists && (
          <div className="mb-lg p-lg bg-destructive/10 border border-destructive rounded flex items-start gap-md">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-heading font-bold text-destructive">No VISION.md found</h3>
              <p className="text-body font-normal text-foreground mt-sm">
                Run Found mode first to create a VISION.md document.
              </p>
            </div>
          </div>
        )}

        {step === "empty" && (
          <div className="text-center py-3xl">
            <p className="text-body font-normal text-foreground/70 mb-lg">
              Run a drift audit or make a strategic shift
            </p>
            <button
              onClick={() => setStep("intent")}
              disabled={!visionExists}
              className="px-lg py-md bg-accent text-white font-bold rounded hover:bg-accent/90 disabled:bg-foreground/20 disabled:cursor-not-allowed transition-colors"
            >
              Reposition this company
            </button>
          </div>
        )}

        {step === "intent" && (
          <IntentEntry onContinue={handleIntentSubmit} />
        )}

        {step === "scope-confirm" && shiftScope && (
          <ScopeConfirmation
            classifiedScope={shiftScope}
            onConfirm={handleScopeConfirm}
            onBack={handleBackFromScope}
          />
        )}

        {step === "interview" && (
          <RepositionInterviewFlow
            affectedSectionIds={userScope}
            currentVision={currentVision}
            onComplete={handleInterviewComplete}
            onBack={handleBackFromInterview}
          />
        )}

        {step === "preview" && amendments.length > 0 && (
          <AmendmentPreview
            amendments={amendments}
            onContinue={handlePreviewContinue}
            onBack={handleBackFromPreview}
          />
        )}

        {step === "cascade-review" && cascadePlan && (
          <CascadeReviewPanel
            cascadePlan={cascadePlan}
            onConfirm={handleCascadeConfirm}
            onBack={handleBackFromCascade}
          />
        )}

        {step === "confirming" && (
          <ConfirmationModal
            vision={{
              body: `Apply will:\n- Update ${amendments.length} VISION.md section(s)\n- Create cascading issue(s) for affected agents\n- Queue wakeup request(s)\n\nAmendment history preserved in VISION changelog.`,
              slotsUsed: [],
              slotsEmpty: [],
            }}
            preset={null}
            onConfirm={handleApply}
            onCancel={handleCancelConfirm}
          />
        )}

        {step === "applying" && (
          <ApplyProgress
            step={applyStep as any}
            progress={{}}
          />
        )}

        {step === "complete" && (
          <div className="text-center py-3xl">
            <h2 className="text-display font-bold text-foreground mb-md">
              ✓ Company repositioned!
            </h2>
            <p className="text-body font-normal text-foreground/70 mb-lg">
              Your VISION document has been updated and agents have been notified.
              Check your company's issue list for cascading work items.
            </p>
            <button
              onClick={() => {
                window.location.href = `/company/${companyId}`;
              }}
              className="px-lg py-md bg-accent text-white font-bold rounded hover:bg-accent/90 transition-colors"
            >
              Go to company
            </button>
          </div>
        )}

        {step === "waiting-approval" && (
          <ApprovingWaitingState
            submittedAt={waitingApprovalTime}
            onRefresh={async () => {}}
            onCancel={handleErrorClose}
          />
        )}

        {step === "error" && (
          <ApplyErrorDisplay
            step="apply"
            errors={[applyError || "An error occurred"]}
            onRetry={handleErrorRetry}
            onClose={handleErrorClose}
          />
        )}
      </main>
    </div>
  );
}
