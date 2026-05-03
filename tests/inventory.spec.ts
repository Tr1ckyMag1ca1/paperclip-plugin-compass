import { describe, it, expect } from "vitest";
import { calculateLatestHeartbeat } from "../src/primitives/inventory.js";
import type { Agent, InventorySnapshot } from "../src/types.js";
import { foundedCompanyFixture } from "./fixtures/founded-company.js";
import { healthyCompanyFixture } from "./fixtures/healthy-company.js";
import { stalledCompanyFixture } from "./fixtures/stalled-company.js";

describe("Inventory Loading (INV-01, INV-02, INV-03, INV-07)", () => {
  describe("InventorySnapshot shape and fields", () => {
    it("has all required fields in InventorySnapshot", () => {
      const snapshot = foundedCompanyFixture;
      expect(snapshot).toHaveProperty("companyId");
      expect(snapshot).toHaveProperty("agents");
      expect(snapshot).toHaveProperty("agentCount");
      expect(snapshot).toHaveProperty("documents");
      expect(snapshot).toHaveProperty("visionExists");
      expect(snapshot).toHaveProperty("recentIssues");
      expect(snapshot).toHaveProperty("recentIssueCount");
      expect(snapshot).toHaveProperty("latestHeartbeat");
      expect(snapshot).toHaveProperty("blockerCount");
    });

    it("has correct types for InventorySnapshot fields", () => {
      const snapshot = healthyCompanyFixture;
      expect(typeof snapshot.companyId).toBe("string");
      expect(Array.isArray(snapshot.agents)).toBe(true);
      expect(typeof snapshot.agentCount).toBe("number");
      expect(Array.isArray(snapshot.documents)).toBe(true);
      expect(typeof snapshot.visionExists).toBe("boolean");
      expect(Array.isArray(snapshot.recentIssues)).toBe(true);
      expect(typeof snapshot.recentIssueCount).toBe("number");
      expect(
        snapshot.latestHeartbeat === null ||
          snapshot.latestHeartbeat instanceof Date
      ).toBe(true);
      expect(typeof snapshot.blockerCount).toBe("number");
    });
  });

  describe("Inventory calculations: agentCount", () => {
    it("counts zero agents when list is empty", () => {
      const snapshot = foundedCompanyFixture;
      expect(snapshot.agentCount).toBe(0);
    });

    it("counts agents when list is not empty", () => {
      const snapshot = healthyCompanyFixture;
      expect(snapshot.agentCount).toBe(snapshot.agents.length);
      expect(snapshot.agentCount).toBe(3);
    });
  });

  describe("Inventory calculations: recentIssueCount", () => {
    it("counts zero recent issues when list is empty", () => {
      const snapshot = foundedCompanyFixture;
      expect(snapshot.recentIssueCount).toBe(0);
    });

    it("counts recent issues (last 30 days)", () => {
      const snapshot = healthyCompanyFixture;
      expect(snapshot.recentIssueCount).toBe(snapshot.recentIssues.length);
      expect(snapshot.recentIssueCount).toBeGreaterThan(0);
    });

    it("filters out issues older than 30 days", () => {
      // Verify that recentIssues contains only issues within 30 days
      const snapshot = healthyCompanyFixture;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      snapshot.recentIssues.forEach((issue) => {
        const createdAt = new Date(
          issue.createdAt || issue.created_at || Date.now()
        );
        expect(createdAt > thirtyDaysAgo).toBe(true);
      });
    });
  });

  describe("Inventory calculations: blockerCount", () => {
    it("counts zero blockers when none are present", () => {
      const snapshot = foundedCompanyFixture;
      expect(snapshot.blockerCount).toBe(0);
    });

    it("counts issues with 'blocked' status as blockers", () => {
      const snapshot = stalledCompanyFixture;
      expect(snapshot.blockerCount).toBeGreaterThan(0);
    });

    it("counts blockers from all issues list", () => {
      const snapshot = stalledCompanyFixture;
      expect(snapshot.blockerCount).toBe(
        snapshot.recentIssues.filter(
          (issue: any) =>
            issue.status === "blocked" || issue.priority === "blocker"
        ).length
      );
    });
  });
});

describe("Heartbeat Calculation Helper (calculateLatestHeartbeat)", () => {
  it("returns null when agents list is empty", () => {
    const agents: Agent[] = [];
    const latestHeartbeat = calculateLatestHeartbeat(agents);
    expect(latestHeartbeat).toBeNull();
  });

  it("returns null when no agents have heartbeats", () => {
    const agents: Agent[] = [
      {
        id: "agent-1",
        name: "Alice",
        role: "Engineer",
        status: "active",
        lastHeartbeatAt: null,
      } as any,
      {
        id: "agent-2",
        name: "Bob",
        role: "Manager",
        status: "active",
        lastHeartbeatAt: null,
      } as any,
    ];
    const latestHeartbeat = calculateLatestHeartbeat(agents);
    expect(latestHeartbeat).toBeNull();
  });

  it("returns the most recent heartbeat timestamp", () => {
    const now = Date.now();
    const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000);

    const agents: Agent[] = [
      {
        id: "agent-1",
        name: "Alice",
        role: "Engineer",
        status: "active",
        lastHeartbeatAt: fiveDaysAgo.toISOString(),
      } as any,
      {
        id: "agent-2",
        name: "Bob",
        role: "Manager",
        status: "active",
        lastHeartbeatAt: twoDaysAgo.toISOString(),
      } as any,
    ];

    const latestHeartbeat = calculateLatestHeartbeat(agents);
    expect(latestHeartbeat).toEqual(twoDaysAgo);
  });

  it("handles mixed heartbeat values (some null, some set)", () => {
    const now = Date.now();
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);

    const agents: Agent[] = [
      {
        id: "agent-1",
        name: "Alice",
        role: "Engineer",
        status: "active",
        lastHeartbeatAt: null,
      } as any,
      {
        id: "agent-2",
        name: "Bob",
        role: "Manager",
        status: "active",
        lastHeartbeatAt: threeDaysAgo.toISOString(),
      } as any,
      {
        id: "agent-3",
        name: "Carol",
        role: "CEO",
        status: "active",
        lastHeartbeatAt: null,
      } as any,
    ];

    const latestHeartbeat = calculateLatestHeartbeat(agents);
    expect(latestHeartbeat).toEqual(threeDaysAgo);
  });

  it("correctly identifies the most recent among multiple timestamps", () => {
    const now = Date.now();
    const oneDayAgo = new Date(now - 1 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000);

    const agents: Agent[] = [
      {
        id: "agent-1",
        name: "Alice",
        role: "Engineer",
        status: "active",
        lastHeartbeatAt: tenDaysAgo.toISOString(),
      } as any,
      {
        id: "agent-2",
        name: "Bob",
        role: "Manager",
        status: "active",
        lastHeartbeatAt: fiveDaysAgo.toISOString(),
      } as any,
      {
        id: "agent-3",
        name: "Carol",
        role: "CEO",
        status: "active",
        lastHeartbeatAt: twoDaysAgo.toISOString(),
      } as any,
      {
        id: "agent-4",
        name: "David",
        role: "Designer",
        status: "active",
        lastHeartbeatAt: oneDayAgo.toISOString(),
      } as any,
    ];

    const latestHeartbeat = calculateLatestHeartbeat(agents);
    expect(latestHeartbeat).toEqual(oneDayAgo);
  });
});
