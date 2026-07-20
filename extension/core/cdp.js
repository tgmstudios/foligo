/**
 * CDP — Chrome DevTools Protocol wrapper around chrome.debugger, used from
 * the background service worker only (content scripts cannot call
 * chrome.debugger directly). Drives real Input-domain events instead of
 * content-script-simulated DOM events, so React/custom-combobox controls
 * receive them identically to genuine user input.
 *
 * Attach/detach is idle-timed per tab rather than held for the whole tab
 * lifetime, to minimize how long Chrome's "started debugging this browser"
 * banner is visible — it disappears shortly after the agent stops actively
 * filling/clicking on that tab.
 */
const CDP = (() => {
  const PROTOCOL_VERSION = '1.3';
  const DETACH_IDLE_MS = 60000;

  const attached = new Set();
  const detachTimers = new Map();
  const captureEnabled = new Set();
  const consoleMessages = new Map();
  const networkRequests = new Map();

  function attach(tabId) {
    if (attached.has(tabId)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      chrome.debugger.attach({ tabId }, PROTOCOL_VERSION, () => {
        if (chrome.runtime.lastError) {
          console.warn('[GoApply:CDP] attach failed for tab', tabId, '—', chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        console.log('[GoApply:CDP] attached to tab', tabId);
        attached.add(tabId);
        resolve();
      });
    });
  }

  function detach(tabId) {
    clearTimeout(detachTimers.get(tabId));
    detachTimers.delete(tabId);
    if (!attached.has(tabId)) return;
    attached.delete(tabId);
    captureEnabled.delete(tabId);
    console.log('[GoApply:CDP] detached from tab', tabId);
    try { chrome.debugger.detach({ tabId }); } catch (e) {}
  }

  function scheduleDetach(tabId) {
    clearTimeout(detachTimers.get(tabId));
    detachTimers.set(tabId, setTimeout(() => detach(tabId), DETACH_IDLE_MS));
  }

  // The user may dismiss Chrome's own debugging banner ("Cancel") mid-turn —
  // treat that the same as us detaching, so the next command re-attaches
  // cleanly instead of silently failing forever.
  if (typeof chrome !== 'undefined' && chrome.debugger?.onDetach) {
    chrome.debugger.onDetach.addListener(({ tabId }) => {
      attached.delete(tabId);
      captureEnabled.delete(tabId);
      clearTimeout(detachTimers.get(tabId));
      detachTimers.delete(tabId);
    });
  }

  if (typeof chrome !== 'undefined' && chrome.debugger?.onEvent) {
    chrome.debugger.onEvent.addListener(({ tabId }, method, params) => {
      if (method === 'Runtime.consoleAPICalled') {
        const list = consoleMessages.get(tabId) || [];
        list.push({
          timestamp: params.timestamp,
          level: params.type,
          text: (params.args || []).map((arg) => arg.value ?? arg.description ?? arg.type).join(' '),
          stackTrace: params.stackTrace,
        });
        consoleMessages.set(tabId, list.slice(-500));
      } else if (method === 'Runtime.exceptionThrown') {
        const list = consoleMessages.get(tabId) || [];
        list.push({
          timestamp: params.timestamp,
          level: 'error',
          text: params.exceptionDetails?.exception?.description || params.exceptionDetails?.text || 'Uncaught exception',
          stackTrace: params.exceptionDetails?.stackTrace,
        });
        consoleMessages.set(tabId, list.slice(-500));
      } else if (method === 'Network.requestWillBeSent') {
        const list = networkRequests.get(tabId) || [];
        list.push({
          requestId: params.requestId,
          timestamp: params.timestamp,
          method: params.request?.method,
          url: params.request?.url,
          type: params.type,
          status: null,
        });
        networkRequests.set(tabId, list.slice(-1000));
      } else if (method === 'Network.responseReceived') {
        const list = networkRequests.get(tabId) || [];
        const request = [...list].reverse().find((item) => item.requestId === params.requestId);
        if (request) {
          request.status = params.response?.status;
          request.mimeType = params.response?.mimeType;
          request.fromDiskCache = params.response?.fromDiskCache;
        }
      } else if (method === 'Network.loadingFailed') {
        const list = networkRequests.get(tabId) || [];
        const request = [...list].reverse().find((item) => item.requestId === params.requestId);
        if (request) request.errorText = params.errorText;
      }
    });
  }

  function sendCommand(tabId, method, params = {}) {
    return new Promise((resolve, reject) => {
      chrome.debugger.sendCommand({ tabId }, method, params, (result) => {
        if (chrome.runtime.lastError) { reject(new Error(chrome.runtime.lastError.message)); return; }
        resolve(result);
      });
    });
  }

  async function withAttached(tabId, fn) {
    await attach(tabId);
    clearTimeout(detachTimers.get(tabId));
    try {
      if (!captureEnabled.has(tabId)) {
        await Promise.all([
          sendCommand(tabId, 'Runtime.enable'),
          sendCommand(tabId, 'Network.enable'),
        ]);
        captureEnabled.add(tabId);
      }
      return await fn();
    } finally {
      scheduleDetach(tabId);
    }
  }

  async function click(tabId, x, y) {
    return withAttached(tabId, async () => {
      await sendCommand(tabId, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await sendCommand(tabId, 'Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      await sendCommand(tabId, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    });
  }

  async function mouseAction(tabId, action, params = {}) {
    return withAttached(tabId, async () => {
      const x = Number(params.x || 0), y = Number(params.y || 0);
      const modifiers = modifierMask(params.modifiers);
      if (action === 'mouse_move') {
        await sendCommand(tabId, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, modifiers });
      } else if (action === 'left_click' || action === 'double_click' || action === 'triple_click' || action === 'right_click') {
        const button = action === 'right_click' ? 'right' : 'left';
        const clickCount = action === 'triple_click' ? 3 : action === 'double_click' ? 2 : 1;
        await sendCommand(tabId, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, modifiers });
        await sendCommand(tabId, 'Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button, clickCount, modifiers });
        await sendCommand(tabId, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button, clickCount, modifiers });
      } else if (action === 'scroll') {
        await sendCommand(tabId, 'Input.dispatchMouseEvent', {
          type: 'mouseWheel', x, y,
          deltaX: Number(params.deltaX || 0), deltaY: Number(params.deltaY || 0),
        });
      } else if (action === 'left_click_drag') {
        const endX = Number(params.endX), endY = Number(params.endY);
        await sendCommand(tabId, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
        await sendCommand(tabId, 'Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
        for (let i = 1; i <= 12; i++) {
          await sendCommand(tabId, 'Input.dispatchMouseEvent', {
            type: 'mouseMoved', x: x + (endX - x) * i / 12, y: y + (endY - y) * i / 12,
            button: 'left', buttons: 1,
          });
        }
        await sendCommand(tabId, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x: endX, y: endY, button: 'left', clickCount: 1 });
      } else throw new Error(`Unsupported mouse action: ${action}`);
    });
  }

  const CTRL_A = { modifiers: 2, key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65 };
  const BACKSPACE = { key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 };

  // Clears the focused field via a real select-all + delete, then types the
  // new value via Input.insertText — a single trusted "paste-like" text
  // commit that frameworks receive as real input, not a per-keystroke
  // simulation (avoids IME/compositor edge cases and is far faster).
  async function clearAndType(tabId, text) {
    return withAttached(tabId, async () => {
      await sendCommand(tabId, 'Input.dispatchKeyEvent', { type: 'keyDown', ...CTRL_A });
      await sendCommand(tabId, 'Input.dispatchKeyEvent', { type: 'keyUp', ...CTRL_A });
      await sendCommand(tabId, 'Input.dispatchKeyEvent', { type: 'keyDown', ...BACKSPACE });
      await sendCommand(tabId, 'Input.dispatchKeyEvent', { type: 'keyUp', ...BACKSPACE });
      if (text) await sendCommand(tabId, 'Input.insertText', { text: String(text) });
    });
  }

  const KEY_DEFS = {
    ArrowDown: { key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 },
    ArrowUp: { key: 'ArrowUp', code: 'ArrowUp', windowsVirtualKeyCode: 38 },
    Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 },
    Escape: { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 },
    Tab: { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 },
    ArrowLeft: { key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 },
    ArrowRight: { key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 },
    Backspace: { key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 },
    Delete: { key: 'Delete', code: 'Delete', windowsVirtualKeyCode: 46 },
    Home: { key: 'Home', code: 'Home', windowsVirtualKeyCode: 36 },
    End: { key: 'End', code: 'End', windowsVirtualKeyCode: 35 },
    PageUp: { key: 'PageUp', code: 'PageUp', windowsVirtualKeyCode: 33 },
    PageDown: { key: 'PageDown', code: 'PageDown', windowsVirtualKeyCode: 34 },
    Space: { key: ' ', code: 'Space', windowsVirtualKeyCode: 32 },
  };

  function modifierMask(value) {
    const tokens = String(value || '').toLowerCase().split('+').map((token) => token.trim());
    return (tokens.some((token) => ['alt', 'option'].includes(token)) ? 1 : 0)
      | (tokens.some((token) => ['ctrl', 'control'].includes(token)) ? 2 : 0)
      | (tokens.some((token) => ['cmd', 'command', 'meta', 'win', 'windows'].includes(token)) ? 4 : 0)
      | (tokens.includes('shift') ? 8 : 0);
  }

  async function pressKey(tabId, key, repeat = 1) {
    const tokens = String(key || '').split('+').map((token) => token.trim()).filter(Boolean);
    const baseKey = tokens.pop();
    const modifiers = modifierMask(tokens.join('+'));
    const normalizedKey = baseKey?.length === 1 ? baseKey : baseKey === ' ' ? 'Space' : baseKey;
    const def = KEY_DEFS[normalizedKey] || (normalizedKey?.length === 1
      ? {
          key: modifiers & 8 ? normalizedKey.toUpperCase() : normalizedKey,
          code: `Key${normalizedKey.toUpperCase()}`,
          windowsVirtualKeyCode: normalizedKey.toUpperCase().charCodeAt(0),
        }
      : null);
    if (!def) throw new Error(`Unsupported key: ${key}`);
    return withAttached(tabId, async () => {
      const count = Math.max(1, Math.min(100, Number(repeat) || 1));
      for (let index = 0; index < count; index++) {
        await sendCommand(tabId, 'Input.dispatchKeyEvent', { type: 'keyDown', modifiers, ...def });
        await sendCommand(tabId, 'Input.dispatchKeyEvent', { type: 'keyUp', modifiers, ...def });
      }
    });
  }

  // Eagerly attach the moment the user opens the extension (icon click),
  // rather than waiting for the first fill/click — this is what makes CDP
  // input feel immediate instead of adding a one-time attach delay to
  // whatever the agent does first. Still idle-timed like any other attach,
  // so it detaches on its own if the user never actually fills anything.
  async function primeAttach(tabId) {
    try {
      await withAttached(tabId, async () => {});
    } catch (e) {
      console.warn('[GoApply:CDP] prime-attach failed for tab', tabId, '—', e.message);
    }
  }

  async function readConsoleMessages(tabId, { pattern, level, limit = 100, clear = false } = {}) {
    return withAttached(tabId, async () => {
      const matcher = pattern ? new RegExp(pattern, 'i') : null;
      const messages = (consoleMessages.get(tabId) || []).filter((message) =>
        (!level || message.level === level) && (!matcher || matcher.test(message.text || ''))
      ).slice(-Math.max(1, Math.min(500, limit)));
      if (clear) consoleMessages.set(tabId, []);
      return messages;
    });
  }

  async function readNetworkRequests(tabId, { pattern, limit = 100, clear = false } = {}) {
    return withAttached(tabId, async () => {
      const matcher = pattern ? new RegExp(pattern, 'i') : null;
      const requests = (networkRequests.get(tabId) || []).filter((request) =>
        !matcher || matcher.test(`${request.method || ''} ${request.url || ''}`)
      ).slice(-Math.max(1, Math.min(500, limit)));
      if (clear) networkRequests.set(tabId, []);
      return requests;
    });
  }

  return {
    click, mouseAction, clearAndType, pressKey, detach, primeAttach,
    readConsoleMessages, readNetworkRequests,
  };
})();
