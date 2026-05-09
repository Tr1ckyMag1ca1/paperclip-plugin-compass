import React, { useState, useCallback } from "react";
import { Edit2, AlertCircle } from "lucide-react";
import { Card } from "../primitives/Card.js";
import { SectionHeader } from "../primitives/SectionHeader.js";
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
 * Per D-14: Uses Card variant=muted + SectionHeader primitive.
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
    <div className="flex flex-col gap-3 h-full">
      {/* Header section using Card + SectionHeader */}
      <Card variant="muted" padding="md">
        <SectionHeader
          title="Here's the company you're founding. Edit anything before you apply."
          actions={
            !editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex gap-1 items-center px-3 py-2 rounded-none bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors shrink-0 font-normal text-sm"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </button>
            )
          }
        />
      </Card>

      {/* VISION.md display/editor in card */}
      <Card variant="default" padding="md">
        <div className="flex-1 overflow-y-auto">
          {editing ? (
            <textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              className="w-full h-80 font-normal text-sm p-0 border-0 resize-none focus:outline-none focus:ring-0"
            />
          ) : (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">
              {vision.body}
            </div>
          )}
        </div>
      </Card>

      {/* Edit error display */}
      {editing && editError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-none p-3 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{editError}</p>
        </div>
      )}

      {/* Provisioning summary */}
      <ProvisioningSummary preset={preset} />

      {/* Action buttons */}
      <div className="flex gap-3 justify-between pt-3 border-t border-border">
        <button
          onClick={onBack}
          className="px-3 py-2 rounded-none border border-border text-foreground hover:bg-muted transition-colors font-normal text-sm"
        >
          Back to interview
        </button>
        <div className="flex gap-3">
          {editing && (
            <button
              onClick={handleToggleEdit}
              className="px-3 py-2 rounded-none bg-emerald-500 text-white hover:bg-emerald-600 transition-colors font-medium text-sm"
            >
              Done editing
            </button>
          )}
          {!editing && (
            <button
              onClick={onConfirm}
              className="px-3 py-2 rounded-none bg-emerald-500 text-white hover:bg-emerald-600 transition-colors font-medium text-sm"
            >
              Confirm & apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
