import React, { useState, useCallback } from "react";
import { Send } from "lucide-react";
import { classifyChatInput } from "../../primitives/mode-detect.js";
import type { Mode } from "../../types.js";

interface ChatPanelProps {
  detectedMode: Mode;
}

/**
 * ChatPanel — Chat input shell for free-form text routing to modes.
 *
 * Per D-07 (chat input shell, no responses in M1) and MODE-04 (keyword classifier),
 * renders:
 * - Text input field with placeholder
 * - Send button
 * - On submit: routes text via classifyChatInput regex classifier
 *
 * **M1 Constraint:** No response generation in M1. Modes own response handling in M2-M5.
 *
 * Routes to mode via lightweight keyword classifier (no LLM, no API call).
 * Falls back to auto-detected mode if no keywords match.
 *
 * @param detectedMode Auto-detected company mode (fallback if no keywords match)
 */
export function ChatPanel({
  detectedMode,
}: ChatPanelProps): React.ReactElement {
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!input.trim()) return;

      setSubmitting(true);
      try {
        // Classify input via lightweight regex classifier
        const classifiedMode = classifyChatInput(input);
        const routeMode = classifiedMode || detectedMode;

        // M1: Log routing; modes handle responses in M2+
        console.log(
          `[Compass] Routed to ${routeMode} mode:`,
          input
        );

        // TODO: M2+ will implement actual response handling
        // For now, just clear input and show confirmation

        // Clear input field
        setInput("");

        // Optional: Show toast/feedback that message was routed
        // (parent component can add this later)
      } finally {
        setSubmitting(false);
      }
    },
    [input, detectedMode]
  );

  return (
    <div className="border-t bg-background px-lg py-md">
      <form onSubmit={handleSubmit} className="flex gap-sm">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., assess this company, help me revive..."
          disabled={submitting}
          className="flex-1 rounded border border-border bg-background px-md py-sm text-sm placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={submitting || !input.trim()}
          className="inline-flex items-center gap-xs rounded px-md py-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
