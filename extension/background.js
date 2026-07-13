/**
 * Network bridge for extension API requests.
 *
 * Manifest V3 content scripts inherit the web page's CORS origin even when the
 * extension has host permissions. Fetching here gives requests the extension
 * origin, so job-board CORS policies cannot block Foligo profile/board sync.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
