---
name: fedorbell-chart
description: >-
  Use when the user wants a chart, graph, or plot, or when a reply compares 3 or
  more numbers: renders a themed bar, line, or pie chart as an inline HTML widget.
---

# fedorbell chart

Renders a self-contained SVG chart in the user's fedorbell theme. It follows the `generative_ui` skill: an HTML artifact, optionally embedded inline.

## Steps

1. Write a spec to a scratch file:

   ```json
   { "type": "bar", "title": "Latency (ms)", "labels": ["p50", "p95", "p99"],
     "series": [{ "name": "v1", "values": [12, 40, 90] }, { "name": "v2", "values": [9, 25, 60] }] }
   ```

   - `type`: `bar`, `line`, or `pie` (pie uses only the first series, values >= 0).
   - Every series needs exactly one numeric value per label.
2. Render it into the artifact directory:

   `node <plugin-root>/scripts/fedorbell.mjs chart <spec.json> <artifact-dir>/chart.html`

   An optional 4th argument overrides the saved theme. `<plugin-root>` is two levels above this skill's directory.
3. Make the file a user-facing artifact (`UserFacing: true`) and, since it is compact, embed it:
   `<agent-embed src="file:///<artifact-dir>/chart.html"></agent-embed>`
4. Add one sentence stating what the chart shows.

If the command prints `error:`, fix the spec; do not hand-write the SVG. Fall back to a Markdown table if Node is unavailable.
