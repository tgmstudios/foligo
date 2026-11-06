# Writing voice onboarding and post rewrites

This is a research-informed preference elicitation flow, not a psychometric test, authorship classifier, or proven imitation of a person's writing. The exact questionnaire and its duration have not been validated with users. Do not present preference counts as confidence scores.

## Evidence and design decisions

| Source | What it supports | Application and limits |
| --- | --- | --- |
| [Moran, NN/g: Four Dimensions of Tone of Voice](https://www.nngroup.com/articles/tone-of-voice-dimensions/) | Formality, humor, respectfulness and enthusiasm are distinct dimensions; comparable text can illustrate them. | Four separate voice questions. This framework was developed for product tone, not as a validated personal-writing assessment. |
| [NN/g: Recognition and Recall](https://www.nngroup.com/articles/recognition-and-recall/) | Visible cues reduce the burden of remembering information. | Show concrete variations of the same message rather than asking users to invent abstract style labels. This does not establish the accuracy of the profile. |
| [Pew Research Center: Writing Survey Questions](https://www.pewresearch.org/writing-survey-questions/) | Wording, question order, response options, and pretesting matter. | Neutral labels, one target dimension per comparison, parallel facts, explicit no-preference choices, no suggested “best” option. The questions still need cognitive pretesting. |
| [Alhafni et al., PERSONALIZE 2024: Personalized Text Generation with Fine-Grained Linguistic Control](https://aclanthology.org/2024.personalize-1.8/) | Personalized generation can be studied through fine-grained lexical and syntactic attributes, beyond coarse tone. | Collect vocabulary, structure, detail, sentence rhythm, contractions, punctuation, directness, and spelling preferences. Our choices are not a replication of their benchmark or a guarantee of improved output. |

Context-specific defaults, optional examples, a short production exercise, exclusions, and the test-draft feedback loop are product design choices informed by these principles. There is no numerical personality score, inferred demographic information, or claim that this questionnaire has been scientifically validated.

## Six-stage process

1. **Context:** Optional formality overrides for portfolio posts, applications and email. General tone remains the fallback. Overrides do not force professional writing into an unsuitable format.
2. **Voice:** Compare the same message across formality, humor, enthusiasm and stance. All include a no-preference answer.
3. **Composition:** Compare detail, structure, vocabulary and sentence rhythm.
4. **Finishing touches:** Directness, contractions, punctuation, spelling and optional exclusions. Exclusions take priority over general stylistic habits where compatible with the task.
5. **Evidence:** Up to two context-labelled writing samples (3,000 characters each), an optional exercise with fixed source facts (1,500 characters), and preservation of a legacy sample (2,000 characters). No minimum sample length or unsupported threshold for “reliable” imitation. Samples remain editable and removable.
6. **Review/calibration:** Show the exact profile, observed preference/sample counts, context overrides and exclusions. Generate an optional real AI draft using the unsaved profile, compare with fixed source facts, then change choices or notes and regenerate. Mark a preview stale after changes. The user explicitly saves the profile; previewing never saves it.

The estimated 5–8 minutes is an untested product estimate. All stages can be completed without samples or AI preview. Cancelling leaves the saved profile unchanged; in-progress answers exist only in page memory and are lost on navigation/reload. No sensitive drafts are placed in browser storage.

## Persistence and prompts

- `User.writingStyle` is private JSON, accessed through authenticated `/users/me/writing-style` GET/PUT. The GET also supplies the canonical questionnaire so frontend options and server validation stay aligned.
- Version 1 profiles continue to validate and influence generation. Editing upgrades them to version 2 and preserves their existing sample. No new migration is needed beyond the writingStyle column migration.
- Version 2 stores explicit preferences, context overrides, exclusions, samples, exercise, and stylistic notes. Unknown fields are stripped. Choices, contexts, text limits and sample counts are checked server-side. Null removes the database value.
- `/users/me/writing-style/preview` validates an unsaved profile and uses the authenticated user's model access with a per-request style override. It never mutates profile state.
- AIManager uses saved preferences for requests with a user ID; trusted server callers can supply a validated override (or null to omit style for a request). Client provider endpoints do not forward arbitrary style overrides.
- Required task formats, explicit requests and factual accuracy take precedence. Matching-context tone overrides general tone. No-preference choices do not become inferred personal traits. Sample content is untrusted reference data, not instructions or facts for a new draft. Avoid copying unrelated sample text.
- Removing a profile stops future personalization from that profile. It does not retract prompts already sent to providers or alter previously generated content.

## Rewriting posts

`POST /ai/posts/:id/rewrite` returns a suggestion without writing to content or revision tables. The parent AI router requires authentication; the endpoint verifies project ownership or ADMIN/EDITOR membership. Revisions and unsupported content types cannot be rewritten. It accepts current editor Markdown so unsaved edits are included; author identity and project permissions come from the server.

Five goals: match voice, clarity, concise, engaging, light copyedit. Extra direction is capped at 1,000 characters and input/output at 60,000. Model authorization errors are preserved, and empty or token-truncated output is rejected. Changes to fenced or inline code are also rejected by a server-side guard. The editor shows original and editable suggestion, word counts, and a text diff. AI content is displayed as text rather than injected HTML. Closing or stopping aborts the client request; the provider may still finish processing it.

Applying a suggestion requires that the source post and editor text still match the generation snapshot and the rewrite settings remain unchanged. It updates only the editor body and marks the studio dirty. Saving uses the existing content/revision flow. The user reviews facts, links, code and Markdown before saving. Title, metadata and publication state are not changed by the rewrite endpoint.

## Validation and next research

Automated tests cover version compatibility, bounds, context matching, unknown-field stripping, data isolation, preview overrides, and rewrite authorization/failure cases. Type checking and production builds verify integration. These are engineering checks, not evidence of personalization quality.

Before claiming a measured improvement, run cognitive interviews: ask users to explain each question and distinguish the target dimension; watch for social-desirability wording and comparisons that unintentionally change content. Pilot mobile and keyboard completion and record completion/drop-off and editing effort with informed consent. No analytics collection is introduced by this implementation.

For quality evaluation, use held-out, user-authored samples across at least two relevant contexts. Compare a generic draft and personalized draft for the same source facts in counterbalanced, blinded order. Ask which sounds more like the user, whether either adds/drops facts, and what edits are needed. Include “neither” and “no difference.” Evaluate voice, usefulness, factual preservation and effort separately; do not collapse these into an unsupported confidence score. Adjust questions using the findings and version substantive schema changes.

## Browser regression

`dashboard/tests/writing-style.browser.cjs` exercises the real Vue components with mocked API responses: completion, optional samples, preview without saving, stale-preview detection, persistence/retake, mobile questionnaire layout, rewrite review/apply, stale source/settings guards, and unsaved studio state. It checks for uncaught browser errors. Run a dashboard Vite server, then `node dashboard/tests/writing-style.browser.cjs http://127.0.0.1:5173` with Playwright and its Chromium dependencies installed. `PLAYWRIGHT_MODULE` can point to an external Playwright installation, and `CHROMIUM_EXECUTABLE` can override the browser path. No real user data or live model calls are used by this regression.
