import { apiRequest } from './api.js'

export function registerUser(credentials) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: credentials,
  })
}

export function loginUser(credentials) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: credentials,
  })
}

export function getCurrentUser(token) {
  return apiRequest('/auth/me', { token })
}
