---
type: "query"
date: "2026-07-19T21:23:13.767Z"
question: "Which extension and API files own browser agent tools, document selection, resume catalogs, session state, streaming, and page control?"
contributor: "graphify"
source_nodes: ["main.js", "extension-agent.js", "extension-agent-tools.js", "filler.js", "api.js", "background.js", "cdp.js", "side-panel.js", "resume.js", "manager.js"]
---

# Q: Which extension and API files own browser agent tools, document selection, resume catalogs, session state, streaming, and page control?

## Answer

Browser-agent ownership spans extension/core/agent-controller.js for the external tool loop, field/page refs, Foligo document catalog selection, and group-persisted model history; extension/core/filler.js and extension/core/api.js for explicit document lookup/compile/attachment; extension/background.js and extension/core/cdp.js for group-scoped tab dispatch, trusted input, screenshots, JavaScript, console/network capture, and scheduling; extension/side-panel.js for group-level stream, history, Stop, and New chat; api/src/services/extension/extension-agent-tools.js for tool schemas; and api/src/routes/ai/extension-agent.js for selection, batching, browser-agent, and safety instructions.

## Source Nodes

- main.js
- extension-agent.js
- extension-agent-tools.js
- filler.js
- api.js
- background.js
- cdp.js
- side-panel.js
- resume.js
- manager.js