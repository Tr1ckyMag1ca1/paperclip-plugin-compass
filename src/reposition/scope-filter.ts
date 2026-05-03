/**
 * Scoped Interview Filter
 *
 * Per D-04, D-05: filters the 6-section interview to only affected sections.
 * Pure function: no I/O, deterministic, fully testable.
 *
 * Takes full interview sections (from loadInterviewSections) and filters
 * to only those whose section.id is in the affected scope.
 * Preserves original section order.
 */

import type { InterviewSection } from "../types/found.js";
import type { VisionSectionId } from "../types/reposition.js";

/**
 * Filter interview sections to only those affected by the shift.
 *
 * Per D-04: Pure function that returns a subset of interview sections.
 * Preserves original order (does not re-sort).
 *
 * @param allSections All interview sections (from loadInterviewSections)
 * @param affectedSectionIds Section IDs to include in the scoped interview
 * @returns Filtered interview sections in original order
 */
export function filterInterviewToScope(
  allSections: InterviewSection[] | null | undefined,
  affectedSectionIds: VisionSectionId[] | null | undefined
): InterviewSection[] {
  // Null-safe: if either argument is null/undefined, return empty array
  if (!allSections || !affectedSectionIds || allSections.length === 0 || affectedSectionIds.length === 0) {
    return [];
  }

  // Create a Set of affected section IDs for O(1) membership test
  const scopeSet = new Set<string>(affectedSectionIds);

  // Filter to only sections in scope, preserving original order
  return allSections.filter((section) => scopeSet.has(section.id));
}
