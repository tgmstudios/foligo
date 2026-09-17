import test from 'node:test'
import assert from 'node:assert/strict'
import { getDashboardRedirect } from '../utils/dashboard-routing.js'

test('redirects legacy device links to the canonical dashboard and preserves query values', () => {
  assert.equal(
    getDashboardRedirect('https://foligo.tech/auth/link-device?code=P6TN8L'),
    'https://app.foligo.tech/auth/link-device?code=P6TN8L',
  )
})

test('redirects marketing login and signup routes to the canonical dashboard', () => {
  assert.equal(getDashboardRedirect('https://foligo.tech/login?next=%2Fgoapply'), 'https://app.foligo.tech/login?next=%2Fgoapply')
  assert.equal(getDashboardRedirect('https://www.foligo.tech/signup'), 'https://app.foligo.tech/signup')
})

test('does not redirect public portfolio routes or unrecognized hosts', () => {
  assert.equal(getDashboardRedirect('https://foligo.tech/pricing'), null)
  assert.equal(getDashboardRedirect('https://alex.foligo.tech/auth/link-device?code=P6TN8L'), null)
})
