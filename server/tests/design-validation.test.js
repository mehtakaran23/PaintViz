import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DesignValidationError,
  normalizeDesignPayload,
  ownDesignQuery,
} from '../src/services/design.service.js'
import { validateImageBytes } from '../src/middleware/image-upload.middleware.js'
import Design from '../src/models/Design.js'

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

test('accepts legacy flat wall selections without region metadata', () => {
  const legacyPayload = {
    ...validPayload,
    wallSelections: [{
      type: 'polygon',
      points: validPayload.wallSelections[0].points,
    }],
  }
  const normalized = normalizeDesignPayload(legacyPayload)
  assert.deepEqual(normalized.wallSelections, legacyPayload.wallSelections)
})

test('preserves multiple region identities and colours', () => {
  const multiRegionPayload = {
    ...validPayload,
    wallSelections: [
      ...validPayload.wallSelections,
      {
        type: 'brush',
        mode: 'brush',
        size: 0.04,
        regionId: 'wall-2',
        name: 'Second wall',
        color: '#6A8294',
        points: [{ x: 0.1, y: 0.2 }, { x: 0.2, y: 0.3 }],
      },
    ],
  }
  const normalized = normalizeDesignPayload(multiRegionPayload)
  assert.equal(normalized.wallSelections[0].regionId, 'wall-1')
  assert.equal(normalized.wallSelections[1].regionId, 'wall-2')
  assert.equal(normalized.wallSelections[1].color, '#6A8294')
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

test('scopes design queries to the authenticated owner', () => {
  const userId = '507f1f77bcf86cd799439011'
  const designId = '507f191e810c19729de860ea'
  const query = ownDesignQuery(userId, designId)
  assert.deepEqual(query.getFilter(), { _id: designId, user: userId })
})

test('rejects an image whose verified dimensions exceed the working limit', () => {
  const bytes = Buffer.alloc(24)
  bytes[0] = 0x89
  bytes[1] = 0x50
  bytes[2] = 0x4e
  bytes[3] = 0x47
  bytes[4] = 0x0d
  bytes[5] = 0x0a
  bytes[6] = 0x1a
  bytes[7] = 0x0a
  bytes.writeUInt32BE(9000, 16)
  bytes.writeUInt32BE(1000, 20)
  assert.throws(
    () => validateImageBytes({ buffer: bytes, mimetype: 'image/png' }),
    /8000px per side/,
  )
})

test('Mongoose design schema bounds wall selections and points', async () => {
  const design = new Design({
    user: '507f1f77bcf86cd799439011',
    title: 'Bounded design',
    originalImageUrl: 'https://res.cloudinary.com/demo/image/upload/room.jpg',
    wallSelections: [{
      type: 'polygon',
      points: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    }],
  })
  await assert.rejects(() => design.validate(), /polygon selection must contain at least 3 points/)
})

test('rejects unsupported editor settings instead of silently defaulting', () => {
  assert.throws(
    () => normalizeDesignPayload({ ...validPayload, editorSettings: { tool: 'magic' } }),
    /tool must be polygon, brush, or eraser/,
  )
})
