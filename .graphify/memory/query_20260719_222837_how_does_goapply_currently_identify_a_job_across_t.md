---
type: "query"
date: "2026-07-19T22:28:37.568Z"
question: "How does GoApply currently identify a job across Tracker.extractJobInfo, normalized URLs, getTrackedApplication, trackApplication, AI tool overrides, API job records, and side-panel display? Where can stale company/position metadata override the live page?"
contributor: "graphify"
source_nodes: ["tracker.js", "main.js", "side-panel.js", "extension-agent-tools.js", "goapply-job-applications.js"]
---

# Q: How does GoApply currently identify a job across Tracker.extractJobInfo, normalized URLs, getTrackedApplication, trackApplication, AI tool overrides, API job records, and side-panel display? Where can stale company/position metadata override the live page?

## Answer

The previous tracker used URL equality as the complete identity and the side panel fell back to stored company/position when live extraction was incomplete, allowing a stale card label to override the current job. The repair derives canonical ATS identities (board-scoped Greenhouse IDs and analogous IDs for LinkedIn, Indeed, Lever, Workday, Ashby, SmartRecruiters, iCIMS, and BrassRing), strips tracking parameters, rejects job-board vendor names as employers, ranks duplicate URL candidates with verified metadata, and reconciles a stale matched card to verified live company/position while preserving its status.

## Source Nodes

- tracker.js
- main.js
- side-panel.js
- extension-agent-tools.js
- goapply-job-applications.js