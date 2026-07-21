# Claude browser-control parity

Audit target: the supplied open-source Claude extension dump, manifest version
`1.0.81`.

## Architecture recovered from the dump

Claude treats a browser-agent conversation as a session-scoped tab group, not
as state owned by one page. The side panel initializes an isolated group and
every tool call carries the session, group, panel tab, tool-use ID, and target
tab. Both iframe and native transports converge on one background dispatcher.
That dispatcher validates tools, strips transport-only arguments, applies
domain permissions, and executes browser actions. `STOP_AGENT` is routed to the
session rather than whichever page happens to be active.

Page control is ref-first. `read_page` builds an accessibility representation;
`find` searches it; `form_input` sets semantic control values; and `computer`
provides trusted coordinate/ref mouse and keyboard input. `browser_batch`
executes predictable actions sequentially, never recursively, and stops on the
first failure. Screenshots are returned as actual model image content as well
as user-visible tool output.

New tabs are created inside the session group. Tool calls can target any tab in
that group, and navigation does not own or clear the conversation. Console and
network capture are held by the background debugger layer. Scheduled tasks
create a controlled tab/group before dispatch.

The dump's browser tool surface includes:

- `javascript_tool`
- `read_page`
- `find`
- `form_input`
- `computer`
- `browser_batch`
- `navigate`
- `resize_window`
- `gif_creator` (session recording → animated GIF, now implemented in GoApply)
- `upload_image`
- `get_page_text`
- `tabs_context_mcp`
- `tabs_create_mcp`
- `tabs_close_mcp`
- `read_console_messages`
- `read_network_requests`

## GoApply implementation

GoApply now follows the same ownership model for active work:

- Side-panel chats and model history are keyed to the GoApply tab group.
- Stream events, Stop, and New chat follow the turn's owning tab even when
  another grouped tab becomes active.
- New model-created tabs and opener-created tabs inherit the group.
- DOM tools route through the background worker to any requested tab in the
  group and wait for a newly loaded content script to become ready.
- Page reads/finds create stable refs; semantic form input, main-world
  JavaScript, trusted CDP mouse/keyboard input, sequential batches, window
  resize, screenshots, captured-image upload, console reads, and network reads
  are available to Foligo's AI tool loop.
- Session GIF recording matches Claude's `gif_creator`: a group-scoped frame
  store in the background worker captures each trusted action, navigation, and
  screenshot; an offscreen document encodes the frames with gif.js and draws
  the same overlays (click indicators, drag paths, action labels, progress
  bar, watermark). Export either downloads the GIF or drag-drops it onto a page
  target via the existing captured-image upload path.
- Screenshot results are sent to the model as image parts rather than data-URL
  text.
- Page navigation snapshots and group session storage preserve native
  tool/result history across documents and tabs.

Foligo document upload deliberately extends Claude's generic upload model:

1. `list_foligo_documents` returns the résumé or cover-letter catalog with
   linked role/category/default/update metadata.
2. `inspect_foligo_document` lets the model compare actual content when
   metadata is insufficient.
3. The model selects the best document for the live job.
4. `attach_document` requires that exact `documentId`, validates it against the
   current catalog, compiles/fetches its PDF, and verifies the page retained the
   file.

No rescan, autofill, chat preflight, or page-advance path attaches a default or
previously remembered document.

The side panel exposes the same choice directly: the user can select a named
Foligo résumé (which becomes authoritative for the model) or leave the selector
on “AI chooses,” in which case the catalog/content comparison runs per job.

Job work is synchronized with the Foligo board. AI application turns can safely
create a `saved` card without changing an existing later-stage status, and the
agent can list tracked jobs or perform an explicit/evidence-backed status move
across the complete Foligo pipeline. The side panel uses the same status model,
while the verified submission watcher promotes `saved` to `applied`.

## Foligo-specific boundaries

Final job-application submission remains user-only. The low-level click paths
enforce the same boundary when a click resolves to a Submit/Apply control.
Chrome-owned pages (`chrome://`, the Web Store, and the native new-tab surface)
cannot host extension content scripts; GoApply initializes an empty/protected
tab onto an HTTP start page before replaying the requested command.

Claude's native-host bridge, Claude-account cloud synchronization, and managed
enterprise policy are product services, not browser-control primitives. They
are not copied into Foligo; Foligo's own AI API, auth, history, scheduling, and
document systems remain the authority. The GIF recording *primitive*, however,
is a browser-control capability and is now implemented (`gif_creator`); only
Claude's branded workflow-recording UI chrome is omitted.
