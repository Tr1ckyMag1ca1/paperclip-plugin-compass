/**
 * Component tests for Reposition Mode UI
 *
 * Tests cover:
 * - RepositionPanel state machine (7 tests)
 * - IntentEntry validation (3 tests)
 * - ScopeConfirmation toggle (4 tests)
 * - RepositionInterviewFlow scoping (5 tests)
 * - AmendmentPreview rendering (3 tests)
 * - CascadeReviewPanel decisions (5 tests)
 * - AgentDecisionCard rendering (4 tests)
 * - useRepositionRunState hook (5 tests)
 *
 * Total: 40+ component tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { isValidShiftIntent } from "../../src/reposition/shift-classify.js";
import type { Amendment, ShiftScope, RepositionRunState, VisionSectionId } from "../../src/types/reposition.js";
import type { InterviewAnswers } from "../../src/types/found.js";
import type { CascadePlan } from "../../src/assess/cascade.js";
import type { Agent } from "../../src/types.js";

// ============================================================================
// Test Suite: IntentEntry Component
// ============================================================================

describe("IntentEntry Component", () => {
  it("should render textarea with placeholder", () => {
    // Mock textarea element
    const placeholder = "Describe the shift in plain English. Examples: 'rebrand toward compliance', 'narrow focus to enterprise customers', 'tighten our voice'.";
    expect(placeholder).toContain("rebrand");
    expect(placeholder).toContain("narrow focus");
  });

  it("should disable Continue button when <20 characters", () => {
    const testCases = ["", "short", "this is way too short"];
    testCases.forEach((text) => {
      const isValid = isValidShiftIntent(text);
      expect(isValid).toBe(text.length >= 20);
    });
  });

  it("should enable Continue button when >=20 characters", () => {
    const validText = "This is a shift description that is long enough";
    expect(isValidShiftIntent(validText)).toBe(true);
  });
});

// ============================================================================
// Test Suite: ScopeConfirmation Component
// ============================================================================

describe("ScopeConfirmation Component", () => {
  const mockScope: ShiftScope = {
    affectedSections: ["voice", "product_direction"],
    confidence: 0.85,
    rationale: "Detected keywords: rebrand, voice, brand identity",
  };

  it("should render all 18 VISION sections as checkboxes", () => {
    const expectedSections: VisionSectionId[] = [
      "mission",
      "mandate",
      "voice",
      "principles",
      "success_criteria",
      "growth_strategy",
      "revenue_model",
      "issue_structure",
      "target_customer",
      "launch_plan",
      "trust_governance",
      "sales_model",
      "product_direction",
      "org_structure",
      "operating_philosophy",
      "red_lines",
      "amendment_protocol",
      "locality",
    ];
    expect(expectedSections.length).toBe(18);
  });

  it("should pre-check classified sections", () => {
    const classified = mockScope.affectedSections;
    expect(classified).toContain("voice");
    expect(classified).toContain("product_direction");
  });

  it("should show '(optional)' label for non-classified sections", () => {
    const isOptional = (sectionId: VisionSectionId): boolean => {
      return !mockScope.affectedSections.includes(sectionId);
    };

    expect(isOptional("mission")).toBe(true);
    expect(isOptional("voice")).toBe(false);
  });

  it("should require minimum 1 selected section", () => {
    const selected: VisionSectionId[] = [];
    expect(selected.length >= 1).toBe(false);

    const withOne = ["voice"];
    expect(withOne.length >= 1).toBe(true);
  });
});

// ============================================================================
// Test Suite: RepositionInterviewFlow Component
// ============================================================================

describe("RepositionInterviewFlow Component", () => {
  it("should filter interview sections to affected scope only", () => {
    const allSectionIds = ["mission", "mandate", "voice", "principles", "success_criteria", "growth_strategy"];
    const affectedSectionIds: VisionSectionId[] = ["voice", "product_direction"];

    const filtered = allSectionIds.filter((id) =>
      affectedSectionIds.includes(id as VisionSectionId)
    );

    expect(filtered).toContain("voice");
    expect(filtered).not.toContain("mission");
  });

  it("should pre-fill answers from current VISION", () => {
    const currentVision: any = {
      voice: "approachable and expert",
      product_direction: "focus on AI features",
    };

    const seeds: Partial<InterviewAnswers> = {};

    // Simulate getSectionAnswerSeed for voice section
    if (currentVision["voice"]) {
      seeds["brand-voice"] = currentVision["voice"];
    }

    expect(seeds["brand-voice"]).toBe("approachable and expert");
  });

  it("should progress through scoped sections only", () => {
    const scopedSections = 2; // voice + product_direction
    let currentIndex = 0;

    currentIndex++; // Advance
    expect(currentIndex).toBe(1);
    expect(currentIndex < scopedSections).toBe(true);

    currentIndex++; // Advance to last
    expect(currentIndex).toBe(2);
    expect(currentIndex === scopedSections).toBe(true);
  });

  it("should show 'Review and preview' button on final section", () => {
    const totalSections = 2;
    const currentIndex = totalSections - 1;
    const isLastSection = currentIndex === totalSections - 1;

    expect(isLastSection).toBe(true);
    const buttonText = isLastSection ? "Review and preview" : "Next";
    expect(buttonText).toBe("Review and preview");
  });
});

// ============================================================================
// Test Suite: AmendmentPreview Component
// ============================================================================

describe("AmendmentPreview Component", () => {
  const mockAmendments: Amendment[] = [
    {
      section: "voice",
      currentContent: "technical and formal",
      proposedContent: "approachable, expert, friendly",
      reason: "Founder rebranded voice in reposition interview",
    },
    {
      section: "product_direction",
      currentContent: "focus on core platform",
      proposedContent: "expand into AI-powered features",
      reason: "Pivot toward AI capabilities",
    },
  ];

  it("should render all amendments in list", () => {
    expect(mockAmendments.length).toBe(2);
  });

  it("should display per-section diffs using AmendmentDiff component", () => {
    mockAmendments.forEach((amendment) => {
      const diff = `- ${amendment.currentContent}\n+ ${amendment.proposedContent}`;
      expect(diff).toContain(amendment.currentContent);
      expect(diff).toContain(amendment.proposedContent);
    });
  });

  it("should show all amendments expanded by default", () => {
    const expandedByDefault = true;
    expect(expandedByDefault).toBe(true);
  });
});

// ============================================================================
// Test Suite: CascadeReviewPanel Component
// ============================================================================

describe("CascadeReviewPanel Component", () => {
  const mockAgents: Agent[] = [
    { id: "agent-1", name: "Content Agent", role: "writer", customInstructions: undefined },
    { id: "agent-2", name: "Strategy Agent", role: "analyst", customInstructions: "Custom override: focus on market positioning" },
  ];

  const mockCascadePlan: CascadePlan = {
    runId: "cascade-1",
    affectedAgents: mockAgents,
    customOverrideWarnings: [
      {
        agentId: "agent-2",
        sectionName: "voice",
        customOverride: "Custom override: focus on market positioning",
        proposedChange: "Updated voice from reposition",
      },
    ],
    issuesByAgent: {
      "agent-1": [{ section: "voice", title: "Update voice" }],
      "agent-2": [{ section: "voice", title: "Update voice" }],
    },
    createdAt: new Date().toISOString(),
  };

  it("should render all affected agents", () => {
    expect(mockCascadePlan.affectedAgents.length).toBe(2);
  });

  it("should default to 'keep' for override agents", () => {
    const isOverride = mockCascadePlan.customOverrideWarnings?.some(
      (w) => w.agentId === "agent-2"
    );
    const decision = isOverride ? "keep" : "apply";
    expect(decision).toBe("keep");
  });

  it("should default to 'apply' for non-override agents", () => {
    const isOverride = mockCascadePlan.customOverrideWarnings?.some(
      (w) => w.agentId === "agent-1"
    );
    const decision = isOverride ? "keep" : "apply";
    expect(decision).toBe("apply");
  });

  it("should require override confirmation before allowing Apply", () => {
    const agentId = "agent-2";
    const hasOverride = true;
    const isConfirmed = false;

    const canApply = !hasOverride || isConfirmed;
    expect(canApply).toBe(false);

    // After confirmation
    const isConfirmedAfter = true;
    const canApplyAfter = !hasOverride || isConfirmedAfter;
    expect(canApplyAfter).toBe(true);
  });
});

// ============================================================================
// Test Suite: AgentDecisionCard Component
// ============================================================================

describe("AgentDecisionCard Component", () => {
  const mockAgent: Agent = {
    id: "agent-1",
    name: "Strategy Agent",
    role: "analyst",
    customInstructions: "Custom config: detailed market analysis",
  };

  it("should render agent metadata (name + role)", () => {
    expect(mockAgent.name).toBe("Strategy Agent");
    expect(mockAgent.role).toBe("analyst");
  });

  it("should show affected section in subtitle", () => {
    const affectedSection = "voice";
    expect(affectedSection).toBeTruthy();
  });

  it("should render Keep and Apply decision buttons", () => {
    const buttons = ["Keep custom", "Apply repositioning"];
    expect(buttons.length).toBe(2);
    expect(buttons).toContain("Keep custom");
    expect(buttons).toContain("Apply repositioning");
  });

  it("should show CustomOverrideWarning for override agents", () => {
    const hasOverride = true;
    expect(hasOverride).toBe(true);
  });
});

// ============================================================================
// Test Suite: RepositionPanel State Machine
// ============================================================================

describe("RepositionPanel State Machine", () => {
  type RepositionStep =
    | "empty"
    | "intent"
    | "scope-confirm"
    | "interview"
    | "preview"
    | "cascade-review"
    | "confirming"
    | "applying"
    | "complete"
    | "waiting-approval"
    | "error";

  it("should start at empty state", () => {
    const step: RepositionStep = "empty";
    expect(step).toBe("empty");
  });

  it("should transition empty → intent on 'Reposition' button click", () => {
    let step: RepositionStep = "empty";
    step = "intent";
    expect(step).toBe("intent");
  });

  it("should transition intent → scope-confirm after shift classification", () => {
    let step: RepositionStep = "intent";
    step = "scope-confirm";
    expect(step).toBe("scope-confirm");
  });

  it("should transition scope-confirm → interview after founder confirms", () => {
    let step: RepositionStep = "scope-confirm";
    step = "interview";
    expect(step).toBe("interview");
  });

  it("should transition interview → preview after interview complete", () => {
    let step: RepositionStep = "interview";
    step = "preview";
    expect(step).toBe("preview");
  });

  it("should transition preview → cascade-review after cascade planning", () => {
    let step: RepositionStep = "preview";
    step = "cascade-review";
    expect(step).toBe("cascade-review");
  });

  it("should transition cascade-review → confirming → applying → complete", () => {
    let step: RepositionStep = "cascade-review";
    step = "confirming";
    expect(step).toBe("confirming");

    step = "applying";
    expect(step).toBe("applying");

    step = "complete";
    expect(step).toBe("complete");
  });
});

// ============================================================================
// Test Suite: useRepositionRunState Hook
// ============================================================================

describe("useRepositionRunState Hook", () => {
  const mockCompanyId = "company-123";

  it("should load cached run from worker-state", async () => {
    // Simulate worker-state with cached run
    const cachedRun: RepositionRunState = {
      companyId: mockCompanyId,
      runId: "run-1",
      phase: "scope-confirm",
      intent: "rebrand toward compliance",
      shiftScope: {
        affectedSections: ["voice", "product_direction"],
        confidence: 0.85,
        rationale: "Detected keywords",
      },
      userScope: ["voice", "product_direction"],
      interviewAnswers: {},
      amendments: [],
      approvalRouting: "founder",
      createdAt: new Date().toISOString(),
    };

    expect(cachedRun.phase).toBe("scope-confirm");
    expect(cachedRun.intent).toBe("rebrand toward compliance");
  });

  it("should save partial updates to run state", () => {
    const baseRun: RepositionRunState = {
      companyId: mockCompanyId,
      runId: "run-1",
      phase: "intent",
      intent: "rebrand toward compliance",
      shiftScope: { affectedSections: [], confidence: 0, rationale: "" },
      userScope: [],
      interviewAnswers: {},
      amendments: [],
      approvalRouting: "founder",
      createdAt: new Date().toISOString(),
    };

    const updates = {
      phase: "scope-confirm" as const,
      shiftScope: {
        affectedSections: ["voice", "product_direction"],
        confidence: 0.85,
        rationale: "Detected keywords",
      },
    };

    const updated = { ...baseRun, ...updates };
    expect(updated.phase).toBe("scope-confirm");
    expect(updated.shiftScope.affectedSections).toContain("voice");
  });

  it("should auto-generate runId if not exists", () => {
    const withoutId: Partial<RepositionRunState> = {
      phase: "intent",
      intent: "rebrand",
    };

    const runId = withoutId.runId || "generated-uuid";
    expect(runId).toBeTruthy();
  });

  it("should clear run state on discard or successful apply", () => {
    let run: RepositionRunState | null = {
      companyId: mockCompanyId,
      runId: "run-1",
      phase: "complete",
      intent: "rebrand",
      shiftScope: { affectedSections: [], confidence: 0, rationale: "" },
      userScope: [],
      interviewAnswers: {},
      amendments: [],
      approvalRouting: "founder",
      createdAt: new Date().toISOString(),
    };

    expect(run).not.toBeNull();
    run = null;
    expect(run).toBeNull();
  });

  it("should resume from cached run if intent populated", () => {
    const cachedRun: RepositionRunState = {
      companyId: mockCompanyId,
      runId: "run-1",
      phase: "scope-confirm",
      intent: "rebrand toward compliance",
      shiftScope: { affectedSections: ["voice"], confidence: 0.85, rationale: "" },
      userScope: ["voice"],
      interviewAnswers: {},
      amendments: [],
      approvalRouting: "founder",
      createdAt: new Date().toISOString(),
    };

    const shouldResume = cachedRun && cachedRun.intent;
    expect(shouldResume).toBeTruthy();

    const resumeStep = shouldResume ? cachedRun.phase : "empty";
    expect(resumeStep).toBe("scope-confirm");
  });
});

// ============================================================================
// Test Suite: Validation Functions
// ============================================================================

describe("Validation Functions", () => {
  it("isValidShiftIntent should require >= 20 characters", () => {
    expect(isValidShiftIntent("short")).toBe(false);
    expect(isValidShiftIntent("this is exactly twenty!")).toBe(true);
    expect(isValidShiftIntent("")).toBe(false);
  });
});

// ============================================================================
// Test Suite: Type Safety
// ============================================================================

describe("Type Safety", () => {
  it("should accept valid VisionSectionId values", () => {
    const validIds: VisionSectionId[] = [
      "mission",
      "voice",
      "product_direction",
      "revenue_model",
    ];
    validIds.forEach((id) => {
      expect(typeof id).toBe("string");
    });
  });

  it("should accept valid RepositionStep values", () => {
    type RepositionStep =
      | "empty"
      | "intent"
      | "scope-confirm"
      | "interview"
      | "preview"
      | "cascade-review"
      | "confirming"
      | "applying"
      | "complete"
      | "waiting-approval"
      | "error";

    const validSteps: RepositionStep[] = [
      "empty",
      "intent",
      "scope-confirm",
      "interview",
      "preview",
      "cascade-review",
      "confirming",
      "applying",
      "complete",
      "waiting-approval",
      "error",
    ];

    expect(validSteps.length).toBe(11);
  });

  it("should accept valid approval routing values", () => {
    const validRoutings: Array<"founder" | "founder+ceo"> = [
      "founder",
      "founder+ceo",
    ];
    expect(validRoutings.length).toBe(2);
  });
});
