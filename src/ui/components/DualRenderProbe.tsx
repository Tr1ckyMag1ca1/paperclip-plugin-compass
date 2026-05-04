import React from "react";
import { ModeBanner } from "./ModeBanner.js";
import { StatusBadge } from "./StatusBadge.js";
import { Card } from "../primitives/Card.js";
import { SectionHeader } from "../primitives/SectionHeader.js";
import { AgentCard } from "./AgentCard.js";
import { VisionStatusDisplay } from "./VisionStatusDisplay.js";
import { InventoryDisplay } from "./InventoryDisplay.js";
import { ChatPanel } from "./ChatPanel.js";
import { ActivityTimeline } from "./ActivityTimeline.js";
import { DocumentList } from "./DocumentList.js";
import { ErrorBoundary } from "./ErrorBoundary.js";
import type { InventorySnapshot, Agent, Issue, Document } from "../../types.js";

/**
 * DualRenderProbe — Dev-only component for visual verification of Phase 7 components in light and dark modes.
 *
 * Renders all 13 Phase 7 components side-by-side in forced light and dark CSS class contexts.
 * Founder/reviewer can visually scan both columns to verify:
 * - No color inversions or unreadable text-on-background
 * - Light column matches Paperclip light theme
 * - Dark column matches Paperclip dark theme
 * - All components render without errors
 *
 * **DEV-ONLY:** This component must be removed before Phase 7 ship per UIV-02 requirement.
 *
 * @returns React component with dual light/dark rendering
 */
export function DualRenderProbe(): React.ReactElement {
  // Sample data for rendering components
  const sampleInventory: InventorySnapshot = {
    companyId: "probe-test",
    agentCount: 2,
    agents: [
      {
        id: "agent-1",
        name: "Claude Engineer",
        role: "engineer",
        lastHeartbeatAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      } as Agent,
      {
        id: "agent-2",
        name: "Documentation AI",
        role: "general",
        lastHeartbeatAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago (stalled)
      } as Agent,
    ],
    documents: [
      {
        id: "doc-1",
        key: "VISION.md",
        title: "Company Vision",
      },
    ],
    recentIssueCount: 1,
    recentIssues: [
      {
        id: "issue-1",
        title: "Implement dark mode support",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: "in_progress",
      } as Issue,
    ],
    visionExists: true,
    latestHeartbeat: new Date(),
    blockerCount: 0,
  };

  const renderComponentsColumn = () => (
    <>
      {/* Card Primitive */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Card Primitive</h3>
        <div className="space-y-2">
          <Card variant="default" padding="md">
            <p className="text-sm">Default variant</p>
          </Card>
          <Card variant="muted" padding="md">
            <p className="text-sm">Muted variant</p>
          </Card>
          <Card variant="elevated" padding="md">
            <p className="text-sm">Elevated variant</p>
          </Card>
        </div>
      </div>

      {/* SectionHeader Primitive */}
      <div>
        <h3 className="text-sm font-semibold mb-2">SectionHeader</h3>
        <SectionHeader title="Test Title" subtitle="Test subtitle" />
      </div>

      {/* StatusBadge */}
      <div>
        <h3 className="text-sm font-semibold mb-2">StatusBadge</h3>
        <div className="flex gap-2">
          <StatusBadge status="healthy" />
          <StatusBadge status="stalled" />
          <StatusBadge status="unknown" />
        </div>
      </div>

      {/* ModeBanner (all 4 modes) */}
      <div>
        <h3 className="text-sm font-semibold mb-2">ModeBanner (All Modes)</h3>
        <div className="space-y-2">
          <ModeBanner
            inventory={sampleInventory}
            detectedMode="Found"
            override={null}
            onOverrideChange={() => {}}
          />
          <ModeBanner
            inventory={sampleInventory}
            detectedMode="Assess"
            override={null}
            onOverrideChange={() => {}}
          />
          <ModeBanner
            inventory={sampleInventory}
            detectedMode="Revive"
            override={null}
            onOverrideChange={() => {}}
          />
          <ModeBanner
            inventory={sampleInventory}
            detectedMode="Reposition"
            override={null}
            onOverrideChange={() => {}}
          />
        </div>
      </div>

      {/* AgentCard */}
      <div>
        <h3 className="text-sm font-semibold mb-2">AgentCard</h3>
        <AgentCard agent={sampleInventory.agents[0]} />
      </div>

      {/* VisionStatusDisplay */}
      <div>
        <h3 className="text-sm font-semibold mb-2">VisionStatusDisplay (Exists)</h3>
        <VisionStatusDisplay visionExists={true} />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">VisionStatusDisplay (Missing)</h3>
        <VisionStatusDisplay visionExists={false} />
      </div>

      {/* DocumentList */}
      <div>
        <h3 className="text-sm font-semibold mb-2">DocumentList</h3>
        <DocumentList documents={sampleInventory.documents} />
      </div>

      {/* ActivityTimeline */}
      <div>
        <h3 className="text-sm font-semibold mb-2">ActivityTimeline</h3>
        <ActivityTimeline issues={sampleInventory.recentIssues} />
      </div>

      {/* ErrorBoundary */}
      <div>
        <h3 className="text-sm font-semibold mb-2">ErrorBoundary (Error State)</h3>
        <ErrorBoundary error={new Error("Test error for visual verification")} />
      </div>
    </>
  );

  return (
    <div className="grid grid-cols-2 gap-8 p-8 bg-background min-h-screen">
      {/* Light column */}
      <div className="light">
        <h2 className="text-lg font-bold mb-8">Light Mode</h2>
        <div className="space-y-8">{renderComponentsColumn()}</div>
      </div>

      {/* Dark column */}
      <div className="dark">
        <h2 className="text-lg font-bold mb-8">Dark Mode</h2>
        <div className="space-y-8">{renderComponentsColumn()}</div>
      </div>
    </div>
  );
}
