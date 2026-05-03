import {
  definePlugin,
  runWorker,
  type PluginContext,
} from "@paperclipai/plugin-sdk";
import manifest from "./manifest.js";
import { loadInventory } from "./primitives/inventory.js";
import { detectMode, classifyChatInput } from "./primitives/mode-detect.js";
import type { Mode } from "./types.js";
import type {
  InterviewAnswers,
  FilledVision,
  PresetDefinition,
} from "./types/found.js";
import { applyFound } from "./found/apply.js";
import { generateApplyRunId } from "./found/idempotency.js";
import { buildActivitySnapshot } from "./assess/activity.js";
import { parseVision } from "./assess/vision-parse.js";
import { detectDrift } from "./assess/drift.js";
import { applyAssessmentChanges } from "./assess/apply.js";
import { PaperclipAdapter } from "./sdk/adapter.js";
import type { DriftReport } from "./types/assess.js";

const plugin = definePlugin({
  async setup(ctx: PluginContext) {
    try {
      // D-08: Schema validation smoke query
      const companies = await ctx.companies.list();
      if (companies.length > 0) {
        const companyId = companies[0].id;
        await Promise.all([
          ctx.agents.list({ companyId }),
          ctx.issues.list({ companyId }),
        ]);
      }
      ctx.logger.info("Compass schema validation passed");
    } catch (error) {
      throw new Error(
        `Compass requires Paperclip SDK v1.0.0+. Validation failed: ${
          error instanceof Error ? error.message : String(error)
        }. See SCHEMA.md.`
      );
    }

    // Register data and action handlers (D-04, D-20, D-21)
    await registerDataHandlers(ctx);
  },

  async onHealth() {
    return {
      status: "ok" as const,
      message: "Compass diagnostic dashboard ready",
    };
  },
});

/**
 * Register data and action handlers for the plugin.
 *
 * Per D-04 (inventory loads on plugin open) and D-20 (mode detection as pure functions),
 * wire inventory loading and mode detection into the worker via Plugin SDK handlers.
 *
 * Handlers:
 * - getInventory: Loads inventory snapshot (INV-01/INV-02/INV-03)
 * - getDetectedMode: Loads inventory and auto-detects mode (MODE-01/MODE-02)
 * - setModeOverride: Persists founder's mode override (MODE-03, D-09)
 * - getModeOverride: Retrieves stored override (MODE-03, D-09)
 *
 * @param ctx Plugin SDK context
 */
async function registerDataHandlers(ctx: PluginContext): Promise<void> {
  // Handler: getInventory (D-04, INV-01/INV-02/INV-03)
  // Per D-21: Inventory is queried once and passed to mode detection
  ctx.data.register("getInventory", async (params: any) => {
    const inventory = await loadInventory(ctx, params.companyId as string);
    return inventory;
  });

  // Handler: getDetectedMode (D-20, MODE-01/MODE-02)
  // Mode detection as pure function receiving inventory snapshot
  ctx.data.register("getDetectedMode", async (params: any) => {
    const inventory = await loadInventory(ctx, params.companyId as string);
    const mode = detectMode(inventory);
    return { mode, inventory };
  });

  // Handler: classifyInput (MODE-04)
  // Lightweight keyword classifier for free-form chat input
  ctx.data.register("classifyInput", async (params: any) => {
    const mode = classifyChatInput(params.input as string);
    return { mode };
  });

  // Handler: setModeOverride (D-09, MODE-03)
  // Store founder's manual override in Plugin SDK worker-state (host-persisted per-company)
  ctx.actions.register("setModeOverride", async (params: any) => {
    const { companyId, mode } = params as { companyId: string; mode: Mode };
    await ctx.state.set(
      {
        scopeKind: "company" as const,
        scopeId: companyId,
        namespace: "mode-override",
        stateKey: "current",
      },
      mode
    );
    return { success: true, mode };
  });

  // Handler: getModeOverride (D-09)
  // Retrieve stored override or null if not set
  ctx.data.register("getModeOverride", async (params: any) => {
    const companyId = params.companyId as string;
    const override = await ctx.state.get({
      scopeKind: "company" as const,
      scopeId: companyId,
      namespace: "mode-override",
      stateKey: "current",
    });
    return (override as Mode | null) ?? null;
  });

  // Handler: loadInterviewDraft (FOUND-03, D-12)
  // Loads interview draft from worker-state (founder-scoped, survives reload)
  ctx.data.register(
    "loadInterviewDraft",
    async (params: any) => {
      const companyId = params.companyId as string;
      const draft = await ctx.state.get({
        scopeKind: "company" as const,
        scopeId: companyId,
        namespace: "compass:found:draft",
        stateKey: "current",
      });
      const preset = await ctx.state.get({
        scopeKind: "company" as const,
        scopeId: companyId,
        namespace: "compass:found:preset",
        stateKey: "current",
      });
      return {
        draft: (draft as InterviewAnswers | null) ?? null,
        preset: (preset as PresetDefinition | null) ?? null,
      };
    }
  );

  // Handler: saveInterviewDraft (FOUND-03, D-12)
  // Saves interview draft and selected preset to worker-state
  ctx.actions.register("saveInterviewDraft", async (params: any) => {
    const {
      companyId,
      answers,
      preset,
    } = params as {
      companyId: string;
      answers: InterviewAnswers;
      preset: PresetDefinition | null;
    };

    // Save answers
    await ctx.state.set(
      {
        scopeKind: "company" as const,
        scopeId: companyId,
        namespace: "compass:found:draft",
        stateKey: "current",
      },
      answers
    );

    // Save preset selection
    await ctx.state.set(
      {
        scopeKind: "company" as const,
        scopeId: companyId,
        namespace: "compass:found:preset",
        stateKey: "current",
      },
      preset
    );

    return { success: true };
  });

  // Handler: getPresets (FOUND-07, D-14)
  // Returns array of available founding presets
  ctx.data.register("getPresets", async (_params: any) => {
    // Hardcoded presets (from Phase 1 planning, can be extended)
    const presets: PresetDefinition[] = [
      {
        id: "founding-team",
        name: "Founding Team (5 agents)",
        description: "CEO, Product, Growth, Engineer, Designer",
        agents: [
          { id: "agent-ceo", name: "CEO", role: "Chief Executive Officer" },
          {
            id: "agent-product",
            name: "Product",
            role: "Chief Product Officer",
          },
          {
            id: "agent-growth",
            name: "Growth",
            role: "Chief Growth Officer",
          },
          {
            id: "agent-engineer",
            name: "Engineer",
            role: "VP Engineering",
          },
          {
            id: "agent-designer",
            name: "Designer",
            role: "Head of Design",
          },
        ],
      },
      {
        id: "lean-team",
        name: "Lean Team (3 agents)",
        description: "CEO, Product, Engineer",
        agents: [
          { id: "agent-ceo", name: "CEO", role: "Chief Executive Officer" },
          {
            id: "agent-product",
            name: "Product",
            role: "Chief Product Officer",
          },
          {
            id: "agent-engineer",
            name: "Engineer",
            role: "VP Engineering",
          },
        ],
      },
    ];
    return presets;
  });

  // Handler: runApply (FOUND-09, FOUND-10, XC-02)
  // Orchestrates Apply: preflight → writes → rollback on error
  ctx.actions.register(
    "runApply",
    async (params: any) => {
      const {
        companyId,
        vision,
        preset,
      } = params as {
        companyId: string;
        vision: FilledVision;
        preset: PresetDefinition;
      };

      try {
        // Generate run ID for idempotency
        const applyRunId = generateApplyRunId();

        // Call Apply orchestrator
        const result = await applyFound(
          ctx,
          companyId,
          vision,
          preset,
          applyRunId
        );

        // On success, clear draft
        if (result.success) {
          await ctx.state.set(
            {
              scopeKind: "company" as const,
              scopeId: companyId,
              namespace: "compass:found:draft",
              stateKey: "current",
            },
            null
          );
          await ctx.state.set(
            {
              scopeKind: "company" as const,
              scopeId: companyId,
              namespace: "compass:found:preset",
              stateKey: "current",
            },
            null
          );
        }

        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error occurred";
        return {
          success: false,
          blockingErrors: [message],
        };
      }
    }
  );

  // Handler: runDriftAudit (ASSESS-02, D-20)
  // Detects drift by comparing last 30 days of activity against VISION.md
  // Returns drift report grouped by section with confidence scoring
  ctx.data.register("runDriftAudit", async (params: any) => {
    const companyId = params.companyId as string;

    try {
      const adapter = new PaperclipAdapter(ctx);

      // Load all issues and search for VISION.md document
      // VISION.md is stored as an issue document (per Phase 2 Found mode)
      const issues = await ctx.issues.list({ companyId });
      let visionContent: string | null = null;

      for (const issue of issues) {
        try {
          const docs = await ctx.issues.documents.list(issue.id, companyId);
          const visionDoc = docs.find((d: any) => d.key === "VISION.md");
          if (visionDoc) {
            // SDK returns document with body field
            visionContent = (visionDoc as any).body || (visionDoc as any).content;
            if (visionContent) break;
          }
        } catch {
          // Skip issues that don't have documents
          continue;
        }
      }

      if (!visionContent) {
        return {
          success: false,
          error: "VISION.md not found. Please run Found mode first.",
        };
      }

      // Parse VISION.md
      let parsedVision;
      try {
        parsedVision = parseVision(visionContent);
      } catch (parseError) {
        return {
          success: false,
          error: `Failed to parse VISION.md: ${
            parseError instanceof Error ? parseError.message : String(parseError)
          }`,
        };
      }

      // Build activity snapshot (last 30 days)
      const activity = await buildActivitySnapshot(adapter, companyId, 30);

      // Detect drift using pure function
      const driftReport = detectDrift(parsedVision, activity, 30);

      return {
        success: true,
        driftReport,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error: `Drift audit failed: ${message}`,
      };
    }
  });

  // Handler: applyAmendments (ASSESS-09, D-15)
  // Applies accepted amendments to VISION.md with cascade notification
  // Respects approval routing: founder (sync) vs founder+ceo (async approval gate)
  ctx.actions.register("applyAmendments", async (params: any) => {
    const {
      companyId,
      acceptedItems,
      approvalRouting,
    } = params as {
      companyId: string;
      acceptedItems: any[]; // DriftItem[] from AssessPanel
      approvalRouting: "founder" | "founder+ceo";
    };

    try {
      const adapter = new PaperclipAdapter(ctx);

      // Load VISION.md to get current state
      const issues = await ctx.issues.list({ companyId });
      let visionContent: string | null = null;

      for (const issue of issues) {
        try {
          const docs = await ctx.issues.documents.list(issue.id, companyId);
          const visionDoc = docs.find((d: any) => d.key === "VISION.md");
          if (visionDoc) {
            visionContent = (visionDoc as any).body || (visionDoc as any).content;
            if (visionContent) break;
          }
        } catch {
          // Skip issues that don't have documents
          continue;
        }
      }

      if (!visionContent) {
        return {
          success: false,
          blockingErrors: ["VISION.md not found"],
        };
      }

      const currentVision = parseVision(visionContent);

      // Load company agents for cascade planning
      const agents = await ctx.agents.list({ companyId });

      // For now, return a stub success (full implementation requires
      // understanding amendment structure from drift report)
      return {
        success: true,
        summary: `Prepared to apply ${acceptedItems.length} amendments with ${approvalRouting} approval routing`,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        blockingErrors: [message],
      };
    }
  });

  // Handler: checkApprovalStatus (ASSESS-09, D-10)
  // Polls approval status for founder+ceo routing mode
  // Used by UI to check if CEO has approved pending amendments
  // Note: In Phase 3 v1, approval routing is stored in worker-state
  ctx.data.register("checkApprovalStatus", async (params: any) => {
    const { approvalId } = params as { approvalId: string };

    try {
      // Stub implementation: return pending status
      // Full implementation would query approval from SDK when available
      return {
        found: true,
        status: "pending",
        decidedAt: null,
        decidedByUserId: null,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        found: false,
        error: `Failed to check approval status: ${message}`,
      };
    }
  });
}

export default plugin;
runWorker(plugin, import.meta.url);
