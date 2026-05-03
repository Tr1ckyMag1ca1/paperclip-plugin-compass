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

/**
 * MainPanel — Root UI component for Compass diagnostic dashboard.
 *
 * Per D-03 (mode banner at top, collapsible sections below, chat input at bottom),
 * MainPanel orchestrates:
 * 1. Mode banner with override dropdown (MODE-03, D-09)
 * 2. Inventory display with collapsible sections (INV-04, D-03)
 * 3. Manual refresh button (D-04)
 * 4. Chat input shell for keyword routing (MODE-04, D-07)
 *
 * Uses Plugin SDK hooks:
 * - usePluginData("getInventory") → fetches company snapshot on load
 * - usePluginData("getDetectedMode") → auto-detects mode from inventory
 * - usePluginData("getModeOverride") → retrieves stored override (D-09)
 * - usePluginAction("setModeOverride") → persists founder's mode choice
 *
 * @returns React component for sidebar panel slot
 */
export function MainPanel(): React.ReactElement {
  const [refreshing, setRefreshing] = useState(false);

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

  // Route to mode-specific panels based on currentMode (ASSESS-02)
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

  // Default diagnostic dashboard for "probe" mode or other modes
  return (
    <div className="flex h-full flex-col bg-background">
      {/* D-03: Mode banner at top with override dropdown */}
      <ModeBanner
        inventory={inventory}
        detectedMode={detectedMode}
        override={storedOverride}
        onOverrideChange={handleModeOverride}
      />

      {/* Collapsible sections for inventory (D-03) */}
      <div className="flex-1 overflow-y-auto">
        <InventoryDisplay inventory={inventory} />
      </div>

      {/* Manual refresh button (D-04) */}
      <div className="border-t px-lg py-md">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-sm rounded px-md py-sm text-sm font-medium text-accent hover:bg-accent/10 disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Chat input shell (D-07, MODE-04) */}
      <ChatPanel detectedMode={currentMode} />
    </div>
  );
}
