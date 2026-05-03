/**
 * Amendment Generation Orchestrator for Reposition Mode
 *
 * Per D-07, D-08: Orchestrates scoped interview answers into per-section VISION amendments.
 * Reuses Phase 2 derive functions, template-fill, and quality-check machinery.
 *
 * Process:
 * 1. Load current VISION (provided as parameter)
 * 2. Run derive functions on new answers
 * 3. Fill template with answers + derived slots
 * 4. Quality check (all required slots filled)
 * 5. Diff current vs filled per affected section
 * 6. Return per-section Amendment list
 *
 * Pure function: no I/O, no state mutations, deterministic output.
 */

import type { InterviewAnswers } from "../types/found.js";
import type { ParsedVision } from "../types/assess.js";
import type { Amendment, VisionSectionId } from "../types/reposition.js";
import { fillVisionTemplate } from "../found/template-fill.js";
import { checkVisionQuality } from "../found/quality-check.js";
import {
  derivePrinciples,
  derive12MonthGoal,
  deriveSuccessCriteria,
  deriveAmendmentProtocol,
  deriveOperatingPhilosophy,
  deriveMandateStatement,
  deriveCompetitiveAdvantage,
  deriveMarketOpportunity,
} from "../found/derive.js";
import type { FilledVision } from "../types/found.js";
import { parseVision } from "../assess/vision-parse.js";

/**
 * Generate scoped amendments from reposition interview answers.
 *
 * Per D-07, D-08: Orchestrates seed → interview → derive → template-fill → quality-check → diff.
 *
 * @param currentVision ParsedVision object (current state of VISION.md)
 * @param interviewAnswers Founder's scoped interview responses
 * @param affectedSections Vision section IDs to amend (subset of all 6 sections)
 * @returns Promise<Amendment[]> per affected section
 * @throws Error if quality check fails or inputs invalid
 */
export async function generateAmendments(
  currentVision: ParsedVision,
  interviewAnswers: InterviewAnswers,
  affectedSections: VisionSectionId[]
): Promise<Amendment[]> {
  // Validate inputs
  if (!currentVision) {
    throw new Error("No current VISION found");
  }

  if (!interviewAnswers || Object.keys(interviewAnswers).length === 0) {
    throw new Error("No interview answers provided");
  }

  if (!affectedSections || affectedSections.length === 0) {
    return []; // No affected sections = no amendments
  }

  // Step 1: Run derive functions on new answers
  // (These are the same derive functions used in Found mode)
  const principles = derivePrinciples(interviewAnswers);
  const goal12mo = derive12MonthGoal(interviewAnswers);
  const successCriteria = deriveSuccessCriteria(interviewAnswers);
  const amendmentProtocol = deriveAmendmentProtocol();
  const operatingPhilosophy = deriveOperatingPhilosophy(interviewAnswers);
  const mandateStatement = deriveMandateStatement(interviewAnswers);
  const competitiveAdvantage = deriveCompetitiveAdvantage(interviewAnswers);
  const marketOpportunity = deriveMarketOpportunity(interviewAnswers);

  // Step 2: Combine interview answers with derived values
  // Note: fillVisionTemplate will re-derive these values, so we just pass
  // the raw answers. The derive functions are called to compute intermediate values
  // for reference, but fillVisionTemplate will call them again internally.

  // Step 3: Fill template with answers
  // fillVisionTemplate internally calls all derive functions again
  const filledVision = fillVisionTemplate(interviewAnswers);

  // Step 4: Quality check (all required slots must be filled)
  const qualityCheck = checkVisionQuality(filledVision);
  if (!qualityCheck.isValid) {
    const missingSlots = (qualityCheck as any).missingRequiredSlots || [];
    throw new Error(
      `Quality check failed: missing required slots: ${missingSlots.join(", ")}`
    );
  }

  // Step 5: Parse filled vision and diff against current per affected section
  // We need to convert the markdown back to a ParsedVision structure
  const parsedNewVision = await parseVision(filledVision.body);

  // Step 6: Create amendments for each affected section
  const amendments: Amendment[] = [];

  for (const sectionId of affectedSections) {
    const currentContent = (currentVision[sectionId] as string) || "";
    const newContent = (parsedNewVision[sectionId] as string) || "";

    // Only include if content actually changed
    if (currentContent !== newContent) {
      amendments.push({
        section: sectionId,
        currentContent,
        proposedContent: newContent,
        reason: `Repositioning: updated ${sectionId} per founder shift intent`,
      });
    }
  }

  return amendments;
}

/**
 * Check if amendment list is non-empty and valid.
 *
 * Useful for preflight validation before applying amendments.
 *
 * @param amendments Amendment list
 * @returns true if non-empty and each amendment has required fields
 */
export function isValidAmendmentList(amendments: Amendment[]): boolean {
  if (!Array.isArray(amendments) || amendments.length === 0) {
    return false;
  }

  return amendments.every(
    (a) =>
      a.section &&
      typeof a.currentContent === "string" &&
      typeof a.proposedContent === "string" &&
      a.reason &&
      typeof a.reason === "string"
  );
}
