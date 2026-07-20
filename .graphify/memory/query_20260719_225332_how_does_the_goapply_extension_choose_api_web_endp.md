---
type: "query"
date: "2026-07-19T22:53:32.033Z"
question: "How does the GoApply extension choose API/web endpoints, build extension-agent requests, and connect to /api/ai/extension-agent/turn? Where can an outdated backend serve an old system prompt/tool catalog, and how can the client detect required capabilities before starting a turn?"
contributor: "graphify"
source_nodes: ["extension/core/api.js", "api/src/routes/ai/extension-agent.js", "api/src/services/extension/extension-agent-tools.js", "extension/options.js"]
---

# Q: How does the GoApply extension choose API/web endpoints, build extension-agent requests, and connect to /api/ai/extension-agent/turn? Where can an outdated backend serve an old system prompt/tool catalog, and how can the client detect required capabilities before starting a turn?

## Answer

The extension selects production/local/custom endpoints from chrome.storage in extension/core/api.js. buildAgentRequest previously posted blindly to the selected /api/ai/agent/turn endpoint, allowing a new UI to talk to an old deployed agent prompt and truncated tool catalog. The fix adds an authenticated /api/ai/agent/capabilities handshake, advertises the current Foligo browser-agent identity, protocol version, client/server tool catalog and feature set, and makes buildAgentRequest verify protocol 2 plus critical browser, document, and tracking tools before opening a stream. Settings now exposes protocol/tool status and endpoint changes invalidate the capability cache.

## Source Nodes

- extension/core/api.js
- api/src/routes/ai/extension-agent.js
- api/src/services/extension/extension-agent-tools.js
- extension/options.js