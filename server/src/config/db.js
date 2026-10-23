import mongoose from 'mongoose'
import './env.js'

export async function connectDatabase() {
  const mongodbUri = process.env.MONGODB_URI

  if (!mongodbUri) {
    throw new Error('MONGODB_URI is not configured')
  }

  await mongoose.connect(mongodbUri)
}
