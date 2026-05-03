import { describe, it, expect } from "vitest";
import { detectMode, classifyChatInput } from "../src/primitives/mode-detect.js";
import { foundedCompanyFixture } from "./fixtures/founded-company.js";
import { healthyCompanyFixture } from "./fixtures/healthy-company.js";
import { stalledCompanyFixture } from "./fixtures/stalled-company.js";
import { repositioningCompanyFixture } from "./fixtures/repositioning-company.js";

describe("Mode Detection (deterministic hard rules)", () => {
  describe("MODE-01: Found mode detection", () => {
    it("detects Found mode when no VISION and no agents", () => {
      const mode = detectMode(foundedCompanyFixture);
      expect(mode).toBe("Found");
    });

    it("detects Found mode as the initial state for new companies", () => {
      const mode = detectMode(foundedCompanyFixture);
      expect(mode).toBe("Found");
      expect(foundedCompanyFixture.visionExists).toBe(false);
      expect(foundedCompanyFixture.agentCount).toBe(0);
    });
  });

  describe("MODE-02a: Assess mode detection (healthy company)", () => {
    it("detects Assess mode when VISION exists and heartbeats are recent (< 7 days)", () => {
      const mode = detectMode(healthyCompanyFixture);
      expect(mode).toBe("Assess");
    });

    it("verifies Assess mode preconditions", () => {
      expect(healthyCompanyFixture.visionExists).toBe(true);
      expect(healthyCompanyFixture.latestHeartbeat).toBeDefined();
      const daysSinceHeartbeat =
        (Date.now() - (healthyCompanyFixture.latestHeartbeat?.getTime() || 0)) /
        (1000 * 60 * 60 * 24);
      expect(daysSinceHeartbeat).toBeLessThan(7);
    });
  });

  describe("MODE-02b: Revive mode detection (stalled company)", () => {
    it("detects Revive mode when no latestHeartbeat exists", () => {
      const companyWithNoHeartbeat = {
        ...healthyCompanyFixture,
        latestHeartbeat: null,
        blockerCount: 0, // <= 2, but no heartbeat triggers Rule 3
      };
      const mode = detectMode(companyWithNoHeartbeat);
      // Rule 3: !latestHeartbeat → Revive
      expect(mode).toBe("Revive");
    });

    it("detects Revive mode when blockerCount > 2 AND latestHeartbeat is stale", () => {
      // Rule 2 only checks if heartbeat is recent (< 7 days)
      // Rule 3 checks !latestHeartbeat OR blockerCount > 2
      // So blockers only trigger Revive if heartbeat is not recent
      const companyWithManyBlockersStale = {
        ...healthyCompanyFixture,
        latestHeartbeat: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (not < 7)
        blockerCount: 3, // > 2
      };
      const mode = detectMode(companyWithManyBlockersStale);
      // Rule 2: heartbeat is 10 days ago (not < 7) → skip Assess
      // Rule 3: latestHeartbeat exists BUT blockerCount > 2 → Revive
      expect(mode).toBe("Revive");
    });

    it("returns Assess mode for company with many blockers but recent heartbeat", () => {
      // Rule 2 has priority: if heartbeat is recent, return Assess regardless of blockers
      const companyWithManyBlockersHealthy = {
        ...healthyCompanyFixture,
        blockerCount: 5, // > 2, but heartbeat is recent
      };
      const mode = detectMode(companyWithManyBlockersHealthy);
      // Rule 2: latestHeartbeat is 1 day ago (< 7) → return Assess
      // (Rule 3 is not even checked because we already returned)
      expect(mode).toBe("Assess");
    });

    it("verifies stalled fixture has recent enough heartbeat to not trigger Revive by heartbeat alone", () => {
      // The stalled fixture was designed to test Reposition fallback, not Revive
      expect(stalledCompanyFixture.visionExists).toBe(true);
      expect(stalledCompanyFixture.latestHeartbeat).toBeDefined();
      const daysSinceHeartbeat =
        (Date.now() - (stalledCompanyFixture.latestHeartbeat?.getTime() || 0)) /
        (1000 * 60 * 60 * 24);
      // Stalled fixture has 20 days without recent heartbeat, but > 7 days means not Assess
      expect(daysSinceHeartbeat).toBeGreaterThanOrEqual(7);
      // But blockerCount <= 2, so it doesn't trigger Revive via blocker rule
      expect(stalledCompanyFixture.blockerCount).toBeLessThanOrEqual(2);
    });
  });

  describe("MODE-02c: Reposition mode detection (edge case)", () => {
    it("detects Reposition when VISION exists with stale heartbeat (7-inf days) and blockerCount <= 2", () => {
      // Stale heartbeat (>= 7 days ago) + VISION exists + blockerCount <= 2
      // Falls through all specific rules → Reposition fallback
      const mode = detectMode(stalledCompanyFixture);
      // latestHeartbeat is 20 days ago (not < 7) → skip Assess
      // blockerCount is 2 (<= 2) AND latestHeartbeat exists → skip Revive
      // Default fallback → Reposition
      expect(mode).toBe("Reposition");
    });

    it("detects Reposition when VISION exists but both Assess and Revive conditions fail", () => {
      // Create a case with stale heartbeat, no blockers (or <= 2)
      const staleHeartbeatNoBlockers = {
        ...repositioningCompanyFixture,
        latestHeartbeat: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (>= 7, not < 7)
        blockerCount: 1, // <= 2 blockers
      };
      const mode = detectMode(staleHeartbeatNoBlockers);
      // Rule 2: latestHeartbeat is 10 days ago (not < 7) → skip Assess
      // Rule 3: latestHeartbeat exists AND blockerCount <= 2 → skip Revive
      // Default fallback → Reposition
      expect(mode).toBe("Reposition");
    });
  });

  describe("Determinism: Mode detection is pure and repeatable", () => {
    it("produces same result for same input (Found)", () => {
      const mode1 = detectMode(foundedCompanyFixture);
      const mode2 = detectMode(foundedCompanyFixture);
      expect(mode1).toBe(mode2);
    });

    it("produces same result for same input (Assess)", () => {
      const mode1 = detectMode(healthyCompanyFixture);
      const mode2 = detectMode(healthyCompanyFixture);
      expect(mode1).toBe(mode2);
    });

    it("produces same result for same input (Revive)", () => {
      const mode1 = detectMode(stalledCompanyFixture);
      const mode2 = detectMode(stalledCompanyFixture);
      expect(mode1).toBe(mode2);
    });
  });
});

describe("Chat Input Classification (MODE-04)", () => {
  describe("Assess mode keywords", () => {
    it('classifies "assess" as Assess mode', () => {
      expect(classifyChatInput("assess this company")).toBe("Assess");
    });

    it('classifies "audit" as Assess mode', () => {
      expect(classifyChatInput("run an audit")).toBe("Assess");
    });

    it('classifies "drift" as Assess mode', () => {
      expect(classifyChatInput("check for drift")).toBe("Assess");
    });

    it('classifies "review" as Assess mode', () => {
      expect(classifyChatInput("review progress")).toBe("Assess");
    });
  });

  describe("Revive mode keywords", () => {
    it('classifies "revive" as Revive mode', () => {
      expect(classifyChatInput("help me revive")).toBe("Revive");
    });

    it('classifies "unstuck" as Revive mode', () => {
      expect(classifyChatInput("get us unstuck")).toBe("Revive");
    });

    it('classifies "blocked" as Revive mode', () => {
      expect(classifyChatInput("we are blocked")).toBe("Revive");
    });

    it('classifies "stall" as Revive mode', () => {
      expect(classifyChatInput("we are stalled")).toBe("Revive");
    });
  });

  describe("Reposition mode keywords", () => {
    it('classifies "reposition" as Reposition mode', () => {
      expect(classifyChatInput("reposition our strategy")).toBe("Reposition");
    });

    it('classifies "pivot" as Reposition mode', () => {
      expect(classifyChatInput("pivot our approach")).toBe("Reposition");
    });

    it('classifies "rebrand" as Reposition mode', () => {
      expect(classifyChatInput("rebrand the company")).toBe("Reposition");
    });

    it('classifies "shift" as Reposition mode', () => {
      expect(classifyChatInput("shift direction")).toBe("Reposition");
    });
  });

  describe("Found mode keywords", () => {
    it('classifies "found" as Found mode', () => {
      expect(classifyChatInput("we just founded")).toBe("Found");
    });

    it('classifies "new" as Found mode', () => {
      expect(classifyChatInput("new company")).toBe("Found");
    });

    it('classifies "company" as Found mode (context dependent)', () => {
      expect(classifyChatInput("start a company")).toBe("Found");
    });

    it('classifies "bootstrap" as Found mode', () => {
      expect(classifyChatInput("bootstrap our startup")).toBe("Found");
    });
  });

  describe("Fallback behavior: No keywords matched", () => {
    it("returns null if no keywords match", () => {
      expect(classifyChatInput("hello world")).toBeNull();
    });

    it("returns null for empty input", () => {
      expect(classifyChatInput("")).toBeNull();
    });

    it("returns null for whitespace-only input", () => {
      expect(classifyChatInput("   ")).toBeNull();
    });

    it("returns null for undefined-like input", () => {
      expect(classifyChatInput("undefined")).toBeNull();
    });
  });

  describe("Case-insensitivity: Keywords matched regardless of case", () => {
    it("matches ASSESS (uppercase)", () => {
      expect(classifyChatInput("ASSESS THIS")).toBe("Assess");
    });

    it("matches Assess (mixed case)", () => {
      expect(classifyChatInput("Assess the company")).toBe("Assess");
    });

    it("matches revive (lowercase)", () => {
      expect(classifyChatInput("revive the team")).toBe("Revive");
    });

    it("matches REVIVE (uppercase)", () => {
      expect(classifyChatInput("HELP REVIVE")).toBe("Revive");
    });
  });
});
