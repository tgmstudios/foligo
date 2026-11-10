import test from 'node:test'
import assert from 'node:assert/strict'
import { createCheckoutAttemptStore } from './checkoutAttempt.js'

test('retry reuses identity while separate plans have independent identities', () => {
  const ids = ['attempt-a', 'attempt-b']
  const attempts = createCheckoutAttemptStore(() => ids.shift())
  const first = attempts.get('pro')
  assert.equal(attempts.get('pro'), first)
  assert.equal(attempts.get('team'), 'attempt-b')
})

test('retiring a completed, expired, or successful attempt creates a new identity', () => {
  for (const outcome of ['completed-or-expired', 'success-redirect']) {
    const ids = ['old', 'new']
    const attempts = createCheckoutAttemptStore(() => ids.shift())
    assert.equal(attempts.get(outcome), 'old')
    attempts.clear(outcome)
    assert.equal(attempts.get(outcome), 'new')
  }
})
