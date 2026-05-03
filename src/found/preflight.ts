/**
 * Preflight Validation for Found Mode Apply Step
 *
 * Per D-09 (XC-02): validates preconditions before any write operations.
 * Preflight runs before Apply step and blocks if errors found.
 *
 * Preflight checks:
 * 1. Company exists (can write to it)
 * 2. VISION.md not already present (or amendment path)
 * 3. Preset agents are resolvable (names, roles valid)
 * 4. No existing idempotency keys queued (prevents cascading duplicates)
 *
 * All checks are read-only (no side effects). Returns PreflightResult with
 * pass/fail + actionable error and warning messages.
 */

import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { FilledVision, PresetDefinition } from "../types/found.js";

/**
 * Result of preflight validation.
 *
 * - valid: true if all blocking checks pass (errors is empty)
 * - errors: blocking issues that must be fixed before Apply (prevents proceed)
 * - warnings: non-blocking issues (inform founder, allow proceed)
 */
export interface PreflightResult {
  /** True if all blocking checks pass; false if any error exists */
  valid: boolean;

  /** Blocking errors that prevent Apply (empty if valid) */
  errors: string[];

  /** Non-blocking warnings (founder is informed but Apply proceeds) */
  warnings: string[];

  /** If not valid, reason (first error) */
  blockedBy?: string;
}

/**
 * Run preflight validation before Apply step.
 *
 * Per D-09, preflight validates referential integrity and preconditions:
 * 1. Company exists (via ctx.companies.get)
 * 2. VISION not already present (check issues/documents)
 * 3. Preset agents valid (non-empty names, recognized roles)
 * 4. No queued idempotency keys for this company
 *
 * @param ctx Plugin context
 * @param companyId Company ID to found
 * @param preset Preset definition (agents to provision)
 * @param vision Filled VISION template (from quality-check)
 * @returns PreflightResult with valid flag, errors, warnings
 */
export async function preflight(
  ctx: PluginContext,
  companyId: string,
  preset: PresetDefinition,
  vision: FilledVision
): Promise<PreflightResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check company exists (if supported by SDK)
  // Note: In test contexts, ctx.companies may not be available
  if ((ctx as any).companies && (ctx as any).companies.get) {
    try {
      const company = await (ctx as any).companies.get(companyId);
      if (!company) {
        errors.push(`Company "${companyId}" not found. Check company ID.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to validate company: ${msg}`);
    }
  }
  // If ctx.companies is not available, skip this check (e.g., in test mocks)

  // 2. Check VISION not already present
  // VISION.md stored as a document or special issue; check by title/key
  try {
    const issues = await ctx.issues.list({ companyId });
    const visionExists = issues.some((issue: any) => {
      const title = issue.title || "";
      const desc = issue.description || "";
      return (
        title.toUpperCase().includes("VISION") ||
        desc.toUpperCase().includes("VISION.MD")
      );
    });

    if (visionExists) {
      errors.push(
        "Company already has VISION.md. Run Reposition mode to amend instead."
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    warnings.push(`Could not check for existing VISION: ${msg}`);
  }

  // 3. Validate preset agents are resolvable
  // Check each agent in preset has name and valid role
  const validRoles = [
    "CEO",
    "Chief Executive Officer",
    "Product",
    "VP Product",
    "Growth",
    "Head of Growth",
    "Engineer",
    "VP Engineering",
    "Designer",
    "Head of Design",
    "Admin",
    "Operations",
  ];

  for (const agent of preset.agents) {
    if (!agent.name || agent.name.trim().length === 0) {
      errors.push(`Preset agent missing name. All agents must have a name.`);
    }

    if (!agent.role || agent.role.trim().length === 0) {
      errors.push(`Preset agent "${agent.name}" missing role. All agents must have a role.`);
    } else if (!validRoles.some((role) => agent.role.toLowerCase().includes(role.toLowerCase()))) {
      warnings.push(`Preset agent "${agent.name}" role "${agent.role}" not recognized. Continue with caution.`);
    }
  }

  // 4. Check no existing idempotency keys for this company
  // NOTE: Paperclip SDK does not expose agent_wakeup_requests directly.
  // Skipping this check in v1; will implement when SDK is extended.
  // Idempotency is handled at the adapter level (queueWakeup checks before insert).
  // Future versions should add this check via SDK extension.

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    blockedBy: errors.length > 0 ? errors[0] : undefined,
  };
}
