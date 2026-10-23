import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { env } from '../config/env.js'

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_BYTES = 72
const LOGIN_ERROR_MESSAGE = 'Invalid email or password'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

function validateEmail(email) {
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error('A valid email address is required')
  }
}

function getSafeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

function signToken(userId) {
  return jwt.sign({ sub: userId.toString() }, env.jwtSecret, {
    expiresIn: '1h',
  })
}

function validatePassword(password) {
  const passwordBytes = Buffer.byteLength(password, 'utf8')

  if (passwordBytes < PASSWORD_MIN_LENGTH || passwordBytes > PASSWORD_MAX_BYTES) {
    throw new Error('Password must be 8 to 72 bytes long')
  }
}

export async function registerUser({ name, email, password }) {
  const trimmedName = name.trim()
  const normalizedEmail = normalizeEmail(email)

  if (!trimmedName) {
    throw new Error('Name is required')
  }

  validateEmail(normalizedEmail)
  validatePassword(password)

  const existingUser = await User.findOne({ email: normalizedEmail }).lean()

  if (existingUser) {
    const duplicateError = new Error('An account with this email already exists')
    duplicateError.code = 'DUPLICATE_EMAIL'
    throw duplicateError
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({
    name: trimmedName,
    email: normalizedEmail,
    passwordHash,
  })

  return {
    token: signToken(user._id),
    user: getSafeUser(user),
  }
}

export async function loginUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email)
  const user = await User.findOne({ email: normalizedEmail }).select(
    '+passwordHash',
  )

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const error = new Error(LOGIN_ERROR_MESSAGE)
    error.code = 'INVALID_CREDENTIALS'
    throw error
  }

  return {
    token: signToken(user._id),
    user: getSafeUser(user),
  }
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId)

  if (!user) {
    const error = new Error('User account no longer exists')
    error.code = 'USER_NOT_FOUND'
    throw error
  }

  return getSafeUser(user)
}
