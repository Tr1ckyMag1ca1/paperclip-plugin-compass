/**
 * Reposition Mode Exports
 *
 * Barrel export aggregating all Phase 5 service modules and types.
 * Wave 1 (pure functions): shift-classify, scope-filter, seed-answers
 * Wave 2 (orchestrators): amend, cascade, apply
 */

// Type exports
export type { ShiftScope, RepositionRunState, Amendment, RepositionRunResult, VisionSectionId } from "../types/reposition.js";

// Wave 1: Pure function services
export { classifyShift, isValidShiftIntent } from "./shift-classify.js";
export { filterInterviewToScope } from "./scope-filter.js";
export { getSectionAnswerSeed } from "./seed-answers.js";

// Wave 2: Orchestrators
export { generateAmendments, isValidAmendmentList } from "./amend.js";
export { planRepositionCascade, executeRepositionCascade } from "./cascade.js";
export { applyRepositionAmendments, type ApplyResult } from "./apply.js";

// Idempotency extension (exported from found, re-exported for convenience)
export { generateRepositionIdempotencyKey, isValidRepositionIdempotencyKey } from "../found/idempotency.js";

// Re-export Phase 3 cascade types for convenience
export type { CascadePlan, CascadeResult } from "../assess/cascade.js";
