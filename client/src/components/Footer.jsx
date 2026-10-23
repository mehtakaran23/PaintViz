import { ArrowUpRight, Paintbrush } from 'lucide-react'
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <Paintbrush size={16} strokeWidth={2.2} />
          </span>
          <span>PaintViz</span>
        </Link>
        <span className="footer-copy">A calmer way to choose your next wall colour.</span>
        <div className="footer-links">
          <a href="mailto:hello@paintviz.example">Contact <ArrowUpRight size={11} /></a>
          <a href="/#colours">Colour library</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
