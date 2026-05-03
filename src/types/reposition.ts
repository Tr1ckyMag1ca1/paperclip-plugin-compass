/**
 * Reposition Mode Type Definitions
 *
 * Types for shift classification, scoped interview, amendments, and approval routing.
 * All types are pure data structures with no I/O or side effects.
 *
 * Per D-01 through D-07, reposition types follow the pattern from src/types/found.ts
 * and src/types/assess.ts, with reposition-specific naming and fields.
 */

import type { ParsedVision } from "./assess.js";
import type { InterviewAnswers, InterviewSection } from "./found.js";
import type { CascadePlan } from "../assess/cascade.js";

/**
 * VisionSectionId — typed string for vision section identifiers.
 *
 * Represents the named sections of VISION.md that can be amended:
 * mission, mandate, voice, principles, success_criteria, growth_strategy,
 * revenue_model, target_customer, and others.
 */
export type VisionSectionId = keyof ParsedVision;

/**
 * ShiftScope — output of the shift classifier.
 *
 * Per D-01, maps founder-described strategic shift into affected VISION sections.
 * Used to determine which sections are re-interviewed and amended.
 */
export interface ShiftScope {
  /** Vision section IDs that are affected by this shift (e.g., ["voice", "product-direction"]) */
  affectedSections: VisionSectionId[];

  /** Confidence score for the classification (0..1, higher = more certain) */
  confidence: number;

  /** Natural-language rationale for the classification (e.g., "Detected keywords: rebrand, voice, brand identity") */
  rationale: string;
}

/**
 * Amendment — single VISION section amendment for Reposition Mode.
 *
 * Per D-07, represents a proposed change to one VISION section.
 * Includes current content, proposed content, and reason for the change.
 */
export interface Amendment {
  /** Vision section being amended (e.g., "voice", "product-direction") */
  section: VisionSectionId;

  /** Current VISION.md content for this section */
  currentContent: string;

  /** Proposed new content after reposition interview */
  proposedContent: string;

  /** Natural-language reason why this section was amended (e.g., "Founder rebranded voice in reposition interview") */
  reason: string;

  /** Changelog entry with timestamp (e.g., "[2026-05-03] Repositioned via Reposition Mode") */
  changelog?: string;
}

/**
 * RepositionRunState — in-flight state for a reposition operation.
 *
 * Per D-13 (RepositionPanel flow phases), persists in worker-state with key
 * `compass:reposition:run:${company_id}` for durability across page reloads.
 *
 * Tracks the entire reposition workflow from intent entry through apply completion.
 */
export interface RepositionRunState {
  /** Company ID being repositioned */
  companyId: string;

  /** Unique run ID (UUID) for this reposition operation */
  runId: string;

  /** Current phase of the reposition workflow */
  phase:
    | "intent" // Founder entering shift intent
    | "scope-confirm" // Founder reviewing and adjusting classified scope
    | "interview" // Founder answering scoped re-interview
    | "preview" // Founder reviewing per-section amendments
    | "cascade-review" // Founder reviewing cascade plan
    | "confirming" // Waiting for founder confirmation
    | "applying" // In progress applying changes
    | "complete" // Successfully applied
    | "waiting-approval" // Awaiting CEO approval (founder+ceo routing)
    | "error"; // Operation failed

  /** Founder's free-text description of the strategic shift */
  intent: string;

  /** Shift classification results (affectedSections, confidence, rationale) */
  shiftScope: ShiftScope;

  /** Founder-override scope: may add/remove sections from shiftScope.affectedSections */
  userScope: VisionSectionId[];

  /** Scoped interview sections (subset of all 6 sections) */
  scopedInterview: InterviewSection[];

  /** Founder's answers to scoped interview questions */
  interviewAnswers: InterviewAnswers;

  /** Generated amendments per affected section (before apply) */
  amendments: Amendment[];

  /** Cascade plan (if amendments affect agents) from src/assess/cascade.ts */
  cascadePlan?: CascadePlan;

  /** Approval routing for this company: "founder" (apply on confirmation) or "founder+ceo" (queue to approvals) */
  approvalRouting: "founder" | "founder+ceo";

  /** ISO 8601 timestamp when this run was created */
  createdAt: string;

  /** ISO 8601 timestamp when this run was completed (or null if still in progress) */
  completedAt?: string;

  /** Error message if phase === "error" */
  error?: string;
}

/**
 * RepositionRunResult — output of the Reposition Mode orchestrator.
 *
 * Per D-13 (complete phase), returned to caller after apply completes.
 * Includes success status, amendments applied, and optional cascade plan.
 */
export interface RepositionRunResult {
  /** True if run succeeded; false if failed */
  success: boolean;

  /** Unique run ID of the completed run */
  runId: string;

  /** Amendments that were applied to VISION.md */
  amendments?: Amendment[];

  /** Cascade plan that was executed (if any) */
  cascadePlan?: CascadePlan;

  /** Error message if success === false */
  error?: string;

  /** ISO 8601 timestamp of completion */
  completedAt: string;
}
