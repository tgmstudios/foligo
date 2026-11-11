import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getDashboardCtaHref } from '../utils/marketing-cta.js'
import { getDashboardRedirect } from '../utils/dashboard-routing.js'
import { getDomainMigrationRedirect } from '../utils/domain-migration.js'

const landing = readFileSync(new URL('../components/MarketingLanding.vue', import.meta.url), 'utf8')
const template = landing.slice(0, landing.indexOf('<script'))

test('CTA hrefs target the canonical dashboard host directly', () => {
  assert.equal(getDashboardCtaHref('login'), 'https://app.foligo.org/login')
  assert.equal(getDashboardCtaHref('signup', 'https://app.foligo.org/'), 'https://app.foligo.org/signup')
  assert.equal(getDashboardCtaHref('login', 'https://app.foligo.org', { next: '/goapply', ref: ['a', 'b'] }),
    'https://app.foligo.org/login?next=%2Fgoapply&ref=a&ref=b')
  assert.throws(() => getDashboardCtaHref('dashboard'))
})

test('landing template has no apex /login or /signup links and no NuxtLink to them', () => {
  assert.doesNotMatch(template, /(?:to|href)="\/(?:login|signup)/)
  assert.doesNotMatch(template, /<NuxtLink/)
  assert.equal((template.match(/:href="loginHref"/g) || []).length, 3)
  assert.equal((template.match(/:href="signupHref"/g) || []).length, 4)
})

test('legacy apex /login and /signup still redirect (308 contract) to the dashboard with query preserved', () => {
  assert.equal(getDashboardRedirect('https://foligo.org/login?x=1'), 'https://app.foligo.org/login?x=1')
  assert.equal(getDashboardRedirect('https://foligo.org/signup'), 'https://app.foligo.org/signup')
  const migrated = getDomainMigrationRedirect('https://foligo.tech/login?x=1')
  assert.equal(getDashboardRedirect(migrated), 'https://app.foligo.org/login?x=1')
})
