import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeSsoProviders } from '../src/utils/ssoProviders.ts'

const valid = {
  id: 'p1',
  name: 'Google',
  providerId: 'google',
  icon: 'G',
  buttonColor: '#4285f4',
  buttonText: 'Continue with Google',
}

test('SPA HTML fallback string yields no providers (not one per character)', () => {
  assert.deepEqual(normalizeSsoProviders('<!doctype html><html></html>'), [])
})

test('non-array values yield no providers', () => {
  assert.deepEqual(normalizeSsoProviders(null), [])
  assert.deepEqual(normalizeSsoProviders(undefined), [])
  assert.deepEqual(normalizeSsoProviders({ providers: [valid] }), [])
  assert.deepEqual(normalizeSsoProviders(42), [])
})

test('malformed array entries are dropped, valid ones kept', () => {
  const result = normalizeSsoProviders([
    null,
    'x',
    42,
    [],
    {},
    { id: 'a', name: 'NoProviderId' },
    { id: 'b', providerId: '', name: 'Empty' },
    { id: 'c', providerId: 'okta' },
    { id: 7, providerId: 'bad-id', name: 'N' },
    valid,
  ])
  assert.deepEqual(result, [valid])
})

test('valid array preserves display fields and providerId; nullable fields normalize to null', () => {
  const result = normalizeSsoProviders([
    valid,
    { id: 'p2', name: 'Okta', providerId: 'okta', icon: null, buttonColor: null, buttonText: null, extra: 1 },
  ])
  assert.deepEqual(result, [
    valid,
    { id: 'p2', name: 'Okta', providerId: 'okta', icon: null, buttonColor: null, buttonText: null },
  ])
})
