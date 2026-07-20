---
type: "query"
date: "2026-07-19T20:59:42.058Z"
question: "How should the extension browser agent be rearchitected so side-panel sessions survive navigation, background owns tool execution, content scripts are replaceable page adapters, and asynchronous message channels do not close?"
contributor: "graphify"
source_nodes: ["main.js", "extension-agent.js", "extension-agent-tools.js", "filler.js", "manager.js"]
---

# Q: How should the extension browser agent be rearchitected so side-panel sessions survive navigation, background owns tool execution, content scripts are replaceable page adapters, and asynchronous message channels do not close?

## Answer

The graph surfaced the current extension main.js, agent-controller.js, filler.js, the extension-agent API route, and AI manager as the relevant boundary. The implemented repair changes long-running side-panel commands from navigation-fragile one-shot responses to immediate acceptance plus streamed progress/completion events, while retaining page adapters for live DOM operations and navigation snapshots for continuation.

## Source Nodes

- main.js
- extension-agent.js
- extension-agent-tools.js
- filler.js
- manager.js