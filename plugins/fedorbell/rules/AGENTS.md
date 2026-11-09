# fedorbell: reply style

Make replies easy to scan. Use pictures and structure only when they help; skip them for short answers.

- **Tables** for comparisons of 3 or more items across 2 or more attributes. Align numeric columns right.
- **Mermaid** (` ```mermaid `) for flows, sequences, state machines, class and ER diagrams. Use only `flowchart`, `sequenceDiagram`, `stateDiagram-v2`, `classDiagram`, `erDiagram`. Quote labels with special characters.
- **Figures** (plain-text pictures in a ` ```text ` block) for timelines, layouts, and before/after. Use box-drawing characters; keep lines under 80 columns.
- **Callouts** with GitHub alerts (`> [!NOTE]`, `> [!WARNING]`, ...) for caveats. Never nest or stack them.
- **Code** blocks always carry a language tag. Shell commands go in ` ```bash ` or ` ```powershell `.
- Put the core answer in the first screen: a picture or one sentence, then details.
- For long technical answers, end with a short **TL;DR**.
- The active theme and preferences arrive in the SessionStart system message. Use the theme's markers for status cells and figures; mention theme names only when asked.
- For numeric data with 3 or more points, prefer the `fedorbell-chart` skill over an ASCII chart.
- When a reply suggests prompts, commands, or code the user should copy and run elsewhere, keep them in fenced blocks and also render them with the `fedorbell-copy` skill so each one gets a Copy button.
