import { useCallback, useEffect, useRef, useState } from 'react'

function pointFromEvent(event, element) {
  const rect = element.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return null
  return {
    x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
  }
}

function containedImageRect(frame, image) {
  const frameRect = frame.getBoundingClientRect()
  const scale = Math.min(
    frameRect.width / image.naturalWidth,
    frameRect.height / image.naturalHeight,
  )
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  return {
    width,
    height,
    left: (frameRect.width - width) / 2,
    top: (frameRect.height - height) / 2,
  }
}

function drawPath(context, points, width, height) {
  if (!points.length) return
  context.beginPath()
  context.moveTo(points[0].x * width, points[0].y * height)
  points.slice(1).forEach((point) => {
    context.lineTo(point.x * width, point.y * height)
  })
}

function drawMask(maskContext, operations, width, height) {
  maskContext.clearRect(0, 0, width, height)
  maskContext.fillStyle = '#ffffff'
  operations.forEach((operation) => {
    if (operation.type === 'polygon') {
      drawPath(maskContext, operation.points, width, height)
      maskContext.closePath()
      maskContext.fill()
    }

    if (operation.type === 'brush') {
      maskContext.globalCompositeOperation =
        operation.mode === 'eraser' ? 'destination-out' : 'source-over'
      maskContext.lineCap = 'round'
      maskContext.lineJoin = 'round'
      maskContext.lineWidth = operation.size * width
      const firstPoint = operation.points[0]
      const isDab = operation.points.every((point) =>
        point.x === firstPoint.x && point.y === firstPoint.y)
      if (isDab) {
        maskContext.beginPath()
        maskContext.arc(
          firstPoint.x * width,
          firstPoint.y * height,
          maskContext.lineWidth / 2,
          0,
          Math.PI * 2,
        )
        maskContext.fill()
      } else {
        drawPath(maskContext, operation.points, width, height)
        maskContext.stroke()
      }
      maskContext.globalCompositeOperation = 'source-over'
    }
  })
}

function drawRegionPreview(context, operations, width, height, blendStrength, layerCache) {
  const groups = operations.reduce((map, operation) => {
    const key = operation.regionId || 'legacy'
    if (!map.has(key)) map.set(key, { color: operation.color || '#A8B29C', operations: [] })
    map.get(key).operations.push(operation)
    return map
  }, new Map())

  groups.forEach(({ color, operations: regionOperations }, key) => {
    let layers = layerCache.get(key)
    if (!layers || layers.width !== width || layers.height !== height) {
      layers = {
        width,
        height,
        mask: document.createElement('canvas'),
        colourLayer: document.createElement('canvas'),
      }
      layers.mask.width = width
      layers.mask.height = height
      layers.colourLayer.width = width
      layers.colourLayer.height = height
      layerCache.set(key, layers)
    }
    drawMask(layers.mask.getContext('2d'), regionOperations, width, height)
    const colourContext = layers.colourLayer.getContext('2d')
    colourContext.clearRect(0, 0, width, height)
    colourContext.fillStyle = color
    colourContext.fillRect(0, 0, width, height)
    colourContext.globalCompositeOperation = 'destination-in'
    colourContext.drawImage(layers.mask, 0, 0)
    context.globalAlpha = blendStrength / 100
    context.globalCompositeOperation = 'multiply'
    context.drawImage(layers.colourLayer, 0, 0)
  })
  context.globalAlpha = 1
  context.globalCompositeOperation = 'source-over'
}

function drawOutline(context, operations, draftPolygon, width, height) {
  context.clearRect(0, 0, width, height)
  context.lineWidth = 1.5
  context.setLineDash([6, 5])
  context.strokeStyle = 'rgba(255, 253, 248, 0.95)'
  operations.forEach((operation) => {
    if (operation.type !== 'polygon') return
    drawPath(context, operation.points, width, height)
    context.closePath()
    context.stroke()
  })

  if (draftPolygon.length) {
    context.setLineDash([5, 4])
    context.strokeStyle = '#c9856c'
    drawPath(context, draftPolygon, width, height)
    context.stroke()
    context.setLineDash([])
    draftPolygon.forEach((point, index) => {
      context.beginPath()
      context.fillStyle = index === 0 ? '#c9856c' : '#fffdf8'
      context.arc(point.x * width, point.y * height, 4, 0, Math.PI * 2)
      context.fill()
      context.strokeStyle = '#684a36'
      context.stroke()
    })
  }
  context.setLineDash([])
}

function EditorCanvas({
  image,
  operations,
  draftPolygon,
  tool,
  brushSize,
  blendStrength,
  isBefore,
  onAddPoint,
  onFinishPolygon,
  onCancelPolygon,
  onAddOperation,
  onDownloadImageReady,
  onImageBlobReady,
  onRequestUpload,
}) {
  const displayCanvasRef = useRef(null)
  const overlayCanvasRef = useRef(null)
  const imageRef = useRef(null)
  const frameRef = useRef(null)
  const strokePointsRef = useRef([])
  const onDownloadImageReadyRef = useRef(onDownloadImageReady)
  const onImageBlobReadyRef = useRef(onImageBlobReady)
  const layerCacheRef = useRef(new Map())
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    onDownloadImageReadyRef.current = onDownloadImageReady
    onImageBlobReadyRef.current = onImageBlobReady
  }, [onDownloadImageReady, onImageBlobReady])

  const render = useCallback(() => {
    const canvas = displayCanvasRef.current
    const overlay = overlayCanvasRef.current
    const frame = frameRef.current
    if (!canvas || !overlay || !frame || !imageRef.current) return

    const imageBounds = containedImageRect(frame, imageRef.current)
    const width = imageRef.current.naturalWidth
    const height = imageRef.current.naturalHeight
    ;[canvas, overlay].forEach((target) => {
      target.width = width
      target.height = height
      target.style.width = `${imageBounds.width}px`
      target.style.height = `${imageBounds.height}px`
      target.style.left = `${imageBounds.left}px`
      target.style.top = `${imageBounds.top}px`
    })

    const context = canvas.getContext('2d')
    context.clearRect(0, 0, width, height)
    context.drawImage(imageRef.current, 0, 0, width, height)

    if (!isBefore && operations.length) {
      const activeRegionIds = new Set(operations.map((operation) => operation.regionId || 'legacy'))
      layerCacheRef.current.forEach((_layers, key) => {
        if (!activeRegionIds.has(key)) layerCacheRef.current.delete(key)
      })
      drawRegionPreview(context, operations, width, height, blendStrength, layerCacheRef.current)
    }

    drawOutline(overlay.getContext('2d'), operations, draftPolygon, width, height)
    onDownloadImageReadyRef.current(() => canvas.toDataURL('image/png'))
    onImageBlobReadyRef.current((type = 'image/png') => new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('The rendered preview could not be prepared.'))
      }, type)
    }))
  }, [blendStrength, draftPolygon, isBefore, operations])

  useEffect(() => {
    if (!image) {
      imageRef.current = null
      return
    }
    imageRef.current = image.image
  }, [image])

  useEffect(() => {
    if (!image) return undefined
    render()
    const observer = new ResizeObserver(render)
    observer.observe(frameRef.current)
    window.addEventListener('resize', render)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', render)
    }
  }, [image, render])

  useEffect(() => {
    if (!draftPolygon.length) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancelPolygon()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [draftPolygon.length, onCancelPolygon])

  const handlePointerDown = (event) => {
    if (!imageRef.current) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = pointFromEvent(event, event.currentTarget)
    if (!point) return
    if (tool === 'polygon') {
      if (draftPolygon.length >= 3) {
        const first = draftPolygon[0]
        const distance = Math.hypot(point.x - first.x, point.y - first.y)
        if (distance < 0.035) {
          onFinishPolygon()
          return
        }
      }
      onAddPoint(point)
      return
    }
    setIsDrawing(true)
    strokePointsRef.current = [point]
  }

  const handlePointerMove = (event) => {
    if (!isDrawing || (tool !== 'brush' && tool !== 'eraser')) return
    const point = pointFromEvent(event, event.currentTarget)
    if (!point) return
    strokePointsRef.current.push(point)
  }

  const handlePointerUp = (event) => {
    if (!isDrawing) return
    setIsDrawing(false)
    if (strokePointsRef.current.length > 0) {
      const points = strokePointsRef.current.length > 1
        ? strokePointsRef.current
        : [strokePointsRef.current[0], strokePointsRef.current[0]]
      onAddOperation({
        type: 'brush',
        mode: tool,
        size: brushSize / event.currentTarget.getBoundingClientRect().width,
        points,
      })
    }
    strokePointsRef.current = []
  }

  return (
    <div className={`editor-canvas-frame ${!image ? 'is-empty' : ''}`} ref={frameRef}>
      {!image && (
        <div className="editor-empty-state">
          <button type="button" className="editor-empty-icon" onClick={onRequestUpload} aria-label="Choose a room image">+</button>
          <h2>Bring a room to life.</h2>
          <p>Upload a JPG, PNG or WebP photo to start selecting walls manually.</p>
          <span>PaintViz is a visual preview tool — not an exact paint simulation.</span>
        </div>
      )}
      {image && (
        <>
          <canvas ref={displayCanvasRef} className="editor-display-canvas" />
          <canvas
            ref={overlayCanvasRef}
            className="editor-overlay-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onDoubleClick={tool === 'polygon' ? onFinishPolygon : undefined}
            aria-label="Room image selection canvas"
          />
        </>
      )}
    </div>
  )
}

export default EditorCanvas
