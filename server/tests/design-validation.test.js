import assert from 'node:assert/strict'
import test from 'node:test'
import { DesignValidationError, normalizeDesignPayload } from '../src/services/design.service.js'

const validPayload = {
  title: 'Living room',
  originalImageUrl: 'https://res.cloudinary.com/demo/image/upload/room.jpg',
  originalImagePublicId: 'paintviz/users/user-1/design-assets/original-123',
  processedImagePublicId: 'paintviz/users/user-1/design-assets/processed-123',
  selectedColors: [{ colorId: 'green-sage', hexCode: '#A8B29C' }],
  wallSelections: [{
    type: 'polygon',
    regionId: 'wall-1',
    name: 'Feature wall',
    color: '#A8B29C',
    points: [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.1 }, { x: 0.9, y: 0.9 }],
  }],
}

test('normalizes a valid region design payload', () => {
  const normalized = normalizeDesignPayload(validPayload)
  assert.equal(normalized.originalImageUrl, validPayload.originalImageUrl)
  assert.equal(normalized.wallSelections[0].color, '#A8B29C')
  assert.equal(normalized.wallSelections[0].points[2].y, 0.9)
  assert.equal(normalized.originalImagePublicId, validPayload.originalImagePublicId)
})

test('rejects non-Cloudinary, lookalike, and port-qualified image URLs', () => {
  for (const originalImageUrl of [
    'http://example.com/room.jpg',
    'https://evil.cloudinary.com.example/room.jpg',
    'https://res.cloudinary.com:443/demo/image/upload/room.jpg',
  ]) {
    assert.throws(
      () => normalizeDesignPayload({ ...validPayload, originalImageUrl }),
      (error) => error instanceof DesignValidationError && error.statusCode === 400,
    )
  }
})

test('rejects non-finite, out-of-range, and malformed selections', () => {
  const invalidSelections = [
    [{ ...validPayload.wallSelections[0], points: [{ x: Number.NaN, y: 0.2 }, { x: 0.2, y: 0.2 }, { x: 0.3, y: 0.3 }] }],
    [{ ...validPayload.wallSelections[0], points: [{ x: 1.1, y: 0.2 }, { x: 0.2, y: 0.2 }, { x: 0.3, y: 0.3 }] }],
    [{ ...validPayload.wallSelections[0], points: [{ x: 0.2, y: 0.2 }, { x: 0.3, y: 0.3 }] }],
    [{ ...validPayload.wallSelections[0], points: 'not-an-array' }],
  ]
  for (const wallSelections of invalidSelections) {
    assert.throws(
      () => normalizeDesignPayload({ ...validPayload, wallSelections }),
      (error) => error instanceof DesignValidationError,
    )
  }
})

test('rejects malformed public IDs and non-finite editor settings', () => {
  assert.throws(
    () => normalizeDesignPayload({ ...validPayload, originalImagePublicId: '../shared-asset' }),
    (error) => error instanceof DesignValidationError,
  )
  assert.throws(
    () => normalizeDesignPayload({ ...validPayload, editorSettings: { blendStrength: Number.POSITIVE_INFINITY } }),
    (error) => error instanceof DesignValidationError,
  )
})
