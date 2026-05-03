/**
 * Drift Detection with Confidence Scoring
 *
 * Per D-01, D-03, D-04: pure function that compares VISION.md sections against
 * recent company activity (issues, comments, documents) and detects misalignment.
 *
 * No LLM calls — all heuristic-based, fully deterministic, unit-testable.
 * Confidence scoring blends three signals: lexical overlap, semantic clustering,
 * and recency-weighted evidence. Threshold 0.5 filters items to surface-to-founder.
 */

import { randomUUID } from "node:crypto";
import type { ParsedVision, ActivitySnapshot, DriftReport, DriftItem } from "../types/assess.js";

/**
 * Detect drift between VISION.md and recent activity.
 *
 * Per D-01, D-03, D-04: Compares each VISION section against activity items
 * (issues, comments, documents) from the last N days. Calculates confidence
 * score per section using lexical, semantic, and recency signals.
 *
 * Items with confidence >= 0.5 surface to founder. Below 0.5 deferred (info severity).
 *
 * @param vision ParsedVision object (from parseVision)
 * @param activity ActivitySnapshot (from buildActivitySnapshot)
 * @param windowDays Number of days in activity window (for recency weighting)
 * @returns DriftReport with detected items, confidence scores, and metadata
 */
export function detectDrift(
  vision: ParsedVision,
  activity: ActivitySnapshot,
  windowDays: number = 30
): DriftReport {
  const runId = randomUUID();
  const generatedAt = new Date().toISOString();
  const confidenceThreshold = 0.5;

  // Collect all activity items
  const allItems = [...activity.issues, ...activity.comments, ...activity.documents];

  // Normalize activity content for matching (lowercase, remove punctuation)
  const normalizedItems = allItems.map((item) => ({
    ...item,
    normalizedContent: normalizeText(item.content),
  }));

  const detectedItems: DriftItem[] = [];
  let totalItemsDetected = 0;

  // For each VISION section, detect drift
  const sectionNames = Object.keys(vision).filter((k) => k !== "amendments") as Array<
    keyof ParsedVision
  >;

  for (const sectionName of sectionNames) {
    const sectionContent = vision[sectionName];
    if (typeof sectionContent !== "string" || sectionContent.length === 0) {
      continue; // Skip empty sections
    }

    // Extract key terms from section (nouns, verbs, proper names)
    const sectionTerms = extractKeyTerms(sectionContent);
    if (sectionTerms.length === 0) continue;

    // Calculate confidence scores
    const evidence = findEvidenceItems(sectionName, sectionTerms, normalizedItems);
    const confidence = calculateConfidence(sectionTerms, evidence, activity.windowStartDate);

    if (confidence >= confidenceThreshold) {
      const severity =
        confidence >= 0.75 ? "blocker" : confidence >= 0.5 ? "warn" : "info";

      detectedItems.push({
        visionSection: sectionName,
        evidence: evidence.map((e) => ({
          id: e.id,
          type: e.type,
          content: e.content,
          createdAt: e.createdAt,
          authorId: e.authorId,
        })),
        confidence: Math.round(confidence * 100) / 100, // Round to 2 decimals
        proposedAmendment: formatProposedAmendment(sectionName, evidence),
        severity,
        explanation: generateExplanation(sectionName, confidence, evidence.length),
      });
    } else {
      totalItemsDetected++;
    }
  }

  return {
    items: detectedItems,
    runId,
    generatedAt,
    companyId: "", // Set by caller
    confidenceThreshold,
    totalItemsDetected: detectedItems.length + totalItemsDetected,
  };
}

/**
 * Normalize text for comparison: lowercase, remove extra spaces, remove punctuation.
 *
 * @param text Text to normalize
 * @returns Normalized text
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Remove punctuation
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

/**
 * Extract key terms from a section (nouns, verbs, numbers, proper names).
 *
 * Simple heuristic: words > 3 chars, capitalized words, numbers, hyphenated terms.
 * Per D-04 (lexical score), these are the terms we'll match against activity.
 *
 * @param sectionContent Section text
 * @returns Array of key terms (deduplicated)
 */
function extractKeyTerms(sectionContent: string): string[] {
  const tokens = sectionContent.split(/[\s\-.,;:!?()]+/);
  const terms = new Set<string>();

  for (const token of tokens) {
    const lower = token.toLowerCase();
    // Include tokens > 3 chars, or capitalized words, or numbers
    if (
      lower.length > 3 ||
      (token.length > 0 && token[0] === token[0].toUpperCase()) ||
      /^\d+/.test(token)
    ) {
      terms.add(lower);
    }
  }

  return Array.from(terms);
}

/**
 * Find evidence items (issues/comments/documents) that mention section terms.
 *
 * Per D-04 (semantic score), counts how many distinct activity items mention
 * the section topic. Each item counted once.
 *
 * @param sectionName Name of VISION section being checked
 * @param sectionTerms Key terms from the section
 * @param items Normalized activity items
 * @returns Array of evidence items that mention section terms
 */
function findEvidenceItems(
  sectionName: string,
  sectionTerms: string[],
  items: Array<{
    id: string;
    type: "issue" | "comment" | "document";
    content: string;
    normalizedContent: string;
    createdAt: string;
    authorId: string;
  }>
): typeof items {
  const evidence: typeof items = [];
  const seenIds = new Set<string>();

  // Match items by term overlap
  for (const item of items) {
    if (seenIds.has(item.id)) continue;

    // Count how many section terms appear in item
    let matchCount = 0;
    for (const term of sectionTerms) {
      if (item.normalizedContent.includes(term)) {
        matchCount++;
      }
    }

    // Include item if it has > 2 term matches (threshold to avoid noise)
    if (matchCount > 2) {
      evidence.push(item);
      seenIds.add(item.id);
    }
  }

  return evidence;
}

/**
 * Calculate confidence score blending lexical, semantic, and recency signals.
 *
 * Per D-04:
 * - Lexical: term match ratio (matches / total terms)
 * - Semantic: evidence count ratio (distinct items / total items)
 * - Recency: weighted by time (last 7 days: 1.0, 7-14: 0.8, 14-30: 0.5)
 * - Final = (lexical × 0.4) + (semantic × 0.4) + (recency × 0.2)
 *
 * @param sectionTerms Key terms from VISION section
 * @param evidence Matched activity items
 * @param windowStart Window start date (for recency calc)
 * @returns Confidence score (0..1)
 */
function calculateConfidence(
  sectionTerms: string[],
  evidence: Array<{ createdAt: string }>,
  windowStart: Date
): number {
  if (sectionTerms.length === 0 || evidence.length === 0) {
    return 0;
  }

  // Lexical score: matches / terms (but cap at 1.0)
  const lexicalScore = Math.min(evidence.length / sectionTerms.length, 1.0);

  // Semantic score: evidence / estimated total (heuristic: 10-20 items typical)
  const semanticScore = Math.min(evidence.length / 15, 1.0);

  // Recency score: weight by time from window start
  let totalRecencyWeight = 0;
  for (const item of evidence) {
    const itemDate = new Date(item.createdAt);
    const daysOld = (new Date().getTime() - itemDate.getTime()) / (24 * 60 * 60 * 1000);

    let weight = 0;
    if (daysOld < 7) weight = 1.0;
    else if (daysOld < 14) weight = 0.8;
    else if (daysOld < 30) weight = 0.5;
    else weight = 0.2;

    totalRecencyWeight += weight;
  }

  const recencyScore = Math.min(totalRecencyWeight / evidence.length, 1.0);

  // Final blend: (lexical × 0.4) + (semantic × 0.4) + (recency × 0.2)
  const confidence = lexicalScore * 0.4 + semanticScore * 0.4 + recencyScore * 0.2;

  return Math.min(confidence, 1.0);
}

/**
 * Format proposed amendment as a markdown delta.
 *
 * Per D-08, returns a unified diff-like format showing evidence summary
 * and suggesting a review. Exact amendment text will be authored by founder
 * in the UI preview step (Phase 3).
 *
 * @param sectionName VISION section name
 * @param evidence Evidence items supporting the amendment
 * @returns Markdown delta text (placeholder for founder review)
 */
function formatProposedAmendment(
  sectionName: string,
  evidence: Array<{ type: string; content: string }>
): string {
  const evidenceExcerpts = evidence.slice(0, 3).map((e) => `- [${e.type}] ${e.content.substring(0, 80)}...`);

  return (
    `Review the following evidence related to "${sectionName}":\n\n` +
    evidenceExcerpts.join("\n") +
    `\n\nConsider whether this section of your VISION needs updating based on recent activity.`
  );
}

/**
 * Generate human-readable explanation of why drift was detected.
 *
 * @param sectionName VISION section name
 * @param confidence Confidence score
 * @param evidenceCount Number of evidence items
 * @returns Explanation string
 */
function generateExplanation(sectionName: string, confidence: number, evidenceCount: number): string {
  const percent = Math.round(confidence * 100);
  return `Detected ${evidenceCount} recent activity item(s) related to "${sectionName}" (${percent}% confidence)`;
}
