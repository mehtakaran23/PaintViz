import PaintColor from '../models/PaintColor.js'

export function listActivePaintColors() {
  return PaintColor.find({ isActive: true })
    .sort({ category: 1, name: 1 })
    .lean()
}

export async function listPaintCategories() {
  const colors = await PaintColor.distinct('category', { isActive: true })
  return colors.sort((a, b) => a.localeCompare(b))
}
