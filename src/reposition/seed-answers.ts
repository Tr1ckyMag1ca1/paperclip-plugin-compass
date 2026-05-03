/**
 * Answer Seeding from Current VISION
 *
 * Per D-06: pre-fills interview questions with current VISION values.
 * Founder edits existing values, doesn't start from blank.
 * Pure function: no I/O, deterministic, fully testable.
 *
 * Maps each VISION section to interview question IDs for that section.
 * Example: vision.voice → answers["company-voice"] (from Vision & Identity interview)
 */

import type { ParsedVision } from "../types/assess.js";
import type { InterviewAnswers } from "../types/found.js";
import type { VisionSectionId } from "../types/reposition.js";

/**
 * Extract current VISION section values as interview answer seeds.
 *
 * Per D-06: Pre-fill interview questions with current values where possible.
 * Founder edits, doesn't restart from blank.
 *
 * Mapping: each VISION section → interview section → map fields.
 * Example: voice section → company-voice question
 *
 * @param vision ParsedVision object (from parseVision)
 * @param sectionId VisionSectionId to extract (e.g., "voice", "target-customer")
 * @returns Partial InterviewAnswers for that section (only relevant question fields)
 */
export function getSectionAnswerSeed(
  vision: ParsedVision | null | undefined,
  sectionId: VisionSectionId
): Partial<InterviewAnswers> {
  // Null-safe: if vision is null/undefined, return empty
  if (!vision) {
    return {};
  }

  const seeds: Partial<InterviewAnswers> = {};

  // Map each VISION section to its corresponding interview question fields
  // Field names come from src/content/interview/*.md question IDs

  switch (sectionId) {
    case "mission":
      // Big Picture section: mission question
      if (vision.mission && vision.mission.trim()) {
        seeds["mission"] = vision.mission;
      }
      break;

    case "mandate":
      // This is a founder-level directive; no direct interview question maps to it
      // But it could inform the core-principles or operating-philosophy
      if (vision.mandate && vision.mandate.trim()) {
        // Store as a note for context, but don't force-fill a specific question
        // (mandate is editorial, not interview-sourced)
      }
      break;

    case "voice":
      // Vision & Identity section: company-voice question
      if (vision.voice && vision.voice.trim()) {
        seeds["company-voice"] = vision.voice;
      }
      break;

    case "principles":
      // Vision & Identity section: core-principles question
      if (vision.principles && vision.principles.trim()) {
        seeds["core-principles"] = vision.principles;
      }
      break;

    case "success_criteria_12mo":
      // Success metrics are not directly re-interviewed in scoped mode
      // (they're long-term vision, not shift-driven)
      // But we could seed success-definition if it's affected by a scale shift
      // For now, leave empty — founder will re-establish if needed
      break;

    case "vision_3year":
      // Big Picture section: long-term-vision question
      if (vision.vision_3year && vision.vision_3year.trim()) {
        seeds["long-term-vision"] = vision.vision_3year;
      }
      break;

    case "target_customer":
      // Revenue & Customers section: target-customer question
      if (vision.target_customer && vision.target_customer.trim()) {
        seeds["target-customer"] = vision.target_customer;
      }
      break;

    case "issue_structure":
      // This is operational/structural — no direct interview question
      // (would be re-interviewed in full Found mode only)
      break;

    case "locality":
      // Geographic/market focus — not directly re-interviewed in v1
      // (deferred: could be added to a "Market Scope" question in future)
      break;

    case "revenue_model":
      // Revenue & Customers section: revenue-model question
      if (vision.revenue_model && vision.revenue_model.trim()) {
        seeds["revenue-model"] = vision.revenue_model;
      }
      break;

    case "launch_plan":
      // Launch plan specifics (GTM, channels) — not directly re-interviewed in v1
      // (would be full Found mode only)
      break;

    case "trust_governance":
      // Governance and approval routing — informational, no interview re-question
      break;

    case "growth_strategy":
      // Growth & Marketing section: growth-strategy question
      if (vision.growth_strategy && vision.growth_strategy.trim()) {
        seeds["growth-strategy"] = vision.growth_strategy;
      }
      break;

    case "sales_model":
      // Revenue & Customers section: related to revenue model, could seed
      if (vision.sales_model && vision.sales_model.trim()) {
        // Sales model is more detailed than revenue model choice
        // Don't override revenue-model field; could add a custom field in future
      }
      break;

    case "product_direction":
      // Product Direction section: product-roadmap or vision-3yr-product question
      if (vision.product_direction && vision.product_direction.trim()) {
        seeds["product-vision"] = vision.product_direction;
      }
      break;

    case "org_structure":
      // Organizational structure — operational, not re-interviewed in scope
      break;

    case "operating_philosophy":
      // Vision & Identity section: operating-philosophy question
      if (vision.operating_philosophy && vision.operating_philosophy.trim()) {
        seeds["operating-philosophy"] = vision.operating_philosophy;
      }
      break;

    case "ceo_mandate":
      // CEO autonomy and decision rights — informational, no interview re-question
      break;

    case "success_criteria":
      // Long-term success definition, could inform success-definition question
      if (vision.success_criteria && vision.success_criteria.trim()) {
        seeds["success-definition"] = vision.success_criteria;
      }
      break;


    default:
      // Unknown section ID — return empty
      break;
  }

  return seeds;
}
