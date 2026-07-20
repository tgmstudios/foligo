const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadApiClient(capabilities) {
  const storage = {
    foligoToken: 'test-token',
    goapplyEnv: 'production',
  };
  const sendMessage = jest.fn(async ({ url }) => {
    if (url.endsWith('/api/ai/agent/capabilities')) {
      return {
        ok: true,
        status: 200,
        text: JSON.stringify(capabilities),
      };
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  const chrome = {
    storage: {
      local: {
        get: jest.fn(async (keys) => {
          if (typeof keys === 'string') return { [keys]: storage[keys] };
          const list = Array.isArray(keys) ? keys : Object.keys(storage);
          return Object.fromEntries(list.filter((key) => key in storage).map((key) => [key, storage[key]]));
        }),
        set: jest.fn(async (values) => Object.assign(storage, values)),
        remove: jest.fn(async (keys) => {
          for (const key of Array.isArray(keys) ? keys : [keys]) delete storage[key];
        }),
      },
    },
    runtime: {
      sendMessage,
      connect: jest.fn(),
    },
  };
  const source = fs.readFileSync(
    path.resolve(__dirname, '../../../../extension/core/api.js'),
    'utf8',
  );
  const context = vm.createContext({ chrome, console, Blob, Uint8Array, atob, btoa, URL, setTimeout });
  vm.runInContext(`${source}\nglobalThis.__GoApplyAPI = GoApplyAPI;`, context);
  return { api: context.__GoApplyAPI, sendMessage };
}

const REQUIRED_TOOLS = [
  'read_page',
  'form_input',
  'computer',
  'browser_batch',
  'tabs_context_mcp',
  'tabs_create_mcp',
  'tabs_close_mcp',
  'list_foligo_documents',
  'inspect_foligo_document',
  'attach_document',
  'track_current_job',
  'list_tracked_jobs',
  'update_job_status',
];

describe('extension API browser-agent compatibility handshake', () => {
  test('negotiates capabilities before constructing a turn request', async () => {
    const { api, sendMessage } = loadApiClient({
      agentIdentity: 'foligo-browser-agent',
      protocolVersion: 2,
      tools: REQUIRED_TOOLS,
    });

    const request = await api.buildAgentRequest({ mode: 'chat', messages: [{ role: 'user', content: 'go' }] });

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage.mock.calls[0][0].url).toBe('https://api.foligo.tech/api/ai/agent/capabilities');
    expect(request.url).toBe('https://api.foligo.tech/api/ai/agent/turn');
    expect(request.options.headers['X-Foligo-Agent-Protocol']).toBe('2');
    expect(JSON.parse(request.options.body)).toMatchObject({
      mode: 'chat',
      clientAgentProtocolVersion: 2,
    });
  });

  test('refuses an obsolete backend instead of sending a crippled agent turn', async () => {
    const { api, sendMessage } = loadApiClient({
      agentIdentity: 'goapply-application-assistant',
      protocolVersion: 1,
      tools: ['set_field_value', 'click_element'],
    });

    await expect(api.buildAgentRequest({ mode: 'chat', messages: [{ role: 'user', content: 'go' }] }))
      .rejects.toMatchObject({ code: 'AGENT_BACKEND_INCOMPATIBLE' });
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage.mock.calls[0][0].url).not.toContain('/turn');
  });
});
