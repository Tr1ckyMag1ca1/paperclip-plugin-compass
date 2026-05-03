/**
 * Finding Lifecycle Management
 *
 * Per D-05, D-08: Pure functions for finding creation, status transitions,
 * deduplication against prior findings, and filtering. All operations are
 * immutable (return new objects, never mutate input).
 *
 * ASSESS-09 dedup logic filters new findings to exclude any with summary
 * matching (substring match) an open finding from prior runs, preventing
 * repeat noise in drift signals.
 */

import { randomUUID } from "node:crypto";
import type { Finding, FindingStatus, Mode, StatusTransition } from "../types/memory.js";

/**
 * Create a new finding with initial "open" status.
 *
 * Per D-05: Auto-generate UUID for id, set created_at to now, status to "open",
 * and initialize status_history with the creation transition.
 *
 * @param runId UUID of the Apply run that generated this finding
 * @param mode Which mode generated this (Found, Assess, Revive, Reposition)
 * @param summary One-liner summary of the finding
 * @param evidenceRefs Array of issue/comment/document IDs supporting finding
 * @returns Typed Finding with initial status "open"
 */
export function createFinding(
  runId: string,
  mode: Mode,
  summary: string,
  evidenceRefs: string[] = []
): Finding {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    run_id: runId,
    mode,
    created_at: now,
    summary,
    evidence_refs: evidenceRefs,
    status: "open",
    status_history: [
      {
        from: null,
        to: "open",
        at: now,
      },
    ],
  };
}

/**
 * Transition a finding to a new status (immutable).
 *
 * Per D-05: Returns a new Finding object (never mutates input). Validates
 * state machine:
 * - "open" can transition to "addressed" or "invalidated"
 * - "addressed" and "invalidated" are terminal (no further transitions)
 *
 * Throws if transition is invalid.
 *
 * @param finding Original finding
 * @param newStatus Target status
 * @param byRunId Optional Run ID that triggered transition
 * @returns New Finding with updated status and status_history
 */
export function transitionStatus(
  finding: Finding,
  newStatus: FindingStatus,
  byRunId?: string
): Finding {
  // Validate state machine
  if (finding.status === "open" && (newStatus === "addressed" || newStatus === "invalidated")) {
    // Valid transition from open
  } else if (finding.status === "addressed" || finding.status === "invalidated") {
    // Invalid: no further transitions from terminal states
    throw new Error(
      `Cannot transition finding ${finding.id} from terminal status "${finding.status}" to "${newStatus}"`
    );
  } else if (finding.status === newStatus) {
    // Idempotent: already in target status, return as-is
    return finding;
  } else {
    throw new Error(
      `Invalid status transition for finding ${finding.id}: "${finding.status}" → "${newStatus}"`
    );
  }

  const now = new Date().toISOString();
  const newTransition: StatusTransition = {
    from: finding.status,
    to: newStatus,
    at: now,
    by_run_id: byRunId,
  };

  return {
    ...finding,
    status: newStatus,
    status_history: [...finding.status_history, newTransition],
  };
}

/**
 * Deduplicate new findings against still-open findings from prior runs.
 *
 * Per D-08, D-09 (ASSESS-09): Filter newFindings to exclude any whose summary
 * contains (substring match) the summary of an open finding from a prior run.
 * This prevents repeat noise when Assess detects the same drift signal again.
 *
 * When founder marks an old finding as "addressed", subsequent Assess runs
 * won't suppress its drift signal (because it's no longer "open").
 *
 * @param newFindings Array of findings from current mode Apply
 * @param openFindings Array of still-open findings from prior runs
 * @returns Filtered newFindings excluding those matching open findings
 */
export function deduplicateAgainstOpenFindings(
  newFindings: Finding[],
  openFindings: Finding[]
): Finding[] {
  if (openFindings.length === 0) {
    return newFindings;
  }

  // Build set of normalized open summaries for fast lookup
  const openSummaries = openFindings.map((f) => f.summary.toLowerCase());

  return newFindings.filter((newFinding) => {
    const newSummary = newFinding.summary.toLowerCase();

    // Check if this new finding matches any open finding (substring match)
    for (const openSummary of openSummaries) {
      if (newSummary.includes(openSummary) || openSummary.includes(newSummary)) {
        // Matches an open finding — exclude it
        return false;
      }
    }

    // No match — include it
    return true;
  });
}

/**
 * Filter findings by status.
 *
 * @param findings Array of findings
 * @param status Target status (or "all" for no filtering)
 * @returns Filtered findings
 */
export function filterByStatus(findings: Finding[], status: FindingStatus | "all"): Finding[] {
  if (status === "all") {
    return findings;
  }
  return findings.filter((f) => f.status === status);
}

/**
 * Filter findings by mode.
 *
 * @param findings Array of findings
 * @param mode Target mode (or "all" for no filtering)
 * @returns Filtered findings
 */
export function filterByMode(findings: Finding[], mode: Mode | "all"): Finding[] {
  if (mode === "all") {
    return findings;
  }
  return findings.filter((f) => f.mode === mode);
}

/**
 * Filter findings by date range (inclusive on both bounds).
 *
 * @param findings Array of findings
 * @param startDate Inclusive start date
 * @param endDate Inclusive end date
 * @returns Findings with created_at within range
 */
export function filterByDateRange(findings: Finding[], startDate: Date, endDate: Date): Finding[] {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  return findings.filter((f) => {
    const findingTime = new Date(f.created_at).getTime();
    return findingTime >= startTime && findingTime <= endTime;
  });
}
