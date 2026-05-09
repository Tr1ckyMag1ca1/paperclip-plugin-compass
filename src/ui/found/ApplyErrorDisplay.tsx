import React from "react";

interface ApplyErrorDisplayProps {
  message: string;
  details?: string;
}

/**
 * Inline error alert for Apply failures.
 * Per D-16: Not a modal, displays inline within ApplyProgress or parent container.
 * Container: bg-red-500/10 border-red-500/30 p-3
 * Text: text-red-600 text-sm (message bold, details normal)
 */
export function ApplyErrorDisplay({
  message,
  details,
}: ApplyErrorDisplayProps): React.ReactElement {
  return (
    <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-none">
      <p className="text-red-600 text-sm font-medium">{message}</p>
      {details && (
        <p className="text-red-600 text-sm mt-2 opacity-80">{details}</p>
      )}
    </div>
  );
}
