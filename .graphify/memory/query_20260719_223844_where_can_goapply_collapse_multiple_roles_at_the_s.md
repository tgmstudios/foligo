---
type: "query"
date: "2026-07-19T22:38:44.544Z"
question: "Where can GoApply collapse multiple roles at the same company into one tracked job? Inspect ATS external ID extraction for /apply paths, canonical link/og:url/JSON-LD identifiers, findBestTrackedApplication weak URL behavior, server findTrackedJobByUrl, and SPA navigation state."
contributor: "graphify"
source_nodes: ["tracker.js", "agent-controller.js", "extension-agent-tools.js", "main.js"]
---

# Q: Where can GoApply collapse multiple roles at the same company into one tracked job? Inspect ATS external ID extraction for /apply paths, canonical link/og:url/JSON-LD identifiers, findBestTrackedApplication weak URL behavior, server findTrackedJobByUrl, and SPA navigation state.

## Answer

Two paths caused cross-role collisions: generic ATS path segments such as /apply were accepted as external job IDs, and AgentController chat mode retained the first non-null currentJobInfo across later pages. The repair prefers JSON-LD/canonical/og listing URLs, accepts only meaningful requisition IDs, marks shared application URLs weak, requires exact normalized company plus position to match a weak URL, mirrors those rules in executable server tools, and always replaces agent job context with the live page context. Same-company roles with different IDs or titles therefore remain separate.

## Source Nodes

- tracker.js
- agent-controller.js
- extension-agent-tools.js
- main.js