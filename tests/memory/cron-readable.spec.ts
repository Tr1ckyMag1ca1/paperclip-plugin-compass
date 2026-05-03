import { describe, it, expect } from "vitest";
import { cronToReadable } from "../../src/memory/cron-readable.js";

describe("Cron to Human-Readable Formatter", () => {
  describe("preset expressions", () => {
    it("formats quarterly cron", () => {
      const readable = cronToReadable("0 9 1 1,4,7,10 *");
      expect(readable).toBe("Every quarter, first day at 9:00 AM");
    });

    it("formats monthly cron", () => {
      const readable = cronToReadable("0 9 1 * *");
      expect(readable).toBe("Every month, first day at 9:00 AM");
    });

    it("formats weekly cron (Monday)", () => {
      const readable = cronToReadable("0 9 * * 1");
      expect(readable).toBe("Every Monday at 9:00 AM");
    });
  });

  describe("day-of-week expressions", () => {
    it("formats Sunday", () => {
      const readable = cronToReadable("0 9 * * 0");
      expect(readable).toContain("Sunday");
      expect(readable).toContain("9:00");
    });

    it("formats Friday", () => {
      const readable = cronToReadable("0 9 * * 5");
      expect(readable).toContain("Friday");
    });

    it("formats multiple days", () => {
      const readable = cronToReadable("0 9 * * 1,3,5");
      expect(readable).toContain("Monday");
      expect(readable).toContain("Wednesday");
      expect(readable).toContain("Friday");
    });
  });

  describe("day-of-month expressions", () => {
    it("formats first day of month", () => {
      const readable = cronToReadable("0 9 1 * *");
      expect(readable).toContain("first");
      expect(readable).toContain("month");
    });

    it("formats specific day of month", () => {
      const readable = cronToReadable("0 9 15 * *");
      expect(readable).toContain("15");
    });

    it("formats quarterly with day", () => {
      const readable = cronToReadable("0 9 1 1,4,7,10 *");
      expect(readable).toContain("quarter");
      expect(readable).toContain("first");
    });
  });

  describe("time formatting", () => {
    it("formats morning times", () => {
      const readable = cronToReadable("0 6 * * *");
      expect(readable).toContain("06:00");
    });

    it("formats afternoon times", () => {
      const readable = cronToReadable("0 14 * * *");
      expect(readable).toContain("14:00");
    });

    it("formats with minutes", () => {
      const readable = cronToReadable("30 9 * * *");
      expect(readable).toContain("09:30");
    });

    it("pads single digit hours and minutes", () => {
      const readable = cronToReadable("5 9 * * *");
      expect(readable).toContain("09:05");
    });
  });

  describe("edge cases and fallbacks", () => {
    it("returns 'Custom schedule' for invalid cron", () => {
      expect(cronToReadable("invalid")).toBe("Custom schedule");
      expect(cronToReadable("")).toBe("Custom schedule");
      expect(cronToReadable(null as any)).toBe("Custom schedule");
    });

    it("handles cron with too few fields", () => {
      expect(cronToReadable("0 9 1")).toBe("Custom schedule");
    });

    it("handles unknown day-of-week numbers", () => {
      const readable = cronToReadable("0 9 * * 7");
      // 7 is invalid (0-6), but function should still return something reasonable
      expect(readable).toBeTruthy();
    });

    it("returns fallback for unsupported expressions", () => {
      const readable = cronToReadable("0 9-17 * * *"); // Range for hour
      // Should either parse it or return fallback
      expect(readable).toBeTruthy();
      expect(readable.length).toBeGreaterThan(0);
    });
  });

  describe("specific use cases", () => {
    it("formats daily 9am", () => {
      const readable = cronToReadable("0 9 * * *");
      expect(readable).toContain("9:00");
    });

    it("formats every 15 minutes", () => {
      const readable = cronToReadable("*/15 * * * *");
      expect(readable).toBeTruthy();
    });

    it("formats on specific day-of-month each month", () => {
      const readable = cronToReadable("0 9 15 * *");
      expect(readable).toBeTruthy();
      expect(readable).toContain("15");
    });

    it("formats complex expressions with months", () => {
      const readable = cronToReadable("0 9 1 3,6,9,12 *");
      expect(readable).toBeTruthy();
    });
  });

  describe("whitespace handling", () => {
    it("handles extra whitespace", () => {
      const readable = cronToReadable("  0  9  1  *  *  ");
      expect(readable).toContain("Every month");
      expect(readable).toContain("first day");
      expect(readable).toContain("09:00");
    });

    it("handles normal spacing", () => {
      const readable = cronToReadable("0 9 1 * *");
      expect(readable).toBe("Every month, first day at 9:00 AM");
    });
  });

  describe("comprehensive examples", () => {
    it("format set of realistic routines", () => {
      const cases = [
        { cron: "0 9 1 1,4,7,10 *", expect: /quarter/ },
        { cron: "0 9 1 * *", expect: /month/ },
        { cron: "0 9 * * 1", expect: /Monday/ },
        { cron: "0 14 * * *", expect: /14:00/ },
        { cron: "30 9 * * *", expect: /09:30/ },
      ];

      for (const { cron, expect: pattern } of cases) {
        const readable = cronToReadable(cron);
        expect(readable).toMatch(pattern);
      }
    });
  });
});
