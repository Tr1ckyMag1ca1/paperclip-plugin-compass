import React, { useCallback } from "react";
import { Card } from "../primitives/Card.js";
import type { Question } from "../../types/found.js";

interface QuestionRendererProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  answers?: Record<string, string>;
}

/**
 * Render a single interview question based on type.
 * Per D-03, supports 5 question types: free-text-short, free-text-long, single-choice, multi-choice, conditional.
 * Handles conditional show-if logic via parent answers context.
 */
export function QuestionRenderer({
  question,
  value,
  onChange,
  answers = {},
}: QuestionRendererProps): React.ReactElement | null {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleCheckboxChange = useCallback(
    (optionValue: string, isChecked: boolean) => {
      const currentValues = value ? value.split(",").filter(Boolean) : [];
      const updatedValues = isChecked
        ? [...currentValues, optionValue]
        : currentValues.filter(v => v !== optionValue);
      onChange(updatedValues.join(","));
    },
    [value, onChange]
  );

  // Conditional: only render if showIf condition met
  if (question.showIf) {
    const parentAnswer = answers[question.showIf.questionId];
    if (question.showIf.equals && parentAnswer !== question.showIf.equals) {
      return null;
    }
    if (question.showIf.includes && !parentAnswer?.includes(question.showIf.includes)) {
      return null;
    }
  }

  const inputId = `question-${question.id}`;
  const errorId = `error-${question.id}`;
  const descriptionId = `description-${question.id}`;

  return (
    <Card variant="default" padding="md">
      <div className="space-y-2">
        <label htmlFor={inputId} className="text-xs font-medium">
          {question.prompt}
          {question.required && <span className="text-emerald-600 ml-1" aria-label="required">*</span>}
          {!question.required && <span className="text-muted-foreground ml-1">(Optional)</span>}
        </label>

        {question.type === "free-text-short" && (
          <input
            id={inputId}
            type="text"
            value={value}
            onChange={handleChange}
            maxLength={200}
            placeholder={question.hint || ""}
            aria-required={question.required}
            aria-describedby={question.hint ? descriptionId : undefined}
            className="w-full px-3 py-2 rounded-none border border-border bg-background text-sm placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        )}

        {question.type === "free-text-long" && (
          <textarea
            id={inputId}
            value={value}
            onChange={handleChange}
            maxLength={2000}
            rows={4}
            placeholder={question.hint || ""}
            aria-required={question.required}
            aria-describedby={question.hint ? descriptionId : undefined}
            className="w-full px-3 py-2 rounded-none border border-border bg-background text-sm placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
          />
        )}

        {question.type === "single-choice" && (
          <fieldset className="space-y-2">
            <legend className="sr-only">{question.prompt}</legend>
            {question.options?.map(opt => (
              <label key={opt} className="flex gap-2 items-center cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={opt}
                  checked={value === opt}
                  onChange={handleChange}
                  aria-required={question.required}
                  className="cursor-pointer"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </fieldset>
        )}

        {question.type === "multi-choice" && (
          <fieldset className="space-y-2">
            <legend className="sr-only">{question.prompt}</legend>
            {question.options?.map(opt => (
              <label key={opt} className="flex gap-2 items-center cursor-pointer">
                <input
                  type="checkbox"
                  value={opt}
                  checked={value.split(",").filter(Boolean).includes(opt)}
                  onChange={(e) => handleCheckboxChange(opt, e.target.checked)}
                  aria-required={question.required}
                  className="cursor-pointer"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </fieldset>
        )}

        {question.type === "conditional-follow-up" && (
          <textarea
            id={inputId}
            value={value}
            onChange={handleChange}
            maxLength={2000}
            rows={3}
            placeholder={question.hint || ""}
            aria-required={question.required}
            aria-describedby={question.hint ? descriptionId : undefined}
            className="w-full px-3 py-2 rounded-none border border-border bg-background text-sm placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
          />
        )}

        {question.hint && (
          <p id={descriptionId} className="text-xs text-muted-foreground mt-1">{question.hint}</p>
        )}
      </div>
    </Card>
  );
}
