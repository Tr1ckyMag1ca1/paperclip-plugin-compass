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
import { HistoryPanel } from "../memory/HistoryPanel.js";
import { FindingCard } from "../memory/FindingCard.js";
import { FindingStatusBadge } from "../memory/FindingStatusBadge.js";
import { ModeBadge } from "../memory/ModeBadge.js";
import { SchedulesSection } from "../memory/SchedulesSection.js";
import { ScheduleCreationForm } from "../memory/ScheduleCreationForm.js";
import { ScheduleRoutineRow } from "../memory/ScheduleRoutineRow.js";
import { ContextRefreshBanner } from "../memory/ContextRefreshBanner.js";
import type { InventorySnapshot, Agent, Issue, Document } from "../../types.js";

/**
 * DualRenderProbe — Dev-only component for visual verification of Phase 7 + Phase 10 components in light and dark modes.
 *
 * Renders 13 Phase 7 components + 8 Phase 10 memory components side-by-side in forced light and dark CSS class contexts.
 * Founder/reviewer can visually scan both columns to verify:
 * - No color inversions or unreadable text-on-background
 * - Light column matches Paperclip light theme
 * - Dark column matches Paperclip dark theme
 * - All components render without errors
 * - Memory components display in both light and dark modes
 *
 * **DEV-ONLY:** This component must be removed before ship per UIV-02 requirement.
 *
 * @returns React component with dual light/dark rendering
 */
export function DualRenderProbe(): React.ReactElement {
  // Sample data for rendering components
  const sampleInventory: InventorySnapshot = {
    companyId: "probe-test",
    companyName: "Probe Test Co",
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

  // Sample memory data for Phase 10 components
  const sampleFinding = {
    id: "ex-1",
    run_id: "run-1",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "open" as const,
    mode: "Found" as const,
    title: "Example finding",
    summary: "Sample finding for DualRenderProbe verification",
    evidence_refs: [],
    status_history: [],
  };

  const sampleRoutine = {
    id: "rt-1",
    name: "Weekly check-in",
    cron: "0 9 * * MON",
    mode: "Assess" as const,
    created_at: new Date().toISOString(),
    last_run_at: null,
    last_finding_ids: [],
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

      {/* Phase 10: Memory Components */}
      <div className="border-t pt-8">
        <h3 className="text-sm font-semibold mb-4">Phase 10: Memory Components</h3>

        {/* HistoryPanel shell (without nested list for simplicity) */}
        <div className="mb-6">
          <h4 className="text-xs font-medium mb-2">HistoryPanel (Root Shell)</h4>
          <Card variant="default" padding="md">
            <div className="sticky top-0 bg-card border-b border-border px-4 py-2 flex gap-4 z-10">
              <button className="text-xs font-medium pb-2 border-b-2 border-accent text-accent">
                Engagement history
              </button>
              <button className="text-xs font-medium pb-2 border-b-2 border-transparent text-foreground/70 hover:text-foreground">
                Scheduled check-ins
              </button>
            </div>
          </Card>
        </div>

        {/* FindingCard */}
        <div className="mb-6">
          <h4 className="text-xs font-medium mb-2">FindingCard</h4>
          <FindingCard
            finding={sampleFinding}
            onMarkAddressed={async () => {}}
            onMarkInvalidated={async () => {}}
          />
        </div>

        {/* FindingStatusBadge (all statuses) */}
        <div className="mb-6">
          <h4 className="text-xs font-medium mb-2">FindingStatusBadge (All Statuses)</h4>
          <div className="flex gap-2">
            <FindingStatusBadge status="open" />
            <FindingStatusBadge status="addressed" />
            <FindingStatusBadge status="invalidated" />
          </div>
        </div>

        {/* ModeBadge (all modes) */}
        <div className="mb-6">
          <h4 className="text-xs font-medium mb-2">ModeBadge (All Modes)</h4>
          <div className="flex gap-2">
            <ModeBadge mode="Found" />
            <ModeBadge mode="Assess" />
            <ModeBadge mode="Revive" />
            <ModeBadge mode="Reposition" />
          </div>
        </div>

        {/* SchedulesSection and ScheduleRoutineRow */}
        <div className="mb-6">
          <h4 className="text-xs font-medium mb-2">SchedulesSection + ScheduleRoutineRow</h4>
          <Card variant="default" padding="md">
            <div className="space-y-4">
              <div>
                <h5 className="text-base font-semibold mb-1">Scheduled check-ins</h5>
              </div>
              <ScheduleRoutineRow
                routine={sampleRoutine}
                onRunNow={async () => {}}
                onDisable={async () => {}}
              />
            </div>
          </Card>
        </div>

        {/* ScheduleCreationForm */}
        <div className="mb-6">
          <h4 className="text-xs font-medium mb-2">ScheduleCreationForm</h4>
          <Card variant="default" padding="md">
            <ScheduleCreationForm
              companyId="probe-test"
              onSubmit={async () => {}}
              onCancel={() => {}}
            />
          </Card>
        </div>

        {/* ContextRefreshBanner */}
        <div className="mb-2">
          <h4 className="text-xs font-medium mb-2">ContextRefreshBanner (With Prior Findings)</h4>
          <ContextRefreshBanner
            priorOpenFindingsCount={3}
            deduplicatedCount={1}
            onViewFindings={() => {}}
          />
        </div>
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
