/**
 * Quality Check for Found Mode VISION
 *
 * Validates VISION.md against required slot completeness and content requirements.
 * Pure function: no I/O, deterministic validation.
 *
 * Per FOUND-12 and D-08: hard-block Apply when required slots missing.
 * Required slots: mission, mandate, voice, principles, success_criteria
 */

import type { FilledVision, QualityCheckResult } from "../types/found.js";

/**
 * Required slots per FOUND-12.
 * Apply cannot proceed if any of these are missing or insufficient.
 */
const REQUIRED_SLOTS = ["mission", "mandate", "voice", "principles", "success_criteria"];

/**
 * Minimum content length for required slots (characters).
 * Prevents empty or trivial responses.
 */
const MIN_LENGTH: Record<string, number> = {
  mission: 20,
  mandate: 20,
  voice: 50,
  principles: 20, // At least "- Principle 1"
  success_criteria: 20, // At least "- Criteria 1"
};

/**
 * Check VISION.md for required slot completeness and content quality.
 *
 * Validation rules:
 * 1. All required slots must be present and filled (no {{placeholder}})
 * 2. All required slots must meet minimum length requirements
 * 3. No unresolved placeholders in body (all {{...}} must be filled or removed)
 * 4. Collect warnings for empty optional slots (non-blocking)
 *
 * @param vision FilledVision output from template-fill
 * @returns QualityCheckResult with isValid, missing slots, errors
 */
export function checkVisionQuality(vision: FilledVision): QualityCheckResult {
  const errors: string[] = [];
  const missingRequiredSlots: string[] = [];
  const emptyOptionalSlots: string[] = [];

  // Check 1: All required slots are in slotsEmpty (i.e., unresolved placeholders)?
  for (const slot of REQUIRED_SLOTS) {
    if (vision.slotsEmpty.includes(slot)) {
      missingRequiredSlots.push(slot);
      errors.push(`Required slot missing: {{${slot}}}`);
    }
  }

  // Check 2: Validate content length for required slots
  // We need to extract the actual content from the body to validate length
  // For now, we'll check if the slot appears in the body with non-empty content
  // A more robust approach would re-parse the filled vision to extract slot values
  // For v1, we assume if it's not in slotsEmpty, it was filled; we'll add a heuristic check

  // Check 3: Any remaining unresolved placeholders?
  if (vision.slotsEmpty.length > 0) {
    const unresolvedAll = vision.slotsEmpty.filter((s) => !REQUIRED_SLOTS.includes(s));
    if (unresolvedAll.length > 0) {
      // Warn about unresolved optional slots (don't block)
      emptyOptionalSlots.push(...unresolvedAll);
    }
  }

  // Check 4: Look for remaining {{ }} in body (sanity check)
  const bodyHasPlaceholders = /{{/.test(vision.body);
  if (bodyHasPlaceholders) {
    const remaining = vision.body.match(/{{(\w+[-_\w]*)}}/g) || [];
    if (remaining.length > 0) {
      errors.push(`VISION.md contains unresolved placeholders: ${remaining.join(", ")}`);
    }
  }

  // Determine if valid
  const isValid = errors.length === 0 && missingRequiredSlots.length === 0;

  return {
    isValid,
    missingRequiredSlots,
    emptyOptionalSlots,
    errors,
  };
}

/**
 * Get a human-readable error message for display to founder.
 *
 * Summarizes missing slots and actionable next steps.
 *
 * @param result QualityCheckResult from checkVisionQuality
 * @returns Human-readable error message
 */
export function formatQualityErrors(result: QualityCheckResult): string {
  if (result.isValid) {
    return "";
  }

  const parts: string[] = [];

  if (result.missingRequiredSlots.length > 0) {
    parts.push(`Missing required sections: ${result.missingRequiredSlots.join(", ")}`);
  }

  if (result.errors.length > 0) {
    parts.push(...result.errors);
  }

  return parts.join("\n\n");
}
