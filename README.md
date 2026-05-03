# Compass — Paperclip Plugin

Strategic consultant for AI company lifecycle — diagnose, found, revive, reposition

Compass is a Paperclip plugin that acts as a strategic consultant for any Paperclip-hosted AI company at any lifecycle stage. It founds new companies, audits existing ones, revives stalled ones, and repositions mature ones — all from inside Paperclip's plugin sidebar with no separate Claude Code session, SSH, or shell scripting required.

## Credits

Built with the strategic interview depth from [aronprins/paperclip-vision](https://github.com/aronprins/paperclip-vision).

Plugin chassis adapted from [yesterday-ai/paperclip-plugin-company-wizard](https://github.com/yesterday-ai/paperclip-plugin-company-wizard).

## Installation

### npm Registry

```bash
npm install paperclip-plugin-compass
```

Then register in your Paperclip instance:

```bash
paperclip plugins add paperclip-plugin-compass
```

### Paperclip Plugin Manager

Use the Paperclip plugin manager UI to install from the registry.

### Local Development

Clone the repository and install from a local path:

```bash
paperclip plugins add file:///path/to/paperclip-plugin-compass
```

## Development

Install dependencies:

```bash
pnpm install
```

Start watch-mode rebuild:

```bash
pnpm dev
```

The Paperclip host will auto-restart the plugin worker on bundle changes (no manual reload required).

Run tests:

```bash
pnpm test
```

Type-check:

```bash
pnpm typecheck
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for local dev setup, testing, and PR conventions.

## License

MIT — See [LICENSE](./LICENSE) for details.

## Questions?

Open an issue or contact the maintainers in [CODEOWNERS](./CODEOWNERS).
