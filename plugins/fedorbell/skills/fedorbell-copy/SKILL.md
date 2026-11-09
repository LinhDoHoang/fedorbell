---
name: fedorbell-copy
description: >-
  Use when a reply suggests a prompt, shell command, or code snippet that the
  user is expected to copy and run or paste elsewhere: renders copy cards with one
  button per item and a Copy all button as an inline HTML widget.
---

# fedorbell copy

Agent replies in the terminal have no copy buttons. This skill renders the items the user should copy into a small widget where each item has its own **Copy** button that copies the exact text, with no prompt prefix, no fences and no commentary.

## When to use

- The reply tells the user to run commands, paste a prompt into another tool, or apply a snippet.
- Do **not** use it for illustrative code, output samples, or explanations the user is not meant to paste.
- Keep the fenced block in the reply as well, so the answer still reads without the widget.

## Steps

1. Write a spec to a scratch file. `text` is copied verbatim; `label` and `lang` are display only:

   ```json
   { "title": "Next steps",
     "items": [
       { "label": "Install", "lang": "bash", "text": "npm install" },
       { "label": "Ask the agent", "text": "Add tests for the parser" }
     ] }
   ```

2. Render it into the artifact directory:

   `node <plugin-root>/scripts/fedorbell.mjs snippets <spec.json> <artifact-dir>/copy.html`

   `<plugin-root>` is two levels above this skill's directory. An optional 4th argument overrides the saved theme.
3. Embed it (the widget is compact; use a standalone artifact only for very long snippets):
   `<agent-embed src="file:///<artifact-dir>/copy.html"></agent-embed>`

Selecting text inside the widget also copies it. If the command prints `error:`, fix the spec. If Node is unavailable, rely on the fenced blocks.
