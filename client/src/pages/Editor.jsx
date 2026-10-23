import { useCallback, useRef, useState } from 'react'
import { AlertCircle, Eye, EyeOff, Info } from 'lucide-react'
import EditorCanvas from '../components/editor/EditorCanvas.jsx'
import EditorSidebar from '../components/editor/EditorSidebar.jsx'
import EditorToolbar from '../components/editor/EditorToolbar.jsx'
import { useRoomEditor } from '../hooks/useRoomEditor.js'

function Editor() {
  const editor = useRoomEditor()
  const [activeTab, setActiveTab] = useState('colours')
  const [error, setError] = useState('')
  const downloadImageRef = useRef(null)

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

  const download = useCallback(() => {
    if (!downloadImageRef.current) {
      setError('Upload an image before downloading a preview.')
      return
    }
    const link = document.createElement('a')
    link.download = 'paintviz-preview.png'
    link.href = downloadImageRef.current()
    link.click()
  }, [])

  return (
    <div className="editor-page">
      <EditorToolbar
        onUpload={handleUpload}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onReset={editor.reset}
        onSave={editor.saveLocally}
        onDownload={download}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
      />
      <div className="editor-workspace">
        <main className="editor-main">
          <div className="editor-canvas-header">
            <div>
              <span className="eyebrow">Manual room editor</span>
              <h1>{editor.image ? 'Shape your room.' : 'Start with a room.'}</h1>
            </div>
            <div className="editor-status">
              <Info size={14} />
              <span>Local preview · no cloud save yet</span>
            </div>
          </div>
          {error && <div className="editor-message editor-error" role="alert"><AlertCircle size={15} />{error}</div>}
          {editor.status && <div className="editor-message editor-success" role="status">{editor.status}</div>}
          <div className="editor-canvas-shell">
            <EditorCanvas
              image={editor.image}
              operations={editor.operations}
              draftPolygon={editor.draftPolygon}
              tool={editor.tool}
              brushSize={editor.brushSize}
              selectedColor={editor.selectedColor}
              isBefore={editor.isBefore}
              onAddPoint={editor.addPolygonPoint}
              onFinishPolygon={editor.finishPolygon}
              onCancelPolygon={editor.cancelPolygon}
              onAddOperation={editor.addOperation}
              onDownloadReady={(getImage) => {
                downloadImageRef.current = getImage
              }}
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
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tool={editor.tool}
          setTool={editor.setTool}
          brushSize={editor.brushSize}
          setBrushSize={editor.setBrushSize}
          blendStrength={editor.blendStrength}
          setBlendStrength={editor.setBlendStrength}
          selectedColor={editor.selectedColor}
          selectColor={editor.selectColor}
          recentColors={editor.recentColors}
        />
      </div>
    </div>
  )
}

export default Editor
