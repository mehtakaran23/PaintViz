import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { getReadiness } from '../src/controllers/health.controller.js'

test('database readiness reports unavailable when disconnected', async () => {
  const originalState = mongoose.connection.readyState
  const response = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }

  mongoose.connection.readyState = 0
  try {
    await getReadiness({}, response)
  } finally {
    mongoose.connection.readyState = originalState
  }

  assert.equal(response.statusCode, 503)
  assert.deepEqual(response.body, { status: 'not_ready' })
})
