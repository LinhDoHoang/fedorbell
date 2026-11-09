---
name: fedorbell
description: >-
  Use when writing a reply that benefits from structure (comparisons, flows,
  architectures, timelines, before/after, math), or when the user asks to list,
  show, or change the fedorbell theme or its options (`/fedorbell theme <name>`,
  "use theme nord", "list themes", "show fedorbell config").
---

# fedorbell

Agy cannot redraw its terminal renderer, so fedorbell works at the source: a SessionStart hook injects the saved theme and preferences, and this skill picks the right format.

## Choosing the format

| Content | Use |
| --- | --- |
| Compare options or list attributes | Markdown table |
| Process, request flow, architecture | `flowchart` / `sequenceDiagram` |
| Lifecycle, status transitions | `stateDiagram-v2` |
| Schema or relationships | `erDiagram` / `classDiagram` |
| Numbers with 3+ points | `fedorbell-chart` skill (real bar, line, pie chart) |
| Prompts, commands, code the user should copy | `fedorbell-copy` skill (copy cards) |
| Timeline, layout, before/after | text figure in a ` ```text ` block, under 80 columns |
| Formula | `$$ ... $$` |
| Caveat or risk | one GitHub alert |

Respect the saved preferences: `diagrams` (mermaid, figure, both) and `density` (`compact` = tables and TL;DR only; `rich` = pictures whenever useful). Use the theme's markers (ok, warn, error, info, bullet) in status cells and figures.

## Commands

The CLI is `scripts/fedorbell.mjs` in the plugin root, two levels above this skill's directory. Resolve it to an absolute path and run it with `node`.

| User asks | Run |
| --- | --- |
| list themes | `node <cli> themes` |
| change theme | `node <cli> theme <name>` |
| show config | `node <cli> show` |
| change an option | `node <cli> set <diagrams\|density\|diagramHints> <value>` |

The theme is saved in `~/.gemini/fedorbell/config.json` and applies from the next session. Apply it to the current session right away from the command output. If a name is unknown, the CLI lists the valid names. Never change facts, only presentation.
