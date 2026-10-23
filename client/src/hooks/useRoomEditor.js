import { useCallback, useEffect, useRef, useState } from 'react'

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
    image.onload = () => resolve({ imageUrl, image })
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl)
      reject(new Error('That image could not be read. Try another file.'))
    }
    image.src = imageUrl
  })
}

export function useRoomEditor() {
  const [image, setImage] = useState(null)
  const [operations, setOperations] = useState([])
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
  const objectUrlRef = useRef(null)

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
  }, [])

  const uploadImage = useCallback(async (file) => {
    const nextImage = await readImageFile(file)
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    objectUrlRef.current = nextImage.imageUrl
    setImage(nextImage)
    setOperations([])
    setHistory([])
    setRedoStack([])
    setDraftPolygon([])
    setIsBefore(false)
    setStatus('')
  }, [])

  const addOperation = useCallback((operation) => {
    if (operation.type === 'brush' && operation.points.length < 2) return
    setHistory((current) => [
      ...current,
      { operations, selectedColor },
    ])
    setOperations((current) => [...current, operation])
    setRedoStack([])
  }, [operations, selectedColor])

  const selectColor = useCallback((color) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(color) || color === selectedColor) return
    setHistory((current) => [
      ...current,
      { operations, selectedColor },
    ])
    setSelectedColor(color.toUpperCase())
    setRecentColors((current) => [
      color.toUpperCase(),
      ...current.filter((item) => item !== color.toUpperCase()),
    ].slice(0, 8))
    setRedoStack([])
  }, [operations, selectedColor])

  const addPolygonPoint = useCallback((point) => {
    setDraftPolygon((current) => [...current, point])
  }, [])

  const cancelPolygon = useCallback(() => {
    setDraftPolygon([])
  }, [])

  const finishPolygon = useCallback(() => {
    if (draftPolygon.length < 3) return
    setHistory((current) => [...current, { operations, selectedColor }])
    setOperations((current) => [
      ...current,
      { type: 'polygon', points: draftPolygon },
    ])
    setRedoStack([])
    setDraftPolygon([])
  }, [draftPolygon, operations, selectedColor])

  const undo = useCallback(() => {
    setHistory((current) => {
      if (!current.length) return current
      const previous = current[current.length - 1]
      setRedoStack((redo) => [
        ...redo,
        { operations, selectedColor },
      ])
      setOperations(previous.operations)
      setSelectedColor(previous.selectedColor)
      return current.slice(0, -1)
    })
  }, [operations, selectedColor])

  const redo = useCallback(() => {
    setRedoStack((current) => {
      if (!current.length) return current
      const next = current[current.length - 1]
      setHistory((historyCurrent) => [
        ...historyCurrent,
        { operations, selectedColor },
      ])
      setOperations(next.operations)
      setSelectedColor(next.selectedColor)
      return current.slice(0, -1)
    })
  }, [operations, selectedColor])

  const reset = useCallback(() => {
    setOperations([])
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
      JSON.stringify({ savedAt, selectedColor, operations }),
    )
    setStatus('Saved on this device. Cloud design saving is not connected yet.')
  }, [operations, selectedColor])

  return {
    image,
    operations,
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
    saveLocally,
    blendStrength,
    setBlendStrength,
    maxFileSize: MAX_FILE_SIZE,
  }
}
