---
type: "query"
date: "2026-07-19T21:50:25.564Z"
question: "Why does the GoApply side panel repeatedly show 'A company and job title could not be detected on this page', and which passive refresh, track button, content-script message, or tab-change paths can invoke trackCurrentJob?"
contributor: "graphify"
source_nodes: ["main.js", "tracker.js", "side-panel.js"]
---

# Q: Why does the GoApply side panel repeatedly show 'A company and job title could not be detected on this page', and which passive refresh, track button, content-script message, or tab-change paths can invoke trackCurrentJob?

## Answer

Only the two Track controls invoke runTrack, which sends sp-track to main.js trackCurrentJob. Passive refresh sends sp-get-job-tracking and does not invoke tracking. The warning repeated because every click appended a new unkeyed status chip, while trackCurrentJob used currentJobInfo captured only during extension activation and could remain null or stale. The fix refreshes Tracker.extractJobInfo at action/query time, recognizes nested JSON-LD JobPosting data, disables tracking on non-job pages, and replaces the prior tracking status chip instead of stacking duplicates.

## Source Nodes

- main.js
- tracker.js
- side-panel.js