/**
 * Relative Time Formatting Utility
 *
 * Pure function: no dependencies, returns human-readable relative time strings.
 * Handles common cases: seconds, minutes, hours, days ago.
 */

/**
 * Format a date as relative time string (e.g., "2 days ago", "1 hour ago").
 * @param date Date to format
 * @param addSuffix If true, appends "ago" or "in" (default: false for manual control)
 * @returns Human-readable relative time string
 */
export function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }): string {
  const now = new Date();
  const ms = now.getTime() - date.getTime();

  if (ms < 0) {
    // Future date
    return formatFutureTime(-ms, options?.addSuffix);
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  let str = "";
  if (years >= 1) {
    str = `${years} year${years !== 1 ? "s" : ""}`;
  } else if (months >= 1) {
    str = `${months} month${months !== 1 ? "s" : ""}`;
  } else if (weeks >= 1) {
    str = `${weeks} week${weeks !== 1 ? "s" : ""}`;
  } else if (days >= 1) {
    str = `${days} day${days !== 1 ? "s" : ""}`;
  } else if (hours >= 1) {
    str = `${hours} hour${hours !== 1 ? "s" : ""}`;
  } else if (minutes >= 1) {
    str = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  } else if (seconds >= 1) {
    str = `${seconds} second${seconds !== 1 ? "s" : ""}`;
  } else {
    str = "just now";
  }

  if (options?.addSuffix && str !== "just now") {
    return `${str} ago`;
  }

  return str;
}

function formatFutureTime(ms: number, addSuffix?: boolean): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let str = "";
  if (days >= 1) {
    str = `${days} day${days !== 1 ? "s" : ""}`;
  } else if (hours >= 1) {
    str = `${hours} hour${hours !== 1 ? "s" : ""}`;
  } else if (minutes >= 1) {
    str = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  } else {
    str = "in a moment";
  }

  if (addSuffix && str !== "in a moment") {
    return `in ${str}`;
  }

  return str;
}
