jest.mock('ai', () => ({
  tool: jest.fn((definition) => definition),
}));

const fs = require('node:fs');
const path = require('node:path');
const {
  createExtensionAgentServerTools,
  CLIENT_AGENT_TOOL_DEFS,
  EXTENSION_AGENT_PROTOCOL_VERSION,
  getExtensionAgentCapabilities,
} = require('./extension-agent-tools');

describe('extension browser-agent tool contracts', () => {
  test('requires an explicit Foligo catalog selection before attachment', () => {
    const listResult = CLIENT_AGENT_TOOL_DEFS.list_foligo_documents.inputSchema.safeParse({
      kind: 'resume',
    });
    expect(listResult.success).toBe(true);

    const missingDocument = CLIENT_AGENT_TOOL_DEFS.attach_document.inputSchema.safeParse({
      fieldRef: 'f2',
      kind: 'resume',
    });
    expect(missingDocument.success).toBe(false);

    const selectedDocument = CLIENT_AGENT_TOOL_DEFS.attach_document.inputSchema.safeParse({
      fieldRef: 'f2',
      kind: 'resume',
      documentId: 'resume-123',
    });
    expect(selectedDocument.success).toBe(true);
  });

  test('exposes Claude-style page, tab, batch, and physical-input controls', () => {
    expect(Object.keys(CLIENT_AGENT_TOOL_DEFS)).toEqual(expect.arrayContaining([
      'read_page',
      'inspect_foligo_document',
      'track_current_job',
      'list_tracked_jobs',
      'update_job_status',
      'find',
      'form_input',
      'get_page_text',
      'javascript_tool',
      'read_console_messages',
      'read_network_requests',
      'upload_image',
      'computer',
      'browser_batch',
      'tabs_context_mcp',
      'tabs_create_mcp',
      'tabs_close_mcp',
      'resize_window',
    ]));

    for (const action of ['left_click', 'right_click', 'double_click', 'triple_click', 'hover', 'left_click_drag', 'scroll', 'scroll_to', 'type', 'key', 'wait', 'screenshot']) {
      const result = CLIENT_AGENT_TOOL_DEFS.computer.inputSchema.safeParse({ action });
      expect(result.success).toBe(true);
    }
  });

  test('advertises a versioned full browser-agent capability catalog', () => {
    const capabilities = getExtensionAgentCapabilities({}, 'user-1', {});
    expect(EXTENSION_AGENT_PROTOCOL_VERSION).toBeGreaterThanOrEqual(2);
    expect(capabilities).toMatchObject({
      agentIdentity: 'foligo-browser-agent',
      protocolVersion: EXTENSION_AGENT_PROTOCOL_VERSION,
    });
    expect(capabilities.tools).toEqual(expect.arrayContaining([
      'computer',
      'browser_batch',
      'tabs_context_mcp',
      'list_foligo_documents',
      'attach_document',
      'track_current_job',
      'update_job_status',
    ]));
    expect(capabilities.serverTools).toEqual(expect.arrayContaining([
      'track_current_job',
      'list_tracked_jobs',
      'update_job_status',
    ]));
  });

  test('accepts sequential browser batches with standalone tool inputs', () => {
    const result = CLIENT_AGENT_TOOL_DEFS.browser_batch.inputSchema.safeParse({
      actions: [
        { name: 'computer', input: { action: 'left_click', coordinate: [20, 30] } },
        { name: 'computer', input: { action: 'type', text: 'hello' } },
        { name: 'computer', input: { action: 'key', key: 'Enter' } },
      ],
    });
    expect(result.success).toBe(true);
  });

  test('has no eager document-attachment preflight in the extension controller', () => {
    const controller = fs.readFileSync(
      path.resolve(__dirname, '../../../../extension/core/agent-controller.js'),
      'utf8',
    );
    const filler = fs.readFileSync(
      path.resolve(__dirname, '../../../../extension/core/filler.js'),
      'utf8',
    );

    expect(controller).not.toContain('attachDetectedDocuments');
    expect(controller).toContain('toolListFoligoDocuments');
    expect(controller).toContain('toolInspectFoligoDocument');
    expect(controller).not.toContain('currentJobInfo = currentJobInfo || jobInfo');
    expect(controller).toContain('if (jobInfo) currentJobInfo = jobInfo');
    expect(filler).toContain("note: 'No Foligo document was explicitly selected for this field.'");
    expect(filler).toContain("selectedId === documentId && selectedSource === 'user' ? 'user' : 'model'");
  });

  test('restricts AI job status changes to the Foligo pipeline', () => {
    expect(CLIENT_AGENT_TOOL_DEFS.track_current_job.inputSchema.safeParse({
      company: 'Example',
      position: 'Engineer',
      status: 'saved',
    }).success).toBe(true);
    expect(CLIENT_AGENT_TOOL_DEFS.update_job_status.inputSchema.safeParse({
      jobId: 'job-1',
      status: 'interview',
    }).success).toBe(true);
    expect(CLIENT_AGENT_TOOL_DEFS.update_job_status.inputSchema.safeParse({
      jobId: 'job-1',
      status: 'maybe',
    }).success).toBe(false);
  });

  test('provides executable tracking tools that preserve then explicitly change status', async () => {
    const rejectedJob = {
      id: 'job-1',
      userId: 'user-1',
      company: 'Test Board',
      position: 'test job',
      url: 'https://job-boards.greenhouse.io/testcanonical123/jobs/7772295',
      status: 'rejected',
      tags: [],
    };
    const prisma = {
      jobApplication: {
        findMany: jest.fn().mockResolvedValue([rejectedJob]),
        findFirst: jest.fn().mockResolvedValue(rejectedJob),
        create: jest.fn(),
        update: jest.fn()
          .mockResolvedValueOnce(rejectedJob)
          .mockResolvedValueOnce({ ...rejectedJob, status: 'saved' }),
      },
    };
    const tools = createExtensionAgentServerTools(prisma, 'user-1', {}, {
      url: rejectedJob.url,
      jobInfo: { company: 'Test Board', jobTitle: 'test job' },
    });

    const tracked = await tools.track_current_job.execute({
      company: 'Test Board',
      position: 'test job',
      url: rejectedJob.url,
      status: 'saved',
    });
    expect(tracked.tracked).toBe(true);
    expect(tracked.job.status).toBe('rejected');

    const updated = await tools.update_job_status.execute({ status: 'saved' });
    expect(updated.updated).toBe(true);
    expect(updated.previousStatus).toBe('rejected');
    expect(updated.status).toBe('saved');
  });

  test('server tracking tools create a new URL-matched board card', async () => {
    const prisma = {
      jobApplication: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        create: jest.fn(async ({ data }) => ({ id: 'job-2', ...data })),
        update: jest.fn(),
      },
    };
    const tools = createExtensionAgentServerTools(prisma, 'user-1', {}, {
      url: 'https://example.com/jobs/2',
    });

    const result = await tools.track_current_job.execute({
      company: 'Example',
      position: 'Engineer',
      status: 'saved',
    });
    expect(result).toMatchObject({
      tracked: true,
      created: true,
      job: { company: 'Example', position: 'Engineer', status: 'saved' },
    });
  });

  test('server tracking never reuses a weak shared URL for another role', async () => {
    const frontend = {
      id: 'job-front',
      company: 'Acme',
      position: 'Frontend Engineer',
      url: 'https://careers.acme.test/apply',
      status: 'saved',
      tags: [],
    };
    const prisma = {
      jobApplication: {
        findMany: jest.fn().mockResolvedValue([frontend]),
        findFirst: jest.fn(),
        create: jest.fn(async ({ data }) => ({ id: 'job-back', ...data })),
        update: jest.fn(),
      },
    };
    const tools = createExtensionAgentServerTools(prisma, 'user-1', {}, {
      url: 'https://careers.acme.test/apply',
      jobInfo: { company: 'Acme', jobTitle: 'Backend Engineer' },
    });

    const result = await tools.track_current_job.execute({
      company: 'Acme',
      position: 'Backend Engineer',
      url: 'https://careers.acme.test/apply',
      status: 'saved',
    });
    expect(result.created).toBe(true);
    expect(result.job).toMatchObject({ id: 'job-back', position: 'Backend Engineer' });
    expect(prisma.jobApplication.update).not.toHaveBeenCalled();
  });

  test('extension route lets executable server tools override schema-only tracking declarations', () => {
    const route = fs.readFileSync(
      path.resolve(__dirname, '../../routes/ai/extension-agent.js'),
      'utf8',
    );
    const clientSpread = route.indexOf('...CLIENT_AGENT_TOOL_DEFS');
    const serverSpread = route.indexOf('...createExtensionAgentServerTools');
    expect(clientSpread).toBeGreaterThan(-1);
    expect(serverSpread).toBeGreaterThan(clientSpread);
    expect(route).toContain('createExtensionAgentServerTools(prisma, req.user.id, ai, context)');
    expect(route).toContain('registered executable tools in every extension-agent mode');
    expect(route).toContain("router.get('/capabilities'");
    expect(route).toContain("send({ type: 'capabilities'");
  });

  test('extension refuses an old backend before opening an agent turn', () => {
    const apiClient = fs.readFileSync(
      path.resolve(__dirname, '../../../../extension/core/api.js'),
      'utf8',
    );
    expect(apiClient).toContain("request('/api/ai/agent/capabilities')");
    expect(apiClient).toContain('await getAgentCapabilities()');
    expect(apiClient).toContain("'track_current_job'");
    expect(apiClient).toContain("'computer'");
    expect(apiClient).toContain('AGENT_BACKEND_INCOMPATIBLE');
  });

  test('includes the side-panel resume and status selectors', () => {
    const panel = fs.readFileSync(
      path.resolve(__dirname, '../../../../extension/side-panel.html'),
      'utf8',
    );
    const panelScript = fs.readFileSync(
      path.resolve(__dirname, '../../../../extension/side-panel.js'),
      'utf8',
    );
    expect(panel).toContain('id="sp-resume-select"');
    expect(panel).toContain('AI chooses the best résumé');
    expect(panel).toContain('id="sp-job-status"');
    expect(panel).toContain('<option value="interview">Interview</option>');
    expect(panel).toContain('id="sp-track" type="button" disabled');
    expect(panelScript).toContain("addStatusChip(`${currentTrackedJob ? 'Updating' : 'Tracking'} job as ${status}…`, 'job-tracking')");
    expect(panelScript).toContain('AI is identifying the company and job title');
    expect(panelScript).toContain('call track_current_job with the company, position, current page URL');
    expect(panelScript).toContain('currentTrackedJob?.status === pending.status');
  });
});
