/**
 * Shift Classification with Deterministic Keyword Heuristics
 *
 * Per D-01, maps founder-described strategic shift to affected VISION sections.
 * Pure function: no LLM, no I/O, fully deterministic, unit-testable.
 *
 * Keyword groups (inline documentation for audit):
 * - rebrand → voice + product-direction + target-customer
 * - pivot → target-customer + mission + principles
 * - scale → growth-strategy + revenue-model + success-criteria
 * - tighten → principles + red-lines + voice
 * - compliance / regulatory → principles + mandate + red-lines
 * - enterprise / B2B → target-customer + revenue-model + sales-model
 * - SMB / small-business → target-customer + revenue-model + success-criteria
 * - governance → principles + mandate + amendment-protocol
 *
 * Confidence threshold (D-02): 0.4 (lower than Assess drift 0.5, because founder
 * explicit shift intent should err toward inclusion; founder can override).
 */

import type { ParsedVision } from "../types/assess.js";
import type { ShiftScope, VisionSectionId } from "../types/reposition.js";

/**
 * Classify shift intent into affected VISION sections using keyword heuristics.
 *
 * Per D-01: Pure function, deterministic, no LLM.
 * Maps shift description keywords to section IDs.
 *
 * @param description Founder's free-text shift intent (e.g., "rebrand to focus on compliance")
 * @param _currentVision ParsedVision (unused but included for consistency with detectDrift signature)
 * @returns ShiftScope with affectedSections, confidence, and rationale
 */
export function classifyShift(description: string, _currentVision: ParsedVision): ShiftScope {
  if (!description || description.trim().length === 0) {
    return {
      affectedSections: [],
      confidence: 0,
      rationale: "No shift intent provided",
    };
  }

  const normalized = description.toLowerCase();
  const affectedSections = new Set<VisionSectionId>();
  const detectedKeywords: string[] = [];

  // Define keyword groups with section mappings
  // Note: section IDs use underscores (not hyphens) to match ParsedVision keys
  const keywordGroups: Record<string, VisionSectionId[]> = {
    // Rebrand shift: focus on voice, visual identity, positioning
    rebrand: ["voice", "product_direction", "target_customer"],
    "brand-refresh": ["voice", "product_direction"],
    "reposition-brand": ["voice", "product_direction", "target_customer"],
    "visual-identity": ["voice"],
    "brand-voice": ["voice"],
    "tone-shift": ["voice"],

    // Pivot shift: change target customer, mission, or principles
    pivot: ["target_customer", "mission", "principles"],
    "narrow-focus": ["target_customer", "mission"],
    "expand-target": ["target_customer", "revenue_model", "success_criteria"],
    "change-customer": ["target_customer", "mission", "revenue_model"],
    "customer-shift": ["target_customer", "mission"],
    "market-shift": ["target_customer", "revenue_model"],

    // Scale shift: increase revenue, growth strategy, success criteria
    scale: ["growth_strategy", "revenue_model", "success_criteria"],
    "scale-up": ["growth_strategy", "revenue_model"],
    "grow-revenue": ["revenue_model", "success_criteria"],
    "growth-acceleration": ["growth_strategy", "success_criteria"],
    "expand-globally": ["growth_strategy", "target_customer"],

    // Tighten shift: strengthen governance, principles
    tighten: ["principles", "voice"],
    "strengthen-governance": ["principles", "mandate", "trust_governance"],
    "governance-tighten": ["principles", "mandate"],
    "risk-mitigation": ["principles"],
    "compliance-focus": ["principles", "mandate", "trust_governance"],

    // Compliance and regulatory
    compliance: ["principles", "mandate", "trust_governance"],
    regulatory: ["principles", "mandate"],
    "government-work": ["target_customer", "revenue_model"],
    enterprise: ["target_customer", "revenue_model", "success_criteria"],
    "b2b-focus": ["target_customer", "revenue_model", "sales_model"],
    "b2c-pivot": ["target_customer", "revenue_model", "success_criteria"],

    // Business model changes
    "subscription-model": ["revenue_model", "success_criteria"],
    "freemium-model": ["revenue_model", "growth_strategy"],
    "licensing-model": ["revenue_model", "sales_model"],
    marketplace: ["target_customer", "revenue_model", "sales_model"],

    // Governance and structure
    governance: ["principles", "mandate", "trust_governance"],
    "approval-process": ["trust_governance"],
    "decision-making": ["principles", "mandate"],
    transparency: ["principles", "voice"],

    // Industry/vertical shifts
    vertical: ["target_customer", "mission"],
    "vertical-focus": ["target_customer", "mission"],
    "industry-focus": ["target_customer", "revenue_model"],
    niche: ["target_customer", "mission"],

    // Messaging and positioning
    messaging: ["voice", "product_direction"],
    positioning: ["voice", "product_direction", "target_customer"],
    "value-prop": ["product_direction", "target_customer"],
    differentiation: ["voice", "product_direction"],

    // Operations and culture
    culture: ["principles", "voice"],
    "operating-philosophy": ["principles", "mandate"],
    values: ["principles", "voice"],
    ethics: ["principles"],
    sustainability: ["principles", "mission"],

    // Aggressive or defensive
    acquisition: ["growth_strategy", "revenue_model"],
    consolidation: ["growth_strategy"],
    divestiture: ["growth_strategy", "mission"],
    shutdown: ["mission"],
    exit: ["success_criteria", "mission"],
  };

  // Check for each keyword in the description
  for (const [keyword, sections] of Object.entries(keywordGroups)) {
    if (normalized.includes(keyword)) {
      detectedKeywords.push(keyword);
      sections.forEach((s) => affectedSections.add(s));
    }
  }

  // Calculate confidence based on number of detected keywords
  // More keywords = higher confidence that this is a real shift intent
  let confidence: number;
  const detectedCount = detectedKeywords.length;

  if (detectedCount === 0) {
    confidence = 0;
  } else if (detectedCount === 1) {
    confidence = 0.4; // Single keyword: borderline confidence
  } else if (detectedCount === 2) {
    confidence = 0.6; // Two keywords: moderate confidence
  } else if (detectedCount === 3) {
    confidence = 0.75; // Three keywords: good confidence
  } else if (detectedCount >= 4) {
    confidence = 0.85; // Four+ keywords: high confidence
  } else {
    confidence = 0;
  }

  // Round to 2 decimals
  confidence = Math.round(confidence * 100) / 100;

  const affectedArray = Array.from(affectedSections).sort() as VisionSectionId[];

  return {
    affectedSections: affectedArray,
    confidence,
    rationale:
      detectedKeywords.length > 0
        ? `Detected keywords: ${detectedKeywords.join(", ")} → ${affectedArray.join(", ")}`
        : "No recognized shift keywords found",
  };
}

/**
 * Validate that shift intent meets minimum requirements.
 *
 * Per D-02 (UI-SPEC), minimum length is 20 characters for actionable intent.
 *
 * @param intent Founder's shift intent text
 * @returns True if intent is actionable (>= 20 chars trimmed), false otherwise
 */
export function isValidShiftIntent(intent: string): boolean {
  return intent.trim().length >= 20;
}
