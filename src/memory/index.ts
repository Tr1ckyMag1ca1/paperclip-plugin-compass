/**
 * Memory Module Public API
 *
 * Re-exports all memory types and functions for clean imports.
 * Per D-04, memory module provides:
 * - Memory domain types (Finding, ScheduledRoutine, EngagementHistory)
 * - History store (read/write + caching)
 * - Finding lifecycle management (status transitions, dedup)
 * - Cron utilities (parsing, validation, human-readable)
 */

export type { Finding, ScheduledRoutine, EngagementHistory, FindingStatus, StatusTransition, Mode } from "../types/memory.js";

export {
  getEngagementHistory,
  createEngagementHistory,
  updateEngagementHistory,
  recordFindingsToHistory,
} from "./history-store.js";

export {
  createFinding,
  transitionStatus,
  deduplicateAgainstOpenFindings,
  filterByStatus,
  filterByMode,
  filterByDateRange,
} from "./finding.js";

export {
  validateCronExpression,
  parseCronExpression,
  createRoutine,
  validateRoutineSchedule,
  shouldRunRoutine,
} from "./routine.js";

export { cronToReadable } from "./cron-readable.js";
