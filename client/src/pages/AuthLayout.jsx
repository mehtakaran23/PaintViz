import { ArrowLeft, Paintbrush } from 'lucide-react'
import { Link } from 'react-router-dom'

function AuthLayout({ children, title, description, visualTitle, visualDescription }) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link className="brand" to="/" aria-label="PaintViz home">
          <span className="brand-mark"><Paintbrush size={17} /></span>
          <span>
            PaintViz
            <span className="brand-subtitle">Smart wall paint visualizer</span>
          </span>
        </Link>
        <div className="auth-heading">
          <Link className="back-link" to="/"><ArrowLeft size={13} /> Back to home</Link>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {children}
      </section>
      <aside className="auth-visual">
        <img
          className="auth-visual-image"
          src="https://images.unsplash.com/photo-1617104678098-de229db51175?auto=format&fit=crop&w=1200&q=85"
          alt=""
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
        <div className="auth-visual-copy">
          <span className="eyebrow">Your room, reimagined</span>
          <h2>{visualTitle}</h2>
          <p>{visualDescription}</p>
        </div>
      </aside>
    </main>
  )
}

export default AuthLayout
