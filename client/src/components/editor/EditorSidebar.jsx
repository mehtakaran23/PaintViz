import { Eraser, Hand, MousePointer2, Palette, Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { paintCatalogue, paintCategories } from '../../data/paintCatalogue.js'

function EditorSidebar({
  activeTab,
  setActiveTab,
  tool,
  setTool,
  brushSize,
  setBrushSize,
  blendStrength,
  setBlendStrength,
  selectedColor,
  selectColor,
  recentColors,
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All colours')
  const [customHex, setCustomHex] = useState('')
  const [customError, setCustomError] = useState('')
  const filteredPalette = useMemo(() => {
    const query = search.trim().toLowerCase()
    return paintCatalogue.filter((colour) =>
      (category === 'All colours' || colour.category === category) &&
      `${colour.name} ${colour.category} ${colour.hex}`.toLowerCase().includes(query),
    )
  }, [category, search])
  const selectedColour =
    paintCatalogue.find((colour) => colour.hex === selectedColor) ||
    { name: 'Custom colour', category: 'Custom', hex: selectedColor }

  const submitCustomColour = (event) => {
    event.preventDefault()
    if (!/^#[0-9a-fA-F]{6}$/.test(customHex)) {
      setCustomError('Use a six-digit hex code, for example #A8B29C.')
      return
    }
    selectColor(customHex)
    setCustomHex(customHex.toUpperCase())
    setCustomError('')
  }

  return (
    <aside className="editor-sidebar">
      <div className="editor-tabs" role="tablist">
        <button type="button" className={activeTab === 'colours' ? 'active' : ''} onClick={() => setActiveTab('colours')} role="tab">
          <Palette size={15} /> Colours
        </button>
        <button type="button" className={activeTab === 'tools' ? 'active' : ''} onClick={() => setActiveTab('tools')} role="tab">
          <SlidersHorizontal size={15} /> Tools
        </button>
      </div>

      {activeTab === 'colours' ? (
        <div className="editor-sidebar-content">
          <div className="editor-sidebar-intro">
            <span className="eyebrow">The colour edit</span>
            <h2>Find your tone.</h2>
            <p>Choose a shade, then click inside a selected wall to preview it.</p>
          </div>
          <label className="editor-search">
            <Search size={15} />
            <input aria-label="Search colours by name or hex code" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or #hex" />
          </label>
          <div className="editor-category-scroll" aria-label="Colour categories">
            {paintCategories.map((item) => (
              <button type="button" className={`editor-category-chip ${category === item ? 'active' : ''}`} key={item} onClick={() => setCategory(item)}>
                {item}
              </button>
            ))}
          </div>
          <div className="editor-selected-colour">
            <span className="editor-selected-swatch" style={{ backgroundColor: selectedColour.hex }} />
            <span><small>Selected colour</small><strong>{selectedColour.name}</strong><em>{selectedColour.hex}</em></span>
          </div>
          <form className="editor-custom-colour" onSubmit={submitCustomColour}>
            <label htmlFor="custom-hex">Custom hex</label>
            <div>
              <input id="custom-hex" value={customHex} onChange={(event) => { setCustomHex(event.target.value); setCustomError('') }} placeholder="#A8B29C" maxLength={7} />
              <button type="submit">Use</button>
            </div>
            {customError && <small>{customError}</small>}
          </form>
          {recentColors.length > 0 && (
            <div className="editor-recent">
              <span>Recently used</span>
              <div>
                {recentColors.map((hex) => (
                  <button type="button" key={hex} className={`editor-recent-swatch ${selectedColor === hex ? 'active' : ''}`} style={{ backgroundColor: hex }} onClick={() => selectColor(hex)} aria-label={`Use recent colour ${hex}`} title={hex} />
                ))}
              </div>
            </div>
          )}
          <div className="editor-palette">
            {filteredPalette.map((colour) => (
              <button
                type="button"
                className={`editor-palette-item ${selectedColor === colour.hex ? 'active' : ''}`}
                key={colour.hex}
                onClick={() => selectColor(colour.hex)}
              >
                <span className="editor-palette-swatch" style={{ backgroundColor: colour.hex }} />
                <span><strong>{colour.name}</strong><small>{colour.category} · {colour.hex}</small></span>
              </button>
            ))}
          </div>
          <label className="blend-control">
            <span>Blend strength <strong>{blendStrength}%</strong></span>
            <input type="range" min="20" max="80" value={blendStrength} onChange={(event) => setBlendStrength(Number(event.target.value))} aria-label="Paint blend strength" />
          </label>
          <div className="editor-disclaimer"><Sparkles size={14} /><span>Preview blends colour with photo texture, highlights and shadows. It is a visual guide, not an exact physical paint simulation.</span></div>
        </div>
      ) : (
        <div className="editor-sidebar-content">
          <div className="editor-sidebar-intro">
            <span className="eyebrow">Manual selection</span>
            <h2>Shape your wall.</h2>
            <p>There is no automatic AI detection here — you stay in control of every point.</p>
          </div>
          <div className="editor-tool-list">
            <button type="button" className={`editor-tool-card ${tool === 'polygon' ? 'active' : ''}`} onClick={() => setTool('polygon')}>
              <MousePointer2 size={17} /><span><strong>Polygon select</strong><small>Click points, then click the first point to close.</small></span>
            </button>
            <button type="button" className={`editor-tool-card ${tool === 'brush' ? 'active' : ''}`} onClick={() => setTool('brush')}>
              <Hand size={17} /><span><strong>Brush selection</strong><small>Paint over areas to add to your selection.</small></span>
            </button>
            <button type="button" className={`editor-tool-card ${tool === 'eraser' ? 'active' : ''}`} onClick={() => setTool('eraser')}>
              <Eraser size={17} /><span><strong>Eraser</strong><small>Remove brush strokes from the selection.</small></span>
            </button>
          </div>
          {(tool === 'brush' || tool === 'eraser') && (
            <label className="brush-control">
              <span>Brush size <strong>{brushSize}px</strong></span>
              <input type="range" min="8" max="80" value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} aria-label="Brush size" />
            </label>
          )}
          <div className="editor-tip"><strong>Tip</strong><span>Use the polygon tool for clean architectural edges. Use brush and eraser to refine the selection.</span></div>
        </div>
      )}
    </aside>
  )
}

export default EditorSidebar
