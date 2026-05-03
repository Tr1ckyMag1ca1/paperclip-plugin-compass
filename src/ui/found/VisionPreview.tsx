import React, { useState, useCallback } from "react";
import { Edit2, AlertCircle } from "lucide-react";
import { ProvisioningSummary } from "./ProvisioningSummary.js";
import type { FilledVision, PresetDefinition } from "../../types/found.js";

interface VisionPreviewProps {
  vision: FilledVision;
  preset: PresetDefinition | null;
  onBack: () => void;
  onConfirm: () => void;
}

/**
 * Display rendered VISION.md with inline edit toggle.
 * Stage 1 of two-stage approval gate (FOUND-11).
 * Read-only by default; "Edit" toggle enables textarea for inline markdown editing.
 */
export function VisionPreview({
  vision,
  preset,
  onBack,
  onConfirm,
}: VisionPreviewProps): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const [editedBody, setEditedBody] = useState(vision.body);
  const [editError, setEditError] = useState<string | null>(null);

  const handleSaveEdit = useCallback(() => {
    // Validate no empty required slots in edited body
    const requiredSlots = ["{{mission}}", "{{mandate}}", "{{voice}}", "{{principles}}", "{{success_criteria}}"];
    const hasEmptySlots = requiredSlots.some(slot => editedBody.includes(slot));

    if (hasEmptySlots) {
      setEditError("Cannot save: required slots are still empty. Please fill in all required sections.");
      return;
    }

    setEditError(null);
    setEditing(false);
  }, [editedBody]);

  const handleToggleEdit = useCallback(() => {
    if (editing) {
      handleSaveEdit();
    } else {
      setEditing(true);
      setEditError(null);
    }
  }, [editing, handleSaveEdit]);

  return (
    <div className="flex flex-col gap-lg h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-md">
        <div className="flex-1">
          <h2 className="text-heading font-bold">
            Here's the company you're founding. Edit anything before you apply.
          </h2>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex gap-xs items-center px-md py-sm rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors shrink-0 font-normal text-body"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </button>
        )}
      </div>

      {/* VISION.md display/editor */}
      <div className="flex-1 overflow-y-auto border border-border rounded p-lg bg-background">
        {editing ? (
          <textarea
            value={editedBody}
            onChange={(e) => setEditedBody(e.target.value)}
            className="w-full h-full font-normal text-body p-0 border-0 resize-none focus:outline-none focus:ring-0"
          />
        ) : (
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-body">
            {vision.body}
          </div>
        )}
      </div>

      {/* Edit error display */}
      {editing && editError && (
        <div className="bg-destructive/10 border border-destructive rounded p-md flex gap-md">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-body text-destructive">{editError}</p>
        </div>
      )}

      {/* Provisioning summary */}
      <ProvisioningSummary preset={preset} />

      {/* Action buttons */}
      <div className="flex gap-md justify-between pt-lg border-t border-border">
        <button
          onClick={onBack}
          className="px-md py-sm rounded border border-border text-foreground hover:bg-card transition-colors font-normal text-body"
        >
          Back to interview
        </button>
        <div className="flex gap-md">
          {editing && (
            <button
              onClick={handleToggleEdit}
              className="px-md py-sm rounded bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-medium text-body"
            >
              Done editing
            </button>
          )}
          {!editing && (
            <button
              onClick={onConfirm}
              className="px-md py-sm rounded bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-medium text-body"
            >
              Confirm & apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
