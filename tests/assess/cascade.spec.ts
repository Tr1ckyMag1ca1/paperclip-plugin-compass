/**
 * Cascade Orchestrator Tests
 *
 * Per D-12, D-13, D-14: test agent screening, override detection, cascade planning,
 * and sequential execution with idempotency key generation.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Agent } from "../../src/types.js";
import type { Amendment, CascadePlan } from "../../src/assess/cascade.js";
import {
  planCascade,
  executeCascade,
} from "../../src/assess/cascade.js";
import { PaperclipAdapter } from "../../src/sdk/adapter.js";
import type { ParsedVision } from "../../src/types/assess.js";

/**
 * Mock agents for testing
 */
const mockAgents: Agent[] = [
  {
    id: "agent-ceo-1",
    name: "CEO",
    role: "cfo", // Finance role
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days old
    lastHeartbeatAt: new Date().toISOString(), // Recent heartbeat
    status: "active",
  } as any,
  {
    id: "agent-sales-1",
    name: "Sales Manager",
    role: "sales",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastHeartbeatAt: new Date().toISOString(),
    status: "active",
  } as any,
  {
    id: "agent-eng-1",
    name: "Engineering Lead",
    role: "cto",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days old
    lastHeartbeatAt: null, // No heartbeat — newly provisioned
    status: "active",
  } as any,
  {
    id: "agent-custom-1",
    name: "Marketing",
    role: "marketing",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastHeartbeatAt: new Date().toISOString(),
    status: "active",
    adapter_config: {
      instructions: "Custom instructions here that differ from baseline",
    },
  } as any,
];

const mockVision: ParsedVision = {
  mission: "Build great products",
  mandate: "Founded to serve customers",
  voice: "Professional and helpful",
  principles: "Integrity, speed, customer focus",
  success_criteria_12mo: "10k users",
  vision_3year: "Market leader",
  target_customer: "Growing companies",
  issue_structure: "Kanban-style",
  locality: "Global",
  revenue_model: "B2B SaaS",
  launch_plan: "Q2 2026",
  trust_governance: "Transparent",
  growth_strategy: "Content + partnerships",
  sales_model: "Direct sales",
  product_direction: "AI-powered",
  org_structure: "5 teams",
  operating_philosophy: "Bias for action",
  ceo_mandate: "Full autonomy",
  success_criteria: "Profitable by year 3",
};

/**
 * Test: Agent screening excludes newly-provisioned agents
 */
it("excludes newly-provisioned agents (< 7d + no heartbeat)", () => {
  const amendments: Amendment[] = [
    {
      section: "cto",
      currentContent: "Old CTO",
      proposedContent: "New CTO",
      evidence: [],
      confidence: 0.8,
      reason: "CTO changed",
      runId: "run-123",
    },
  ];

  const plan = planCascade(mockVision, amendments, mockAgents);

  // agent-eng-1 is < 7 days old with no heartbeat → should be excluded
  const agentIds = plan.affectedAgents.map(a => a.id);
  expect(agentIds).not.toContain("agent-eng-1");

  // agent-ceo-1 and agent-sales-1 should be affected (but not cto in this amendment)
  // (actual affected agents depend on amendment section interpretation)
});

/**
 * Test: Custom override detection flags agents with custom instructions
 */
it("detects custom instruction overrides", () => {
  const amendments: Amendment[] = [
    {
      section: "org_structure",
      currentContent: "Old structure",
      proposedContent: "New structure",
      evidence: [],
      confidence: 0.7,
      reason: "Org changed",
      runId: "run-456",
    },
  ];

  const plan = planCascade(mockVision, amendments, mockAgents);

  // Should detect override on agent-custom-1
  const customWarning = plan.customOverrideWarnings.find(
    w => w.agentId === "agent-custom-1"
  );

  expect(customWarning).toBeDefined();
  expect(customWarning?.hasCustomOverrides).toBe(true);
  expect(customWarning?.override_snippet).toContain("Custom instructions");
});

/**
 * Test: Voice amendment affects customer-facing agents
 */
it("identifies affected agents by section (voice → customer-facing)", () => {
  const amendments: Amendment[] = [
    {
      section: "voice",
      currentContent: "Casual tone",
      proposedContent: "Professional tone",
      evidence: [],
      confidence: 0.85,
      reason: "Tone adjustment",
      runId: "run-789",
    },
  ];

  const plan = planCascade(mockVision, amendments, mockAgents);

  // Voice affects: customer-success, sales, marketing, product
  // From mockAgents: agent-sales-1 (sales), agent-custom-1 (marketing)
  const affectedRoles = plan.affectedAgents.map(a => (a as any).role);

  expect(affectedRoles).toContain("sales");
  expect(affectedRoles).toContain("marketing");
  // agent-eng-1 (cto) should not be affected, and is also excluded for other reasons
  expect(affectedRoles).not.toContain("cto");
});

/**
 * Test: Revenue model amendment affects finance + operations
 */
it("identifies affected agents by section (revenue → finance/ops)", () => {
  const amendments: Amendment[] = [
    {
      section: "revenue_model",
      currentContent: "Subscription",
      proposedContent: "Freemium",
      evidence: [],
      confidence: 0.72,
      reason: "Revenue model change",
      runId: "run-101",
    },
  ];

  const plan = planCascade(mockVision, amendments, mockAgents);

  // Revenue affects: cfo, operations
  // From mockAgents: agent-ceo-1 has role "cfo"
  const affectedRoles = plan.affectedAgents.map(a => (a as any).role);

  expect(affectedRoles).toContain("cfo");
});

/**
 * Test: Org structure amendment affects all agents
 */
it("identifies affected agents by section (org_structure → all)", () => {
  const amendments: Amendment[] = [
    {
      section: "org_structure",
      currentContent: "Old org",
      proposedContent: "New org",
      evidence: [],
      confidence: 0.68,
      reason: "Reorganization",
      runId: "run-202",
    },
  ];

  const plan = planCascade(mockVision, amendments, mockAgents);

  // org_structure affects all agents, but screen removes newly-provisioned
  // So should include: agent-ceo-1, agent-sales-1, agent-custom-1
  // But NOT: agent-eng-1 (newly-provisioned)
  const affectedIds = plan.affectedAgents.map(a => a.id);

  expect(affectedIds).toContain("agent-ceo-1");
  expect(affectedIds).toContain("agent-sales-1");
  expect(affectedIds).toContain("agent-custom-1");
  expect(affectedIds).not.toContain("agent-eng-1");
});

/**
 * Test: CascadePlan generates issue per affected agent
 */
it("generates issue plan per affected agent", () => {
  const amendments: Amendment[] = [
    {
      section: "org_structure",
      currentContent: "3 teams",
      proposedContent: "5 teams",
      evidence: [],
      confidence: 0.75,
      reason: "Expansion",
      runId: "run-303",
    },
  ];

  const plan = planCascade(mockVision, amendments, mockAgents);

  // Should have one issue plan per affected agent
  expect(Object.keys(plan.issuesByAgent).length).toBe(
    plan.affectedAgents.length
  );

  // Each plan should have title and description
  for (const [agentId, issuePlan] of Object.entries(plan.issuesByAgent)) {
    expect(issuePlan.title).toContain("Cascade");
    expect(issuePlan.description).toContain("Amendments");
    expect(issuePlan.assigneeAgentId).toBe(agentId);
  }
});

/**
 * Test: executeCascade creates issues and queues wakeups
 */
it("creates cascade issues and queues wakeups", async () => {
  const amendments: Amendment[] = [
    {
      section: "org_structure",
      currentContent: "Old",
      proposedContent: "New",
      evidence: [],
      confidence: 0.7,
      reason: "Test amendment",
      runId: "run-cascade-1",
    },
  ];

  const plan = planCascade(mockVision, amendments, mockAgents);

  // Mock adapter
  const mockAdapter = {
    createIssue: vi.fn().mockResolvedValue("issue-123"),
    queueWakeup: vi.fn().mockResolvedValue(undefined),
    getAuditLog: vi.fn().mockReturnValue([]),
  } as any as PaperclipAdapter;

  const result = await executeCascade(mockAdapter, plan, "company-1", "assess-run-456");

  // Should succeed
  expect(result.success).toBe(true);

  // Should create one issue per affected agent
  expect(mockAdapter.createIssue).toHaveBeenCalledTimes(plan.affectedAgents.length);

  // Should queue one wakeup per affected agent
  expect(mockAdapter.queueWakeup).toHaveBeenCalledTimes(plan.affectedAgents.length);

  // Track created IDs and woken agents
  expect(result.createdIssueIds.length).toBe(plan.affectedAgents.length);
  expect(result.wakenAgentIds.length).toBe(plan.affectedAgents.length);
});

/**
 * Test: executeCascade idempotency keys use assess namespace
 */
it("generates assess-namespaced idempotency keys", async () => {
  const amendments: Amendment[] = [
    {
      section: "voice",
      currentContent: "Old voice",
      proposedContent: "New voice",
      evidence: [],
      confidence: 0.8,
      reason: "Voice audit",
      runId: "run-voice-1",
    },
  ];

  const plan = planCascade(mockVision, amendments, mockAgents);

  const mockAdapter = {
    createIssue: vi.fn().mockResolvedValue("issue-456"),
    queueWakeup: vi.fn().mockResolvedValue(undefined),
    getAuditLog: vi.fn().mockReturnValue([]),
  } as any as PaperclipAdapter;

  await executeCascade(mockAdapter, plan, "company-2", "assess-run-789");

  // Verify wakeup calls include idempotency keys in assess namespace
  const wakeupCalls = mockAdapter.queueWakeup.mock.calls;
  expect(wakeupCalls.length).toBeGreaterThan(0);

  for (const call of wakeupCalls) {
    const idempotencyKey = call[2]; // 3rd argument
    // Should match format: compass:assess:{company}:{runId}:{agentId}
    expect(idempotencyKey).toMatch(/^compass:assess:[^:]+:[^:]+:[^:]+$/);
    expect(idempotencyKey).toContain("assess-run-789");
  }
});

/**
 * Test: executeCascade halts on issue creation failure
 */
it("halts cascade on issue creation failure", async () => {
  const amendments: Amendment[] = [
    {
      section: "org_structure",
      currentContent: "Old",
      proposedContent: "New",
      evidence: [],
      confidence: 0.65,
      reason: "Test failure",
      runId: "run-fail-1",
    },
  ];

  const plan = planCascade(mockVision, amendments, mockAgents);

  const mockAdapter = {
    createIssue: vi
      .fn()
      .mockRejectedValue(new Error("Issue creation failed")),
    queueWakeup: vi.fn().mockResolvedValue(undefined),
    getAuditLog: vi.fn().mockReturnValue([]),
  } as any as PaperclipAdapter;

  const result = await executeCascade(mockAdapter, plan, "company-3", "assess-run-fail");

  // Should fail
  expect(result.success).toBe(false);
  expect(result.errors?.length).toBeGreaterThan(0);

  // Should not queue any wakeups (halted before)
  expect(mockAdapter.queueWakeup).not.toHaveBeenCalled();
});

/**
 * Test: executeCascade halts on wakeup failure
 */
it("halts cascade on wakeup queueing failure", async () => {
  const amendments: Amendment[] = [
    {
      section: "principles",
      currentContent: "Old principles",
      proposedContent: "New principles",
      evidence: [],
      confidence: 0.7,
      reason: "Principle update",
      runId: "run-wakeup-fail",
    },
  ];

  const plan = planCascade(mockVision, amendments, mockAgents);

  const mockAdapter = {
    createIssue: vi.fn().mockResolvedValue("issue-789"),
    queueWakeup: vi
      .fn()
      .mockRejectedValue(new Error("Wakeup queue failed")),
    getAuditLog: vi.fn().mockReturnValue([]),
  } as any as PaperclipAdapter;

  const result = await executeCascade(mockAdapter, plan, "company-4", "assess-run-wakeup-fail");

  // Should fail
  expect(result.success).toBe(false);
  expect(result.errors?.length).toBeGreaterThan(0);

  // Should have created at least one issue (halted on wakeup)
  expect(mockAdapter.createIssue).toHaveBeenCalled();
});

/**
 * Test: Empty amendments produce empty cascade plan
 */
it("handles empty amendments (no cascade)", () => {
  const amendments: Amendment[] = [];

  const plan = planCascade(mockVision, amendments, mockAgents);

  // No affected agents
  expect(plan.affectedAgents.length).toBe(0);
  expect(plan.customOverrideWarnings.length).toBe(0);
  expect(Object.keys(plan.issuesByAgent).length).toBe(0);
});

/**
 * Test: Multiple amendments accumulate affected agents
 */
it("accumulates affected agents from multiple amendments", () => {
  const amendments: Amendment[] = [
    {
      section: "voice",
      currentContent: "Old voice",
      proposedContent: "New voice",
      evidence: [],
      confidence: 0.7,
      reason: "Voice update",
      runId: "run-multi-1",
    },
    {
      section: "product_direction",
      currentContent: "Old direction",
      proposedContent: "New direction",
      evidence: [],
      confidence: 0.75,
      reason: "Product update",
      runId: "run-multi-1",
    },
  ];

  const plan = planCascade(mockVision, amendments, mockAgents);

  // voice affects: sales, marketing, product
  // product_direction affects: cto, vp-eng
  // Both are customer-facing or engineering, so distinct agents
  // After screening: should have agents for both roles

  expect(plan.affectedAgents.length).toBeGreaterThan(0);
  expect(plan.issuesByAgent).toBeDefined();

  // Should have issue for each affected agent
  expect(Object.keys(plan.issuesByAgent).length).toBe(
    plan.affectedAgents.length
  );
});
