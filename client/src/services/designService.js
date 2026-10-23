import { API_BASE_URL, ApiError, apiRequest } from './api.js'

export function listDesigns(token) {
  return apiRequest('/designs', { token })
}

export function getDesign(token, designId) {
  return apiRequest(`/designs/${designId}`, { token })
}

export function createDesign(token, design) {
  return apiRequest('/designs', { method: 'POST', token, body: design })
}

export function updateDesign(token, designId, design) {
  return apiRequest(`/designs/${designId}`, { method: 'PATCH', token, body: design })
}

export function deleteDesign(token, designId) {
  return apiRequest(`/designs/${designId}`, { method: 'DELETE', token })
}

export function uploadDesignImage(token, file, assetType, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('image', file)
    formData.append('assetType', assetType)
    request.open('POST', `${API_BASE_URL}/designs/assets`)
    request.setRequestHeader('Authorization', `Bearer ${token}`)
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100))
    })
    request.addEventListener('load', () => {
      let body
      try {
        body = request.responseText ? JSON.parse(request.responseText) : null
      } catch {
        reject(new ApiError('The upload response was invalid.', request.status))
        return
      }
      if (request.status < 200 || request.status >= 300) {
        reject(new ApiError(body?.message || 'Image upload failed.', request.status))
        return
      }
      resolve(body)
    })
    request.addEventListener('error', () => reject(new ApiError('The service is unavailable right now.', 0)))
    request.addEventListener('abort', () => reject(new ApiError('Image upload was cancelled.', 0)))
    request.send(formData)
  })
}
