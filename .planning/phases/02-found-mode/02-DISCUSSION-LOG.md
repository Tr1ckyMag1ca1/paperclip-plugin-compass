# Phase 2: Found Mode - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-03
**Phase:** 02-found-mode
**Areas discussed:** Interview content format, VISION.md generation strategy, Apply transactionality, Mid-interview persistence + UX shape

Note: Areas 3 and 4 were auto-decided after founder switched to autonomous mode mid-discussion. Recommended option selected for each.

---

## Interview Content Format

### Q1: Where does interview content live?
| Option | Description | Selected |
|--------|-------------|----------|
| Markdown files | One .md per section in src/content/interview/. Aron edits in any text editor; parser walks at build. | ✓ |
| Typed TS export | src/content/interview-prompts.ts typed const. Strong types, less natural for prose. | |
| JSON schema | interview.json with Zod validation. Maximum portability, worst prose-editing UX. | |

### Q2: Question definition style?
| Option | Description | Selected |
|--------|-------------|----------|
| Frontmatter list of question objects | YAML frontmatter `questions:` array; body = section intro/context. | ✓ |
| Inline question blocks in body | `## Question:` headers in markdown body. Fragile parser. | |
| Separate questions.yaml + intro.md | Two-file split; doubles file count. | |

### Q3: Question types?
| Option | Description | Selected |
|--------|-------------|----------|
| Free-text (short + long) | Single-line + textarea. | ✓ |
| Single-choice | Radio/select. | ✓ |
| Multi-choice | Checkboxes. | ✓ |
| Conditional follow-up | `showIf` branching on prior answers. | ✓ |

### Q4: Bundling?
| Option | Description | Selected |
|--------|-------------|----------|
| esbuild text loader at build | Inlines markdown into bundle. Zero runtime FS reads. Fast startup. | ✓ |
| Plugin SDK asset API at runtime | Lazy fetch. Smaller bundle, async load complexity. | |
| Pre-compile to TS const at build | Build script emits typed `interview.generated.ts`. Extra build step. | |

---

## VISION.md Generation Strategy

### Q1: Generation approach?
| Option | Description | Selected |
|--------|-------------|----------|
| Pure deterministic template-fill | Handlebars-style template + answer slots. Zero LLM. Predictable, free, Aron-portable. | ✓ |
| Hybrid: template skeleton + LLM polish | Template assembles structure; LLM rewrites for voice. LLM dependency. | |
| Full LLM synthesis | Send answers + schema to LLM. Most flexible, least predictable. | |

### Q2: Template location?
| Option | Description | Selected |
|--------|-------------|----------|
| Single markdown template w/ {{slots}} | src/content/vision-template.md, renders 1:1. Aron sees full shape inline. | ✓ |
| Per-section markdown partials | src/content/vision-template/*.md. Composable, mental assembly cost. | |
| Typed TS template function | TS string literals. Strong types, painful prose editing. | |

### Q3: Derivation logic location?
| Option | Description | Selected |
|--------|-------------|----------|
| Pure functions in src/found/derive.ts | Typed `derive*(answers): string`. Easy unit tests per XC-08. | ✓ |
| Template logic (Handlebars helpers) | Embedded in template. Harder to test. | |
| No derivation — add interview questions | Force founder to answer everything explicitly. Longest interview. | |

### Q4: Quality Checklist enforcement?
| Option | Description | Selected |
|--------|-------------|----------|
| Hard-block on missing required slots; warn on weak | Apply disabled if mission/mandate/voice/principles/success_criteria empty. | ✓ |
| Hard-block on every checklist item | All 19 sections required. Strictest. | |
| Warn-only — founder can override | Maximum flexibility, weakest guardrail. Conflicts with FOUND-12. | |

---

## Apply Transactionality (auto-decided)

| Option | Description | Selected |
|--------|-------------|----------|
| Preflight-validate → sequential write → compensating-rollback | Preflight refs, sequential dependency-order write, reverse-order undo on failure. SDK lacks true cross-table TX. | ✓ |
| True wrapped DB transaction | Requires SDK to expose multi-table TX; not currently available. | |
| Best-effort write, no rollback | Simplest; violates XC-02 rollback requirement. | |

**Auto-decision rationale:** Plugin SDK does not expose cross-table transactions. Compensating-rollback is the only path that satisfies XC-02 ("rollback path exists if any write fails") within SDK constraints.

---

## Mid-Interview Persistence + UX Shape (auto-decided)

### Persistence
| Option | Description | Selected |
|--------|-------------|----------|
| Worker-state keyed by company_id | Matches Phase 1 D-09. Survives plugin reload. Cleared on Apply. | ✓ |
| Draft document in `documents` table | Survives plugin reinstall but introduces a non-VISION doc per company. | |
| Both | Belt-and-suspenders, more state to reconcile. | |

**Auto-decision rationale:** Worker-state survives plugin reload (covers FOUND-03). Promoting to a `documents` row mid-interview pollutes the document store with non-VISION drafts; deferred until shown necessary.

### UX shape
| Option | Description | Selected |
|--------|-------------|----------|
| Linear with full back-nav | Section-by-section, may jump back to revise. Section nav rail. Form-driven main panel. | ✓ |
| Strict linear forced-march | No back nav. Simplest state, frustrates founders. | |
| Free section navigation | Jump anywhere any time. Hardest to validate "complete". | |
| Chat-style turn-by-turn | Interview is dialogue in chat panel. Conflicts with M1 D-07 (chat panel = intent routing only). | |

**Auto-decision rationale:** Founders need to revise prior answers (vision-quest interviews surface contradictions); strict forward-only is too rigid. Free nav makes "section complete" tracking ambiguous. Chat-style conflicts with D-07 split. Linear-with-back-nav is the balance.

---

## Claude's Discretion

- React component file layout inside `src/ui/found/`
- Preset selection placement in interview flow (specifics suggests start; planner picks)
- Markdown editor library for inline VISION edit (textarea + preview pane acceptable v1)
- Audit trail schema for adapter writes
- Error rendering style for preflight + rollback failures
- Specific Handlebars-compatible template syntax library vs custom regex

## Deferred Ideas

(See CONTEXT.md `<deferred>` section.)
