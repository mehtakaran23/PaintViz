import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, Eye, EyeOff, Info } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import EditorCanvas from '../components/editor/EditorCanvas.jsx'
import EditorSidebar from '../components/editor/EditorSidebar.jsx'
import EditorToolbar from '../components/editor/EditorToolbar.jsx'
import { useRoomEditor } from '../hooks/useRoomEditor.js'
import { useAuth } from '../context/useAuth.js'
import { createDesign, getDesign, updateDesign, uploadDesignImage } from '../services/designService.js'
import { paintCatalogue } from '../data/paintCatalogue.js'
import { listPaintColors } from '../services/paintColorService.js'

function dataUrlToFile(dataUrl, name) {
  const [header, encoded] = dataUrl.split(',')
  const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png'
  const binary = atob(encoded)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new File([bytes], name, { type: mimeType })
}

function Editor() {
  const editor = useRoomEditor()
  const { loadSavedDesign } = editor
  const { token } = useAuth()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('colours')
  const [error, setError] = useState('')
  const [title, setTitle] = useState('My room direction')
  const [designId, setDesignId] = useState(searchParams.get('designId'))
  const [isSaving, setIsSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [catalogue, setCatalogue] = useState(paintCatalogue)
  const [catalogueLoading, setCatalogueLoading] = useState(true)
  const [catalogueError, setCatalogueError] = useState('')
  const downloadImageRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    let mounted = true
    listPaintColors()
      .then(({ colors }) => {
        if (mounted && colors.length) {
          setCatalogue(colors)
        }
      })
      .catch((catalogueLoadError) => {
        if (mounted) setCatalogueError(catalogueLoadError.message)
      })
      .finally(() => {
        if (mounted) setCatalogueLoading(false)
      })
    return () => { mounted = false }
  }, [])

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  useEffect(() => {
    const savedDesignId = searchParams.get('designId')
    if (!savedDesignId) return undefined
    let isMounted = true
    getDesign(token, savedDesignId)
      .then(({ design }) => {
        if (!isMounted) return
        setDesignId(design._id)
        setTitle(design.title)
        return loadSavedDesign(design)
      })
      .catch((loadError) => {
        if (isMounted) setError(loadError.message)
      })
    return () => {
      isMounted = false
    }
  }, [loadSavedDesign, searchParams, token])

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      setError('')
      await editor.uploadImage(file)
    } catch (uploadError) {
      setError(uploadError.message)
    }
  }

  const downloadImage = useCallback(() => {
    if (!downloadImageRef.current) {
      setError('Upload an image before downloading a preview.')
      return
    }
    const link = document.createElement('a')
    link.download = 'paintviz-preview.png'
    link.href = downloadImageRef.current()
    link.click()
  }, [])

  const saveDesign = async () => {
    if (!editor.image || !downloadImageRef.current) {
      setError('Upload an image before saving a design.')
      return
    }
    setIsSaving(true)
    setError('')
    setUploadProgress(0)
    try {
      let originalImageUrl = editor.originalImageUrl
      let originalImagePublicId = editor.originalImagePublicId
      if (editor.originalFile) {
        editor.setStatus('Uploading original image...')
        const result = await uploadDesignImage(token, editor.originalFile, 'original', setUploadProgress)
        originalImageUrl = result.asset.url
        originalImagePublicId = result.asset.publicId
      }
      if (!originalImageUrl) throw new Error('The original image is not available for cloud saving.')

      editor.setStatus('Uploading rendered preview...')
      const previewFile = dataUrlToFile(downloadImageRef.current(), 'paintviz-preview.png')
      const previewResult = await uploadDesignImage(token, previewFile, 'processed', setUploadProgress)
      const processedImagePublicId = previewResult.asset.publicId
      const savedColours = [...new Set(editor.regions.map((region) => region.color || editor.selectedColor))]
      const payload = {
        title: title.trim() || 'Untitled room direction',
        originalImageUrl,
        processedImageUrl: previewResult.asset.url,
        originalImagePublicId,
        processedImagePublicId,
        selectedColors: savedColours.map((hexCode) => {
          const colour = catalogue.find((item) => item.hex === hexCode)
          return { ...(colour ? { colorId: colour.id } : {}), hexCode }
        }),
        wallSelections: editor.operations,
        editorSettings: {
          blendStrength: editor.blendStrength,
          tool: editor.tool,
          brushSize: editor.brushSize,
        },
      }
      const result = designId
        ? await updateDesign(token, designId, payload)
        : await createDesign(token, payload)
      setDesignId(result.design._id)
      editor.setStatus('Design saved to your account.')
    } catch (saveError) {
      setError(saveError.message)
      editor.saveLocally()
      editor.setStatus(`Cloud save unavailable. Saved a local draft instead: ${saveError.message}`)
    } finally {
      setIsSaving(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="editor-page">
      <EditorToolbar
        onUpload={openFilePicker}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onReset={editor.reset}
        onSave={saveDesign}
        onDownload={downloadImage}
        hasImage={Boolean(editor.image)}
        isSaving={isSaving}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
      />
      <input
        ref={fileInputRef}
        className="editor-hidden-file-input"
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        aria-label="Upload room image"
      />
      <div className="editor-workspace">
        <main className="editor-main">
          <div className="editor-canvas-header">
            <div>
              <span className="eyebrow">Manual room editor</span>
              <label className="editor-title-field">
                <span>Design title</span>
                <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={150} />
              </label>
            </div>
            <div className="editor-status">
              <Info size={14} />
              <span>{isSaving ? `Uploading ${uploadProgress}%` : designId ? 'Saved design' : 'Cloud-ready preview'}</span>
            </div>
          </div>
          {error && <div className="editor-message editor-error" role="alert"><AlertCircle size={15} />{error}</div>}
          {editor.status && <div className="editor-message editor-success" role="status">{editor.status}</div>}
          {catalogueError && (
            <div className="editor-message editor-info" role="status">
              Local colour catalogue loaded. {catalogueError}
            </div>
          )}
          <div className="editor-canvas-shell">
            <EditorCanvas
              image={editor.image}
              operations={editor.operations}
              draftPolygon={editor.draftPolygon}
              tool={editor.tool}
              brushSize={editor.brushSize}
              isBefore={editor.isBefore}
              onAddPoint={editor.addPolygonPoint}
              onFinishPolygon={editor.finishPolygon}
              onCancelPolygon={editor.cancelPolygon}
              onAddOperation={editor.addOperation}
              onDownloadImageReady={(getImage) => {
                downloadImageRef.current = getImage
              }}
              onRequestUpload={openFilePicker}
            />
          </div>
          <div className="editor-canvas-footer">
            <span>{editor.image ? 'Click points to outline a wall. Close the polygon by clicking its first point.' : 'Your original photo stays unchanged in memory.'}</span>
            {editor.image && (
              <button type="button" className="before-after-toggle" onClick={() => editor.setIsBefore((current) => !current)}>
                {editor.isBefore ? <Eye size={15} /> : <EyeOff size={15} />}
                {editor.isBefore ? 'Show preview' : 'Show original'}
              </button>
            )}
          </div>
        </main>
        <EditorSidebar
          catalogueLoading={catalogueLoading}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tool={editor.tool}
          setTool={editor.setTool}
          brushSize={editor.brushSize}
          setBrushSize={editor.setBrushSize}
          blendStrength={editor.blendStrength}
          setBlendStrength={editor.setBlendStrength}
          selectedColor={editor.selectedColor}
          onSelectColor={editor.selectColor}
          recentColors={editor.recentColors}
          regions={editor.regions}
          activeRegionId={editor.activeRegionId}
          selectRegion={editor.selectRegion}
          renameRegion={editor.renameRegion}
          deleteRegion={editor.deleteRegion}
          catalogue={catalogue}
          categories={['All colours', ...new Set(catalogue.map((item) => item.category))]}
        />
      </div>
    </div>
  )
}

export default Editor
