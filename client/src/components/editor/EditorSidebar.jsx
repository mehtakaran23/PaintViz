import { Eraser, Hand, MousePointer2, Palette, Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { paintCatalogue as localCatalogue, paintCategories as localCategories } from '../../data/paintCatalogue.js'

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
  onSelectColor,
  recentColors,
  regions,
  activeRegionId,
  selectRegion,
  renameRegion,
  deleteRegion,
  catalogue = localCatalogue,
  categories = localCategories,
  catalogueLoading = false,
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All colours')
  const [customHex, setCustomHex] = useState('')
  const [customError, setCustomError] = useState('')
  const [renameDrafts, setRenameDrafts] = useState({})
  const tabRefs = useRef([])
  const filteredPalette = useMemo(() => {
    const query = search.trim().toLowerCase()
    return catalogue.filter((colour) =>
      (category === 'All colours' || colour.category === category) &&
      `${colour.name} ${colour.category} ${colour.hex}`.toLowerCase().includes(query),
    )
  }, [catalogue, category, search])
  const selectedColour =
    catalogue.find((colour) => colour.hex === selectedColor) ||
    { name: 'Custom colour', category: 'Custom', hex: selectedColor }

  const submitCustomColour = (event) => {
    event.preventDefault()
    if (!/^#[0-9a-fA-F]{6}$/.test(customHex)) {
      setCustomError('Use a six-digit hex code, for example #A8B29C.')
      return
    }
    onSelectColor(customHex)
    setCustomHex(customHex.toUpperCase())
    setCustomError('')
  }

  const updateRenameDraft = (regionId, name) => {
    setRenameDrafts((current) => ({ ...current, [regionId]: name }))
  }

  const commitRename = (regionId, fallbackName) => {
    const draft = renameDrafts[regionId]
    if (draft === undefined) return
    renameRegion(regionId, draft)
    setRenameDrafts((current) => {
      const next = { ...current }
      delete next[regionId]
      return next
    })
    if (!draft.trim()) updateRenameDraft(regionId, fallbackName)
  }

  const handleTabKeyDown = (event, index) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? 1
        : event.key === 'ArrowRight'
          ? (index + 1) % 2
          : (index + 1) % 2
    const nextTab = nextIndex === 0 ? 'colours' : 'tools'
    setActiveTab(nextTab)
    tabRefs.current[nextIndex]?.focus()
  }

  return (
    <aside className="editor-sidebar">
      <div className="editor-tabs" role="tablist">
        <button
          ref={(element) => { tabRefs.current[0] = element }}
          id="editor-tab-colours"
          type="button"
          className={activeTab === 'colours' ? 'active' : ''}
          onClick={() => setActiveTab('colours')}
          onKeyDown={(event) => handleTabKeyDown(event, 0)}
          role="tab"
          aria-selected={activeTab === 'colours'}
          aria-controls="editor-panel-colours"
          tabIndex={activeTab === 'colours' ? 0 : -1}
        >
          <Palette size={15} /> Colours
        </button>
        <button
          ref={(element) => { tabRefs.current[1] = element }}
          id="editor-tab-tools"
          type="button"
          className={activeTab === 'tools' ? 'active' : ''}
          onClick={() => setActiveTab('tools')}
          onKeyDown={(event) => handleTabKeyDown(event, 1)}
          role="tab"
          aria-selected={activeTab === 'tools'}
          aria-controls="editor-panel-tools"
          tabIndex={activeTab === 'tools' ? 0 : -1}
        >
          <SlidersHorizontal size={15} /> Tools
        </button>
      </div>

      {activeTab === 'colours' ? (
        <div className="editor-sidebar-content" id="editor-panel-colours" role="tabpanel" aria-labelledby="editor-tab-colours" tabIndex={0}>
          <div className="editor-sidebar-intro">
            <span className="eyebrow">The colour edit</span>
            <h2>Find your tone.</h2>
            <p>Choose a shade, then click inside a selected wall to preview it.</p>
          </div>
          {catalogueLoading && <div className="editor-catalogue-status" role="status">Loading saved colour catalogue…</div>}
          <label className="editor-search">
            <Search size={15} />
            <input aria-label="Search colours by name or hex code" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or #hex" />
          </label>
          <div className="editor-category-scroll" aria-label="Colour categories">
            {categories.map((item) => (
              <button type="button" className={`editor-category-chip ${category === item ? 'active' : ''}`} key={item} onClick={() => setCategory(item)}>
                {item}
              </button>
            ))}
          </div>
          <div className="editor-selected-colour">
            <span className="editor-selected-swatch" style={{ backgroundColor: selectedColour.hex }} />
            <span><small>Selected colour</small><strong>{selectedColour.name}</strong><em>{selectedColour.hex}</em></span>
          </div>
          {regions.length > 0 && (
            <div className="editor-regions" aria-label="Wall regions">
              <span className="editor-region-heading">Wall regions</span>
              {regions.map((region) => (
                <div className={`editor-region ${activeRegionId === region.id ? 'active' : ''}`} key={region.id}>
                  <button type="button" onClick={() => selectRegion(region.id)}>
                    <span className="editor-palette-swatch" style={{ backgroundColor: region.color }} />
                    <span>{region.name}</span>
                  </button>
                  <input
                    value={renameDrafts[region.id] ?? region.name}
                    aria-label={`Rename ${region.name}`}
                    onChange={(event) => updateRenameDraft(region.id, event.target.value)}
                    onBlur={() => commitRename(region.id, region.name)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        event.currentTarget.blur()
                      }
                    }}
                  />
                  <button type="button" onClick={() => deleteRegion(region.id)} aria-label={`Delete ${region.name}`}>×</button>
                </div>
              ))}
            </div>
          )}
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
                  <button type="button" key={hex} className={`editor-recent-swatch ${selectedColor === hex ? 'active' : ''}`} style={{ backgroundColor: hex }} onClick={() => onSelectColor(hex)} aria-label={`Use recent colour ${hex}`} title={hex} />
                ))}
              </div>
            </div>
          )}
          <div className="editor-palette">
            {filteredPalette.map((colour) => (
              <button
                type="button"
                className={`editor-palette-item ${selectedColor === colour.hex ? 'active' : ''}`}
                key={colour.id}
                onClick={() => onSelectColor(colour.hex)}
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
        <div className="editor-sidebar-content" id="editor-panel-tools" role="tabpanel" aria-labelledby="editor-tab-tools" tabIndex={0}>
          <div className="editor-sidebar-intro">
            <span className="eyebrow">Manual selection</span>
            <h2>Shape your wall.</h2>
            <p>There is no automatic AI detection here — you stay in control of every point.</p>
          </div>
          <div className="editor-tool-list">
            <button type="button" className={`editor-tool-card ${tool === 'polygon' ? 'active' : ''}`} onClick={() => setTool('polygon')} aria-pressed={tool === 'polygon'}>
              <MousePointer2 size={17} /><span><strong>Polygon select</strong><small>Click points, then click the first point to close.</small></span>
            </button>
            <button type="button" className={`editor-tool-card ${tool === 'brush' ? 'active' : ''}`} onClick={() => setTool('brush')} aria-pressed={tool === 'brush'}>
              <Hand size={17} /><span><strong>Brush selection</strong><small>Paint over areas to add to your selection.</small></span>
            </button>
            <button type="button" className={`editor-tool-card ${tool === 'eraser' ? 'active' : ''}`} onClick={() => setTool('eraser')} aria-pressed={tool === 'eraser'}>
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
