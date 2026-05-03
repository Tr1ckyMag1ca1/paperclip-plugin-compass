/**
 * Scheduled Routine Management
 *
 * Per D-13, D-14, D-15: Pure functions for cron expression parsing,
 * validation, routine creation with preset mapping, and execution checking.
 * No external cron libraries — manual validation and parsing.
 *
 * Routine presets:
 * - Quarterly: `0 9 1 1,4,7,10 *` (9am, 1st of Q1/Q2/Q3/Q4)
 * - Monthly: `0 9 1 * *` (9am, 1st of every month)
 * - Custom: validated user-provided cron expression
 *
 * Note: createRoutine UUID generation is worker-side only (uses node:crypto).
 * UI imports only validation and parsing functions.
 */

import type { ScheduledRoutine } from "../types/memory.js";

/**
 * Parsed cron expression with individual fields extracted.
 *
 * Per 5-field cron format: minute hour day-of-month month day-of-week
 */
export interface ParsedCron {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

/**
 * Routine schedule validation result.
 */
export interface RoutineScheduleValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a 5-field cron expression format.
 *
 * Per D-15: Validates field count and basic format without full cron parsing.
 * Regex-based, zero external deps.
 *
 * @param cronString Cron expression (e.g., "0 9 1 * *")
 * @returns True if format is valid, false otherwise
 */
export function validateCronExpression(cronString: string): boolean {
  if (!cronString || typeof cronString !== "string") {
    return false;
  }

  const fields = cronString.trim().split(/\s+/);
  if (fields.length !== 5) {
    return false;
  }

  // Each field should be a valid cron component: number, *, range, list, or step
  const cronFieldPattern = /^(\*|(\d+)(-\d+)?)(\/\d+)?([,\d\-]*)?$/;
  for (const field of fields) {
    if (!cronFieldPattern.test(field)) {
      return false;
    }
  }

  return true;
}

/**
 * Parse a cron expression into structured fields.
 *
 * Per D-15: Extracts individual fields from 5-field cron format.
 * Throws if format is invalid.
 *
 * @param cronString Cron expression
 * @returns ParsedCron object with individual fields
 */
export function parseCronExpression(cronString: string): ParsedCron {
  if (!validateCronExpression(cronString)) {
    throw new Error(`Invalid cron expression: ${cronString}`);
  }

  const fields = cronString.trim().split(/\s+/);
  return {
    minute: fields[0],
    hour: fields[1],
    dayOfMonth: fields[2],
    month: fields[3],
    dayOfWeek: fields[4],
  };
}

/**
 * Get cron expression from preset.
 *
 * Per D-15: Maps preset names to cron expressions:
 * - "quarterly" → `0 9 1 1,4,7,10 *`
 * - "monthly" → `0 9 1 * *`
 * - "custom" → validated user-provided cron
 *
 * @param frequencyPreset Preset name or "custom"
 * @param cronString Cron expression (required if frequencyPreset is "custom")
 * @returns Cron expression string
 */
export function getCronFromPreset(
  frequencyPreset: "quarterly" | "monthly" | "custom",
  cronString?: string
): string {
  switch (frequencyPreset) {
    case "quarterly":
      return "0 9 1 1,4,7,10 *"; // 9am, 1st of Q1/Q2/Q3/Q4
    case "monthly":
      return "0 9 1 * *"; // 9am, 1st of every month
    case "custom":
      if (!cronString) {
        throw new Error("Custom frequency requires cronString");
      }
      if (!validateCronExpression(cronString)) {
        throw new Error(`Invalid custom cron expression: ${cronString}`);
      }
      return cronString;
    default:
      throw new Error(`Unknown frequency preset: ${frequencyPreset}`);
  }
}

/**
 * Validate a routine's schedule and configuration.
 *
 * Per D-13: Check cron is valid, mode is valid, name is non-empty.
 *
 * @param routine ScheduledRoutine to validate
 * @returns Validation result with errors array
 */
export function validateRoutineSchedule(routine: ScheduledRoutine): RoutineScheduleValidation {
  const errors: string[] = [];

  // Check name is non-empty
  if (!routine.name || routine.name.trim().length === 0) {
    errors.push("Routine name is required");
  }

  // Check mode is valid
  if (routine.mode !== "Assess" && routine.mode !== "Revive") {
    errors.push(`Invalid mode: ${routine.mode}. Must be Assess or Revive`);
  }

  // Check cron is valid
  if (!validateCronExpression(routine.cron)) {
    errors.push(`Invalid cron expression: ${routine.cron}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a routine should run at the given time.
 *
 * Per D-14: Simplified cron matching (no external libs).
 * Parses cron and checks minute/hour/day-of-month/month/day-of-week against
 * currentTime fields. Returns boolean.
 *
 * Note: This is a simplified implementation. For production, consider a
 * lightweight cron parser, but this handles the common presets correctly.
 *
 * @param routine ScheduledRoutine to check
 * @param currentTime Time to check against (defaults to now)
 * @returns True if routine should run at currentTime, false otherwise
 */
export function shouldRunRoutine(routine: ScheduledRoutine, currentTime: Date = new Date()): boolean {
  try {
    const parsed = parseCronExpression(routine.cron);

    const minute = currentTime.getMinutes();
    const hour = currentTime.getHours();
    const dayOfMonth = currentTime.getDate();
    const month = currentTime.getMonth() + 1; // getMonth is 0-indexed
    const dayOfWeek = currentTime.getDay(); // 0 = Sunday, 6 = Saturday; cron uses 0 = Sunday

    // Check each field (simplified matching for common patterns)
    if (!matchesCronField(parsed.minute, minute)) return false;
    if (!matchesCronField(parsed.hour, hour)) return false;
    if (!matchesCronField(parsed.dayOfMonth, dayOfMonth)) return false;
    if (!matchesCronField(parsed.month, month)) return false;
    if (!matchesCronField(parsed.dayOfWeek, dayOfWeek)) return false;

    return true;
  } catch (e) {
    // Invalid cron — never run
    return false;
  }
}

/**
 * Helper: Check if a value matches a cron field.
 *
 * Handles:
 * - Wildcard (any value)
 * - Single number (exact match)
 * - Comma-separated list (e.g., 1,4,7,10)
 * - Range (e.g., 1-5)
 * - Step (e.g., *\/5 for every 5 units)
 *
 * @param field Cron field string
 * @param value Current time component value
 * @returns True if value matches field, false otherwise
 */
function matchesCronField(field: string, value: number): boolean {
  if (field === "*") return true;

  // Handle step (*/n or n/m)
  if (field.includes("/")) {
    const parts = field.split("/");
    const step = parseInt(parts[1], 10);
    if (isNaN(step) || step <= 0) return false;

    if (parts[0] === "*") {
      return value % step === 0;
    } else {
      const baseNum = parseInt(parts[0], 10);
      return !isNaN(baseNum) && value >= baseNum && (value - baseNum) % step === 0;
    }
  }

  // Handle range (n-m)
  if (field.includes("-") && !field.includes(",")) {
    const parts = field.split("-");
    const start = parseInt(parts[0], 10);
    const end = parseInt(parts[1], 10);
    if (isNaN(start) || isNaN(end)) return false;
    return value >= start && value <= end;
  }

  // Handle list (n,m,...)
  if (field.includes(",")) {
    const values = field.split(",").map((v) => parseInt(v.trim(), 10));
    return values.includes(value);
  }

  // Single number
  const num = parseInt(field, 10);
  return !isNaN(num) && num === value;
}
