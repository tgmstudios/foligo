---
type: "query"
date: "2026-07-19T22:08:27.331Z"
question: "How can the side-panel Track action fall back to the existing extension AI AgentController to identify company and position from a weakly-detected job page, call track_current_job, stream progress, support Stop, and return the tracked job without duplicating an agent turn?"
contributor: "graphify"
source_nodes: ["side-panel.js", "main.js", "tracker.js", "agent-controller.js"]
---

# Q: How can the side-panel Track action fall back to the existing extension AI AgentController to identify company and position from a weakly-detected job page, call track_current_job, stream progress, support Stop, and return the tracked job without duplicating an agent turn?

## Answer

Keep the fast sp-track path for structured or known-board metadata. When main.js returns unavailable, side-panel.js starts one existing sp-chat AgentController turn with a constrained identification prompt, shows the normal reasoning/tool events, assigns agentOwnerTabId so Stop targets it, and waits for turn-complete before confirming the URL-matched board card. The keyed job-tracking chip prevents duplicate warnings. Deterministic Tracker extraction was also expanded for LinkedIn, Indeed, BrassRing, Ashby, SmartRecruiters, broader job URLs, and job-language signals.

## Source Nodes

- side-panel.js
- main.js
- tracker.js
- agent-controller.js