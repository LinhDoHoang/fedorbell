# fedorbell

An [Antigravity (agy)](https://antigravity.google) plugin inspired by [prismantis](https://github.com/NahumLitvin/prismantis) for Claude Code.

> [!IMPORTANT]
> The original is a Claude Code *mod* that redraws the terminal renderer. Agy plugins hold only skills, agents, rules, hooks and MCP, so this port cannot repaint terminal output, colorize text, or add copy buttons. It shapes what the agent writes and renders charts through agy's inline HTML widgets.

## What you get

| Feature | How |
| --- | --- |
| Reply style | always-on rule: tables, mermaid, text figures, callouts, TL;DR |
| 13 themes | `themes.json`: a 6-color palette (used by charts) and status markers |
| Real charts | `fedorbell-chart` skill: bar, line, pie as themed SVG in an inline widget. Selecting text in the widget copies it; "Copy data" and "Copy as Markdown" buttons copy the clean numbers (no title, legend or markup) |
| Copy cards | `fedorbell-copy` skill: prompts, commands and code the agent suggests get a Copy button each, plus Copy all |
| Persistent settings | `~/.gemini/fedorbell/config.json`, written by the CLI |
| Session note | `SessionStart` hook injects theme and preferences, shows a one-line banner |
| Setup and demo | `fedorbell-setup`, `fedorbell-demo` skills |

Themes: `mono`, `catppuccin`, `dracula`, `nord`, `solarized`, `gruvbox`, `tokyo-night`, `one-dark`, `monokai`, `rose-pine`, `github-dark`, `everforest`, `kanagawa`.

Not possible in agy: slash commands registered by a plugin (say "fedorbell setup" instead of `/fedorbell setup`), colored terminal text, typeset LaTeX, copy buttons, quiet tool rows.

## Install

```powershell
agy plugin install <path-to-repo>\plugins\fedorbell
```

Or copy `plugins/fedorbell` into a workspace's `.agents/plugins/` or into `~/.gemini/config/plugins/`. Requires Node 18+ for the hook and CLI. Disable with `agy plugin disable fedorbell`.

## Use

Ask the agent: "run fedorbell setup", "use fedorbell theme nord", "fedorbell demo", or "chart these numbers". Or run the CLI directly:

```powershell
node plugins/fedorbell/scripts/fedorbell.mjs themes
node plugins/fedorbell/scripts/fedorbell.mjs theme dracula
node plugins/fedorbell/scripts/fedorbell.mjs set density compact
```

Options: `diagrams` (`mermaid`, `figure`, `both`), `density` (`compact`, `rich`), `diagramHints` (`true`, `false`; the hook's nudge toward pictures).

## Layout

```text
plugins/fedorbell/
├── plugin.json  hooks.json  themes.json
├── assets/logo.svg
├── rules/AGENTS.md
├── scripts/     lib.mjs  fedorbell.mjs  session-start.mjs
├── tests/       fedorbell.test.mjs
└── skills/      fedorbell  fedorbell-chart  fedorbell-copy  fedorbell-setup  fedorbell-demo
```

## Develop

```powershell
npm test            # unit tests, no dependencies
npm run validate    # agy plugin validate --strict
```

## License

MIT
