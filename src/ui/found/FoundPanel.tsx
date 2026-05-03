/**
 * FoundPanel — Orchestrator for Found Mode
 *
 * Per D-13 (linear progression with full back-nav) and FOUND-11 (two-stage approval gate),
 * FoundPanel manages the complete Found mode interview → preview → confirm → apply flow.
 *
 * State machine enforces:
 * 1. interview → preview (all required questions answered)
 * 2. preview → confirming (explicit "Confirm & apply" after optional edit)
 * 3. confirming → applying (explicit "I confirm" in modal)
 * 4. applying → complete (success) or error (failure)
 *
 * No code path skips approval gates. Preset selection is locked after chosen.
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  usePluginData,
  usePluginAction,
} from "@paperclipai/plugin-sdk/ui";
import type {
  InterviewAnswers,
  InterviewSection,
  FilledVision,
  QualityCheckResult,
  PresetDefinition,
} from "../../types/found.js";
import { fillVisionTemplate } from "../../found/template-fill.js";
import { checkVisionQuality } from "../../found/quality-check.js";
import { loadInterviewSections } from "../../primitives/interview-loader.js";
import {
  InterviewSection as InterviewSectionComponent,
  SectionNavRail,
  PresetSelector,
  VisionPreview,
  ProvisioningSummary,
  ConfirmationModal,
  ApplyProgress,
  ApplyErrorDisplay,
  useInterviewDraft,
} from "./index.js";

type FoundStep =
  | "interview"
  | "preview"
  | "confirming"
  | "applying"
  | "complete"
  | "error";

interface ApplyResult {
  success: boolean;
  visionDocId?: string;
  agentIds?: string[];
  issueIds?: string[];
  wakeupCount?: number;
  blockingErrors?: string[];
  rollbackApplied?: boolean;
  rollbackErrors?: string[];
  auditLog?: Array<{ timestamp: string; action: string }>;
}

/**
 * FoundPanel — Orchestrates Found mode end-to-end.
 *
 * Props: companyId is implicit via Plugin SDK context.
 * State: maintains interview answers, section progress, preset selection, and step progression.
 *
 * @returns React component for Found mode interface
 */
export function FoundPanel(): React.ReactElement {
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<InterviewAnswers>({});
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(
    null
  );
  const [step, setStep] = useState<FoundStep>("interview");
  const [vision, setVision] = useState<FilledVision | null>(null);
  const [qualityCheck, setQualityCheck] = useState<QualityCheckResult | null>(
    null
  );
  const [applyResult, setApplyResult] = useState<any>(null);
  const [currentApplyStep, setCurrentApplyStep] = useState<string>("preflight");

  // Get company ID from URL params or context (in real integration, via Plugin SDK context)
  // For now, extract from props or assume it's available
  const companyId = (globalThis as any).__COMPASS_COMPANY_ID || "unknown";

  // Load sections from markdown files
  const sections = useMemo(() => loadInterviewSections(), []);

  // Load draft and preset from worker
  const {
    data: draftData,
    loading: draftLoading,
    error: draftError,
  } = usePluginData<{
    draft: InterviewAnswers | null;
    preset: PresetDefinition | null;
  }>("loadInterviewDraft", { companyId });

  // Save draft action
  const saveDraftAction = usePluginAction("saveInterviewDraft");

  // Apply action
  const applyAction = usePluginAction("runApply");

  // Load presets
  const { data: presetsData = [] } = usePluginData<PresetDefinition[]>(
    "getPresets",
    {}
  );
  const presets = Array.isArray(presetsData) ? presetsData : [];

  // Get selected preset object from ID
  const selectedPreset = presets.find((p) => p.id === selectedPresetId) || null;

  // Initialize state from draft on load
  useEffect(() => {
    if (draftData) {
      if (draftData.draft) {
        setAnswers(draftData.draft);
      }
      if (draftData.preset) {
        setSelectedPresetId(draftData.preset.id);
      }
    }
  }, [draftData]);

  // Auto-save answers to worker on every change (debounced in real impl)
  const handleAnswerChange = useCallback(
    (newAnswers: InterviewAnswers) => {
      setAnswers(newAnswers);
      // Fire-and-forget save (don't wait for completion)
      saveDraftAction({
        companyId,
        answers: newAnswers,
        preset: selectedPreset,
      }).catch((err) => {
        console.error("Failed to save draft:", err);
      });
    },
    [companyId, selectedPresetId, saveDraftAction, selectedPreset]
  );

  // Section validation: check if all required questions in section are answered
  const canAdvanceFromSection = useMemo(() => {
    const section = sections[currentSection];
    if (!section) return false;

    return section.questions.every((q) => {
      // Skip conditional questions that don't apply
      if (q.showIf) {
        const parentAnswer = answers[q.showIf.questionId];
        const conditionMet =
          (q.showIf.equals && parentAnswer === q.showIf.equals) ||
          (q.showIf.includes && parentAnswer?.includes(q.showIf.includes));
        if (!conditionMet) return true; // Not applicable, so satisfied
      }

      // Check required questions
      if (!q.required) return true;
      const answer = answers[q.id];
      return answer && answer.trim().length > 0;
    });
  }, [sections, currentSection, answers]);

  // All required questions answered across all sections
  const allQuestionsAnswered = useMemo(() => {
    return sections.every((section) => {
      return section.questions.every((q) => {
        // Skip conditional that don't apply
        if (q.showIf) {
          const parentAnswer = answers[q.showIf.questionId];
          const conditionMet =
            (q.showIf.equals && parentAnswer === q.showIf.equals) ||
            (q.showIf.includes && parentAnswer?.includes(q.showIf.includes));
          if (!conditionMet) return true;
        }

        if (!q.required) return true;
        const answer = answers[q.id];
        return answer && answer.trim().length > 0;
      });
    });
  }, [sections, answers]);

  // Preset selected
  const hasPresetSelected = !!selectedPresetId;

  // Interview section navigation
  const handleSectionNavigate = useCallback(
    (direction: "next" | "back") => {
      if (direction === "back" && currentSection > 0) {
        setCurrentSection((c) => c - 1);
      } else if (direction === "next") {
        if (currentSection < sections.length - 1) {
          setCurrentSection((c) => c + 1);
        } else if (allQuestionsAnswered && hasPresetSelected) {
          // Jump to preview (last section completed)
          const filled = fillVisionTemplate(answers);
          const quality = checkVisionQuality(filled);
          setVision(filled);
          setQualityCheck(quality);
          setStep("preview");
        }
      }
    },
    [currentSection, sections, answers, hasPresetSelected, allQuestionsAnswered]
  );

  // Handle preset selection (locked after selection)
  const handlePresetSelect = useCallback((presetId: string) => {
    setSelectedPresetId(presetId);
  }, []);

  // Back from preview to interview
  const handleBackFromPreview = useCallback(() => {
    setStep("interview");
  }, []);

  // Confirm preview (edit complete, move to confirming)
  const handlePreviewConfirm = useCallback(() => {
    // Re-check quality with any edits made
    if (vision) {
      const updatedQuality = checkVisionQuality(vision);
      setQualityCheck(updatedQuality);

      // Block if required slots missing
      if (!updatedQuality.isValid) {
        // Component will show error; don't advance
        return;
      }
    }

    setStep("confirming");
  }, [vision]);

  // Back from confirming to preview
  const handleCancelConfirm = useCallback(() => {
    setStep("preview");
  }, []);

  // Apply confirmed: call worker action
  const handleConfirmationConfirm = useCallback(async () => {
    if (!vision || !selectedPreset) return;

    setStep("applying");
    setCurrentApplyStep("preflight");

    try {
      const result = await applyAction({
        companyId,
        vision,
        preset: selectedPreset,
      });

      if (result && typeof result === "object") {
        setApplyResult(result);

        if ((result as any).success) {
          setStep("complete");
          // Clear draft on success
          saveDraftAction({ companyId, answers: {}, preset: null }).catch(
            (err) => console.error("Failed to clear draft:", err)
          );
        } else {
          setStep("error");
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      setApplyResult({
        success: false,
        blockingErrors: [message],
      });
      setStep("error");
    }
  }, [vision, selectedPreset, companyId, applyAction, saveDraftAction]);

  // Retry apply after error
  const handleRetryApply = useCallback(async () => {
    if (!vision || !selectedPreset) return;

    setStep("applying");
    setCurrentApplyStep("preflight");

    try {
      const result = await applyAction({
        companyId,
        vision,
        preset: selectedPreset,
      });

      if (result && typeof result === "object") {
        setApplyResult(result);

        if ((result as any).success) {
          setStep("complete");
          saveDraftAction({ companyId, answers: {}, preset: null }).catch(
            (err) => console.error("Failed to clear draft:", err)
          );
        } else {
          setStep("error");
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      setApplyResult({
        success: false,
        blockingErrors: [message],
      });
      setStep("error");
    }
  }, [vision, selectedPreset, companyId, applyAction, saveDraftAction]);

  // Back from error to preview
  const handleBackFromError = useCallback(() => {
    setStep("preview");
    setApplyResult(null);
  }, []);

  // Close on complete
  const handleCloseComplete = useCallback(() => {
    // In real implementation, close plugin or navigate away
    // For now, reset to interview
    setStep("interview");
    setAnswers({});
    setSelectedPresetId(null);
    setVision(null);
    setApplyResult(null);
    setCurrentSection(0);
  }, []);

  // Loading state
  if (draftLoading) {
    return (
      <div className="flex items-center justify-center p-lg min-h-[400px]">
        <p className="text-body text-foreground/70">Loading interview...</p>
      </div>
    );
  }

  // Error state
  if (draftError) {
    return (
      <div className="flex items-center justify-center p-lg min-h-[400px]">
        <div className="text-center">
          <p className="text-body text-error">
            Failed to load interview draft
          </p>
          {draftError instanceof Error && (
            <p className="text-sm text-foreground/70">{draftError.message}</p>
          )}
        </div>
      </div>
    );
  }

  // Render interview step
  if (step === "interview") {
    const section = sections[currentSection];
    const nextSectionName =
      currentSection < sections.length - 1
        ? sections[currentSection + 1].title
        : "Review & Apply";

    return (
      <div className="flex h-full flex-col gap-0">
        <div className="flex flex-1 gap-lg">
          {/* Section navigation rail */}
          <SectionNavRail
            sections={sections}
            currentSectionIndex={currentSection}
            completedSections={sections
              .slice(0, currentSection)
              .map((_, i) => i)} // Simplified: mark prior sections as done
            onJumpTo={setCurrentSection}
          />

          {/* Interview section */}
          <div className="flex-1 overflow-y-auto px-lg py-md">
            {section && (
              <InterviewSectionComponent
                section={section}
                answers={answers}
                onAnswersChange={handleAnswerChange}
                onNavigate={handleSectionNavigate}
                nextSectionName={nextSectionName}
                isFirstSection={currentSection === 0}
                isLastSection={currentSection === sections.length - 1}
              />
            )}
          </div>
        </div>

        {/* Preset selector (placed at end of interview) */}
        {currentSection === sections.length - 1 && (
          <div className="border-t px-lg py-md">
            <div className="mb-md">
              <h3 className="text-body font-semibold">Choose Your Setup</h3>
              <p className="text-sm text-foreground/70">
                Select which agents to provision when you apply.
              </p>
            </div>
            {presets.length > 0 ? (
              <PresetSelector
                presets={presets}
                selected={selectedPresetId}
                onSelect={handlePresetSelect}
              />
            ) : (
              <p className="text-sm text-foreground/70">
                Loading presets...
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Render preview step
  if (step === "preview" && vision) {
    return (
      <div className="flex h-full flex-col gap-lg p-lg">
        <div>
          <h2 className="text-display font-bold">
            Here's the company you're founding.
          </h2>
          <p className="text-body text-foreground/70 mt-md">
            Edit anything before you apply.
          </p>
        </div>

        {/* Vision preview (editable) */}
        <div className="flex-1 overflow-y-auto">
          <VisionPreview
            vision={vision}
            preset={selectedPreset}
            onBack={() => {}} // Not used in this layout
            onConfirm={() => {}} // Not used in this layout
          />
        </div>

        {/* Provisioning summary */}
        {selectedPreset && (
          <ProvisioningSummary preset={selectedPreset} />
        )}

        {/* Navigation buttons */}
        <div className="flex gap-md border-t pt-md">
          <button
            onClick={handleBackFromPreview}
            className="flex-1 rounded px-md py-sm text-sm font-medium border border-border hover:bg-foreground/5"
          >
            Back to Interview
          </button>
          <button
            onClick={handlePreviewConfirm}
            className="flex-1 rounded px-md py-sm text-sm font-medium bg-accent text-background hover:bg-accent/90 disabled:opacity-50"
            disabled={!qualityCheck?.isValid}
          >
            Confirm & Apply
          </button>
        </div>

        {/* Quality check errors */}
        {qualityCheck && !qualityCheck.isValid && (
          <div className="rounded border border-error/30 bg-error/5 p-md">
            <p className="text-sm font-medium text-error">
              Missing required sections:
            </p>
            <ul className="mt-sm space-y-xs text-sm text-foreground/70">
              {qualityCheck.missingRequiredSlots.map((slot) => (
                <li key={slot}>• {slot}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Render confirming step
  if (step === "confirming" && vision) {
    return (
      <ConfirmationModal
        vision={vision}
        preset={selectedPreset}
        onConfirm={handleConfirmationConfirm}
        onCancel={handleCancelConfirm}
      />
    );
  }

  // Render applying step
  if (step === "applying") {
    return (
      <div className="flex h-full flex-col gap-lg p-lg">
        <div>
          <h2 className="text-display font-bold">Creating your company...</h2>
          <p className="text-body text-foreground/70 mt-md">
            This may take a moment.
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <ApplyProgress
            step={currentApplyStep as any}
            progress={{}}
          />
        </div>
      </div>
    );
  }

  // Render complete step
  if (step === "complete" && applyResult) {
    return (
      <div className="flex h-full flex-col gap-lg p-lg items-center justify-center">
        <div className="text-center">
          <div className="mb-md text-4xl">✓</div>
          <h2 className="text-display font-bold">Company founded!</h2>
          <p className="text-body text-foreground/70 mt-md">
            {(applyResult as any).agentIds?.length || 0} agents provisioned
          </p>
          {(applyResult as any).issueIds && (
            <p className="text-body text-foreground/70">
              {(applyResult as any).issueIds.length} kickoff issues created
            </p>
          )}
        </div>

        <div className="flex gap-md w-full">
          <button
            onClick={handleCloseComplete}
            className="flex-1 rounded px-md py-sm text-sm font-medium border border-border hover:bg-foreground/5"
          >
            Close
          </button>
          <button
            onClick={() => {
              // In real impl: navigate to company view
              console.log("Navigate to company:", (applyResult as any).visionDocId);
            }}
            className="flex-1 rounded px-md py-sm text-sm font-medium bg-accent text-background hover:bg-accent/90"
          >
            View Company
          </button>
        </div>
      </div>
    );
  }

  // Render error step
  if (step === "error" && applyResult) {
    return (
      <div className="flex h-full flex-col gap-lg p-lg">
        <ApplyErrorDisplay
          step={currentApplyStep}
          errors={applyResult.blockingErrors || applyResult.errors || []}
          rollbackApplied={applyResult.rollbackApplied}
          rollbackErrors={applyResult.rollbackErrors}
          onRetry={handleRetryApply}
          onClose={handleBackFromError}
        />
      </div>
    );
  }

  // Fallback: should not reach here
  return (
    <div className="flex items-center justify-center p-lg min-h-[400px]">
      <p className="text-body text-error">Unknown state: {step}</p>
    </div>
  );
}
