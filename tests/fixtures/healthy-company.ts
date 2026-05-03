import type { InventorySnapshot, Agent, Issue } from "../../src/types.js";

/**
 * Test fixture for Assess mode state (healthy company).
 *
 * Assess mode is triggered when:
 * - VISION.md exists
 * - Latest heartbeat is recent (< 7 days ago)
 *
 * This represents a healthy company with recent agent activity,
 * ready for a drift audit.
 */
export const healthyCompanyFixture: InventorySnapshot = {
  companyId: "test-healthy-company",
  agents: [
    {
      id: "agent-1",
      name: "Alice",
      role: "AI Engineer",
      status: "active" as const,
      lastHeartbeatAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    } as any as Agent,
    {
      id: "agent-2",
      name: "Bob",
      role: "Product Manager",
      status: "active" as const,
      lastHeartbeatAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    } as any as Agent,
    {
      id: "agent-3",
      name: "Carol",
      role: "CEO",
      status: "active" as const,
      lastHeartbeatAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    } as any as Agent,
  ],
  agentCount: 3,
  documents: [],
  visionExists: true,
  recentIssues: [
    {
      id: "issue-1",
      title: "Implement new feature",
      description: "Add real-time collaboration",
      status: "in_progress" as const,
      priority: "high" as const,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    } as any as Issue,
    {
      id: "issue-2",
      title: "Fix bug in auth flow",
      description: "Users report login timeouts",
      status: "in_progress" as const,
      priority: "critical" as const,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    } as any as Issue,
    {
      id: "issue-3",
      title: "Update documentation",
      description: "API docs need refresh",
      status: "open" as const,
      priority: "medium" as const,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    } as any as Issue,
    {
      id: "issue-4",
      title: "Performance optimization",
      description: "Reduce query latency",
      status: "open" as const,
      priority: "medium" as const,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    } as any as Issue,
    {
      id: "issue-5",
      title: "Plan roadmap for Q2",
      description: "Define product direction",
      status: "open" as const,
      priority: "high" as const,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    } as any as Issue,
  ] as any as Issue[],
  recentIssueCount: 5,
  latestHeartbeat: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (most recent)
  blockerCount: 0,
};
