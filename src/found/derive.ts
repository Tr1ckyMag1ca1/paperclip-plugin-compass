/**
 * Derive Functions for Found Mode
 *
 * Pure functions that compute VISION template slots from interview answers.
 * No I/O, no side effects, fully deterministic and unit-testable per XC-08.
 *
 * Per D-07: each function takes InterviewAnswers, returns string.
 * Functions aggregate multiple answer fields into a single derived slot value.
 */

import type { InterviewAnswers } from "../types/found.js";

/**
 * Derive the Principles slot from interview answers.
 *
 * Aggregates voice, core-principles, and red-lines into 3-5 bullet-pointed principles.
 * Returns markdown-formatted bullet list.
 *
 * @param answers Interview answers from all sections
 * @returns Markdown-formatted principles (bullet list)
 */
export function derivePrinciples(answers: InterviewAnswers): string {
  const principles: string[] = [];

  // Parse core-principles from vision-and-identity section
  const corePrinciples = answers["core-principles"] || "";
  if (corePrinciples.trim()) {
    // If principles are already comma or newline separated, split and clean
    const lines = corePrinciples.split(/[\n,;]/).map((p) => p.trim());
    principles.push(...lines.filter((p) => p.length > 0));
  }

  // Extract key insights from voice (add as implicit principle)
  const voice = answers["company-voice"] || "";
  if (voice.trim()) {
    // Add voice as a summary principle if not already covered
    // E.g., "Bold and transparent" → principle about communication style
    if (!principles.some((p) => p.toLowerCase().includes("voice"))) {
      principles.push(`${voice}-first culture`);
    }
  }

  // Extract red-lines as implicit principles
  const redLines = answers["red-lines"] || "";
  if (redLines.trim()) {
    // Add as negative principle (what we'll never do)
    principles.push(`Never: ${redLines}`);
  }

  // Deduplicate and limit to 5
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const p of principles) {
    if (!seen.has(p)) {
      seen.add(p);
      unique.push(p);
    }
  }
  const final = unique.slice(0, 5);

  // Format as markdown bullet list
  if (final.length === 0) {
    return ""; // No principles provided
  }

  return final.map((p) => `- ${p}`).join("\n");
}

/**
 * Derive the 12-Month Goal slot from interview answers.
 *
 * Combines revenue target, customer count, and growth timeline into a single
 * time-bound, measurable goal statement.
 *
 * @param answers Interview answers from all sections
 * @returns Single sentence, time-bound 12-month goal
 */
export function derive12MonthGoal(answers: InterviewAnswers): string {
  const revenueTarget = answers["revenue-target"] || "";
  const customerCountTarget = answers["customer-count-target"] || "";
  const growthTarget = answers["monthly-growth-target"] || "";

  const parts: string[] = [];

  if (revenueTarget.trim()) {
    parts.push(`reach ${revenueTarget}`);
  }

  if (customerCountTarget.trim()) {
    if (parts.length > 0) {
      parts[parts.length - 1] += ` with ${customerCountTarget}`;
    } else {
      parts.push(`acquire ${customerCountTarget}`);
    }
  }

  if (growthTarget.trim() && !parts.join("").toLowerCase().includes(growthTarget.toLowerCase())) {
    parts.push(`growing at ${growthTarget}`);
  }

  if (parts.length === 0) {
    return ""; // No targets provided
  }

  const goal = parts.join(" and ");
  // Capitalize and add timeline
  return `${goal.charAt(0).toUpperCase() + goal.slice(1)} by end of 2026.`;
}

/**
 * Derive the Success Criteria slot from interview answers.
 *
 * Computes 2-3 concrete, measurable success criteria from long-term vision
 * and financial targets.
 *
 * @param answers Interview answers from all sections
 * @returns Markdown-formatted list of success criteria
 */
export function deriveSuccessCriteria(answers: InterviewAnswers): string {
  const criteria: string[] = [];

  // From long-term vision: metric-driven success
  const longTermVision = answers["long-term-vision"] || "";
  const successDefinition = answers["success-definition"] || "";
  const revenueTarget = answers["revenue-target"] || "";

  // Extract revenue as first criterion
  if (revenueTarget.trim()) {
    const rev = revenueTarget.trim();
    criteria.push(`Reach ${rev} in annual recurring revenue`);
  }

  // Extract customer scale from answers
  const customerCount = answers["customer-count-target"] || "";
  if (customerCount.trim()) {
    criteria.push(`Serve ${customerCount.trim()}`);
  }

  // Extract market position or impact from long-term vision
  if (longTermVision.includes("top") || longTermVision.includes("leader") || longTermVision.includes("#1")) {
    criteria.push("Establish market leadership or top 3 position");
  } else if (successDefinition.trim()) {
    // Use custom success definition if available
    const success = successDefinition.trim();
    if (success.length < 100) {
      criteria.push(success);
    } else {
      // Truncate long success definitions to first sentence
      const firstSentence = success.split(/[.!?]/)[0];
      if (firstSentence.length > 0) {
        criteria.push(firstSentence.trim());
      }
    }
  }

  if (criteria.length === 0) {
    return ""; // No success criteria derived
  }

  // Ensure at least 2 criteria
  if (criteria.length === 1 && successDefinition.trim()) {
    criteria.push("Build a healthy, sustainable company culture");
  }

  // Format as markdown bullet list
  return criteria.slice(0, 4).map((c) => `- ${c}`).join("\n");
}

/**
 * Derive the Amendment Protocol slot.
 *
 * Per D-05 and vision-quest standard, returns fixed-text amendment protocol
 * if founder hasn't provided custom protocol. Default: NO — changes require
 * dated changelog and founder approval.
 *
 * @param answers Optional interview answers (unused in v1)
 * @returns Amendment protocol markdown text
 */
export function deriveAmendmentProtocol(answers?: InterviewAnswers): string {
  // V1: Always return default protocol. Future versions can check for custom protocol in answers.
  return `## How This Gets Updated

**Default rule: NO.**

Changes to this document require:
1. Dated changelog entry (month/year minimum)
2. Explicit founder approval
3. CEO may request a full re-interview if material changes proposed

Amend only when there is genuine strategic shift — not for incremental progress updates.`;
}

/**
 * Derive the Operating Philosophy slot from interview answers.
 *
 * Combines CEO autonomy scope, decision-making style, and cultural principles
 * into a cohesive operating philosophy statement.
 *
 * @param answers Interview answers from all sections
 * @returns Operating philosophy markdown (1-3 sentences)
 */
export function deriveOperatingPhilosophy(answers: InterviewAnswers): string {
  const ceoDecisions = answers["ceo-mandate-decisions"] || "";
  const approvalDecisions = answers["approval-decisions"] || "";
  const decisionStyle = answers["decision-making-style"] || "";
  const operatingStyle = answers["operating-philosophy"] || "";

  const parts: string[] = [];

  // Core CEO autonomy statement
  if (ceoDecisions.trim()) {
    const scope = ceoDecisions.split("\n")[0].toLowerCase();
    parts.push(`The CEO has full autonomy over ${scope}.`);
  }

  // Approval boundaries
  if (approvalDecisions.trim()) {
    const approvals = approvalDecisions.split("\n")[0].toLowerCase();
    parts.push(`Decisions requiring founder approval include ${approvals}.`);
  }

  // Decision-making approach
  if (decisionStyle.trim()) {
    parts.push(`We make decisions ${decisionStyle.toLowerCase()}.`);
  } else if (operatingStyle.trim()) {
    // Fall back to general operating style
    parts.push(`${operatingStyle}`);
  }

  if (parts.length === 0) {
    return ""; // No operating philosophy provided
  }

  return parts.join(" ");
}
