import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { InventorySnapshot } from "../../types.js";
import { AgentCard } from "./AgentCard.js";
import { DocumentList } from "./DocumentList.js";
import { ActivityTimeline } from "./ActivityTimeline.js";
import { VisionStatusDisplay } from "./VisionStatusDisplay.js";

interface InventoryDisplayProps {
  inventory: InventorySnapshot;
}

/**
 * InventoryDisplay — Renders collapsible sections for company inventory.
 *
 * Per D-03 (collapsible sections below mode banner) and INV-04,
 * displays four sections:
 * 1. Agents: Count badge + list of agent cards (name, role, status, heartbeat)
 * 2. Documents: Key documents with presence indicators (VISION.md, etc.)
 * 3. Recent Activity: Recent issues (last 30 days) with timestamps
 * 4. VISION Status: VISION.md presence, last amendment date, completeness
 *
 * Each section defaults to open (expanded) on first load.
 * Uses native HTML <details> element for expand/collapse (accessibility best practice).
 *
 * @param inventory Inventory snapshot to display
 */
export function InventoryDisplay({
  inventory,
}: InventoryDisplayProps): React.ReactElement {
  return (
    <div className="divide-y divide-border">
      {/* Agents section */}
      <CollapsibleSection
        title={`Agents (${inventory.agentCount})`}
        defaultOpen={true}
      >
        {inventory.agents.length > 0 ? (
          <div className="space-y-2">
            {inventory.agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground/60">
            No agents provisioned yet. Found mode will create them.
          </p>
        )}
      </CollapsibleSection>

      {/* Documents section */}
      <CollapsibleSection title="Documents" defaultOpen={true}>
        {inventory.documents.length > 0 ? (
          <DocumentList documents={inventory.documents} />
        ) : (
          <p className="text-sm text-foreground/60">
            No key documents found. VISION.md will be created when you found
            this company.
          </p>
        )}
      </CollapsibleSection>

      {/* Recent Activity section */}
      <CollapsibleSection
        title={`Recent Activity (${inventory.recentIssueCount})`}
        defaultOpen={true}
      >
        {inventory.recentIssues.length > 0 ? (
          <ActivityTimeline issues={inventory.recentIssues} />
        ) : (
          <p className="text-sm text-foreground/60">
            No activity in the last 30 days. Agents may need to be woken up.
          </p>
        )}
      </CollapsibleSection>

      {/* VISION Status section */}
      <CollapsibleSection title="VISION Status" defaultOpen={true}>
        <VisionStatusDisplay visionExists={inventory.visionExists} />
      </CollapsibleSection>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * CollapsibleSection — Expandable/collapsible header with content.
 *
 * Uses native HTML <details> element for accessibility and semantic markup.
 * Toggle arrow rotates on open/close.
 *
 * @param title Section header label
 * @param defaultOpen Whether section is expanded by default
 * @param children Content to display when expanded
 */
function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps): React.ReactElement {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className="group"
    >
      <summary className="flex cursor-pointer items-center gap-4 px-4 py-4 font-semibold text-sm select-none hover:bg-accent/5">
        <ChevronDown
          className={`h-4 w-4 transition-transform flex-shrink-0 ${
            open ? "" : "-rotate-90"
          }`}
        />
        <span className="text-xs font-medium">{title}</span>
      </summary>
      <div className="px-4 py-4 text-sm">{children}</div>
    </details>
  );
}
