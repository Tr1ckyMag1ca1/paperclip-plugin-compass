import React, { useCallback } from "react";
import { CheckCircle } from "lucide-react";
import type { InterviewSection } from "../../types/found.js";

interface SectionNavRailProps {
  sections: InterviewSection[];
  currentSectionIndex: number;
  completedSections: number[];
  onJumpTo: (index: number) => void;
}

/**
 * Progress indicator and section navigation rail.
 * Shows all 6 sections, current section highlighted, completed sections with checkmark.
 * Allows backward jumps to prior sections; forward sections disabled until current complete.
 * Per D-13 (linear progression with full back-nav).
 */
export function SectionNavRail({
  sections,
  currentSectionIndex,
  completedSections,
  onJumpTo,
}: SectionNavRailProps): React.ReactElement {
  const handleJumpTo = useCallback(
    (index: number) => {
      if (index <= currentSectionIndex) {
        onJumpTo(index);
      }
    },
    [currentSectionIndex, onJumpTo]
  );

  return (
    <div className="border-b border-border bg-background px-4 py-2 w-full min-w-0">
      <div className="flex gap-1 items-center overflow-x-auto pb-2 w-full min-w-0">
        <span className="text-xs font-medium text-muted-foreground mr-2 shrink-0 whitespace-nowrap">
          {completedSections.length} of {sections.length} sections
        </span>

        {sections.map((section, idx) => {
          const isCurrentSection = idx === currentSectionIndex;
          const isCompletedSection = completedSections.includes(idx);
          const isNavigableSection = idx <= currentSectionIndex;

          return (
            <button
              key={idx}
              onClick={() => handleJumpTo(idx)}
              disabled={!isNavigableSection}
              className={`shrink-0 flex items-center gap-1 px-3 py-2 rounded-none text-sm font-medium transition-colors whitespace-nowrap ${
                isCurrentSection
                  ? "bg-foreground text-background"
                  : isNavigableSection
                    ? "bg-card text-foreground hover:bg-muted cursor-pointer border border-border"
                    : "bg-background text-muted-foreground cursor-not-allowed opacity-50 border border-border"
              }`}
              title={section.title}
            >
              {isCompletedSection && <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />}
              <span className="hidden sm:inline">{section.title}</span>
              <span className="sm:hidden text-xs">{idx + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
