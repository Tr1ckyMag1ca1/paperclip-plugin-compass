/**
 * ApprovalRoutingModal Component — Approval routing configuration modal
 *
 * Per 03-UI-SPEC.md: Allows founder to choose approval routing:
 * 'founder' (fast, synchronous) or 'founder+ceo' (collaborative, async gate).
 * Per-company setting saved in plugin config.
 */

import React, { useEffect, useRef, useState } from "react";

interface ApprovalRoutingModalProps {
  /** Current routing mode */
  currentRouting: "founder" | "founder+ceo";
  /** Callback when routing is changed and confirmed */
  onSaveRouting: (routing: "founder" | "founder+ceo") => Promise<void>;
  /** Callback to close modal */
  onCancel: () => void;
}

/**
 * Modal for selecting approval routing preference.
 */
export function ApprovalRoutingModal({
  currentRouting,
  onSaveRouting,
  onCancel,
}: ApprovalRoutingModalProps): React.ReactElement {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedRouting, setSelectedRouting] = useState<"founder" | "founder+ceo">(
    currentRouting
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Focus trap and ESC handling
  useEffect(() => {
    confirmButtonRef.current?.focus();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modalRef.current) return;

      // Simple focus trap
      const focusableElements = modalRef.current.querySelectorAll(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])"
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await onSaveRouting(selectedRouting);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save routing";
      setError(msg);
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" onClick={onCancel} />
      {/* Panel */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div
          ref={modalRef}
          className="bg-card border border-border rounded-none shadow-lg max-w-md w-full mx-auto p-4 space-y-4 pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="routing-modal-title"
        >
          {/* Header */}
          <h2 id="routing-modal-title" className="text-base font-semibold">
            Approval routing
          </h2>

          {/* Body text */}
          <div className="space-y-3 text-sm font-normal">
            <p>How should amendments be approved?</p>
          </div>

          {/* Radio buttons */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="radio"
                name="routing"
                value="founder"
                checked={selectedRouting === "founder"}
                onChange={() => setSelectedRouting("founder")}
                className="mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-600 rounded"
              />
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground group-hover:text-foreground/80">
                  Founder only
                </p>
                <p className="text-xs font-medium text-foreground/70">
                  Amendments apply immediately after your approval
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="radio"
                name="routing"
                value="founder+ceo"
                checked={selectedRouting === "founder+ceo"}
                onChange={() => setSelectedRouting("founder+ceo")}
                className="mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-600 rounded"
              />
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground group-hover:text-foreground/80">
                  Founder + CEO agent
                </p>
                <p className="text-xs font-medium text-foreground/70">
                  Amendments queued for CEO review before applying
                </p>
              </div>
            </label>
          </div>

          {/* Current status */}
          <p className="text-xs font-medium text-foreground/70">
            Current: <span className="text-emerald-600 font-bold">{currentRouting}</span>
          </p>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-none p-3">
              <p className="text-xs font-medium text-red-600">{error}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="px-3 py-2 rounded-none border border-border text-foreground hover:bg-muted transition-colors font-normal text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              ref={confirmButtonRef}
              onClick={handleSave}
              disabled={isSaving || selectedRouting === currentRouting}
              className="px-3 py-2 rounded-none bg-emerald-500 text-white hover:bg-emerald-600 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving…" : "Save routing"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
