import {
  ArrowRight,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Palette,
  Plus,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import EmptyState from '../components/ui/EmptyState.jsx'
import LoadingIndicator from '../components/ui/LoadingIndicator.jsx'
import { deleteDesign, listDesigns } from '../services/designService.js'

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function uniqueColourCount(designs) {
  return new Set(
    designs.flatMap((design) => (
      design.selectedColors || []
    ).map((colour) => {
      if (!colour || typeof colour !== 'object') return null
      const colourId = typeof colour.colorId === 'string' ? colour.colorId.trim() : ''
      const hexCode = typeof colour.hexCode === 'string' ? colour.hexCode.trim().toUpperCase() : ''
      return colourId || (/^#[0-9A-F]{6}$/.test(hexCode) ? hexCode : null)
    }).filter(Boolean)),
  ).size
}

function Dashboard() {
  const { user, token, logout } = useAuth()
  const [designs, setDesigns] = useState([])
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(true)
  const [designError, setDesignError] = useState('')
  const [deletingId, setDeletingId] = useState('')

  useEffect(() => {
    let isMounted = true
    listDesigns(token)
      .then(({ designs: savedDesigns }) => {
        if (isMounted) setDesigns(savedDesigns)
      })
      .catch((error) => {
        if (isMounted) setDesignError(error.message)
      })
      .finally(() => {
        if (isMounted) setIsLoadingDesigns(false)
      })
    return () => {
      isMounted = false
    }
  }, [token])

  const handleDelete = async (designId) => {
    if (!window.confirm('Delete this saved design?')) return
    setDeletingId(designId)
    setDesignError('')
    try {
      await deleteDesign(token, designId)
      setDesigns((current) => current.filter((design) => design._id !== designId))
    } catch (error) {
      setDesignError(error.message)
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <Link className="brand" to="/" aria-label="PaintViz home">
          <span className="brand-mark"><Sparkles size={16} /></span>
          <span>PaintViz<span className="brand-subtitle">Your colour studio</span></span>
        </Link>
        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          <Link className="sidebar-link active" to="/dashboard"><LayoutDashboard size={16} /> Overview</Link>
          <span className="sidebar-link"><FolderOpen size={16} /> Saved designs</span>
          <a className="sidebar-link" href="/#colours"><Palette size={16} /> Colour library</a>
        </nav>
        <div className="sidebar-note">
          <strong>Ready to explore?</strong>
          <p>Upload a room photo, explore wall colours and save your favourite directions.</p>
          <Link className="button button-primary button-small" to="/editor">Open editor</Link>
        </div>
        <button className="sidebar-link" type="button" onClick={logout}><LogOut size={16} /> Log out</button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="eyebrow">Your studio</span>
            <h1>Good morning, {user?.name?.split(' ')[0] || 'there'}.</h1>
          </div>
          <div className="dashboard-user">
            <span className="avatar">{initials(user?.name)}</span>
            <span><strong>{user?.name}</strong><span>{user?.email}</span></span>
          </div>
        </header>

        <section className="stats-grid" aria-label="Design statistics">
          <div className="stat-card"><span>Saved designs</span><strong>{designs.length}</strong></div>
          <div className="stat-card"><span>Colours explored</span><strong>{uniqueColourCount(designs)}</strong></div>
          <div className="stat-card"><span>Current direction</span><strong>{designs[0]?.title ? '1' : '—'}</strong></div>
        </section>

        <section>
          <div className="dashboard-section-head">
            <h2>Recent designs</h2>
            <span>{isLoadingDesigns ? 'Loading saved designs' : 'Synced to your account'}</span>
          </div>
          {isLoadingDesigns && <LoadingIndicator label="Loading designs..." />}
          {!isLoadingDesigns && designError && <div className="form-error" role="alert">{designError}</div>}
          {!isLoadingDesigns && !designError && designs.length === 0 && (
            <EmptyState
              title="Your first room is waiting."
              description="Upload a room photo, select your walls manually, and save your paint direction to your account."
              action={<Link className="button button-primary button-small" to="/editor">Open editor <ArrowRight size={13} /></Link>}
            />
          )}
          {!isLoadingDesigns && !designError && designs.length > 0 && (
            <div className="design-list">
              {designs.map((design) => (
                <article className="saved-design-card" key={design._id}>
                  <div className="saved-design-colour" style={{ backgroundColor: design.selectedColors?.[0]?.hexCode || '#DCCDBB' }} />
                  <div><Link to={`/editor?designId=${design._id}`}><strong>{design.title}</strong></Link><span>{design.selectedColors?.length || 0} selected colours · {new Date(design.updatedAt).toLocaleDateString()}</span></div>
                  <button type="button" className="saved-design-delete" onClick={() => handleDelete(design._id)} disabled={deletingId === design._id}>{deletingId === design._id ? 'Deleting…' : 'Delete'}</button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="quick-actions" aria-label="Quick actions">
          <Link className="quick-action" to="/editor"><Plus size={18} /><span><strong>Start a direction</strong><span>Open the room editor</span></span></Link>
          <a className="quick-action" href="/#how-it-works"><Sparkles size={18} /><span><strong>See how it works</strong><span>Learn the PaintViz approach</span></span></a>
          <Link className="quick-action" to="/dashboard"><FolderOpen size={18} /><span><strong>Saved designs</strong><span>Open your saved room directions</span></span></Link>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
