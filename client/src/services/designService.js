import { apiRequest } from './api.js'

export function listDesigns(token) {
  return apiRequest('/designs', { token })
}

export function getDesign(token, designId) {
  return apiRequest(`/designs/${designId}`, { token })
}

export function createDesign(token, design) {
  return apiRequest('/designs', {
    method: 'POST',
    token,
    body: design,
  })
}

export function updateDesign(token, designId, design) {
  return apiRequest(`/designs/${designId}`, {
    method: 'PATCH',
    token,
    body: design,
  })
}

export function deleteDesign(token, designId) {
  return apiRequest(`/designs/${designId}`, {
    method: 'DELETE',
    token,
  })
}
