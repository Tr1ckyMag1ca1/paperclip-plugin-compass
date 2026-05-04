import React from "react";
import { Check } from "lucide-react";
import type { Document } from "../../types.js";

interface DocumentListProps {
  documents: Document[];
}

/**
 * DocumentList — Simple list of company documents with presence indicators.
 *
 * Per UI-SPEC.md, displays:
 * - VISION.md presence (Check icon + "found" or X icon + "not found")
 * - Other documents if any
 * - Empty state: "No key documents found..."
 *
 * In M1, this is read-only. M2+ will allow editing/viewing full documents.
 *
 * @param documents Array of company documents
 */
export function DocumentList({ documents }: DocumentListProps): React.ReactElement {
  // TODO: Future implementation should query for VISION.md via issues/documents API
  // For now, this is a placeholder that shows document list structure.

  return (
    <div className="space-y-4">
      {/* VISION.md status — typically shown even if not in documents array */}
      <div className="flex items-center gap-4">
        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">VISION.md</p>
          <p className="text-xs text-foreground/60">Company vision and strategic plan</p>
        </div>
      </div>

      {/* Additional documents */}
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center gap-4">
          <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {doc.title || doc.key}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
