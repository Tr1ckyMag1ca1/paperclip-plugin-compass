import React from "react";

interface CardProps {
  variant?: "default" | "muted" | "elevated";
  padding?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

/**
 * Card — Foundational container primitive using host design tokens.
 *
 * Per D-01 and UI-SPEC.md Card Primitive section, renders:
 * - Variant control (default = bg-card, muted = bg-muted, elevated = shadow-sm)
 * - Padding control (sm = p-2, md = p-4, lg = p-6)
 * - Always sharp corners (rounded-none) per host design
 * - Host token colors: bg-card, bg-muted, border-border, text-foreground
 *
 * Children composition fully open — callers compose internal structure freely.
 * SectionHeader is the standardized pairing for card titles.
 *
 * @param variant Visual variant (default/muted/elevated)
 * @param padding Internal padding (sm/md/lg)
 * @param children Content to render inside card
 * @returns Card container element
 */
export function Card({
  variant = "default",
  padding = "md",
  children,
}: CardProps): React.ReactElement {
  const variantClass = {
    default: "bg-card border border-border",
    muted: "bg-muted border border-border",
    elevated: "bg-card border border-border shadow-sm",
  }[variant];

  const paddingClass = {
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
  }[padding];

  return (
    <div className={`rounded-none ${variantClass} ${paddingClass}`}>
      {children}
    </div>
  );
}
