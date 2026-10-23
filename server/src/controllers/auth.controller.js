import {
  getCurrentUser,
  loginUser,
  registerUser,
} from '../services/auth.service.js'

export async function register(request, response) {
  const { name, email, password } = request.body ?? {}

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    return response
      .status(400)
      .json({ message: 'Name, email, and password are required' })
  }

  try {
    const result = await registerUser({ name, email, password })
    return response.status(201).json(result)
  } catch (error) {
    if (error.code === 'DUPLICATE_EMAIL' || error.code === 11000) {
      return response
        .status(409)
        .json({ message: 'An account with this email already exists' })
    }

    if (
      error.message === 'Name is required' ||
      error.message === 'A valid email address is required' ||
      error.message === 'Password must be 8 to 72 bytes long'
    ) {
      return response.status(400).json({ message: error.message })
    }

    throw error
  }
}

export async function login(request, response) {
  const { email, password } = request.body ?? {}

  if (typeof email !== 'string' || typeof password !== 'string') {
    return response
      .status(401)
      .json({ message: 'Invalid email or password' })
  }

  try {
    const result = await loginUser({ email, password })
    return response.status(200).json(result)
  } catch (error) {
    if (error.code === 'INVALID_CREDENTIALS') {
      return response.status(401).json({ message: error.message })
    }

    throw error
  }
}

export async function me(request, response) {
  return response.status(200).json({ user: request.user })
}
