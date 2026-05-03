/**
 * Activity Snapshot Builder for Drift Detection
 *
 * Per D-02, builds an ActivitySnapshot by querying SDK adapter for issues,
 * issue comments, and documents filtered to a time window (default 30 days).
 * Excludes VISION.md document itself to avoid self-reference.
 *
 * Pure async function: no side effects, depends only on injected adapter.
 */

import type { PaperclipAdapter } from "../sdk/adapter.js";
import type { ActivitySnapshot } from "../types/assess.js";

/**
 * Build an activity snapshot from recent company activity.
 *
 * Per D-02, queries SDK adapter for issues, comments, documents in the last N days.
 * Returns an ActivitySnapshot container with all activity items and window metadata.
 *
 * Filters:
 * - Issues: created since (now - windowDays)
 * - Comments: created since (now - windowDays)
 * - Documents: created since (now - windowDays), excludes VISION.md by title/key
 *
 * @param adapter SDKAdapter instance for querying
 * @param companyId Company ID to query activity for
 * @param windowDays Number of days to look back (default 30)
 * @returns ActivitySnapshot with all activity items and window bounds
 */
export async function buildActivitySnapshot(
  adapter: PaperclipAdapter,
  companyId: string,
  windowDays: number = 30
): Promise<ActivitySnapshot> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  // Query adapter for activity (filtering happens in adapter methods)
  const [issues, comments, documents] = await Promise.all([
    adapter.listIssues(companyId, windowStart),
    adapter.listIssueComments(companyId, windowStart),
    adapter.listDocuments(companyId, windowStart),
  ]);

  const totalItemCount = issues.length + comments.length + documents.length;

  return {
    issues,
    comments,
    documents,
    totalItemCount,
    windowStartDate: windowStart,
    windowEndDate: now,
  };
}
