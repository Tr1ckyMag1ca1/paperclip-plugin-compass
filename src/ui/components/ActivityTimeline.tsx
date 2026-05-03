import React from "react";
import { Clock } from "lucide-react";
import type { Issue } from "../../types.js";

interface ActivityTimelineProps {
  issues: Issue[];
}

/**
 * ActivityTimeline — Display recent issues/activity (last 30 days) as a timeline.
 *
 * Per UI-SPEC.md, displays:
 * - Recent issues with date and status
 * - Grouped by date if helpful (simplified in M1)
 * - Empty state: "No activity in the last 30 days..."
 *
 * In M1, this is a simple list. M2+ can enhance with grouping, filtering, etc.
 *
 * @param issues Array of recent issues
 */
export function ActivityTimeline({
  issues,
}: ActivityTimelineProps): React.ReactElement {
  if (issues.length === 0) {
    return (
      <p className="text-sm text-foreground/60">
        No activity in the last 30 days. Agents may need to be woken up.
      </p>
    );
  }

  return (
    <div className="space-y-sm">
      {issues.map((issue) => (
        <div key={issue.id} className="flex gap-md">
          <div className="flex flex-col items-center gap-xs">
            <Clock className="h-4 w-4 text-accent flex-shrink-0 mt-1" />
          </div>
          <div className="flex-1 min-w-0 pb-sm">
            <div className="flex items-baseline justify-between gap-md">
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {issue.title}
              </p>
              <span className="text-xs text-foreground/60 flex-shrink-0">
                {formatDate(new Date(issue.createdAt || Date.now()))}
              </span>
            </div>
            {issue.status && (
              <p className="text-xs text-foreground/60 mt-xs">
                Status: {issue.status}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Format date as relative time (e.g., "2 days ago").
 *
 * @param date Date to format
 * @returns Human-readable label
 */
function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString();
}
