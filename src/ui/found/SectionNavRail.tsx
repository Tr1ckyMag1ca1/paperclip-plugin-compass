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
    <div className="border-b bg-card px-lg py-sm">
      <div className="flex gap-xs items-center overflow-x-auto pb-sm">
        <span className="text-label text-foreground/70 mr-sm shrink-0 font-normal">
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
              className={`shrink-0 flex items-center gap-xs px-md py-sm rounded text-sm font-medium transition-colors whitespace-nowrap ${
                isCurrentSection
                  ? "bg-accent text-accent-foreground"
                  : isNavigableSection
                    ? "bg-card text-foreground hover:bg-card/80 cursor-pointer border border-border"
                    : "bg-background text-foreground/50 cursor-not-allowed opacity-50 border border-border"
              }`}
              title={section.title}
            >
              {isCompletedSection && <CheckCircle className="h-4 w-4 shrink-0" />}
              <span className="hidden sm:inline">{section.title}</span>
              <span className="sm:hidden text-xs">{idx + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
