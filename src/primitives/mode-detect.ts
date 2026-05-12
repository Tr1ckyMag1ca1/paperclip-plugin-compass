import type { InventorySnapshot, Mode } from "../types.js";

/**
 * Detect the company's operating mode based on inventory snapshot.
 *
 * Per MODE-01 and MODE-02, uses hard rules only (no LLM classifier).
 * Rules are deterministic: same input → same output, zero token cost.
 *
 * Hard rules (in order):
 * 1. If no VISION → Found (every other mode panel requires a VISION document;
 *    Assess audits drift against VISION, Revive references it for stall diagnosis,
 *    Reposition pivots it. Returning Reposition for an agents-only company sends
 *    the founder to a panel that just says "No VISION.md found" with a disabled CTA.)
 * 2. Else if VISION exists and recent heartbeats (< 7 days) → Assess (healthy)
 * 3. Else if VISION exists and (no heartbeats OR blockers > 2) → Revive (stalled)
 * 4. Else → Reposition (healthy, founder-initiated shift; requires override in MODE-03)
 *
 * @param inventory The InventorySnapshot to classify
 * @returns One of: "Found" | "Assess" | "Revive" | "Reposition"
 */
export function detectMode(inventory: InventorySnapshot): Mode {
  // Rule 1: No VISION → Found
  if (!inventory.visionExists) {
    return "Found";
  }

  // Rule 2: Recent heartbeats (< 7 days) → Assess (healthy)
  if (inventory.latestHeartbeat) {
    const daysSinceHeartbeat =
      (Date.now() - inventory.latestHeartbeat.getTime()) /
      (1000 * 60 * 60 * 24);

    if (daysSinceHeartbeat < 7) {
      return "Assess";
    }
  }

  // Rule 3: No heartbeats OR blockers > 2 → Revive (stalled)
  if (!inventory.latestHeartbeat || inventory.blockerCount > 2) {
    return "Revive";
  }

  // Rule 4: Default to Reposition (healthy, founder-initiated)
  return "Reposition";
}

/**
 * Classify free-form chat input to a mode via lightweight keyword regex.
 *
 * Per MODE-04, routes user text to the appropriate mode using pattern matching.
 * Case-insensitive matching only. No SQL, no command injection surface.
 * Fallback to null if no keywords match (UI will use auto-detected mode).
 *
 * Patterns:
 * - /assess|audit|drift|review/i → Assess
 * - /revive|unstuck|blocked|stall/i → Revive
 * - /reposition|pivot|rebrand|shift/i → Reposition
 * - /found|new|company|bootstrap/i → Found
 * - Else → null (fallback to auto-detected mode)
 *
 * @param input User's free-form chat input
 * @returns Mode if keywords match, or null to fallback to auto-detected mode
 */
export function classifyChatInput(input: string): Mode | null {
  // Validate input
  if (!input || typeof input !== "string") {
    return null;
  }

  const text = input.trim().toLowerCase();

  // Check Assess keywords
  if (/assess|audit|drift|review/i.test(text)) {
    return "Assess";
  }

  // Check Revive keywords
  if (/revive|unstuck|blocked|stall/i.test(text)) {
    return "Revive";
  }

  // Check Reposition keywords
  if (/reposition|pivot|rebrand|shift/i.test(text)) {
    return "Reposition";
  }

  // Check Found keywords
  if (/found|new|company|bootstrap/i.test(text)) {
    return "Found";
  }

  // No keywords matched
  return null;
}

// Export Mode type for consumers
export type { Mode };
