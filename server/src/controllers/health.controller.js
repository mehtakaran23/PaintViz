import mongoose from 'mongoose'

export function getHealth(_request, response) {
  response.status(200).json({ status: 'ok' })
}

export async function getReadiness(_request, response) {
  if (mongoose.connection.readyState !== 1) {
    response.status(503).json({ status: 'not_ready' })
    return
  }

  try {
    await mongoose.connection.db.command({ ping: 1 }, { maxTimeMS: 1000 })
    response.status(200).json({ status: 'ready' })
  } catch {
    response.status(503).json({ status: 'not_ready' })
  }
}
