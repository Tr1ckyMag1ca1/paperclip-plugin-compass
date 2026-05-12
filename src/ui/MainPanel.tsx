import React, { useCallback, useState } from "react";
import {
  usePluginData,
  usePluginAction,
  useHostContext,
  type PluginPageProps,
} from "@paperclipai/plugin-sdk/ui";
import type { InventorySnapshot, Mode } from "../types.js";
import { ModeBanner } from "./components/ModeBanner.js";
import { WelcomeCard } from "./components/WelcomeCard.js";
import { InventoryDisplay } from "./components/InventoryDisplay.js";
import { ChatPanel } from "./components/ChatPanel.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import { AssessPanel } from "./assess/AssessPanel.js";
import { FoundPanel } from "./found/FoundPanel.js";
import { RevivePanel } from "./revive/RevivePanel.js";
import { RepositionPanel } from "./reposition/RepositionPanel.js";

export function MainPanel(props?: Partial<PluginPageProps>): React.ReactElement {
  console.log("[Compass] MainPanel mounted", props);

  const [refreshing, setRefreshing] = useState(false);
  const hostContext = useHostContext();
  const propContext = props?.context;
  const companyId =
    (propContext?.companyId as string | undefined) ??
    ((hostContext as any)?.companyId as string | undefined) ??
    "";

  const { data: inventory, error: inventoryError } =
    usePluginData<InventorySnapshot>("getInventory", { companyId });
  const { data: modeData, error: modeError } =
    usePluginData<{ mode: Mode; inventory: InventorySnapshot }>(
      "getDetectedMode",
      { companyId }
    );
  const { data: storedOverride, refresh: refreshOverride } = usePluginData<
    Mode | null
  >("getModeOverride", { companyId });

  const setModeOverrideAction = usePluginAction("setModeOverride");

  const handleModeOverride = useCallback(
    async (newMode: Mode) => {
      try {
        await setModeOverrideAction({ companyId, mode: newMode });
        refreshOverride();
      } catch (e) {
        console.error("[Compass] setModeOverride failed", e);
      }
    },
    [setModeOverrideAction, companyId, refreshOverride]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
    } finally {
      setRefreshing(false);
    }
  }, []);

  if (inventoryError || modeError) {
    const e = inventoryError || modeError;
    return <ErrorBoundary error={new Error(String(e))} />;
  }

  if (!companyId) {
    return (
      <div className="flex items-center justify-center p-6 min-h-[400px] bg-background text-foreground">
        <p>Compass needs a company context.</p>
      </div>
    );
  }

  if (!inventory || !modeData || storedOverride === undefined) {
    return (
      <div className="flex items-center justify-center p-4 min-h-[400px] bg-background text-foreground">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const detectedMode = modeData.mode;
  const currentMode = storedOverride || detectedMode;
  const visionExists = inventory.visionExists;
  const companyName = inventory.companyName || "Company";

  const renderModeBody = () => {
    if (currentMode === "Assess") {
      return (
        <AssessPanel
          companyId={companyId}
          companyName={companyName}
          visionExists={visionExists}
        />
      );
    }
    if (currentMode === "Found") {
      return <FoundPanel />;
    }
    if (currentMode === "Revive") {
      return (
        <RevivePanel companyId={companyId} companyName={companyName} />
      );
    }
    if (currentMode === "Reposition") {
      return (
        <RepositionPanel
          companyId={companyId}
          companyName={companyName}
          visionExists={visionExists}
        />
      );
    }
    return <InventoryDisplay inventory={inventory} />;
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <ModeBanner
        inventory={inventory}
        detectedMode={detectedMode}
        override={storedOverride}
        onOverrideChange={handleModeOverride}
      />
      <WelcomeCard companyId={companyId} detectedMode={currentMode} />
      <div className="flex-1 overflow-y-auto">{renderModeBody()}</div>
      <div className="border-t px-4 py-4">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10 disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <ChatPanel detectedMode={currentMode} />
    </div>
  );
}
