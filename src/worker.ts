import {
  definePlugin,
  runWorker,
  type PluginContext,
} from "@paperclipai/plugin-sdk";
import manifest from "./manifest";

const plugin = definePlugin({
  manifest,

  async setup(ctx: PluginContext) {
    try {
      // D-08: Schema validation smoke query
      await Promise.all([
        ctx.agents.list(),
        ctx.issues.list(),
        ctx.documents.list(),
      ]);
      ctx.logger.info("Compass schema validation passed");
    } catch (error) {
      throw new Error(
        `Compass requires Paperclip SDK v1.0.0+. Validation failed: ${
          error instanceof Error ? error.message : String(error)
        }. See SCHEMA.md.`
      );
    }
  },

  async onHealth() {
    return {
      status: "ok" as const,
      message: "Compass diagnostic dashboard ready",
    };
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
