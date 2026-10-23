export function normalizeApiBaseUrl(value) {
  const configuredUrl = (value || 'http://localhost:5000/api').trim().replace(/\/+$/, '')
  return configuredUrl.endsWith('/api') ? configuredUrl : `${configuredUrl}/api`
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL)

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest(path, options = {}) {
  const { body, token, ...requestOptions } = options
  const headers = new Headers(requestOptions.headers)

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(
      'The service is unavailable right now. Please check that the backend is running.',
      0,
    )
  }

  const contentType = response.headers.get('content-type') || ''
  const responseBody = contentType.includes('application/json')
    ? await response.json()
    : null

  if (!response.ok) {
    throw new ApiError(
      responseBody?.message || 'Something went wrong. Please try again.',
      response.status,
    )
  }

  return responseBody
}
