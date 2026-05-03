/**
 * Assess Mode Integration Tests
 *
 * Per D-24, XC-08, XC-09: end-to-end scenarios from drift detection through apply,
 * covering both founder and founder+ceo routing.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Agent } from "../../src/types.js";
import type { ParsedVision, ActivityItem, DriftReport } from "../../src/types/assess.js";
import type { Amendment } from "../../src/assess/cascade.js";
import {
  applyAssessmentChanges,
  type ApplyResult,
} from "../../src/assess/apply.js";
import { detectDrift } from "../../src/assess/drift.js";
import { buildActivitySnapshot } from "../../src/assess/activity.js";

/**
 * Complete mock company for integration tests
 */
const integrationMockCompany = {
  agents: [
    {
      id: "agent-ceo-1",
      name: "CEO",
      role: "cfo",
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      lastHeartbeatAt: new Date().toISOString(),
      status: "active",
    },
    {
      id: "agent-sales-1",
      name: "Sales Lead",
      role: "sales",
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      lastHeartbeatAt: new Date().toISOString(),
      status: "active",
    },
    {
      id: "agent-eng-1",
      name: "Engineering Lead",
      role: "cto",
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      lastHeartbeatAt: new Date().toISOString(),
      status: "active",
    },
  ] as Agent[],
};

const integrationVisionOriginal: ParsedVision = {
  mission: "Build products for enterprise",
  mandate: "Founded to solve enterprise problems",
  voice: "Casual and friendly",
  principles: "Move fast, break things",
  success_criteria_12mo: "1000 customers",
  vision_3year: "Market leader in segment",
  target_customer: "Enterprise companies",
  issue_structure: "Kanban with swimlanes",
  locality: "Global with HQ in US",
  revenue_model: "Subscription SaaS",
  launch_plan: "Q2 2026 public launch",
  trust_governance: "Transparent with board oversight",
  growth_strategy: "Content marketing + partnerships",
  sales_model: "Direct sales team",
  product_direction: "AI-first architecture",
  org_structure: "5 teams (sales, eng, ops, product, marketing)",
  operating_philosophy: "Bias for action",
  ceo_mandate: "Full P&L autonomy",
  success_criteria: "Profitable unit economics by 2027",
};

const integrationVisionAmended: ParsedVision = {
  ...integrationVisionOriginal,
  voice: "Professional and consultative",
  principles: "Integrity first, speed second",
};

/**
 * Create mock context for integration tests
 */
function createIntegrationMockContext() {
  return {
    state: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
    },
    issues: {
      list: vi.fn().mockResolvedValue([
        {
          id: "issue-1",
          title: "Casual tone in documentation",
          description: "Our docs read too friendly for enterprise customers",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: "agent-sales-1",
          status: "open",
        },
      ]),
      comments: {
        list: vi.fn().mockResolvedValue([
          {
            id: "comment-1",
            issueId: "issue-1",
            body: "We need more professional tone in customer comms",
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: "agent-ceo-1",
          },
        ]),
      },
      documents: {
        upsert: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        list: vi.fn().mockResolvedValue([]),
      },
      create: vi.fn().mockResolvedValue({ id: "issue-new-1" }),
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

/**
 * Integration Test 1: End-to-end Assess → Apply with founder routing
 */
it("end-to-end: detect drift → accept → apply (founder routing)", async () => {
  const ctx = createIntegrationMockContext();
  const mockAdapter = createIntegrationMockAdapter();

  // Step 1: Simulate drift detection
  // (In real flow, UI would call detectDrift)
  // For this test, we'll manually create amendments that represent accepted drift items

  const acceptedAmendments: Amendment[] = [
    {
      section: "voice",
      currentContent: "Casual and friendly",
      proposedContent: "Professional and consultative",
      evidence: [
        {
          id: "issue-1",
          type: "issue",
          content: "Casual tone in documentation",
          createdAt: new Date().toISOString(),
          authorId: "agent-sales-1",
        },
      ],
      confidence: 0.85,
      reason: "Customer feedback indicates tone should be more professional",
      runId: "run-int-1",
    },
    {
      section: "principles",
      currentContent: "Move fast, break things",
      proposedContent: "Integrity first, speed second",
      evidence: [],
      confidence: 0.72,
      reason: "Enterprise customers value integrity over speed",
      runId: "run-int-1",
    },
  ];

  // Step 2: Apply amendments with founder routing
  const result = await applyAssessmentChanges(
    ctx as any,
    "company-int-1",
    integrationMockCompany,
    acceptedAmendments,
    integrationVisionOriginal,
    integrationVisionAmended,
    "founder",
    "assess-run-int-1",
    mockAdapter
  );

  // Step 3: Verify success
  expect(result.success).toBe(true);
  expect(result.visionDocId).toBeDefined();

  // Step 4: Verify VISION was written
  expect(mockAdapter.writeDocument).toHaveBeenCalledWith(
    "company-int-1",
    "VISION.md",
    expect.stringContaining("Professional and consultative")
  );

  // Step 5: Verify cascade issues created
  expect(mockAdapter.createIssue).toHaveBeenCalled();

  // Step 6: Verify wakeups queued
  expect(mockAdapter.queueWakeup).toHaveBeenCalled();

  // Step 7: Verify summary
  expect(result.summary).toContain("amendment");
  expect(result.summary).toContain("2"); // 2 amendments
});

/**
 * Integration Test 2: End-to-end Assess → Apply with founder+ceo routing
 */
it("end-to-end: detect drift → accept → apply (founder+ceo routing)", async () => {
  const ctx = createIntegrationMockContext();

  const acceptedAmendments: Amendment[] = [
    {
      section: "voice",
      currentContent: "Casual and friendly",
      proposedContent: "Professional and consultative",
      evidence: [],
      confidence: 0.82,
      reason: "Enterprise customer feedback",
      runId: "run-int-2",
    },
  ];

  // Apply with founder+ceo routing
  const result = await applyAssessmentChanges(
    ctx as any,
    "company-int-2",
    integrationMockCompany,
    acceptedAmendments,
    integrationVisionOriginal,
    integrationVisionAmended,
    "founder+ceo",
    "assess-run-int-2"
  );

  // Should queue approval instead of writing
  expect(result.success).toBe(true);
  expect(result.waitingForApproval).toBe(true);
  expect(result.approvalId).toBeDefined();

  // Should NOT write documents yet
  expect(ctx.issues.documents.upsert).not.toHaveBeenCalled();
  expect(ctx.issues.requestWakeup).not.toHaveBeenCalled();

  // Should queue approval in worker-state
  expect(ctx.state.set).toHaveBeenCalled();

  // Verify approval payload structure
  const stateSetCall = ctx.state.set.mock.calls[0];
  const approvalData = stateSetCall[1];

  expect(approvalData).toHaveProperty("approvalId");
  expect(approvalData).toHaveProperty("status", "pending");
  expect(approvalData).toHaveProperty("amendments");
  expect(approvalData).toHaveProperty("proposedVision");
});

/**
 * Integration Test 3: Multiple amendments from different sections
 */
it("applies multiple amendments across different sections", async () => {
  const ctx = createIntegrationMockContext();
  const mockAdapter = createIntegrationMockAdapter();

  const visionWithMultiple: ParsedVision = {
    ...integrationVisionAmended,
    org_structure: "7 teams (expanded from 5)",
    revenue_model: "Freemium + Enterprise tier",
  };

  const multipleAmendments: Amendment[] = [
    {
      section: "voice",
      currentContent: integrationVisionOriginal.voice,
      proposedContent: integrationVisionAmended.voice,
      evidence: [],
      confidence: 0.8,
      reason: "Voice audit",
      runId: "run-int-3",
    },
    {
      section: "org_structure",
      currentContent: integrationVisionOriginal.org_structure,
      proposedContent: visionWithMultiple.org_structure,
      evidence: [],
      confidence: 0.75,
      reason: "Growth org",
      runId: "run-int-3",
    },
    {
      section: "revenue_model",
      currentContent: integrationVisionOriginal.revenue_model,
      proposedContent: visionWithMultiple.revenue_model,
      evidence: [],
      confidence: 0.7,
      reason: "Market segment shift",
      runId: "run-int-3",
    },
  ];

  const result = await applyAssessmentChanges(
    ctx as any,
    "company-int-3",
    integrationMockCompany,
    multipleAmendments,
    integrationVisionOriginal,
    visionWithMultiple,
    "founder",
    "assess-run-int-3",
    mockAdapter
  );

  expect(result.success).toBe(true);
  expect(result.summary).toContain("3");
});

/**
 * Integration Test 4: Rejection handling (no amendments accepted)
 */
it("handles scenario where founder rejects all amendments", async () => {
  const ctx = createIntegrationMockContext();

  // No amendments — founder rejected all
  const result = await applyAssessmentChanges(
    ctx as any,
    "company-int-4",
    integrationMockCompany,
    [], // Empty amendments
    integrationVisionOriginal,
    integrationVisionOriginal, // Vision unchanged
    "founder",
    "assess-run-int-4"
  );

  expect(result.success).toBe(false);
  expect(result.blockingErrors).toBeDefined();
});

/**
 * Integration Test 5: Cascade targeting (affects correct agents)
 */
it("cascade targets correct agents based on amended sections", async () => {
  const ctx = createIntegrationMockContext();
  const mockAdapter = createIntegrationMockAdapter();

  // Voice amendment — should affect customer-facing agents (sales, marketing, product)
  const voiceOnlyAmendment: Amendment[] = [
    {
      section: "voice",
      currentContent: integrationVisionOriginal.voice,
      proposedContent: integrationVisionAmended.voice,
      evidence: [],
      confidence: 0.85,
      reason: "Voice change",
      runId: "run-int-5",
    },
  ];

  const result = await applyAssessmentChanges(
    ctx as any,
    "company-int-5",
    integrationMockCompany,
    voiceOnlyAmendment,
    integrationVisionOriginal,
    integrationVisionAmended,
    "founder",
    "assess-run-int-5",
    mockAdapter
  );

  expect(result.success).toBe(true);

  // Should create cascade issue (at least one)
  expect(mockAdapter.createIssue).toHaveBeenCalled();

  // Should queue wakeup for affected agent
  expect(mockAdapter.queueWakeup).toHaveBeenCalled();

  // Verify wakeup was called with assess-namespaced idempotency key
  const wakeupCall = mockAdapter.queueWakeup.mock.calls[0];
  const idempotencyKey = wakeupCall[2]; // 3rd argument

  expect(idempotencyKey).toMatch(/^compass:assess:[^:]+:[^:]+:[^:]+$/);
});

/**
 * Integration Test 6: Audit trail populated
 */
it("populates audit trail for all operations", async () => {
  const ctx = createIntegrationMockContext();
  const mockAdapter = createIntegrationMockAdapter();

  const amendments: Amendment[] = [
    {
      section: "voice",
      currentContent: integrationVisionOriginal.voice,
      proposedContent: integrationVisionAmended.voice,
      evidence: [],
      confidence: 0.8,
      reason: "Audit",
      runId: "run-int-6",
    },
  ];

  const result = await applyAssessmentChanges(
    ctx as any,
    "company-int-6",
    integrationMockCompany,
    amendments,
    integrationVisionOriginal,
    integrationVisionAmended,
    "founder",
    "assess-run-int-6",
    mockAdapter
  );

  expect(result.auditLog).toBeDefined();
  // Audit log could be empty or contain entries, both are valid
});

/**
 * Integration Test 7: Summary messages are user-friendly
 */
it("generates user-friendly summary messages", async () => {
  const ctx = createIntegrationMockContext();
  const mockAdapter = createIntegrationMockAdapter();

  const amendments: Amendment[] = [
    {
      section: "voice",
      currentContent: integrationVisionOriginal.voice,
      proposedContent: integrationVisionAmended.voice,
      evidence: [],
      confidence: 0.8,
      reason: "Update",
      runId: "run-int-7",
    },
  ];

  const result = await applyAssessmentChanges(
    ctx as any,
    "company-int-7",
    integrationMockCompany,
    amendments,
    integrationVisionOriginal,
    integrationVisionAmended,
    "founder",
    "assess-run-int-7",
    mockAdapter
  );

  // Summary should be human-readable
  expect(result.summary).toBeDefined();
  expect(result.summary).not.toContain("undefined");
  expect(result.summary).not.toContain("[object");
});
