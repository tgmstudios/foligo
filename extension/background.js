importScripts('core/cdp.js');

// There is no popup and no in-page control panel — the side panel is the
// only surface. openPanelOnActionClick:false + our own onClicked listener
// (rather than the automatic behavior) is what lets us also prime the CDP
// attach on the same click, not just open the panel.
Promise.resolve(chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: false })).catch(() => {});

async function cacheCapturedImage(dataUrl) {
  const imageId = globalThis.crypto.randomUUID();
  await chrome.storage.session.set({
    [`goapplyCapturedImage:${imageId}`]: { dataUrl, createdAt: Date.now() },
  });
  return imageId;
}

async function ensureAgentTabGroup(tab) {
  if (!tab?.id || tab.incognito) return tab?.groupId ?? chrome.tabGroups.TAB_GROUP_ID_NONE;
  if (tab.groupId != null && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
    try { chrome.runtime.sendMessage({ type: 'goapply-group-ready', tabId: tab.id, groupId: tab.groupId }); } catch (error) {}
    return tab.groupId;
  }
  const groupId = await chrome.tabs.group({ tabIds: [tab.id] });
  await chrome.tabGroups.update(groupId, { title: 'GoApply', color: 'purple', collapsed: false });
  try {
    const oldKey = `goapplyAgentSession:tab-${tab.id}`;
    const newKey = `goapplyAgentSession:group-${groupId}`;
    const stored = await chrome.storage.session.get([oldKey, newKey]);
    if (stored[oldKey] && !stored[newKey]) await chrome.storage.session.set({ [newKey]: stored[oldKey] });
    if (stored[oldKey]) await chrome.storage.session.remove(oldKey);
  } catch (error) {}
  try { chrome.runtime.sendMessage({ type: 'goapply-group-ready', tabId: tab.id, groupId }); } catch (error) {}
  return groupId;
}

chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) return;
  // Call sidePanel.open() synchronously in this handler (a real user
  // gesture) before anything else — an awaited call ahead of it would lose
  // the gesture association and silently fail, same issue as popup.js.
  chrome.sidePanel.open({ tabId: tab.id }).catch((error) => {
    console.warn('[GoApply] Failed to open side panel:', error.message);
  });
  ensureAgentTabGroup(tab).catch((error) => {
    console.warn('[GoApply] Failed to establish tab group:', error.message);
  });
  CDP.primeAttach(tab.id);
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-side-panel') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  await chrome.sidePanel.open({ tabId: tab.id });
  await ensureAgentTabGroup(tab);
  CDP.primeAttach(tab.id);
});

// Links with target=_blank and window.open() bypass the create_tab AI tool.
// If their opener belongs to a GoApply workspace, inherit that same group so
// the conversation and agent context remain visually attached.
chrome.tabs.onCreated.addListener(async (tab) => {
  if (!tab.id || !tab.openerTabId || tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) return;
  try {
    const opener = await chrome.tabs.get(tab.openerTabId);
    if (opener.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) return;
    const group = await chrome.tabGroups.get(opener.groupId);
    if (group.title !== 'GoApply') return;
    await chrome.tabs.group({ tabIds: [tab.id], groupId: opener.groupId });
  } catch (error) {
    // The opener may have closed between onCreated and lookup.
  }
});

/**
 * Network bridge for extension API requests.
 *
 * Manifest V3 content scripts inherit the web page's CORS origin even when the
 * extension has host permissions. Fetching here gives requests the extension
 * origin, so job-board CORS policies cannot block Foligo profile/board sync.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Content scripts don't know their own tab id; they ask here so streamed
  // agent events broadcast to the side panel can be tagged with it.
  if (message?.action === 'get-own-tab-id') {
    sendResponse({
      tabId: sender.tab?.id ?? null,
      groupId: sender.tab?.groupId ?? chrome.tabGroups.TAB_GROUP_ID_NONE,
    });
    return false;
  }
  if (message?.action === 'open-side-panel') {
    (async () => {
      try {
        let tabId = sender.tab?.id;
        if (!tabId) {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          tabId = activeTab?.id;
        }
        if (!tabId) { sendResponse({ ok: false, error: 'No active tab' }); return; }
        await chrome.sidePanel.open({ tabId });
        sendResponse({ ok: true });
      } catch (error) {
        sendResponse({ ok: false, error: error.message });
      }
    })();
    return true;
  }
  if (message?.action === 'prepare-agent-tab') {
    (async () => {
      try {
        const tabId = message.tabId;
        if (!Number.isInteger(tabId)) throw new Error('No target tab.');
        const tab = await chrome.tabs.get(tabId);
        const url = tab.url || tab.pendingUrl || '';
        const restricted = !/^https?:\/\//i.test(url)
          || /^https:\/\/(?:chromewebstore\.google\.com|chrome\.google\.com\/webstore)\//i.test(url);
        if (restricted) {
          // Chrome deliberately forbids extension content scripts on
          // about:blank, chrome://newtab, chrome://*, the Web Store, etc.
          // Turn an empty/protected tab into a normal, controllable start
          // page, then let the side panel retry the user's original command.
          await chrome.tabs.update(tabId, { url: 'https://www.google.com/' });
        } else {
          // A normal page can still lack a receiver when it was already open
          // before the extension was installed/reloaded. Reloading causes the
          // manifest content scripts to be injected without changing its URL.
          await chrome.tabs.reload(tabId);
        }

        const deadline = Date.now() + 12000;
        while (Date.now() < deadline) {
          const current = await chrome.tabs.get(tabId);
          if (current.status === 'complete' && /^https?:\/\//i.test(current.url || '')) {
            // The manifest content-script injection happens just after the
            // tab reports complete. Probe until its message listener exists.
            for (let attempt = 0; attempt < 30; attempt++) {
              try {
                const response = await chrome.tabs.sendMessage(tabId, { action: 'detect' });
                sendResponse({ ok: true, tabId, navigated: restricted, detected: response });
                return;
              } catch (error) {
                await new Promise((resolve) => setTimeout(resolve, 100));
              }
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
        throw new Error('The browser agent did not become ready in this tab.');
      } catch (error) {
        sendResponse({ ok: false, error: error.message });
      }
    })();
    return true;
  }
  if (message?.action === 'cdp-click') {
    const tabId = sender.tab?.id;
    if (!tabId) { sendResponse({ ok: false, error: 'No source tab for CDP click' }); return false; }
    CDP.click(tabId, message.x, message.y)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.action === 'cdp-type') {
    const tabId = sender.tab?.id;
    if (!tabId) { sendResponse({ ok: false, error: 'No source tab for CDP type' }); return false; }
    CDP.clearAndType(tabId, message.text)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.action === 'cdp-key') {
    const tabId = sender.tab?.id;
    if (!tabId) { sendResponse({ ok: false, error: 'No source tab for CDP key' }); return false; }
    CDP.pressKey(tabId, message.key)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.action === 'computer') {
    const tabId = message.tabId || sender.tab?.id;
    if (!tabId) { sendResponse({ ok: false, error: 'No target tab for computer action' }); return false; }
    (async () => {
      try {
        if (sender.tab?.id && tabId !== sender.tab.id) {
          const target = await chrome.tabs.get(tabId);
          const none = chrome.tabGroups.TAB_GROUP_ID_NONE;
          if (sender.tab.groupId === none || target.groupId !== sender.tab.groupId) {
            throw new Error('Target tab is outside this GoApply workspace.');
          }
        }
        if (message.computerAction === 'type') await CDP.clearAndType(tabId, message.text || '');
        else if (message.computerAction === 'key') await CDP.pressKey(tabId, message.key, message.repeat);
        else if (message.computerAction === 'screenshot') {
          const tab = await chrome.tabs.get(tabId);
          const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
          const imageId = await cacheCapturedImage(dataUrl);
          sendResponse({ ok: true, imageId, dataUrl });
          return;
        } else await CDP.mouseAction(tabId, message.computerAction, message);
        sendResponse({ ok: true, action: message.computerAction });
      } catch (error) {
        sendResponse({ ok: false, error: error.message });
      }
    })();
    return true;
  }
  if (message?.action?.startsWith('browser-')) {
    (async () => {
      try {
        const sourceTabId = sender.tab?.id;
        const action = message.action.slice('browser-'.length);
        const resolveScopedTab = async (requestedTabId) => {
          const targetId = Number.isInteger(requestedTabId) ? requestedTabId : sourceTabId;
          if (!targetId) throw new Error('No target tab.');
          const target = await chrome.tabs.get(targetId);
          if (sourceTabId && targetId !== sourceTabId) {
            const source = await chrome.tabs.get(sourceTabId);
            const none = chrome.tabGroups.TAB_GROUP_ID_NONE;
            if (source.groupId === none || target.groupId !== source.groupId) {
              throw new Error('Target tab is outside this GoApply workspace.');
            }
          }
          return target;
        };
        if (action === 'tabs') {
          const tabs = await chrome.tabs.query({ currentWindow: true });
          sendResponse({ ok: true, tabs: tabs.map(({ id, active, title, url, groupId, pinned }) => ({ id, active, title, url, groupId, pinned })) });
        } else if (action === 'tabs-context') {
          const source = sourceTabId ? await chrome.tabs.get(sourceTabId) : null;
          const tabs = source?.groupId != null && source.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE
            ? await chrome.tabs.query({ groupId: source.groupId })
            : (source ? [source] : []);
          sendResponse({
            ok: true,
            currentTabId: tabs.find((tab) => tab.active)?.id ?? sourceTabId ?? null,
            groupId: source?.groupId ?? chrome.tabGroups.TAB_GROUP_ID_NONE,
            tabs: tabs.map(({ id, active, title, url, groupId, pinned }) => ({ id, active, title, url, groupId, pinned })),
          });
        } else if (action === 'tab-tool') {
          const target = await resolveScopedTab(message.tabId);
          let response = null;
          let lastError = null;
          for (let attempt = 0; attempt < 50; attempt++) {
            try {
              response = await chrome.tabs.sendMessage(target.id, {
                action: 'agent-execute-tool',
                toolName: message.toolName,
                input: message.input || {},
              });
              lastError = null;
              break;
            } catch (error) {
              lastError = error;
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }
          if (lastError) throw new Error(`Target tab is not ready for browser control: ${lastError.message}`);
          sendResponse(response || { error: 'Target tab returned no tool result.' });
        } else if (action === 'create-tab') {
          // Create inactive first so an onActivated event cannot race ahead
          // of grouping and make the side panel treat it as a new workspace.
          const shouldActivate = message.active !== false;
          const tab = await chrome.tabs.create({ url: message.url, active: false });
          if (sourceTabId) {
            const sourceTab = await chrome.tabs.get(sourceTabId);
            const groupId = await ensureAgentTabGroup(sourceTab);
            if (groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
              await chrome.tabs.group({ tabIds: [tab.id], groupId });
            }
          }
          if (shouldActivate) await chrome.tabs.update(tab.id, { active: true });
          sendResponse({ ok: true, tabId: tab.id, title: tab.title, url: tab.url });
        } else if (action === 'activate-tab') {
          await resolveScopedTab(message.tabId);
          const tab = await chrome.tabs.update(message.tabId, { active: true });
          sendResponse({ ok: true, tabId: tab.id, title: tab.title, url: tab.url });
        } else if (action === 'close-tab') {
          await resolveScopedTab(message.tabId);
          const tabs = await chrome.tabs.query({ currentWindow: true });
          if (tabs.length <= 1) throw new Error('Refused to close the last browser tab.');
          await chrome.tabs.remove(message.tabId);
          sendResponse({ ok: true, tabId: message.tabId });
        } else if (action === 'navigate') {
          const target = await resolveScopedTab(message.tabId);
          const targetTabId = target.id;
          if (message.browserAction === 'url' && !/^https?:\/\//i.test(message.url || '')) throw new Error('Only http(s) URLs are supported.');
          if (message.browserAction === 'url') await chrome.tabs.update(targetTabId, { url: message.url });
          else if (message.browserAction === 'reload') await chrome.tabs.reload(targetTabId);
          else if (message.browserAction === 'forward') await chrome.tabs.goForward(targetTabId);
          else if (message.browserAction === 'back') await chrome.tabs.goBack(targetTabId);
          else throw new Error('Unknown navigation action.');
          sendResponse({ ok: true, action: message.browserAction });
        } else if (action === 'screenshot') {
          const tab = await resolveScopedTab(message.tabId);
          const dataUrl = await chrome.tabs.captureVisibleTab(tab?.windowId, { format: 'png' });
          const imageId = await cacheCapturedImage(dataUrl);
          sendResponse({ ok: true, imageId, dataUrl });
        } else if (action === 'captured-image') {
          if (!message.imageId) throw new Error('imageId is required.');
          const key = `goapplyCapturedImage:${message.imageId}`;
          const stored = await chrome.storage.session.get(key);
          const image = stored[key];
          if (!image?.dataUrl) throw new Error('Captured image is unavailable or expired.');
          sendResponse({ ok: true, imageId: message.imageId, dataUrl: image.dataUrl });
        } else if (action === 'javascript') {
          const tab = await resolveScopedTab(message.tabId);
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            world: 'MAIN',
            func: async (source) => {
              const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
              try {
                return await new AsyncFunction(`return (${source})`)();
              } catch (expressionError) {
                return await new AsyncFunction(source)();
              }
            },
            args: [String(message.text || '')],
          });
          sendResponse({ ok: true, result: results?.[0]?.result });
        } else if (action === 'resize-window') {
          const tab = await resolveScopedTab(message.tabId);
          const width = Number(message.width), height = Number(message.height);
          if (!Number.isFinite(width) || !Number.isFinite(height) || width < 200 || height < 200 || width > 7680 || height > 4320) {
            throw new Error('Window dimensions must be between 200x200 and 7680x4320.');
          }
          const updated = await chrome.windows.update(tab.windowId, {
            width: Math.round(width),
            height: Math.round(height),
            state: 'normal',
          });
          sendResponse({ ok: true, windowId: updated.id, width: updated.width, height: updated.height });
        } else if (action === 'console-messages') {
          const tab = await resolveScopedTab(message.tabId);
          const messages = await CDP.readConsoleMessages(tab.id, {
            pattern: message.pattern,
            level: message.level,
            limit: message.limit,
            clear: message.clear,
          });
          sendResponse({ ok: true, tabId: tab.id, messages });
        } else if (action === 'network-requests') {
          const tab = await resolveScopedTab(message.tabId);
          const requests = await CDP.readNetworkRequests(tab.id, {
            pattern: message.pattern,
            limit: message.limit,
            clear: message.clear,
          });
          sendResponse({ ok: true, tabId: tab.id, requests });
        } else if (action === 'group-tabs') {
          const groupId = await chrome.tabs.group({ tabIds: message.tabIds });
          const update = {};
          if (message.title != null) update.title = message.title;
          if (message.color != null) update.color = message.color;
          if (message.collapsed != null) update.collapsed = message.collapsed;
          if (Object.keys(update).length) await chrome.tabGroups.update(groupId, update);
          sendResponse({ ok: true, groupId });
        } else if (action === 'download') {
          if (!/^https?:\/\//i.test(message.url || '')) throw new Error('Only http(s) downloads are supported.');
          const downloadId = await chrome.downloads.download({
            url: message.url,
            ...(message.filename ? { filename: message.filename.replace(/^\/*/, '') } : {}),
            saveAs: true,
          });
          sendResponse({ ok: true, downloadId });
        } else if (action === 'schedule') {
          const runAt = Date.parse(message.runAt);
          if (!Number.isFinite(runAt) || runAt <= Date.now()) throw new Error('runAt must be a future ISO date-time.');
          const taskId = globalThis.crypto.randomUUID();
          const key = `goapplyScheduledTask:${taskId}`;
          const task = {
            id: taskId,
            prompt: message.prompt,
            url: message.url,
            runAt,
            repeatMinutes: message.repeatMinutes || null,
            createdAt: Date.now(),
          };
          await chrome.storage.local.set({ [key]: task });
          await chrome.alarms.create(key, {
            when: runAt,
            ...(task.repeatMinutes ? { periodInMinutes: task.repeatMinutes } : {}),
          });
          sendResponse({ ok: true, task });
        } else if (action === 'scheduled-tasks') {
          const stored = await chrome.storage.local.get(null);
          const tasks = Object.entries(stored)
            .filter(([key]) => key.startsWith('goapplyScheduledTask:'))
            .map(([, task]) => task);
          sendResponse({ ok: true, tasks });
        } else if (action === 'cancel-scheduled-task') {
          const key = `goapplyScheduledTask:${message.taskId}`;
          await chrome.alarms.clear(key);
          await chrome.storage.local.remove(key);
          sendResponse({ ok: true, taskId: message.taskId });
        } else {
          throw new Error(`Unknown browser action: ${action}`);
        }
      } catch (error) {
        sendResponse({ ok: false, error: error.message });
      }
    })();
    return true;
  }

  if (message?.action !== 'goapplyApiRequest') return false;

  (async () => {
    try {
      const url = new URL(message.url);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Unsupported API URL');
      }

      const response = await fetch(url.href, {
        method: message.options?.method || 'GET',
        headers: message.options?.headers || {},
        body: message.options?.body,
      });

      if (message.options?.binary) {
        // PDFs (resume/cover-letter attachments) can't cross the sendMessage
        // boundary as text without corrupting bytes — base64-encode instead.
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        sendResponse({
          ok: response.ok, status: response.status,
          base64: btoa(binary), contentType: response.headers.get('content-type') || '',
        });
        return;
      }

      const text = await response.text();
      sendResponse({ ok: response.ok, status: response.status, text });
    } catch (error) {
      sendResponse({ ok: false, status: 0, networkError: error.message });
    }
  })();

  return true;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith('goapplyScheduledTask:')) return;
  const stored = await chrome.storage.local.get(alarm.name);
  const task = stored[alarm.name];
  if (!task) return;
  try {
    const tab = await chrome.tabs.create({ url: task.url, active: false });
    await ensureAgentTabGroup(tab);
    const listener = (tabId, changeInfo) => {
      if (tabId !== tab.id || changeInfo.status !== 'complete') return;
      chrome.tabs.onUpdated.removeListener(listener);
      chrome.tabs.sendMessage(tabId, { action: 'sp-chat', text: task.prompt }).catch(() => {});
    };
    chrome.tabs.onUpdated.addListener(listener);
    await chrome.notifications.create(`goapply-task:${task.id}`, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'GoApply scheduled task started',
      message: task.prompt.slice(0, 180),
    });
    if (!task.repeatMinutes) await chrome.storage.local.remove(alarm.name);
  } catch (error) {
    await chrome.notifications.create(`goapply-task-error:${task.id}`, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'GoApply scheduled task needs attention',
      message: error.message,
    });
  }
});

// Agent snapshots are intentionally ephemeral but must be readable by the
// content script after a full-page navigation. Chrome keeps storage.session
// trusted-context-only unless the service worker opts content scripts in.
Promise.resolve(
  chrome.storage?.session?.setAccessLevel?.({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' })
).catch(() => {});

/**
 * Streaming relay for the extension's agent (rescan/field-fill/chat).
 * `chrome.runtime.sendMessage` above is one-shot request/response and can't
 * carry SSE chunks, so the agent controller opens a long-lived Port instead;
 * this does the actual fetch (same CORS reasoning as the listener above) and
 * forwards each parsed SSE frame back over the port as it arrives.
 */
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'goapply-agent') return;

  const controllers = new Map();
  const heartbeats = new Map();

  port.onMessage.addListener((message) => {
    if (message?.type === 'agent-abort') {
      const controller = controllers.get(message.requestId);
      if (controller) { controller.abort(); controllers.delete(message.requestId); }
      return;
    }
    if (message?.type !== 'agent-request') return;

    const { requestId, url, options } = message;
    (async () => {
      const controller = new AbortController();
      controllers.set(requestId, controller);
      // A connected Port alone does not indefinitely extend an MV3 service
      // worker's lifetime. Send traffic while a provider/tool is thinking so
      // Chrome does not suspend this relay in the middle of a long request.
      const heartbeat = setInterval(() => {
        try { port.postMessage({ type: 'agent-heartbeat', requestId }); }
        catch (e) { clearInterval(heartbeat); }
      }, 10000);
      heartbeats.set(requestId, heartbeat);
      try {
        const url_ = new URL(url);
        if (url_.protocol !== 'http:' && url_.protocol !== 'https:') throw new Error('Unsupported API URL');

        const response = await fetch(url_.href, {
          method: options?.method || 'POST',
          headers: options?.headers || {},
          body: options?.body,
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          let responseText = '';
          try { responseText = await response.text(); } catch (e) {}
          throw new Error(responseText || `Agent request failed (${response.status})`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() || '';

          for (const chunk of chunks) {
            const line = chunk.split('\n').find(l => l.startsWith('data: '));
            if (!line) continue;
            try {
              const event = JSON.parse(line.slice('data: '.length));
              port.postMessage({ type: 'agent-event', requestId, event });
            } catch (e) {
              // Ignore malformed SSE frames rather than aborting the whole stream
            }
          }
        }

        port.postMessage({ type: 'agent-done', requestId });
      } catch (error) {
        if (error.name !== 'AbortError') {
          port.postMessage({ type: 'agent-error', requestId, message: error.message });
        }
      } finally {
        clearInterval(heartbeats.get(requestId));
        heartbeats.delete(requestId);
        controllers.delete(requestId);
      }
    })();
  });

  port.onDisconnect.addListener(() => {
    for (const controller of controllers.values()) controller.abort();
    for (const heartbeat of heartbeats.values()) clearInterval(heartbeat);
    controllers.clear();
    heartbeats.clear();
  });
});
