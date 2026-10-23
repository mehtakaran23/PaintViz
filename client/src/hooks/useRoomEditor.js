import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const MAX_FILE_SIZE = 12 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      reject(new Error('Choose a JPG, PNG, or WebP image.'))
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      reject(new Error('Images must be 12 MB or smaller.'))
      return
    }

    const imageUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => resolve({ imageUrl, image, file, isObjectUrl: true })
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl)
      reject(new Error('That image could not be read. Try another file.'))
    }

    image.src = imageUrl
  })
}

function readImageUrl(imageUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve({ imageUrl, image, file: null, isObjectUrl: false })
    image.onerror = () => reject(new Error('The saved room image could not be loaded.'))
    image.src = imageUrl
  })
}

export function useRoomEditor() {
  const [image, setImage] = useState(null)
  const [regions, setRegions] = useState([])
  const [activeRegionId, setActiveRegionId] = useState(null)
  const [selectedColor, setSelectedColor] = useState('#A8B29C')
  const [history, setHistory] = useState([])
  const [redoStack, setRedoStack] = useState([])
  const [draftPolygon, setDraftPolygon] = useState([])
  const [tool, setTool] = useState('polygon')
  const [brushSize, setBrushSize] = useState(28)
  const [blendStrength, setBlendStrength] = useState(48)
  const [recentColors, setRecentColors] = useState(['#A8B29C'])
  const [isBefore, setIsBefore] = useState(false)
  const [status, setStatus] = useState('')
  const [processedImageUrl, setProcessedImageUrl] = useState('')
  const [originalImagePublicId, setOriginalImagePublicId] = useState('')
  const [processedImagePublicId, setProcessedImagePublicId] = useState('')
  const objectUrlRef = useRef(null)

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
  }, [])

  const uploadImage = useCallback(async (file) => {
    const nextImage = await readImageFile(file)
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    objectUrlRef.current = nextImage.imageUrl
    setImage(nextImage)
    setProcessedImageUrl('')
    setOriginalImagePublicId('')
    setProcessedImagePublicId('')
    setRegions([])
    setActiveRegionId(null)
    setHistory([])
    setRedoStack([])
    setDraftPolygon([])
    setIsBefore(false)
    setStatus('')
  }, [])

  const loadSavedDesign = useCallback(async (design) => {
    if (!design?.originalImageUrl) throw new Error('This design has no original image URL.')
    const nextImage = await readImageUrl(design.originalImageUrl)
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setImage(nextImage)
    setProcessedImageUrl(design.processedImageUrl || '')
    setOriginalImagePublicId(design.originalImagePublicId || '')
    setProcessedImagePublicId(design.processedImagePublicId || '')
    const savedSelections = design.wallSelections || []
    const migratedRegions = savedSelections.some((item) => item.regionId)
      ? savedSelections.reduce((groups, item) => {
        const id = item.regionId
        const existing = groups.find((region) => region.id === id)
        if (existing) existing.operations.push(item)
        else groups.push({ id, name: item.name || `Wall ${groups.length + 1}`, color: item.color || design.selectedColors?.[0]?.hexCode || '#A8B29C', operations: [item] })
        return groups
      }, [])
      : savedSelections.length
        ? [{ id: `wall-${Date.now()}`, name: 'Wall 1', color: design.selectedColors?.[0]?.hexCode || '#A8B29C', operations: savedSelections }]
        : []
    setRegions(migratedRegions)
    setActiveRegionId(migratedRegions[0]?.id || null)
    setSelectedColor(migratedRegions[0]?.color || design.selectedColors?.[0]?.hexCode || '#A8B29C')
    setBlendStrength(design.editorSettings?.blendStrength ?? 48)
    setTool(design.editorSettings?.tool || 'polygon')
    setBrushSize(design.editorSettings?.brushSize ?? 28)
    setHistory([])
    setRedoStack([])
    setDraftPolygon([])
    setIsBefore(false)
    setStatus('')
  }, [])

  const flattenedOperations = useMemo(
    () => regions.flatMap((region) => region.operations.map((operation) => ({
      ...operation,
      regionId: region.id,
      name: region.name,
      color: region.color,
    }))),
    [regions],
  )

  const addOperation = useCallback((operation) => {
    if (operation.type === 'brush' && operation.points.length < 2) return
    setHistory((current) => [...current, { regions, selectedColor, activeRegionId }])
    const regionId = activeRegionId || `wall-${Date.now()}`
    setRegions((current) => {
      const region = current.find((item) => item.id === regionId)
      if (region) return current.map((item) => item.id === regionId ? { ...item, operations: [...item.operations, operation] } : item)
      return [...current, { id: regionId, name: `Wall ${current.length + 1}`, color: selectedColor, operations: [operation] }]
    })
    setActiveRegionId(regionId)
    setRedoStack([])
  }, [activeRegionId, regions, selectedColor])

  const selectColor = useCallback((color) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(color) || color === selectedColor) return
    const nextColor = color.toUpperCase()
    setHistory((current) => [...current, { regions, selectedColor, activeRegionId }])
    setSelectedColor(nextColor)
    if (activeRegionId) setRegions((current) => current.map((region) => region.id === activeRegionId ? { ...region, color: nextColor } : region))
    setRecentColors((current) => [
      color.toUpperCase(),
      ...current.filter((item) => item !== color.toUpperCase()),
    ].slice(0, 8))
    setRedoStack([])
  }, [activeRegionId, regions, selectedColor])

  const selectRegion = useCallback((regionId) => {
    const region = regions.find((item) => item.id === regionId)
    if (!region) return
    setActiveRegionId(regionId)
    setSelectedColor(region.color)
  }, [regions])

  const addPolygonPoint = useCallback((point) => {
    setDraftPolygon((current) => [...current, point])
  }, [])

  const cancelPolygon = useCallback(() => {
    setDraftPolygon([])
  }, [])

  const finishPolygon = useCallback(() => {
    if (draftPolygon.length < 3) return
    const operation = { type: 'polygon', points: draftPolygon }
    setHistory((current) => [...current, { regions, selectedColor, activeRegionId }])
    const regionId = `wall-${Date.now()}`
    setRegions((current) => [...current, { id: regionId, name: `Wall ${current.length + 1}`, color: selectedColor, operations: [operation] }])
    setActiveRegionId(regionId)
    setRedoStack([])
    setDraftPolygon([])
  }, [activeRegionId, draftPolygon, regions, selectedColor])

  const undo = useCallback(() => {
    if (!history.length) return
    const previous = history[history.length - 1]
    setRedoStack((current) => [...current, { regions, selectedColor, activeRegionId }])
    setRegions(previous.regions)
    setActiveRegionId(previous.activeRegionId || previous.regions[0]?.id || null)
    setSelectedColor(previous.selectedColor)
    setHistory((current) => current.slice(0, -1))
  }, [activeRegionId, history, regions, selectedColor])

  const redo = useCallback(() => {
    if (!redoStack.length) return
    const next = redoStack[redoStack.length - 1]
    setHistory((current) => [...current, { regions, selectedColor, activeRegionId }])
    setRegions(next.regions)
    setActiveRegionId(next.activeRegionId || next.regions[0]?.id || null)
    setSelectedColor(next.selectedColor)
    setRedoStack((current) => current.slice(0, -1))
  }, [activeRegionId, redoStack, regions, selectedColor])

  const reset = useCallback(() => {
    setRegions([])
    setActiveRegionId(null)
    setHistory([])
    setRedoStack([])
    setDraftPolygon([])
    setSelectedColor('#A8B29C')
    setBlendStrength(48)
    setRecentColors(['#A8B29C'])
    setIsBefore(false)
    setStatus('Selection and colour preview reset.')
  }, [])

  const saveLocally = useCallback(() => {
    const savedAt = new Date().toISOString()
    localStorage.setItem(
      'paintviz.editorDraft',
      JSON.stringify({ savedAt, selectedColor, regions }),
    )
    setStatus('Saved on this device. Cloud design saving is not connected yet.')
  }, [regions, selectedColor])

  const renameRegion = useCallback((regionId, name) => {
    const trimmed = name.trim().slice(0, 80)
    if (!trimmed) return
    const region = regions.find((item) => item.id === regionId)
    if (!region || region.name === trimmed) return
    setHistory((current) => [...current, { regions, selectedColor, activeRegionId }])
    setRegions((current) => current.map((region) => region.id === regionId ? { ...region, name: trimmed } : region))
    setRedoStack([])
  }, [activeRegionId, regions, selectedColor])

  const deleteRegion = useCallback((regionId) => {
    setHistory((current) => [...current, { regions, selectedColor, activeRegionId }])
    setRegions((current) => current.filter((region) => region.id !== regionId))
    setActiveRegionId((current) => current === regionId ? null : current)
    if (activeRegionId === regionId) setSelectedColor('#A8B29C')
    setRedoStack([])
  }, [activeRegionId, regions, selectedColor])

  return {
    image,
    operations: flattenedOperations,
    regions,
    activeRegionId,
    setActiveRegionId,
    selectRegion,
    renameRegion,
    deleteRegion,
    draftPolygon,
    tool,
    setTool,
    brushSize,
    setBrushSize,
    selectedColor,
    selectColor,
    recentColors,
    isBefore,
    setIsBefore,
    status,
    setStatus,
    canUndo: history.length > 0,
    canRedo: redoStack.length > 0,
    uploadImage,
    addOperation,
    addPolygonPoint,
    cancelPolygon,
    finishPolygon,
    undo,
    redo,
    reset,
    loadSavedDesign,
    originalFile: image?.file || null,
    originalImageUrl: image?.isObjectUrl ? '' : image?.imageUrl || '',
    processedImageUrl,
    originalImagePublicId,
    processedImagePublicId,
    saveLocally,
    blendStrength,
    setBlendStrength,
    maxFileSize: MAX_FILE_SIZE,
  }
}
