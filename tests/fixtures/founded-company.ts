import type { InventorySnapshot } from "../../src/types.js";

/**
 * Test fixture for Found mode state.
 *
 * Found mode is triggered when:
 * - No VISION.md exists
 * - No agents are provisioned yet
 *
 * This represents a brand-new company ready for the vision-quest interview.
 */
export const foundedCompanyFixture: InventorySnapshot = {
  companyId: "test-founded-company",
  agents: [],
  agentCount: 0,
  documents: [],
  visionExists: false,
  recentIssues: [],
  recentIssueCount: 0,
  latestHeartbeat: null,
  blockerCount: 0,
};
