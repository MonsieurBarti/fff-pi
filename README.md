<div align="center">
  <img src="https://raw.githubusercontent.com/MonsieurBarti/The-Forge-Flow-CC/refs/heads/main/assets/forge-banner.png" alt="The Forge Flow - fff Extension" width="100%">

  <h1>fff Extension</h1>

  <p>
    <strong>PI extension for fff</strong>
  </p>

  <p>
    <a href="https://github.com/MonsieurBarti/fff-pi/actions/workflows/ci.yml">
      <img src="https://img.shields.io/github/actions/workflow/status/MonsieurBarti/fff-pi/ci.yml?label=CI&style=flat-square" alt="CI Status">
    </a>
    <a href="https://www.npmjs.com/package/@the-forge-flow/fff-pi">
      <img src="https://img.shields.io/npm/v/@the-forge-flow/fff-pi?style=flat-square" alt="npm version">
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/github/license/MonsieurBarti/fff-pi?style=flat-square" alt="License">
    </a>
  </p>
</div>

---

## Requirements

- Node.js >= 22.5.0
- PI (`pi` CLI) installed

## Installation

```bash
# Global (all projects)
pi install npm:@the-forge-flow/fff-pi

# Project-local
pi install -l npm:@the-forge-flow/fff-pi

# From GitHub (tracks main)
pi install git:github.com/MonsieurBarti/fff-pi

# Pin a version
pi install npm:@the-forge-flow/fff-pi@0.1.0
```

Then reload PI with `/reload` (or restart it).

## Development

```bash
bun install
bun run test        # vitest
bun run lint        # biome check
bun run typecheck   # tsc --noEmit
bun run build       # tsc
```

## Project structure

```
src/
├── index.ts          # Extension entry point & PI wire-up
├── types.ts          # Domain types
├── tools/            # tff-fff_* tools + types + index
└── commands/         # Slash commands + types + index
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit with conventional commits (`git commit -m "feat: add something"`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT
