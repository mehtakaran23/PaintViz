import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { getCurrentUser } from '../services/auth.service.js'

export async function requireAuth(request, response, next) {
  const authorization = request.get('authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return response.status(401).json({ message: 'Authentication required' })
  }

  const token = authorization.slice('Bearer '.length).trim()

  if (!token) {
    return response.status(401).json({ message: 'Authentication required' })
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret)

    if (typeof payload !== 'object' || typeof payload.sub !== 'string') {
      return response.status(401).json({ message: 'Invalid authentication token' })
    }

    request.user = await getCurrentUser(payload.sub)
    return next()
  } catch {
    return response.status(401).json({ message: 'Invalid authentication token' })
  }
}
