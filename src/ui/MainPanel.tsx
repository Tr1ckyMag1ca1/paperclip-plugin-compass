import React, { useCallback, useState } from "react";
import {
  usePluginData,
  usePluginAction,
} from "@paperclipai/plugin-sdk/ui";
import type { InventorySnapshot, Mode } from "../types.js";
import { ModeBanner } from "./components/ModeBanner.js";
import { InventoryDisplay } from "./components/InventoryDisplay.js";
import { ChatPanel } from "./components/ChatPanel.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import { AssessPanel } from "./assess/AssessPanel.js";
import { FoundPanel } from "./found/FoundPanel.js";
import { RevivePanel } from "./revive/RevivePanel.js";
import { RepositionPanel } from "./reposition/RepositionPanel.js";
import { HistoryPanel, HistoryTabBadge } from "./memory/index.js";

/**
 * MainPanel — Root UI component for Compass diagnostic dashboard.
 *
 * Per D-03 (mode banner at top, collapsible sections below, chat input at bottom),
 * MainPanel orchestrates:
 * 1. Mode banner with override dropdown (MODE-03, D-09)
 * 2. Inventory display with collapsible sections (INV-04, D-03)
 * 3. Tab navigation with History tab (D-10, MEM-04)
 * 4. Manual refresh button (D-04)
 * 5. Chat input shell for keyword routing (MODE-04, D-07)
 *
 * Uses Plugin SDK hooks:
 * - usePluginData("getInventory") → fetches company snapshot on load
 * - usePluginData("getDetectedMode") → auto-detects mode from inventory
 * - usePluginData("getModeOverride") → retrieves stored override (D-09)
 * - usePluginAction("setModeOverride") → persists founder's mode choice
 *
 * Per D-10: History tab is a sibling to mode panels, with tab badge showing finding count.
 * Per D-11: Other components can call onViewHistory to jump to History tab.
 *
 * @returns React component for sidebar panel slot
 */
type TabType = "mode" | "history";

/**
 * HistoryTabBar — Tab navigation with finding count badge
 * Per D-10: Shows tab buttons for mode and history, with badge showing count.
 */
function HistoryTabBar({
  selectedTab,
  onSelectTab,
  currentMode,
  companyId,
}: {
  selectedTab: TabType;
  onSelectTab: (tab: TabType) => void;
  currentMode: Mode;
  companyId: string;
}): React.ReactElement {
  // Fetch history to get finding count for badge
  const { data: historyData } = usePluginData<any>("memory.load", {
    companyId,
  });

  const findingCount = historyData?.history?.findings?.length || 0;
  const hasOpenFindings = (historyData?.history?.findings || []).some(
    (f: any) => f.status === "open"
  );

  return (
    <div className="border-b px-lg py-sm flex gap-sm">
      <button
        onClick={() => onSelectTab("mode")}
        className={`text-label font-medium px-md py-sm rounded transition-colors ${
          selectedTab === "mode"
            ? "bg-accent text-accent-foreground"
            : "text-foreground/60 hover:text-foreground"
        }`}
      >
        {currentMode}
      </button>
      <button
        onClick={() => onSelectTab("history")}
        className={`text-label font-medium px-md py-sm rounded transition-colors flex items-center gap-sm ${
          selectedTab === "history"
            ? "bg-accent text-accent-foreground"
            : "text-foreground/60 hover:text-foreground"
        }`}
      >
        History
        {findingCount > 0 && (
          <HistoryTabBadge count={findingCount} hasOpenFindings={hasOpenFindings} />
        )}
      </button>
    </div>
  );
}

export function MainPanel(): React.ReactElement {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabType>("mode");

  // Fetch inventory snapshot on plugin open (D-04)
  const { data: inventory, loading: inventoryLoading, error: inventoryError } =
    usePluginData<InventorySnapshot>("getInventory");

  // Fetch detected mode from inventory (MODE-01, MODE-02)
  const { data: modeData, loading: modeLoading, error: modeError } =
    usePluginData<{ mode: Mode; inventory: InventorySnapshot }>("getDetectedMode");

  // Fetch stored mode override (D-09, MODE-03)
  const { data: storedOverride, loading: overrideLoading } =
    usePluginData<Mode | null>("getModeOverride");

  // Set mode override action handler (D-09, MODE-03)
  const setModeOverrideAction = usePluginAction("setModeOverride");

  // Handle mode override change from dropdown
  const handleModeOverride = useCallback(
    async (newMode: Mode) => {
      try {
        // Call the action with mode parameter
        await setModeOverrideAction({ mode: newMode });
      } catch (error) {
        console.error("Failed to set mode override:", error);
      }
    },
    [setModeOverrideAction]
  );

  // Handle refresh button click (D-04)
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Re-fetch inventory by triggering usePluginData to refresh
      // In actual implementation, may need to call a refresh action or re-mount hook
      // For now, set refreshing state and let component re-render
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Handle view history navigation (D-10, D-11)
  const handleViewHistory = useCallback(() => {
    setSelectedTab("history");
  }, []);

  // Handle errors gracefully (D-08)
  if (inventoryError || modeError) {
    const errorToDisplay = inventoryError || modeError;
    const errorMessage = errorToDisplay instanceof Error
      ? errorToDisplay.message
      : String(errorToDisplay);
    return (
      <ErrorBoundary error={new Error(errorMessage)} />
    );
  }

  // Loading state
  if (inventoryLoading || modeLoading || overrideLoading || storedOverride === undefined) {
    return (
      <div className="flex items-center justify-center p-lg min-h-[400px]">
        <div className="text-center">
          <p className="text-body text-foreground/70">Loading diagnostic dashboard...</p>
        </div>
      </div>
    );
  }

  // No inventory data available
  if (!inventory || !modeData) {
    return <ErrorBoundary error={new Error("Failed to load company inventory")} />;
  }

  const detectedMode = modeData.mode;
  const currentMode = storedOverride || detectedMode;
  const companyId = inventory?.companyId || "";
  const visionExists = inventory?.visionExists ?? false;

  // Render tab-based interface (D-10: History tab sibling to mode panels)
  const renderContent = () => {
    if (selectedTab === "history") {
      return (
        <HistoryPanel
          companyId={companyId}
        />
      );
    }

    // Render mode-specific panel (ASSESS-02, REVIVE-01)
    if (currentMode === "Assess") {
      return (
        <AssessPanel
          companyId={companyId}
          companyName="Company"
          visionExists={visionExists}
        />
      );
    }

    if (currentMode === "Found") {
      return <FoundPanel />;
    }

    if (currentMode === "Revive") {
      return (
        <RevivePanel
          companyId={companyId}
          companyName="Company"
        />
      );
    }

    if (currentMode === "Reposition") {
      return (
        <RepositionPanel
          companyId={companyId}
          companyName="Company"
          visionExists={visionExists}
        />
      );
    }

    // Default diagnostic dashboard for "probe" mode or other modes
    return (
      <div className="flex-1 overflow-y-auto">
        <InventoryDisplay inventory={inventory} />
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* D-03: Mode banner at top with override dropdown */}
      <ModeBanner
        inventory={inventory}
        detectedMode={detectedMode}
        override={storedOverride}
        onOverrideChange={handleModeOverride}
      />

      {/* Tab bar with History tab (D-10, MEM-04) */}
      <HistoryTabBar
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
        currentMode={currentMode}
        companyId={companyId}
      />

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>

      {/* Manual refresh button (D-04) - only show in mode tab */}
      {selectedTab === "mode" && (
        <div className="border-t px-lg py-md">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-sm rounded px-md py-sm text-sm font-medium text-accent hover:bg-accent/10 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      )}

      {/* Chat input shell (D-07, MODE-04) - only show in mode tab */}
      {selectedTab === "mode" && <ChatPanel detectedMode={currentMode} />}
    </div>
  );
}
