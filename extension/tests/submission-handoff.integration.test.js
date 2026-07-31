const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const extensionRoot = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(extensionRoot, ...parts), 'utf8');

test('loads submission state before the main controller consumes it', () => {
  const manifest = JSON.parse(read('manifest.json'));
  const scripts = manifest.content_scripts[0].js;
  assert.ok(scripts.includes('core/submission-state.js'));
  assert.ok(scripts.indexOf('core/submission-state.js') < scripts.indexOf('core/main.js'));
});

test('persists a pending final submission in the background worker and makes it available to the next document', () => {
  const background = read('background.js');
  assert.match(background, /action === 'submission-pending'/);
  assert.match(background, /storage\.session\.set\(\{ goapplyPendingSubmission: message\.pending \}\)/);
  assert.match(background, /action === 'submission-read'/);
  assert.match(background, /pending: stored\.goapplyPendingSubmission \|\| null/);
  assert.match(background, /action === 'submission-clear'/);
});

test('only promotes a job after a user final-click marker and a separate confirmation-page success signal', () => {
  const main = read('core', 'main.js');
  assert.match(main, /persistPendingSubmission\(info\)/);
  assert.match(main, /SubmissionState\.shouldPromote\(pending, Tracker\.detectSuccess\(platform\?\.config\)\)/);
  assert.match(main, /await recoverPendingSubmission\(\)/);
  assert.match(main, /await clearPendingSubmission\(\)/);
});
