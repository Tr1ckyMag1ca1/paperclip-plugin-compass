import React from "react";
import { CheckCircle, Loader } from "lucide-react";
import { Card } from "../primitives/Card.js";

interface ApplyProgressProps {
  step: "preflight" | "doc" | "agents" | "issues" | "wakeups" | "complete" | "error";
  progress: { [key: string]: boolean };
}

/**
 * Sequential step indicator showing Apply progress.
 * Shows 5 steps: preflight → doc → agents → issues → wakeups
 * Each step has status: ✓ (complete), ⏳ (in-progress), ○ (not reached)
 * Per D-15: Progress fill uses neutral foreground (in-flight state), emerald CheckCircle only for done steps.
 */
export function ApplyProgress({
  step,
  progress,
}: ApplyProgressProps): React.ReactElement {
  const steps = [
    { id: "preflight", name: "Validating setup…", status: progress["preflight"] ? "done" : step === "preflight" ? "active" : "pending" },
    { id: "doc", name: "Writing vision document…", status: progress["doc"] ? "done" : step === "doc" ? "active" : "pending" },
    { id: "agents", name: "Provisioning agents…", status: progress["agents"] ? "done" : step === "agents" ? "active" : "pending" },
    { id: "issues", name: "Creating kickoff issues…", status: progress["issues"] ? "done" : step === "issues" ? "active" : "pending" },
    { id: "wakeups", name: "Queuing company heartbeat…", status: progress["wakeups"] ? "done" : step === "wakeups" ? "active" : "pending" },
  ];

  const percentComplete = Math.round((Object.values(progress).filter(Boolean).length / steps.length) * 100);

  return (
    <Card variant="default" padding="md">
      <div className="flex flex-col gap-3">
        {/* Linear Progress Bar */}
        <div>
          <span className="text-xs font-medium text-foreground">Progress</span>
          <div className="mt-2 h-2 bg-muted rounded-none overflow-hidden">
            <div
              className="h-full bg-foreground transition-all"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        {/* Step List */}
        <div className="space-y-2">
          {steps.map(s => (
            <div key={s.id} className="flex items-center gap-2">
              {s.status === "done" && (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              )}
              {s.status === "active" && (
                <Loader className="h-4 w-4 text-foreground animate-spin" />
              )}
              {s.status === "pending" && (
                <div className="h-4 w-4 border-2 border-muted-foreground rounded-full" />
              )}
              <span className={`text-sm ${
                s.status === "active" ? "text-foreground font-semibold" :
                s.status === "done" ? "text-foreground" :
                "text-muted-foreground"
              }`}>
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Success state */}
      {step === "complete" && (
        <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-none p-3">
          <p className="text-sm font-bold text-emerald-600">✓ Company founded!</p>
          <p className="text-xs font-medium text-foreground/70 mt-2">
            Your new company is now heartbeating. Check the inbox for kickoff issues.
          </p>
        </div>
      )}
    </Card>
  );
}
