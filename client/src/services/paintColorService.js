import { apiRequest } from './api.js'

export function listPaintColors() {
  return apiRequest('/colours').then((response) => {
    if (!Array.isArray(response?.colors)) {
      throw new Error('The paint catalogue response was invalid.')
    }

    const colors = response.colors.map((color) => ({
        id: color.catalogueId,
        name: color.name,
        hex: color.hexCode,
        category: color.category,
      }))
    const ids = colors.map((color) => color.id)
    if (
      colors.some((color) => !color.id || !color.name || !/^#[0-9A-F]{6}$/i.test(color.hex)) ||
      new Set(ids).size !== ids.length
    ) {
      throw new Error('The paint catalogue contains invalid or duplicate colours.')
    }

    return { colors }
  })
}

export function listPaintCategories() {
  return apiRequest('/colours/categories')
}
