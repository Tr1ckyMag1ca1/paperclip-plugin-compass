/**
 * Cron Expression Human Formatter
 *
 * Per D-12, D-15: Simple formatter that converts cron expressions into
 * human-readable strings. Handles all preset cron expressions and provides
 * fallback for custom crons.
 *
 * No external libraries — pure string templates.
 */

import { validateCronExpression, parseCronExpression } from "./routine.js";

/**
 * Convert a cron expression to human-readable string.
 *
 * Per D-15: Handles preset crons:
 * - `0 9 1 1,4,7,10 *` → "Every quarter, first day at 9:00 AM"
 * - `0 9 1 * *` → "Every month, first day at 9:00 AM"
 * - `0 9 * * 1` → "Every Monday at 9:00 AM"
 *
 * For other expressions, provides basic readable format or "Custom schedule" fallback.
 *
 * @param cronString Cron expression
 * @returns Human-readable description
 */
export function cronToReadable(cronString: string): string {
  // Validate cron format
  if (!validateCronExpression(cronString)) {
    return "Custom schedule";
  }

  const trimmed = cronString.trim();

  // Check for known presets first
  if (trimmed === "0 9 1 1,4,7,10 *") {
    return "Every quarter, first day at 9:00 AM";
  }
  if (trimmed === "0 9 1 * *") {
    return "Every month, first day at 9:00 AM";
  }
  if (trimmed === "0 9 * * 1") {
    return "Every Monday at 9:00 AM";
  }

  // Parse and generate readable string for other expressions
  try {
    const parsed = parseCronExpression(trimmed);

    // Extract time
    const hour = parseInt(parsed.hour, 10);
    const minute = parseInt(parsed.minute, 10);
    const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

    // Handle day-of-week
    if (parsed.dayOfWeek !== "*" && parsed.dayOfMonth === "*") {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      if (parsed.dayOfWeek.includes(",")) {
        // Multiple days — list them
        const dayNums = parsed.dayOfWeek.split(",").map((d) => parseInt(d.trim(), 10));
        const dayList = dayNums.map((d) => dayNames[d] || `Day ${d}`).join(", ");
        return `Every ${dayList} at ${timeStr}`;
      } else {
        const dayNum = parseInt(parsed.dayOfWeek, 10);
        const dayName = dayNames[dayNum] || `Day ${dayNum}`;
        return `Every ${dayName} at ${timeStr}`;
      }
    }

    // Handle day-of-month
    if (parsed.dayOfMonth !== "*") {
      if (parsed.month === "1,4,7,10") {
        return `Every quarter, ${parsed.dayOfMonth === "1" ? "first" : `${parsed.dayOfMonth}th`} day at ${timeStr}`;
      }
      if (parsed.month === "*") {
        return `Every month, ${parsed.dayOfMonth === "1" ? "first" : `${parsed.dayOfMonth}th`} day at ${timeStr}`;
      }
      if (parsed.month.includes(",")) {
        const monthNames = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        const monthNums = parsed.month.split(",").map((m) => parseInt(m.trim(), 10));
        const monthList = monthNums.map((m) => monthNames[m - 1] || `Month ${m}`).join(", ");
        return `On the ${parsed.dayOfMonth === "1" ? "first" : `${parsed.dayOfMonth}th`} of ${monthList} at ${timeStr}`;
      }
    }

    // Handle any/all with just time (no specific day constraints)
    if (parsed.dayOfMonth === "*" && parsed.dayOfWeek === "*" && parsed.month === "*") {
      return `Every day at ${timeStr}`;
    }

    // Default: return cron-like format
    return `Cron: ${trimmed}`;
  } catch (e) {
    return "Custom schedule";
  }
}
