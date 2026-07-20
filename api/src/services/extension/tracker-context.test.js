const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadTracker({ url, title, bodyText = '', jsonLd = [], selectors = {}, goApplyAPI }) {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../../../../extension/core/tracker.js'),
    'utf8',
  );
  const document = {
    title,
    body: { innerText: bodyText },
    querySelectorAll: (selector) => selector === 'script[type="application/ld+json"]'
      ? jsonLd.map((value) => ({ textContent: JSON.stringify(value) }))
      : [],
    querySelector: (selector) => {
      const entry = selectors[selector];
      if (!entry) return null;
      return {
        textContent: entry.textContent || '',
        getAttribute: (name) => entry[name] || '',
      };
    },
  };
  const context = {
    window: { location: { href: url } },
    document,
    chrome: { storage: { local: {} } },
    GoApplyAPI: goApplyAPI,
    URL,
    console,
    MutationObserver: class {},
  };
  vm.runInNewContext(`${source}\nglobalThis.__tracker = Tracker;`, context);
  return context.__tracker;
}

describe('extension job-page context detection', () => {
  test('finds a JobPosting nested inside JSON-LD @graph data', () => {
    const tracker = loadTracker({
      url: 'https://careers.example.com/openings/123',
      title: 'Apply',
      jsonLd: [{
        '@context': 'https://schema.org',
        '@graph': [{
          '@type': 'JobPosting',
          title: 'Platform Engineer',
          hiringOrganization: { name: 'Example Labs' },
          jobLocation: { address: { addressLocality: 'Austin', addressRegion: 'TX' } },
        }],
      }],
    });

    const info = tracker.extractJobInfo();
    expect(info).toMatchObject({
      company: 'Example Labs',
      jobTitle: 'Platform Engineer',
      location: 'Austin, TX',
      isLikelyJobPage: true,
    });
    expect(tracker.isTrackableJobInfo(info)).toBe(true);
  });

  test('does not treat ordinary Open Graph metadata as a trackable job', () => {
    const tracker = loadTracker({
      url: 'https://example.com/news/product-update',
      title: 'Product update',
      bodyText: 'Read the latest product news.',
      selectors: {
        'meta[property="og:title"], meta[name="twitter:title"]': { content: 'Product update' },
        'meta[property="og:site_name"]': { content: 'Example News' },
      },
    });

    const info = tracker.extractJobInfo();
    expect(info.isLikelyJobPage).toBe(false);
    expect(tracker.isTrackableJobInfo(info)).toBe(false);
  });

  test('recognizes a LinkedIn job without JSON-LD metadata', () => {
    const tracker = loadTracker({
      url: 'https://www.linkedin.com/jobs/view/12345',
      title: 'Example Labs hiring Platform Engineer in Austin | LinkedIn',
      selectors: {
        '.job-details-jobs-unified-top-card__job-title h1, .jobs-unified-top-card__job-title, h1': {
          textContent: 'Platform Engineer',
        },
        '.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, [class*="company-name" i]': {
          textContent: 'Example Labs',
        },
      },
    });

    const info = tracker.extractJobInfo();
    expect(info).toMatchObject({
      platform: 'LinkedIn',
      company: 'Example Labs',
      jobTitle: 'Platform Engineer',
      isLikelyJobPage: true,
    });
    expect(tracker.isTrackableJobInfo(info)).toBe(true);
  });

  test('recovers the exact Greenhouse company and position from its full document title', () => {
    const tracker = loadTracker({
      url: 'https://job-boards.greenhouse.io/testcanonical123/jobs/7772295',
      title: 'Job Application for test job at Test Board',
    });

    const info = tracker.extractJobInfo();
    expect(info).toMatchObject({
      platform: 'Greenhouse',
      company: 'Test Board',
      jobTitle: 'test job',
      isLikelyJobPage: true,
    });
    expect(tracker.isTrackableJobInfo(info)).toBe(true);
  });

  test('uses the Greenhouse logo alt text when document-title metadata is reduced', () => {
    const tracker = loadTracker({
      url: 'https://job-boards.greenhouse.io/testcanonical123/jobs/7772295',
      title: 'test job',
      selectors: {
        'h1.app-title, h1': { textContent: 'test job' },
        'a.logo img[alt], .image-container img[alt]': { alt: 'Test Board Logo' },
      },
    });

    expect(tracker.extractJobInfo()).toMatchObject({
      company: 'Test Board',
      jobTitle: 'test job',
      isLikelyJobPage: true,
    });
  });

  test('uses board-scoped ATS identity and removes tracking parameters', () => {
    const tracker = loadTracker({
      url: 'https://job-boards.greenhouse.io/testcanonical123/jobs/7772295?gh_src=email&utm_source=test',
      title: 'test job - Test Board',
    });
    const current = tracker.deriveJobIdentity(
      'https://job-boards.greenhouse.io/testcanonical123/jobs/7772295?gh_src=email&utm_source=test',
    );
    const sameJob = tracker.deriveJobIdentity(
      'https://job-boards.greenhouse.io/testcanonical123/jobs/7772295',
    );
    const otherBoard = tracker.deriveJobIdentity(
      'https://job-boards.greenhouse.io/anotherboard/jobs/7772295',
    );

    expect(current.identityKey).toBe('greenhouse:testcanonical123:7772295');
    expect(current.canonicalUrl).toBe(sameJob.canonicalUrl);
    expect(otherBoard.identityKey).not.toBe(current.identityKey);
  });

  test('repairs stale board metadata from a verified live job identity', async () => {
    const staleJob = {
      id: 'job-1',
      company: 'iCapital: Re-reach out to Mario about position',
      position: 'test job',
      url: 'https://job-boards.greenhouse.io/testcanonical123/jobs/7772295?gh_src=old',
      status: 'rejected',
    };
    const updateJob = jest.fn(async (_id, data) => ({ ...staleJob, ...data }));
    const tracker = loadTracker({
      url: 'https://job-boards.greenhouse.io/testcanonical123/jobs/7772295',
      title: 'Job Application for test job at Test Board',
      goApplyAPI: {
        getJobs: jest.fn().mockResolvedValue([staleJob]),
        updateJob,
      },
    });

    const info = tracker.extractJobInfo();
    const job = await tracker.getTrackedApplication(info, { reconcile: true });
    expect(updateJob).toHaveBeenCalledWith('job-1', {
      company: 'Test Board',
      url: 'https://job-boards.greenhouse.io/testcanonical123/jobs/7772295',
    });
    expect(job).toMatchObject({
      company: 'Test Board',
      position: 'test job',
      status: 'rejected',
      identityReconciled: true,
    });
  });

  test('uses a declared canonical requisition URL on a shared Workday apply path', () => {
    const tracker = loadTracker({
      url: 'https://acme.myworkdayjobs.com/en-US/jobs/apply',
      title: 'Software Engineer at Acme',
      selectors: {
        'link[rel="canonical"]': {
          href: 'https://acme.myworkdayjobs.com/en-US/job/Engineering/Software-Engineer_R12345/apply',
        },
      },
    });

    const info = tracker.extractJobInfo();
    expect(info.pageUrl).toBe('https://acme.myworkdayjobs.com/en-US/jobs/apply');
    expect(info.canonicalUrl).toContain('Software-Engineer_R12345/apply');
    expect(info.identityStrength).toBe('strong');
    expect(info.identityKey).toContain('software engineer r12345');
  });

  test('never joins different roles through the same weak application URL', () => {
    const tracker = loadTracker({
      url: 'https://careers.example.com/apply',
      title: 'Apply',
    });
    const jobs = [
      { id: 'job-a', company: 'Acme', position: 'Frontend Engineer', url: 'https://careers.example.com/apply' },
      { id: 'job-b', company: 'Acme', position: 'Backend Engineer', url: 'https://careers.example.com/apply' },
    ];

    expect(tracker.findBestTrackedApplication(jobs, {
      canonicalUrl: 'https://careers.example.com/apply',
      company: 'Acme',
      jobTitle: 'Backend Engineer',
    })?.id).toBe('job-b');
    expect(tracker.findBestTrackedApplication(jobs, {
      canonicalUrl: 'https://careers.example.com/apply',
      company: 'Acme',
      jobTitle: 'Product Manager',
    })).toBeNull();
    expect(tracker.findBestTrackedApplication(jobs, {
      canonicalUrl: 'https://careers.example.com/apply',
      company: 'Acme',
    })).toBeNull();
  });
});
