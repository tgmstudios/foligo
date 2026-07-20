---
type: "query"
date: "2026-07-19T21:44:12.427Z"
question: "Where should a side-panel resume selector, AI job tracking, and AI job status changes connect to the existing resume catalog, job routes, tracker, and extension agent tools?"
contributor: "graphify"
source_nodes: ["main.js", "tracker.js", "filler.js", "api.js", "extension-agent-tools.js", "extension-agent.js", "goapply-job-applications.js", "resume.js", "side-panel.js"]
---

# Q: Where should a side-panel resume selector, AI job tracking, and AI job status changes connect to the existing resume catalog, job routes, tracker, and extension agent tools?

## Answer

The resume selector connects side-panel.js/html to GoApplyAPI.getResumes and Filler selected document storage; the AI document tool observes userSelected so an explicit choice is authoritative. Job tracking and status changes connect extension-agent-tools schemas to AgentController tools, Tracker normalized-URL upsert logic, the main.js side-panel bridge, and existing /api/goapply/jobs routes.

## Source Nodes

- main.js
- tracker.js
- filler.js
- api.js
- extension-agent-tools.js
- extension-agent.js
- goapply-job-applications.js
- resume.js
- side-panel.js