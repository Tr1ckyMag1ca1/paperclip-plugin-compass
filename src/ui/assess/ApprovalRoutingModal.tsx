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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-lg" role="presentation">
      <div
        ref={modalRef}
        className="bg-background border border-border rounded-lg shadow-lg max-w-md w-full mx-auto p-lg space-y-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="routing-modal-title"
      >
        {/* Header */}
        <h2 id="routing-modal-title" className="text-heading font-bold">
          Approval routing
        </h2>

        {/* Body text */}
        <div className="space-y-md text-body font-normal">
          <p>How should amendments be approved?</p>
        </div>

        {/* Radio buttons */}
        <div className="space-y-md">
          <label className="flex items-start gap-md cursor-pointer group">
            <input
              type="radio"
              name="routing"
              value="founder"
              checked={selectedRouting === "founder"}
              onChange={() => setSelectedRouting("founder")}
              className="mt-1 focus:outline-none focus:ring-2 focus:ring-accent rounded"
            />
            <div className="flex-1">
              <p className="text-body font-bold text-foreground group-hover:text-foreground/80">
                Founder only
              </p>
              <p className="text-label font-normal text-foreground/70">
                Amendments apply immediately after your approval
              </p>
            </div>
          </label>

          <label className="flex items-start gap-md cursor-pointer group">
            <input
              type="radio"
              name="routing"
              value="founder+ceo"
              checked={selectedRouting === "founder+ceo"}
              onChange={() => setSelectedRouting("founder+ceo")}
              className="mt-1 focus:outline-none focus:ring-2 focus:ring-accent rounded"
            />
            <div className="flex-1">
              <p className="text-body font-bold text-foreground group-hover:text-foreground/80">
                Founder + CEO agent
              </p>
              <p className="text-label font-normal text-foreground/70">
                Amendments queued for CEO review before applying
              </p>
            </div>
          </label>
        </div>

        {/* Current status */}
        <p className="text-label font-normal text-foreground/70">
          Current: <span className="text-accent font-bold">{currentRouting}</span>
        </p>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive rounded p-md">
            <p className="text-label font-normal text-destructive">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-md justify-end pt-lg border-t border-border">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-md py-sm rounded border border-border text-foreground hover:bg-card transition-colors font-normal text-body focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            onClick={handleSave}
            disabled={isSaving || selectedRouting === currentRouting}
            className="px-md py-sm rounded bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-medium text-body focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving…" : "Save routing"}
          </button>
        </div>
      </div>
    </div>
  );
}
