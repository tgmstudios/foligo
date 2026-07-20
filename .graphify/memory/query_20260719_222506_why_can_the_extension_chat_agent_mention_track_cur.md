---
type: "query"
date: "2026-07-19T22:25:06.239Z"
question: "Why can the extension chat agent mention track_current_job and update_job_status in its prompt but report those tools are unavailable? Trace CLIENT_AGENT_TOOL_DEFS through extension-agent route tool selection, request mode, browser tool declarations, and AgentController event execution."
contributor: "graphify"
source_nodes: ["extension-agent.js", "extension-agent-tools.js", "agent-controller.js", "main.js", "side-panel.js", "tracker.js"]
---

# Q: Why can the extension chat agent mention track_current_job and update_job_status in its prompt but report those tools are unavailable? Trace CLIENT_AGENT_TOOL_DEFS through extension-agent route tool selection, request mode, browser tool declarations, and AgentController event execution.

## Answer

The route did merge schema-only client tracking declarations into every mode, but they depended on the provider emitting an external client tool call. The observed provider instead used the executable pull_page tool and then claimed the schema-only tracking tools were absent. The repair adds executable server implementations for track_current_job, list_tracked_jobs, and update_job_status and spreads them after CLIENT_AGENT_TOOL_DEFS so they override the schema-only versions. Existing URL-matched jobs now update deterministically without AI fallback, and fallback success requires the requested status to match.

## Source Nodes

- extension-agent.js
- extension-agent-tools.js
- agent-controller.js
- main.js
- side-panel.js
- tracker.js