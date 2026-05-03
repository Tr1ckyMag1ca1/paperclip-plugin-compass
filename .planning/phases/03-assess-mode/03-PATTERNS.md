# Phase 3: Assess Mode - Pattern Map

**Mapped:** 2026-05-03  
**Files analyzed:** 23 new/modified files (17 new, 6 modified)  
**Analogs found:** 22 / 23 (96% coverage; 1 file is entirely new with no direct predecessor)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/types/assess.ts` | model | static | `src/types/found.ts` | exact |
| `src/assess/drift.ts` | service (pure logic) | transform | `src/found/derive.ts` | exact |
| `src/assess/vision-parse.ts` | service (pure logic) | transform | `src/found/template-fill.ts` | role-match |
| `src/assess/activity.ts` | service (builder) | CRUD + transform | `src/found/preflight.ts` | role-match |
| `src/assess/amendment.ts` | service (validation + formatting) | transform | `src/found/quality-check.ts` | role-match |
| `src/assess/cascade.ts` | orchestrator (issue creation) | batch + event-driven | `src/found/apply.ts` cascade step | exact |
| `src/assess/apply.ts` | orchestrator (SDK writes) | request-response + batch | `src/found/apply.ts` | exact |
| `src/assess/index.ts` | barrel | static | `src/found/index.ts` | exact |
| `src/ui/assess/AssessPanel.tsx` | orchestrator (mode controller) | request-response | `src/ui/found/FoundPanel.tsx` | exact |
| `src/ui/assess/DriftReportPanel.tsx` | component (display) | request-response | `src/ui/found/VisionPreview.tsx` | role-match |
| `src/ui/assess/DriftItemCard.tsx` | component (display + interaction) | request-response | `src/ui/found/ProvisioningSummary.tsx` | role-match |
| `src/ui/assess/ConfidenceBar.tsx` | component (visual) | request-response | Phase 2 UI design tokens (no code analog) | new visual |
| `src/ui/assess/EvidenceChip.tsx` | component (interactive) | request-response | `src/ui/found/SectionNavRail.tsx` button pattern | partial |
| `src/ui/assess/AmendmentDiff.tsx` | component (display) | request-response | `src/ui/found/VisionPreview.tsx` markdown display | partial |
| `src/ui/assess/ApprovalRoutingModal.tsx` | component (modal) | request-response | `src/ui/found/PresetSelector.tsx` radio pattern | role-match |
| `src/ui/assess/ApprovingWaitingState.tsx` | component (status) | request-response | `src/ui/found/ApplyProgress.tsx` + `InterviewDraftState.ts` polling pattern | role-match |
| `src/ui/assess/CustomOverrideWarning.tsx` | component (alert) | request-response | `src/ui/found/ApplyErrorDisplay.tsx` alert pattern | role-match |
| `src/ui/assess/AssessRunState.ts` | hook (state management) | request-response | `src/ui/found/InterviewDraftState.ts` | exact |
| `src/ui/assess/index.ts` | barrel | static | `src/ui/found/index.ts` | exact |
| `tests/assess/drift.spec.ts` | test suite | static | `tests/found/derive.spec.ts` | role-match |
| `tests/assess/vision-parse.spec.ts` | test suite | static | `tests/found/quality-check.spec.ts` (hypothetical) | role-match |
| `tests/assess/apply.spec.ts` | test suite | static | `tests/found/apply.spec.ts` | exact |
| `tests/assess/assess.integration.spec.ts` | test suite | static | `tests/found/found.integration.spec.ts` | exact |
| `src/sdk/adapter.ts` (modified) | chokepoint | CRUD | existing (extend) | extension |
| `src/worker.ts` (modified) | orchestrator | event-driven | existing (extend) | extension |
| `src/found/idempotency.ts` (modified) | utility | transform | existing (extend) | extension |
| `src/ui/MainPanel.tsx` (modified) | orchestrator | request-response | existing (extend) | extension |

**Match Quality Legend:**
- **exact** — Closest match: same role AND same data flow; code can be directly adapted
- **role-match** — Same role, similar data flow; pattern established in compass repo
- **partial** — Different role/data flow; reference for structural patterns only
- **new visual** — New component with no prior code analog; follow Phase 2 design tokens
- **extension** — Modify existing file from Phase 1/2 (not a new file)

---

## Pattern Assignments

### `src/types/assess.ts` (model, static)

**Analog:** `src/types/found.ts`

**Pattern:** Type definitions for domain objects. Pure data structures, no I/O, exported for use across assess module.

**Type structure** (found.ts lines 1–50):
```typescript
/**
 * Question — a single interview question with metadata and optional conditional logic.
 */
export interface Question {
  id: string;
  prompt: string;
  type: "free-text-short" | "free-text-long" | "single-choice" | "multi-choice" | "conditional-follow-up";
  required?: boolean;
  hint?: string;
  options?: string[];
  showIf?: { questionId: string; equals?: string; includes?: string };
}
```

**For assess.ts, follow this pattern with assess-specific types:**
```typescript
/**
 * ParsedVision — output of VISION parser: all 19 named sections.
 * Per D-05, parser respects the Phase 2 vision template structure (slot-based).
 */
export interface ParsedVision {
  mission: string;
  mandate: string;
  voice: string;
  principles: string;
  // ... 15 more sections
  amendments?: AmendmentLogEntry[];
}

/**
 * ActivitySnapshot — company activity summary for last 30 days.
 * Per D-02, built by querying SDK adapter for issues, comments, documents.
 */
export interface ActivitySnapshot {
  issues: ActivityItem[];
  comments: ActivityItem[];
  documents: ActivityItem[];
}

/**
 * DriftItem — single drift signal grouped by vision section.
 * Per D-03, includes evidence + confidence + severity + proposed amendment.
 */
export interface DriftItem {
  visionSection: string;
  confidence: number; // 0..1
  severity: "info" | "warn" | "blocker";
  evidence: EvidenceItem[]; // issue/comment/doc IDs
  proposedAmendment: string; // markdown delta
  accepted?: boolean;
}

/**
 * DriftReport — output of drift detector.
 * Grouped by section, scored, ready for founder review.
 */
export interface DriftReport {
  companyId: string;
  assessRunId: string;
  timestamp: string;
  itemsBySection: Record<string, DriftItem[]>;
  totalItems: number;
}
```

---

### `src/assess/drift.ts` (service, transform)

**Analog:** `src/found/derive.ts`

**Pattern:** Pure functions with no I/O. Per D-01 (deterministic-first, no LLM tax), drift detection uses keyword/section overlap heuristics + confidence scoring. Each function returns a score (0..1) for a specific section.

**Pure function signature** (derive.ts lines 40–60):
```typescript
/**
 * Derive principles from interview answers.
 * Pure functions: (answers) => string. No I/O, fully testable.
 */
export function derivePrinciples(answers: InterviewAnswers): string {
  // Aggregate voice + red-lines + values into 3-5 bullet list
  return "- Principle 1\n- Principle 2";
}
```

**For drift.ts, follow this pattern:**
```typescript
import type { ParsedVision, ActivitySnapshot, DriftReport, DriftItem } from "../types/assess.js";

/**
 * Detect drift in company activity against vision.
 * Per D-01: deterministic heuristics, no LLM classifier.
 * Compares each VISION section against activity from last 30 days.
 *
 * @param vision Parsed VISION.md with all 19 sections
 * @param activity Activity snapshot (issues + comments + docs from last 30 days)
 * @param windowDays Drift window in days (default: 30, fixed per PROJECT.md)
 * @returns DriftReport grouped by section with confidence scores
 */
export function detectDrift(
  vision: ParsedVision,
  activity: ActivitySnapshot,
  windowDays: number = 30
): DriftReport {
  // For each VISION section, score drift against activity
  const itemsBySection: Record<string, DriftItem[]> = {};
  
  itemsBySection["mission"] = scoreMissionDrift(vision.mission, activity);
  itemsBySection["voice"] = scoreVoiceDrift(vision.voice, activity);
  // ... one scorer per section
  
  return {
    companyId: activity.companyId,
    assessRunId: generateRunId(),
    timestamp: new Date().toISOString(),
    itemsBySection,
    totalItems: Object.values(itemsBySection).reduce((sum, items) => sum + items.length, 0),
  };
}

/**
 * Score mission drift via keyword overlap + recency weighting.
 * Per D-04, confidence = (lexical overlap) * (semantic clustering) * (recency decay).
 *
 * @param missionText VISION.mission section
 * @param activity Activity snapshot
 * @returns Array of drift items for this section (may be empty)
 */
function scoreMissionDrift(missionText: string, activity: ActivitySnapshot): DriftItem[] {
  // Extract keywords from missionText
  const keywords = extractKeywords(missionText);
  
  // Score each activity item against keywords
  const driftItems: DriftItem[] = [];
  for (const issue of activity.issues) {
    const lexicalScore = computeKeywordOverlap(keywords, issue.text);
    const recencyScore = computeRecencyWeight(issue.createdAt);
    const confidence = lexicalScore * recencyScore;
    
    if (confidence >= CONFIDENCE_THRESHOLD) {
      driftItems.push({
        visionSection: "mission",
        confidence,
        severity: confidence > 0.7 ? "blocker" : confidence > 0.5 ? "warn" : "info",
        evidence: [{ type: "issue", id: issue.id, text: issue.text }],
        proposedAmendment: generateProposedAmendment("mission", issue),
        accepted: false,
      });
    }
  }
  
  return driftItems;
}

function extractKeywords(text: string): string[] {
  // Simple: split on whitespace, filter stop words, lowercase
  return text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
}

function computeKeywordOverlap(keywords: string[], activityText: string): number {
  const activityWords = activityText.toLowerCase().split(/\s+/);
  const matches = keywords.filter(k => activityWords.includes(k)).length;
  return matches / keywords.length; // 0..1
}

function computeRecencyWeight(createdAt: string): number {
  const daysSince = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, 1 - daysSince / 30); // Decay over 30 days, 0 at 30+ days
}

function generateProposedAmendment(section: string, evidence: ActivityItem): string {
  // TODO: Generate markdown delta showing how this section should change
  // Based on evidence from activity (what did the issue suggest?)
  return `- Updated ${section} based on recent activity`;
}
```

---

### `src/assess/vision-parse.ts` (service, transform)

**Analog:** `src/found/template-fill.ts`

**Pattern:** Orchestrates parsing/serialization. Unlike template-fill (fills slots), vision-parse splits markdown into sections and re-serializes for round-trip safety. Per D-05 and D-06, parser is round-trip-safe: `parse(serialize(parse(x))) === parse(x)`.

**Parsing pattern** (template-fill.ts lines 95–140):
```typescript
import type { InterviewAnswers } from "../types.js";
import { derivePrinciples, derive12MonthGoal /* ... */ } from "./derive.js";

export interface FilledVision {
  body: string;
  slotsUsed: string[];
  slotsEmpty: string[];
}

export function fillVisionTemplate(answers: InterviewAnswers): FilledVision {
  let body = VISION_TEMPLATE;
  
  const slots = {
    mission: answers.mission,
    principles: derivePrinciples(answers),
    goal_12mo: derive12MonthGoal(answers),
  };
  
  Object.entries(slots).forEach(([key, value]) => {
    body = body.replace(new RegExp(`{{${key}}}`, "g"), value || "");
  });
  
  const emptyMatches = body.match(/{{(\w+)}}/g) || [];
  return {
    body,
    slotsUsed: Object.keys(slots),
    slotsEmpty: emptyMatches.map(m => m.replace(/[{}]/g, "")),
  };
}
```

**For vision-parse.ts, follow this pattern:**
```typescript
import type { ParsedVision } from "../types/assess.js";

/**
 * Parse VISION.md into structured object with all 19 sections.
 * Per D-05, respects slot-based template shape from Phase 2.
 *
 * Input: markdown from VISION.md document (from adapter.readDocument)
 * Output: ParsedVision with named sections
 * Round-trip safe: parse(serialize(parse(x))) === parse(x)
 *
 * @param markdown Raw VISION.md markdown
 * @returns ParsedVision with all sections parsed
 */
export function parseVision(markdown: string): ParsedVision {
  const sections = splitBySections(markdown);
  
  return {
    mission: extractSection(sections, "Mission") || "",
    mandate: extractSection(sections, "Mandate") || "",
    voice: extractSection(sections, "Voice") || "",
    principles: extractSection(sections, "Principles") || "",
    // ... 15 more sections
    amendments: parseAmendmentLog(extractSection(sections, "Amendment Log") || ""),
  };
}

/**
 * Serialize ParsedVision back to markdown.
 * Per D-06, must preserve structure so re-parse produces same result.
 *
 * @param vision Parsed vision object
 * @returns Markdown string ready to write to VISION.md
 */
export function serializeVision(vision: ParsedVision): string {
  const sections = [
    `## Mission\n\n${vision.mission}`,
    `## Mandate\n\n${vision.mandate}`,
    `## Voice\n\n${vision.voice}`,
    `## Principles\n\n${vision.principles}`,
    // ... 15 more sections
    `## Amendment Log\n\n${serializeAmendmentLog(vision.amendments || [])}`,
  ];
  
  return sections.join("\n\n---\n\n");
}

function splitBySections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>();
  const headerPattern = /^## (.+)$/gm;
  
  let match;
  let currentSection = "";
  let currentContent = "";
  
  while ((match = headerPattern.exec(markdown)) !== null) {
    if (currentSection) {
      sections.set(currentSection, currentContent.trim());
    }
    currentSection = match[1];
    currentContent = markdown.slice(match.index + match[0].length, headerPattern.lastIndex);
  }
  
  if (currentSection) {
    sections.set(currentSection, currentContent.trim());
  }
  
  return sections;
}

function extractSection(sections: Map<string, string>, name: string): string | null {
  for (const [key, value] of sections.entries()) {
    if (key.toLowerCase().includes(name.toLowerCase())) {
      return value;
    }
  }
  return null;
}

interface AmendmentLogEntry {
  date: string; // ISO 8601
  summary: string;
  reason: string;
  approvedBy?: string;
}

function parseAmendmentLog(logText: string): AmendmentLogEntry[] {
  // Simple parser: each amendment is a markdown list item with date prefix
  // Format: "- 2026-05-03: Updated voice section... Reason: ..."
  const entries: AmendmentLogEntry[] = [];
  const lines = logText.split("\n");
  
  for (const line of lines) {
    const match = line.match(/^- (\d{4}-\d{2}-\d{2}): (.+?)\.?\s+Reason: (.+)$/);
    if (match) {
      entries.push({
        date: match[1],
        summary: match[2],
        reason: match[3],
      });
    }
  }
  
  return entries;
}

function serializeAmendmentLog(entries: AmendmentLogEntry[]): string {
  return entries
    .map(e => `- ${e.date}: ${e.summary}. Reason: ${e.reason}`)
    .join("\n");
}
```

---

### `src/assess/activity.ts` (service, builder)

**Analog:** `src/found/preflight.ts`

**Pattern:** Queries SDK adapter to build a structured snapshot. Like preflight, it gathers state via SDK calls but returns data rather than validation results.

**Data gathering pattern** (preflight.ts lines 205–238):
```typescript
export async function preflight(
  ctx: PluginContext,
  companyId: string,
  preset: PresetDefinition,
  vision: FilledVision
): Promise<PreflightResult> {
  const errors: string[] = [];
  
  const company = await ctx.companies.get(companyId);
  if (!company) errors.push(`Company ${companyId} not found`);
  
  const docs = await ctx.issues.list({ companyId });
  const visionExists = docs.some(d => d.title?.includes("VISION"));
  
  return { valid: errors.length === 0, errors, warnings: [] };
}
```

**For activity.ts, follow this pattern:**
```typescript
import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { ActivitySnapshot, ActivityItem } from "../types/assess.js";

/**
 * Build activity snapshot for drift detection.
 * Per D-02, queries issues, comments, documents filtered to last 30 days.
 *
 * @param ctx Plugin context
 * @param companyId Company to audit
 * @param windowDays Lookback window in days (default: 30)
 * @returns ActivitySnapshot with issues, comments, documents grouped by section
 */
export async function buildActivitySnapshot(
  ctx: PluginContext,
  companyId: string,
  windowDays: number = 30
): Promise<ActivitySnapshot> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  
  // Query via adapter methods (Phase 3 extends adapter with these)
  const adapter = new PaperclipAdapter(ctx);
  
  const [issues, comments, documents] = await Promise.all([
    adapter.listIssues({ companyId, since }),
    adapter.listIssueComments({ companyId, since }),
    adapter.listDocuments({ companyId, since }),
  ]);
  
  return {
    companyId,
    issues: issues.map(i => ({
      type: "issue",
      id: i.id,
      text: `${i.title || ""} ${i.description || ""}`,
      createdAt: i.createdAt,
    })),
    comments: comments.map(c => ({
      type: "comment",
      id: c.id,
      text: c.body || "",
      createdAt: c.createdAt,
    })),
    documents: documents.map(d => ({
      type: "document",
      id: d.id,
      text: d.content || "",
      createdAt: d.createdAt,
    })),
  };
}
```

---

### `src/assess/amendment.ts` (service, validation + formatting)

**Analog:** `src/found/quality-check.ts`

**Pattern:** Validates state (amendments are accepted/rejected per item) and formats output (dated changelog entries). Per D-07, default-NO: all amendments start unaccepted.

**Validation pattern** (quality-check.ts lines 150–182):
```typescript
export interface QualityCheckResult {
  isValid: boolean;
  missingRequiredSlots: string[];
  emptyOptionalSlots: string[];
  errors: string[];
}

export function checkVisionQuality(vision: FilledVision): QualityCheckResult {
  const required = ["mission", "mandate", "voice", "principles", "success_criteria"];
  const missing = vision.slotsEmpty.filter(slot => required.includes(slot));
  
  const errors: string[] = [];
  if (missing.length > 0) {
    errors.push(`Missing required slots: ${missing.join(", ")}`);
  }
  
  return {
    isValid: errors.length === 0,
    missingRequiredSlots: missing,
    emptyOptionalSlots: vision.slotsEmpty.filter(s => !required.includes(s)),
    errors,
  };
}
```

**For amendment.ts, follow this pattern:**
```typescript
import type { DriftItem, ParsedVision } from "../types/assess.js";

/**
 * Amendment state: validates which items are accepted + formats changelog.
 * Per D-07 (default-NO), every drift item starts unaccepted.
 * Founder must explicitly accept each item before Apply.
 *
 * Amendment format (D-07): dated changelog entry at bottom of VISION.md
 * Example: "- 2026-05-03: Updated voice section after Q2 drift audit. Reason: 12 issues used "casual" copy in conflict with original "professional" voice direction."
 */

export interface AmendmentState {
  /** Map of drift item ID → accepted boolean */
  acceptances: Record<string, boolean>;
  
  /** Count of accepted amendments ready for Apply */
  acceptedCount: number;
  
  /** Count of rejected amendments (archived, not applied) */
  rejectedCount: number;
}

/**
 * Track amendment acceptance state.
 * Per D-07, default-NO: founder must explicitly accept each item.
 */
export function createAmendmentState(items: DriftItem[]): AmendmentState {
  const acceptances: Record<string, boolean> = {};
  items.forEach(item => {
    acceptances[item.id] = false; // Default: not accepted
  });
  
  return {
    acceptances,
    acceptedCount: 0,
    rejectedCount: 0,
  };
}

/**
 * Toggle acceptance for a single amendment item.
 */
export function toggleAmendment(state: AmendmentState, itemId: string): AmendmentState {
  const newState = { ...state };
  newState.acceptances[itemId] = !newState.acceptances[itemId];
  
  newState.acceptedCount = Object.values(newState.acceptances).filter(v => v).length;
  newState.rejectedCount = Object.values(newState.acceptances).filter(v => !v).length;
  
  return newState;
}

/**
 * Format amendment changelog entry.
 * Per D-07, format: dated, timestamped, includes founder identity (if SDK exposes).
 * Example: "- 2026-05-03: Updated voice section after Q2 drift audit. Reason: 12 issues used "casual" copy in conflict with original "professional" voice direction."
 */
export function formatAmendmentLogEntry(
  items: DriftItem[],
  acceptedOnly: boolean = true
): string {
  const accepted = acceptedOnly ? items.filter(i => i.accepted) : items;
  if (accepted.length === 0) return "";
  
  const today = new Date().toISOString().split("T")[0];
  const sections = Array.from(new Set(accepted.map(i => i.visionSection))).join(", ");
  const reasonCount = accepted.length;
  
  return `- ${today}: Updated ${sections} after Assess audit. Reason: ${reasonCount} evidence item(s) detected drift from documented vision.`;
}

/**
 * Validate amendment changes before Apply.
 * Ensures: amendments are accepted, proposed changes are non-empty, etc.
 */
export interface AmendmentValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateAmendments(items: DriftItem[], state: AmendmentState): AmendmentValidationResult {
  const errors: string[] = [];
  
  const accepted = items.filter(i => state.acceptances[i.id]);
  if (accepted.length === 0) {
    errors.push("No amendments accepted. Select at least one to apply.");
  }
  
  for (const item of accepted) {
    if (!item.proposedAmendment || item.proposedAmendment.trim().length === 0) {
      errors.push(`Amendment for ${item.visionSection} has no proposed change.`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
```

---

### `src/assess/cascade.ts` (orchestrator, batch + event-driven)

**Analog:** `src/found/apply.ts` cascade step (issue creation part)

**Pattern:** Creates downstream issues per affected agents. Per D-12 and D-13, screens out newly-provisioned agents (< 7 days, no heartbeat). Per D-14, surfaces custom-override warnings.

**Batch creation pattern** (apply.ts lines 387–398):
```typescript
async function createKickoffIssues(
  ctx: PluginContext,
  companyId: string,
  preset: PresetDefinition,
  agentIds: string[]
): Promise<string[]> {
  const issueIds: string[] = [];
  for (const agentId of agentIds) {
    const issue = await ctx.issues.create({
      companyId,
      title: `Kickoff: ${agentId}`,
      description: "Company founded. Begin heartbeat.",
    });
    issueIds.push(issue.id);
  }
  return issueIds;
}
```

**For cascade.ts, follow this pattern:**
```typescript
import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { DriftItem, ParsedVision } from "../types/assess.js";
import { PaperclipAdapter } from "../sdk/adapter.js";

/**
 * Cascade drift amendments to affected agents.
 * Per D-12, walks affected agents per amended VISION section.
 * Per D-13, screens out newly-provisioned agents (< 7 days).
 * Per D-14, detects custom overrides and surfaces warnings.
 *
 * Creates kickoff-style issues per affected agent with explicit linking
 * back to VISION amendment via issue body reference.
 *
 * @param ctx Plugin context
 * @param companyId Company being audited
 * @param vision Current parsed VISION
 * @param acceptedItems DriftItems that founder accepted
 * @param assessRunId Assess run ID for idempotency
 * @returns Cascade issue IDs created + warnings (custom overrides)
 */
export async function cascadeDriftAmendments(
  ctx: PluginContext,
  companyId: string,
  vision: ParsedVision,
  acceptedItems: DriftItem[],
  assessRunId: string
): Promise<{ issueIds: string[]; overrideWarnings: string[] }> {
  const adapter = new PaperclipAdapter(ctx);
  
  // Map amended sections to affected agents
  const affectedAgentIds = new Set<string>();
  const sectionToAgents = mapSectionToAgents(vision);
  
  for (const item of acceptedItems) {
    const agents = sectionToAgents[item.visionSection] || [];
    agents.forEach(id => affectedAgentIds.add(id));
  }
  
  // Screen out newly-provisioned agents (< 7 days, no heartbeat)
  const agents = await adapter.listAgents({ companyId });
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const eligibleAgents = agents.filter(a => {
    const created = new Date(a.createdAt);
    const hasHeartbeat = a.lastHeartbeatAt !== null;
    return created < sevenDaysAgo || hasHeartbeat;
  });
  
  const issueIds: string[] = [];
  const overrideWarnings: string[] = [];
  
  // Create cascading issues per agent
  for (const agent of eligibleAgents) {
    if (!affectedAgentIds.has(agent.id)) continue;
    
    // Check for custom overrides (D-14)
    if (agent.adapterConfig?.instructions && hasCustomOverride(agent)) {
      overrideWarnings.push(
        `Agent ${agent.name} has custom instruction overrides. Cascade will overlay the new changes.`
      );
    }
    
    // Create issue linking back to amendments
    const issueTitle = `Cascading update from VISION drift audit`;
    const issueBody = formatCascadeIssue(agent, acceptedItems, assessRunId);
    
    const issue = await adapter.createIssue({
      companyId,
      title: issueTitle,
      description: issueBody,
      linkedDocuments: [
        { key: `compass:assess:cascade:${assessRunId}`, title: "VISION Amendment" },
      ],
    });
    
    issueIds.push(issue.id);
  }
  
  return { issueIds, overrideWarnings };
}

function mapSectionToAgents(vision: ParsedVision): Record<string, string[]> {
  // Per strategy (voice affects customer-facing agents, principles affect all, etc.)
  // This is a simplified example; real logic depends on agent roles
  return {
    voice: ["agent-ceo", "agent-customer-success"],
    principles: ["agent-ceo", "agent-eng", "agent-product", "agent-customer-success"],
    mission: ["agent-ceo"],
    mandate: ["agent-ceo"],
    // ... etc
  };
}

function hasCustomOverride(agent: any): boolean {
  // Check if agent's instructionsBundleMode indicates custom overrides
  return agent.adapterConfig?.instructionsBundleMode === "external" ||
         (agent.adapterConfig?.customInstructionsApplied ?? false);
}

function formatCascadeIssue(agent: any, items: DriftItem[], assessRunId: string): string {
  const changedSections = Array.from(new Set(items.map(i => i.visionSection))).join(", ");
  return `
Following a VISION drift audit, the following sections were updated: ${changedSections}

The following changes should be incorporated into your instructions:
${items.map(i => `- ${i.visionSection}: ${i.proposedAmendment}`).join("\n")}

Run ID: ${assessRunId}
Reference: compass:assess:cascade:${assessRunId}
  `;
}
```

---

### `src/assess/apply.ts` (orchestrator, request-response + batch)

**Analog:** `src/found/apply.ts`

**Pattern:** Orchestrates sequential writes with rollback on failure. Phase 3 Apply mirrors Phase 2 pattern but with assess-specific writes: VISION amendment → cascade issues → wakeup notifications.

**Orchestration pattern** (found/apply.ts lines 90–360):
```typescript
export async function applyFound(
  ctx: PluginContext,
  companyId: string,
  vision: FilledVision,
  preset: PresetDefinition,
  selectedPresetId: string
): Promise<ApplyResult> {
  const adapter = new PaperclipAdapter(ctx);
  const applyRunId = generateApplyRunId();
  const result: ApplyResult = { success: false };
  
  try {
    // Step 1: Write VISION
    const visionDocId = await writeVisionDocument(ctx, companyId, vision.body);
    audit.push({ step: "vision-write", success: true, docId: visionDocId });
    result.visionDocId = visionDocId;
    
    // Step 2: Provision agents
    const agentIds = await provisionAgents(ctx, companyId, preset);
    
    // Step 3: Create issues
    const issueIds = await createKickoffIssues(ctx, companyId, preset, agentIds);
    
    // Step 4: Queue wakeups (last)
    await queueWakeups(ctx, companyId, agentIds, applyRunId);
    
    result.success = true;
    return result;
  } catch (err) {
    // Rollback in reverse order
    // ...
  }
}
```

**For assess/apply.ts, follow this pattern:**
```typescript
import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { ParsedVision, DriftItem } from "../types/assess.js";
import { PaperclipAdapter, type AuditLogEntry } from "../sdk/adapter.js";
import { cascadeDriftAmendments } from "./cascade.js";
import { formatAmendmentLogEntry } from "./amendment.js";
import { generateIdempotencyKey, generateApplyRunId } from "../found/idempotency.js";

/**
 * Apply step for Assess mode: writes VISION amendments and cascades to agents.
 * Per D-15 (extends Phase 2 D-09), uses preflight → sequential write → compensating rollback pattern.
 *
 * Write order:
 * 1. Update VISION.md document with amendments + changelog entry
 * 2. Create cascading issues for affected agents
 * 3. Queue wakeup notifications for affected agents
 *
 * On any write failure, rollback in REVERSE order.
 * All writes route through adapter (XC-01). Idempotency keys per XC-03.
 */

export interface AssessApplyResult {
  success: boolean;
  visionDocId?: string;
  cascadeIssueIds?: string[];
  wakeupCount?: number;
  amendmentLogEntry?: string;
  errors?: string[];
  rollbackApplied?: boolean;
  rollbackErrors?: string[];
  auditLog?: AuditLogEntry[];
}

export async function applyAssess(
  ctx: PluginContext,
  companyId: string,
  currentVision: ParsedVision,
  acceptedItems: DriftItem[],
  approvalMode: "founder" | "founder+ceo"
): Promise<AssessApplyResult> {
  const adapter = new PaperclipAdapter(ctx);
  const applyRunId = generateApplyRunId();
  const result: AssessApplyResult = { success: false };
  const audit: AuditLogEntry[] = [];
  
  try {
    // Step 1: Update VISION.md with amendments
    const amendmentEntry = formatAmendmentLogEntry(acceptedItems);
    const updatedVision: ParsedVision = {
      ...currentVision,
      amendments: [
        ...(currentVision.amendments || []),
        { date: new Date().toISOString().split("T")[0], summary: amendmentEntry },
      ],
    };
    
    const visionBody = serializeVision(updatedVision);
    const visionDocId = await adapter.writeDocument({
      companyId,
      title: "VISION.md",
      content: visionBody,
      idempotencyKey: `compass:assess:${companyId}:vision:${applyRunId}`,
    });
    
    audit.push({
      step: "vision-amend",
      success: true,
      timestamp: new Date().toISOString(),
      resourceId: visionDocId,
    });
    result.visionDocId = visionDocId;
    result.amendmentLogEntry = amendmentEntry;
    
    // Step 2: Cascade to affected agents
    const { issueIds, overrideWarnings } = await cascadeDriftAmendments(
      ctx,
      companyId,
      updatedVision,
      acceptedItems,
      applyRunId
    );
    
    audit.push({
      step: "cascade-issues",
      success: true,
      timestamp: new Date().toISOString(),
      resourceId: issueIds.join(","),
    });
    result.cascadeIssueIds = issueIds;
    
    // Step 3: Queue wakeups for affected agents
    const affectedAgentIds = await getAffectedAgentIds(ctx, companyId, acceptedItems);
    let wakeupCount = 0;
    
    for (const agentId of affectedAgentIds) {
      const idempotencyKey = generateIdempotencyKey(
        companyId,
        agentId,
        `assess:${applyRunId}`
      );
      
      await adapter.queueWakeup({
        companyId,
        agentId,
        reason: "VISION drift amendments applied",
        idempotencyKey,
      });
      wakeupCount++;
    }
    
    audit.push({
      step: "wakeup-queue",
      success: true,
      timestamp: new Date().toISOString(),
      resourceId: `${wakeupCount} wakeups`,
    });
    result.wakeupCount = wakeupCount;
    
    result.success = true;
    result.auditLog = audit;
    return result;
    
  } catch (err) {
    // Rollback in reverse order: cascade issues, then VISION
    const rollbackErrors: string[] = [];
    
    // Rollback cascade issues
    if (result.cascadeIssueIds) {
      for (const issueId of result.cascadeIssueIds) {
        try {
          await adapter.deleteIssue(issueId, companyId);
        } catch (e) {
          rollbackErrors.push(`Failed to delete cascade issue ${issueId}: ${e}`);
        }
      }
    }
    
    // Rollback VISION (revert to original)
    if (result.visionDocId) {
      try {
        // Revert VISION to previous version (ideally via version history)
        // For now, could delete and recreate from backup or signal error
        rollbackErrors.push(`Manual review needed to revert VISION.md`);
      } catch (e) {
        rollbackErrors.push(`Failed to revert VISION.md: ${e}`);
      }
    }
    
    result.success = false;
    result.rollbackApplied = rollbackErrors.length === 0;
    result.rollbackErrors = rollbackErrors;
    result.errors = [`Apply failed: ${err}`, ...rollbackErrors];
    result.auditLog = audit;
    
    return result;
  }
}

async function getAffectedAgentIds(
  ctx: PluginContext,
  companyId: string,
  items: DriftItem[]
): Promise<string[]> {
  // Map sections to agent IDs (simplified)
  const agentIds = new Set<string>();
  
  for (const item of items) {
    if (item.visionSection === "voice" || item.visionSection === "principles") {
      // Customer-facing agents
      agentIds.add("agent-ceo");
      agentIds.add("agent-customer-success");
    }
    if (item.visionSection === "principles") {
      // All agents care about principles
      agentIds.add("agent-eng");
      agentIds.add("agent-product");
    }
  }
  
  return Array.from(agentIds);
}
```

---

### `src/ui/assess/AssessPanel.tsx` (orchestrator, mode controller)

**Analog:** `src/ui/found/FoundPanel.tsx`

**Pattern:** Orchestrates sub-components via state machine. Per D-17, mid-run state persists in worker-state so founder can leave and return without re-running detection.

**Mode controller structure** (found/FoundPanel.tsx lines 33–100):
```typescript
type FoundStep = "interview" | "preview" | "confirming" | "applying" | "complete" | "error";

export function FoundPanel(): React.ReactElement {
  const [step, setStep] = useState<FoundStep>("interview");
  const [vision, setVision] = useState<FilledVision | null>(null);
  
  if (step === "interview") {
    return <InterviewSection ... />;
  }
  
  if (step === "preview" && vision) {
    return <VisionPreview ... />;
  }
  
  // ... other steps
}
```

**For assess/AssessPanel.tsx, follow this pattern:**
```typescript
import React, { useState, useEffect, useCallback } from "react";
import { usePluginData, usePluginAction } from "@paperclipai/plugin-sdk/ui";
import { DriftReportPanel } from "./DriftReportPanel.js";
import { ApprovalRoutingModal } from "./ApprovalRoutingModal.js";
import { ConfirmationModal } from "../ui/found/ConfirmationModal.js"; // Reused from Phase 2
import { ApplyProgress } from "../ui/found/ApplyProgress.js"; // Reused from Phase 2
import { ApprovingWaitingState } from "./ApprovingWaitingState.js";
import type { DriftReport, DriftItem } from "../types/assess.js";

type AssessStep = 
  | "empty" 
  | "running" 
  | "report" 
  | "preview" 
  | "confirming" 
  | "applying" 
  | "waiting-approval" 
  | "complete" 
  | "error";

/**
 * AssessPanel — Orchestrates Assess mode end-to-end.
 * Per D-17, mid-run state persists in worker-state (compass:assess:run:${company_id}).
 */
export function AssessPanel(): React.ReactElement {
  const [step, setStep] = useState<AssessStep>("empty");
  const [driftReport, setDriftReport] = useState<DriftReport | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [routingMode, setRoutingMode] = useState<"founder" | "founder+ceo">("founder");
  const [showRoutingModal, setShowRoutingModal] = useState(false);

  // Load company from context
  const { data: company } = usePluginData("getCurrentCompany", {});
  const companyId = company?.id;

  // Check if VISION exists
  const { data: visionDoc } = usePluginData("getVisionDocument", { companyId });

  // Load cached drift run if available
  const { data: cachedRun } = usePluginData("getAssessRun", { companyId });

  // Action handlers
  const runAssess = usePluginAction("runAssess");
  const confirmAmendments = usePluginAction("confirmAmendments");

  const handleRunAssess = useCallback(async () => {
    if (!companyId) return;
    setStep("running");
    
    try {
      const report = await runAssess({ companyId });
      setDriftReport(report);
      setStep("report");
    } catch (err) {
      console.error("Assess failed:", err);
      setStep("error");
    }
  }, [companyId, runAssess]);

  const handleSelectItem = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  }, []);

  const handleApplyAmendments = useCallback(() => {
    setStep("preview");
  }, []);

  const handleConfirmApply = useCallback(async () => {
    if (!companyId || !driftReport) return;
    
    setStep(routingMode === "founder+ceo" ? "confirming" : "applying");
    
    try {
      const acceptedItems = driftReport.itemsBySection
        .flatMap(items => items)
        .filter(item => selectedItems.has(item.id));
      
      if (routingMode === "founder+ceo") {
        // Queue for CEO approval
        await confirmAmendments({ companyId, items: acceptedItems, routingMode });
        setStep("waiting-approval");
      } else {
        // Apply directly
        setStep("applying");
        // Actual apply happens via worker handler
      }
    } catch (err) {
      console.error("Apply failed:", err);
      setStep("error");
    }
  }, [companyId, driftReport, selectedItems, routingMode, confirmAmendments]);

  // Initial render: decide if empty, has cached run, or needs new run
  useEffect(() => {
    if (!visionDoc) {
      setStep("empty");
      return;
    }
    
    if (cachedRun) {
      setDriftReport(cachedRun);
      setStep("report");
    } else {
      setStep("empty");
    }
  }, [visionDoc, cachedRun]);

  if (step === "empty") {
    return (
      <div className="flex flex-col gap-lg h-full">
        <h2 className="text-display font-bold">Assess your vision</h2>
        <p className="text-body text-foreground/70">
          Audit your company's recent work against your vision document. This helps you stay aligned as you grow.
        </p>
        
        {!visionDoc && (
          <div className="bg-card p-lg rounded border border-border">
            <p className="text-body">Create a vision document first by running Found mode.</p>
          </div>
        )}
        
        <button
          onClick={handleRunAssess}
          disabled={!visionDoc}
          className="px-lg py-md rounded bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
        >
          Run a drift audit
        </button>
      </div>
    );
  }

  if (step === "running") {
    return <div className="text-body">Detecting drift… Please wait.</div>;
  }

  if (step === "report" && driftReport) {
    return (
      <div className="flex flex-col gap-lg h-full">
        <div className="flex items-center justify-between">
          <h2 className="text-heading font-bold">{company?.name}</h2>
          <button
            onClick={() => setShowRoutingModal(true)}
            className="text-label text-accent hover:underline"
          >
            Routing: {routingMode}
          </button>
        </div>
        
        <DriftReportPanel
          report={driftReport}
          selectedItems={selectedItems}
          onSelectItem={handleSelectItem}
        />
        
        <button
          onClick={handleApplyAmendments}
          disabled={selectedItems.size === 0}
          className="px-lg py-md rounded bg-accent text-accent-foreground disabled:opacity-50"
        >
          Apply {selectedItems.size} amendment{selectedItems.size !== 1 ? "s" : ""}
        </button>
      </div>
    );
  }

  if (step === "preview" && driftReport) {
    // Show preview of accepted amendments
    const accepted = driftReport.itemsBySection
      .flatMap(items => items)
      .filter(item => selectedItems.has(item.id));
    
    return (
      <div className="flex flex-col gap-lg h-full">
        <h2 className="text-heading font-bold">Review amendments before applying</h2>
        
        {accepted.map(item => (
          <div key={item.id} className="border-b border-border pb-lg">
            <h3 className="text-label font-bold">{item.visionSection}</h3>
            <p className="text-body whitespace-pre-wrap">{item.proposedAmendment}</p>
          </div>
        ))}
        
        <div className="flex gap-md justify-end pt-lg border-t border-border">
          <button
            onClick={() => setStep("report")}
            className="px-md py-sm rounded border border-border"
          >
            Back
          </button>
          <button
            onClick={handleConfirmApply}
            className="px-md py-sm rounded bg-accent text-accent-foreground"
          >
            Confirm & apply
          </button>
        </div>
      </div>
    );
  }

  if (step === "confirming") {
    return (
      <ConfirmationModal
        title="Apply amendments to your vision"
        description="Apply will update your VISION.md and notify affected agents."
        onConfirm={handleConfirmApply}
        onCancel={() => setStep("preview")}
      />
    );
  }

  if (step === "applying") {
    return <ApplyProgress step="vision-amend" />;
  }

  if (step === "waiting-approval") {
    return (
      <ApprovingWaitingState
        submittedAt={new Date()}
        onRefresh={async () => {
          // Poll for approval result
        }}
      />
    );
  }

  if (step === "complete") {
    return (
      <div className="text-body">
        ✓ Amendments applied!
        <p className="text-foreground/70">Your vision document has been updated.</p>
      </div>
    );
  }

  if (step === "error") {
    return <div className="text-destructive">Apply failed. Please try again.</div>;
  }

  return null;
}
```

---

### `src/ui/assess/DriftReportPanel.tsx` (component, display)

**Analog:** `src/ui/found/VisionPreview.tsx`

**Pattern:** Renders grouped display of items (Vision sections in Found, Drift items by section in Assess). Collapsible, read-only by default.

**Display pattern** (found/VisionPreview.tsx lines 730–802):
```typescript
export function VisionPreview({
  vision,
  preset,
  onBack,
  onConfirm,
}: VisionPreviewProps): React.ReactElement {
  const [editing, setEditing] = useState(false);
  
  return (
    <div className="flex flex-col gap-lg h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-heading font-bold">Here's the company you're founding...</h2>
      </div>

      <div className="flex-1 overflow-y-auto border border-border rounded p-lg bg-background">
        {editing ? <textarea ... /> : <div className="prose ...">Rendered markdown</div>}
      </div>

      <ProvisioningSummary preset={preset} />
      
      <div className="flex gap-md justify-between pt-lg border-t border-border">
        <button onClick={onBack}>Back to interview</button>
        <button onClick={onConfirm}>Confirm & apply</button>
      </div>
    </div>
  );
}
```

**For drift/DriftReportPanel.tsx, follow this pattern:**
```typescript
import React, { useState } from "react";
import { DriftItemCard } from "./DriftItemCard.js";
import type { DriftReport, DriftItem } from "../types/assess.js";

interface DriftReportPanelProps {
  report: DriftReport;
  selectedItems: Set<string>;
  onSelectItem: (itemId: string) => void;
}

/**
 * DriftReportPanel — Renders grouped drift items by VISION section.
 * Per D-16 and UI-SPEC, groups by section, shows evidence, confidence, proposed amendment.
 * Items are collapsible diffs; founder can toggle accept/reject per item.
 */
export function DriftReportPanel({
  report,
  selectedItems,
  onSelectItem,
}: DriftReportPanelProps): React.ReactElement {
  const sections = Object.keys(report.itemsBySection).sort();

  return (
    <div className="flex flex-col gap-lg flex-1 overflow-y-auto">
      {sections.map(sectionName => {
        const items = report.itemsBySection[sectionName] || [];
        if (items.length === 0) return null;

        const maxConfidence = Math.max(...items.map(i => i.confidence));
        const severity = maxConfidence > 0.7 ? "blocker" : maxConfidence > 0.5 ? "warn" : "info";

        return (
          <div key={sectionName} className="space-y-md">
            <h3 className="text-heading font-bold">
              {sectionName} — {Math.round(maxConfidence * 100)}% drift detected
              <span className="ml-sm text-label text-destructive">{severity}</span>
            </h3>

            <div className="space-y-sm">
              {items.map(item => (
                <DriftItemCard
                  key={item.id}
                  item={item}
                  selected={selectedItems.has(item.id)}
                  onToggle={() => onSelectItem(item.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

---

### `src/ui/assess/DriftItemCard.tsx` (component, display + interaction)

**Analog:** `src/ui/found/ProvisioningSummary.tsx` + `QuestionRenderer.tsx` toggle pattern

**Pattern:** Renders single item with collapsible details, interactive toggle (accept/reject). Per D-16, shows confidence bar, evidence chips, proposed amendment diff.

**Collapsible display + interaction** (ProvisioningSummary.tsx lines 1108–1141):
```typescript
export function ProvisioningSummary({
  preset,
}: ProvisioningSummaryProps): React.ReactElement {
  if (!preset) return <div />;

  return (
    <div className="space-y-md border-t border-border pt-lg">
      <h3 className="text-heading font-bold">When you apply</h3>
      <div className="space-y-sm">
        <div>
          <p className="text-label font-medium">Agents to create</p>
          <ul className="mt-sm space-y-xs">
            {preset.agents.map(agent => (
              <li key={agent.id} className="text-body text-foreground/70">{agent.name}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
```

**For drift/DriftItemCard.tsx, follow this pattern:**
```typescript
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ConfidenceBar } from "./ConfidenceBar.js";
import { EvidenceChip } from "./EvidenceChip.js";
import { AmendmentDiff } from "./AmendmentDiff.js";
import type { DriftItem } from "../types/assess.js";

interface DriftItemCardProps {
  item: DriftItem;
  selected: boolean;
  onToggle: () => void;
}

/**
 * DriftItemCard — Single drift item with confidence bar, evidence, amendment diff, accept/reject toggle.
 * Per D-16 (UI-SPEC), collapsible amendment details, color-coded confidence bar, evidence chips.
 */
export function DriftItemCard({
  item,
  selected,
  onToggle,
}: DriftItemCardProps): React.ReactElement {
  const [showDiff, setShowDiff] = useState(false);

  return (
    <div className="border border-border rounded p-lg space-y-md bg-card">
      {/* Header: confidence bar + percentage */}
      <div className="flex items-center gap-md">
        <ConfidenceBar confidence={item.confidence} />
        <span className="text-label text-foreground/70">{Math.round(item.confidence * 100)}% confidence</span>
      </div>

      {/* Evidence section */}
      <div className="space-y-xs">
        <h4 className="text-label font-bold">Evidence</h4>
        <div className="flex gap-xs flex-wrap">
          {item.evidence.slice(0, 5).map(e => (
            <EvidenceChip key={e.id} evidence={e} />
          ))}
          {item.evidence.length > 5 && (
            <button className="text-label text-accent hover:underline">
              See all {item.evidence.length} evidence items
            </button>
          )}
        </div>
      </div>

      {/* Amendment proposal (collapsible) */}
      <div className="space-y-xs">
        <button
          onClick={() => setShowDiff(!showDiff)}
          className="text-label font-bold flex gap-xs items-center text-accent hover:underline"
        >
          <ChevronDown className={`h-4 w-4 ${showDiff ? "rotate-180" : ""}`} />
          Proposed amendment
        </button>
        {showDiff && (
          <div className="bg-background p-md rounded">
            <AmendmentDiff diff={item.proposedAmendment} />
          </div>
        )}
      </div>

      {/* Accept/Reject buttons */}
      <div className="flex gap-md pt-md border-t border-border">
        <button
          onClick={onToggle}
          className={`flex-1 px-md py-sm rounded transition-colors ${
            selected
              ? "bg-accent text-accent-foreground"
              : "border border-border text-foreground hover:bg-card"
          }`}
        >
          {selected ? "✓ Accept" : "Accept"}
        </button>
        <button
          onClick={onToggle}
          className={`flex-1 px-md py-sm rounded transition-colors ${
            !selected
              ? "bg-destructive/10 text-destructive"
              : "border border-border text-foreground hover:bg-card"
          }`}
        >
          {!selected ? "✗ Reject" : "Reject"}
        </button>
      </div>
    </div>
  );
}
```

---

### `src/ui/assess/ConfidenceBar.tsx` (component, visual)

**Analog:** Phase 2 design tokens (no code analog; new visual component per UI-SPEC)

**Pattern:** Horizontal bar showing confidence level (0..1) with color-coded zones and percentage label. Per UI-SPEC § Confidence Bar Styling.

**New visual component:**
```typescript
import React from "react";

interface ConfidenceBarProps {
  confidence: number; // 0..1
}

/**
 * ConfidenceBar — 8px horizontal bar color-coded by confidence level.
 * Per UI-SPEC:
 * - Red (0.0–0.33): Low confidence
 * - Yellow (0.33–0.66): Medium confidence
 * - Green (0.66–1.0): High confidence
 */
export function ConfidenceBar({ confidence }: ConfidenceBarProps): React.ReactElement {
  const percentage = Math.round(confidence * 100);
  
  // Determine color zone
  let colorClass = "bg-destructive"; // Red: low
  if (confidence > 0.66) {
    colorClass = "bg-accent"; // Green: high
  } else if (confidence > 0.33) {
    colorClass = "bg-amber-500"; // Yellow: medium
  }

  return (
    <div className="w-full h-2 bg-card rounded overflow-hidden">
      <div
        className={`h-full ${colorClass} transition-all`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
```

---

### `src/ui/assess/EvidenceChip.tsx` (component, interactive)

**Analog:** `src/ui/found/SectionNavRail.tsx` button pattern

**Pattern:** Clickable chip showing evidence source (Issue / Comment / Document) with icon. Navigates to source in Paperclip.

**Interactive element pattern** (SectionNavRail.tsx lines 962–989):
```typescript
{sections.map((section, idx) => (
  <button
    key={idx}
    onClick={() => idx <= currentSectionIndex && onJumpTo(idx)}
    className={`shrink-0 flex items-center gap-xs px-md py-sm rounded text-sm font-medium transition-colors ...`}
  >
    {completedSections.includes(idx) && <CheckCircle className="h-4 w-4" />}
    {section.title}
  </button>
))}
```

**For assess/EvidenceChip.tsx, follow this pattern:**
```typescript
import React from "react";
import { MessageCircle, FileText, AlertCircle } from "lucide-react";
import type { EvidenceItem } from "../types/assess.js";

interface EvidenceChipProps {
  evidence: EvidenceItem;
}

/**
 * EvidenceChip — Clickable source reference (Issue / Comment / Document).
 * Per D-03 (UI-SPEC), shows source icon + label, navigates to source in Paperclip.
 */
export function EvidenceChip({ evidence }: EvidenceChipProps): React.ReactElement {
  const handleClick = () => {
    // Navigate to source in Paperclip (implementation depends on host SDK)
    // Example: window.location.hash = `#issue/${evidence.id}`
  };

  const Icon = 
    evidence.type === "issue" ? AlertCircle :
    evidence.type === "comment" ? MessageCircle :
    FileText;

  return (
    <button
      onClick={handleClick}
      className="flex gap-xs items-center px-sm py-xs rounded bg-card border border-border text-label hover:border-accent transition-colors"
    >
      <Icon className="h-3 w-3" />
      <span className="text-xs font-medium">
        {evidence.type === "issue" && `Issue #${evidence.id.slice(-4)}`}
        {evidence.type === "comment" && `Comment in #${evidence.id.slice(-4)}`}
        {evidence.type === "document" && `Document: ${evidence.id}`}
      </span>
    </button>
  );
}
```

---

### `src/ui/assess/AmendmentDiff.tsx` (component, display)

**Analog:** `src/ui/found/VisionPreview.tsx` markdown rendering

**Pattern:** Renders unified diff (markdown format) in collapsible block. Per D-08 and UI-SPEC, shows before/after lines with syntax highlighting via color/weight contrast.

**Markdown display pattern** (VisionPreview.tsx lines 767–803):
```typescript
function renderMarkdown(body: string): React.ReactElement {
  return <div dangerouslySetInnerHTML={{ __html: body }} />;
}
```

**For assess/AmendmentDiff.tsx, follow this pattern (custom regex, no heavy diff lib):**
```typescript
import React from "react";

interface AmendmentDiffProps {
  diff: string; // Markdown delta, e.g., "- old\n+ new"
}

/**
 * AmendmentDiff — Unified diff viewer (markdown format).
 * Per D-08 (UI-SPEC), renders before/after lines with color-coded syntax.
 * Uses proportional font with color/weight contrast (no monospace for v1).
 */
export function AmendmentDiff({ diff }: AmendmentDiffProps): React.ReactElement {
  const lines = diff.split("\n");

  return (
    <div className="space-y-xs text-sm">
      {lines.map((line, idx) => {
        const isRemoved = line.startsWith("- ");
        const isAdded = line.startsWith("+ ");
        
        if (isRemoved) {
          return (
            <div key={idx} className="text-destructive bg-destructive/5 px-sm py-xs rounded">
              {line}
            </div>
          );
        }
        
        if (isAdded) {
          return (
            <div key={idx} className="text-accent bg-accent/5 px-sm py-xs rounded font-medium">
              {line}
            </div>
          );
        }
        
        return (
          <div key={idx} className="text-foreground/70">
            {line}
          </div>
        );
      })}
    </div>
  );
}
```

---

### `src/ui/assess/ApprovalRoutingModal.tsx` (component, modal)

**Analog:** `src/ui/found/PresetSelector.tsx` radio pattern

**Pattern:** Radio choice (founder | founder+ceo), saves to worker-state, shows confirmation toast. Per D-09 and UI-SPEC § Approval Routing Mode Change Modal.

**Radio selection pattern** (PresetSelector.tsx lines 1060–1084):
```typescript
export function PresetSelector({
  presets,
  selected,
  onSelect,
  disabled,
}: PresetSelectorProps): React.ReactElement {
  return (
    <div className="space-y-md">
      <label className="text-label font-medium">Choose a founding preset</label>
      <div className="space-y-sm">
        {presets.map(preset => (
          <label key={preset.id} className="flex gap-md p-md border border-border rounded hover:bg-card cursor-pointer">
            <input
              type="radio"
              name="preset"
              value={preset.id}
              checked={selected === preset.id}
              onChange={() => !disabled && onSelect(preset.id)}
              disabled={disabled}
            />
            <div className="flex-1">
              <div className="text-body font-medium">{preset.name}</div>
              <div className="text-label text-foreground/70">{preset.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
```

**For assess/ApprovalRoutingModal.tsx, follow this pattern:**
```typescript
import React, { useState } from "react";
import { usePluginAction } from "@paperclipai/plugin-sdk/ui";

interface ApprovalRoutingModalProps {
  current: "founder" | "founder+ceo";
  onClose: () => void;
  onSaved?: () => void;
}

/**
 * ApprovalRoutingModal — Radio choice between founder-only and founder+ceo routing.
 * Per D-09 and UI-SPEC, saves new routing mode to worker-state config.
 */
export function ApprovalRoutingModal({
  current,
  onClose,
  onSaved,
}: ApprovalRoutingModalProps): React.ReactElement {
  const [selected, setSelected] = useState<"founder" | "founder+ceo">(current);
  const saveRouting = usePluginAction("saveApprovalRouting");

  const handleSave = async () => {
    try {
      await saveRouting({ routingMode: selected });
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to save routing:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg shadow-lg max-w-md w-full mx-lg p-lg">
        <h2 className="text-heading font-bold mb-md">Approval routing</h2>

        <div className="space-y-md mb-lg">
          <p className="text-body">How should amendments be approved?</p>

          <div className="space-y-sm">
            {[
              {
                value: "founder" as const,
                label: "Founder only",
                desc: "Amendments apply immediately after your approval",
              },
              {
                value: "founder+ceo" as const,
                label: "Founder + CEO agent",
                desc: "Amendments queued for CEO review",
              },
            ].map(option => (
              <label
                key={option.value}
                className="flex gap-md p-md border border-border rounded hover:bg-card cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="routing"
                  value={option.value}
                  checked={selected === option.value}
                  onChange={() => setSelected(option.value)}
                />
                <div className="flex-1">
                  <div className="text-body font-medium">{option.label}</div>
                  <div className="text-label text-foreground/70">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-md justify-end pt-lg border-t border-border">
          <button
            onClick={onClose}
            className="px-md py-sm rounded border border-border text-foreground hover:bg-card"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-md py-sm rounded bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Save routing
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### `src/ui/assess/ApprovingWaitingState.tsx` (component, status)

**Analog:** `src/ui/found/ApplyProgress.tsx` + polling pattern

**Pattern:** Shows "Waiting for CEO approval" with submitted time, refresh button, helper text. Per D-10 and UI-SPEC § Founder+CEO Approval Waiting State.

**Status display + action pattern** (ApplyProgress.tsx lines 1161–1199):
```typescript
export function ApplyProgress({
  step,
  progress,
}: ApplyProgressProps): React.ReactElement {
  const steps = [
    { key: "preflight", label: "Validating setup…" },
    { key: "doc", label: "Writing vision document…" },
    // ...
  ];

  return (
    <div className="space-y-md">
      {steps.map(s => (
        <div key={s.key} className="flex gap-md items-start">
          {progress[s.key] ? (
            <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          ) : (
            <Loader className="h-5 w-5 text-accent animate-spin flex-shrink-0 mt-0.5" />
          )}
          <div className="text-body">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
```

**For assess/ApprovingWaitingState.tsx, follow this pattern:**
```typescript
import React, { useState, useCallback } from "react";
import { usePluginAction } from "@paperclipai/plugin-sdk/ui";

interface ApprovingWaitingStateProps {
  submittedAt: Date;
  onApprovalDecided?: (approved: boolean) => void;
}

/**
 * ApprovingWaitingState — Waiting for CEO approval in founder+ceo mode.
 * Per D-10 and UI-SPEC, shows submitted time, refresh button, helper text.
 * Polls approvals table for decision (manual refresh, no tight polling in v1).
 */
export function ApprovingWaitingState({
  submittedAt,
  onApprovalDecided,
}: ApprovingWaitingStateProps): React.ReactElement {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeAgo, setTimeAgo] = useState(formatTimeAgo(submittedAt));
  const checkApproval = usePluginAction("checkApprovalStatus");

  // Update "X minutes ago" every minute
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo(submittedAt));
    }, 60000);
    return () => clearInterval(interval);
  }, [submittedAt]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const decision = await checkApproval({});
      if (decision && onApprovalDecided) {
        onApprovalDecided(decision.approved);
      }
    } catch (err) {
      console.error("Failed to check approval status:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [checkApproval, onApprovalDecided]);

  return (
    <div className="flex flex-col gap-lg items-center justify-center py-3xl">
      <h2 className="text-heading font-bold">Waiting for CEO approval</h2>
      
      <p className="text-body text-foreground/70 text-center max-w-sm">
        Amendments submitted {timeAgo} for review. Your CEO agent will respond shortly.
      </p>
      
      <p className="text-label text-foreground/70 text-center max-w-sm">
        Your CEO agent is reviewing the proposed changes. You'll be notified when a decision is made.
      </p>

      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="px-lg py-md rounded border border-border text-foreground hover:bg-card disabled:opacity-50"
      >
        {isRefreshing ? "Checking…" : "Refresh"}
      </button>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const ms = Date.now() - date.getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 minute ago";
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  if (hours === 1) return "1 hour ago";
  return `${hours} hours ago`;
}
```

---

### `src/ui/assess/CustomOverrideWarning.tsx` (component, alert)

**Analog:** `src/ui/found/ApplyErrorDisplay.tsx` alert pattern

**Pattern:** Alert card with warning icon, description, checkbox confirmation. Per D-14 and UI-SPEC § Custom Override Warning.

**Alert pattern** (ApplyErrorDisplay.tsx lines 1228–1281):
```typescript
<div className="bg-destructive/10 border border-destructive rounded p-lg">
  <div className="flex gap-md items-start">
    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
    <div className="space-y-md">
      <h3 className="text-heading font-bold text-destructive">Apply failed at this step</h3>
      {/* Content */}
    </div>
  </div>
</div>
```

**For assess/CustomOverrideWarning.tsx, follow this pattern:**
```typescript
import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";

interface CustomOverrideWarningProps {
  agentName: string;
  sectionName: string;
  overrideDiff: string;
  onConfirm: (confirmed: boolean) => void;
}

/**
 * CustomOverrideWarning — Alert when affected agent has custom instruction overrides.
 * Per D-14 and UI-SPEC, shows override conflict + diff, requires checkbox confirmation.
 */
export function CustomOverrideWarning({
  agentName,
  sectionName,
  overrideDiff,
  onConfirm,
}: CustomOverrideWarningProps): React.ReactElement {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmed(e.target.checked);
    onConfirm(e.target.checked);
  };

  return (
    <div className="bg-destructive/10 border-l-4 border-destructive rounded p-lg space-y-md">
      <div className="flex gap-md items-start">
        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-md">
          <h3 className="text-body font-bold">
            ⚠️ Agent {agentName} has custom instructions
          </h3>

          <p className="text-body text-foreground/70">
            This agent's instructions have been customized beyond the preset baseline.
            The {sectionName} amendment will cascade as a new work item, but the agent's custom overrides will not be automatically merged.
          </p>

          <div className="bg-background p-md rounded font-mono text-sm whitespace-pre-wrap">
            {overrideDiff}
          </div>

          <label className="flex gap-sm items-start cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={handleConfirm}
              className="mt-1"
            />
            <span className="text-body">
              I've reviewed the override conflict and approve cascading anyway
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
```

---

### `src/ui/assess/AssessRunState.ts` (hook, state management)

**Analog:** `src/ui/found/InterviewDraftState.ts`

**Pattern:** Hook for loading/saving/clearing assess run state via worker-state. Per D-17, draft persists in `compass:assess:run:${company_id}` so founder can leave and return.

**State hook pattern** (found/InterviewDraftState.ts lines 899–933):
```typescript
export function useInterviewDraft(companyId: string) {
  const [draft, setDraft] = useState<InterviewAnswers | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDraft = async () => {
      // Call SDK to get draft from worker-state
      setLoading(false);
    };
    loadDraft();
  }, [companyId]);

  const saveDraft = useCallback((answers: InterviewAnswers) => {
    setDraft(answers);
    // Call SDK to set draft in worker-state
  }, []);

  const clearDraft = useCallback(() => {
    setDraft(null);
  }, []);

  return { draft, loading, saveDraft, clearDraft };
}
```

**For assess/AssessRunState.ts, follow this pattern:**
```typescript
import { useCallback, useEffect, useState } from "react";
import { usePluginData, usePluginAction } from "@paperclipai/plugin-sdk/ui";
import type { DriftReport } from "../types/assess.js";

const ASSESS_RUN_STATE_KEY = "compass:assess:run";

/**
 * Hook to load and persist assess run state.
 * Per D-17 (mid-run state persists in worker-state).
 * Founder can leave and return to a half-reviewed report without re-running detection.
 */
export function useAssessRun(companyId: string) {
  const [run, setRun] = useState<DriftReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Load assess run from worker-state on mount
  useEffect(() => {
    const loadRun = async () => {
      // Call SDK to get run from worker-state
      // Pattern: ctx.state.get({ scopeKind: "company", scopeId: companyId, namespace: ASSESS_RUN_STATE_KEY, stateKey: "current" })
      setLoading(false);
    };
    loadRun();
  }, [companyId]);

  // Save run on change (fire-and-forget to worker)
  const saveRun = useCallback(
    (report: DriftReport) => {
      setRun(report);
      // Call SDK to set run in worker-state
      // Pattern: ctx.state.set({ ... }, report)
    },
    []
  );

  const clearRun = useCallback(() => {
    // Call SDK to clear run
    setRun(null);
  }, []);

  return { run, loading, saveRun, clearRun };
}
```

---

## Shared Patterns

### Plugin SDK Hooks Pattern (All UI Components)

**Source:** `src/ui/found/FoundPanel.tsx` (lines 33–46)

**Apply to:** All UI components in assess mode

```typescript
import { usePluginData, usePluginAction } from "@paperclipai/plugin-sdk/ui";

const { data, loading, error } = usePluginData("handlerName", { param: value });
const action = usePluginAction("actionName");
await action({ param: value });
```

---

### Worker-State Pattern (Persistence Across Reload)

**Source:** `src/sdk/adapter.ts` (lines 106–130) + Phase 2 pattern

**Apply to:** Assess run state (D-17)

```typescript
// Writer (in worker):
await ctx.state.set(
  {
    scopeKind: "company" as const,
    scopeId: companyId,
    namespace: "compass:assess:run",
    stateKey: "current",
  },
  driftReport
);

// Reader (in worker or hook):
const cached = await ctx.state.get({
  scopeKind: "company" as const,
  scopeId: companyId,
  namespace: "compass:assess:run",
  stateKey: "current",
});
```

---

### Sequential Write with Rollback Pattern (Apply Step)

**Source:** `src/found/apply.ts` (lines 90–360)

**Apply to:** `src/assess/apply.ts` (extended for assess-specific writes)

```typescript
/**
 * Write resources in dependency order.
 * If any step fails, rollback in reverse order.
 * Each step logs to audit trail for debugging.
 */
async function applyAssess(ctx, companyId, vision, items, approvalMode) {
  const audit: AuditLogEntry[] = [];
  
  try {
    // Step 1: Write VISION amendment
    const visionDocId = await adapter.writeDocument({ ... });
    audit.push({ step: "vision-amend", success: true, ... });
    
    // Step 2: Create cascade issues
    const issueIds = await cascadeDriftAmendments(...);
    audit.push({ step: "cascade-issues", success: true, ... });
    
    // Step 3: Queue wakeups
    await adapter.queueWakeup(...);
    audit.push({ step: "wakeup-queue", success: true, ... });
    
    return { success: true, audit };
    
  } catch (err) {
    // Rollback in reverse order
    for (const entry of audit.reverse()) {
      if (entry.step === "cascade-issues") {
        for (const id of entry.resourceIds || []) {
          await adapter.deleteIssue(id, companyId);
        }
      }
      // ... etc
    }
    return { success: false, rollbackErrors };
  }
}
```

---

### Idempotency Key Pattern (Wakeup Queueing)

**Source:** `src/found/idempotency.ts` (lines 31–62)

**Apply to:** All assess mode wakeup requests

**Phase 3 extends Phase 2 namespace:** `compass:assess:${company_id}:${agent_id}:${run_id}`

```typescript
const idempotencyKey = `compass:assess:${companyId}:${agentId}:assess:${applyRunId}`;

// Before queueing, check if key already exists
const existing = await adapter.checkIdempotencyKey(idempotencyKey);
if (!existing) {
  await adapter.queueWakeup({
    agentId,
    idempotencyKey,
    reason: "VISION drift amendments applied",
  });
}
```

---

## SDK Adapter Extensions (Modified Phase 1)

### `src/sdk/adapter.ts` (modified)

**Additions for Phase 3:**

Per D-02, D-12, extend adapter with read methods for activity queries:

```typescript
/**
 * List issues for company, filtered by creation date.
 * Per D-02, used to build activity snapshot for drift detection.
 */
async listIssues(options: {
  companyId: string;
  since?: Date;
}): Promise<IssueItem[]> {
  // Query via SDK
}

/**
 * List issue comments for company, filtered by creation date.
 */
async listIssueComments(options: {
  companyId: string;
  since?: Date;
}): Promise<CommentItem[]> {
  // Query via SDK
}

/**
 * List documents for company, filtered by creation date.
 */
async listDocuments(options: {
  companyId: string;
  since?: Date;
}): Promise<DocumentItem[]> {
  // Query via SDK
}

/**
 * Insert approval record (for founder+ceo mode).
 * Per D-10, stores amendment payload + evidence for CEO review.
 */
async insertApproval(payload: {
  companyId: string;
  type: "compass.assess.amendment";
  data: { amendments: DriftItem[]; evidence: string };
}): Promise<{ approvalId: string }> {
  // SDK call to approvals table
}

/**
 * Get approval status (for polling in founder+ceo mode).
 * Per D-10, checks if CEO has decided on amendments.
 */
async getApproval(approvalId: string): Promise<{
  status: "pending" | "approved" | "rejected";
  decidedByUserId?: string;
}> {
  // SDK call to approvals table
}
```

---

## Test Files

### `tests/assess/drift.spec.ts` — Unit Tests (Pattern)

**Analog:** `tests/found/derive.spec.ts`

**Test drift detection functions in isolation:**
```typescript
import { describe, it, expect } from "vitest";
import { detectDrift, scoreMissionDrift } from "../../src/assess/drift";
import type { ParsedVision, ActivitySnapshot } from "../../src/types/assess";

describe("drift detection", () => {
  it("should detect mission drift when activity differs from vision", () => {
    const vision: ParsedVision = {
      mission: "Build accessible AI tools for founders",
      // ... other sections
    };
    
    const activity: ActivitySnapshot = {
      issues: [
        { type: "issue", id: "1", text: "AI should be proprietary and closed", createdAt: new Date() },
      ],
      comments: [],
      documents: [],
    };
    
    const report = detectDrift(vision, activity);
    expect(report.itemsBySection["mission"]).toBeDefined();
    expect(report.itemsBySection["mission"][0].confidence).toBeGreaterThan(0.5);
  });
  
  // ... more test cases for confidence scoring, recency, etc.
});
```

---

### `tests/assess/vision-parse.spec.ts` — Unit Tests

**Pattern:** Parse/serialize round-trip safety per D-06

```typescript
import { parseVision, serializeVision } from "../../src/assess/vision-parse";

describe("vision parsing", () => {
  it("should be round-trip safe: parse(serialize(parse(x))) === parse(x)", () => {
    const md1 = "## Mission\nBuild AI tools\n\n## Voice\nFriendly and expert";
    const parsed1 = parseVision(md1);
    const serialized = serializeVision(parsed1);
    const parsed2 = parseVision(serialized);
    
    expect(parsed1.mission).toBe(parsed2.mission);
    expect(parsed1.voice).toBe(parsed2.voice);
  });
});
```

---

### `tests/assess/apply.spec.ts` — Integration Tests

**Analog:** `tests/found/apply.spec.ts`

**Test Apply orchestrator with mock SDK host:**
```typescript
import { describe, it, expect } from "vitest";
import { applyAssess } from "../../src/assess/apply";
import { createMockContext } from "../fixtures/mock-host";

describe("assess apply", () => {
  it("should write VISION amendment, cascade issues, and queue wakeups", async () => {
    const ctx = createMockContext();
    const result = await applyAssess(
      ctx,
      "company-1",
      currentVision,
      acceptedItems,
      "founder"
    );
    
    expect(result.success).toBe(true);
    expect(result.visionDocId).toBeDefined();
    expect(result.cascadeIssueIds?.length).toBeGreaterThan(0);
    expect(result.wakeupCount).toBeGreaterThan(0);
  });
  
  it("should rollback on failure", async () => {
    const ctx = createMockContext({ failAt: "cascade-issues" });
    const result = await applyAssess(ctx, "company-1", vision, items, "founder");
    
    expect(result.success).toBe(false);
    expect(result.rollbackApplied).toBe(true);
  });
});
```

---

### `tests/assess/assess.integration.spec.ts` — End-to-End Tests

**Analog:** `tests/found/found.integration.spec.ts`

**Full flow scenarios:**
```typescript
describe("assess mode end-to-end", () => {
  it("should detect drift, review, and apply amendments", async () => {
    // 1. Build activity snapshot
    const activity = await buildActivitySnapshot(ctx, "company-1", 30);
    
    // 2. Parse VISION
    const vision = parseVision(visionMarkdown);
    
    // 3. Detect drift
    const report = detectDrift(vision, activity);
    
    // 4. Founder accepts items
    const state = createAmendmentState(report.itemsBySection.flatMap(i => i));
    state.acceptances[report.itemsBySection[0][0].id] = true;
    
    // 5. Apply amendments
    const result = await applyAssess(ctx, "company-1", vision, acceptedItems, "founder");
    
    expect(result.success).toBe(true);
    expect(result.visionDocId).toBeDefined();
  });
  
  it("should support founder+ceo approval routing", async () => {
    const result = await applyAssess(ctx, "company-1", vision, items, "founder+ceo");
    
    // Result should queue for approval, not apply immediately
    expect(result.success).toBe(true);
    // Wait for CEO approval (mock)
    const approval = await ctx.approvals.get(result.approvalId);
    expect(approval.status).toBe("pending");
  });
});
```

---

## Modified Files

### `src/worker.ts` (modified)

**Add handlers for Assess mode:**
- `runAssess` — Call drift detector, persist run in worker-state
- `checkApprovalStatus` — Poll approvals table (founder+ceo mode)
- `saveApprovalRouting` — Update approval mode config
- `discardAssessRun` — Clear cached drift run

---

### `src/found/idempotency.ts` (modified)

**Extend namespace:**
```typescript
// Phase 2 (Found):
export function generateIdempotencyKey(companyId: string, agentId: string, applyRunId: string): string {
  return `compass:found:${companyId}:${agentId}:${applyRunId}`;
}

// Phase 3 (Assess) — new function or extend:
export function generateAssessIdempotencyKey(companyId: string, agentId: string, assessRunId: string): string {
  return `compass:assess:${companyId}:${agentId}:${assessRunId}`;
}
```

---

### `src/ui/MainPanel.tsx` (modified)

**Add Assess mode routing:**
```typescript
if (mode === "assess") {
  return <AssessPanel />;
}
```

---

## No Analog Found

| File | Role | Reason |
|------|------|--------|
| None in Phase 3 new files | N/A | All Phase 3 new files have clear analogs in Phase 2 or Phase 1 |

---

## Metadata

**Analog search scope:**
- `src/` (compass Phase 1 + Phase 2 code)
- `.planning/research/` (PITFALLS.md, ARCHITECTURE.md)
- Phase 2 PATTERNS.md (established patterns)

**Files scanned:** 30+ compass source files + Phase 2 PATTERNS.md

**Pattern extraction date:** 2026-05-03

**SDK version assumed:** @paperclipai/plugin-sdk ^1.0.0 (extends Phase 2)

**React version:** 19 (peer dep, never bundled)

**Esbuild config:** No new plugins; extends Phase 2 text-loader for markdown vision content

---

## PATTERN MAPPING COMPLETE

**Phase:** 3 - Assess Mode  
**Files classified:** 23 (17 new, 6 modified)  
**Analogs found:** 22 / 23 (96% coverage)

### Coverage Summary
- **Exact analog (same role + data flow):** 8 files (drift.ts, cascade.ts, apply.ts, AssessPanel, AssessRunState, test suites)
- **Role-match analog (same role, similar flow):** 12 files (vision-parse, activity, amendment, UI components)
- **Partial match (reference for structure):** 2 files (ConfidenceBar, CustomOverrideWarning — new visuals with partial analogs)
- **Extensions (modify Phase 1/2):** 6 files (adapter, worker, idempotency, MainPanel)

### Key Patterns Identified
1. **Pure function pattern** — drift.ts follows derive.ts pattern (no I/O, deterministic, unit-testable per D-01)
2. **VISION parsing** — vision-parse.ts mirrors template-fill.ts with round-trip safety enforcement (D-05, D-06)
3. **Activity snapshot builder** — activity.ts follows preflight.ts pattern (SDK queries → structured output)
4. **Amendment protocol** — amendment.ts enforces default-NO + dated changelog formatting (D-07)
5. **Cascade orchestrator** — cascade.ts creates agent issues with screening (< 7 days, no heartbeat) and override warnings (D-12, D-13, D-14)
6. **Apply orchestration** — apply.ts extends Phase 2 pattern (preflight → sequential write → rollback) with assess-specific writes (D-15, XC-02)
7. **Mode controller** — AssessPanel.tsx mirrors FoundPanel.tsx with state machine (empty → running → report → preview → confirming → applying → waiting-approval/complete/error)
8. **Worker-state persistence** — AssessRunState.ts hook persists mid-run drift reports (D-17)
9. **Idempotency keys** — extends Phase 2 namespace to `compass:assess:${company}:${agent}:${run_id}` (XC-03)
10. **Design token styling** — all UI components use host-provided classes (no custom CSS)

### Ready for Planning
Pattern mapping complete. Planner can now reference:
- Analog file paths and code excerpts for each new file (22 files have direct analogs)
- Shared patterns (SDK hooks, worker-state, tailwind tokens, rollback logic, idempotency)
- Extensions to Phase 1/2 files (adapter list/approval methods, worker handlers, idempotency namespace)
- Test patterns (derive/parse/apply test suites, integration scenarios, mock fixtures)
- No blocking ambiguities; all Phase 3 files have clear pattern sources to adapt from

**PATTERNS.md created:** `.planning/phases/03-assess-mode/03-PATTERNS.md`

---

*Phase 3: Assess Mode*
*Pattern mapping complete: 2026-05-03*
