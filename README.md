# hunk

<p align="center">
  <a href="https://github.com/modem-dev/hunk/actions/workflows/ci.yml?branch=main"><img src="https://img.shields.io/github/actions/workflow/status/modem-dev/hunk/ci.yml?branch=main&style=for-the-badge&label=CI" alt="CI status"></a>
  <a href="https://github.com/modem-dev/hunk/releases"><img src="https://img.shields.io/github/v/release/modem-dev/hunk?style=for-the-badge" alt="Latest release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
</p>

Hunk is a desktop-inspired terminal diff viewer for reviewing agent-authored changesets.

## What Hunk is good at

- Review a whole changeset in one full-screen, multi-file stream.
- Switch between split, stack, and auto layouts without leaving the diff.
- Open working tree diffs, staged changes, commits, patches, or file pairs from one CLI.
- Show optional agent notes beside the hunks they explain.

## Install

```bash
npm i -g hunkdiff
```

Requirements:

- Node.js 18+
- Git for `hunk diff`, `hunk show`, `hunk stash show`, pager integration, and difftool workflows

## First run

In any Git repo:

```bash
hunk diff
```

Useful first keys:

- `↑` / `↓` line scroll
- `[` / `]` next and previous hunk
- `1` split, `2` stack, `0` auto layout
- `q` or `Esc` quit

## Next things to try

```bash
hunk diff --staged
hunk show HEAD~1
hunk diff before.ts after.ts
git diff --no-color | hunk patch -
hunk --version
```

## Feature comparison

| Capability | hunk | difftastic | delta | diff |
| --- | --- | --- | --- | --- |
| Dedicated interactive review UI | ✅ | ❌ | ❌ | ❌ |
| Multi-file review stream with navigation sidebar | ✅ | ❌ | ❌ | ❌ |
| Agent / AI rationale sidecar | ✅ | ❌ | ❌ | ❌ |
| Split diffs | ✅ | ✅ | ✅ | ✅ |
| Stacked diffs | ✅ | ✅ | ✅ | ✅ |
| Auto responsive layouts | ✅ | ❌ | ❌ | ❌ |
| Themes | ✅ | ❌ | ✅ | ❌ |
| Syntax highlighting | ✅ | ✅ | ✅ | ❌ |
| Syntax-aware / structural diffing | ❌ | ✅ | ❌ | ❌ |
| Mouse support inside the diff viewer | ✅ | ❌ | ❌ | ❌ |
| Runtime toggles for wrapping / line numbers / hunk metadata | ✅ | ❌ | ❌ | ❌ |
| Pager-compatible mode | ✅ | ✅ | ✅ | ✅ |

## Git integration

Use Hunk directly for full-screen review:

```bash
hunk diff
hunk diff --staged
hunk diff main...feature
hunk show
hunk stash show
```

Use Hunk as a Git pager for diff-like output:

```bash
git config --global core.pager 'hunk patch -'
```

Or scope it just to `diff` and `show`:

```bash
git config --global pager.diff 'hunk patch -'
git config --global pager.show 'hunk patch -'
```

Use Hunk as a Git difftool:

```bash
git config --global diff.tool hunk
git config --global difftool.hunk.cmd 'hunk difftool "$LOCAL" "$REMOTE" "$MERGED"'
```

## Examples

Want a quick demo from the repo itself? See [`examples/`](examples/README.md).

It includes:

- a tiny first-run TypeScript diff
- a realistic multi-file refactor review
- an agent-rationale walkthrough with `--agent-context`
- a pager-navigation tour for `↑`, `↓`, paging, and hunk jumps

## Advanced features

- `hunk patch [file|-]` opens patch files or patch stdin
- `hunk pager` opens Hunk for diff-like stdin and falls back to plain-text paging otherwise
- `hunk diff --agent-context <file>` loads inline agent rationale from a JSON sidecar
- `hunk mcp serve` runs the local MCP daemon for agent-to-diff communication
- Hunk reads config from `~/.config/hunk/config.toml` and `.hunk/config.toml`

Minimal config example:

```toml
theme = "midnight"
mode = "auto"
line_numbers = true
wrap_lines = false
agent_notes = false
```

## Performance notes

Hunk spends more startup time than plain diff output tools because it launches an interactive UI with syntax highlighting, navigation state, and optional agent context. In exchange, it is optimized for reviewing a full changeset instead of printing static diff text and exiting.

## Contributing

For source setup, tests, packaging checks, and repo architecture, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
