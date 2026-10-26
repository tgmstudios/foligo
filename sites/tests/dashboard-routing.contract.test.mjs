import test from 'node:test'
import assert from 'node:assert/strict'
import { getDashboardRedirect } from '../utils/dashboard-routing.js'

test('redirects legacy device links to the canonical dashboard and preserves query values', () => {
  assert.equal(
    getDashboardRedirect('https://foligo.org/auth/link-device?code=P6TN8L'),
    'https://app.foligo.org/auth/link-device?code=P6TN8L',
  )
})

test('redirects marketing login and signup routes to the canonical dashboard', () => {
  assert.equal(getDashboardRedirect('https://foligo.org/login?next=%2Fgoapply'), 'https://app.foligo.org/login?next=%2Fgoapply')
  assert.equal(getDashboardRedirect('https://www.foligo.org/signup'), 'https://app.foligo.org/signup')
})

test('redirects legacy bookmarked dashboard app routes (dashboard/goapply/settings/admin/studio) by prefix', () => {
  assert.equal(getDashboardRedirect('https://foligo.org/dashboard'), 'https://app.foligo.org/dashboard')
  assert.equal(getDashboardRedirect('https://foligo.org/goapply/jobs/123'), 'https://app.foligo.org/goapply/jobs/123')
  assert.equal(getDashboardRedirect('https://foligo.org/settings/site'), 'https://app.foligo.org/settings/site')
  assert.equal(getDashboardRedirect('https://foligo.org/admin/users/42'), 'https://app.foligo.org/admin/users/42')
  assert.equal(getDashboardRedirect('https://foligo.org/studio/resume/9'), 'https://app.foligo.org/studio/resume/9')
  assert.equal(getDashboardRedirect('https://foligo.org/portfolios/abc/media'), 'https://app.foligo.org/portfolios/abc/media')
  assert.equal(getDashboardRedirect('https://foligo.org/onboarding'), 'https://app.foligo.org/onboarding')
  assert.equal(getDashboardRedirect('https://foligo.org/register'), 'https://app.foligo.org/register')
})

test('does not redirect public portfolio routes or unrecognized hosts', () => {
  assert.equal(getDashboardRedirect('https://foligo.org/pricing'), null)
  assert.equal(getDashboardRedirect('https://foligo.org/'), null)
  assert.equal(getDashboardRedirect('https://alex.foligo.org/auth/link-device?code=P6TN8L'), null)
  assert.equal(getDashboardRedirect('https://alex.foligo.org/dashboard'), null)
})

test('does not redirect legacy .tech hosts directly (that TLD migration is handled upstream by domain-migration.js)', () => {
  assert.equal(getDashboardRedirect('https://foligo.tech/auth/link-device?code=P6TN8L'), null)
  assert.equal(getDashboardRedirect('https://foligo.tech/dashboard'), null)
})
