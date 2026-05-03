import { describe, it, expect } from "vitest";
import {
  validateCronExpression,
  parseCronExpression,
  createRoutine,
  validateRoutineSchedule,
  shouldRunRoutine,
} from "../../src/memory/routine.js";

describe("Scheduled Routine Management", () => {
  describe("validateCronExpression", () => {
    it("validates correct 5-field cron expressions", () => {
      expect(validateCronExpression("0 9 1 * *")).toBe(true);
      expect(validateCronExpression("0 9 1 1,4,7,10 *")).toBe(true);
      expect(validateCronExpression("*/15 * * * *")).toBe(true);
      expect(validateCronExpression("0 0 * * 0")).toBe(true);
    });

    it("rejects invalid cron expressions", () => {
      expect(validateCronExpression("0 9 1 *")).toBe(false); // 4 fields
      expect(validateCronExpression("0 9 1 * * *")).toBe(false); // 6 fields
      expect(validateCronExpression("")).toBe(false); // empty
      expect(validateCronExpression("invalid")).toBe(false); // gibberish
    });

    it("rejects null/undefined input", () => {
      expect(validateCronExpression(null as any)).toBe(false);
      expect(validateCronExpression(undefined as any)).toBe(false);
    });

    it("accepts range expressions", () => {
      expect(validateCronExpression("0-30 * * * *")).toBe(true);
      expect(validateCronExpression("0 8-17 * * *")).toBe(true);
    });

    it("accepts step expressions", () => {
      expect(validateCronExpression("*/5 * * * *")).toBe(true);
      expect(validateCronExpression("0 */2 * * *")).toBe(true);
    });
  });

  describe("parseCronExpression", () => {
    it("parses valid cron expressions", () => {
      const parsed = parseCronExpression("30 14 1 * *");
      expect(parsed.minute).toBe("30");
      expect(parsed.hour).toBe("14");
      expect(parsed.dayOfMonth).toBe("1");
      expect(parsed.month).toBe("*");
      expect(parsed.dayOfWeek).toBe("*");
    });

    it("parses expressions with lists", () => {
      const parsed = parseCronExpression("0 9 1 1,4,7,10 *");
      expect(parsed.month).toBe("1,4,7,10");
    });

    it("parses expressions with ranges", () => {
      const parsed = parseCronExpression("0 8-17 * * *");
      expect(parsed.hour).toBe("8-17");
    });

    it("parses expressions with steps", () => {
      const parsed = parseCronExpression("*/15 * * * *");
      expect(parsed.minute).toBe("*/15");
    });

    it("throws on invalid cron expression", () => {
      expect(() => {
        parseCronExpression("0 9 1");
      }).toThrow(/invalid/i);
    });
  });

  describe("createRoutine", () => {
    it("creates routine with quarterly preset", () => {
      const routine = createRoutine("Q Drift Review", "Assess", "quarterly");

      expect(routine.id).toBeTruthy();
      expect(routine.name).toBe("Q Drift Review");
      expect(routine.mode).toBe("Assess");
      expect(routine.cron).toBe("0 9 1 1,4,7,10 *");
      expect(routine.last_run_at).toBeNull();
      expect(routine.last_finding_ids).toEqual([]);
      expect(routine.created_at).toBeTruthy();
    });

    it("creates routine with monthly preset", () => {
      const routine = createRoutine("Monthly Check", "Revive", "monthly");

      expect(routine.cron).toBe("0 9 1 * *");
      expect(routine.mode).toBe("Revive");
    });

    it("creates routine with custom cron", () => {
      const routine = createRoutine("Custom", "Assess", "custom", "0 15 * * 1");

      expect(routine.cron).toBe("0 15 * * 1");
    });

    it("throws on invalid custom cron", () => {
      expect(() => {
        createRoutine("Bad", "Assess", "custom", "invalid");
      }).toThrow(/invalid/i);
    });

    it("throws if custom preset without cronString", () => {
      expect(() => {
        createRoutine("Bad", "Assess", "custom");
      }).toThrow(/cronString/i);
    });

    it("throws on unknown frequency preset", () => {
      expect(() => {
        createRoutine("Bad", "Assess", "unknown" as any);
      }).toThrow(/unknown.*preset/i);
    });

    it("generates unique IDs for each routine", () => {
      const r1 = createRoutine("R1", "Assess", "monthly");
      const r2 = createRoutine("R2", "Revive", "quarterly");

      expect(r1.id).not.toBe(r2.id);
    });
  });

  describe("validateRoutineSchedule", () => {
    it("validates a correct routine", () => {
      const routine = createRoutine("Valid", "Assess", "monthly");
      const result = validateRoutineSchedule(routine);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("detects invalid cron", () => {
      const routine = createRoutine("Bad", "Assess", "monthly");
      routine.cron = "invalid cron";

      const result = validateRoutineSchedule(routine);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toMatch(/invalid cron/i);
    });

    it("detects invalid mode", () => {
      const routine = createRoutine("Bad", "Assess", "monthly");
      routine.mode = "Invalid" as any;

      const result = validateRoutineSchedule(routine);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.match(/invalid mode/i))).toBe(true);
    });

    it("detects empty name", () => {
      const routine = createRoutine("", "Assess", "monthly");

      const result = validateRoutineSchedule(routine);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.match(/required/i))).toBe(true);
    });

    it("detects multiple errors", () => {
      const routine = createRoutine("Bad", "Assess", "monthly");
      routine.name = "";
      routine.mode = "Invalid" as any;
      routine.cron = "bad";

      const result = validateRoutineSchedule(routine);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("shouldRunRoutine", () => {
    it("returns true when routine matches time", () => {
      const routine = createRoutine("Monthly", "Assess", "monthly");

      // Create a date at 9:00 AM on the 1st of a month
      const testDate = new Date();
      testDate.setDate(1);
      testDate.setHours(9, 0, 0, 0);

      const result = shouldRunRoutine(routine, testDate);
      expect(result).toBe(true);
    });

    it("returns false when minute doesn't match", () => {
      const routine = createRoutine("Scheduled", "Assess", "monthly");

      const testDate = new Date();
      testDate.setDate(1);
      testDate.setHours(9, 30, 0, 0); // 30 minutes instead of 0

      const result = shouldRunRoutine(routine, testDate);
      expect(result).toBe(false);
    });

    it("returns false when hour doesn't match", () => {
      const routine = createRoutine("Scheduled", "Assess", "monthly");

      const testDate = new Date();
      testDate.setDate(1);
      testDate.setHours(10, 0, 0, 0); // 10 instead of 9

      const result = shouldRunRoutine(routine, testDate);
      expect(result).toBe(false);
    });

    it("returns false when day-of-month doesn't match", () => {
      const routine = createRoutine("Scheduled", "Assess", "monthly");

      const testDate = new Date();
      testDate.setDate(2); // 2nd instead of 1st
      testDate.setHours(9, 0, 0, 0);

      const result = shouldRunRoutine(routine, testDate);
      expect(result).toBe(false);
    });

    it("handles quarterly routine", () => {
      const routine = createRoutine("Quarterly", "Assess", "quarterly");

      // Test Q1: January 1st at 9:00 AM
      const q1Date = new Date();
      q1Date.setMonth(0); // January
      q1Date.setDate(1);
      q1Date.setHours(9, 0, 0, 0);

      expect(shouldRunRoutine(routine, q1Date)).toBe(true);

      // Test non-quarterly month
      const nonQDate = new Date();
      nonQDate.setMonth(1); // February
      nonQDate.setDate(1);
      nonQDate.setHours(9, 0, 0, 0);

      expect(shouldRunRoutine(routine, nonQDate)).toBe(false);
    });

    it("handles day-of-week crons", () => {
      const routine = createRoutine("Weekly", "Revive", "custom", "0 9 * * 1");

      // Create a Monday at 9:00 AM
      const monday = new Date();
      while (monday.getDay() !== 1) {
        monday.setDate(monday.getDate() + 1);
      }
      monday.setHours(9, 0, 0, 0);

      expect(shouldRunRoutine(routine, monday)).toBe(true);

      // Create a different day at 9:00 AM
      const otherDay = new Date(monday);
      otherDay.setDate(otherDay.getDate() + 1);

      expect(shouldRunRoutine(routine, otherDay)).toBe(false);
    });

    it("uses current time when not provided", () => {
      // This is a basic sanity check — a routine with current time should behave correctly
      const routine = createRoutine("Test", "Assess", "custom", "0 0 31 2 *");

      // February 31st doesn't exist, so should always return false
      const result = shouldRunRoutine(routine);
      expect(result).toBe(false);
    });

    it("handles step expressions", () => {
      // Every 5 minutes
      const routine = createRoutine("Frequent", "Assess", "custom", "*/5 * * * *");

      const testDate = new Date();
      testDate.setMinutes(0);
      testDate.setSeconds(0);

      expect(shouldRunRoutine(routine, testDate)).toBe(true);

      testDate.setMinutes(5);
      expect(shouldRunRoutine(routine, testDate)).toBe(true);

      testDate.setMinutes(7);
      expect(shouldRunRoutine(routine, testDate)).toBe(false);
    });

    it("handles comma-separated values", () => {
      // Every Monday, Wednesday, Friday at 9am
      const routine = createRoutine("MWF", "Assess", "custom", "0 9 * * 1,3,5");

      const monday = new Date();
      while (monday.getDay() !== 1) monday.setDate(monday.getDate() + 1);
      monday.setHours(9, 0, 0, 0);

      expect(shouldRunRoutine(routine, monday)).toBe(true);

      // Tuesday shouldn't match
      const tuesday = new Date(monday);
      tuesday.setDate(tuesday.getDate() + 1);

      expect(shouldRunRoutine(routine, tuesday)).toBe(false);
    });

    it("returns false on invalid cron", () => {
      const routine = createRoutine("Test", "Assess", "monthly");
      routine.cron = "invalid";

      const result = shouldRunRoutine(routine);
      expect(result).toBe(false);
    });
  });
});
