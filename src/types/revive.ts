/**
 * Revive Mode Type Definitions
 *
 * Types for stall cause classification, action queues, and recommended actions.
 * All types are pure data structures with no I/O or side effects.
 *
 * Per D-02, D-05, D-07, all revive types follow the pattern from src/types/assess.ts.
 */

/**
 * StallCause — one of 5 diagnostic causes for why a company is stalled.
 *
 * Per D-02, the classifier detects exactly one of these causes and returns
 * a ranked list (usually multiple causes apply). Hard rules — no LLM.
 */
export type StallCause =
  | "single-blocker"
  | "strategic-drift"
  | "broken-integration"
  | "governance-loop"
  | "dead-agent";

/**
 * ActionType — recommended action to unblock the detected stall cause.
 *
 * Per D-07, each action type maps to a handler in src/revive/actions.ts
 * that implements the recommended action with founder confirmation.
 */
export type ActionType =
  | "replace-blocker-issue"
  | "reassign-issue"
  | "nudge-agent-with-context-doc"
  | "pivot-to-sample"
  | "mark-blocker-resolved"
  | "restart-agent"
  | "surface-amendment-needed";

/**
 * ActionItem — a single recommended action in the action queue.
 *
 * Per D-05, each item has priority (0..1), a cause it addresses,
 * a target (agent/issue/vision section), and a recommended action
 * with typed parameters for handler execution.
 */
export interface ActionItem {
  /** Unique identifier for this action (e.g., action-{cause}-{index}) */
  id: string;

  /** The stall cause this action addresses */
  cause: StallCause;

  /** Priority score (0..1) — higher = more urgent. Computed as: cause_severity + normalized_blast_radius */
  priority: number;

  /** Human-readable action title (e.g., "Replace this blocker issue") */
  title: string;

  /** Explanation of what's blocking and why this action unblocks it */
  why_blocking: string;

  /** Number of downstream items this action unblocks (e.g., 3 issues, 1 agent) */
  unblocks_count: number;

  /** Target of the action: which agent/issue/vision section to act on */
  target: {
    /** Type of target: agent, issue, or vision_section */
    type: "agent" | "issue" | "vision_section";

    /** ID of the target (agent_id, issue_id, or vision section name) */
    id: string;

    /** Optional: additional context about the target */
    context?: string;
  };

  /** Recommended action with type and typed parameters */
  recommended_action: {
    /** Action type (maps to handler in src/revive/actions.ts) */
    type: ActionType;

    /** Type-specific parameters (varies by action type) */
    params: Record<string, any>;
  };

  /** Current status of this action item */
  status: "pending" | "addressed" | "dismissed";

  /** Optional: explanation if action was dismissed */
  dismissal_reason?: string;
}

/**
 * ActionQueue — complete action queue for one revive run.
 *
 * Per D-04, written to Paperclip documents table (not .planning/).
 * Persists the diagnostic output and founder's progress addressing actions.
 */
export interface ActionQueue {
  /** Unique identifier for this revive run (UUID) */
  run_id: string;

  /** Company ID being diagnosed */
  company_id: string;

  /** ISO 8601 timestamp when this queue was generated */
  created_at: string;

  /** Stall causes detected, ranked by confidence (highest first) */
  causes: StallCause[];

  /** Action items grouped by cause */
  items_by_cause: Record<StallCause, ActionItem[]>;

  /** Total action items in this queue */
  total_items: number;

  /** Number of items that have been addressed or dismissed */
  addressed_count: number;

  /** Confidence score for each detected cause (0..1) */
  confidence: Record<StallCause, number>;
}

/**
 * ActionResult — outcome of executing a single action.
 *
 * Per D-10: returned to UI for display and used to update queue status.
 */
export interface ActionResult {
  /** Whether the action succeeded */
  success: boolean;

  /** Human-readable summary of what happened */
  summary: string;

  /** Error message (if success=false) */
  error?: string;

  /** Type-specific result data (e.g., created issue IDs) */
  result?: Record<string, unknown>;
}

/**
 * StallClassification — output of classifyStall pure function.
 *
 * Per D-02, produced by src/revive/classify.ts using hard rules.
 * Pure data structure with no I/O.
 */
export interface StallClassification {
  /** Company ID being classified */
  companyId: string;

  /** Detected stall causes ranked by confidence (highest first) */
  causes: StallCause[];

  /** Confidence score for each cause (0..1) */
  confidence: Record<StallCause, number>;

  /** ISO 8601 timestamp of classification */
  timestamp: string;

  /** Optional: explanation of classification (for debugging) */
  explanation?: string;
}
