import test from 'node:test'
import assert from 'node:assert/strict'
import { getDomainMigrationRedirect } from '../utils/domain-migration.js'

test('redirects the bare apex domain to the new TLD, preserving path and query', () => {
  assert.equal(getDomainMigrationRedirect('https://foligo.tech/pricing?ref=x'), 'https://foligo.org/pricing?ref=x')
})

test('redirects www to the new TLD', () => {
  assert.equal(getDomainMigrationRedirect('https://www.foligo.tech/'), 'https://www.foligo.org/')
})

test('redirects a portfolio subdomain to the new TLD, preserving the subdomain', () => {
  assert.equal(
    getDomainMigrationRedirect('https://alex.foligo.tech/projects/my-project'),
    'https://alex.foligo.org/projects/my-project',
  )
})

test('redirects a multi-level legacy subdomain', () => {
  assert.equal(getDomainMigrationRedirect('https://api.foligo.tech/analytics.js'), 'https://api.foligo.org/analytics.js')
})

test('does not redirect requests already on the new TLD', () => {
  assert.equal(getDomainMigrationRedirect('https://foligo.org/pricing'), null)
  assert.equal(getDomainMigrationRedirect('https://alex.foligo.org/projects/x'), null)
})

test('does not redirect unrelated hosts', () => {
  assert.equal(getDomainMigrationRedirect('https://localhost:3000/'), null)
  assert.equal(getDomainMigrationRedirect('https://example.com/'), null)
  assert.equal(getDomainMigrationRedirect('https://notfoligo.tech/'), null)
})
