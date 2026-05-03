/**
 * Memory Module Type Definitions
 *
 * Types for engagement history persistence, finding lifecycle management,
 * and scheduled routine scheduling. All types are pure data structures with
 * no I/O or side effects.
 *
 * Per D-02, D-05: engagement state persists in a per-company document in the
 * documents table. Findings have a complete lifecycle with audit trail.
 * Scheduled routines are stored and cron-validated before persistence.
 */

/**
 * FindingStatus — enumeration of finding states throughout its lifecycle.
 *
 * Per D-05: Findings flow through:
 * - "open": founder hasn't acted on it yet
 * - "addressed": founder explicitly resolved it
 * - "invalidated": no longer relevant (auto-detected or manually marked)
 */
export type FindingStatus = "open" | "addressed" | "invalidated";

/**
 * Mode — all plugin modes that can generate findings.
 *
 * Per D-06: Found, Assess, Revive, and Reposition modes all post findings
 * to engagement history on Apply success.
 */
export type Mode = "Found" | "Assess" | "Revive" | "Reposition";

/**
 * StatusTransition — audit trail entry for a finding status change.
 *
 * Per D-05: Records when and why a finding status changed, with full traceability
 * for the change source (which Apply run triggered the transition).
 */
export interface StatusTransition {
  /** Previous status (null for initial creation) */
  from: FindingStatus | null;

  /** New status after transition */
  to: FindingStatus;

  /** ISO 8601 timestamp when transition occurred */
  at: string;

  /** Optional: Run ID of the Apply that triggered this transition */
  by_run_id?: string;
}

/**
 * Finding — a single strategic recommendation or observation.
 *
 * Per D-05, D-06: Findings are immutable records of strategic insights
 * detected during mode execution (Found initialization, Assess drift,
 * Revive action execution, Reposition amendments). Each finding carries
 * its source mode, run ID, and complete status audit trail.
 *
 * Findings are never deleted — only status-transitioned to maintain audit trail.
 */
export interface Finding {
  /** Unique identifier for this finding (UUID) */
  id: string;

  /** UUID of the Apply run that generated this finding */
  run_id: string;

  /** Which mode generated this finding (Found, Assess, Revive, or Reposition) */
  mode: Mode;

  /** ISO 8601 timestamp when finding was created */
  created_at: string;

  /** Human-readable summary of the finding (one-liner) */
  summary: string;

  /** References to evidence (issue IDs, comment IDs, document keys) supporting finding */
  evidence_refs: string[];

  /** Current status of this finding */
  status: FindingStatus;

  /** Complete audit trail of status transitions */
  status_history: StatusTransition[];
}

/**
 * ScheduledRoutine — a recurring strategic check-in.
 *
 * Per D-13, D-14, D-15: Routines fire at cron intervals and run a mode
 * (Assess or Revive) automatically. Results are posted to engagement history.
 * Routines are stored in Paperclip's routines table (per D-16).
 */
export interface ScheduledRoutine {
  /** Unique identifier for this routine (UUID) */
  id: string;

  /** Human-readable name for this routine (e.g., "Quarterly Drift Review") */
  name: string;

  /** Which mode to run when this routine triggers (Assess or Revive) */
  mode: "Assess" | "Revive";

  /** 5-field cron expression (min hour day month day-of-week) */
  cron: string;

  /** ISO 8601 timestamp of last execution (null if never run) */
  last_run_at: string | null;

  /** Array of Finding IDs from the last execution (empty if never run) */
  last_finding_ids: string[];

  /** ISO 8601 timestamp when routine was created */
  created_at: string;
}

/**
 * EngagementHistory — complete engagement state for a single company.
 *
 * Per D-01, D-02: Single per-company document stored in Paperclip's documents table
 * with key `compass-engagement-history`. Immutable schema version; findings are
 * append-only; routines are stored for scheduled execution.
 *
 * Document body is JSON-formatted markdown: JSON section in a fenced code block
 * plus human-readable rendering of recent findings underneath.
 */
export interface EngagementHistory {
  /** Schema version for migrations (currently 1) */
  version: 1;

  /** Company ID this history belongs to */
  company_id: string;

  /** ISO 8601 timestamp of most recent engagement (mode Apply) */
  last_engaged_at: string;

  /** Append-only array of all findings across all Apply runs */
  findings: Finding[];

  /** Active scheduled routines for this company */
  routines: ScheduledRoutine[];
}
