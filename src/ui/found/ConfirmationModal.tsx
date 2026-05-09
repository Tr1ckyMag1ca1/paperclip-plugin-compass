import React, { useEffect, useRef } from "react";
import { ProvisioningSummary } from "./ProvisioningSummary.js";
import type { FilledVision, PresetDefinition } from "../../types/found.js";

interface ConfirmationModalProps {
  vision: FilledVision;
  preset: PresetDefinition | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Final approval gate modal (FOUND-11 Stage 2).
 * Explicit "I confirm — apply changes" button with modal backdrop.
 * Lists exact write count and actions that will happen.
 * Focus trap and backdrop prevent accidental dismissal.
 * Per WCAG 2.1: modal role, aria-modal, aria-labelledby, focus management.
 * Per D-09, D-10: Uses unified modal chrome pattern (same as ApprovalRoutingModal).
 */
export function ConfirmationModal({
  vision,
  preset,
  onConfirm,
  onCancel,
}: ConfirmationModalProps): React.ReactElement {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and ESC handling
  useEffect(() => {
    // Focus confirm button on mount
    confirmButtonRef.current?.focus();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modalRef.current) return;

      // Simple focus trap: Tab only within modal
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

  const agentCount = preset?.agents.length ?? 0;
  const issueCount = agentCount;
  const wakeupCount = agentCount;

  return (
    <>
      {/* Backdrop (D-09: bg-background/80 backdrop-blur-sm, NOT bg-black/50) */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={onCancel}
        role="presentation"
      />
      {/* Panel (D-09, D-10: unified modal chrome) */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div
          ref={modalRef}
          className="bg-card border border-border rounded-none shadow-lg max-w-md w-full mx-auto p-4 space-y-4 pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-modal-title"
        >
          {/* Header (D-11: text-base font-semibold) */}
          <h2 id="confirmation-modal-title" className="text-base font-semibold">
            Apply changes to Paperclip
          </h2>

          {/* Body text */}
          <div className="space-y-3 text-sm font-normal">
            <p>Apply will:</p>
            <ul className="ml-4 space-y-2 list-disc">
              <li className="font-normal">Write the company vision document</li>
              <li className="font-normal">Create {agentCount} agents</li>
              <li className="font-normal">File {issueCount} kickoff issues</li>
              <li className="font-normal">Queue wakeups to start the company heartbeating</li>
            </ul>

            <p className="text-foreground/70 text-sm font-normal">
              This is reversible only by manual cleanup in Paperclip.
            </p>

            {/* Write count */}
            <p className="text-xs font-medium">
              Write count: 1 document, {agentCount} agents, {issueCount} issues, {wakeupCount} wakeups
            </p>
          </div>

          {/* Provisioning summary */}
          <ProvisioningSummary preset={preset} />

          {/* Action buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <button
              onClick={onCancel}
              className="px-3 py-2 rounded-none border border-border text-foreground hover:bg-muted transition-colors font-normal text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              Cancel
            </button>
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              className="px-3 py-2 rounded-none bg-emerald-500 text-white hover:bg-emerald-600 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-emerald-600"
            >
              I confirm — apply changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
