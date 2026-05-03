/**
 * Found Mode Barrel Export
 *
 * Convenience re-exports for all Found mode modules.
 * Allows consumers to import from "../found" instead of individual files.
 *
 * Example:
 *   import { applyFound, preflight, generateIdempotencyKey } from "../found";
 */

export * from "./derive.js";
export * from "./template-fill.js";
export * from "./quality-check.js";
export * from "./preflight.js";
export * from "./apply.js";
export * from "./idempotency.js";
