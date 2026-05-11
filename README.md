# Compass — Paperclip Plugin

[![npm version](https://img.shields.io/npm/v/paperclip-plugin-compass)](https://www.npmjs.com/package/paperclip-plugin-compass)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Strategic consultant for AI company lifecycle — found, assess, revive, reposition.

Compass is a Paperclip plugin that acts as a strategic consultant for any Paperclip-hosted AI company at any lifecycle stage. It founds new companies, audits existing ones, revives stalled ones, and repositions mature ones — all from inside Paperclip's plugin sidebar with no separate Claude Code session, SSH, or shell scripting required.

**Co-maintained with [Aron Prins](https://github.com/aronprins)**. This plugin builds on strategic interview depth from [paperclip-vision](https://github.com/aronprins/paperclip-vision).

## Table of Contents

- [What is Compass?](#what-is-compass)
- [The Four Modes](#the-four-modes)
- [Quick Start](#quick-start)
- [How to Use Compass](#how-to-use-compass)
- [In-App Help](#in-app-help)
- [Installation](#installation)
- [Development](#development)
- [Contributing](#contributing)

---

## What is Compass?

Every AI-run company in Paperclip goes through a lifecycle: it gets founded, runs for a while, sometimes stalls, sometimes pivots. Compass meets a company wherever it is in that lifecycle and routes you to the right workflow.

Compass detects which **mode** your company is in (deterministic rules, no LLM tax for classification) and presents the matching consultant interface. You can always override the detected mode if you want to run a different workflow.

Every change Compass makes is written natively into Paperclip — VISION documents, agent briefings, issues, comments, scheduled wakeups. You never leave the sidebar.

## The Four Modes

| Mode | When | What it does |
|---|---|---|
| **Found** ✨ | No `VISION.md` exists yet | Walks you through the 6-section vision quest interview, generates `VISION.md`, provisions agents per the preset you choose, files kickoff issues, and queues the first wakeups. |
| **Assess** 🔍 | Healthy company with recent activity | Compares `VISION.md` against the last 30 days of agent activity, scores drift per section, proposes amendments. You approve, reject, or edit each one. |
| **Revive** ⚠️ | Company has stalled | Runs a stall classifier (single-agent failure / governance loop / dead agent / drift), groups blockers by root cause, queues unblocking actions for your approval. |
| **Reposition** ↻ | Healthy company, founder wants to pivot | Re-runs scoped vision quest on just the deltas you describe, produces an amendment diff, generates a cascade plan (which agents need rebriefing, which content needs rewriting). |

Compass picks one of these four modes for you on plugin open. The dropdown in the top-right lets you override.

## Quick Start

1. **Install** the plugin (see [Installation](#installation) below).
2. **Open a company** in Paperclip.
3. **Click "Compass"** in the sidebar.
4. **Read the welcome card** that appears on first visit — it explains the four modes inline. Dismiss when you're ready.
5. **Look at the mode banner** at the top: Compass shows which mode it picked and a one-line copy explaining why.
6. **Click the `?` icons** next to any heading to get inline help on what that section does.
7. **Drive the workflow** — every primary action button has a hover tooltip explaining what it does and what happens after.

That's it. The plugin walks you through.

## How to Use Compass

### First time on a brand-new company → Found mode

You'll see the **vision quest interview** — six sections covering Big Picture, Revenue & Customers, Growth & Marketing, Product Direction, CEO Autonomy, and Vision & Identity. Answer what you can, skip what you can't (questions are optional unless required for the agents you want to provision).

When you reach the end, Compass renders a **preview** of the VISION it'll write. Edit anything inline. When you click **Confirm & Apply**, you get one final confirmation modal — only after you confirm does Compass write `VISION.md`, provision agents, file kickoff issues, and queue the first wakeups.

### Coming back to a healthy company → Assess mode

Click **"Run a drift audit"** in the header. Compass loads the last 30 days of activity, compares each VISION section against actual work, and renders a **drift report**.

For each amendment Compass proposes, you can:
- **Accept** — flag for application
- **Reject** — mark and skip
- **Edit** — tweak the proposed text

Click **Apply N accepted amendments** when you're done. Approval-gated changes route to the configured approver (`founder` / `founder+ceo` / configurable per-company in plugin settings).

### Coming back to a quiet company → Revive mode

You'll see a **stall summary** at the top: how many days no activity, how many open blockers. Click **"Find what's blocking this company"**. Compass runs the stall classifier and renders an **action queue** grouped by root cause.

For each action, dismiss it if it doesn't apply. When you've triaged the queue, click **Review and apply** to queue the surviving actions.

### Pivoting strategy → Reposition mode

Override the dropdown to **"Pivot strategy"**. Describe the strategic shift in plain English ("we're moving from B2C to B2B" / "we're dropping the freemium tier" / etc).

Compass infers which VISION sections the shift touches and re-asks only those questions. You get an **amendment diff** plus a **cascade plan** showing which agents need rebriefing and which content needs rewriting. Approve each amendment individually before anything is written.

## In-App Help

Compass ships with progressive-disclosure help everywhere:

- **`?` icons** next to every section heading — click for plain-English explanation, with a "Learn more" expander for technical detail
- **Hover tooltips** on every primary action button — explains what the action does and what happens after
- **Per-option tooltips** on the mode dropdown — hover any option to see what it does
- **First-run welcome card** — explains the four modes inline; dismissible per company
- **"Why?" link** next to the mode dropdown — explains how detection works

If you're stuck, the inline help is designed to answer your question without leaving the sidebar.

## Installation

### npm Registry (recommended)

Install the scoped package from npm:

```bash
npm install paperclip-plugin-compass
```

Or install via the Paperclip plugin manager UI:
1. Open your Paperclip instance
2. Go to **Administration > Plugins > Marketplace**
3. Search for **Compass**
4. Click **Install**

### Local Development

Clone the repo and install from a local path:

```bash
git clone https://github.com/Tr1ckyMag1ca1/paperclip-plugin-compass.git
cd paperclip-plugin-compass
paperclip plugins add file:///path/to/paperclip-plugin-compass
```

## Development

```bash
pnpm install      # install deps
pnpm dev          # watch-mode rebuild
pnpm test         # vitest watch
pnpm test:run     # vitest run once
pnpm typecheck    # tsc --noEmit
pnpm build        # esbuild → dist/
```

The Paperclip host auto-restarts the plugin worker on bundle changes (no manual reload required).

## Credits

- **Strategic Interview Depth:** [paperclip-vision](https://github.com/aronprins/paperclip-vision) by Aron Prins
- **Plugin Chassis:** [paperclip-plugin-company-wizard](https://github.com/yesterday-ai/paperclip-plugin-company-wizard) by Yesterday AI
- **Co-Maintainer:** [Aron Prins](https://github.com/aronprins)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for local dev setup, testing, and PR conventions. See [DECISIONS.md](./DECISIONS.md) for major design decisions.

## License

MIT — See [LICENSE](./LICENSE) for details.

## Questions?

Open an issue or ping the maintainers listed in [CODEOWNERS](./CODEOWNERS).
