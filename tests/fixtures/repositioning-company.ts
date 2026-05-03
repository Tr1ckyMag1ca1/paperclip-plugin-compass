import type { InventorySnapshot, Agent, Issue } from "../../src/types.js";

/**
 * Test fixture for Reposition mode state (edge case).
 *
 * Reposition mode is the fallback when:
 * - VISION.md exists
 * - Recent heartbeats (< 7 days)
 * - No blockers (blockerCount <= 2)
 *
 * This represents a healthy company where the founder has overridden
 * the auto-detected mode to initiate a strategic shift.
 * Note: In MODE-02 rules, this would auto-detect as Assess, but
 * the founder can manually override to Reposition.
 */
export const repositioningCompanyFixture: InventorySnapshot = {
  companyId: "test-repositioning-company",
  agents: [
    {
      id: "agent-1",
      name: "Grace",
      role: "AI Engineer",
      status: "active" as const,
      lastHeartbeatAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    } as any as Agent,
    {
      id: "agent-2",
      name: "Henry",
      role: "Product Manager",
      status: "active" as const,
      lastHeartbeatAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    } as any as Agent,
    {
      id: "agent-3",
      name: "Iris",
      role: "CEO",
      status: "active" as const,
      lastHeartbeatAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    } as any as Agent,
  ],
  agentCount: 3,
  documents: [],
  visionExists: true,
  recentIssues: [
    {
      id: "issue-1",
      title: "Rebrand: New logo and visual identity",
      description: "Refresh brand for market pivot",
      status: "open" as const,
      priority: "high" as const,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    } as any as Issue,
    {
      id: "issue-2",
      title: "Market research: New target segment",
      description: "Evaluate SMB vs Enterprise positioning",
      status: "in_progress" as const,
      priority: "high" as const,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    } as any as Issue,
    {
      id: "issue-3",
      title: "Product roadmap: Feature prioritization",
      description: "Align on next quarter direction",
      status: "open" as const,
      priority: "medium" as const,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago (boundary)
    } as any as Issue,
  ] as any as Issue[],
  recentIssueCount: 3,
  latestHeartbeat: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (most recent, healthy)
  blockerCount: 0,
};
