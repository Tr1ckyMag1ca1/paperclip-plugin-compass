import React from "react";
import { Compass } from "lucide-react";
import type { InventorySnapshot, Mode } from "../../types.js";
import { HelpTip } from "../primitives/HelpTip.js";

interface ModeBannerProps {
  inventory: InventorySnapshot;
  detectedMode: Mode;
  override: Mode | null;
  onOverrideChange: (mode: Mode) => void;
}

/**
 * Get icon color based on company mode.
 *
 * Per D-04 and UI-SPEC.md, each mode has a distinct accent color for visual hierarchy:
 * - Found: emerald (success/healthy)
 * - Assess: blue (info/audit)
 * - Revive: red (error/critical)
 * - Reposition: yellow (warning/pivot)
 */
function getModeIconColor(mode: Mode): string {
  const colors: Record<Mode, string> = {
    Found: "text-emerald-500",
    Assess: "text-blue-500",
    Revive: "text-red-500",
    Reposition: "text-yellow-500",
  };
  return colors[mode];
}

/**
 * ModeBanner — Displays detected company mode and override dropdown.
 *
 * Per D-03 (mode banner at top with override dropdown), D-09/MODE-03 (override
 * persistence), and v1.2 onboarding additions: HelpTip clarifies what mode is
 * and how detection works; per-option titles surface mode purpose on hover.
 */
export function ModeBanner({
  inventory,
  detectedMode,
  override,
  onOverrideChange,
}: ModeBannerProps): React.ReactElement {
  const currentMode = override || detectedMode;

  return (
    <div className="border-b bg-card px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <Compass className={`h-5 w-5 mt-1 ${getModeIconColor(currentMode)} flex-shrink-0`} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold leading-tight">
                {getModeLabel(currentMode)}
              </h2>
              <HelpTip
                title={`What is ${currentMode} mode?`}
                body={MODE_HELP[currentMode].body}
                details={MODE_HELP[currentMode].details}
                size="sm"
              />
            </div>
            <p className="text-sm text-foreground/70 mt-1">
              {getModeBannerCopy(currentMode)}
            </p>
            {override && override !== detectedMode ? (
              <p className="text-xs text-yellow-600 mt-1">
                Manual override active. Compass detected{" "}
                <strong>{detectedMode}</strong>.{" "}
                <button
                  type="button"
                  onClick={() => onOverrideChange(detectedMode)}
                  className="underline hover:no-underline"
                >
                  Reset to detected
                </button>
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <HelpTip
            title="Why a mode dropdown?"
            body="Compass auto-detects which lifecycle stage your company is in and routes you to the matching workflow. Override here if the detection is wrong, or if you want to run a different workflow against this company."
            details="Detection rules (deterministic, no LLM):\n• Found = no VISION.md exists yet\n• Assess = VISION + recent activity (healthy)\n• Revive = recent stall (no heartbeats / blockers piling)\n• Reposition = healthy company, founder requests pivot\n\nYour override persists per-company in plugin state."
            label="Why?"
            size="sm"
          />
          <select
            value={currentMode}
            onChange={(e) => onOverrideChange(e.target.value as Mode)}
            aria-label="Select Compass mode"
            className="rounded-none border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5 focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="Found" title="Founding a new company — full vision quest interview to bootstrap VISION.md and provision agents">
              Found a new company
            </option>
            <option value="Assess" title="Strategic drift audit — compares VISION.md vs last 30 days of agent activity, proposes amendments">
              Run a fresh audit
            </option>
            <option value="Revive" title="Diagnose why a healthy company has gone quiet and propose unblocking actions">
              Get unstuck
            </option>
            <option value="Reposition" title="Execute a strategic pivot — re-run scoped vision quest on the deltas, cascade brand/voice/scope changes">
              Pivot strategy
            </option>
          </select>
        </div>
      </div>
    </div>
  );
}

const MODE_HELP: Record<Mode, { body: string; details: string }> = {
  Found: {
    body: "You're founding a new company. Compass walks you through a 6-section vision quest interview, then writes VISION.md and provisions agents.",
    details:
      "Triggered when no VISION.md document exists for this company yet. The vision quest covers Big Picture, Revenue & Customers, Growth & Marketing, Product Direction, CEO Autonomy, and Vision & Identity. Each section is amendable later via Reposition mode.",
  },
  Assess: {
    body: "Your company looks healthy. Compass audits whether daily activity has drifted from your stated VISION and proposes amendments if it has.",
    details:
      "Compares the last 30 days of agent activity against each section of VISION.md, scores drift, and routes amendments through your approval gate (founder / founder+ceo / configurable per-company).",
  },
  Revive: {
    body: "Your company has stalled. Compass classifies the blocker (single-agent failure, governance loop, dead agent, etc.) and queues unblocking actions for you to approve.",
    details:
      "Stall classifier runs deterministic rules over inventory: no heartbeats in N days, blockers piling in issue queue, agents in error state, governance approvals stuck. Output is an ActionQueue grouped by root cause.",
  },
  Reposition: {
    body: "Your company is healthy and you want to pivot. Compass runs a scoped re-interview on just the deltas, then cascades brand/voice/scope changes across VISION, agents, and content.",
    details:
      "You describe the strategic shift in plain English. Compass infers which VISION sections it touches, re-asks only those questions, and produces an amendment diff plus a cascade plan (which agents need rebriefing, which content needs rewriting).",
  },
};

function getModeLabel(mode: Mode): string {
  const labels: Record<Mode, string> = {
    Found: "Found mode",
    Assess: "Assess mode",
    Revive: "Revive mode",
    Reposition: "Reposition mode",
  };
  return labels[mode];
}

function getModeBannerCopy(mode: Mode): string {
  const copy: Record<Mode, string> = {
    Found: "No company yet. Let's create a strategic foundation with the vision quest.",
    Assess: "Your company is healthy. Compass can audit drift since the last review.",
    Revive: "Your company is stalled. Let's diagnose the blocker and unlock progress.",
    Reposition: "Your company is healthy. Let's execute a strategic shift together.",
  };
  return copy[mode];
}
