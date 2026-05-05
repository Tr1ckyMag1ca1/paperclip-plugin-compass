import React, { useEffect, useId, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";

interface HelpTipProps {
  /** Short headline shown at top of popover. Plain English, no jargon. */
  title: string;
  /** Body copy. Can be multi-line. Plain English. */
  body: string;
  /** Optional advanced/technical detail revealed via "Learn more" expander. */
  details?: string;
  /** Optional external link (e.g. docs page). */
  learnMoreHref?: string;
  /** Visible label for the trigger. If omitted, renders the help icon only. */
  label?: string;
  /** Additional className for the trigger element. */
  className?: string;
  /** Trigger size. Defaults to "sm". */
  size?: "xs" | "sm" | "md";
}

/**
 * HelpTip — progressive-disclosure help affordance.
 *
 * Click (or focus + Enter) on the trigger reveals a popover with:
 *   - Plain-English title + body (always shown)
 *   - Optional "Learn more" expander for technical detail
 *   - Optional external link
 *
 * Closes on outside-click, Escape, or trigger re-click.
 * Accessible: button trigger, aria-expanded/aria-controls, focus-visible ring.
 */
export function HelpTip({
  title,
  body,
  details,
  learnMoreHref,
  label,
  className = "",
  size = "sm",
}: HelpTipProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setExpanded(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const iconSize = size === "xs" ? "h-3 w-3" : size === "md" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={popoverId}
        aria-label={label ? undefined : `Help: ${title}`}
        className="inline-flex items-center gap-1 text-foreground/60 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-none"
      >
        {label ? <span className="text-xs underline-offset-2 hover:underline">{label}</span> : null}
        <HelpCircle className={iconSize} aria-hidden="true" />
      </button>

      {open ? (
        <div
          id={popoverId}
          role="dialog"
          aria-labelledby={`${popoverId}-title`}
          className="absolute left-0 top-full mt-2 z-50 w-80 max-w-[calc(100vw-2rem)] bg-popover text-popover-foreground border border-border shadow-lg p-4 text-left"
        >
          <h4 id={`${popoverId}-title`} className="text-sm font-semibold mb-2 text-foreground">
            {title}
          </h4>
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{body}</p>

          {details ? (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-xs text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-expanded={expanded}
              >
                {expanded ? "Hide details" : "Learn more"}
              </button>
              {expanded ? (
                <p className="mt-2 text-xs text-foreground/70 leading-relaxed whitespace-pre-line">
                  {details}
                </p>
              ) : null}
            </div>
          ) : null}

          {learnMoreHref ? (
            <a
              href={learnMoreHref}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-3 inline-block text-xs text-accent hover:underline"
            >
              Open documentation →
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
