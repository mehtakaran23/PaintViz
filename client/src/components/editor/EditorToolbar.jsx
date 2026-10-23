import {
  ArrowLeft,
  Download,
  ImagePlus,
  Redo2,
  RotateCcw,
  Save,
  Undo2,
} from 'lucide-react'
import { Link } from 'react-router-dom'

function EditorToolbar({
  onUpload,
  onUndo,
  onRedo,
  onReset,
  onSave,
  onDownload,
  canUndo,
  canRedo,
}) {
  return (
    <header className="editor-toolbar">
      <div className="editor-toolbar-left">
        <Link className="editor-back" to="/dashboard" aria-label="Back to dashboard">
          <ArrowLeft size={17} />
          <span>Back</span>
        </Link>
        <span className="editor-divider" />
        <span className="editor-title">Room editor</span>
      </div>
      <div className="editor-toolbar-actions">
        <label className="editor-tool-button editor-upload-button">
          <ImagePlus size={15} />
          <span>Upload image</span>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={onUpload}
          />
        </label>
        <button type="button" className="editor-icon-button" onClick={onUndo} disabled={!canUndo} title="Undo">
          <Undo2 size={16} />
          <span>Undo</span>
        </button>
        <button type="button" className="editor-icon-button" onClick={onRedo} disabled={!canRedo} title="Redo">
          <Redo2 size={16} />
          <span>Redo</span>
        </button>
        <button type="button" className="editor-icon-button" onClick={onReset} title="Reset">
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button type="button" className="editor-action-button" onClick={onSave}>
          <Save size={15} />
          <span>Save</span>
        </button>
        <button type="button" className="editor-action-button editor-download" onClick={onDownload}>
          <Download size={15} />
          <span>Download</span>
        </button>
      </div>
    </header>
  )
}

export default EditorToolbar

