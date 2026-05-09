# Phase 8: Assess + Found Panels - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-09
**Phase:** 8-assess-found-panels
**Areas discussed:** Drift severity color map, AmendmentDiff styling, Approval modal chrome, Vision-quest interview layout

---

## Drift severity color map (UIA-02)

### Q1: Color palette for low/medium/high

| Option | Description | Selected |
|--------|-------------|----------|
| Tonal semantic | low=text-muted-foreground (no bg), medium=text-yellow-600 bg-yellow-500/10, high=text-red-600 bg-red-500/10 | ✓ |
| Badge-style filled | Each severity gets full filled badge with stronger visual weight | |
| Text-only (no bg) | Color text only, no backgrounds — lightest visual | |

**User's choice:** Tonal semantic.
**Notes:** Aligns with Phase 7 D-04 semantic palette; bg tint draws eye for medium/high without overwhelming.

### Q2: Map shape

| Option | Description | Selected |
|--------|-------------|----------|
| Per-component const | Static `Record<Severity, string>` at top of DriftItemCard.tsx with full class strings | ✓ |
| Shared util | Export from src/ui/assess/severity.ts for reuse | |
| Inline switch | switch(severity) at JSX site, no top-level const | |

**User's choice:** Per-component const.
**Notes:** Existing pattern in DriftItemCard already; defer shared util until duplicated.

### Q3: Other dynamic colors in DriftReportPanel

| Option | Description | Selected |
|--------|-------------|----------|
| Just severity | Only severity needs map; other dynamic colors handled per-component | |
| Mode color too | Map mode→color via shared util to match ModeBanner | |
| You decide | Researcher/planner figures out scope from grep | ✓ |

**User's choice:** You decide.
**Notes:** Captured as Claude's discretion; researcher resolves during plan-phase.

---

## AmendmentDiff styling (UIA-04)

### Q1: Visual treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Text + subtle bg tint | + text-emerald-600 bg-emerald-500/10, − text-red-600 bg-red-500/10 | ✓ |
| Text-only | Color text only, no backgrounds | |
| GitHub-style bold tint | bg-emerald-500/15 / bg-red-500/15 with text-foreground | |

**User's choice:** Text + subtle bg tint.

### Q2: Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Keep collapsible | <details>/<summary> reveal-on-click; migrate broken tokens | ✓ |
| Always-expanded | Drop <details>; diff always inline | |
| Card-wrapped collapsible | Wrap in Phase 7 Card primitive with SectionHeader | |

**User's choice:** Keep collapsible.

### Q3: EvidenceChip + ConfidenceBar treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse StatusBadge for chip, custom bar | EvidenceChip = StatusBadge variant; ConfidenceBar = bg-muted track + threshold-driven fill | ✓ |
| Custom both | Fresh design for chip + bar | |
| You decide | Researcher/planner picks | |

**User's choice:** Reuse StatusBadge for chip, custom bar.

---

## Approval modal chrome (UIA-05)

### Q1: Corners + backdrop

| Option | Description | Selected |
|--------|-------------|----------|
| Sharp corners + dim/blur backdrop | bg-card border-border rounded-none shadow-lg + bg-background/80 backdrop-blur-sm | ✓ |
| Sharp corners + plain dim | Same panel, bg-foreground/40 backdrop, no blur | |
| You decide | Pick from host index.css if researcher finds convention | |

**User's choice:** Sharp corners + dim/blur backdrop.
**Notes:** Matches host shadcn Dialog look; respects Phase 7 D-09 sharp-corner lock.

### Q2: Component shape

| Option | Description | Selected |
|--------|-------------|----------|
| Migrate in place | Update each modal individually; no new primitive in v1.1 | ✓ |
| Extract Modal primitive | New src/ui/primitives/Modal.tsx with overlay+panel+close | |
| Migrate + extract if 3+ duplicates emerge | Defer the decision to plan-phase | |

**User's choice:** Migrate in place.
**Notes:** Phase 7 deferred slot-based primitives for the same reason; revisit in v1.2.

---

## Vision-quest interview layout (UIFM-02, UIFM-03)

### Q1: Section nav layout

| Option | Description | Selected |
|--------|-------------|----------|
| Keep horizontal tab strip | Migrate broken tokens; preserve overflow-x-auto scroll | ✓ |
| Vertical sidebar rail | Move to left vertical column | |
| Breadcrumb strip | Linear "Section N of M" with prev/next | |

**User's choice:** Keep horizontal tab strip.

### Q2: Active section visual

| Option | Description | Selected |
|--------|-------------|----------|
| Neutral bold | bg-foreground text-background; emerald reserved for completed | ✓ |
| Sidebar-accent | bg-sidebar-accent text-sidebar-accent-foreground | |
| Keep emerald accent | bg-emerald-500 text-white | |

**User's choice:** Neutral bold.
**Notes:** Avoids emerald collision with Phase 7 D-04 (Found-mode signal) and CheckCircle completed indicator.

### Q3: VisionPreview + ApplyProgress treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Card-wrapped sections | Heavy reuse of Phase 7 Card + SectionHeader primitives | ✓ |
| Inline plain | No Card wrapper; plain divs with border-border | |
| You decide | Planner picks per component | |

**User's choice:** Card-wrapped sections.

---

## Claude's Discretion

- DriftReportPanel mode-color util — researcher/planner determines scope from grep.
- `cn()` / `clsx` helper extraction — only if conditional class composition multiplies.
- ConfidenceBar threshold cutoffs (e.g., >0.75 emerald, 0.4–0.75 yellow, <0.4 red) — pick reasonable defaults; founder reviews via DualRenderProbe.
- Exact dark-mode contrast verification — leans on Phase 7 OKLCH probe baseline.

## Deferred Ideas

- Modal primitive extraction → v1.2.
- Shared severity.ts / mode-color.ts util — defer until two+ consumers.
- Side-by-side AmendmentDiff layout — keep unified.
- Vertical sidebar variant of SectionNavRail — keep horizontal.
- Screenshot-diff infra (Percy / Chromatic) — v1.2 (already in REQUIREMENTS.md).
- ConfidenceBar threshold tuning UI / per-mode override — out of v1.1 scope.
