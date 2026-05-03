/**
 * Amendment Formatting and Application
 *
 * Per D-07 and D-08: formats proposed amendments with unified diff,
 * creates changelog entries, and applies amendments immutably to ParsedVision.
 * Default-NO enforcement: amendments start unaccepted; founder must explicitly approve.
 */

import type { ParsedVision, AmendmentLogEntry } from "../types/assess.js";

/**
 * Amendment proposal with delta and display lines.
 */
export interface AmendmentProposal {
  /** Unified diff format showing before/after */
  delta: string;

  /** 3-5 lines of context for sidebar display */
  diffLines: string[];
}

/**
 * Format an amendment as a unified diff and context lines.
 *
 * Per D-08, produces a readable before-vs-after diff suitable for sidebar display.
 * Uses simple line-based diff (no external library — zero deps).
 * Wraps long lines at ~60 chars to fit sidebar width.
 *
 * @param current Current section content
 * @param proposed Proposed section content
 * @returns AmendmentProposal with delta and display lines
 */
export function formatAmendment(current: string, proposed: string): AmendmentProposal {
  const currentLines = current.split("\n");
  const proposedLines = proposed.split("\n");

  // Build unified diff format
  const diffLines: string[] = [];
  const linesForDisplay: string[] = [];

  // Simple line-based diff: show removed lines and added lines
  const removed: Set<string> = new Set(currentLines);
  const added: Set<string> = new Set(proposedLines);

  for (const line of currentLines) {
    if (!added.has(line)) {
      diffLines.push(`- ${truncateToWidth(line, 60)}`);
      linesForDisplay.push(`- ${truncateToWidth(line, 60)}`);
    }
  }

  for (const line of proposedLines) {
    if (!removed.has(line)) {
      diffLines.push(`+ ${truncateToWidth(line, 60)}`);
      linesForDisplay.push(`+ ${truncateToWidth(line, 60)}`);
    }
  }

  // If no changes detected, return a minimal diff
  if (diffLines.length === 0) {
    return {
      delta: "No changes",
      diffLines: ["(no changes detected)"],
    };
  }

  // Limit display lines to 5 for sidebar (show first 5 changes)
  const displayLinesLimited = linesForDisplay.slice(0, 5);
  if (linesForDisplay.length > 5) {
    displayLinesLimited.push(`... and ${linesForDisplay.length - 5} more change(s)`);
  }

  return {
    delta: diffLines.join("\n"),
    diffLines: displayLinesLimited,
  };
}

/**
 * Truncate a line to fit sidebar width.
 *
 * @param line Line text
 * @param maxWidth Maximum width (default 60 chars)
 * @returns Truncated line with ellipsis if needed
 */
function truncateToWidth(line: string, maxWidth: number = 60): string {
  if (line.length <= maxWidth) {
    return line;
  }
  return line.substring(0, maxWidth - 3) + "...";
}

/**
 * Format a changelog entry as markdown.
 *
 * Per D-07, produces a markdown list item with timestamp and reason.
 * Appended to ## Amendment Log section in VISION.md.
 *
 * Format: `- {ISO timestamp}: {reason}`
 *
 * @param entry AmendmentLogEntry to format
 * @returns Markdown-formatted changelog line
 */
export function formatChangelog(entry: AmendmentLogEntry): string {
  return `- ${entry.timestamp}: ${entry.reason}`;
}

/**
 * Apply an amendment to a VISION section immutably.
 *
 * Per D-07, functionally updates the ParsedVision object:
 * 1. Updates the specified section with new content
 * 2. Appends an amendment log entry with timestamp and reason
 * 3. Returns a new ParsedVision object (original unchanged)
 *
 * This function assumes founder has already approved the amendment
 * (default-NO enforcement happens at UI level).
 *
 * @param vision Current ParsedVision object
 * @param sectionName Name of section to amend
 * @param newContent New section content
 * @param reason Human-readable reason for amendment
 * @param founderIdentity Optional founder identity for audit trail
 * @returns New ParsedVision with amendment applied
 */
export function applyAmendmentToVision(
  vision: ParsedVision,
  sectionName: keyof ParsedVision,
  newContent: string,
  reason: string,
  founderIdentity?: string
): ParsedVision {
  // Create new object with updated section
  const updated: ParsedVision = { ...vision };
  (updated as Record<string, any>)[sectionName] = newContent;

  // Create amendment log entry
  const entry: AmendmentLogEntry = {
    timestamp: new Date().toISOString(),
    section: String(sectionName),
    reason,
    founderIdentity,
  };

  // Append to amendments array (or create if doesn't exist)
  if (!updated.amendments) {
    updated.amendments = [];
  }
  updated.amendments = [...updated.amendments, entry];

  return updated;
}
