/**
 * HistoryPanel Component
 *
 * Per D-10, D-11, UI-SPEC: orchestrates engagement findings list with filters + schedules.
 *
 * Two-tab layout:
 * 1. Findings tab: grouped by run timestamp (newest first), with status/mode filters
 * 2. Schedules tab: active routines list + creation form
 *
 * Per D-10: sticky filter header, grouped by run timestamp.
 * Per D-13: optional separate "Schedules" section within or as sub-tab.
 */

import React, { useMemo, useState } from "react";
import type { FindingStatus, Mode, EngagementHistory } from "../../types/memory.js";
import { useMemory } from "./MemoryState.js";
import { FindingCard } from "./FindingCard.js";
import { SchedulesSection } from "./SchedulesSection.js";

interface HistoryPanelProps {
  companyId: string;
}

type TabType = "findings" | "schedules";

/**
 * HistoryPanel — main engagement history view with filters and schedules.
 * Per D-10: supports status + mode filtering, grouped by timestamp.
 */
export const HistoryPanel: React.FC<HistoryPanelProps> = ({ companyId }) => {
  const { history, loading, error, refetch, updateFindingStatus } = useMemory(companyId);
  const [activeTab, setActiveTab] = useState<TabType>("findings");
  const [statusFilter, setStatusFilter] = useState<FindingStatus | "all">("all");
  const [modeFilter, setModeFilter] = useState<Mode | "all">("all");

  /**
   * Filter findings by status and mode, then group by date.
   */
  const groupedFindings = useMemo(() => {
    if (!history?.findings) return {};

    const filtered = history.findings.filter((f) => {
      const statusMatch = statusFilter === "all" || f.status === statusFilter;
      const modeMatch = modeFilter === "all" || f.mode === modeFilter;
      return statusMatch && modeMatch;
    });

    // Group by creation date (YYYY-MM-DD)
    const grouped: { [date: string]: typeof filtered } = {};
    filtered.forEach((f) => {
      const date = f.created_at.split("T")[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(f);
    });

    // Sort by date descending (newest first)
    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      .reduce(
        (acc, [date, findings]) => {
          acc[date] = findings;
          return acc;
        },
        {} as { [date: string]: typeof filtered }
      );
  }, [history?.findings, statusFilter, modeFilter]);

  /**
   * Handle status change with confirmation modal (modal is in FindingCard).
   */
  const handleStatusChange = async (
    findingId: string,
    newStatus: FindingStatus
  ) => {
    await updateFindingStatus(findingId, newStatus);
  };

  /**
   * Find a finding by ID for modal confirmations.
   */
  const getFinding = (id: string) => history?.findings.find((f) => f.id === id);

  if (loading && !history) {
    return (
      <div className="flex items-center justify-center p-lg">
        <div className="text-label text-foreground/70">Loading engagement history…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-lg">
        <div className="p-md bg-card rounded border border-destructive/50">
          <h4 className="text-body font-bold text-destructive">Error loading history</h4>
          <p className="text-label text-foreground/70 mt-sm">{error}</p>
          <button
            onClick={refetch}
            className="mt-md px-md py-sm text-label text-accent hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const findingCount = history?.findings?.length || 0;
  const routineCount = history?.routines?.length || 0;

  return (
    <div className="flex flex-col h-full">
      {/* Tab Headers */}
      <div className="sticky top-0 bg-background border-b border-border px-lg py-sm flex gap-md z-10">
        <button
          onClick={() => setActiveTab("findings")}
          className={`text-label font-bold pb-sm border-b-2 transition-colors ${
            activeTab === "findings"
              ? "text-accent border-accent"
              : "text-foreground/70 border-transparent hover:text-foreground"
          }`}
        >
          Engagement history ({findingCount})
        </button>
        <button
          onClick={() => setActiveTab("schedules")}
          className={`text-label font-bold pb-sm border-b-2 transition-colors ${
            activeTab === "schedules"
              ? "text-accent border-accent"
              : "text-foreground/70 border-transparent hover:text-foreground"
          }`}
        >
          Scheduled check-ins ({routineCount})
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "findings" ? (
          <>
            {/* Sticky Filter Header */}
            <div className="sticky top-12 bg-background border-b border-border px-lg py-md z-10">
              <div className="space-y-sm">
                {/* Status Filter */}
                <div>
                  <label className="text-label font-bold mb-xs block">Status</label>
                  <div className="flex flex-wrap gap-xs">
                    {(["all", "open", "addressed", "invalidated"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-sm py-xs rounded text-label transition-colors ${
                          statusFilter === s
                            ? "bg-accent text-background"
                            : "bg-foreground/10 text-foreground hover:bg-foreground/20"
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode Filter */}
                <div>
                  <label className="text-label font-bold mb-xs block">Mode</label>
                  <div className="flex flex-wrap gap-xs">
                    {(["all", "Found", "Assess", "Revive", "Reposition"] as const).map(
                      (m) => (
                        <button
                          key={m}
                          onClick={() => setModeFilter(m)}
                          className={`px-sm py-xs rounded text-label transition-colors ${
                            modeFilter === m
                              ? "bg-accent text-background"
                              : "bg-foreground/10 text-foreground hover:bg-foreground/20"
                          }`}
                        >
                          {m}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Findings List or Empty State */}
            {findingCount === 0 ? (
              <div className="p-lg text-center">
                <h4 className="text-heading font-bold mb-sm">No engagement history yet</h4>
                <p className="text-body text-foreground/70">
                  Findings appear here after you Found, Assess, Revive, or Reposition a
                  company.
                </p>
              </div>
            ) : Object.keys(groupedFindings).length === 0 ? (
              <div className="p-lg text-center">
                <p className="text-body text-foreground/70">
                  No findings match the selected filters.
                </p>
              </div>
            ) : (
              <div className="p-lg space-y-lg">
                {Object.entries(groupedFindings).map(([date, findings]) => (
                  <div key={date}>
                    {/* Date Header */}
                    <p className="text-label font-bold text-foreground/70 mb-sm">
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>

                    {/* Findings for this date */}
                    <div className="space-y-sm">
                      {findings.map((finding) => (
                        <FindingCard
                          key={finding.id}
                          finding={finding}
                          onMarkAddressed={async (id) => {
                            await handleStatusChange(id, "addressed");
                          }}
                          onMarkInvalidated={async (id) => {
                            await handleStatusChange(id, "invalidated");
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Schedules Tab */
          <div className="p-lg">
            <SchedulesSection companyId={companyId} />
          </div>
        )}
      </div>
    </div>
  );
};
