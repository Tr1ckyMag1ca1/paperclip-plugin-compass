import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { SchemaValidationResult } from "../types.js";

export async function validateSchema(
  ctx: PluginContext
): Promise<SchemaValidationResult> {
  try {
    // Validate schema by checking core entities
    // Use a placeholder companyId for schema validation (will fail if user has no companies)
    // Alternatively, we could use ctx.companies.list() to avoid needing a company ID
    const companies = await ctx.companies.list();
    if (companies.length === 0) {
      throw new Error("No companies found");
    }
    const companyId = companies[0].id;

    await Promise.all([
      ctx.agents.list({ companyId }),
      ctx.issues.list({ companyId }),
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
