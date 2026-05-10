/**
 * RepositionInterviewFlow Component — Scoped re-interview orchestrator
 *
 * Per 05-UI-SPEC.md §Phase 3: Thin wrapper around Phase 2 interview machinery.
 * Filters interview sections to affected scope, pre-fills answers from current VISION,
 * orchestrates section progression through affected sections only.
 * Reuses InterviewSection, QuestionRenderer, SectionNavRail from Phase 2.
 */

import React, { useState, useCallback, useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import { loadInterviewSections } from "../../primitives/interview-loader.js";
import { filterInterviewToScope, getSectionAnswerSeed } from "../../reposition/index.js";
import {
  InterviewSection as InterviewSectionComponent,
  SectionNavRail,
} from "../found/index.js";
import type {
  InterviewAnswers,
  InterviewSection,
} from "../../types/found.js";
import type { VisionSectionId } from "../../types/reposition.js";
import type { ParsedVision } from "../../types/assess.js";

interface RepositionInterviewFlowProps {
  /** Section IDs to interview (from founder's scope selection) */
  affectedSectionIds: VisionSectionId[];
  /** Current VISION for pre-filling answers */
  currentVision: ParsedVision | null;
  /** Callback when interview completes */
  onComplete: (answers: InterviewAnswers) => Promise<void>;
  /** Callback to go back to scope confirmation */
  onBack: () => void;
}

/**
 * Scoped re-interview: filters to affected sections, pre-fills from current VISION.
 */
export function RepositionInterviewFlow({
  affectedSectionIds,
  currentVision,
  onComplete,
  onBack,
}: RepositionInterviewFlowProps): React.ReactElement {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<InterviewAnswers>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load and filter interview sections
  const scopedSections = useMemo(() => {
    const allSections = loadInterviewSections();
    const filtered = filterInterviewToScope(
      allSections,
      affectedSectionIds
    );
    return filtered;
  }, [affectedSectionIds]);

  // Pre-fill answers from current VISION on mount
  useMemo(() => {
    if (currentVision && scopedSections.length > 0) {
      const seeds: InterviewAnswers = {};
      for (const sectionId of affectedSectionIds) {
        const seed = getSectionAnswerSeed(currentVision, sectionId);
        Object.assign(seeds, seed);
      }
      setAnswers((prev) => ({ ...prev, ...seeds }));
    }
  }, [currentVision, affectedSectionIds, scopedSections]);

  const currentSection = scopedSections[currentSectionIndex];
  const isLastSection = currentSectionIndex === scopedSections.length - 1;

  const handleAnswerChange = useCallback((newAnswers: InterviewAnswers) => {
    setAnswers(newAnswers);
  }, []);

  const handleNext = useCallback(async () => {
    if (isLastSection) {
      // Complete interview
      try {
        setError(null);
        setIsLoading(true);
        await onComplete(answers);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to complete interview";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Advance to next section
      setCurrentSectionIndex((i) => i + 1);
    }
  }, [isLastSection, answers, onComplete]);

  const handleBack = useCallback(() => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((i) => i - 1);
    } else {
      onBack();
    }
  }, [currentSectionIndex, onBack]);

  const handleSectionNavigate = useCallback((sectionIndex: number) => {
    setCurrentSectionIndex(sectionIndex);
  }, []);

  if (!currentSection) {
    return (
      <div className="flex items-center justify-center p-4 min-h-96">
        <p className="text-sm text-foreground/70">No sections to interview.</p>
      </div>
    );
  }

  const completedSections = useMemo(() => {
    return scopedSections
      .slice(0, currentSectionIndex)
      .map((_, i) => i);
  }, [scopedSections, currentSectionIndex]);

  const nextSectionName = !isLastSection && currentSectionIndex + 1 < scopedSections.length
    ? scopedSections[currentSectionIndex + 1].title
    : "";

  return (
    <div className="flex gap-4 h-full">
      {/* Left nav rail */}
      <nav className="w-60 flex-shrink-0 border-r border-border p-4 overflow-y-auto">
        <SectionNavRail
          sections={scopedSections}
          currentSectionIndex={currentSectionIndex}
          completedSections={completedSections}
          onJumpTo={handleSectionNavigate}
        />
      </nav>

      {/* Main interview content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-accent font-normal hover:text-accent/80 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to scope confirmation
        </button>

        {/* Interview section */}
        <InterviewSectionComponent
          section={currentSection}
          answers={answers}
          onAnswersChange={handleAnswerChange}
          onNavigate={(direction) => {
            if (direction === "next") handleNext();
            else handleBack();
          }}
          nextSectionName={nextSectionName}
          isFirstSection={currentSectionIndex === 0}
          isLastSection={isLastSection}
        />

        {/* Error message */}
        {error && (
          <p className="text-sm font-normal text-destructive p-3 bg-destructive/10 rounded-none border border-destructive">
            {error}
          </p>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 pt-3">
          <button
            onClick={handleBack}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-accent font-bold border border-border rounded-none hover:bg-card disabled:opacity-50 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleNext}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-accent text-white font-bold rounded-none hover:bg-accent/90 disabled:bg-foreground/20 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Loading..." : isLastSection ? "Review and preview" : `Next: ${nextSectionName}`}
          </button>
        </div>
      </main>
    </div>
  );
}
