import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ErrorBoundaryProps {
  error: Error;
}

/**
 * ErrorBoundary — Displays schema validation failures with founder-readable messages.
 *
 * Per D-08 (schema error display with founder-readable messages, no stack traces),
 * catches and displays:
 * - Schema validation errors
 * - SDK compatibility errors
 * - Network/connectivity errors
 *
 * Never shows stack traces or technical jargon. Includes actionable next steps.
 *
 * @param error Error object to display
 */
export function ErrorBoundary({ error }: ErrorBoundaryProps): React.ReactElement {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return (
      <div className="flex items-center justify-center p-lg min-h-[400px]">
        <p className="text-sm text-foreground/60">Error dismissed. Refresh to retry.</p>
      </div>
    );
  }

  const { title, message, nextSteps } = parseError(error);

  return (
    <div className="flex items-center justify-center p-lg min-h-[400px]">
      <div className="max-w-md w-full rounded-lg border border-orange-200 bg-orange-50 p-lg">
        <div className="flex items-start gap-md">
          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-orange-900">{title}</h3>
            <p className="text-sm text-orange-800 mt-md">{message}</p>

            {nextSteps && (
              <div className="mt-md pt-md border-t border-orange-200">
                <p className="text-xs font-semibold text-orange-700 mb-sm">
                  What to do:
                </p>
                <ol className="text-xs text-orange-700 space-y-xs list-decimal list-inside">
                  {nextSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="mt-md inline-flex items-center gap-xs px-sm py-xs rounded text-xs font-medium text-orange-700 hover:bg-orange-100"
            >
              <X className="h-3 w-3" />
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Parse error message into founder-readable title, message, and next steps.
 *
 * Maps common errors (schema validation, SDK compatibility, network) to
 * founder-friendly messages without exposing stack traces.
 *
 * @param error Error object
 * @returns Parsed error with title, message, and optional next steps
 */
function parseError(error: Error): {
  title: string;
  message: string;
  nextSteps?: string[];
} {
  const msg = error.message.toLowerCase();

  if (
    msg.includes("schema") ||
    msg.includes("validation") ||
    msg.includes("sdk")
  ) {
    return {
      title: "Compass Requires an Update",
      message:
        "Your Paperclip instance is not compatible with this version of Compass. Please check your SDK version and upgrade if needed.",
      nextSteps: [
        "Check SCHEMA.md in the Compass documentation",
        "Verify you have Paperclip SDK v1.0.0 or later",
        "Reinstall Compass if needed",
      ],
    };
  }

  if (
    msg.includes("network") ||
    msg.includes("connection") ||
    msg.includes("timeout")
  ) {
    return {
      title: "Connection Error",
      message:
        "Compass couldn't reach Paperclip. Check your connection and try again.",
      nextSteps: [
        "Verify your internet connection",
        "Refresh the plugin (Cmd+R or Ctrl+R)",
        "Check Paperclip server status",
      ],
    };
  }

  if (msg.includes("inventory") || msg.includes("company")) {
    return {
      title: "Company Data Unavailable",
      message:
        "Compass couldn't load your company data. This may be a temporary issue.",
      nextSteps: [
        "Refresh the plugin",
        "Verify you have access to this company",
        "Contact support if the problem persists",
      ],
    };
  }

  // Generic error fallback
  return {
    title: "Unexpected Error",
    message: "Something went wrong. Please try again or contact support.",
    nextSteps: ["Refresh the plugin", "Check your browser console for details"],
  };
}
