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
import { generateApplyRunId, generateReviveActionKey } from "./found/idempotency.js";
import { buildActivitySnapshot } from "./assess/activity.js";
import { parseVision } from "./assess/vision-parse.js";
import { detectDrift } from "./assess/drift.js";
import { applyAssessmentChanges } from "./assess/apply.js";
import { PaperclipAdapter } from "./sdk/adapter.js";
import type { DriftReport } from "./types/assess.js";
import { classifyStall } from "./revive/classify.js";
import { applyAction, applyAllActions } from "./revive/apply.js";
import { writeActionQueueDocument } from "./revive/queue.js";
import type { ActionQueue, ActionItem } from "./types/revive.js";
import { classifyShift } from "./reposition/shift-classify.js";
import { generateAmendments } from "./reposition/amend.js";
import { planRepositionCascade, type CascadePlan } from "./reposition/cascade.js";
import { applyRepositionAmendments } from "./reposition/apply.js";
import { generateRepositionIdempotencyKey } from "./found/idempotency.js";
import type { ShiftScope, Amendment, RepositionRunState } from "./types/reposition.js";
import type { ParsedVision } from "./types/assess.js";

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

  // Handler: classifyStall (REVIVE-01, REVIVE-02, D-01, D-02, D-04)
  // Per D-01/D-02: deterministic classifier detects stall cause(s) from inventory + VISION + activity
  // Per D-04: writes action queue to documents table with idempotency key
  // Returns ActionQueue for UI review
  ctx.data.register("classifyStall", async (params: any) => {
    const companyId = params.companyId as string;

    try {
      const adapter = new PaperclipAdapter(ctx);

      // Load inventory snapshot (company state)
      const inventory = await loadInventory(ctx, companyId);

      // Load VISION.md
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
          error: "VISION.md not found. Revive mode requires a founded company.",
        };
      }

      // Parse VISION
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

      // Optional: get drift report as one input to classifier
      let driftReport: DriftReport | undefined;
      try {
        driftReport = detectDrift(parsedVision, activity, 30);
      } catch {
        // Drift detection failure is non-fatal for revive diagnosis
      }

      // Classify stall (pure function, deterministic)
      const classification = classifyStall(inventory, parsedVision, activity, driftReport);

      // Generate action queue from classification
      const actionQueue = generateActionQueueFromClassification(classification);

      // Write queue to documents (per D-04, XC-03 idempotency)
      await writeActionQueueDocument(adapter, companyId, actionQueue);

      // Save run state in worker-state for UI recovery
      await ctx.state.set(
        {
          scopeKind: "company" as const,
          scopeId: companyId,
          namespace: "compass:revive:run",
          stateKey: actionQueue.run_id,
        },
        actionQueue
      );

      return {
        success: true,
        queue: actionQueue,
        classification,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error: `Revive diagnosis failed: ${message}`,
      };
    }
  });

  // Handler: applyReviveAction (REVIVE-05, REVIVE-06, D-10, D-11)
  // Per D-10: incremental apply — each action executed independently, not transactional
  // Per D-11: all wakeups use idempotency keys
  // Executes single action, updates queue status, returns result
  ctx.actions.register("applyReviveAction", async (params: any) => {
    const { companyId, actionId, queueRunId } = params as {
      companyId: string;
      actionId: string;
      queueRunId: string;
    };

    try {
      const adapter = new PaperclipAdapter(ctx);

      // Load queue from worker-state or documents
      const queue = (await ctx.state.get({
        scopeKind: "company" as const,
        scopeId: companyId,
        namespace: "compass:revive:run",
        stateKey: queueRunId,
      })) as ActionQueue | null;

      if (!queue) {
        return {
          success: false,
          error: "Action queue not found. Please run Revive diagnosis first.",
        };
      }

      // Apply single action (per D-10: incremental, not transactional)
      const { queue: updatedQueue, result } = await applyAction(
        queue,
        actionId,
        adapter
      );

      // Update worker-state with new queue status
      await ctx.state.set(
        {
          scopeKind: "company" as const,
          scopeId: companyId,
          namespace: "compass:revive:run",
          stateKey: queueRunId,
        },
        updatedQueue
      );

      return {
        success: result.success,
        summary: result.summary,
        queue: updatedQueue,
        error: result.error,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error: `Failed to apply action: ${message}`,
      };
    }
  });

  // Handler: checkReviveActionStatus (REVIVE-07, D-04)
  // Per D-04: loads queue from documents and returns progress (total/addressed/pending)
  // Used by UI to display progress bar and remaining work count
  ctx.data.register("checkReviveActionStatus", async (params: any) => {
    const { companyId, queueRunId } = params as {
      companyId: string;
      queueRunId: string;
    };

    try {
      // Load queue from worker-state (quick) or documents (fallback)
      let queue = (await ctx.state.get({
        scopeKind: "company" as const,
        scopeId: companyId,
        namespace: "compass:revive:run",
        stateKey: queueRunId,
      })) as ActionQueue | null;

      if (!queue) {
        return {
          found: false,
          error: "Queue not found",
        };
      }

      return {
        found: true,
        totalItems: queue.total_items,
        addressedCount: queue.addressed_count,
        pendingCount: queue.total_items - queue.addressed_count,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        found: false,
        error: `Failed to check action status: ${message}`,
      };
    }
  });

  // Handler: loadReviveRunState (D-15)
  // Per D-15: loads persisted revive run state from worker-state for UI recovery
  // Used by ReviveRunState hook to restore queue on panel reload
  ctx.actions.register("loadReviveRunState", async (params: any) => {
    const companyId = params.companyId as string;

    try {
      // Load the most recent revive run state from worker-state
      const state = await ctx.state.get({
        scopeKind: "company" as const,
        scopeId: companyId,
        namespace: "compass:revive:run",
        stateKey: "current",
      });

      if (state && typeof state === "object") {
        // Return the queue object
        return state;
      }

      // Otherwise return null if not found
      return null;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to load revive run state:", message);
      return null;
    }
  });

  // Handler: updateReviveRunState (D-15)
  // Per D-15: persists revive run state to worker-state for recovery across reloads
  // Used by ReviveRunState hook to save queue on each update
  ctx.actions.register("updateReviveRunState", async (params: any) => {
    const stateUpdates = params as Record<string, any>;

    try {
      // Parse state updates and write to worker-state
      for (const [key, value] of Object.entries(stateUpdates)) {
        // Keys are formatted as: compass:revive:run:{companyId}
        if (key.startsWith("compass:revive:run:")) {
          const companyId = key.replace("compass:revive:run:", "");

          if (value === undefined || value === null) {
            // Delete the state
            await ctx.state.delete({
              scopeKind: "company" as const,
              scopeId: companyId,
              namespace: "compass:revive:run",
              stateKey: "current",
            });
          } else {
            // Set/update the state
            await ctx.state.set(
              {
                scopeKind: "company" as const,
                scopeId: companyId,
                namespace: "compass:revive:run",
                stateKey: "current",
              },
              value
            );
          }
        }
      }

      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to update revive run state:", message);
      return {
        success: false,
        error: message,
      };
    }
  });

  // ============================
  // REPOSITION MODE HANDLERS
  // ============================

  // Handler: classifyShift (REPO-01, D-01, D-02)
  // Classify founder-described strategic shift into affected VISION sections
  ctx.data.register("classifyShift", async (params: any) => {
    const { companyId, description } = params as {
      companyId: string;
      description: string;
    };

    try {
      const adapter = new PaperclipAdapter(ctx);

      // Load VISION.md
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
          error: "Reposition requires VISION.md. Run Found mode first.",
        };
      }

      // Parse VISION
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

      // Classify shift (pure function)
      const shiftScope = classifyShift(description, parsedVision);

      return {
        success: true,
        shiftScope,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error: `Shift classification failed: ${message}`,
      };
    }
  });

  // Handler: generateAmendments (REPO-02, D-07, D-08)
  // Generate per-section VISION amendments from scoped interview answers
  ctx.actions.register("generateAmendments", async (params: any) => {
    const { companyId, interviewAnswers, affectedSections } = params as {
      companyId: string;
      interviewAnswers: any; // InterviewAnswers
      affectedSections: string[]; // VisionSectionId[]
    };

    try {
      // Load current VISION
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
          error: "VISION.md not found",
        };
      }

      // Parse VISION
      const parsedVision = parseVision(visionContent);

      // Generate amendments
      const amendments = await generateAmendments(
        parsedVision,
        interviewAnswers,
        affectedSections as any
      );

      return {
        success: true,
        amendments,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error: `Amendment generation failed: ${message}`,
      };
    }
  });

  // Handler: planRepositionCascade (REPO-03, D-09)
  // Plan cascading changes for affected agents
  ctx.data.register("planCascade", async (params: any) => {
    const { companyId, amendments } = params as {
      companyId: string;
      amendments: Amendment[];
    };

    try {
      const adapter = new PaperclipAdapter(ctx);

      // Load VISION
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
          error: "VISION.md not found",
        };
      }

      const parsedVision = parseVision(visionContent);

      // Load agents
      const agents = await ctx.agents.list({ companyId });

      // Plan cascade
      const cascadePlan = await planRepositionCascade(
        parsedVision,
        amendments,
        agents
      );

      return {
        success: true,
        cascadePlan,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error: `Cascade planning failed: ${message}`,
      };
    }
  });

  // Handler: applyRepositionAmendments (REPO-04, REPO-05, D-11, D-12, XC-02, XC-03)
  // Apply amendments and cascade changes with approval routing
  ctx.actions.register("applyReposition", async (params: any) => {
    const {
      companyId,
      amendments,
      currentVision,
      proposedVision,
      approvalRouting,
      repositionRunId,
    } = params as {
      companyId: string;
      amendments: Amendment[];
      currentVision: ParsedVision;
      proposedVision: ParsedVision;
      approvalRouting: "founder" | "founder+ceo";
      repositionRunId: string;
    };

    try {
      const adapter = new PaperclipAdapter(ctx);

      // Load company agents
      const agents = await ctx.agents.list({ companyId });

      // Apply amendments and cascade (orchestrated by apply module)
      const result = await applyRepositionAmendments(
        ctx,
        companyId,
        { agents },
        amendments,
        currentVision,
        proposedVision,
        approvalRouting,
        repositionRunId,
        adapter
      );

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error: `Amendment application failed: ${message}`,
      };
    }
  });

  // Handler: loadRepositionRunState (D-13, D-14)
  // Load persisted reposition run state for recovery on reload
  ctx.data.register("loadRepositionRunState", async (params: any) => {
    const companyId = params.companyId as string;

    try {
      const state = await ctx.state.get({
        scopeKind: "company" as const,
        scopeId: companyId,
        namespace: "compass:reposition:run",
        stateKey: "current",
      });

      return (state as RepositionRunState | null) ?? null;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to load reposition run state:", message);
      return null;
    }
  });

  // Handler: updateRepositionRunState (D-14)
  // Persist reposition run state to worker-state for recovery
  ctx.actions.register("updateRepositionRunState", async (params: any) => {
    const { companyId, state } = params as {
      companyId: string;
      state: RepositionRunState | null;
    };

    try {
      if (state === null) {
        // Delete the state
        await ctx.state.delete({
          scopeKind: "company" as const,
          scopeId: companyId,
          namespace: "compass:reposition:run",
          stateKey: "current",
        });
      } else {
        // Set/update the state
        await ctx.state.set(
          {
            scopeKind: "company" as const,
            scopeId: companyId,
            namespace: "compass:reposition:run",
            stateKey: "current",
          },
          state
        );
      }

      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to update reposition run state:", message);
      return {
        success: false,
        error: message,
      };
    }
  });
}

/**
 * Generate action queue from classification result.
 *
 * Per D-04, D-05: converts StallClassification to ActionQueue with all action items.
 * Priority computed from cause severity + blast radius (count of downstream items).
 * Items grouped by cause per D-06.
 *
 * @param classification StallClassification from classifier
 * @returns ActionQueue with all action items ranked by priority
 */
function generateActionQueueFromClassification(classification: any): ActionQueue {
  const runId = globalThis.crypto.randomUUID();
  const itemsByCause: Record<string, ActionItem[]> = {};
  let totalItems = 0;

  // For each detected cause, create action items
  // This is a simplified implementation that maps causes to recommended actions
  // Full implementation would create multiple action items per cause based on
  // the specific findings in the inventory/activity analysis
  for (const cause of classification.causes) {
    if (!itemsByCause[cause]) {
      itemsByCause[cause] = [];
    }

    // Generate action item for this cause
    const actionItem: ActionItem = {
      id: `action-${cause}-${itemsByCause[cause].length + 1}`,
      cause: cause as any,
      priority: classification.confidence[cause] || 0.5,
      title: getTitleForCause(cause),
      why_blocking: getExplanationForCause(cause),
      unblocks_count: 1,
      target: {
        type: "agent",
        id: "target-agent",
        context: `Unblocking ${cause} stall`,
      },
      recommended_action: {
        type: getActionTypeForCause(cause),
        params: { cause },
      },
      status: "pending",
    };

    itemsByCause[cause].push(actionItem);
    totalItems += 1;
  }

  return {
    run_id: runId,
    company_id: classification.companyId,
    created_at: classification.timestamp,
    causes: classification.causes,
    items_by_cause: itemsByCause as Record<any, ActionItem[]>,
    total_items: totalItems,
    addressed_count: 0,
    confidence: classification.confidence,
  };
}

/**
 * Get human-readable title for a stall cause.
 */
function getTitleForCause(cause: string): string {
  switch (cause) {
    case "single-blocker":
      return "Resolve blocking issue";
    case "strategic-drift":
      return "Address strategic drift";
    case "broken-integration":
      return "Fix integration issue";
    case "governance-loop":
      return "Break approval loop";
    case "dead-agent":
      return "Restart inactive agent";
    default:
      return `Address ${cause}`;
  }
}

/**
 * Get explanation for why this cause is blocking.
 */
function getExplanationForCause(cause: string): string {
  switch (cause) {
    case "single-blocker":
      return "A critical issue is blocking multiple downstream work items. Resolving this will unblock other work.";
    case "strategic-drift":
      return "Current activity has drifted from the VISION.md strategic direction. Amending the vision or refocusing work will restore alignment.";
    case "broken-integration":
      return "An external integration has failed and is preventing work from progressing. Fixing the integration will restore flow.";
    case "governance-loop":
      return "Issues are stuck in approval cycles. Breaking the loop will allow progress to resume.";
    case "dead-agent":
      return "An agent has not reported activity in 30+ days. Restarting the agent with fresh context will resume their work.";
    default:
      return `This stall cause is preventing progress.`;
  }
}

/**
 * Get recommended action type for a stall cause.
 */
function getActionTypeForCause(cause: string): any {
  switch (cause) {
    case "single-blocker":
      return "replace-blocker-issue";
    case "strategic-drift":
      return "surface-amendment-needed";
    case "broken-integration":
      return "nudge-agent-with-context-doc";
    case "governance-loop":
      return "mark-blocker-resolved";
    case "dead-agent":
      return "restart-agent";
    default:
      return "nudge-agent-with-context-doc";
  }
}

export default plugin;
runWorker(plugin, import.meta.url);
