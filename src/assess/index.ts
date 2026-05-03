/**
 * Assess Mode Public API
 *
 * Re-exports all assess types and functions for clean imports.
 * Per D-05, assess module provides pure-function primitives for drift detection:
 * parsing VISION.md, building activity snapshots, detecting drift with confidence
 * scoring, and formatting amendments with dated changelog.
 */

export type {
  ActivityItem,
  ActivitySnapshot,
  ActivityQueryOptions,
  ParsedVision,
  AmendmentLogEntry,
  DriftItem,
  DriftReport,
  ConfidenceScoring,
  ApprovalPayload,
  Approval,
} from "../types/assess.js";

export { parseVision, serializeVision } from "./vision-parse.js";
export { buildActivitySnapshot } from "./activity.js";
export { detectDrift } from "./drift.js";
export { formatAmendment, formatChangelog, applyAmendmentToVision } from "./amendment.js";
