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
 * Aggregates voice, red-lines, and company culture into 3-5 bullet-pointed principles.
 * Returns markdown-formatted bullet list.
 *
 * @param answers Interview answers from all sections
 * @returns Markdown-formatted principles (bullet list)
 */
export function derivePrinciples(answers: InterviewAnswers): string {
  const principles: string[] = [];

  // Extract voice from brand-voice field
  const voice = answers["brand-voice"] || "";
  if (voice.trim()) {
    principles.push(voice.trim());
  }

  // Extract culture principle from company-culture field
  const culture = answers["company-culture"] || "";
  if (culture.trim()) {
    principles.push(culture.trim());
  }

  // Extract red-lines as implicit principle (what we'll never do)
  const redLines = answers["red-lines"] || "";
  if (redLines.trim()) {
    principles.push(`Never: ${redLines}`);
  }

  // Add any additional core principles if present
  const corePrinciples = answers["core-principles"] || "";
  if (corePrinciples.trim()) {
    const lines = corePrinciples.split(/[\n,;]/).map((p) => p.trim());
    principles.push(...lines.filter((p) => p.length > 0));
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
 * Combines revenue target, customer count into a single
 * time-bound, measurable goal statement.
 *
 * @param answers Interview answers from all sections
 * @returns Single sentence, time-bound 12-month goal
 */
export function derive12MonthGoal(answers: InterviewAnswers): string {
  const revenueTarget = answers["target-revenue-12mo"] || "";
  const customerCountTarget = answers["customer-count-target"] || "";

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

  if (parts.length === 0) {
    return ""; // No targets provided
  }

  const goal = parts.join(" and ");
  // Capitalize and add timeline (current year + 1) with explicit "12 months"
  const nextYear = new Date().getFullYear() + 1;
  return `${goal.charAt(0).toUpperCase() + goal.slice(1)} over the next 12 months, by end of ${nextYear}.`;
}

/**
 * Derive the Success Criteria slot from interview answers.
 *
 * Computes 4-6 concrete, measurable success criteria from long-term vision
 * and financial targets.
 *
 * @param answers Interview answers from all sections
 * @returns Markdown-formatted list of success criteria
 */
export function deriveSuccessCriteria(answers: InterviewAnswers): string {
  // Long-term vision is required to derive success criteria
  const longTermVision = answers["long-term-vision"] || "";
  if (!longTermVision.trim()) {
    return ""; // Cannot derive without vision
  }

  const criteria: string[] = [];

  const revenueTarget = answers["target-revenue-12mo"] || "";
  const customerCount = answers["customer-count-target"] || "";
  const northStar = answers["north-star-metric"] || "";
  const successStory = answers["success-story"] || "";

  // Extract revenue as first criterion
  if (revenueTarget.trim()) {
    const rev = revenueTarget.trim();
    criteria.push(`Reach ${rev} in annual recurring revenue`);
  }

  // Extract customer scale from answers
  if (customerCount.trim()) {
    criteria.push(`Serve ${customerCount.trim()} customers`);
  }

  // Extract market position or impact from long-term vision
  if (longTermVision.includes("leading") || longTermVision.includes("leader") || longTermVision.includes("#1") || longTermVision.includes("top")) {
    criteria.push("Establish market leadership position");
  }

  // Add north-star metric as criterion
  if (northStar.trim()) {
    criteria.push(`Reach ${northStar.toLowerCase()} targets`);
  }

  // Add success story aspiration
  if (successStory.trim()) {
    criteria.push(successStory.trim());
  }

  // Add cultural/operational criterion
  criteria.push("Build a healthy, sustainable company culture");

  if (criteria.length === 0) {
    return ""; // No success criteria derived
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const c of criteria) {
    if (!seen.has(c)) {
      seen.add(c);
      unique.push(c);
    }
  }

  // Format as markdown bullet list, limit to 6
  return unique.slice(0, 6).map((c) => `- ${c}`).join("\n");
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

/**
 * Derive the Mandate Statement from interview answers.
 *
 * Combines mission + target-market into a single compelling mandate sentence.
 * Example: "Make AI accessible to everyone for SMBs and startups."
 *
 * @param answers Interview answers from all sections
 * @returns Single sentence combining mission and target market
 */
export function deriveMandateStatement(answers: InterviewAnswers): string {
  const mission = answers["mission"] || "";
  const targetMarket = answers["target-market"] || "";

  if (!mission.trim() || !targetMarket.trim()) {
    return ""; // Both required
  }

  // Build mandate: "mission for target-market"
  const missionTrimmed = mission.trim();
  const marketTrimmed = targetMarket.trim();

  // Choose preposition based on mission structure
  const missionLower = missionTrimmed.toLowerCase();
  let preposition = "for";
  if (missionLower.startsWith("be") || missionLower.startsWith("become")) {
    preposition = "as the";
  } else if (missionLower.includes("serve") || missionLower.includes("provide")) {
    preposition = "to";
  }

  // Format: use mission and market as-is (preserve case), add preposition
  return `${missionTrimmed} ${preposition} ${marketTrimmed}.`;
}

/**
 * Derive the Competitive Advantage statement from interview answers.
 *
 * Combines technology-moat + core-features into a concise competitive advantage statement.
 * Example: "Speed and ease, powered by proprietary fine-tuning pipeline."
 *
 * @param answers Interview answers from all sections
 * @returns 1-2 sentence competitive advantage statement
 */
export function deriveCompetitiveAdvantage(answers: InterviewAnswers): string {
  const moat = answers["technology-moat"] || "";
  const advantage = answers["competitive-advantage"] || "";

  if (!moat.trim()) {
    return ""; // Moat required
  }

  // If both moat and explicit advantage are provided, combine them
  if (advantage.trim()) {
    const combined = `${advantage.trim()}, powered by ${moat.trim()}`;
    // Ensure it ends with punctuation
    if (!combined.endsWith(".") && !combined.endsWith("!") && !combined.endsWith("?")) {
      return `${combined}.`;
    }
    return combined;
  }

  // Otherwise just return moat with punctuation
  const moatTrimmed = moat.trim();
  if (!moatTrimmed.endsWith(".") && !moatTrimmed.endsWith("!") && !moatTrimmed.endsWith("?")) {
    return `${moatTrimmed}.`;
  }
  return moatTrimmed;
}

/**
 * Derive the Market Opportunity statement from interview answers.
 *
 * Extracts TAM (Total Addressable Market) from market-size answer.
 * Example: "$20B TAM in content creation and AI tooling"
 *
 * @param answers Interview answers from all sections
 * @returns Market opportunity statement with TAM
 */
export function deriveMarketOpportunity(answers: InterviewAnswers): string {
  const marketSize = answers["market-size"] || "";

  if (!marketSize.trim()) {
    return ""; // Market size required
  }

  const size = marketSize.trim();

  // If already contains "TAM", return as-is
  if (size.toUpperCase().includes("TAM")) {
    return size;
  }

  // Otherwise, wrap with TAM context
  return `TAM: ${size}`;
}
