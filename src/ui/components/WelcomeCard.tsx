import React, { useState } from "react";
import { X, Compass, Sparkles, Activity, AlertCircle, RefreshCw } from "lucide-react";

interface WelcomeCardProps {
  companyId: string;
  detectedMode: string;
}

const STORAGE_KEY_PREFIX = "compass:welcome:dismissed:";

/**
 * WelcomeCard — first-run explainer shown above the active mode panel.
 *
 * Explains the four modes + how detection works in plain English. Dismissible
 * per company; dismissal persists in localStorage (per-browser; not synced to
 * worker state, which is acceptable for an in-app onboarding hint).
 *
 * Returns null when the user has dismissed it for this company OR when the
 * companyId is empty (no company context yet).
 */
export function WelcomeCard({
  companyId,
  detectedMode,
}: WelcomeCardProps): React.ReactElement | null {
  const storageKey = `${STORAGE_KEY_PREFIX}${companyId}`;
  const initialDismissed =
    typeof window !== "undefined" && companyId
      ? window.localStorage?.getItem(storageKey) === "1"
      : true;
  const [dismissed, setDismissed] = useState(initialDismissed);

  if (!companyId || dismissed) return null;

  const handleDismiss = () => {
    try {
      window.localStorage?.setItem(storageKey, "1");
    } catch {
      // localStorage may be blocked; that's fine, just dismiss for session
    }
    setDismissed(true);
  };

  return (
    <div className="border-b border-border bg-muted/40 px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Compass className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold">Welcome to Compass</h3>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed mb-3">
            Compass is your strategic consultant for this company. It detects what
            stage your company is in and routes you to the right workflow.{" "}
            {detectedMode ? (
              <>
                Right now Compass thinks you need <strong>{detectedMode}</strong>{" "}
                mode — you can change that anytime with the dropdown above.
              </>
            ) : null}
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-foreground/80">
            <li className="flex items-start gap-2">
              <Sparkles className="h-3 w-3 mt-0.5 text-emerald-500 flex-shrink-0" />
              <span>
                <strong>Found</strong> — bootstrap a brand-new company with the vision quest
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Activity className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
              <span>
                <strong>Assess</strong> — audit drift between VISION and recent activity
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="h-3 w-3 mt-0.5 text-red-500 flex-shrink-0" />
              <span>
                <strong>Revive</strong> — diagnose why a stalled company has gone quiet
              </span>
            </li>
            <li className="flex items-start gap-2">
              <RefreshCw className="h-3 w-3 mt-0.5 text-yellow-500 flex-shrink-0" />
              <span>
                <strong>Reposition</strong> — pivot strategy and cascade brand/voice changes
              </span>
            </li>
          </ul>
          <p className="text-xs text-foreground/60 mt-3">
            Click the <strong>?</strong> icons next to any heading for inline help. See the
            README for the full walkthrough.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss welcome card"
          className="p-1 text-foreground/60 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-none"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
