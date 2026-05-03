import { describe, it, expect } from "vitest";
import {
  generateIdempotencyKey,
  isValidIdempotencyKey,
  generateAssessIdempotencyKey,
  isValidAssessIdempotencyKey,
  generateReviveActionKey,
  isValidReviveIdempotencyKey,
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

  // ===== CROSS-MODE TESTS =====

  describe("Cross-Mode Idempotency", () => {
    it("generates distinct keys across modes for same company", () => {
      const company = "acme-corp";
      const foundKey = generateIdempotencyKey(company, "agent-a", "run-1");
      const assessKey = generateAssessIdempotencyKey(company, "run-1", "agent-a");
      const reviveKey = generateReviveActionKey(company, "action-1", 1);

      expect(foundKey).not.toBe(assessKey);
      expect(foundKey).not.toBe(reviveKey);
      expect(assessKey).not.toBe(reviveKey);
    });

    it("all validators reject keys from other modes", () => {
      const foundKey = "compass:found:company:agent:run";
      const assessKey = "compass:assess:company:run:agent";
      const reviveKey = "compass:revive:company:action:1";

      // Found key fails assess and revive validators
      expect(isValidAssessIdempotencyKey(foundKey)).toBe(false);
      expect(isValidReviveIdempotencyKey(foundKey)).toBe(false);

      // Assess key fails found and revive validators
      expect(isValidIdempotencyKey(assessKey)).toBe(false);
      expect(isValidReviveIdempotencyKey(assessKey)).toBe(false);

      // Revive key fails found and assess validators
      expect(isValidIdempotencyKey(reviveKey)).toBe(false);
      expect(isValidAssessIdempotencyKey(reviveKey)).toBe(false);
    });
  });
});
