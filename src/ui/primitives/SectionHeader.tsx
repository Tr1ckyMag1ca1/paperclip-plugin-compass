import React from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
}

/**
 * SectionHeader — Foundational section heading primitive with optional icon and actions.
 *
 * Per D-03 and UI-SPEC.md SectionHeader Primitive section, renders:
 * - Title (required): text-base font-semibold text-foreground
 * - Subtitle (optional): text-sm text-muted-foreground
 * - Icon (optional, lucide): h-4 w-4 text-muted-foreground, left-aligned
 * - Actions (optional): right-aligned container for buttons/controls
 *
 * Layout: Icon (left) + Title + Subtitle (stacked), Actions (right)
 *
 * No padding on container — parent supplies spacing via D-03 design decision.
 * Compatible with Card primitive for compound layouts.
 *
 * @param title Required heading text
 * @param subtitle Optional secondary text below title
 * @param icon Optional lucide icon component (e.g., Settings)
 * @param actions Optional right-aligned action nodes
 * @returns Section header element
 */
export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
}: SectionHeaderProps): React.ReactElement {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 flex-1">
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        )}
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
