/**
 * Persistent slide-out chat for the in-page GoApply agent. Network and DOM
 * orchestration stay in AgentController; this module only renders messages
 * and streaming tool activity.
 */
const ChatPanel = (() => {
  let rootEl = null;
  let messagesEl = null;
  let inputEl = null;
  let sendButton = null;
  let getContext = () => ({});
  let currentAssistantEl = null;
  const toolChips = new Map();

  function injectStyles() {
    if (document.getElementById('goapply-chat-styles')) return;
    const style = document.createElement('style');
    style.id = 'goapply-chat-styles';
    style.textContent = `
      #goapply-chat-root {
        position: fixed; right: 16px; bottom: 16px; z-index: 2147483645;
        width: min(380px, calc(100vw - 32px)); height: min(590px, calc(100vh - 32px));
        display: none; flex-direction: column; overflow: hidden;
        background: #fff; color: #1A1F36; border: 1px solid #E0E6ED;
        border-radius: 14px; box-shadow: 0 16px 48px rgba(10,37,64,.2);
        font: 13px/1.45 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #goapply-chat-root * { box-sizing: border-box; }
      .ga-chat-header { display:flex;align-items:center;justify-content:space-between;padding:13px 14px;border-bottom:1px solid #E0E6ED;background:#F6F9FC; }
      .ga-chat-title { font-size:14px;font-weight:700;color:#0A2540; }
      .ga-chat-close { border:0;background:transparent;font-size:20px;color:#6B7C93;cursor:pointer;padding:0 3px; }
      .ga-chat-messages { flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:9px; }
      .ga-chat-empty { margin:auto;text-align:center;color:#6B7C93;max-width:250px; }
      .ga-chat-message { max-width:88%;padding:8px 10px;border-radius:10px;white-space:pre-wrap;overflow-wrap:anywhere; }
      .ga-chat-user { align-self:flex-end;background:#635BFF;color:#fff; }
      .ga-chat-assistant { align-self:flex-start;background:#F6F9FC;color:#1A1F36; }
      .ga-chat-tool { align-self:flex-start;max-width:92%;padding:5px 8px;border-radius:20px;background:#F0EFFF;color:#5851DB;font-size:11px; }
      .ga-chat-tool[data-status="done"] { background:#E6F7F0;color:#007A4D; }
      .ga-chat-tool[data-status="error"] { background:#FFF0D6;color:#A85D00; }
      .ga-chat-compose { display:flex;gap:8px;padding:10px;border-top:1px solid #E0E6ED;background:#fff; }
      .ga-chat-input { flex:1;resize:none;min-height:38px;max-height:100px;padding:8px 9px;border:1px solid #E0E6ED;border-radius:8px;font:inherit;color:#1A1F36; }
      .ga-chat-input:focus { outline:2px solid rgba(99,91,255,.22);border-color:#635BFF; }
      .ga-chat-send { align-self:flex-end;border:0;border-radius:7px;background:#635BFF;color:#fff;padding:9px 13px;font-weight:700;cursor:pointer; }
      .ga-chat-send:disabled { opacity:.55;cursor:default; }
      @media (min-width: 760px) { #goapply-chat-root { right: 372px; } }
    `;
    document.head.appendChild(style);
  }

  function scrollToBottom() {
    if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removeEmptyState() {
    messagesEl?.querySelector('.ga-chat-empty')?.remove();
  }

  function addMessage(role, text = '') {
    removeEmptyState();
    const el = document.createElement('div');
    el.className = `ga-chat-message ga-chat-${role}`;
    el.textContent = text;
    messagesEl.appendChild(el);
    scrollToBottom();
    return el;
  }

  function beginAssistantMessage() {
    currentAssistantEl = addMessage('assistant');
    return currentAssistantEl;
  }

  function readableToolName(name) {
    return String(name || 'tool').replace(/_/g, ' ');
  }

  function toolResultDetail(event) {
    const output = event.output || {};
    if (output.note || output.refused || event.error) return output.note || output.refused || event.error;
    if (Array.isArray(output.results)) {
      const failed = output.results.filter(result => result.applied !== true);
      if (failed.length) return failed.map(result => `${result.fieldRef}: ${result.note || 'not retained'}`).join('; ');
    }
    return '';
  }

  function handleAgentEvent(event) {
    if (!event) return;
    if (event.type === 'text-delta') {
      if (!currentAssistantEl) beginAssistantMessage();
      currentAssistantEl.textContent += event.text || '';
    } else if (event.type === 'tool-call') {
      const chip = document.createElement('div');
      chip.className = 'ga-chat-tool';
      chip.dataset.status = 'running';
      chip.textContent = `Working: ${readableToolName(event.toolName)}…`;
      messagesEl.appendChild(chip);
      toolChips.set(event.toolCallId, chip);
    } else if (event.type === 'tool-result' || event.type === 'tool-error') {
      const chip = toolChips.get(event.toolCallId);
      if (chip) {
        const succeeded = event.type === 'tool-result' && event.succeeded !== false;
        const detail = toolResultDetail(event);
        chip.dataset.status = succeeded ? 'done' : 'error';
        chip.textContent = `${succeeded ? '✓' : '⚠'} ${readableToolName(event.toolName)}${detail ? ` — ${detail}` : ''}`;
        if (detail) chip.title = detail;
      }
    } else if (event.type === 'transport-retry') {
      const chip = document.createElement('div');
      chip.className = 'ga-chat-tool';
      chip.dataset.status = 'running';
      chip.textContent = event.message || 'Reconnecting…';
      messagesEl.appendChild(chip);
    } else if (event.type === 'error') {
      const el = addMessage('assistant', `I couldn't complete that request: ${event.message || 'Unknown error'}`);
      el.style.color = '#DF1B41';
    }
    scrollToBottom();
  }

  function restoreMessages(modelMessages) {
    mount();
    messagesEl.innerHTML = '';
    toolChips.clear();
    currentAssistantEl = null;
    for (const message of modelMessages || []) {
      if (message.role !== 'user' && message.role !== 'assistant') continue;
      const messageText = typeof message.content === 'string'
        ? message.content
        : (message.content || []).filter((part) => part.type === 'text').map((part) => part.text).join('');
      if (messageText) addMessage(message.role, messageText);
    }
    if (!messagesEl.children.length) {
      const empty = document.createElement('div');
      empty.className = 'ga-chat-empty';
      empty.textContent = 'Agent session restored. Continuing on this page…';
      messagesEl.appendChild(empty);
    }
  }

  async function sendCurrentMessage() {
    const text = inputEl.value.trim();
    if (!text || sendButton.disabled) return;
    inputEl.value = '';
    addMessage('user', text);
    currentAssistantEl = null;
    sendButton.disabled = true;
    const { platform, jobInfo } = getContext() || {};
    try {
      await AgentController.sendChatMessage(text, platform, jobInfo, handleAgentEvent);
      if (currentAssistantEl && !currentAssistantEl.textContent) currentAssistantEl.remove();
    } catch (error) {
      addMessage('assistant', `I couldn't complete that request: ${error.message}`);
    } finally {
      currentAssistantEl = null;
      sendButton.disabled = false;
      inputEl.focus();
    }
  }

  function mount(anchorEl = document.body, contextProvider) {
    if (contextProvider) getContext = contextProvider;
    if (rootEl) return rootEl;
    injectStyles();
    rootEl = document.createElement('section');
    rootEl.id = 'goapply-chat-root';
    rootEl.setAttribute('aria-label', 'GoApply AI chat');
    rootEl.innerHTML = `
      <div class="ga-chat-header">
        <div><div class="ga-chat-title">💬 Ask GoApply AI</div><div style="font-size:11px;color:#6B7C93;">Review and fill — you always submit</div></div>
        <button class="ga-chat-close" type="button" aria-label="Close chat">×</button>
      </div>
      <div class="ga-chat-messages" aria-live="polite"><div class="ga-chat-empty">Ask about this application, request help with a field, or continue through a multi-step form.</div></div>
      <div class="ga-chat-compose">
        <textarea class="ga-chat-input" rows="1" placeholder="Ask GoApply AI…" aria-label="Message"></textarea>
        <button class="ga-chat-send" type="button">Send</button>
      </div>
    `;
    anchorEl.appendChild(rootEl);
    messagesEl = rootEl.querySelector('.ga-chat-messages');
    inputEl = rootEl.querySelector('.ga-chat-input');
    sendButton = rootEl.querySelector('.ga-chat-send');
    rootEl.querySelector('.ga-chat-close').addEventListener('click', close);
    sendButton.addEventListener('click', sendCurrentMessage);
    inputEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendCurrentMessage();
      }
    });
    return rootEl;
  }

  function open() {
    mount();
    rootEl.style.display = 'flex';
    inputEl?.focus();
  }

  function close() {
    if (rootEl) rootEl.style.display = 'none';
  }

  function toggle() {
    mount();
    if (rootEl.style.display === 'flex') close();
    else open();
  }

  return { mount, open, close, toggle, beginAssistantMessage, handleAgentEvent, restoreMessages };
})();
