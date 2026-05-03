/**
 * Found Mode Type Definitions
 *
 * Types for interview content, answers, VISION template filling, and quality checking.
 * All types are pure data structures with no I/O or side effects.
 */

/**
 * Question — a single interview question with metadata and optional conditional logic.
 *
 * Per D-03, supports 5 question types:
 * - free-text-short: single-line input
 * - free-text-long: textarea input
 * - single-choice: radio buttons or select
 * - multi-choice: checkboxes
 * - conditional-follow-up: appears only if parent question has specific value
 */
export interface Question {
  /** Unique identifier within section (e.g., "q1", "market-size") */
  id: string;

  /** Question text to display to founder (e.g., "What problem are you solving?") */
  prompt: string;

  /** Question input type */
  type:
    | "free-text-short"
    | "free-text-long"
    | "single-choice"
    | "multi-choice"
    | "conditional-follow-up";

  /** Whether founder must answer this question before advancing (default: true) */
  required?: boolean;

  /** Optional hint text displayed below input */
  hint?: string;

  /** Option values for choice-type questions */
  options?: string[];

  /** Conditional logic: only show this question if parent question has specific value */
  showIf?: {
    /** ID of parent question to check */
    questionId: string;

    /** Show if parent equals this value (string match) */
    equals?: string;

    /** Show if parent includes this value (array/comma-separated) */
    includes?: string;
  };
}

/**
 * InterviewSection — a group of related questions within a single section.
 *
 * Per D-01 and D-02, each section lives as a markdown file with YAML frontmatter.
 * 6 sections total: Big Picture, Revenue & Customers, Growth & Marketing,
 * Product Direction, CEO Autonomy, Vision & Identity.
 */
export interface InterviewSection {
  /** Unique lowercase-hyphenated identifier (e.g., "big-picture") */
  id: string;

  /** Display title (exact match from UI-SPEC: "Big Picture", "Revenue & Customers", etc.) */
  title: string;

  /** Context text shown above first question (markdown-formatted) */
  intro: string;

  /** Array of questions in this section */
  questions: Question[];
}

/**
 * InterviewAnswers — flat key-value map of all founder answers across all sections.
 *
 * Keys are question IDs (e.g., "mission", "target-customer", "revenue-model").
 * Values are founder's text responses (may be empty string for unanswered questions).
 */
export type InterviewAnswers = Record<string, string>;

/**
 * FilledVision — output of template-fill function: rendered VISION.md with metadata.
 *
 * Per D-05 and D-06, combines direct answers + derived slots into the final markdown.
 * May contain unresolved placeholders (checked later in quality-check).
 */
export interface FilledVision {
  /** Rendered VISION.md markdown body (may contain {{unresolved}} placeholders) */
  body: string;

  /** List of slot names that were filled (e.g., ["mission", "mandate", "voice"]) */
  slotsUsed: string[];

  /** List of slot names still empty as {{placeholder}} in body (e.g., ["principles", "success_criteria"]) */
  slotsEmpty: string[];
}

/**
 * QualityCheckResult — output of quality-check function: validation result.
 *
 * Per FOUND-12 and D-08, defines which slots are required vs optional,
 * and whether Apply can proceed.
 */
export interface QualityCheckResult {
  /** True if all required slots are filled; false if blocking issues exist */
  isValid: boolean;

  /** Slots required per FOUND-12: mission, mandate, voice, principles, success_criteria */
  missingRequiredSlots: string[];

  /** Optional slots that are empty (warnings only, do not block Apply) */
  emptyOptionalSlots: string[];

  /** Specific error messages for display to founder */
  errors: string[];
}

/**
 * PresetDefinition — a founding preset (e.g., "Launch MVP", "Scale-Up", "Enterprise").
 *
 * Defines the agents, roles, and initial setup when founder applies the Found interview.
 * Inherited from company-wizard patterns; extended in Phase 2 FOUND-07.
 */
export interface PresetDefinition {
  /** Unique identifier (e.g., "launch-mvp") */
  id: string;

  /** Display name (e.g., "Launch MVP") */
  name: string;

  /** Description shown in preset selector */
  description: string;

  /** List of agent blueprints to provision when preset selected */
  agents: Array<{
    /** Agent ID (template var, e.g., "agent-ceo") */
    id: string;

    /** Agent display name (e.g., "CEO") */
    name: string;

    /** Agent role/description (e.g., "Chief Executive Officer") */
    role: string;
  }>;
}
