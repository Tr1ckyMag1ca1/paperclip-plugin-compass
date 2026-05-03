/**
 * Template Fill Function for Found Mode
 *
 * Fills VISION.md template with interview answers + derived slots.
 * Pure function: no I/O, no side effects, deterministic output.
 *
 * Per D-05 and D-06: Simple regex-based template rendering with zero dependencies.
 */

import type { InterviewAnswers, FilledVision } from "../types/found.js";
import {
  derivePrinciples,
  derive12MonthGoal,
  deriveSuccessCriteria,
  deriveAmendmentProtocol,
  deriveOperatingPhilosophy,
  deriveMandateStatement,
  deriveCompetitiveAdvantage,
  deriveMarketOpportunity,
} from "./derive.js";

// Import template via esbuild text loader (?raw query)
// esbuild will inline this at build time; tsc ignores the ?raw suffix
// @ts-ignore - ?raw imports are handled by esbuild, not TypeScript
import VISION_TEMPLATE from "../content/vision-template.md?raw" assert { type: "text" };

/**
 * Fill VISION.md template with interview answers and derived slots.
 *
 * Process:
 * 1. Compute derived slots via derive functions
 * 2. Combine direct answers + derived slots into slots object
 * 3. Replace all {{slot_name}} placeholders in template
 * 4. Detect any remaining unresolved placeholders
 * 5. Return FilledVision with body, slotsUsed, slotsEmpty
 *
 * @param answers Interview answers from all sections
 * @returns FilledVision with rendered markdown and slot metadata
 */
export function fillVisionTemplate(answers: InterviewAnswers): FilledVision {
  let body = VISION_TEMPLATE;

  // Compute derived slots
  const principles = derivePrinciples(answers);
  const goal12mo = derive12MonthGoal(answers);
  const successCriteria = deriveSuccessCriteria(answers);
  const amendmentProtocol = deriveAmendmentProtocol();
  const operatingPhilosophy = deriveOperatingPhilosophy(answers);
  const mandateStatement = deriveMandateStatement(answers);
  const competitiveAdvantage = deriveCompetitiveAdvantage(answers);
  const marketOpportunity = deriveMarketOpportunity(answers);

  // Build slots object: direct answers + derived slots
  const slots: Record<string, string> = {
    // From big-picture section
    mission: answers["mission"] || "",
    vision_3yr: answers["long-term-vision"] || "",

    // From revenue-and-customers section
    target_customer: answers["target-customer"] || "",
    revenue_model: answers["revenue-model"] || "",

    // From growth-and-marketing section
    growth_strategy:
      (answers["customer-acquisition"] ? `${answers["customer-acquisition"]}\n\nChannels: ${answers["growth-channels"]}` : "") || "",
    sales_model:
      (answers["competition"]
        ? `Main competitors: ${answers["competition"]}\n\nDifferentiation: ${answers["differentiation"]}`
        : answers["differentiation"]) || "",

    // From product-direction section
    product_direction:
      (answers["product-description"] ? `${answers["product-description"]}\n\n12-month priorities: ${answers["product-roadmap-12mo"]}` : "") ||
      "",

    // From ceo-autonomy section
    mandate: mandateStatement || answers["ceo-mandate-decisions"] || "",

    // From vision-and-identity section
    voice: answers["brand-voice"] || answers["company-voice"] || "",

    // Derived slots
    goal_12mo: goal12mo,
    principles: principles,
    success_criteria: successCriteria,
    operating_philosophy: operatingPhilosophy,
    amendment_protocol: amendmentProtocol,
    competitive_advantage: competitiveAdvantage,
    market_opportunity: marketOpportunity,

    // Optional/placeholder slots (may not be filled)
    company_name: answers["company-name"] || "[Company Name]",
    issue_structure: answers["issue-structure"] || "",
    locality: answers["locality"] || "",
    launch_plan: answers["launch-plan"] || "",
    trust_governance: answers["trust-governance"] || "",
    org_structure: answers["org-structure"] || "",
  };

  // Replace all {{slot_name}} placeholders
  // Regex matches {{word_characters_and_underscores}}
  Object.entries(slots).forEach(([key, value]) => {
    // Replace both snake_case and hyphenated versions (in case template uses either)
    const hyphenKey = key.replace(/_/g, "-");
    body = body.replace(new RegExp(`{{${key}}}`, "g"), value || "");
    if (hyphenKey !== key) {
      body = body.replace(new RegExp(`{{${hyphenKey}}}`, "g"), value || "");
    }
  });

  // Detect remaining unresolved placeholders
  const emptyMatches = body.match(/{{(\w+)}}/g) || [];
  const slotsEmpty = emptyMatches.map((m) => m.replace(/[{}]/g, ""));

  // Build slotsUsed from all entries (even empty ones represent attempted fills)
  const slotsUsed = Object.keys(slots);

  return {
    body,
    slotsUsed,
    slotsEmpty,
  };
}
