const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

function loadSubmissionState() {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'core', 'submission-state.js'),
    'utf8',
  );
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${source}; globalThis.__SubmissionState = SubmissionState;`, context);
  return context.__SubmissionState;
}

test('creates a minimal pending submission record that preserves job identity', () => {
  const SubmissionState = loadSubmissionState();
  const pending = SubmissionState.create({
    canonicalUrl: 'https://jobs.example.com/role/123',
    company: 'Example Inc.',
    jobTitle: 'Software Engineer',
    identityKey: 'example:123',
  }, 1_000);

  assert.deepEqual(JSON.parse(JSON.stringify(pending)), {
    jobInfo: {
      canonicalUrl: 'https://jobs.example.com/role/123',
      company: 'Example Inc.',
      jobTitle: 'Software Engineer',
      identityKey: 'example:123',
    },
    submittedAt: 1_000,
  });
});

test('only accepts pending submissions inside the recovery window', () => {
  const SubmissionState = loadSubmissionState();
  const pending = SubmissionState.create({ company: 'Example', jobTitle: 'Engineer' }, 1_000);

  assert.equal(SubmissionState.isRecoverable(pending, 1_000 + SubmissionState.RECOVERY_WINDOW_MS), true);
  assert.equal(SubmissionState.isRecoverable(pending, 1_001 + SubmissionState.RECOVERY_WINDOW_MS), false);
  assert.equal(SubmissionState.isRecoverable({ submittedAt: 'not-a-date' }, 1_000), false);
});

test('does not allow a missing or expired marker to promote a job after a confirmation page loads', () => {
  const SubmissionState = loadSubmissionState();
  const pending = SubmissionState.create({ company: 'Example', jobTitle: 'Engineer' }, 1_000);

  assert.equal(SubmissionState.shouldPromote(pending, true, 1_500), true);
  assert.equal(SubmissionState.shouldPromote(pending, false, 1_500), false);
  assert.equal(SubmissionState.shouldPromote(pending, true, 1_001 + SubmissionState.RECOVERY_WINDOW_MS), false);
  assert.equal(SubmissionState.shouldPromote(null, true, 1_500), false);
});
