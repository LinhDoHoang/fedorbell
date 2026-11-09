---
name: fedorbell-setup
description: >-
  Use when the user runs `/fedorbell setup` or asks to pick, preview, or
  configure a fedorbell theme and reply styles.
---

# fedorbell setup

Walk the user through the steps one at a time with `ask_question`. The CLI is `scripts/fedorbell.mjs` in the plugin root (two levels above this directory); run it with `node`.

1. **Theme**: run `node <cli> themes`. Show a sample for a few candidates (a 3-row table with their ok/warn/error markers, plus a chart from `fedorbell-chart` if the user wants to see colors), then ask which theme to use. Save with `node <cli> theme <name>`.
2. **Diagrams**: ask mermaid, figure, or both. Save with `node <cli> set diagrams <value>`.
3. **Density**: ask `compact` or `rich`. Save with `node <cli> set density <value>`.
4. **Hints**: ask whether to keep the session hint that nudges the agent toward pictures (`diagramHints`, default true). Save with `node <cli> set diagramHints <true|false>`.
5. Run `node <cli> show`, confirm the result in one line, and say it is saved for future sessions and applied now.
