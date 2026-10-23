import { listActivePaintColors, listPaintCategories } from '../services/paint-color.service.js'

export async function list(_request, response) {
  const colors = await listActivePaintColors()
  return response.status(200).json({ colors })
}

export async function categories(_request, response) {
  const values = await listPaintCategories()
  return response.status(200).json({ categories: values })
}
