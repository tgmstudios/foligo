---
type: "query"
date: "2026-07-19T22:31:55.335Z"
question: "Why would the exact Greenhouse URL testcanonical123/jobs/7772295 resolve to a random existing iCapital Foligo card even after identity reconciliation? Trace broad company selectors, getTrackedApplication candidate ranking, URL ownership, reconciliation guards, and duplicate/corrupt URL recovery."
contributor: "graphify"
source_nodes: ["tracker.js", "main.js", "side-panel.js"]
---

# Q: Why would the exact Greenhouse URL testcanonical123/jobs/7772295 resolve to a random existing iCapital Foligo card even after identity reconciliation? Trace broad company selectors, getTrackedApplication candidate ranking, URL ownership, reconciliation guards, and duplicate/corrupt URL recovery.

## Answer

The Foligo iCapital card already stored the exact Greenhouse URL, so URL/ATS identity correctly found that record. Reconciliation failed because the live page exposes og:title only as 'test job'; the employer is in document.title ('Job Application for test job at Test Board') and the logo alt ('Test Board Logo'), neither of which the Greenhouse extractor used. Company therefore remained blank and the side panel fell back to the stale card company. The fix parses the full Greenhouse document title and logo alt, after which verified live metadata reconciles the matched card to Test Board — test job while preserving status.

## Source Nodes

- tracker.js
- main.js
- side-panel.js