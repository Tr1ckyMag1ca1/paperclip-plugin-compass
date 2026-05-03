/**
 * Stall Cause Classification
 *
 * Pure function that diagnoses why a company is stalled using hard rules.
 * Per D-02, produces one of 5 causes with confidence scores (0..1).
 * No LLM, no I/O, fully deterministic and testable.
 */

import type { InventorySnapshot, Agent } from "../types.js";
import type { ParsedVision, ActivitySnapshot, DriftReport } from "../types/assess.js";
import type { StallCause, StallClassification } from "../types/revive.js";

/**
 * Classify the stall cause(s) for a company.
 *
 * Per D-02, detects one of 5 causes using hard rules:
 * 1. single-blocker: one issue stuck > 14 days with 3+ downstream
 * 2. strategic-drift: drift report has 3+ high-confidence items
 * 3. broken-integration: SDK error patterns in comments
 * 4. governance-loop: issue cycles "needs review" >= 3 times
 * 5. dead-agent: agent no heartbeat > 30 days with open issues
 *
 * Returns ranked causes (highest confidence first) with scores.
 *
 * @param snapshot InventorySnapshot (company state)
 * @param vision ParsedVision (VISION.md parsed)
 * @param activity ActivitySnapshot (last 30 days activity)
 * @param driftReport Optional DriftReport from Phase 3 detector
 * @returns StallClassification with causes ranked by confidence
 */
export function classifyStall(
  snapshot: InventorySnapshot,
  vision: ParsedVision,
  activity: ActivitySnapshot,
  driftReport?: DriftReport
): StallClassification {
  const companyId = snapshot.companyId;
  const timestamp = new Date().toISOString();

  // Calculate confidence for each cause
  const confidenceByScore: Record<StallCause, number> = {
    "single-blocker": scoreBlockerSeverity(snapshot, activity),
    "strategic-drift": scoreDriftConfidence(driftReport),
    "broken-integration": scoreIntegrationHealth(snapshot, activity),
    "governance-loop": scoreGovernanceLoop(activity),
    "dead-agent": scoreAgentHealth(snapshot, activity),
  };

  // Rank causes by confidence (descending)
  const causes: StallCause[] = (
    Object.entries(confidenceByScore) as [StallCause, number][]
  )
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([cause]) => cause);

  return {
    companyId,
    causes,
    confidence: confidenceByScore,
    timestamp,
  };
}

/**
 * Score single-blocker cause: one issue stuck > 14 days with 3+ downstream.
 *
 * Per D-03 (single-blocker rule): returns confidence 0..1.
 * - Score = 0 if no issues stuck > 14 days
 * - Score increases with issue age and downstream count
 * - Max score 1.0 if issue stuck 30+ days with 5+ downstream
 *
 * Thresholds (documented per D-02):
 * - Stuck threshold: 14 days
 * - Downstream threshold: 3 issues
 * - Max age: 30 days (diminishing returns beyond)
 *
 * @param snapshot InventorySnapshot
 * @param activity ActivitySnapshot (for context, though we primarily use snapshot)
 * @returns Confidence score (0..1)
 */
export function scoreBlockerSeverity(
  snapshot: InventorySnapshot,
  activity: ActivitySnapshot
): number {
  // N-VALUE: stuck threshold is 14 days (per D-03)
  const STUCK_THRESHOLD_DAYS = 14;
  const DOWNSTREAM_THRESHOLD = 3;
  const MAX_AGE_DAYS = 30;

  const now = new Date();
  let maxScore = 0;

  for (const issue of snapshot.recentIssues) {
    const createdAt = new Date(issue.createdAt);
    const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    // Skip if not stuck long enough
    if (ageInDays < STUCK_THRESHOLD_DAYS) {
      continue;
    }

    // Count downstream issues (issues mentioning this issue ID in their description)
    let downstreamCount = 0;
    for (const other of snapshot.recentIssues) {
      if (
        other.id !== issue.id &&
        (other.description?.includes(issue.id) || other.title?.includes(issue.id))
      ) {
        downstreamCount++;
      }
    }

    if (downstreamCount >= DOWNSTREAM_THRESHOLD) {
      // Score = (ageInDays / MAX_AGE_DAYS) × downstreamFactor
      const ageScore = Math.min(ageInDays / MAX_AGE_DAYS, 1.0);
      const downstreamFactor = Math.min(downstreamCount / DOWNSTREAM_THRESHOLD, 1.0);
      const score = ageScore * downstreamFactor;

      if (score > maxScore) {
        maxScore = score;
      }
    }
  }

  return Math.min(maxScore, 1.0);
}

/**
 * Score strategic-drift cause: drift report has 3+ high-confidence items.
 *
 * Per D-03 (strategic-drift rule): returns confidence 0..1.
 * - Score = 0 if no drift report or no high-confidence items
 * - Score increases with count and average confidence of high-confidence items
 * - High-confidence threshold: >= 0.7
 *
 * Thresholds (documented per D-03):
 * - High-confidence items threshold: >= 0.7
 * - Item count threshold: 3 items
 *
 * @param driftReport Optional DriftReport from Phase 3
 * @returns Confidence score (0..1)
 */
export function scoreDriftConfidence(driftReport?: DriftReport): number {
  if (!driftReport) {
    return 0;
  }

  // N-VALUE: high-confidence threshold is 0.7 (per D-03)
  const HIGH_CONFIDENCE_THRESHOLD = 0.7;
  const ITEM_COUNT_THRESHOLD = 3;

  const highConfidenceItems = driftReport.items.filter(
    (item) => item.confidence >= HIGH_CONFIDENCE_THRESHOLD
  );

  if (highConfidenceItems.length === 0) {
    return 0;
  }

  // Score based on count and average confidence
  const countScore = Math.min(
    highConfidenceItems.length / ITEM_COUNT_THRESHOLD,
    1.0
  );
  const avgConfidence =
    highConfidenceItems.reduce((sum, item) => sum + item.confidence, 0) /
    highConfidenceItems.length;
  const confidenceScore = avgConfidence;

  // Blend: 0.5 weight on count, 0.5 weight on average confidence
  const score = 0.5 * countScore + 0.5 * confidenceScore;
  return Math.min(score, 1.0);
}

/**
 * Score broken-integration cause: SDK/integration error patterns in comments.
 *
 * Per D-03 (broken-integration rule): returns confidence 0..1.
 * - Scans activity comments for error keywords: "integration", "SDK", "adapter", "connection failed", "error"
 * - Score increases with frequency of error keywords
 *
 * Thresholds (documented per D-03):
 * - Error keyword patterns: ["integration", "sdk", "adapter", "connection", "error"]
 * - Min keywords to score > 0: 1 keyword in comments
 *
 * @param snapshot InventorySnapshot
 * @param activity ActivitySnapshot (for comment content)
 * @returns Confidence score (0..1)
 */
export function scoreIntegrationHealth(
  snapshot: InventorySnapshot,
  activity: ActivitySnapshot
): number {
  // N-VALUE: error keywords that trigger broken-integration detection
  const ERROR_KEYWORDS = [
    "integration",
    "sdk",
    "adapter",
    "connection",
    "error",
  ];

  let keywordHits = 0;
  const maxHits = 10; // Diminishing returns beyond 10 hits

  for (const comment of activity.comments) {
    const content = comment.content.toLowerCase();
    for (const keyword of ERROR_KEYWORDS) {
      // Count occurrences (case-insensitive)
      const regex = new RegExp(keyword, "gi");
      const matches = content.match(regex);
      if (matches) {
        keywordHits += matches.length;
      }
    }
  }

  if (keywordHits === 0) {
    return 0;
  }

  // Score = min(keywordHits / maxHits, 1.0)
  return Math.min(keywordHits / maxHits, 1.0);
}

/**
 * Score governance-loop cause: issue cycles through "needs review" >= 3 times.
 *
 * Per D-03 (governance-loop rule): returns confidence 0..1.
 * - Scans issue comments for state transitions to "needs review"
 * - Score increases with count of cycles (repetitions)
 *
 * Thresholds (documented per D-03):
 * - Cycle count threshold: 3 cycles (matches in comments)
 * - Max cycles to score: 5 (diminishing returns)
 *
 * @param activity ActivitySnapshot (for comment content)
 * @returns Confidence score (0..1)
 */
export function scoreGovernanceLoop(activity: ActivitySnapshot): number {
  // N-VALUE: "needs review" cycle threshold is 3 (per D-03)
  const CYCLE_THRESHOLD = 3;
  const MAX_CYCLES = 5;

  let cycleCount = 0;

  for (const comment of activity.comments) {
    const content = comment.content.toLowerCase();

    // Count occurrences of "needs review" or similar state transitions
    if (
      content.includes("needs review") ||
      content.includes("in review") ||
      content.includes("pending review")
    ) {
      cycleCount++;
    }
  }

  if (cycleCount < CYCLE_THRESHOLD) {
    return 0;
  }

  // Score = (cycleCount - CYCLE_THRESHOLD) / (MAX_CYCLES - CYCLE_THRESHOLD)
  const excessCycles = cycleCount - CYCLE_THRESHOLD;
  const maxExcess = MAX_CYCLES - CYCLE_THRESHOLD;
  const score = excessCycles / maxExcess;

  return Math.min(score, 1.0);
}

/**
 * Score dead-agent cause: agent no heartbeat > 30 days with open assigned issues.
 *
 * Per D-03 (dead-agent rule): returns confidence 0..1.
 * - Score = 0 if all agents have recent heartbeats
 * - Score increases with heartbeat age and count of assigned open issues
 *
 * Thresholds (documented per D-03):
 * - No heartbeat threshold: 30 days
 * - Max age to score: 60 days (diminishing returns beyond)
 *
 * @param snapshot InventorySnapshot
 * @param activity ActivitySnapshot (for context)
 * @returns Confidence score (0..1)
 */
export function scoreAgentHealth(
  snapshot: InventorySnapshot,
  activity: ActivitySnapshot
): number {
  // N-VALUE: no heartbeat threshold is 30 days (per D-03)
  const NO_HEARTBEAT_THRESHOLD_DAYS = 30;
  const MAX_AGE_DAYS = 60;

  const now = new Date();
  let maxScore = 0;

  for (const agent of snapshot.agents) {
    const lastHeartbeat = agent.lastHeartbeatAt
      ? new Date(agent.lastHeartbeatAt)
      : null;

    // Skip agents with recent heartbeats
    if (!lastHeartbeat) {
      // No heartbeat at all — treat as infinitely stale (set to MAX_AGE_DAYS)
      const ageInDays = MAX_AGE_DAYS;

      // Count open issues assigned to this agent
      let assignedOpenIssues = 0;
      for (const issue of snapshot.recentIssues) {
        if (
          issue.assigneeAgentId === agent.id &&
          (issue.status === "todo" || issue.status === "in_progress")
        ) {
          assignedOpenIssues++;
        }
      }

      if (assignedOpenIssues > 0) {
        // Score = (ageInDays / MAX_AGE_DAYS) × assignedIssuesFactor
        const ageScore = Math.min(ageInDays / MAX_AGE_DAYS, 1.0);
        const assignedFactor = Math.min(assignedOpenIssues / 2, 1.0); // 2+ issues = max factor
        const score = ageScore * assignedFactor;

        if (score > maxScore) {
          maxScore = score;
        }
      }
    } else {
      const ageInDays = (now.getTime() - lastHeartbeat.getTime()) / (1000 * 60 * 60 * 24);

      // Skip if heartbeat is recent
      if (ageInDays < NO_HEARTBEAT_THRESHOLD_DAYS) {
        continue;
      }

      // Count open issues assigned to this agent
      let assignedOpenIssues = 0;
      for (const issue of snapshot.recentIssues) {
        if (
          issue.assigneeAgentId === agent.id &&
          (issue.status === "todo" || issue.status === "in_progress")
        ) {
          assignedOpenIssues++;
        }
      }

      if (assignedOpenIssues > 0) {
        // Score = (ageInDays / MAX_AGE_DAYS) × assignedIssuesFactor
        const ageScore = Math.min(ageInDays / MAX_AGE_DAYS, 1.0);
        const assignedFactor = Math.min(assignedOpenIssues / 2, 1.0); // 2+ issues = max factor
        const score = ageScore * assignedFactor;

        if (score > maxScore) {
          maxScore = score;
        }
      }
    }
  }

  return Math.min(maxScore, 1.0);
}
