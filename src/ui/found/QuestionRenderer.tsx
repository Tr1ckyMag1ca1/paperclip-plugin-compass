import React, { useCallback } from "react";
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

  return (
    <div className="space-y-sm">
      <label className="text-label font-normal">
        {question.prompt}
        {question.required && <span className="text-accent ml-xs">*</span>}
      </label>

      {question.type === "free-text-short" && (
        <input
          type="text"
          value={value}
          onChange={handleChange}
          maxLength={200}
          placeholder={question.hint || ""}
          className="w-full px-md py-sm rounded border border-border bg-background text-body placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      )}

      {question.type === "free-text-long" && (
        <textarea
          value={value}
          onChange={handleChange}
          maxLength={2000}
          rows={4}
          placeholder={question.hint || ""}
          className="w-full px-md py-sm rounded border border-border bg-background text-body placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
        />
      )}

      {question.type === "single-choice" && (
        <div className="space-y-sm">
          {question.options?.map(opt => (
            <label key={opt} className="flex gap-sm items-center cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value={opt}
                checked={value === opt}
                onChange={handleChange}
                className="cursor-pointer"
              />
              <span className="text-body">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === "multi-choice" && (
        <div className="space-y-sm">
          {question.options?.map(opt => (
            <label key={opt} className="flex gap-sm items-center cursor-pointer">
              <input
                type="checkbox"
                value={opt}
                checked={value.split(",").filter(Boolean).includes(opt)}
                onChange={(e) => handleCheckboxChange(opt, e.target.checked)}
                className="cursor-pointer"
              />
              <span className="text-body">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === "conditional-follow-up" && (
        <div className="space-y-sm">
          <textarea
            value={value}
            onChange={handleChange}
            maxLength={2000}
            rows={3}
            placeholder={question.hint || ""}
            className="w-full px-md py-sm rounded border border-border bg-background text-body placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
        </div>
      )}

      {question.hint && (
        <p className="text-label text-foreground/70 mt-xs">{question.hint}</p>
      )}
    </div>
  );
}
