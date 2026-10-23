import dotenv from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const configDirectory = dirname(fileURLToPath(import.meta.url))
const serverEnvPath = resolve(configDirectory, '../../.env')
const rootEnvPath = resolve(configDirectory, '../../../.env')

dotenv.config({ path: serverEnvPath })

if (!process.env.MONGODB_URI) {
  dotenv.config({ path: rootEnvPath })
}

const port = Number.parseInt(process.env.PORT ?? '5000', 10)
const jwtSecret = process.env.JWT_SECRET?.trim()

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535')
}

if (!jwtSecret) {
  throw new Error('JWT_SECRET is not configured')
}

export const env = {
  port,
  jwtSecret,
}
