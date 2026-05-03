# Phase 5: Reposition Mode - Pattern Map

**Mapped:** 2026-05-03  
**Files analyzed:** 26 new files, 2 modified files  
**Analogs found:** 24 / 28 (86% coverage; 2 files are thin wrappers; 2 files are new patterns)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/types/reposition.ts` | model | static | `src/types/assess.ts` | exact |
| `src/reposition/shift-classify.ts` | service (pure logic) | transform | `src/assess/drift.ts` | role-match |
| `src/reposition/scope-filter.ts` | service (pure logic) | transform | `src/found/derive.ts` (pure function) | role-match |
| `src/reposition/seed-answers.ts` | service (pure logic) | transform | `src/found/derive.ts` | role-match |
| `src/reposition/amend.ts` | orchestrator (orchestration) | transform + batch | `src/assess/amendment.ts` + `src/found/template-fill.ts` | exact |
| `src/reposition/cascade.ts` | service (thin wrapper) | batch + event-driven | `src/assess/cascade.ts` | exact-wrap |
| `src/reposition/apply.ts` | orchestrator (SDK writes) | request-response + batch | `src/assess/apply.ts` | exact |
| `src/reposition/index.ts` | barrel | static | `src/assess/index.ts` | exact |
| `src/ui/reposition/RepositionPanel.tsx` | orchestrator (mode controller) | request-response | `src/ui/assess/AssessPanel.tsx` | exact |
| `src/ui/reposition/IntentEntry.tsx` | component (form) | request-response | `src/ui/found/InterviewSection.tsx` textarea pattern | role-match |
| `src/ui/reposition/ScopeConfirmation.tsx` | component (form) | request-response | `src/ui/found/PresetSelector.tsx` checkbox pattern | role-match |
| `src/ui/reposition/RepositionInterviewFlow.tsx` | orchestrator (thin wrapper) | request-response | `src/ui/found/FoundPanel.tsx` (interview section progression) | exact-wrap |
| `src/ui/reposition/AmendmentPreview.tsx` | component (display) | request-response | `src/ui/assess/DriftReportPanel.tsx` + `src/ui/assess/AmendmentDiff.tsx` | role-match |
| `src/ui/reposition/CascadeReviewPanel.tsx` | component (modal/panel) | request-response | `src/ui/assess/AssessPanel.tsx` (cascade review state) | role-match |
| `src/ui/reposition/AgentDecisionCard.tsx` | component (interactive) | request-response | `src/ui/assess/DriftItemCard.tsx` | role-match |
| `src/ui/reposition/RepositionRunState.ts` | hook (state management) | request-response | `src/ui/assess/AssessRunState.ts` | exact |
| `src/ui/reposition/index.ts` | barrel | static | `src/ui/assess/index.ts` | exact |
| `tests/reposition/shift-classify.spec.ts` | test suite | static | `tests/assess/drift.spec.ts` | role-match |
| `tests/reposition/scope-filter.spec.ts` | test suite | static | `tests/found/derive.spec.ts` | role-match |
| `tests/reposition/amend.spec.ts` | test suite | static | `tests/assess/amendment.spec.ts` | role-match |
| `tests/reposition/apply.spec.ts` | test suite | static | `tests/assess/apply.spec.ts` | exact |
| `tests/reposition/reposition.integration.spec.ts` | test suite | static | `tests/assess/assess.integration.spec.ts` | exact |
| `src/found/idempotency.ts` (modified) | utility | transform | existing (extend namespace) | extension |
| `src/worker.ts` (modified) | orchestrator | event-driven | existing (extend handlers) | extension |
| `src/ui/MainPanel.tsx` (modified) | orchestrator | request-response | existing (extend routing) | extension |
| Reused (no changes): `src/assess/{vision-parse,activity,amendment,cascade,apply}.ts` | services | various | Phase 3 established | reuse-as-is |
| Reused (no changes): `src/ui/found/{InterviewSection,QuestionRenderer,SectionNavRail,ConfirmationModal,ApplyProgress,ApplyErrorDisplay}.tsx` | components | request-response | Phase 2 established | reuse-as-is |
| Reused (no changes): `src/ui/assess/{AmendmentDiff,CustomOverrideWarning,ApprovalRoutingModal,ApprovingWaitingState}.tsx` | components | request-response | Phase 3 established | reuse-as-is |

**Match Quality Legend:**
- **exact** — Closest match: same role AND same data flow; code can be directly adapted
- **exact-wrap** — Same as exact, but file is a thin wrapper/extension of analog
- **role-match** — Same role, similar data flow; pattern established in compass repo
- **extension** — Modify existing file from prior phase (not a new file)
- **reuse-as-is** — No changes needed; import and use verbatim from prior phase

---

## Pattern Assignments

### `src/types/reposition.ts` (model, static)

**Analog:** `src/types/assess.ts`

**Pattern:** Type definitions for domain objects. Pure data structures, no I/O, exported for use across reposition module.

**Type structure** (assess.ts lines 1–50):
```typescript
/**
 * DriftItem — single drift signal grouped by vision section.
 */
export interface DriftItem {
  visionSection: string;
  confidence: number; // 0..1
  severity: "info" | "warn" | "blocker";
  evidence: EvidenceItem[];
}
```

**For reposition.ts, follow this pattern with reposition-specific types:**
```typescript
/**
 * ShiftScope — output of shift classifier: affected sections and confidence.
 */
export interface ShiftScope {
  affectedSections: VisionSectionId[];
  confidence: number; // 0..1
  rationale: string;
}

/**
 * RepositionRunState — in-flight state for a reposition operation.
 */
export interface RepositionRunState {
  companyId: string;
  runId: string;
  intent: string;
  shiftScope: ShiftScope;
  userScope: VisionSectionId[]; // After founder override
  interviewAnswers: InterviewAnswers;
  amendments: Amendment[];
  cascadePlan?: CascadePlan;
  approvalRouting: "founder" | "founder+ceo";
  createdAt: string;
}

/**
 * Amendment — scoped vision amendment per affected section.
 */
export interface Amendment {
  section: VisionSectionId;
  currentContent: string;
  proposedContent: string;
  reason: string; // Why this section was amended
}
```

---

### `src/reposition/shift-classify.ts` (service, transform)

**Analog:** `src/assess/drift.ts` (pure function, deterministic heuristics, no LLM)

**Pattern:** Pure function with no I/O, deterministic output, unit-testable. Per D-01, uses keyword + section-overlap heuristics only (no LLM).

**Drift detection signature** (drift.ts lines 29–50):
```typescript
/**
 * Detect drift between VISION.md and recent activity.
 * Per D-01, D-03, D-04: Pure heuristics, fully deterministic.
 * No LLM calls — keyword matching, semantic clustering, recency weighting.
 */
export function detectDrift(
  vision: ParsedVision,
  activity: ActivitySnapshot,
  windowDays: number = 30
): DriftReport {
  // Hard rules only
  const sectionTerms = extractKeyTerms(sectionContent);
  const evidence = findEvidenceItems(sectionName, sectionTerms, normalizedItems);
  const confidence = calculateConfidence(sectionTerms, evidence, activity.windowStartDate);
  return { items: detectedItems, ... };
}
```

**For shift-classify.ts, follow this pattern:**
```typescript
import type { ParsedVision, ShiftScope } from "../types/reposition.js";

/**
 * Classify shift intent into affected VISION sections.
 * Per D-01: Pure function, keyword heuristics only, no LLM.
 * Maps shift description ("rebrand", "pivot", "scale", "tighten") to section IDs.
 *
 * Keyword groups (inline documentation):
 * - rebrand → voice + product-direction + target-customer
 * - pivot → target-customer + mission + principles
 * - scale → growth-strategy + revenue-model + success-criteria
 * - tighten → principles + red-lines + voice
 */
export function classifyShift(
  description: string,
  currentVision: ParsedVision
): ShiftScope {
  // Extract keywords, compute section overlap per keyword group
  const keywordGroups = { rebrand: [...], pivot: [...], scale: [...], tighten: [...] };
  const affectedSections = detectAffectedSections(description, keywordGroups);
  const confidence = calculateConfidence(description, affectedSections);
  
  return {
    affectedSections,
    confidence,
    rationale: `Detected shift: ${detected.join(", ")}`,
  };
}

/**
 * Validate shift description is actionable (minimum length, non-empty).
 */
export function isValidShiftIntent(intent: string): boolean {
  return intent.trim().length >= 20; // Per UI-SPEC
}
```

---

### `src/reposition/scope-filter.ts` (service, transform)

**Analog:** `src/found/derive.ts` (pure function)

**Pattern:** Pure function that filters/transforms interview content based on scope. No I/O, fully testable.

**Derive pattern** (derive.ts lines 22–67):
```typescript
/**
 * Derive the Principles slot from interview answers.
 * Pure functions: (answers) => string. No I/O, fully testable.
 */
export function derivePrinciples(answers: InterviewAnswers): string {
  const principles: string[] = [];
  const voice = answers["brand-voice"] || "";
  if (voice.trim()) principles.push(voice.trim());
  return final.map((p) => `- ${p}`).join("\n");
}
```

**For scope-filter.ts, follow this pattern:**
```typescript
import type { InterviewSection, VisionSectionId } from "../types.js";

/**
 * Filter interview sections to only those in scope.
 * Per D-04, D-05: Pure function, returns subset of all interview sections.
 *
 * Reuses Phase 2 interview content from src/content/interview/*.md
 * and src/primitives/interview-loader.ts.
 *
 * @param allSections All interview sections (from loadInterviewSections)
 * @param affectedSectionIds Section IDs to include
 * @returns Filtered interview sections in VISION template order
 */
export function filterInterviewToScope(
  allSections: InterviewSection[],
  affectedSectionIds: VisionSectionId[]
): InterviewSection[] {
  const scopeSet = new Set(affectedSectionIds);
  return allSections.filter((section) => scopeSet.has(section.id));
}
```

---

### `src/reposition/seed-answers.ts` (service, transform)

**Analog:** `src/found/derive.ts` (pure extraction from existing data)

**Pattern:** Pure function that pre-fills form fields from current VISION.md. No I/O, fully testable.

**For seed-answers.ts:**
```typescript
import type { ParsedVision, InterviewAnswers, VisionSectionId } from "../types.js";

/**
 * Extract current VISION section values as interview answer seeds.
 * Per D-06: Pre-fill questions with current values where possible.
 * Founder edits, doesn't restart from blank.
 *
 * Mapping: each VISION section → interview section → map fields back.
 * Example: voice section in VISION → "brand-voice" question in interview.
 *
 * @param vision ParsedVision object (from parseVision)
 * @param sectionId VisionSectionId to extract
 * @returns Partial InterviewAnswers for that section
 */
export function getSectionAnswerSeed(
  vision: ParsedVision,
  sectionId: VisionSectionId
): Partial<InterviewAnswers> {
  const sectionContent = vision[sectionId];
  if (!sectionContent) return {};
  
  // Map VISION section content back to interview field names
  // Example: voice → answers["brand-voice"] = vision.voice
  const seeds: Partial<InterviewAnswers> = {};
  seedsForSection[sectionId](sectionContent, seeds);
  return seeds;
}
```

---

### `src/reposition/amend.ts` (orchestrator, transform + batch)

**Analog:** `src/assess/amendment.ts` (validation + formatting) + `src/found/template-fill.ts` (template rendering)

**Pattern:** Orchestrates pure functions (seed answers, interview answers, derive) + template rendering, no SDK calls. Produces per-section amendments.

**Amendment formatter** (assess/amendment.ts lines 1–50):
```typescript
/**
 * Format accepted drift items into VISION amendments.
 * Per D-07: Produces per-section AmendmentEntry list.
 */
export interface AmendmentEntry {
  section: keyof ParsedVision;
  currentContent: string;
  proposedContent: string;
  evidence: EvidenceItem[];
  confidence: number;
  changelog: string; // Dated entry
}

export function formatAmendments(items: DriftItem[]): AmendmentEntry[] {
  return items.map((item) => ({
    section: item.visionSection,
    currentContent: ...,
    proposedContent: ...,
    changelog: `[${today}] Drift detected: ...`,
  }));
}
```

**Template fill pattern** (found/template-fill.ts lines 113–137):
```typescript
/**
 * Fill VISION.md template with interview answers + derived values.
 * No SDK calls; pure string transformation.
 */
export function fillVisionTemplate(answers: InterviewAnswers): FilledVision {
  let body = VISION_TEMPLATE;
  const slots = {
    mission: answers.mission,
    principles: derivePrinciples(answers),
  };
  Object.entries(slots).forEach(([key, value]) => {
    body = body.replace(new RegExp(`{{${key}}}`, "g"), value || "");
  });
  return { body, slotsUsed: Object.keys(slots), slotsEmpty: ... };
}
```

**For amend.ts, orchestrate both patterns:**
```typescript
import { fillVisionTemplate } from "../found/template-fill.js";
import { checkVisionQuality } from "../found/quality-check.js";
import { getSectionAnswerSeed } from "./seed-answers.js";
import type { ParsedVision, Amendment } from "../types/reposition.js";

/**
 * Generate scoped amendments from reposition answers.
 * Per D-07: orchestrates seed → interview → derive → template-fill → diff.
 *
 * @param currentVision ParsedVision object
 * @param interviewAnswers Founder's scoped interview responses
 * @param affectedSections Section IDs to amend
 * @returns Amendment list per affected section
 */
export async function generateAmendments(
  currentVision: ParsedVision,
  interviewAnswers: InterviewAnswers,
  affectedSections: VisionSectionId[]
): Promise<Amendment[]> {
  // 1. Pre-fill seeds (for context)
  const seeds = affectedSections.map((sectionId) =>
    getSectionAnswerSeed(currentVision, sectionId)
  );

  // 2. Run derive functions on new answers
  const derivedSlots = deriveRepositionSlots(interviewAnswers);

  // 3. Fill template for affected sections only
  const filledVision = fillVisionTemplate({
    ...interviewAnswers,
    ...derivedSlots,
  });

  // 4. Quality check (FOUND-12 spirit)
  const qualityCheck = checkVisionQuality(filledVision);
  if (!qualityCheck.isValid) {
    throw new Error(`Quality check failed: ${qualityCheck.errors.join(", ")}`);
  }

  // 5. Diff against current and produce amendments
  const amendments = diffVisionSections(currentVision, filledVision, affectedSections);
  return amendments;
}
```

---

### `src/reposition/cascade.ts` (service, thin wrapper)

**Analog:** `src/assess/cascade.ts`

**Pattern:** Thin wrapper around Phase 3 cascade. Maps amended VISION sections to affected agents, applies same eligibility screening and custom-override detection.

**Cascade orchestrator** (assess/cascade.ts lines 29–100):
```typescript
/**
 * Cascade Orchestrator for Assess Mode
 * Per D-12, D-13, D-14: identifies affected agents per amended section.
 * Agent Screening: excludes newly-provisioned agents
 * Custom Override Detection: surfaces warnings to founder
 */
export function planCascade(
  vision: ParsedVision,
  amendments: Amendment[],
  agents: Agent[]
): CascadePlan {
  const affectedAgents = screenAgents(agents);
  const overrideWarnings = detectCustomOverrides(affectedAgents, amendments);
  const issuesByAgent = mapIssuesToAgents(amendments, affectedAgents);
  return { affectedAgents, customOverrideWarnings: overrideWarnings, issuesByAgent, ... };
}
```

**For reposition/cascade.ts (thin wrapper):**
```typescript
import { planCascade as planAssessCascade, executeCascade } from "../assess/cascade.js";
import type { Amendment, CascadePlan, CascadeResult } from "../types/reposition.js";

/**
 * Cascade thin wrapper for Reposition mode.
 * Per D-09: Reuses assess cascade verbatim — same agent screening, same override detection.
 * Only difference: amendments are scoped to reposition, not full drift audit.
 *
 * @param vision ParsedVision object
 * @param amendments Reposition amendments (output of amend.ts)
 * @param agents All company agents
 * @returns CascadePlan (assess-compatible)
 */
export async function planRepositionCascade(
  vision: ParsedVision,
  amendments: Amendment[],
  agents: Agent[]
): Promise<CascadePlan> {
  // Convert reposition Amendment to assess Amendment format (same structure)
  const assessAmendments = amendments.map((a) => ({
    ...a,
    evidence: [], // Reposition has no evidence items
    reason: a.reason,
    runId: "reposition-run",
  }));

  // Delegate to assess cascade logic
  return planAssessCascade(vision, assessAmendments, agents);
}

/**
 * Execute cascade via assess orchestrator.
 */
export async function executeRepositionCascade(
  ctx: PluginContext,
  companyId: string,
  plan: CascadePlan,
  repositionRunId: string
): Promise<CascadeResult> {
  return executeCascade(ctx, companyId, plan, repositionRunId);
}
```

---

### `src/reposition/apply.ts` (orchestrator, request-response + batch)

**Analog:** `src/assess/apply.ts`

**Pattern:** Orchestrates sequential writes with rollback on failure. Mirrors Phase 3 Apply pattern (preflight → sequential write → compensating rollback). Respects approval routing config.

**Apply orchestration** (assess/apply.ts lines 82–120):
```typescript
/**
 * Apply accepted amendments to VISION.md with cascade notification.
 * Per D-15 (XC-02): orchestrates preflight → sequential writes → rollback.
 * Respects approval routing config: founder (sync) vs founder+ceo (async approval gate).
 */
export async function applyAssessmentChanges(
  ctx: PluginContext,
  companyId: string,
  amendments: Amendment[],
  approvalRouting: "founder" | "founder+ceo",
  assessRunId: string
): Promise<ApplyResult> {
  // Preflight: validate VISION exists, amendments valid, etc.
  const preflightResult = await preflight(ctx, companyId);
  if (!preflightResult.valid) {
    return { success: false, blockingErrors: preflightResult.errors };
  }

  // Sequential write stage
  try {
    // 1. Write amended VISION.md
    const visionDocId = await writeVisionDocument(ctx, companyId, amendedVision);
    
    // 2. Plan and execute cascade
    const cascadePlan = await planCascade(vision, amendments, agents);
    const cascadeResult = await executeCascade(ctx, companyId, cascadePlan, assessRunId);
    
    return { success: true, visionDocId, cascadeIssueIds: cascadeResult.issueIds, ... };
  } catch (err) {
    // Rollback: delete cascade issues → delete VISION doc
    return rollbackApply(ctx, companyId, visionDocId, cascadeResult.issueIds);
  }
}
```

**For reposition/apply.ts, extend (not duplicate):**
```typescript
import { applyAssessmentChanges } from "../assess/apply.js";
import type { Amendment, ApplyResult } from "../types/reposition.js";

/**
 * Apply repositioned amendments to VISION.md with cascade notification.
 * Per D-12 (Phase 5 Apply mirrors Phase 3 Apply pattern).
 * Extends assess apply logic: same preflight, sequential writes, rollback, approval routing.
 * Only difference: amendments are scoped (reposition), idempotency key namespace is reposition-specific.
 *
 * @param ctx PluginContext
 * @param companyId Company ID
 * @param amendments Reposition amendments (from amend.ts)
 * @param approvalRouting Founder or founder+ceo
 * @param repositionRunId Run UUID (for idempotency)
 * @returns ApplyResult with success/failure details and rollback status
 */
export async function applyRepositionAmendments(
  ctx: PluginContext,
  companyId: string,
  amendments: Amendment[],
  approvalRouting: "founder" | "founder+ceo",
  repositionRunId: string
): Promise<ApplyResult> {
  // Convert reposition Amendment to assess Amendment format
  const assessAmendments = amendments.map((a) => ({
    ...a,
    evidence: [],
    runId: repositionRunId,
  }));

  // Delegate to assess apply logic (same pattern)
  const result = await applyAssessmentChanges(
    ctx,
    companyId,
    assessAmendments,
    approvalRouting,
    repositionRunId
  );

  // Idempotency key namespace: compass:reposition:${company_id}:${run_id}:${agent_id}
  // (configured in wakeup queuing step via idempotency.ts extension)
  return result;
}
```

---

### `src/ui/reposition/RepositionPanel.tsx` (orchestrator, request-response)

**Analog:** `src/ui/assess/AssessPanel.tsx`

**Pattern:** Main entry point with state machine. Orchestrates multi-phase flow: empty → intent → scope-confirm → interview → preview → cascade-review → confirming → applying → complete/error.

**AssessPanel structure** (assess/AssessPanel.tsx lines 43–100):
```typescript
type PanelState =
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
 * Main Assess panel orchestrator with state machine and layout.
 */
export function AssessPanel({
  companyId,
  companyName,
  visionExists,
}: AssessPanelProps): React.ReactElement {
  const [panelState, setPanelState] = useState<PanelState>("empty");
  const [applyError, setApplyError] = useState<string | null>(null);

  // Load initial state from run
  useEffect(() => {
    if (run && run.driftReport) {
      setPanelState("report");
    } else {
      setPanelState("empty");
    }
  }, [run, isLoadingState]);

  // Render body based on panelState
  return (
    <div className="...">
      {panelState === "empty" && <EmptyState />}
      {panelState === "report" && <DriftReportPanel />}
      {panelState === "preview" && <PreviewPanel />}
      {panelState === "confirming" && <ConfirmationModal />}
      {panelState === "applying" && <ApplyProgress />}
      {panelState === "complete" && <SuccessScreen />}
      {panelState === "error" && <ApplyErrorDisplay />}
    </div>
  );
}
```

**For RepositionPanel.tsx:**
```typescript
type RepositionStep =
  | "empty"
  | "intent"
  | "scope-confirm"
  | "interview"
  | "preview"
  | "cascade-review"
  | "confirming"
  | "applying"
  | "complete"
  | "waiting-approval"
  | "error";

/**
 * RepositionPanel — Orchestrator for Reposition Mode (Phase 5)
 *
 * Per D-13: State machine enforces linear progression with optional back-nav.
 * Phases:
 * 1. intent — textarea: "describe the shift"
 * 2. scope-confirm — founder edits classified sections
 * 3. interview — scoped re-interview with pre-filled current values
 * 4. preview — per-section amendment diffs
 * 5. cascade-review — per-agent decisions (keep/apply custom overrides)
 * 6. confirming → applying → complete/waiting-approval/error
 */
export function RepositionPanel(): React.ReactElement {
  const [step, setStep] = useState<RepositionStep>("empty");
  const [intent, setIntent] = useState("");
  const [shiftScope, setShiftScope] = useState<ShiftScope | null>(null);
  const [userScope, setUserScope] = useState<VisionSectionId[]>([]);
  const [interviewAnswers, setInterviewAnswers] = useState<InterviewAnswers>({});
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [cascadePlan, setCascadePlan] = useState<CascadePlan | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  const { run, saveRepositionRun } = useRepositionRunState(companyId);

  // Load cached run on mount
  useEffect(() => {
    if (run && run.intent) {
      setStep("scope-confirm"); // Resume existing flow
      setIntent(run.intent);
      setShiftScope(run.shiftScope);
      setUserScope(run.userScope);
    } else {
      setStep("empty");
    }
  }, [run]);

  // Render body based on step
  return (
    <div className="...">
      {step === "empty" && <EmptyRepositionState />}
      {step === "intent" && <IntentEntry onContinue={handleIntentSubmit} />}
      {step === "scope-confirm" && <ScopeConfirmation onContinue={handleScopeConfirm} />}
      {step === "interview" && <RepositionInterviewFlow onContinue={handleInterviewComplete} />}
      {step === "preview" && <AmendmentPreview onContinue={handlePreviewContinue} />}
      {step === "cascade-review" && <CascadeReviewPanel onContinue={handleCascadeConfirm} />}
      {step === "confirming" && <ConfirmationModal onConfirm={handleApply} />}
      {step === "applying" && <ApplyProgress />}
      {step === "complete" && <SuccessScreen />}
      {step === "waiting-approval" && <ApprovingWaitingState />}
      {step === "error" && <ApplyErrorDisplay error={applyError} />}
    </div>
  );
}
```

---

### `src/ui/reposition/IntentEntry.tsx` (component, form)

**Analog:** `src/ui/found/InterviewSection.tsx` (textarea pattern)

**Pattern:** Form component with textarea, auto-persist to worker-state, validation, placeholder with examples.

**Interview section pattern** (found/InterviewSection.tsx lines 1–50):
```typescript
/**
 * InterviewSection — Single interview section renderer
 *
 * Per D-05: renders one interview section at a time.
 * Questions rendered via QuestionRenderer.
 * Auto-saves answers to worker-state on blur.
 */
export function InterviewSection({
  section,
  answers,
  onAnswerChange,
  onNext,
  onBack,
}: InterviewSectionProps): React.ReactElement {
  return (
    <div className="...">
      <h2>{section.title}</h2>
      {section.questions.map((q) => (
        <QuestionRenderer
          key={q.id}
          question={q}
          value={answers[q.id] || ""}
          onChange={(val) => onAnswerChange(q.id, val)}
        />
      ))}
      <textarea
        placeholder="Enter your response..."
        value={answers[questionId] || ""}
        onChange={(e) => onAnswerChange(questionId, e.target.value)}
        onBlur={() => saveToWorkerState(answers)}
      />
    </div>
  );
}
```

**For IntentEntry.tsx:**
```typescript
/**
 * IntentEntry — Textarea for shift description
 *
 * Per D-15: Ghost text with examples, auto-persist to worker-state,
 * validates minimum 20 characters, "Continue" button enabled when valid.
 */
export function IntentEntry({
  onContinue,
}: IntentEntryProps): React.ReactElement {
  const [intent, setIntent] = useState("");
  const { saveRepositionRun } = useRepositionRunState(companyId);

  const handleBlur = () => {
    saveRepositionRun({ intent }); // Persist to worker-state
  };

  const isValid = intent.trim().length >= 20;

  return (
    <div className="...">
      <h2 className="text-heading">Describe the shift</h2>
      <textarea
        placeholder="Describe the shift in plain English. Examples: 'rebrand toward compliance', 'narrow focus to enterprise customers', 'tighten our voice'."
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        onBlur={handleBlur}
        className="p-lg min-h-24"
      />
      <p className="text-foreground/70">
        Be specific about the direction change, not just internal improvements.
      </p>
      <button
        onClick={() => onContinue(intent)}
        disabled={!isValid}
        className="bg-accent"
      >
        Continue
      </button>
    </div>
  );
}
```

---

### `src/ui/reposition/ScopeConfirmation.tsx` (component, form)

**Analog:** `src/ui/found/PresetSelector.tsx` (checkbox pattern) + `src/ui/found/InterviewSection.tsx` (form section)

**Pattern:** Checkbox list for selecting/deselecting affected sections. Founder can override classification. Min 1 required.

**PresetSelector pattern** (found/PresetSelector.tsx lines 1–40):
```typescript
/**
 * PresetSelector — Radio buttons for preset selection
 *
 * Per D-08: displays preset options, one selected at a time.
 * Pre-populates from worker-state if available.
 */
export function PresetSelector({
  presets,
  selectedId,
  onSelect,
}: PresetSelectorProps): React.ReactElement {
  return (
    <div className="...">
      {presets.map((preset) => (
        <label key={preset.id}>
          <input
            type="radio"
            name="preset"
            value={preset.id}
            checked={selectedId === preset.id}
            onChange={() => onSelect(preset.id)}
          />
          {preset.name}
        </label>
      ))}
    </div>
  );
}
```

**For ScopeConfirmation.tsx (adapt radio → checkboxes):**
```typescript
/**
 * ScopeConfirmation — Checkbox list for affected sections
 *
 * Per D-02, D-03: Classified sections shown with checkboxes (checked by default).
 * Founder can add or remove sections before re-interview.
 * Validates: at least 1 section selected.
 */
export function ScopeConfirmation({
  classifiedScope,
  onConfirm,
}: ScopeConfirmationProps): React.ReactElement {
  const [selectedSections, setSelectedSections] = useState<VisionSectionId[]>(
    classifiedScope.affectedSections
  );

  const toggleSection = (sectionId: VisionSectionId) => {
    if (selectedSections.includes(sectionId)) {
      setSelectedSections(selectedSections.filter((s) => s !== sectionId));
    } else {
      setSelectedSections([...selectedSections, sectionId]);
    }
  };

  const isValid = selectedSections.length >= 1;

  return (
    <div className="...">
      <h2 className="text-heading">Which sections change?</h2>
      <p className="text-foreground/70">
        These sections will be re-interviewed. Add or remove any.
      </p>
      <div className="gap-sm">
        {/* Vision sections in template order */}
        {allVisionSections.map((section) => (
          <label key={section.id} className="flex gap-xs items-center">
            <input
              type="checkbox"
              checked={selectedSections.includes(section.id)}
              onChange={() => toggleSection(section.id)}
            />
            <span>{section.displayName}</span>
            {!classifiedScope.affectedSections.includes(section.id) && (
              <span className="text-label text-foreground/70">(optional)</span>
            )}
          </label>
        ))}
      </div>
      <button
        onClick={() => onConfirm(selectedSections)}
        disabled={!isValid}
        className="bg-accent"
      >
        Continue to interview
      </button>
    </div>
  );
}
```

---

### `src/ui/reposition/RepositionInterviewFlow.tsx` (orchestrator, thin wrapper)

**Analog:** `src/ui/found/FoundPanel.tsx` (interview section progression)

**Pattern:** Thin wrapper around Phase 2 interview machinery. Filters sections to affected scope, pre-fills with current VISION values.

**FoundPanel interview flow** (found/FoundPanel.tsx lines 71–150):
```typescript
/**
 * FoundPanel — Orchestrates Found mode end-to-end.
 * State: maintains interview answers, section progress, preset selection.
 */
export function FoundPanel(): React.ReactElement {
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<InterviewAnswers>({});
  
  const sections = useMemo(() => loadInterviewSections(), []);

  // Render current section
  return (
    <InterviewSection
      section={sections[currentSection]}
      answers={answers}
      onAnswerChange={(questionId, value) => {
        setAnswers({ ...answers, [questionId]: value });
      }}
      onNext={() => {
        // Validate required fields
        if (sections[currentSection].questions.every((q) => q.required ? answers[q.id] : true)) {
          setCurrentSection(currentSection + 1);
        }
      }}
      onBack={() => setCurrentSection(currentSection - 1)}
    />
  );
}
```

**For RepositionInterviewFlow.tsx (thin wrapper):**
```typescript
import {
  InterviewSection,
  SectionNavRail,
} from "../found/index.js";
import { loadInterviewSections } from "../../primitives/interview-loader.js";
import { filterInterviewToScope } from "../../reposition/scope-filter.js";
import { getSectionAnswerSeed } from "../../reposition/seed-answers.js";
import type { VisionSectionId, InterviewAnswers } from "../../types.js";

/**
 * RepositionInterviewFlow — Scoped re-interview orchestrator
 *
 * Per D-05: Reuses Phase 2 InterviewSection, QuestionRenderer, SectionNavRail.
 * Filters sections to affected scope only (via scope-filter.ts).
 * Pre-fills questions with current VISION values (via seed-answers.ts).
 *
 * Input: affectedSectionIds (from ScopeConfirmation)
 * Output: interviewAnswers (from founder interview)
 */
export function RepositionInterviewFlow({
  affectedSectionIds,
  currentVision,
  onComplete,
}: RepositionInterviewFlowProps): React.ReactElement {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<InterviewAnswers>(() => {
    // Pre-fill with current VISION values
    const seeds: InterviewAnswers = {};
    for (const sectionId of affectedSectionIds) {
      Object.assign(seeds, getSectionAnswerSeed(currentVision, sectionId));
    }
    return seeds;
  });

  // Load all sections, filter to affected scope
  const allSections = useMemo(() => loadInterviewSections(), []);
  const scopedSections = useMemo(
    () => filterInterviewToScope(allSections, affectedSectionIds),
    [affectedSectionIds]
  );

  const currentSection = scopedSections[currentSectionIndex];
  const isLastSection = currentSectionIndex === scopedSections.length - 1;

  return (
    <div className="flex gap-xl">
      {/* Left nav rail: scoped sections only */}
      <SectionNavRail
        sections={scopedSections}
        currentIndex={currentSectionIndex}
        onSelect={setCurrentSectionIndex}
      />

      {/* Main interview section */}
      <InterviewSection
        section={currentSection}
        answers={answers}
        onAnswerChange={(questionId, value) => {
          setAnswers({ ...answers, [questionId]: value });
        }}
        onNext={() => {
          if (isLastSection) {
            onComplete(answers);
          } else {
            setCurrentSectionIndex(currentSectionIndex + 1);
          }
        }}
        onBack={() => {
          if (currentSectionIndex === 0) {
            // Back to scope confirmation
            onBack?.();
          } else {
            setCurrentSectionIndex(currentSectionIndex - 1);
          }
        }}
      />
    </div>
  );
}
```

---

### `src/ui/reposition/AmendmentPreview.tsx` (component, display)

**Analog:** `src/ui/assess/DriftReportPanel.tsx` + `src/ui/assess/AmendmentDiff.tsx`

**Pattern:** Displays per-section amendments with unified diff format (reuses Phase 3 AmendmentDiff component).

**AmendmentDiff component** (assess/AmendmentDiff.tsx):
```typescript
/**
 * AmendmentDiff — Unified diff viewer for VISION amendments
 *
 * Per D-07: shows before/after markdown delta per section.
 * Reused from Phase 3; displays in collapsible details elements.
 */
export function AmendmentDiff({
  currentContent,
  proposedContent,
}: AmendmentDiffProps): React.ReactElement {
  return (
    <details>
      <summary>{sectionName} — Amendment</summary>
      <div className="...">
        <p className="text-foreground/70">Before:</p>
        <pre>{currentContent}</pre>
        <p className="text-foreground/70">After:</p>
        <pre>{proposedContent}</pre>
      </div>
    </details>
  );
}
```

**For AmendmentPreview.tsx:**
```typescript
import { AmendmentDiff } from "../assess/AmendmentDiff.js";
import type { Amendment } from "../../types/reposition.js";

/**
 * AmendmentPreview — Per-section amendment display
 *
 * Per D-07, UI-SPEC Phase 5: Shows amendments in collapsible format.
 * Reuses Phase 3 AmendmentDiff component verbatim.
 * All sections expanded by default (founder reviews all at once).
 */
export function AmendmentPreview({
  amendments,
  onBack,
  onContinue,
}: AmendmentPreviewProps): React.ReactElement {
  return (
    <div className="...">
      <h2 className="text-display">Review the proposed changes</h2>

      <div className="...">
        {amendments.map((amendment) => (
          <AmendmentDiff
            key={amendment.section}
            currentContent={amendment.currentContent}
            proposedContent={amendment.proposedContent}
          />
        ))}
      </div>

      <button onClick={onBack} className="text-foreground">
        ← Back to interview
      </button>
      <button onClick={onContinue} className="bg-accent">
        Review cascade
      </button>
    </div>
  );
}
```

---

### `src/ui/reposition/CascadeReviewPanel.tsx` (component, modal/panel)

**Analog:** `src/ui/assess/AssessPanel.tsx` (cascade review state) + cascade review patterns

**Pattern:** Per-agent decision interface. Lists affected agents with toggle buttons (keep custom / apply repositioning). Custom override warnings gate the "apply" action.

**For CascadeReviewPanel.tsx:**
```typescript
import { CustomOverrideWarning } from "../assess/CustomOverrideWarning.js";
import { AgentDecisionCard } from "./AgentDecisionCard.js";
import type { Agent, CascadePlan } from "../../types.js";

/**
 * CascadeReviewPanel — Per-agent decision interface
 *
 * Per D-10: Founder selects keep/apply for each affected agent.
 * Custom override detection shows warnings; founder must confirm to overwrite.
 * Default: skip (keep custom) for agents with overrides.
 */
export function CascadeReviewPanel({
  cascadePlan,
  onBack,
  onConfirm,
}: CascadeReviewPanelProps): React.ReactElement {
  const [decisions, setDecisions] = useState<Record<string, "keep" | "apply">>(() => {
    // Default: skip (keep custom) for agents with custom overrides
    const defaults: Record<string, "keep" | "apply"> = {};
    for (const agent of cascadePlan.affectedAgents) {
      const hasOverride = cascadePlan.customOverrideWarnings.some(
        (w) => w.agentId === agent.id
      );
      defaults[agent.id] = hasOverride ? "keep" : "apply";
    }
    return defaults;
  });

  const allDecided = cascadePlan.affectedAgents.every((agent) =>
    cascadePlan.customOverrideWarnings.some((w) => w.agentId === agent.id)
      ? decisions[agent.id] !== undefined
      : true
  );

  return (
    <div className="...">
      <h2 className="text-heading">Which agents get updated?</h2>
      <p className="text-foreground/70">
        These agents will receive new instructions from the repositioning.
        Skip any with custom overrides if you want to keep them.
      </p>

      <div className="...">
        {cascadePlan.affectedAgents.map((agent) => (
          <AgentDecisionCard
            key={agent.id}
            agent={agent}
            hasOverride={cascadePlan.customOverrideWarnings.some(
              (w) => w.agentId === agent.id
            )}
            decision={decisions[agent.id] || "apply"}
            onDecisionChange={(decision) => {
              setDecisions({ ...decisions, [agent.id]: decision });
            }}
          />
        ))}
      </div>

      <button onClick={onBack} className="text-foreground">
        ← Back to preview
      </button>
      <button
        onClick={() => onConfirm(decisions)}
        disabled={!allDecided}
        className="bg-accent"
      >
        Apply repositioning
      </button>
    </div>
  );
}
```

---

### `src/ui/reposition/AgentDecisionCard.tsx` (component, interactive)

**Analog:** `src/ui/assess/DriftItemCard.tsx`

**Pattern:** Card showing agent metadata + decision buttons. Custom override warning if applicable.

**For AgentDecisionCard.tsx:**
```typescript
import { CustomOverrideWarning } from "../assess/CustomOverrideWarning.js";
import type { Agent } from "../../types.js";

/**
 * AgentDecisionCard — Single agent cascading decision
 *
 * Per D-10: Shows agent name/role, affected section, decision buttons.
 * If custom override: displays CustomOverrideWarning, "Apply" button gated by checkbox confirmation.
 */
export function AgentDecisionCard({
  agent,
  hasOverride,
  decision,
  onDecisionChange,
}: AgentDecisionCardProps): React.ReactElement {
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  return (
    <div className="bg-card p-md rounded">
      {/* Card header */}
      <div className="flex justify-between items-center gap-md">
        <div>
          <p className="text-body font-bold">{agent.name} — {agent.role}</p>
          <p className="text-label text-foreground/70">Current: {agent.affectedSection}</p>
        </div>
      </div>

      {/* Custom override warning */}
      {hasOverride && (
        <CustomOverrideWarning
          agentName={agent.name}
          onConfirm={(confirmed) => setOverrideConfirmed(confirmed)}
        />
      )}

      {/* Decision buttons */}
      <div className="flex gap-md mt-md">
        <button
          onClick={() => onDecisionChange("keep")}
          className={decision === "keep" ? "text-foreground font-bold" : "text-foreground/70"}
        >
          Keep custom
        </button>
        <button
          onClick={() => onDecisionChange("apply")}
          disabled={hasOverride && !overrideConfirmed}
          className={decision === "apply" ? "bg-accent text-white" : "text-foreground/70"}
        >
          Apply repositioning
        </button>
      </div>
    </div>
  );
}
```

---

### `src/ui/reposition/RepositionRunState.ts` (hook, state management)

**Analog:** `src/ui/assess/AssessRunState.ts`

**Pattern:** Custom hook for managing in-flight reposition state. Persists to worker-state, provides save/load/clear methods.

**AssessRunState pattern** (assess/AssessRunState.ts):
```typescript
/**
 * useAssessRunState — Hook for managing in-flight assess run state
 *
 * Per D-14: State persists in worker-state keyed compass:assess:run:${company_id}.
 * Provides methods: saveDriftReport, setItemAccepted, getAcceptedItems, clearRun.
 */
export function useAssessRunState(companyId: string) {
  const { data: run, isLoading, error, trigger } = usePluginData<AssessRun>(
    "getAssessRun",
    { companyId }
  );

  const saveRun = usePluginAction("saveAssessRun");

  const saveDriftReport = useCallback(
    async (report: DriftReport, approvalRouting: string) => {
      await saveRun({
        companyId,
        run: { driftReport: report, approvalRouting },
      });
    },
    [companyId, saveRun]
  );

  return { run, isLoading, error, saveDriftReport, ... };
}
```

**For RepositionRunState.ts:**
```typescript
import { usePluginData, usePluginAction } from "@paperclipai/plugin-sdk/ui";
import type { RepositionRunState } from "../../types/reposition.js";

/**
 * useRepositionRunState — Hook for managing in-flight reposition run state
 *
 * Per D-14: State persists in worker-state keyed compass:reposition:run:${company_id}.
 * Provides methods: saveRepositionRun, setRunStep, addAmendments, clearRun.
 */
export function useRepositionRunState(companyId: string) {
  const { data: run, isLoading, error } = usePluginData<RepositionRunState | null>(
    "getRepositionRun",
    { companyId }
  );

  const saveRun = usePluginAction("saveRepositionRun");

  const saveRepositionRun = useCallback(
    async (updates: Partial<RepositionRunState>) => {
      await saveRun({
        companyId,
        updates,
      });
    },
    [companyId, saveRun]
  );

  const clearRun = useCallback(async () => {
    await saveRun({ companyId, clear: true });
  }, [companyId, saveRun]);

  return { run, isLoading, error, saveRepositionRun, clearRun };
}
```

---

## Shared Patterns

### Idempotency Key Generation
**Source:** `src/found/idempotency.ts` (existing)
**Apply to:** All reposition wakeup queuing (extend namespace)

**Current pattern** (idempotency.ts lines 35–51):
```typescript
export function generateIdempotencyKey(
  companyId: string,
  agentId: string,
  applyRunId: string
): string {
  return `compass:found:${companyId}:${agentId}:${applyRunId}`;
}
```

**For Phase 5 extension:**
Add new function to idempotency.ts:
```typescript
/**
 * Generate an idempotency key for Reposition mode.
 *
 * Format: compass:reposition:${company_id}:${run_id}:${agent_id}
 * Per D-12 (XC-03): stable across retries, unique to shift+agent+run.
 */
export function generateRepositionIdempotencyKey(
  companyId: string,
  repositionRunId: string,
  agentId: string
): string {
  return `compass:reposition:${companyId}:${repositionRunId}:${agentId}`;
}

export function isValidRepositionIdempotencyKey(key: string): boolean {
  const pattern = /^compass:reposition:[^:]+:[^:]+:[^:]+$/;
  return pattern.test(key);
}
```

### Approval Routing (founder vs founder+ceo)
**Source:** `src/assess/apply.ts` (lines 82–120)
**Apply to:** `src/reposition/apply.ts`

**Routing pattern:**
```typescript
// founder mode: writes synchronously
if (approvalRouting === "founder") {
  const result = await sequentialWrite(...);
  return { success: result.success, ... };
}

// founder+ceo mode: queues approval
if (approvalRouting === "founder+ceo") {
  const approvalId = await queueApproval(...);
  return { waitingForApproval: true, approvalId, ... };
}
```

Reposition apply mirrors this pattern verbatim — no changes needed.

### Worker-State Persistence
**Source:** `src/ui/found/FoundPanel.tsx` + `src/ui/assess/AssessPanel.tsx`
**Apply to:** All Reposition UI components

**Pattern:** Auto-save answers on blur, resume from cached state on re-open.
```typescript
// In component
const handleBlur = () => {
  saveRepositionRun({ intent, answers }); // Persist to worker-state
};

// In hook
const { run, isLoading } = useRepositionRunState(companyId);
useEffect(() => {
  if (run && run.intent) {
    // Resume existing flow
    setStep("scope-confirm");
    setIntent(run.intent);
  }
}, [run]);
```

---

## Modified Files

### `src/found/idempotency.ts`
**Modification:** Add `generateRepositionIdempotencyKey` and `isValidRepositionIdempotencyKey` functions (lines 108–133).

### `src/worker.ts`
**Modification:** Add reposition handlers to worker definition:
- `getRepositionRun` → load cached run state
- `saveRepositionRun` → persist run state
- `classifyShift` → run shift classifier
- `generateAmendments` → orchestrate amend.ts
- `planRepositionCascade` → run cascade planning
- `applyRepositionAmendments` → run apply orchestrator

### `src/ui/MainPanel.tsx`
**Modification:** Add routing for Reposition mode in mode-to-panel switch (lines TBD):
```typescript
// Import RepositionPanel
import { RepositionPanel } from "./reposition/RepositionPanel.js";

// In MainPanel render
{activeMode === "reposition" && <RepositionPanel companyId={companyId} />}
```

---

## No Analog Found

Files with no close match in the codebase (planner should follow CONTEXT.md + UI-SPEC patterns):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/ui/reposition/EmptyRepositionState.tsx` | component (empty state) | request-response | Simple centered message, no prior analog needed |
| `src/ui/reposition/ResumeRepositionState.tsx` | component (empty state variant) | request-response | UI-SPEC specifies design; reuses Pattern 2 spacing/typography |

---

## Metadata

**Analog search scope:** src/found, src/assess, src/ui/found, src/ui/assess, src/types/found.ts, src/types/assess.ts, src/worker.ts, src/ui/MainPanel.tsx, src/primitives/{interview-loader,mode-detect}.ts

**Files scanned:** 45 total (15 assess, 15 found, 15 other infrastructure)

**Pattern extraction date:** 2026-05-03

**Reuse summary:**
- **Heavy reuse Phase 2 (Found):** interview machinery, template-fill, derive, quality-check, approval patterns
- **Heavy reuse Phase 3 (Assess):** drift detection pattern (adapt to shift-classify), amendment formatting, cascade orchestration, apply pattern (full adoption), approval routing
- **UI reuse:** AssessPanel state machine pattern → RepositionPanel; DriftItemCard → AgentDecisionCard; AmendmentDiff verbatim; CustomOverrideWarning verbatim
- **Minimal new code:** shift-classify heuristics, scope-filter, seed-answers, RepositionRunState hook, IntentEntry/ScopeConfirmation components
