## Table

| Plugin part | Purpose | Loaded |
| --- | --- | --- |
| rules | always-on reply style | at start |
| skills | theme, setup, demo | on demand |

## Flowchart

```mermaid
flowchart LR
  A[User prompt] --> B{Needs structure?}
  B -- yes --> C[Table / diagram]
  B -- no --> D[Plain answer]
```

## Sequence

```mermaid
sequenceDiagram
  User->>Agent: /fedorbell theme nord
  Agent-->>User: Theme set
```

## Figure

```text
before ──────▶ after
 plain         structured
```

## Callout

> [!NOTE]
> Callouts carry one caveat each.

## Math

$$ E = mc^2 $$
