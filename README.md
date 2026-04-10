<div align="center">
  <img src="https://raw.githubusercontent.com/MonsieurBarti/The-Forge-Flow-CC/refs/heads/main/assets/forge-banner.png" alt="The Forge Flow" width="100%">

  <h1>@the-forge-flow/fff-pi</h1>

  <p>
    <strong>Rust SIMD-powered file search for the PI coding agent</strong>
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

## What it does

PI extension that replaces built-in search with [fff](https://github.com/dmtrKovalenko/fff.nvim)'s Rust SIMD engine via [`@ff-labs/fff-node`](https://www.npmjs.com/package/@ff-labs/fff-node). Gives the LLM fuzzy file finding, fast content grep, and a unified smart search — all with frecency ranking, git-aware boosting, and typo tolerance.

**How it works:** The extension intercepts PI's built-in `glob` and `grep` tool calls and reroutes them through the fff engine. The LLM sees the same tools, gets better results. Three dedicated tools are also available for advanced use cases.

## Features

- `tff-fff_find` — fuzzy file search by name/path with frecency ranking
- `tff-fff_grep` — content search with smart case, regex support, and multi-pattern OR logic (Aho-Corasick)
- `tff-fff_search` — unified smart search that auto-detects whether to find files or search contents
- **Search interception** — transparently replaces PI's built-in `glob` and `grep` with fff-powered results
- **Frecency tracking** — learns from file access patterns across all tools (find, grep, read, write, edit)
- **Git-aware boosting** — modified/staged files ranked higher, refreshed lazily
- `/fff-status` — index health, frecency state, git integration info
- `/fff-reindex` — force rebuild of the file index

## Requirements

- Node.js >= 22.5.0
- PI (`pi` CLI) installed
- Platform with fff-node binary support (macOS arm64/x64, Linux x64/arm64, Windows x64/arm64)

## Installation

```bash
# From npm (recommended)
pi install npm:@the-forge-flow/fff-pi

# Project-local only
pi install -l npm:@the-forge-flow/fff-pi

# From GitHub (tracks main)
pi install git:github.com/MonsieurBarti/fff-pi

# Pin a version
pi install npm:@the-forge-flow/fff-pi@0.2.0
```

Then reload PI with `/reload` (or restart it).

## Usage

### Tools

| Tool | Description | Key parameters |
|---|---|---|
| `tff-fff_find` | Fuzzy file search by name/path | `query`, `maxResults` |
| `tff-fff_grep` | Content search with multi-pattern OR | `patterns[]`, `regex`, `caseSensitive`, `context` |
| `tff-fff_search` | Smart auto-detecting search | `query`, `maxResults` |

The agent can call these directly, or they're used transparently when PI's built-in `glob`/`grep` are invoked.

### Search auto-detection (`tff-fff_search`)

The unified search tool routes queries automatically:

- **File path signals** (contains `/`, file extension, glob chars) — routes to file find
- **Content signals** (regex metacharacters, whitespace, pipe) — routes to content grep
- **Ambiguous** (single word, no special chars) — runs both and merges results

### Commands

- `/fff-status` — shows index health, file count, frecency state, git integration
- `/fff-reindex` — forces a full index rebuild (frecency data is preserved)

### Frecency

The extension tracks which files you access and boosts them in future searches. Tracking happens across all tools — not just fff's own. Reading a file via `read`, writing via `write`, or finding it via `grep` all contribute to its frecency score.

Frecency data persists in `.pi/fff/frecency.db` (SQLite, managed by fff-node).

## Configuration

Optional config file at `.pi/fff/config.json`. All values have sensible defaults — the file is not required.

```json
{
  "search": {
    "defaultMaxResults": 20,
    "defaultContextLines": 2
  },
  "frecency": {
    "enabled": true
  },
  "git": {
    "refreshIntervalSeconds": 30
  }
}
```

| Field | Default | Description |
|---|---|---|
| `search.defaultMaxResults` | `20` | Default max results for find/search |
| `search.defaultContextLines` | `2` | Lines of context around grep matches |
| `frecency.enabled` | `true` | Enable/disable frecency tracking |
| `git.refreshIntervalSeconds` | `30` | How often to refresh git modified file list |

## Architecture

```
┌─────────────────────┐
│ PI host process      │
│ └─ loads extension   │
└─────────┬────────────┘
          │  session_start
          ▼
┌──────────────────────────────────────────────────────┐
│ fff-pi extension (in PI process)                     │
│                                                      │
│   FffService (singleton)                             │
│   ├─ FileFinder (fff-node FFI) ──→ Rust SIMD engine  │
│   ├─ frecency.db (SQLite)                            │
│   └─ history.db  (SQLite)                            │
│                                                      │
│   Tools: find / grep / search ──→ FffService         │
│   Hook: tool_call ──→ intercept glob/grep            │
│   Hook: tool_result ──→ track frecency               │
│   Hook: before_agent_start ──→ refresh git status    │
│   Commands: /fff-status, /fff-reindex                │
└──────────────────────────────────────────────────────┘
```

Key components in `src/`:

| File | Purpose |
|---|---|
| `src/index.ts` | Extension factory — lifecycle hooks, tool/command/hook registration |
| `src/services/fff-service.ts` | Core service wrapping `FileFinder` with lifecycle, find, grep, search |
| `src/services/config.ts` | Config loading from `.pi/fff/config.json` with deep merge |
| `src/tools/find.ts` | `tff-fff_find` tool definition |
| `src/tools/grep.ts` | `tff-fff_grep` tool definition |
| `src/tools/search.ts` | `tff-fff_search` tool definition |
| `src/hooks/intercept-search.ts` | `tool_call` hook replacing PI's glob/grep |
| `src/hooks/track-frecency.ts` | `tool_result` hook recording file access |
| `src/hooks/refresh-git.ts` | `before_agent_start` hook for git status refresh |
| `src/commands/status.ts` | `/fff-status` handler |
| `src/commands/reindex.ts` | `/fff-reindex` handler |
| `src/types.ts` | Domain types and default config |

## Development

```bash
bun install              # install deps
bun run test             # vitest once
bun run test:watch       # vitest watch mode
bun run test:coverage    # v8 coverage
bun run lint             # biome check
bun run lint:fix         # auto-fix
bun run build            # tsc → dist/
bun run typecheck        # type-only check
```

Pre-commit hooks (lefthook) run biome, typecheck, and tests in parallel.

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/) — enforced by commitlint.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit with conventional commits (`git commit -m "feat: add something"`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT
