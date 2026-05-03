# Phase 1: Skeleton + Inventory + Mode Detection - Pattern Map

**Mapped:** 2026-05-03
**Files analyzed:** 18
**Analogs found:** 15 / 18 (83%)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/manifest.ts` | manifest | config | `plugin-file-viewer/src/manifest.ts` | exact |
| `src/worker.ts` | worker | event-driven | `plugin-file-viewer/src/worker.ts` | exact |
| `src/ui/index.tsx` | component (export root) | request-response | `plugin-file-viewer/src/ui/index.tsx` | exact |
| `src/ui/MainPanel.tsx` | component (main layout) | request-response | `plugin-kitchen-sink-example/src/ui/` | role-match |
| `src/ui/components/ModeBanner.tsx` | component (ui) | request-response | `plugin-kitchen-sink-example/src/ui/` | role-match |
| `src/ui/components/InventoryDisplay.tsx` | component (ui) | request-response | `plugin-kitchen-sink-example/src/ui/` | role-match |
| `src/ui/components/AgentCard.tsx` | component (ui) | request-response | `plugin-kitchen-sink-example/src/ui/` | role-match |
| `src/ui/components/StatusBadge.tsx` | component (ui) | request-response | `plugin-kitchen-sink-example/src/ui/` | role-match |
| `src/ui/components/DocumentList.tsx` | component (ui) | request-response | `plugin-kitchen-sink-example/src/ui/` | role-match |
| `src/ui/components/ActivityTimeline.tsx` | component (ui) | request-response | `plugin-kitchen-sink-example/src/ui/` | role-match |
| `src/ui/components/ChatPanel.tsx` | component (ui) | request-response | `plugin-kitchen-sink-example/src/ui/` | role-match |
| `src/ui/components/ErrorBoundary.tsx` | component (error handling) | request-response | `plugin-kitchen-sink-example/src/ui/` | role-match |
| `src/sdk/adapter.ts` | service (SDK chokepoint) | CRUD | `plugin-file-viewer/src/worker.ts` | data-flow-match |
| `src/primitives/mode-detect.ts` | utility (pure logic) | transform | `RESEARCH.md code examples` | exact |
| `src/primitives/inventory.ts` | utility (types + loader) | CRUD | `plugin-file-viewer/src/worker.ts` | role-match |
| `src/primitives/schema-validator.ts` | utility (validation) | CRUD | `plugin-file-viewer/src/worker.ts` | role-match |
| `src/types.ts` | types | config | `plugin-kitchen-sink-example/src/worker.ts` | role-match |
| `esbuild.config.mjs` | config (build) | transform | `plugin-file-viewer/esbuild.config.mjs` | exact |

---

## Pattern Assignments

### `src/manifest.ts` (manifest, config)

**Analog:** `plugin-file-viewer/src/manifest.ts`

**Imports pattern** (lines 1-1):
```typescript
import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";
```

**Manifest structure** (lines 3-71):
```typescript
const manifest: PaperclipPluginManifestV1 = {
  id: "paperclipai.plugin-file-viewer",
  apiVersion: 1,
  version: "0.4.0",
  displayName: "Document Review",
  description: "Review agent-produced documents...",
  author: "Paperclip AI Agents",
  categories: ["ui", "workspace"],
  capabilities: [
    "plugin.state.read",
    "plugin.state.write",
    "companies.read",
    "issues.read",
    // ... etc
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui",
  },
  ui: {
    slots: [
      {
        type: "page",
        id: "file-viewer-page",
        displayName: "Document Review",
        routePath: "file-viewer",
        exportName: "FileViewerPage",
      },
      {
        type: "sidebar",
        id: "file-viewer-sidebar",
        displayName: "File Viewer",
        exportName: "FileViewerSidebar",
      },
    ],
  },
};

export default manifest;
```

**Key differences for Compass M1:**
- `id`: Change to `@paperclipai/paperclip-plugin-compass`
- `version`: Start at `0.1.0` (per RESEARCH.md)
- `displayName`: "Compass" (per D-17)
- `categories`: `["ui", "automation"]` (per RESEARCH.md line 438)
- `capabilities`: Read-only in M1 (agents.read, issues.read, documents.read, plugin.state.write for override persistence)
- `ui.slots`: Single sidebarPanel slot for main panel (not page + sidebar like file-viewer; per D-03)

---

### `src/worker.ts` (worker, event-driven)

**Analog:** `plugin-file-viewer/src/worker.ts` + `plugin-hello-world-example/src/worker.ts`

**Imports pattern** (file-viewer, lines 1-2):
```typescript
import { definePlugin, runWorker, type PluginContext } from "@paperclipai/plugin-sdk";
```

**Worker setup with schema validation** (hello-world, lines 10-27):
```typescript
const plugin = definePlugin({
  async setup(ctx) {
    ctx.logger.info(`${PLUGIN_NAME} plugin setup complete`);
  },

  async onHealth() {
    return { status: "ok", message: HEALTH_MESSAGE };
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
```

**Compass M1 addition: Schema validation smoke query** (per D-08, RESEARCH.md lines 559-582):
```typescript
async setup(ctx) {
  try {
    // D-08 smoke query
    await Promise.all([
      ctx.agents.list(),
      ctx.issues.list(),
      ctx.documents.list(),
    ]);
    ctx.logger.info("Compass schema validation passed");
  } catch (error) {
    throw new Error(
      `Compass requires Paperclip SDK v1.0.0+. Validation failed: ${error.message}. See SCHEMA.md.`
    );
  }
}
```

**State helper pattern** (file-viewer, lines 61-82):
```typescript
const REVIEW_STATE_NS = "doc-reviews";

function reviewScopeKey(issueId: string, docKey: string) {
  return {
    scopeKind: "issue" as const,
    scopeId: issueId,
    namespace: REVIEW_STATE_NS,
    stateKey: docKey,
  };
}

async function getReviewState(ctx: PluginContext, issueId: string, docKey: string): Promise<DocReviewState | null> {
  const raw = await ctx.state.get(reviewScopeKey(issueId, docKey));
  if (raw && typeof raw === "object" && "reviewStatus" in (raw as Record<string, unknown>)) {
    return raw as DocReviewState;
  }
  return null;
}

async function setReviewState(ctx: PluginContext, issueId: string, docKey: string, state: DocReviewState): Promise<void> {
  await ctx.state.set(reviewScopeKey(issueId, docKey), state);
}
```

**Compass M1 adaptation (D-09 mode override persistence):**
```typescript
const MODE_OVERRIDE_NS = "mode-override";

async function getModeOverride(ctx: PluginContext, companyId: string): Promise<Mode | null> {
  const raw = await ctx.state.get({
    scopeKind: "company" as const,
    scopeId: companyId,
    namespace: MODE_OVERRIDE_NS,
    stateKey: "current",
  });
  return (raw as Mode) || null;
}

async function setModeOverride(ctx: PluginContext, companyId: string, mode: Mode): Promise<void> {
  await ctx.state.set(
    {
      scopeKind: "company" as const,
      scopeId: companyId,
      namespace: MODE_OVERRIDE_NS,
      stateKey: "current",
    },
    mode
  );
}
```

---

### `src/ui/index.tsx` (component export root, request-response)

**Analog:** `plugin-file-viewer/src/ui/index.tsx`

**Sidebar + Page export pattern** (file-viewer, lines 10-35):
```typescript
import type { PluginSidebarProps } from "@paperclipai/plugin-sdk/ui";

export function FileViewerSidebar({ context }: PluginSidebarProps) {
  const href = `/${context.companyPrefix}/file-viewer`;
  const isActive = typeof window !== "undefined" && window.location.pathname === href;
  return (
    <a
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={[
        "flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors",
        isActive
          ? "bg-accent text-foreground"
          : "text-foreground/80 hover:bg-accent/50 hover:text-foreground",
      ].join(" ")}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" /* ... */>
        {/* SVG icon */}
      </svg>
      <span>File Viewer</span>
    </a>
  );
}

export function FileViewerPage({ context }: PluginPageProps) {
  // Main panel
}
```

**Compass M1 export root** (per D-03, D-17: single sidebarPanel slot):
```typescript
import { MainPanel } from "./MainPanel";

export { MainPanel };
```

**Lucide icon import pattern** (from RESEARCH.md and kitchen-sink example):
```typescript
import { Compass } from "lucide-react";
```

---

### `src/ui/MainPanel.tsx` (component main layout, request-response)

**Analog:** `plugin-file-viewer/src/ui/index.tsx` + `plugin-kitchen-sink-example/src/ui/`

**usePluginData hook pattern** (file-viewer, lines 1-2, 70+):
```typescript
import { useState, useCallback } from "react";
import {
  usePluginData,
  usePluginAction,
  type PluginPageProps,
  type PluginSidebarProps,
} from "@paperclipai/plugin-sdk/ui";

type DocumentsData = { documents: DocumentRecord[]; total: number };

export function FileViewerPage({ context }: PluginPageProps) {
  const { data: documents, loading, error } = usePluginData<DocumentsData>("indexDocuments");
  // ... render based on loading/error/data states
}
```

**Compass M1 adaptation** (per D-03, INV-04, MODE-01):
```typescript
import { usePluginData, useHostContext } from "@paperclipai/plugin-sdk/ui";
import type { InventorySnapshot } from "../types";

export function MainPanel() {
  const { companyId } = useHostContext();
  const { data: inventory, loading, error } = usePluginData<InventorySnapshot>("getInventory");
  const { data: detectedMode, loading: modeLoading } = usePluginData<Mode>("getDetectedMode");

  if (loading) return <div>Loading inventory...</div>;
  if (error) return <ErrorBoundary error={error} />;

  return (
    <div className="compass-panel">
      {/* D-03: Mode banner at top with override dropdown */}
      <ModeBanner inventory={inventory} detectedMode={detectedMode} onModeOverride={handleModeOverride} />
      
      {/* Collapsible sections (D-03) */}
      <InventoryDisplay inventory={inventory} />
      
      {/* Manual refresh button (D-04) */}
      <button onClick={handleRefresh} disabled={loading}>
        Refresh
      </button>
      
      {/* Chat input shell (D-07) */}
      <ChatPanel detectedMode={detectedMode} />
    </div>
  );
}
```

---

### `src/ui/components/ModeBanner.tsx` (component ui, request-response)

**Analog:** Kitchen-sink example UI patterns + UI-SPEC.md copywriting

**Component structure** (based on file-viewer pattern):
```typescript
import { useState } from "react";
import type { Mode } from "../types";

interface ModeBannerProps {
  detectedMode: Mode;
  override: Mode | null;
  onOverrideChange: (mode: Mode) => void;
}

export function ModeBanner({ detectedMode, override, onOverrideChange }: ModeBannerProps) {
  const currentMode = override || detectedMode;
  
  return (
    <div className="border-b bg-card p-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading font-semibold">{getModeLabel(currentMode)}</h2>
          <p className="text-body text-foreground/70">{getModeBannerCopy(currentMode)}</p>
        </div>
        
        <select 
          value={currentMode} 
          onChange={(e) => onOverrideChange(e.target.value as Mode)}
          className="rounded border bg-background px-md py-sm text-sm"
        >
          <option value="Found">Found a new company</option>
          <option value="Assess">Run a fresh audit</option>
          <option value="Revive">Get unstuck</option>
          <option value="Reposition">Pivot strategy</option>
        </select>
      </div>
    </div>
  );
}

function getModeLabel(mode: Mode): string {
  const labels: Record<Mode, string> = {
    Found: "Found mode",
    Assess: "Assess mode",
    Revive: "Revive mode",
    Reposition: "Reposition mode",
  };
  return labels[mode];
}

function getModeBannerCopy(mode: Mode): string {
  const copy: Record<Mode, string> = {
    Found: "No company yet. Let's create a strategic foundation with the vision quest.",
    Assess: "Your company is healthy. Compass can audit drift since the last review.",
    Revive: "Your company is stalled. Let's diagnose the blocker and unlock progress.",
    Reposition: "Your company is healthy. Let's execute a strategic shift together.",
  };
  return copy[mode];
}
```

---

### `src/ui/components/InventoryDisplay.tsx` (component ui, request-response)

**Analog:** Kitchen-sink example collapsible sections pattern

**Collapsible section component** (based on kitchen-sink patterns):
```typescript
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { InventorySnapshot } from "../../types";

interface InventoryDisplayProps {
  inventory: InventorySnapshot;
}

export function InventoryDisplay({ inventory }: InventoryDisplayProps) {
  return (
    <div className="divide-y">
      <CollapsibleSection 
        title={`Agents (${inventory.agentCount})`}
        defaultOpen={true}
      >
        <AgentList agents={inventory.agents} />
      </CollapsibleSection>

      <CollapsibleSection 
        title="Documents"
        defaultOpen={true}
      >
        <DocumentList documents={inventory.documents} />
      </CollapsibleSection>

      <CollapsibleSection 
        title={`Recent Activity (${inventory.recentIssueCount})`}
        defaultOpen={true}
      >
        <ActivityTimeline issues={inventory.recentIssues} />
      </CollapsibleSection>

      <CollapsibleSection 
        title="VISION Status"
        defaultOpen={true}
      >
        <VisionStatusDisplay visionExists={inventory.visionExists} />
      </CollapsibleSection>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)} className="border-b">
      <summary className="flex cursor-pointer items-center gap-2 px-lg py-md font-semibold">
        <ChevronDown className={`h-4 w-4 transition-transform ${!open ? "rotate-90" : ""}`} />
        {title}
      </summary>
      <div className="px-lg py-md">{children}</div>
    </details>
  );
}
```

---

### `src/ui/components/AgentCard.tsx`, `StatusBadge.tsx`, `DocumentList.tsx`, `ActivityTimeline.tsx`, `ChatPanel.tsx`, `ErrorBoundary.tsx`

**Analog:** Kitchen-sink example component patterns

All these UI components follow the same pattern from kitchen-sink:

1. **Props interface at top:**
```typescript
interface ComponentProps {
  data: Type;
  onAction?: (id: string) => void;
}
```

2. **React hooks (useState, useCallback, etc.):**
```typescript
import { useState, useCallback } from "react";
```

3. **Lucide icon imports:**
```typescript
import { Check, X, Clock, Loader } from "lucide-react";
```

4. **Render with Tailwind utility classes** (inherited from host):
```typescript
className="flex items-center gap-sm px-md py-sm rounded bg-card"
```

5. **Error boundary pattern** (kitchen-sink safety):
```typescript
export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="rounded bg-destructive/10 p-lg border border-destructive text-destructive">
      <h3 className="font-semibold">Error loading component</h3>
      <p className="text-sm">{error.message}</p>
    </div>
  );
}
```

---

### `src/sdk/adapter.ts` (service, CRUD)

**Analog:** `plugin-file-viewer/src/worker.ts` indexing + state functions (lines 88-182)

**SDK adapter chokepoint pattern** (per D-19, XC-01):

```typescript
import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { InventorySnapshot } from "../primitives/inventory";

export class PaperclipAdapter {
  constructor(private ctx: PluginContext) {}

  // M1 read-only operations (INV-01, INV-02, INV-03)
  async getInventorySnapshot(): Promise<InventorySnapshot> {
    const agents = await this.ctx.agents.list();
    const issues = await this.ctx.issues.list({ limit: 100 });
    const documents = await this.ctx.documents.list();
    
    const visionDoc = documents.find(d => d.title === "VISION.md");
    const latestHeartbeat = agents.length > 0 
      ? new Date(Math.max(...agents.map(a => a.last_heartbeat_at?.getTime() ?? 0)))
      : null;
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentIssues = issues.filter(i => new Date(i.created_at) > thirtyDaysAgo);
    
    return {
      visionExists: !!visionDoc,
      agentCount: agents.length,
      latestHeartbeat,
      recentIssueCount: recentIssues.length,
      blockerCount: issues.filter(i => i.priority === "blocker").length,
    };
  }

  // D-08 schema validation (INV-06)
  async validateSchema(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.ctx.agents.list();
      await this.ctx.issues.list();
      await this.ctx.documents.list();
      await this.ctx.state.get("test");  // Test state API
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: `Schema validation failed: ${err.message}. Compass requires Paperclip SDK v1.0.0+.`
      };
    }
  }

  // Mode override persistence (D-09)
  async getModeOverride(companyId: string): Promise<Mode | null> {
    const raw = await this.ctx.state.get({
      scopeKind: "company" as const,
      scopeId: companyId,
      namespace: "mode-override",
      stateKey: "current",
    });
    return (raw as Mode) || null;
  }

  async setModeOverride(companyId: string, mode: Mode): Promise<void> {
    await this.ctx.state.set(
      {
        scopeKind: "company" as const,
        scopeId: companyId,
        namespace: "mode-override",
        stateKey: "current",
      },
      mode
    );
  }

  // M2+ will add writeVision, provisionAgent, createIssue, etc.
  // All routes through this file to enforce XC-01 chokepoint
}
```

---

### `src/primitives/mode-detect.ts` (utility pure logic, transform)

**Analog:** RESEARCH.md code examples (lines 328-363, 588-607)

**Pure function pattern** (MODE-01, MODE-02):

```typescript
export interface InventorySnapshot {
  visionExists: boolean;           // VISION.md present in documents
  agentCount: number;
  latestHeartbeat: Date | null;    // Max of agents.last_heartbeat_at
  recentIssueCount: number;        // Count in last 30 days
  blockerCount: number;            // High-priority blockers
}

export type Mode = "Found" | "Assess" | "Revive" | "Reposition";

export function detectMode(inventory: InventorySnapshot): Mode {
  // MODE-01, MODE-02: hard rules, no LLM
  if (!inventory.visionExists && inventory.agentCount === 0) {
    return "Found";
  }
  if (inventory.visionExists && inventory.latestHeartbeat) {
    const daysSinceHeartbeat = (Date.now() - inventory.latestHeartbeat.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceHeartbeat < 7) {
      return "Assess";  // Healthy
    }
  }
  if (inventory.visionExists && (!inventory.latestHeartbeat || inventory.blockerCount > 2)) {
    return "Revive";    // Stalled
  }
  return "Reposition";  // Healthy but founder-initiated shift (confirmed by override)
}

export function classifyChatInput(input: string): Mode | null {
  // MODE-04: lightweight keyword classifier
  if (/assess|audit|drift|review/i.test(input)) return "Assess";
  if (/revive|unstuck|blocked|stall/i.test(input)) return "Revive";
  if (/reposition|pivot|rebrand|shift/i.test(input)) return "Reposition";
  if (/found|new|company|bootstrap/i.test(input)) return "Found";
  return null;  // Fall back to auto-detected mode
}
```

---

### `src/primitives/inventory.ts` (utility types + loader, CRUD)

**Analog:** `plugin-file-viewer/src/worker.ts` (lines 6-55 type definitions, lines 88-182 indexing logic)

**Inventory snapshot types and loader:**

```typescript
import type { PluginContext } from "@paperclipai/plugin-sdk";

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  last_heartbeat_at: Date | null;
}

export interface Document {
  id: string;
  title: string;
  key: string;
  format: string;
  created_at: Date;
  updated_at: Date;
}

export interface Issue {
  id: string;
  identifier: string;
  title: string;
  status: string;
  priority: string;
  created_at: Date;
  updated_at: Date;
}

export interface InventorySnapshot {
  companyId: string;
  agents: Agent[];
  agentCount: number;
  documents: Document[];
  visionExists: boolean;
  recentIssues: Issue[];
  recentIssueCount: number;
  latestHeartbeat: Date | null;
  blockerCount: number;
}

export async function loadInventory(ctx: PluginContext, companyId: string): Promise<InventorySnapshot> {
  const [agents, issues, documents] = await Promise.all([
    ctx.agents.list({ company_id: companyId }),
    ctx.issues.list({ company_id: companyId }),
    ctx.documents.list({ company_id: companyId }),
  ]);

  const visionDoc = documents.find(d => d.title === "VISION.md");
  const latestHeartbeat = agents.length > 0 
    ? new Date(Math.max(...agents.map(a => a.last_heartbeat_at?.getTime() ?? 0)))
    : null;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentIssues = issues.filter(i => new Date(i.created_at) > thirtyDaysAgo);

  return {
    companyId,
    agents,
    agentCount: agents.length,
    documents,
    visionExists: !!visionDoc,
    recentIssues,
    recentIssueCount: recentIssues.length,
    latestHeartbeat,
    blockerCount: issues.filter(i => i.priority === "blocker").length,
  };
}
```

---

### `src/primitives/schema-validator.ts` (utility validation, CRUD)

**Analog:** `plugin-file-viewer/src/worker.ts` (lines 88-100 smoke query pattern)

**Schema validation utility:**

```typescript
import type { PluginContext } from "@paperclipai/plugin-sdk";

export interface SchemaValidationResult {
  success: boolean;
  error?: string;
}

export async function validateSchema(ctx: PluginContext): Promise<SchemaValidationResult> {
  try {
    // D-08 smoke query: validate read access to all tables
    await Promise.all([
      ctx.agents.list({ limit: 1 }),
      ctx.issues.list({ limit: 1 }),
      ctx.documents.list({ limit: 1 }),
      ctx.state.get({ scopeKind: "company" as const, scopeId: "test", namespace: "test", stateKey: "test" }),
    ]);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { 
      success: false, 
      error: `Schema validation failed: ${message}. Compass requires Paperclip SDK v1.0.0+. See SCHEMA.md for details.`
    };
  }
}
```

---

### `src/types.ts` (types, config)

**Analog:** `plugin-kitchen-sink-example/src/worker.ts` (lines 36-57 type definitions)

**Shared types file:**

```typescript
export type Mode = "Found" | "Assess" | "Revive" | "Reposition";

export interface InventorySnapshot {
  companyId: string;
  agents: Agent[];
  agentCount: number;
  documents: Document[];
  visionExists: boolean;
  recentIssues: Issue[];
  recentIssueCount: number;
  latestHeartbeat: Date | null;
  blockerCount: number;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  last_heartbeat_at: Date | null;
}

export interface Document {
  id: string;
  title: string;
  key: string;
  format: string;
  created_at: Date;
  updated_at: Date;
}

export interface Issue {
  id: string;
  identifier: string;
  title: string;
  status: string;
  priority: string;
  created_at: Date;
  updated_at: Date;
}

export interface PluginConfig {
  companyId: string;
  companyPrefix: string;
}
```

---

### `esbuild.config.mjs` (config build, transform)

**Analog:** `plugin-file-viewer/esbuild.config.mjs` (lines 1-17)

**Complete esbuild configuration:**

```javascript
import esbuild from "esbuild";
import { createPluginBundlerPresets } from "@paperclipai/plugin-sdk/bundlers";

const presets = createPluginBundlerPresets({ uiEntry: "src/ui/index.tsx" });
const watch = process.argv.includes("--watch");

const workerCtx = await esbuild.context(presets.esbuild.worker);
const manifestCtx = await esbuild.context(presets.esbuild.manifest);
const uiCtx = await esbuild.context(presets.esbuild.ui);

if (watch) {
  await Promise.all([workerCtx.watch(), manifestCtx.watch(), uiCtx.watch()]);
  console.log("esbuild watch mode enabled for worker, manifest, and ui");
} else {
  await Promise.all([workerCtx.rebuild(), manifestCtx.rebuild(), uiCtx.rebuild()]);
  await Promise.all([workerCtx.dispose(), manifestCtx.dispose(), uiCtx.dispose()]);
}
```

---

## Shared Patterns

### TypeScript Configuration

**Source:** `plugin-file-viewer/tsconfig.json`

**Apply to:** Root tsconfig.json for entire Compass plugin

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "lib": ["ES2023", "DOM"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src"]
}
```

---

### Plugin SDK State Management

**Source:** `plugin-file-viewer/src/worker.ts` (lines 61-82)

**Apply to:** All state persistence in Compass (D-09 mode override, and M2+ write confirmations)

**Pattern:** Scoped state with namespace + stateKey:
```typescript
const scope = {
  scopeKind: "company" as const,  // or "issue", "agent", etc.
  scopeId: companyId,             // the entity ID
  namespace: "feature-name",      // feature namespace to avoid collisions
  stateKey: "property",           // the specific key within that namespace
};

// Read
const value = await ctx.state.get(scope);

// Write
await ctx.state.set(scope, value);
```

---

### Plugin SDK Adapter Pattern

**Source:** `plugin-file-viewer/src/worker.ts` (lines 88-182 indexing logic)

**Apply to:** `src/sdk/adapter.ts` for all Paperclip DB access

**Pattern: Class-based adapter with single responsibility per method:**
```typescript
export class PaperclipAdapter {
  constructor(private ctx: PluginContext) {}

  // Each method wraps one SDK call sequence
  async methodName(): Promise<ReturnType> {
    const data = await this.ctx.entities.list(/* params */);
    // Transform / filter / enrich data
    return transformedData;
  }
}
```

---

### Plugin Manifest & Worker Entry

**Source:** `plugin-hello-world-example/src/manifest.ts` + `src/worker.ts`

**Apply to:** All Compass Phase 1 plugins

**Pattern:**
1. Export manifest as default named export from `src/manifest.ts`
2. Define plugin with `definePlugin()` including `setup()` and `onHealth()` hooks
3. Call `runWorker(plugin, import.meta.url)` at bottom of `src/worker.ts`

---

### React Component Hook Patterns

**Source:** `plugin-file-viewer/src/ui/index.tsx` (lines 1-2, 70+)

**Apply to:** All Compass UI components

**Pattern:**
```typescript
import { useState, useCallback } from "react";
import { usePluginData, usePluginAction, useHostContext } from "@paperclipai/plugin-sdk/ui";

export function MainComponent() {
  const { companyId, companyPrefix } = useHostContext();
  const { data, loading, error } = usePluginData<DataType>("handlerName");
  const { trigger } = usePluginAction("actionName");

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <ErrorComponent error={error} />}
      {data && <DataComponent data={data} />}
    </div>
  );
}
```

---

### Error Handling in Worker Setup

**Source:** RESEARCH.md (lines 559-582), `plugin-hello-world-example/src/worker.ts`

**Apply to:** Worker setup, schema validation, adapter methods

**Pattern:** Try/catch with founder-readable error messages:
```typescript
async setup(ctx) {
  try {
    // D-08 smoke query
    await this.validateSchema(ctx);
    ctx.logger.info("Plugin initialization successful");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Plugin initialization failed: ${message}. See SCHEMA.md for details.`);
  }
}
```

---

## No Analog Found

Files with no close match in existing Paperclip plugins (will use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `tests/mode-detect.spec.ts` | test | transform | Mode detection logic is Compass-specific; no reference plugin has pure logic tests |
| `tests/inventory.spec.ts` | test | CRUD | Inventory snapshot is Compass-specific; file-viewer doesn't expose schema validation tests |
| `tests/fixtures/` | test | config | Test fixtures (founded / healthy / stalled / repositioning companies) are Compass-specific per D-06 |

**Mitigation:** Use Vitest + `@paperclipai/plugin-sdk/testing` `createTestHarness` directly (per RESEARCH.md lines 143-161). Test harness is proven in file-viewer; all tests will use mock host (no real Paperclip dependency).

---

## Metadata

**Analog search scope:**
- `/Users/nicholasrhodes/Development/Paperclip/plugin-file-viewer/` (working production plugin v0.4.0)
- `/Users/nicholasrhodes/Development/paperclip-temp/packages/plugins/examples/` (official reference plugins)
- `/Users/nicholasrhodes/Development/Paperclip/paperclip-plugin-compass/.planning/` (Phase 1 research/context)

**Files scanned:** 18
**Directories searched:** 8
**Analogs identified:** 15 exact + role-match patterns
**Pattern extraction date:** 2026-05-03

**Confidence:** HIGH
- Plugin SDK v1.0.0 stable and proven in file-viewer v0.4.0
- esbuild preset pattern verified across multiple examples
- React hook patterns consistent across file-viewer and kitchen-sink
- Worker lifecycle (setup/onHealth) stable across all examples
- Mode detection logic directly from RESEARCH.md (locked decisions)

---

*Pattern mapping complete. Ready for planning.*
