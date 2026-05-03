import React from "react";
import { CheckCircle, Loader } from "lucide-react";

interface ApplyProgressProps {
  step: "preflight" | "doc" | "agents" | "issues" | "wakeups" | "complete" | "error";
  progress: { [key: string]: boolean };
}

/**
 * Sequential step indicator showing Apply progress.
 * Shows 5 steps: preflight → doc → agents → issues → wakeups
 * Each step has status: ✓ (complete), ⏳ (in-progress), ○ (not reached)
 */
export function ApplyProgress({
  step,
  progress,
}: ApplyProgressProps): React.ReactElement {
  const steps = [
    { key: "preflight", label: "Validating setup…" },
    { key: "doc", label: "Writing vision document…" },
    { key: "agents", label: "Provisioning agents…" },
    { key: "issues", label: "Creating kickoff issues…" },
    { key: "wakeups", label: "Queuing company heartbeat…" },
  ];

  return (
    <div className="space-y-md">
      {/* Progress steps */}
      {steps.map(s => (
        <div key={s.key} className="flex gap-md items-start">
          {progress[s.key] ? (
            <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          ) : step === s.key ? (
            <Loader className="h-5 w-5 text-accent animate-spin flex-shrink-0 mt-0.5" />
          ) : (
            <div className="h-5 w-5 border-2 border-border rounded-full flex-shrink-0 mt-0.5" />
          )}
          <div className="text-body font-normal">{s.label}</div>
        </div>
      ))}

      {/* Success state */}
      {step === "complete" && (
        <div className="bg-accent/10 border border-accent rounded p-lg mt-lg space-y-sm">
          <p className="text-body font-bold text-accent">✓ Company founded!</p>
          <p className="text-label font-normal text-foreground/70">
            Your new company is now heartbeating. Check the inbox for kickoff issues.
          </p>
        </div>
      )}
    </div>
  );
}
