import {
  definePlugin,
  runWorker,
  type PluginContext,
} from "@paperclipai/plugin-sdk";
import manifest from "./manifest.js";
import { loadInventory } from "./primitives/inventory.js";
import { detectMode, classifyChatInput } from "./primitives/mode-detect.js";
import type { Mode } from "./types.js";

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
}

export default plugin;
runWorker(plugin, import.meta.url);
