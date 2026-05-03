import React, { useCallback, useMemo } from "react";
import { QuestionRenderer } from "./QuestionRenderer.js";
import type { InterviewSection as SectionType } from "../../types/found.js";

interface InterviewSectionProps {
  section: SectionType;
  answers: Record<string, string>;
  onAnswersChange: (answers: Record<string, string>) => void;
  onNavigate: (direction: "next" | "back") => void;
  nextSectionName?: string;
  isFirstSection?: boolean;
  isLastSection?: boolean;
}

/**
 * Render a single interview section with all questions.
 * Manages local question state, validates required fields, auto-persists to parent.
 * Per D-13 (linear progression with full back-nav).
 */
export function InterviewSection({
  section,
  answers,
  onAnswersChange,
  onNavigate,
  nextSectionName = "Next Section",
  isFirstSection = false,
  isLastSection = false,
}: InterviewSectionProps): React.ReactElement {
  const handleAnswerChange = useCallback(
    (questionId: string, value: string) => {
      onAnswersChange({ ...answers, [questionId]: value });
    },
    [answers, onAnswersChange]
  );

  // Check if all required questions in this section are answered
  const canAdvance = useMemo(() => {
    return section.questions.every(q => {
      // Skip conditional questions that don't apply
      if (q.showIf) {
        const parentAnswer = answers[q.showIf.questionId];
        const conditionMet =
          (q.showIf.equals && parentAnswer === q.showIf.equals) ||
          (q.showIf.includes && parentAnswer?.includes(q.showIf.includes));
        if (!conditionMet) return true; // Not applicable, so consider it satisfied
      }

      // Check required questions
      if (!q.required) return true;
      const answer = answers[q.id];
      return answer && answer.trim().length > 0;
    });
  }, [section.questions, answers]);

  const nextButtonLabel = isLastSection ? "Review & Apply" : `Next: ${nextSectionName}`;

  return (
    <div className="flex flex-col gap-2xl h-full">
      {/* Section header */}
      <div>
        <h2 className="text-display font-bold">{section.title}</h2>
        {section.intro && (
          <p className="text-body text-foreground/70 mt-md">{section.intro}</p>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-lg flex-1">
        {section.questions.map(question => (
          <QuestionRenderer
            key={question.id}
            question={question}
            value={answers[question.id] || ""}
            onChange={(val) => handleAnswerChange(question.id, val)}
            answers={answers}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-md justify-between pt-lg border-t border-border">
        <button
          onClick={() => onNavigate("back")}
          disabled={isFirstSection}
          className="px-md py-sm rounded border border-border text-foreground hover:bg-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => onNavigate("next")}
          disabled={!canAdvance}
          className="px-md py-sm rounded bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {nextButtonLabel}
        </button>
      </div>
    </div>
  );
}
