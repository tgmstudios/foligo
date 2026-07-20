---
type: "query"
date: "2026-07-19T20:09:36.421Z"
question: "How is the browser extension structured, where is its AI API system, and what components would be changed to reproduce features from a dumped Chrome extension?"
contributor: "graphify"
source_nodes: ["popup.js", "extension-agent.js", "AIManager", "GeminiService", "goapply-job-assistant.js"]
---

# Q: How is the browser extension structured, where is its AI API system, and what components would be changed to reproduce features from a dumped Chrome extension?

## Answer

The graph identifies extension/popup.js as the extension entry area and api/src/routes/ai/extension-agent.js plus AIManager/GeminiService as the server-side AI path. GoApply-specific routes include profile, saved answers, job applications, cover letters, and job assistant.

## Source Nodes

- popup.js
- extension-agent.js
- AIManager
- GeminiService
- goapply-job-assistant.js