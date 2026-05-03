# Architecture Patterns — Compass (Paperclip Plugin)

**Domain:** AI company strategic consulting plugin for Paperclip  
**Researched:** 2026-05-02  
**Confidence:** HIGH (verified against file-viewer plugin, kitchen-sink example, PLUGIN_SPEC.md, PLUGIN_AUTHORING_GUIDE.md)

## Recommended Architecture

Compass should follow the three-layer plugin architecture pattern established by file-viewer and kitchen-sink example plugins: **Manifest + Worker + UI**, with internal domain logic factored into mode controllers and cross-mode primitives.

### High-Level Data Flow

```
Plugin Entry (Sidebar)
  ↓
Main Panel loads (shows company context)
  ↓
Mode Detection (auto + user override)
  ↓
Mode Controller routes to Found | Assess | Revive | Reposition
  ↓
  [Found flow]           → Interview Q&A → VISION.md generator → Apply via SDK
  [Assess flow]          → Drift analysis → Amendment proposals → Apply via SDK
  [Revive flow]          → Diagnostics   → Action queue        → Apply via SDK
  [Reposition flow]      → Scoped Q&A    → Amendments         → Apply via SDK
  ↓
Inline Preview (founder edits before commit)
  ↓
Apply Step (SDK writes only: documents, issues, comments, wakeups)
  ↓
Engagement Memory written to `documents` table
  ↓
Wakeup queue serialized, idempotency keys recorded
```

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|-------------|-------------------|
| **Sidebar (UI)** | Plugin entry link + company selector | Main panel, host context |
| **Main Panel (UI)** | Inventory display + mode selector + flow router | Mode controller, inline preview, apply |
| **Chat Panel (UI)** | Free-form prompts → mode classifier | Mode controller |
| **Manual Panel (UI)** | Direct form inputs for each mode | Mode controller |
| **Inline Preview (UI)** | Render-before-commit of proposed VISION.md / amendments / actions | SDK adapter |
| **Mode Controller (Worker)** | Routes mode-specific logic based on user selection | Mode flows, cross-mode primitives |
| **Found Flow (Worker)** | Interview orchestration → VISION.md generation → agent provisioning | Interview prompts, VISION.md template, preset library, apply pipeline |
| **Assess Flow (Worker)** | Drift detection → amendment proposals → cascade planning | Drift analyzer, amendment protocol, apply pipeline |
| **Revive Flow (Worker)** | Diagnostic classification → action prioritization → sample-pivot logic | Revival diagnostics, founder-action queue generator, apply pipeline |
| **Reposition Flow (Worker)** | Scoped interview → targeted amendments → brand/voice cascade | Interview prompts (delta-only), amendment protocol, apply pipeline |
| **Inventory Primitive (Worker)** | DB + filesystem + git snapshot for display + mode detection | Paperclip SDK (companies, agents, issues, documents) |
| **Mode Detection (Worker)** | Hard rules: VISION exists? heartbeats recent? blockers? | Inventory snapshot |
| **Vision-Quest Content (Markdown files)** | Parameterized interview prompts + VISION.md template | Found/Reposition flows |
| **SDK Adapter (Worker)** | Single chokepoint for all writes: documents, agents, issues, comments, wakeups | Paperclip Plugin SDK |
| **Plugin State (Worker)** | Engagement memory: prior findings, open recommendations, history | Plugin state API, documents table |

## Recommended Directory Structure

```
src/
├── manifest.ts                    # Plugin metadata + UI slot declarations
├── worker.ts                      # Plugin setup + entry handler + worker lifecycle
├── ui/
│   ├── index.tsx                  # Sidebar + main panel router
│   ├── sidebar.tsx                # Sidebar entry link
│   ├── main-panel.tsx             # Company context + mode selector
│   ├── chat-panel.tsx             # Free-form input + mode classifier
│   ├── manual-panel.tsx           # Direct form mode (optional, M1 defer)
│   ├── preview-panel.tsx          # Inline editor before apply
│   └── styles.css                 # Tailwind or component styles
├── modes/
│   ├── found.ts                   # Found mode orchestration + interview flow
│   ├── assess.ts                  # Assess mode drift logic + amendments
│   ├── revive.ts                  # Revive mode diagnostics + action queue
│   ├── reposition.ts              # Reposition mode scoped flow
│   └── types.ts                   # Mode-shared types (ModeContext, ModeOutput, etc.)
├── primitives/
│   ├── inventory.ts               # DB + filesystem + git snapshot reader
│   ├── mode-detection.ts          # Hard rules for VISION/heartbeat/blocker checking
│   ├── apply.ts                   # SDK adapter + write pipeline
│   ├── wakeup.ts                  # Agent wakeup queuing with idempotency keys
│   ├── amendment-protocol.ts      # Amendment default-NO + changelog logic
│   ├── engagement-memory.ts       # Per-company plugin state persistence
│   └── types.ts                   # Primitive-shared types
├── content/
│   ├── interview-prompts.ts       # Question templates (6 sections × ~8-10 Q each)
│   ├── vision-template.ts         # VISION.md generation + section mappers
│   ├── preset-library.ts          # Module + role definitions (inherit from company-wizard)
│   ├── amendment-templates.ts     # Common amendment patterns
│   ├── action-queue-templates.ts  # Founder-action priority ordering
│   └── diagnostic-templates.ts    # Revival flowchart + blocker classification
├── lib/
│   ├── formatting.ts              # Markdown + text utils
│   ├── validation.ts              # VISION section completeness checks
│   └── parsing.ts                 # Parse VISION.md for drift detection
├── types/
│   └── index.ts                   # Global types (Company, Agent, Interview state, etc.)
├── sdk/
│   └── adapter.ts                 # Paperclip SDK wrapper (centralized write path)
└── constants.ts                   # Plugin ID, manifest constants, etc.

tests/
├── mode-detection.spec.ts
├── inventory.spec.ts
├── drift-detection.spec.ts
└── apply-pipeline.spec.ts
```

## Data Flow Across Layers

### 1. Plugin Entry → Inventory → Mode Detection

```typescript
// user opens Compass sidebar
// ui/sidebar.tsx navigates to /:companyPrefix/compass
// main-panel.tsx mounts

// useEffect: fetch company context
const { company, agents, issues, documents } = await pluginData("company-context");

// triggers worker's getData("company-context")
// → inventory.ts captures snapshot of:
//    - agents table (last_heartbeat_at, adapter_config for dual-path awareness)
//    - documents table (find VISION.md)
//    - issues table (last 30 days, status, blockers)
//    - git history if workspace available (last commit date)

// mode-detection.ts applies hard rules:
// if !VISION.md: "Found"
// if VISION.md + recent heartbeats: "Assess"
// if VISION.md + no recent heartbeats + blockers: "Revive"
// if VISION.md + recent heartbeats + founder override: "Reposition"

// mode controller routes to Found | Assess | Revive | Reposition handler
```

### 2. Found Mode: Interview → VISION.md → Apply

```typescript
// found.ts orchestrates:
// 1. Interview state machine (6 sections, ~50 questions)
// 2. Responses stored in UI local state (useReducer or useState)
// 3. Founder reviews inline preview of generated VISION.md + agents + issues
// 4. Confirm → apply

// apply.ts runs:
// 1. Validate VISION.md (all sections populated, no placeholders)
// 2. SDK: create documents (VISION.md, BOOTSTRAP.md if needed)
// 3. SDK: provision agents per selected preset (from preset-library.ts)
// 4. SDK: create kickoff issues per agent (from agent's role template)
// 5. SDK: queue wakeup requests (all agents, reason: "Compass found initialization")
// 6. engagement-memory.ts: store in plugin state ("found_at", "preset_chosen", etc.)
```

### 3. Assess Mode: Drift → Amendments → Apply

```typescript
// assess.ts:
// 1. Get VISION.md from documents
// 2. Get last 30 days of: issues, comments, agent sessions
// 3. For each VISION section, check observed behavior vs declared intention
// 4. Surface drift items in chat as proposals:
//    - "Growth section says 'focus on Y', but last month 80% activity on X"
//    - Propose amendment: update Growth section to reflect observed direction
// 5. Show Amendment Protocol gate: "CEO review required? Yes/No"
// 6. amendment-protocol.ts enforces: if amendment=YES, add dated changelog entry

// apply.ts:
// 1. SDK: update VISION.md with amendments + changelog
// 2. SDK: cascade changes to relevant agents (create issues for agents whose instructions now differ)
// 3. engagement-memory.ts: store assessment findings + amendment decisions
```

### 4. Revive Mode: Diagnostics → Founder-Action Queue

```typescript
// revive.ts classifier:
// - No heartbeats in 30 days → "dead_agent" blocker
// - VISION exists but not followed → "strategic_drift" blocker
// - High issue backlog + no recent comments → "governance_loop" blocker
// - Tool failure in recent runs → "integration_broken" blocker
// Propose one of: unblock agent, clarify VISION, escalate to founder

// if founder chooses "sample-pivot":
// - Create issue: "Treat existing work as sample pass for critique"
// - Provision fresh production-mode agents
// - Copy prior agents' outputs as samples to critique issue
// - Queue wakeup for new agents to do critique pass

// founder-action-queue generator:
// - Parse all blockers + recommendations
// - Enumerate founder's explicit action items in priority order
// - SDK: create single "founder-action-queue" document
```

### 5. Reposition Mode: Scoped Interview → Amendments

```typescript
// reposition.ts:
// 1. Ask founder: "What's changing?" (brand? voice? scope? target market?)
// 2. Ask delta-only questions (not full interview)
// 3. Generate targeted VISION amendments (only changed sections)
// 4. Show cascade plan: which agents need updated instructions

// apply.ts:
// 1. SDK: update VISION.md with amendments only
// 2. SDK: create cascade issues (agents, brand/voice changes)
```

## Cross-Mode Primitives

All modes share these building blocks:

### Inventory Primitive

```typescript
// src/primitives/inventory.ts
export interface InventorySnapshot {
  company: Company;
  agents: Agent[] with adapter_config inspection;
  issues: Issue[] (last 30 days);
  visionDocument: IssueDocument | null;
  bootstrapDocument: IssueDocument | null;
  lastHeartbeatDates: Map<agentId, Date>;
  recentBlockers: Blocker[];
  gitLastCommitDate?: Date;
  workspaceInfo?: PluginWorkspace;
}

async function captureInventory(
  ctx: PluginContext,
  companyId: string
): Promise<InventorySnapshot> {
  // read agents, issues, documents via SDK
  // parse VISION.md if exists
  // check adapter_config.instructionsBundleMode for dual-path awareness
  // return snapshot
}
```

### Mode Detection Primitive

```typescript
// src/primitives/mode-detection.ts
export type CompassMode = "Found" | "Assess" | "Revive" | "Reposition";

export function detectMode(snapshot: InventorySnapshot): {
  autoDetected: CompassMode;
  confidence: "high" | "medium";
  signals: string[];
} {
  // VISION missing → Found (high confidence)
  // VISION present, recent heartbeats, healthy issues → Assess (high)
  // VISION present, no heartbeats 30+ days, blockers → Revive (high)
  // VISION present, healthy, founder override → Reposition (user choice)
  // Return detected mode + human-readable signals for UI display
}
```

### SDK Adapter (Architectural Enforcer)

```typescript
// src/sdk/adapter.ts — SINGLE CHOKEPOINT for all writes
// This file is the only place plugin code calls ctx.issues.create, ctx.issues.update, etc.

export async function applyDocumentWrite(
  ctx: PluginContext,
  companyId: string,
  documentKey: string,
  body: string,
  metadata: { title?: string; format?: string }
): Promise<DocumentHandle> {
  // SDK call: create or update document
  // All writes to documents route through here
}

export async function applyAgentProvisioning(
  ctx: PluginContext,
  companyId: string,
  agents: AgentBlueprint[]
): Promise<Agent[]> {
  // Inspect each agent's blueprint
  // Check dual-path: is adapter_config.instructionsBundleMode 'managed' or external?
  // If managed: write to UUID-based path
  // If external: write to adapter_config.instructionsFilePath
  // SDK: create/update agent record
}

export async function queueWakeups(
  ctx: PluginContext,
  companyId: string,
  wakeups: Array<{
    agentId: string;
    reason: string;
    prompt?: string;
  }>
): Promise<WakeupRequest[]> {
  // For each agent wakeup:
  // Generate idempotency_key = `compass-${mode}-${company}-${agent}-${timestamp}`
  // SDK: insert into agent_wakeup_requests with status='queued'
  // Deduplicate: if idempotency_key already queued, skip
}
```

### Amendment Protocol Primitive

```typescript
// src/primitives/amendment-protocol.ts
export async function proposeAmendment(
  ctx: PluginContext,
  companyId: string,
  section: VisionSection,
  newBody: string,
  rationale: string,
  requiresCEOReview: boolean
): Promise<AmendmentProposal> {
  // Return structured proposal, NOT applied yet
  // Display to founder with checkbox: "Require CEO review?"
  // Wait for founder confirmation before calling applyAmendment()
}

export async function applyAmendment(
  ctx: PluginContext,
  companyId: string,
  proposal: AmendmentProposal
): Promise<AmendmentRecord> {
  // Get current VISION.md
  // Apply section edit
  // Add dated changelog entry: "2026-05-02: [Section] amended via Compass [rationale]"
  // SDK: update VISION.md document
  // Return amendment record for engagement memory
}
```

### Engagement Memory Primitive

```typescript
// src/primitives/engagement-memory.ts
export interface EngagementMemory {
  companyId: string;
  lastEngagementAt: string;
  lastMode: CompassMode;
  priorFindings: string[];
  openRecommendations: string[];
  amendmentHistory: AmendmentRecord[];
  history: EngagementEntry[];
}

export async function persistEngagement(
  ctx: PluginContext,
  companyId: string,
  entry: EngagementEntry
): Promise<void> {
  // Load existing "compass-engagement-history" document
  // Append entry + new findings + recommendations
  // SDK: update document
}

export async function loadEngagement(
  ctx: PluginContext,
  companyId: string
): Promise<EngagementMemory | null> {
  // SDK: get "compass-engagement-history" document
  // Parse and return, or null if not found
}
```

## Build Order & Milestone Alignment

### M1: Skeleton + Inventory + Mode Detection (read-only)
- [ ] Fork company-wizard, rename to compass
- [ ] Wire manifest.ts with sidebar + main panel slots
- [ ] Implement inventory.ts primitive
- [ ] Implement mode-detection.ts primitive
- [ ] Implement main-panel.tsx to display inventory snapshot + detected mode
- [ ] Add mode override selector (founder can force different mode)
- [ ] **Output:** Diagnostic dashboard, no writes

### M2: Found Mode
- [ ] Port vision-quest 6-section interview into found.ts
- [ ] Implement interview-prompts.ts + vision-template.ts (parameterized, separable from UI)
- [ ] Implement found.tsx UI flow (Q&A step machine)
- [ ] Implement inline preview (render proposed VISION.md + agent list + kickoff issues)
- [ ] Implement preset-library.ts (inherit module + role definitions from company-wizard)
- [ ] Wire apply.ts for document + agent + issue + wakeup writes
- [ ] **Output:** Founders can start new companies via plugin

### M3: Assess Mode
- [ ] Implement drift analyzer (VISION sections vs last 30 days activity)
- [ ] Implement amendment-templates.ts (common drift → amendment patterns)
- [ ] Implement assess.tsx UI (drift items + amendment proposals)
- [ ] Implement amendment-protocol.ts enforcement
- [ ] Wire cascade issue generation (when amendments accepted)
- [ ] **Output:** Founders can audit existing companies for drift

### M4: Revive Mode
- [ ] Implement revival-diagnostics.ts (blocker classification logic)
- [ ] Implement action-queue-templates.ts (founder-action prioritization)
- [ ] Implement revive.tsx UI (diagnostic flowchart + action queue display)
- [ ] Implement sample-pivot.ts (reframe + fresh agent provisioning)
- [ ] **Output:** Founders can unblock stalled companies

### M5: Reposition Mode
- [ ] Implement reposition.ts (delta-only interview)
- [ ] Reuse interview-prompts.ts + vision-template.ts for scoped questions
- [ ] Implement reposition.tsx UI
- [ ] Wire cascade plan (brand/voice agent updates)
- [ ] **Output:** Healthy companies can refresh strategy without full rewrite

### M6: Engagement Memory + Routines
- [ ] Implement engagement-memory.ts primitive
- [ ] Add "History" tab to main-panel.tsx (show prior findings)
- [ ] Add routine scheduling UI (founder configures quarterly Assess, monthly trust-gate)
- [ ] Implement job handler for routine-triggered Assess/Revive
- [ ] **Output:** Plugin remembers engagement history; supports scheduled check-ins

## Plugin Configuration & Safety

### Manifest Capabilities

Compass requires these capabilities (declare all upfront):

```typescript
capabilities: [
  // Read
  "companies.read",
  "agents.read",
  "issues.read",
  "issue.comments.read",
  "issue.documents.read",
  "issue.documents.write",
  "goals.read",
  "projects.read",
  "project.workspaces.read",
  // Write
  "issues.create",
  "issues.update",
  "issue.comments.create",
  "agents.create",
  "agents.update",
  "agents.invoke",
  // Plugin infrastructure
  "plugin.state.read",
  "plugin.state.write",
  "events.subscribe",
  "jobs.schedule",
  "ui.page.register",
  "ui.sidebar.register",
]
```

### Instance Config Schema

```typescript
instanceConfigSchema: {
  type: "object",
  properties: {
    amendmentApprovalMode: {
      type: "string",
      enum: ["founder", "founder+ceo"],
      title: "Amendment Approval Routing",
      description: "Who approves VISION amendments: founder only or founder + CEO agent?",
      default: "founder",
    },
    driftWindowDays: {
      type: "number",
      title: "Drift Detection Window (days)",
      description: "How many days of activity to analyze for Assess mode drift detection",
      default: 30,
    },
    enableScheduledCheckIns: {
      type: "boolean",
      title: "Enable Scheduled Check-Ins",
      description: "Allow founders to schedule recurring strategic check-ins via Routines",
      default: true,
    },
  }
}
```

## Dual-Path Agent Instruction Handling

**Architectural Rule:** All agent writes route through sdk/adapter.ts, which inspects each agent's `adapter_config.instructionsBundleMode` to decide write target.

```typescript
// In apply.ts when provisioning agents:
for (const agentBlueprint of agents) {
  const agentDefaults = {
    name: agentBlueprint.name,
    role: agentBlueprint.role,
    // ... other fields
  };

  // Check if this is managed or external path
  const isManagedMode = agent.adapter_config?.instructionsBundleMode === "managed";

  if (isManagedMode) {
    // SDK handles UUID-based path automatically
    await ctx.agents.create({
      ...agentDefaults,
      // Don't set instructionsFilePath; SDK uses managed path
    });
  } else if (agentBlueprint.externalInstructionsPath) {
    // External path: SDK writes instructions to provided path
    await ctx.agents.create({
      ...agentDefaults,
      adapter_config: {
        instructionsBundleMode: "external",
        instructionsFilePath: agentBlueprint.externalInstructionsPath,
      },
    });
  } else {
    // Fallback to managed mode
    await ctx.agents.create(agentDefaults);
  }
}
```

## Vision-Quest Content Portability

Content lives in `src/content/` as TypeScript or markdown-in-JS, **NOT inlined in UI components**.

**Why:** Aron Prins can edit interview prompts and VISION.md template in a separate branch (or even separate file), and maintainers can merge content updates without touching React code.

```typescript
// src/content/interview-prompts.ts — Aron can own this file
export const INTERVIEW_SECTIONS = [
  {
    id: "big-picture",
    title: "Big Picture & Mission",
    questions: [
      {
        id: "mission",
        text: "In one sentence, what problem does your company solve?",
        required: true,
      },
      // ... 8-10 more questions
    ]
  },
  // ... 5 more sections
];

export const VISION_TEMPLATE = `
# VISION.md

## Mission
{mission_answer}

## 12-Month Goal
{goal_12mo_answer}

## Amendment Protocol
Default: NO. CEO may propose amendments with rationale. Board reviews and votes.
Added: 2026-05-02
`;

// ui/found/interview.tsx imports these, no hardcoding
import { INTERVIEW_SECTIONS, VISION_TEMPLATE } from "@/content/interview-prompts";
```

## Testing Strategy

### Unit Tests (per module)

```typescript
// tests/mode-detection.spec.ts
describe("Mode Detection", () => {
  it("detects Found mode when VISION.md missing", () => {
    const snapshot = { visionDocument: null, agents: [/* ... */] };
    const mode = detectMode(snapshot);
    expect(mode.autoDetected).toBe("Found");
  });

  it("detects Assess mode when VISION.md exists and heartbeats recent", () => {
    // ...
  });

  it("detects Revive mode when VISION.md exists but no heartbeats 30+ days", () => {
    // ...
  });
});
```

### Integration Tests (via mock SDK)

```typescript
// tests/found-flow.spec.ts — simulate interview → apply
describe("Found Flow", () => {
  it("generates valid VISION.md from interview answers", async () => {
    const answers = { mission: "...", goal_12mo: "...", /* ... */ };
    const visionBody = generateVisionBody(answers);
    expect(visionBody).toContain("## Mission");
    expect(visionBody).not.toContain("{mission_answer}"); // no placeholders
  });

  it("provisions agents per selected preset", async () => {
    const mockCtx = createMockPluginContext();
    const agents = await provisionAgents(mockCtx, "fast", { /* answers */ });
    expect(agents).toHaveLength(3); // CEO, CoS, one dept head
  });

  it("queues wakeups with idempotency keys", async () => {
    const mockCtx = createMockPluginContext();
    const wakeups = await queueWakeups(mockCtx, "company-123", [/* ... */]);
    expect(wakeups[0].idempotency_key).toMatch(/^compass-found-/);
  });
});
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Mode Logic Scattered in UI Components
**What goes wrong:** Drift detection lives in assess.tsx, revival logic in revive.tsx. When logic changes, you must hunt through multiple files.

**Instead:** All domain logic in `src/modes/` and `src/primitives/`. UI components call pure functions and display results.

### Anti-Pattern 2: Interview Prompts Hardcoded in TSX
**What goes wrong:** Aron wants to update a question; requires PR and rebuild.

**Instead:** Interview content in `src/content/interview-prompts.ts`. UI imports and renders generically. Content changes don't require code changes.

### Anti-Pattern 3: Direct DB Writes from Mode Logic
**What goes wrong:** Mode handlers call `ctx.issues.create()` directly. If SDK call semantics change, refactor all modes.

**Instead:** All writes route through `src/sdk/adapter.ts`. Single place to update if SDK API changes.

### Anti-Pattern 4: Engagement Memory as Plugin-Local SQLite
**What goes wrong:** Plugin data is not versioned, backed up, or synced if Paperclip is replicated later.

**Instead:** Store in `documents` table as `compass-engagement-history` document. Native to Paperclip, versioned, survives plugin reinstall.

### Anti-Pattern 5: Modal-Only Apply Step
**What goes wrong:** Founder changes VISION.md in preview, clicks Apply, changes commit without another confirmation. Silent apply = hard to audit.

**Instead:** Preview → "You are about to commit these changes" → founder re-confirms → apply. Every write has a confirmation gate.

## Scalability Considerations

| Concern | At 100 agents | At 1K agents | At 10K agents |
|---------|--------------|-------------|---------------|
| Inventory snapshot speed | < 1s (all agents in memory) | < 2s (paginate if needed) | Paginate by project; load on demand |
| Drift analysis (30-day window) | < 2s (scan issues + comments) | < 5s (batch queries) | Archive window, sample recent activity |
| Wakeup queuing | Insert 50 rows, deduplicate | Insert 500 rows, batch upsert | Batch by project, use transactional queueing |
| Engagement memory size | ~10KB per company | ~100KB per company (larger history) | Archive old entries, keep last 12 months |

## Sources

- Paperclip Plugin Authoring Guide (`doc/plugins/PLUGIN_AUTHORING_GUIDE.md`)
- Paperclip Plugin Spec (`doc/plugins/PLUGIN_SPEC.md`)
- File Viewer Plugin (working example at `~/Development/Paperclip/plugin-file-viewer/`)
- Kitchen Sink Example Plugin (comprehensive example at `paperclip-temp/packages/plugins/examples/plugin-kitchen-sink-example/`)
- Plugin SDK Types (`paperclip-temp/packages/plugins/sdk/src/types.ts`)
- PROMPT.md (Compass build specification)
- PROJECT.md (Compass requirements + context)
