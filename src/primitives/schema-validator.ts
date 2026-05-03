import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { SchemaValidationResult } from "../types";

export async function validateSchema(
  ctx: PluginContext
): Promise<SchemaValidationResult> {
  try {
    await Promise.all([
      ctx.agents.list(),
      ctx.issues.list(),
      ctx.documents.list(),
    ]);
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Schema validation failed: ${errorMessage}. Compass requires Paperclip SDK v1.0.0+.`,
    };
  }
}
