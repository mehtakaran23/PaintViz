import mongoose from 'mongoose'
import Design from '../models/Design.js'
import DesignHistory from '../models/DesignHistory.js'

const URL_PATTERN = /^https?:\/\/[^\s/$.?#].[^\s]*$/i
const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/
const MAX_SELECTIONS = 100
const MAX_POINTS = 1000

export class DesignValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'DesignValidationError'
    this.statusCode = 400
  }
}

export class DesignNotFoundError extends Error {
  constructor() {
    super('Design not found')
    this.name = 'DesignNotFoundError'
    this.statusCode = 404
  }
}

function requireString(value, field, maxLength) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new DesignValidationError(`${field} is required`)
  }
  const trimmed = value.trim()
  if (trimmed.length > maxLength) {
    throw new DesignValidationError(`${field} must be ${maxLength} characters or fewer`)
  }
  return trimmed
}

function optionalUrl(value, field) {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string' || !URL_PATTERN.test(value.trim())) {
    throw new DesignValidationError(`${field} must be a valid http or https URL`)
  }
  return value.trim()
}

function validatePoint(point) {
  if (
    !point ||
    typeof point !== 'object' ||
    typeof point.x !== 'number' ||
    typeof point.y !== 'number' ||
    point.x < 0 ||
    point.x > 1 ||
    point.y < 0 ||
    point.y > 1
  ) {
    throw new DesignValidationError('Selection points must use normalized x and y values between 0 and 1')
  }
}

function validateSelections(selections) {
  if (!Array.isArray(selections) || selections.length > MAX_SELECTIONS) {
    throw new DesignValidationError(`wallSelections must contain between 0 and ${MAX_SELECTIONS} selections`)
  }

  return selections.map((selection) => {
    if (!selection || typeof selection !== 'object') {
      throw new DesignValidationError('Each wall selection must be an object')
    }
    if (!['polygon', 'brush'].includes(selection.type)) {
      throw new DesignValidationError('Wall selection type must be polygon or brush')
    }
    if (!Array.isArray(selection.points) || selection.points.length < 2 || selection.points.length > MAX_POINTS) {
      throw new DesignValidationError(`Each wall selection must contain 2 to ${MAX_POINTS} points`)
    }
    selection.points.forEach(validatePoint)

    const normalized = {
      type: selection.type,
      points: selection.points.map(({ x, y }) => ({ x, y })),
    }

    if (selection.type === 'brush') {
      if (!['brush', 'eraser'].includes(selection.mode)) {
        throw new DesignValidationError('Brush selections must specify brush or eraser mode')
      }
      if (typeof selection.size !== 'number' || selection.size <= 0 || selection.size > 1) {
        throw new DesignValidationError('Brush size must be a normalized value greater than 0 and at most 1')
      }
      normalized.mode = selection.mode
      normalized.size = selection.size
    }

    return normalized
  })
}

function validateSelectedColors(colors) {
  if (!Array.isArray(colors) || colors.length > 50) {
    throw new DesignValidationError('selectedColors must contain between 0 and 50 colours')
  }

  return colors.map((color) => {
    if (!color || typeof color !== 'object' || (!color.colorId && !color.paintColor)) {
      throw new DesignValidationError('Each selected colour must include a colour ID or PaintColor reference')
    }
    if (!HEX_PATTERN.test(color.hexCode || '')) {
      throw new DesignValidationError('Each selected colour must include a valid six-digit hexCode')
    }
    if (color.paintColor && !mongoose.isValidObjectId(color.paintColor)) {
      throw new DesignValidationError('Invalid PaintColor reference')
    }
    return {
      ...(color.colorId ? { colorId: requireString(color.colorId, 'colorId', 100) } : {}),
      ...(color.paintColor ? { paintColor: color.paintColor } : {}),
      hexCode: color.hexCode.toUpperCase(),
    }
  })
}

function normalizePayload(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new DesignValidationError('Request body must be an object')
  }

  const normalized = {}
  if (!partial || payload.title !== undefined) {
    normalized.title = requireString(payload.title, 'title', 150)
  }
  if (!partial || payload.originalImageUrl !== undefined) {
    normalized.originalImageUrl = requireString(
      optionalUrl(payload.originalImageUrl, 'originalImageUrl'),
      'originalImageUrl',
      2048,
    )
  }
  if (payload.processedImageUrl !== undefined) {
    normalized.processedImageUrl = optionalUrl(payload.processedImageUrl, 'processedImageUrl')
  }
  if (!partial || payload.selectedColors !== undefined) {
    normalized.selectedColors = validateSelectedColors(payload.selectedColors || [])
  }
  if (!partial || payload.wallSelections !== undefined) {
    normalized.wallSelections = validateSelections(payload.wallSelections || [])
  }
  if (payload.editorSettings !== undefined) {
    const settings = payload.editorSettings
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      throw new DesignValidationError('editorSettings must be an object')
    }
    if (
      settings.blendStrength !== undefined &&
      (typeof settings.blendStrength !== 'number' || settings.blendStrength < 0 || settings.blendStrength > 100)
    ) {
      throw new DesignValidationError('blendStrength must be between 0 and 100')
    }
    normalized.editorSettings = {
      blendStrength: settings.blendStrength ?? 48,
      tool: typeof settings.tool === 'string' ? settings.tool.slice(0, 30) : 'polygon',
      brushSize: typeof settings.brushSize === 'number' ? Math.min(200, Math.max(1, settings.brushSize)) : 28,
    }
  }
  return normalized
}

function historySnapshot(design) {
  return {
    title: design.title,
    selectedColors: design.selectedColors,
    wallSelections: design.wallSelections,
    editorSettings: design.editorSettings,
  }
}

export function normalizeDesignPayload(payload, options) {
  return normalizePayload(payload, options)
}

export async function createDesign(userId, payload) {
  const values = normalizePayload(payload)
  const design = await Design.create({ ...values, user: userId })
  await DesignHistory.create({
    design: design._id,
    user: userId,
    action: 'created',
    snapshot: historySnapshot(design),
  })
  return design
}

export function ownDesignQuery(userId, designId) {
  if (!mongoose.isValidObjectId(designId)) throw new DesignValidationError('Invalid design ID')
  return Design.findOne({ _id: designId, user: userId })
}

export async function getDesigns(userId) {
  return Design.find({ user: userId }).sort({ updatedAt: -1 }).lean()
}

export async function getDesign(userId, designId) {
  const design = await ownDesignQuery(userId, designId).lean()
  if (!design) throw new DesignNotFoundError()
  return design
}

export async function updateDesign(userId, designId, payload) {
  const values = normalizePayload(payload, { partial: true })
  if (!Object.keys(values).length) {
    throw new DesignValidationError('At least one design field is required')
  }
  const design = await ownDesignQuery(userId, designId)
  if (!design) throw new DesignNotFoundError()
  Object.assign(design, values)
  await design.save()
  await DesignHistory.create({
    design: design._id,
    user: userId,
    action: 'updated',
    snapshot: historySnapshot(design),
  })
  return design
}

export async function deleteDesign(userId, designId) {
  const design = await ownDesignQuery(userId, designId)
  if (!design) throw new DesignNotFoundError()
  await DesignHistory.deleteMany({ design: design._id, user: userId })
  await design.deleteOne()
}
