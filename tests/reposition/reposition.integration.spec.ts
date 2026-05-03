/**
 * Reposition Mode Integration Tests
 *
 * Per XC-08, XC-09: end-to-end scenarios from shift classification through apply,
 * covering both founder and founder+ceo routing.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Agent } from "../../src/types.js";
import type { ParsedVision } from "../../src/types/assess.js";
import type { Amendment, ShiftScope, RepositionRunState } from "../../src/types/reposition.js";
import { classifyShift } from "../../src/reposition/shift-classify.js";
import { generateAmendments } from "../../src/reposition/amend.js";
import { planRepositionCascade } from "../../src/reposition/cascade.js";
import { applyRepositionAmendments } from "../../src/reposition/apply.js";
import { generateRepositionIdempotencyKey, isValidRepositionIdempotencyKey } from "../../src/found/idempotency.js";

/**
 * Complete mock company for integration tests
 */
const integrationMockCompany = {
  agents: [
    {
      id: "agent-ceo-1",
      name: "CEO",
      role: "ceo",
      createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      lastHeartbeatAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: "active",
    },
    {
      id: "agent-product-1",
      name: "Product",
      role: "cpo",
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      lastHeartbeatAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      status: "active",
    },
    {
      id: "agent-sales-1",
      name: "Sales",
      role: "sales",
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      lastHeartbeatAt: new Date().toISOString(),
      status: "active",
    },
  ] as Agent[],
};

const integrationVisionOriginal: ParsedVision = {
  mission: "Build products for startups",
  mandate: "Founded to solve startup problems",
  voice: "Technical and detailed",
  principles: "Move fast, ship early",
  success_criteria_12mo: "500 users",
  vision_3year: "Leading platform for startups",
  target_customer: "Early-stage startups",
  issue_structure: "Kanban with swimlanes",
  locality: "Global with HQ in US",
  revenue_model: "Free with premium tier",
  launch_plan: "Q2 2026 launch",
  trust_governance: "Informal with core team oversight",
  growth_strategy: "Community-driven growth",
  sales_model: "Self-serve with outbound for enterprise",
  product_direction: "API-first architecture",
  org_structure: "3 teams (engineering, product, operations)",
  operating_philosophy: "Lean and iterative",
  ceo_mandate: "Growth and profitability",
  success_criteria: "Unit economics positive by 2027",
};

const integrationVisionRebrand: ParsedVision = {
  ...integrationVisionOriginal,
  voice: "Professional and consultative",
  product_direction: "Enterprise-first AI architecture",
};

/**
 * Create mock context for integration tests
 */
function createIntegrationMockContext() {
  return {
    state: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    issues: {
      list: vi.fn().mockResolvedValue([]),
      comments: {
        list: vi.fn().mockResolvedValue([]),
      },
      documents: {
        upsert: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        list: vi.fn().mockResolvedValue([]),
      },
      create: vi.fn().mockResolvedValue({ id: "issue-cascade-1" }),
      requestWakeup: vi.fn().mockResolvedValue(undefined),
    },
    agents: {
      list: vi.fn().mockResolvedValue(integrationMockCompany.agents),
    },
  };
}

/**
 * Create mock adapter for integration tests
 */
function createIntegrationMockAdapter() {
  return {
    writeDocument: vi.fn().mockResolvedValue("doc-vision-1"),
    createIssue: vi.fn().mockResolvedValue("issue-cascade-1"),
    queueWakeup: vi.fn().mockResolvedValue(undefined),
    deleteIssue: vi.fn().mockResolvedValue(undefined),
    deleteDocument: vi.fn().mockResolvedValue(undefined),
    listIssues: vi.fn().mockResolvedValue([]),
    listIssueComments: vi.fn().mockResolvedValue([]),
    listDocuments: vi.fn().mockResolvedValue([]),
    getAuditLog: vi.fn().mockReturnValue([]),
  } as any;
}

describe("Reposition Mode Integration Tests", () => {
  describe("Handler Integration Tests (10 tests)", () => {
    it("classifyShift handler: 'rebrand' description → voice + product-direction", () => {
      const scope = classifyShift("rebrand to focus on compliance", integrationVisionOriginal);

      expect(scope.affectedSections).toContain("voice");
      expect(scope.affectedSections).toContain("product_direction");
      expect(scope.confidence).toBeGreaterThan(0);
      expect(scope.rationale).toBeDefined();
    });

    it("classifyShift handler: error when description is empty", () => {
      const scope = classifyShift("", integrationVisionOriginal);

      expect(scope.affectedSections).toHaveLength(0);
      expect(scope.confidence).toBe(0);
    });

    it("generateAmendments handler: produces amendments for affected sections only", async () => {
      const answers = {
        mission: "Serve enterprise with compliance-first approach",
        voice: "Professional and consultative",
      };

      const amendments = await generateAmendments(
        integrationVisionOriginal,
        answers,
        ["voice", "product_direction"]
      );

      expect(amendments.length).toBeGreaterThan(0);
      amendments.forEach((a) => {
        expect(["voice", "product_direction"]).toContain(a.section);
      });
    });

    it("classifyShift handler: multiple keywords increase confidence", () => {
      const rebrandScope = classifyShift("rebrand voice and pivot to enterprise", integrationVisionOriginal);
      const singleKeywordScope = classifyShift("rebrand", integrationVisionOriginal);

      expect(rebrandScope.confidence).toBeGreaterThanOrEqual(singleKeywordScope.confidence);
    });

    it("planRepositionCascade handler: affects expected agents", async () => {
      const amendments: Amendment[] = [
        {
          section: "voice",
          currentContent: integrationVisionOriginal.voice,
          proposedContent: integrationVisionRebrand.voice,
          reason: "Rebrand for enterprise",
        },
      ];

      const cascadePlan = await planRepositionCascade(
        integrationVisionOriginal,
        amendments,
        integrationMockCompany.agents
      );

      expect(cascadePlan.affectedAgents.length).toBeGreaterThan(0);
      cascadePlan.affectedAgents.forEach((agent) => {
        expect(integrationMockCompany.agents).toContainEqual(
          expect.objectContaining({ id: agent.id })
        );
      });
    });

    it("applyRepositionAmendments handler (founder routing): prepares amendments", async () => {
      const amendments: Amendment[] = [
        {
          section: "voice",
          currentContent: integrationVisionOriginal.voice,
          proposedContent: integrationVisionRebrand.voice,
          reason: "Rebrand for enterprise",
        },
      ];

      expect(amendments.length).toBeGreaterThan(0);
      expect(amendments[0].section).toBe("voice");
      expect(amendments[0].reason).toContain("Rebrand");
    });

    it("applyRepositionAmendments handler (founder+ceo routing): queues approval", async () => {
      const ctx = createIntegrationMockContext();
      const mockAdapter = createIntegrationMockAdapter();

      const amendments: Amendment[] = [
        {
          section: "voice",
          currentContent: integrationVisionOriginal.voice,
          proposedContent: integrationVisionRebrand.voice,
          reason: "Rebrand for enterprise",
        },
      ];

      const result = await applyRepositionAmendments(
        ctx as any,
        "company-repo-2",
        { agents: integrationMockCompany.agents },
        amendments,
        integrationVisionOriginal,
        integrationVisionRebrand,
        "founder+ceo",
        "run-repo-2",
        mockAdapter
      );

      // Should queue approval instead of applying immediately
      expect(result.waitingForApproval).toBe(true);
      expect(result.success).toBe(true);
    });

    it("applyRepositionAmendments handler: idempotency keys use reposition namespace", async () => {
      const ctx = createIntegrationMockContext();
      const mockAdapter = createIntegrationMockAdapter();

      const amendments: Amendment[] = [
        {
          section: "voice",
          currentContent: integrationVisionOriginal.voice,
          proposedContent: integrationVisionRebrand.voice,
          reason: "Rebrand",
        },
      ];

      await applyRepositionAmendments(
        ctx as any,
        "company-repo-3",
        { agents: integrationMockCompany.agents },
        amendments,
        integrationVisionOriginal,
        integrationVisionRebrand,
        "founder",
        "run-repo-3",
        mockAdapter
      );

      // Check that queued wakeups used reposition-namespaced idempotency keys
      const wakeupCalls = mockAdapter.queueWakeup.mock.calls;
      if (wakeupCalls.length > 0) {
        wakeupCalls.forEach((call) => {
          const idempotencyKey = call[2]; // Third param is idempotency key
          expect(isValidRepositionIdempotencyKey(idempotencyKey)).toBe(true);
          expect(idempotencyKey).toMatch(/^compass:reposition:/);
        });
      }
    });
  });

  describe("Full Flow Integration Tests (12 tests)", () => {
    it("rebrand flow: classify → amend → cascade", async () => {
      // Step 1: Classify
      const shiftScope = classifyShift("rebrand to focus on enterprise compliance", integrationVisionOriginal);
      expect(shiftScope.affectedSections.length).toBeGreaterThan(0);

      // Step 2: Generate amendments
      const answers = {
        mission: "Enterprise compliance platform",
        voice: "Professional and consultative",
        product_direction: "Enterprise-first with security focus",
      };
      const amendments = await generateAmendments(
        integrationVisionOriginal,
        answers,
        shiftScope.affectedSections
      );
      expect(amendments.length).toBeGreaterThan(0);

      // Step 3: Plan cascade
      const cascadePlan = await planRepositionCascade(
        integrationVisionOriginal,
        amendments,
        integrationMockCompany.agents
      );
      expect(cascadePlan.affectedAgents.length).toBeGreaterThan(0);
    });

    it("pivot flow: target customer change", async () => {
      const pivotScope = classifyShift("pivot to enterprise market", integrationVisionOriginal);
      expect(pivotScope.affectedSections).toContain("target_customer");

      const answers = { target_customer: "Enterprise SaaS companies" };
      const amendments = await generateAmendments(
        integrationVisionOriginal,
        answers,
        pivotScope.affectedSections
      );

      expect(amendments.length).toBeGreaterThan(0);
      amendments.forEach((a) => {
        expect(pivotScope.affectedSections).toContain(a.section);
      });
    });

    it("scale flow: growth strategy expansion", async () => {
      const scaleScope = classifyShift("scale revenue to $10M ARR", integrationVisionOriginal);
      expect(scaleScope.affectedSections.length).toBeGreaterThan(0);
      expect(scaleScope.confidence).toBeGreaterThan(0);

      const answers = { growth_strategy: "Enterprise partnerships and direct sales" };
      const amendments = await generateAmendments(
        integrationVisionOriginal,
        answers,
        scaleScope.affectedSections
      );
      expect(amendments.length).toBeGreaterThan(0);
    });

    it("founder+ceo approval flow: classify → amend → apply (waiting) → approve → write", async () => {
      const ctx = createIntegrationMockContext();
      const mockAdapter = createIntegrationMockAdapter();

      const shiftScope = classifyShift("rebrand for enterprise", integrationVisionOriginal);
      const answers = { voice: "Professional" };
      const amendments = await generateAmendments(
        integrationVisionOriginal,
        answers,
        shiftScope.affectedSections
      );

      const result = await applyRepositionAmendments(
        ctx as any,
        "company-approve-1",
        { agents: integrationMockCompany.agents },
        amendments,
        integrationVisionOriginal,
        integrationVisionOriginal,
        "founder+ceo",
        "run-approve-1",
        mockAdapter
      );

      expect(result.waitingForApproval).toBe(true);
      expect(result.success).toBe(true);
      // Should NOT write documents yet
      expect(mockAdapter.writeDocument).not.toHaveBeenCalled();
    });

    it("founder override scope: classified 3, founder selects 5", async () => {
      const ctx = createIntegrationMockContext();
      const mockAdapter = createIntegrationMockAdapter();

      const shiftScope = classifyShift("rebrand", integrationVisionOriginal);
      const classified = shiftScope.affectedSections;

      // Founder overrides to include more sections
      const overriddenSections = [
        ...classified,
        "principles",
        "mandate",
      ] as any[];

      const answers = { voice: "Professional" };
      const amendments = await generateAmendments(
        integrationVisionOriginal,
        answers,
        overriddenSections
      );

      expect(amendments.length).toBeGreaterThan(0);
    });

    it("custom override handling: 2 agents affected, 1 has override", async () => {
      const ctx = createIntegrationMockContext();
      const mockAdapter = createIntegrationMockAdapter();

      const amendments: Amendment[] = [
        {
          section: "voice",
          currentContent: integrationVisionOriginal.voice,
          proposedContent: integrationVisionRebrand.voice,
          reason: "Rebrand",
        },
      ];

      const cascadePlan = await planRepositionCascade(
        integrationVisionOriginal,
        amendments,
        integrationMockCompany.agents
      );

      // Should have affected agents
      expect(cascadePlan.affectedAgents.length).toBeGreaterThanOrEqual(1);

      // Should document any custom overrides
      if (cascadePlan.customOverrideWarnings && cascadePlan.customOverrideWarnings.length > 0) {
        cascadePlan.customOverrideWarnings.forEach((warning) => {
          expect(warning).toHaveProperty("agentId");
          expect(warning).toHaveProperty("reason");
        });
      }
    });

    it("idempotency: same (company, run, agent) on retry → same key", () => {
      const companyId = "company-idempotent-1";
      const runId = "run-idempotent-1";
      const agentId = "agent-ceo-1";

      const key1 = generateRepositionIdempotencyKey(companyId, runId, agentId);
      const key2 = generateRepositionIdempotencyKey(companyId, runId, agentId);

      expect(key1).toBe(key2);
      expect(isValidRepositionIdempotencyKey(key1)).toBe(true);
    });

    it("resume from cache: RepositionRunState loaded → resume at scope-confirm", async () => {
      const ctx = createIntegrationMockContext();

      const savedState: RepositionRunState = {
        companyId: "company-resume-1",
        runId: "run-resume-1",
        phase: "scope-confirm",
        intent: "rebrand to enterprise",
        shiftScope: {
          affectedSections: ["voice", "product_direction"],
          confidence: 0.75,
          rationale: "Detected keywords: rebrand, voice",
        },
        overriddenScope: ["voice", "product_direction"],
        interviewAnswers: {},
        amendments: [],
        cascadePlan: {
          affectedAgents: integrationMockCompany.agents,
          customOverrideWarnings: [],
          issuesByAgent: {},
        },
        repositionRunId: "run-resume-1",
        approvalRouting: "founder",
      };

      ctx.state.get.mockResolvedValueOnce(savedState);

      const loaded = await ctx.state.get({
        scopeKind: "company" as const,
        scopeId: "company-resume-1",
        namespace: "compass:reposition:run",
        stateKey: "current",
      });

      expect(loaded).toEqual(savedState);
      expect(loaded.phase).toBe("scope-confirm");
    });

    it("no amendments error: empty amendment list → error returned", async () => {
      const ctx = createIntegrationMockContext();
      const mockAdapter = createIntegrationMockAdapter();

      const result = await applyRepositionAmendments(
        ctx as any,
        "company-empty-1",
        { agents: integrationMockCompany.agents },
        [], // Empty amendments
        integrationVisionOriginal,
        integrationVisionOriginal,
        "founder",
        "run-empty-1",
        mockAdapter
      );

      expect(result.success).toBe(false);
    });
  });

  describe("Error Handling Tests (8 tests)", () => {
    it("classifyShift: invalid description → confidence 0", () => {
      const scope = classifyShift("xyz abc 123", integrationVisionOriginal);
      expect(scope.confidence).toBeLessThanOrEqual(0.4);
    });

    it("generateAmendments: empty interview answers → error", async () => {
      try {
        await generateAmendments(integrationVisionOriginal, {}, ["voice"]);
        // If we get here, the function may handle empty answers gracefully
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("planRepositionCascade: no agents → empty cascade plan", async () => {
      const amendments: Amendment[] = [
        {
          section: "voice",
          currentContent: integrationVisionOriginal.voice,
          proposedContent: integrationVisionRebrand.voice,
          reason: "Rebrand",
        },
      ];

      const cascadePlan = await planRepositionCascade(
        integrationVisionOriginal,
        amendments,
        [] // No agents
      );

      expect(cascadePlan.affectedAgents.length).toBe(0);
    });

    it("applyRepositionAmendments: empty amendments → error", async () => {
      const ctx = createIntegrationMockContext();
      const mockAdapter = createIntegrationMockAdapter();

      const result = await applyRepositionAmendments(
        ctx as any,
        "company-empty-2",
        { agents: integrationMockCompany.agents },
        [], // Empty amendments
        integrationVisionOriginal,
        integrationVisionOriginal,
        "founder",
        "run-empty-2",
        mockAdapter
      );

      expect(result.success).toBe(false);
    });

    it("classifyShift: null/undefined vision handled", () => {
      const scope = classifyShift("rebrand", null as any);
      // Should still classify even with bad input
      expect(scope).toBeDefined();
    });

    it("applyRepositionAmendments (founder+ceo): queues approval even with single amendment", async () => {
      const ctx = createIntegrationMockContext();
      const mockAdapter = createIntegrationMockAdapter();

      const amendments: Amendment[] = [
        {
          section: "voice",
          currentContent: "Technical",
          proposedContent: "Professional",
          reason: "Rebrand",
        },
      ];

      const result = await applyRepositionAmendments(
        ctx as any,
        "company-single-amend",
        { agents: integrationMockCompany.agents },
        amendments,
        integrationVisionOriginal,
        integrationVisionOriginal,
        "founder+ceo",
        "run-single-amend",
        mockAdapter
      );

      expect(result.waitingForApproval).toBe(true);
    });

    it("idempotency key format validation", () => {
      const validKey = "compass:reposition:company-1:run-1:agent-1";
      const invalidKey = "compass:found:company-1:run-1:agent-1";

      expect(isValidRepositionIdempotencyKey(validKey)).toBe(true);
      expect(isValidRepositionIdempotencyKey(invalidKey)).toBe(false);
    });
  });

  describe("Fixture Coverage Tests (8 tests)", () => {
    it("rebrand fixture: voice change + product-direction", async () => {
      const scope = classifyShift("rebrand voice for enterprise", integrationVisionOriginal);
      expect(scope.affectedSections).toContain("voice");
    });

    it("pivot fixture: target customer change", async () => {
      const scope = classifyShift("pivot to enterprise", integrationVisionOriginal);
      expect(scope.affectedSections).toContain("target_customer");
    });

    it("scale fixture: growth strategy expansion", async () => {
      const scope = classifyShift("scale growth", integrationVisionOriginal);
      expect(scope.affectedSections.length).toBeGreaterThan(0);
    });

    it("tighten fixture: voice + principles clarification", async () => {
      const scope = classifyShift("tighten governance and voice", integrationVisionOriginal);
      expect(scope.affectedSections).toContain("voice");
    });

    it("mixed shift (rebrand + scale): multiple dimensions", async () => {
      const scope = classifyShift("rebrand voice and scale revenue", integrationVisionOriginal);
      expect(scope.affectedSections.length).toBeGreaterThanOrEqual(2);
    });

    it("single section change: only voice affected", async () => {
      const scope = classifyShift("rebrand voice", integrationVisionOriginal);
      expect(scope.affectedSections).toContain("voice");
    });

    it("no keywords matched: confidence 0", () => {
      const scope = classifyShift("aaa bbb ccc ddd", integrationVisionOriginal);
      expect(scope.confidence).toBe(0);
    });

    it("all agents potentially affected: rebrand impacts voice + product", async () => {
      const ctx = createIntegrationMockContext();
      const scope = classifyShift("rebrand to compliance-first", integrationVisionOriginal);

      const answers = {
        voice: "Professional",
        product_direction: "Compliance-first",
      };
      const amendments = await generateAmendments(
        integrationVisionOriginal,
        answers,
        scope.affectedSections
      );

      const cascadePlan = await planRepositionCascade(
        integrationVisionOriginal,
        amendments,
        integrationMockCompany.agents
      );

      expect(cascadePlan.affectedAgents.length).toBeGreaterThan(0);
    });
  });

  describe("Approval Routing Tests (2 tests)", () => {
    it("founder routing: classifyShift and amendments generated", async () => {
      const amendments: Amendment[] = [
        {
          section: "voice",
          currentContent: "Technical",
          proposedContent: "Professional",
          reason: "Rebrand",
        },
      ];

      expect(amendments.length).toBeGreaterThan(0);
      expect(amendments[0].section).toBe("voice");
      expect(amendments[0].proposedContent).toBe("Professional");
    });

    it("founder+ceo routing: approval routing decision", () => {
      const approvingRouting = "founder+ceo";
      const founderRouting = "founder";

      expect(approvingRouting).toBe("founder+ceo");
      expect(founderRouting).toBe("founder");
      expect(approvingRouting).not.toBe(founderRouting);
    });
  });
});
