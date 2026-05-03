/**
 * Assess Mode Type Definitions
 *
 * Types for drift detection, VISION.md parsing, activity snapshots, amendments,
 * and approval routing. All types are pure data structures with no I/O or side effects.
 *
 * Per D-05, all assess types follow the pattern from src/types/found.ts.
 */

/**
 * ActivityItem — a single activity entry in the last 30 days.
 *
 * Represents a single issue, issue comment, or document created/updated
 * within the drift detection window. Used to build ActivitySnapshot.
 */
export interface ActivityItem {
  /** Unique identifier (issue ID, comment ID, or document ID) */
  id: string;

  /** Type of activity: 'issue' | 'comment' | 'document' */
  type: "issue" | "comment" | "document";

  /** Activity content: issue title + description, comment body, or document excerpt */
  content: string;

  /** ISO 8601 timestamp when activity was created */
  createdAt: string;

  /** ID of the agent or user who created this activity */
  authorId: string;
}

/**
 * ActivitySnapshot — container for all company activity in the drift window.
 *
 * Per D-02, built by querying SDK adapter for issues, issue_comments, documents
 * filtered to last 30 days. Pure data structure, no methods.
 */
export interface ActivitySnapshot {
  /** Issues created in the last 30 days */
  issues: ActivityItem[];

  /** Issue comments created in the last 30 days */
  comments: ActivityItem[];

  /** Documents created/modified in the last 30 days (excludes VISION.md itself) */
  documents: ActivityItem[];

  /** Total count of all activity items */
  totalItemCount: number;

  /** Window start date (now - windowDays) */
  windowStartDate: Date;

  /** Window end date (now) */
  windowEndDate: Date;
}

/**
 * ParsedVision — parsed VISION.md with all 19 named sections.
 *
 * Per D-05, parser extracts all sections from the Phase 2 vision template.
 * Includes optional amendments log for changelog tracking.
 */
export interface ParsedVision {
  /** Vision section: mission statement */
  mission: string;

  /** Vision section: founder mandate */
  mandate: string;

  /** Vision section: brand voice and tone */
  voice: string;

  /** Vision section: core operating principles */
  principles: string;

  /** Vision section: 12-month success criteria */
  success_criteria_12mo: string;

  /** Vision section: 3-year vision statement */
  vision_3year: string;

  /** Vision section: target customer profile */
  target_customer: string;

  /** Vision section: issue/blockers structure */
  issue_structure: string;

  /** Vision section: locality (geographic/customer focus) */
  locality: string;

  /** Vision section: revenue model */
  revenue_model: string;

  /** Vision section: launch plan */
  launch_plan: string;

  /** Vision section: trust and governance */
  trust_governance: string;

  /** Vision section: growth strategy */
  growth_strategy: string;

  /** Vision section: sales and acquisition model */
  sales_model: string;

  /** Vision section: product direction and roadmap */
  product_direction: string;

  /** Vision section: organizational structure */
  org_structure: string;

  /** Vision section: operating philosophy */
  operating_philosophy: string;

  /** Vision section: CEO autonomy and decision rights */
  ceo_mandate: string;

  /** Vision section: success criteria (long-term, comprehensive) */
  success_criteria: string;

  /** Optional: amendment changelog entries (added by applyAmendmentToVision) */
  amendments?: AmendmentLogEntry[];
}

/**
 * AmendmentLogEntry — a single changelog record for a VISION amendment.
 *
 * Per D-07, records when a VISION section was amended, why, and by whom.
 * Appended immutably to VISION.amendments array.
 */
export interface AmendmentLogEntry {
  /** ISO 8601 timestamp of the amendment */
  timestamp: string;

  /** Name of the amended section (e.g., "voice", "mandate", "growth_strategy") */
  section: string;

  /** Reason for the amendment (free text) */
  reason: string;

  /** Optional founder identity (name, email, or user ID from SDK context) */
  founderIdentity?: string;
}

/**
 * DriftItem — a single drift signal between VISION and activity.
 *
 * Per D-03, each drift item represents one section where VISION may be
 * out of sync with recent company activity. Includes confidence scoring
 * and proposed amendment delta.
 */
export interface DriftItem {
  /** Name of the VISION section with detected drift */
  visionSection: keyof ParsedVision;

  /** Evidence items (issues/comments/documents) that triggered the signal */
  evidence: ActivityItem[];

  /** Confidence score (0..1) — blend of lexical + semantic + recency */
  confidence: number;

  /** Proposed amendment as markdown delta (unified diff format) */
  proposedAmendment: string;

  /** Severity level based on confidence band */
  severity: "info" | "warn" | "blocker";

  /** Detailed explanation of why this drift was detected */
  explanation: string;
}

/**
 * DriftReport — complete drift detection output.
 *
 * Per D-03, output of detectDrift function. Contains all detected drift items,
 * run metadata, and filtering threshold applied.
 */
export interface DriftReport {
  /** All detected drift items (filtered to confidence >= 0.5) */
  items: DriftItem[];

  /** UUID for this drift run (stable across retries) */
  runId: string;

  /** ISO 8601 timestamp when drift detection ran */
  generatedAt: string;

  /** Company ID (for scoping and audit trail) */
  companyId: string;

  /** Confidence threshold applied (default 0.5) */
  confidenceThreshold: number;

  /** Total items detected before threshold filtering */
  totalItemsDetected: number;
}

/**
 * ConfidenceScoring — internal type for confidence calculation breakdown.
 *
 * Per D-04, represents the three scoring signals blended into final confidence.
 * Used for transparency and testing.
 */
export interface ConfidenceScoring {
  /** Keyword overlap score (0..1) — how many VISION terms appear in activity */
  lexicalScore: number;

  /** Evidence clustering score (0..1) — how many distinct activity items point to this section */
  semanticScore: number;

  /** Recency-weighted score (0..1) — recent activity weighted higher */
  recencyScore: number;

  /** Final blended confidence: (lexical × 0.4) + (semantic × 0.4) + (recency × 0.2) */
  finalConfidence: number;
}

/**
 * ActivityQueryOptions — input shape for building an ActivitySnapshot.
 *
 * Per D-02, used when querying SDK adapter for recent activity.
 */
export interface ActivityQueryOptions {
  /** Company ID to query activity for */
  companyId: string;

  /** Start date for activity window (ISO 8601 or Date object) */
  since: Date | string;

  /** Optional window size in days (default 30) */
  windowDays?: number;
}

/**
 * ApprovalPayload — data sent to approvals table for founder+ceo routing.
 *
 * Per D-10, used when insertApproval is called during Apply step
 * in founder+ceo mode. Contains full amendment context for CEO review.
 */
export interface ApprovalPayload {
  /** Approval type identifier */
  type: "compass.assess.amendment";

  /** Company ID being amended */
  companyId: string;

  /** Section of VISION being amended */
  section: string;

  /** Current section content before amendment */
  currentContent: string;

  /** Proposed section content after amendment */
  proposedContent: string;

  /** Drift evidence supporting the amendment */
  evidence: ActivityItem[];

  /** Confidence score for this drift (0..1) */
  confidence: number;

  /** Human-readable reason for amendment */
  reason: string;

  /** Drift report run ID */
  runId: string;

  /** Timestamp when approval was requested */
  createdAt: string;

  /** Founder ID requesting approval */
  requestedByUserId: string;
}

/**
 * Approval — response from getApproval, representing approval status.
 *
 * Per D-10, polled during Apply step to wait for CEO decision
 * in founder+ceo routing mode.
 */
export interface Approval {
  /** Approval ID (primary key) */
  id: string;

  /** Current status: 'pending' | 'approved' | 'rejected' */
  status: "pending" | "approved" | "rejected";

  /** ID of user who decided (null if pending) */
  decidedByUserId?: string;

  /** Timestamp of decision (null if pending) */
  decidedAt?: string;

  /** Notes or reason for decision */
  notes?: string;

  /** Full approval payload */
  payload: ApprovalPayload;
}
