import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  isContentPublished,
  normalizeProjectLinks,
  parseContentType,
} from '../src/utils/contentHelpers.ts'

test('content is published only when status is PUBLISHED (API Content has no isPublished field)', () => {
  assert.equal(isContentPublished({ status: 'PUBLISHED' }), true)
  assert.equal(isContentPublished({ status: 'DRAFT' }), false)
  assert.equal(isContentPublished({ status: 'HIDDEN' }), false)
  assert.equal(isContentPublished({ status: 'REVISION' }), false)
})

test('normalizeProjectLinks fills every key so form inputs and .other are never undefined', () => {
  assert.deepEqual(normalizeProjectLinks(undefined), { github: '', devpost: '', other: [] })
  assert.deepEqual(normalizeProjectLinks(null), { github: '', devpost: '', other: [] })
  assert.deepEqual(normalizeProjectLinks({ github: 'g' }), { github: 'g', devpost: '', other: [] })
  assert.deepEqual(
    normalizeProjectLinks({ github: 'g', devpost: 'd', other: ['x'] }),
    { github: 'g', devpost: 'd', other: ['x'] },
  )
})

test('parseContentType upper-cases valid route params and rejects unknown types', () => {
  assert.equal(parseContentType('blog'), 'BLOG')
  assert.equal(parseContentType('Project'), 'PROJECT')
  assert.equal(parseContentType('EXPERIENCE'), 'EXPERIENCE')
  assert.equal(parseContentType('skill'), 'SKILL')
  assert.equal(parseContentType('nonsense'), null)
  assert.equal(parseContentType(''), null)
})
