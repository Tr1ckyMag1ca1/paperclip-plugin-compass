import type { InventorySnapshot, Agent, Issue } from "../../src/types.js";

/**
 * Test fixture for Revive mode state (stalled company).
 *
 * Revive mode is triggered when:
 * - VISION.md exists
 * - No recent heartbeats (>= 7 days) OR blockerCount > 2
 *
 * This represents a stalled company with inactive agents and/or
 * many blocking issues, ready for a revival diagnostic.
 */
export const stalledCompanyFixture: InventorySnapshot = {
  companyId: "test-stalled-company",
  agents: [
    {
      id: "agent-1",
      name: "David",
      role: "AI Engineer",
      status: "inactive" as const,
      lastHeartbeatAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
    } as any as Agent,
    {
      id: "agent-2",
      name: "Eve",
      role: "Product Manager",
      status: "inactive" as const,
      lastHeartbeatAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
    } as any as Agent,
    {
      id: "agent-3",
      name: "Frank",
      role: "CEO",
      status: "inactive" as const,
      lastHeartbeatAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    } as any as Agent,
  ],
  agentCount: 3,
  documents: [],
  visionExists: true,
  recentIssues: [
    {
      id: "blocker-1",
      title: "Critical: Payment system down",
      description: "Stripe integration failing, revenue affected",
      status: "blocked" as const,
      priority: "critical" as const,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    } as any as Issue,
    {
      id: "blocker-2",
      title: "Blocker: Unable to deploy",
      description: "CI/CD pipeline broken, can't release features",
      status: "blocked" as const,
      priority: "critical" as const,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    } as any as Issue,
  ] as any as Issue[],
  recentIssueCount: 2,
  latestHeartbeat: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago (most recent, still stale)
  blockerCount: 2,
};
