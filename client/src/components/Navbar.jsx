import { Menu, Paintbrush, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  const closeMenu = () => setIsOpen(false)

  return (
    <header className="site-nav">
      <Link className="brand" to="/" onClick={closeMenu} aria-label="PaintViz home">
        <span className="brand-mark">
          <Paintbrush size={17} strokeWidth={2.2} />
        </span>
        <span>
          PaintViz
          <span className="brand-subtitle">Smart wall paint visualizer</span>
        </span>
      </Link>

      <nav className={`nav-links ${isOpen ? 'is-open' : ''}`} aria-label="Main navigation">
        <a href="/#home" onClick={closeMenu}>Home</a>
        <a href="/#features" onClick={closeMenu}>Features</a>
        <a href="/#how-it-works" onClick={closeMenu}>How it works</a>
        <a href="/#colours" onClick={closeMenu}>Colours</a>
      </nav>

      <div className={`nav-actions ${isOpen ? 'is-open' : ''}`}>
        {user ? (
          <Link className="button button-primary button-small" to="/dashboard" onClick={closeMenu}>
            Open studio
          </Link>
        ) : (
          <>
            <Link className="nav-login" to="/login" onClick={closeMenu}>Log in</Link>
            <Link className="button button-primary button-small" to="/register" onClick={closeMenu}>
              Sign up
            </Link>
          </>
        )}
      </div>

      <button
        className="nav-toggle"
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
    </header>
  )
}

export default Navbar
