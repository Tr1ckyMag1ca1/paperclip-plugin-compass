import { describe, it, expect } from "vitest";
import {
  generateIdempotencyKey,
  isValidIdempotencyKey,
  generateAssessIdempotencyKey,
  isValidAssessIdempotencyKey,
  generateReviveActionKey,
  isValidReviveIdempotencyKey,
  generateRepositionIdempotencyKey,
  isValidRepositionIdempotencyKey,
} from "../../src/found/idempotency.js";

describe("Idempotency Key Generation", () => {
  // ===== FOUND MODE TESTS =====

  describe("Found Mode: generateIdempotencyKey", () => {
    it("generates key in format compass:found:{company}:{agent}:{runId}", () => {
      const key = generateIdempotencyKey(
        "acme-corp",
        "agent-ceo-123",
        "run-uuid-here"
      );
      expect(key).toBe("compass:found:acme-corp:agent-ceo-123:run-uuid-here");
    });

    it("is deterministic: same inputs produce same key", () => {
      const key1 = generateIdempotencyKey(
        "company-1",
        "agent-a",
        "run-x"
      );
      const key2 = generateIdempotencyKey(
        "company-1",
        "agent-a",
        "run-x"
      );
      expect(key1).toBe(key2);
    });

    it("produces different keys for different agents", () => {
      const key1 = generateIdempotencyKey("company-1", "agent-a", "run-x");
      const key2 = generateIdempotencyKey("company-1", "agent-b", "run-x");
      expect(key1).not.toBe(key2);
    });

    it("produces different keys for different run IDs", () => {
      const key1 = generateIdempotencyKey("company-1", "agent-a", "run-1");
      const key2 = generateIdempotencyKey("company-1", "agent-a", "run-2");
      expect(key1).not.toBe(key2);
    });
  });

  describe("Found Mode: isValidIdempotencyKey", () => {
    it("returns true for valid found-mode keys", () => {
      const key = "compass:found:acme-corp:agent-ceo:run-123";
      expect(isValidIdempotencyKey(key)).toBe(true);
    });

    it("returns false for keys with missing parts", () => {
      expect(isValidIdempotencyKey("compass:found:acme-corp:agent-ceo")).toBe(false);
      expect(isValidIdempotencyKey("compass:found:acme-corp")).toBe(false);
    });

    it("returns false for keys with wrong namespace", () => {
      expect(
        isValidIdempotencyKey("compass:assess:acme-corp:agent-ceo:run-123")
      ).toBe(false);
      expect(
        isValidIdempotencyKey("compass:revive:acme-corp:action-1:1")
      ).toBe(false);
    });

    it("returns false for malformed keys", () => {
      expect(isValidIdempotencyKey("invalid-key")).toBe(false);
      expect(isValidIdempotencyKey("")).toBe(false);
      expect(isValidIdempotencyKey("compass:found:::")).toBe(false);
    });
  });

  // ===== ASSESS MODE TESTS =====

  describe("Assess Mode: generateAssessIdempotencyKey", () => {
    it("generates key in format compass:assess:{company}:{runId}:{agent}", () => {
      const key = generateAssessIdempotencyKey(
        "acme-corp",
        "assess-run-uuid",
        "agent-ceo-123"
      );
      expect(key).toBe("compass:assess:acme-corp:assess-run-uuid:agent-ceo-123");
    });

    it("is deterministic: same inputs produce same key", () => {
      const key1 = generateAssessIdempotencyKey(
        "company-1",
        "run-a",
        "agent-x"
      );
      const key2 = generateAssessIdempotencyKey(
        "company-1",
        "run-a",
        "agent-x"
      );
      expect(key1).toBe(key2);
    });

    it("produces different keys for different agents", () => {
      const key1 = generateAssessIdempotencyKey("company-1", "run-a", "agent-x");
      const key2 = generateAssessIdempotencyKey("company-1", "run-a", "agent-y");
      expect(key1).not.toBe(key2);
    });
  });

  describe("Assess Mode: isValidAssessIdempotencyKey", () => {
    it("returns true for valid assess-mode keys", () => {
      const key = "compass:assess:acme-corp:assess-run-123:agent-ceo";
      expect(isValidAssessIdempotencyKey(key)).toBe(true);
    });

    it("returns false for found-mode keys", () => {
      expect(
        isValidAssessIdempotencyKey("compass:found:acme-corp:agent-ceo:run-123")
      ).toBe(false);
    });

    it("returns false for revive-mode keys", () => {
      expect(
        isValidAssessIdempotencyKey("compass:revive:acme-corp:action-1:1")
      ).toBe(false);
    });

    it("returns false for malformed keys", () => {
      expect(isValidAssessIdempotencyKey("compass:assess:incomplete")).toBe(false);
      expect(isValidAssessIdempotencyKey("")).toBe(false);
    });
  });

  // ===== REVIVE MODE TESTS =====

  describe("Revive Mode: generateReviveActionKey", () => {
    it("generates key in format compass:revive:{company}:{actionId}:{attempt}", () => {
      const key = generateReviveActionKey(
        "acme-corp",
        "action-single-blocker-1",
        1
      );
      expect(key).toBe("compass:revive:acme-corp:action-single-blocker-1:1");
    });

    it("is deterministic: same inputs produce same key", () => {
      const key1 = generateReviveActionKey(
        "company-1",
        "action-1",
        1
      );
      const key2 = generateReviveActionKey(
        "company-1",
        "action-1",
        1
      );
      expect(key1).toBe(key2);
    });

    it("produces different keys for different action IDs", () => {
      const key1 = generateReviveActionKey("company-1", "action-1", 1);
      const key2 = generateReviveActionKey("company-1", "action-2", 1);
      expect(key1).not.toBe(key2);
    });

    it("produces different keys for different attempts", () => {
      const key1 = generateReviveActionKey("company-1", "action-1", 1);
      const key2 = generateReviveActionKey("company-1", "action-1", 2);
      expect(key1).not.toBe(key2);
    });

    it("produces different keys for different companies", () => {
      const key1 = generateReviveActionKey("company-1", "action-1", 1);
      const key2 = generateReviveActionKey("company-2", "action-1", 1);
      expect(key1).not.toBe(key2);
    });

    it("handles large attempt numbers", () => {
      const key = generateReviveActionKey("company-1", "action-1", 999);
      expect(key).toBe("compass:revive:company-1:action-1:999");
    });
  });

  describe("Revive Mode: isValidReviveIdempotencyKey", () => {
    it("returns true for valid revive-mode keys", () => {
      const key = "compass:revive:acme-corp:action-single-blocker-1:1";
      expect(isValidReviveIdempotencyKey(key)).toBe(true);
    });

    it("returns true for keys with numeric action IDs", () => {
      const key = "compass:revive:acme-corp:action-123:5";
      expect(isValidReviveIdempotencyKey(key)).toBe(true);
    });

    it("returns false for found-mode keys", () => {
      expect(
        isValidReviveIdempotencyKey("compass:found:acme-corp:agent-ceo:run-123")
      ).toBe(false);
    });

    it("returns false for assess-mode keys", () => {
      expect(
        isValidReviveIdempotencyKey("compass:assess:acme-corp:run-123:agent-ceo")
      ).toBe(false);
    });

    it("returns false for keys with missing parts", () => {
      expect(isValidReviveIdempotencyKey("compass:revive:acme-corp:action-1")).toBe(false);
      expect(isValidReviveIdempotencyKey("compass:revive:acme-corp")).toBe(false);
    });

    it("returns false for malformed keys", () => {
      expect(isValidReviveIdempotencyKey("compass:revive:::")).toBe(false);
      expect(isValidReviveIdempotencyKey("invalid-key")).toBe(false);
      expect(isValidReviveIdempotencyKey("")).toBe(false);
    });

    it("returns false for keys with wrong namespace", () => {
      expect(
        isValidReviveIdempotencyKey("compass:unknown:acme-corp:action-1:1")
      ).toBe(false);
    });
  });

  // ===== REPOSITION MODE TESTS =====

  describe("Reposition Mode: generateRepositionIdempotencyKey", () => {
    it("generates key in format compass:reposition:{company}:{runId}:{agent}", () => {
      const key = generateRepositionIdempotencyKey(
        "acme-corp",
        "reposition-run-uuid",
        "agent-ceo-123"
      );
      expect(key).toBe("compass:reposition:acme-corp:reposition-run-uuid:agent-ceo-123");
    });

    it("is deterministic: same inputs produce same key", () => {
      const key1 = generateRepositionIdempotencyKey(
        "company-1",
        "run-uuid-1",
        "agent-x"
      );
      const key2 = generateRepositionIdempotencyKey(
        "company-1",
        "run-uuid-1",
        "agent-x"
      );
      expect(key1).toBe(key2);
    });

    it("produces different keys for different agents", () => {
      const key1 = generateRepositionIdempotencyKey("company-1", "run-1", "agent-a");
      const key2 = generateRepositionIdempotencyKey("company-1", "run-1", "agent-b");
      expect(key1).not.toBe(key2);
    });

    it("produces different keys for different run IDs", () => {
      const key1 = generateRepositionIdempotencyKey("company-1", "run-uuid-1", "agent-a");
      const key2 = generateRepositionIdempotencyKey("company-1", "run-uuid-2", "agent-a");
      expect(key1).not.toBe(key2);
    });

    it("produces different keys for different companies", () => {
      const key1 = generateRepositionIdempotencyKey("company-1", "run-1", "agent-a");
      const key2 = generateRepositionIdempotencyKey("company-2", "run-1", "agent-a");
      expect(key1).not.toBe(key2);
    });
  });

  describe("Reposition Mode: isValidRepositionIdempotencyKey", () => {
    it("returns true for valid reposition-mode keys", () => {
      const key = "compass:reposition:acme-corp:reposition-run-uuid:agent-ceo";
      expect(isValidRepositionIdempotencyKey(key)).toBe(true);
    });

    it("returns true for keys with complex UUIDs", () => {
      const key = "compass:reposition:company-1:f47ac10b-58cc-4372-a567-0e02b2c3d479:agent-123";
      expect(isValidRepositionIdempotencyKey(key)).toBe(true);
    });

    it("returns false for found-mode keys", () => {
      expect(
        isValidRepositionIdempotencyKey("compass:found:acme-corp:agent-ceo:run-123")
      ).toBe(false);
    });

    it("returns false for assess-mode keys", () => {
      expect(
        isValidRepositionIdempotencyKey("compass:assess:acme-corp:run-123:agent-ceo")
      ).toBe(false);
    });

    it("returns false for revive-mode keys", () => {
      expect(
        isValidRepositionIdempotencyKey("compass:revive:acme-corp:action-1:1")
      ).toBe(false);
    });

    it("returns false for keys with missing parts", () => {
      expect(isValidRepositionIdempotencyKey("compass:reposition:acme-corp:run-uuid")).toBe(false);
      expect(isValidRepositionIdempotencyKey("compass:reposition:acme-corp")).toBe(false);
    });

    it("returns false for malformed keys", () => {
      expect(isValidRepositionIdempotencyKey("compass:reposition:::")).toBe(false);
      expect(isValidRepositionIdempotencyKey("invalid-key")).toBe(false);
      expect(isValidRepositionIdempotencyKey("")).toBe(false);
    });

    it("returns false for keys with wrong namespace", () => {
      expect(
        isValidRepositionIdempotencyKey("compass:unknown:acme-corp:run-1:agent")
      ).toBe(false);
    });
  });

  // ===== CROSS-MODE TESTS =====

  describe("Cross-Mode Idempotency", () => {
    it("generates distinct keys across modes for same company", () => {
      const company = "acme-corp";
      const foundKey = generateIdempotencyKey(company, "agent-a", "run-1");
      const assessKey = generateAssessIdempotencyKey(company, "run-1", "agent-a");
      const reviveKey = generateReviveActionKey(company, "action-1", 1);
      const repositionKey = generateRepositionIdempotencyKey(company, "run-1", "agent-a");

      expect(foundKey).not.toBe(assessKey);
      expect(foundKey).not.toBe(reviveKey);
      expect(foundKey).not.toBe(repositionKey);
      expect(assessKey).not.toBe(reviveKey);
      expect(assessKey).not.toBe(repositionKey);
      expect(reviveKey).not.toBe(repositionKey);
    });

    it("all validators reject keys from other modes", () => {
      const foundKey = "compass:found:company:agent:run";
      const assessKey = "compass:assess:company:run:agent";
      const reviveKey = "compass:revive:company:action:1";
      const repositionKey = "compass:reposition:company:run:agent";

      // Found key fails all other validators
      expect(isValidAssessIdempotencyKey(foundKey)).toBe(false);
      expect(isValidReviveIdempotencyKey(foundKey)).toBe(false);
      expect(isValidRepositionIdempotencyKey(foundKey)).toBe(false);

      // Assess key fails all other validators
      expect(isValidIdempotencyKey(assessKey)).toBe(false);
      expect(isValidReviveIdempotencyKey(assessKey)).toBe(false);
      expect(isValidRepositionIdempotencyKey(assessKey)).toBe(false);

      // Revive key fails all other validators
      expect(isValidIdempotencyKey(reviveKey)).toBe(false);
      expect(isValidAssessIdempotencyKey(reviveKey)).toBe(false);
      expect(isValidRepositionIdempotencyKey(reviveKey)).toBe(false);

      // Reposition key fails all other validators
      expect(isValidIdempotencyKey(repositionKey)).toBe(false);
      expect(isValidAssessIdempotencyKey(repositionKey)).toBe(false);
      expect(isValidReviveIdempotencyKey(repositionKey)).toBe(false);
    });
  });
});
