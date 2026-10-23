import {
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  Layers3,
  Palette,
  Save,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import PaintSwatch from '../components/ui/PaintSwatch.jsx'

const colours = [
  { name: 'Quiet Sage', hex: '#A8B29C' },
  { name: 'Terracotta', hex: '#C9856C' },
  { name: 'Harbour Blue', hex: '#9CAEB5' },
  { name: 'Warm Linen', hex: '#DCCDBB' },
  { name: 'Inkstone', hex: '#4B4943' },
]

const features = [
  {
    number: '01',
    title: 'Bring your room',
    body: 'Upload a room photo and keep the details that make your space feel like yours.',
  },
  {
    number: '02',
    title: 'Find your colour',
    body: 'Browse a considered palette of tones designed to work beautifully together.',
  },
  {
    number: '03',
    title: 'Preview with ease',
    body: 'See an idea take shape before a single brush touches the wall.',
  },
  {
    number: '04',
    title: 'Keep your ideas',
    body: 'Save your favourite directions in one calm, creative workspace.',
  },
]

const steps = [
  { icon: Camera, title: 'Share a room', body: 'Upload a photo of the room you are ready to rethink.' },
  { icon: Palette, title: 'Choose a mood', body: 'Explore shades from soft neutrals to confident colour.' },
  { icon: WandSparkles, title: 'Make it yours', body: 'Preview, compare and save the directions that feel right.' },
]

function Home() {
  const { user } = useAuth()
  const startLink = user ? '/dashboard' : '/register'

  return (
    <main>
      <section className="hero-section page-shell" id="home">
        <div className="hero-copy">
          <span className="eyebrow">A new perspective on home</span>
          <h1>Bring your walls <em>to life</em> before you paint.</h1>
          <p>
            Turn a room photo into a clear, confident colour direction.
            PaintViz helps you explore the possibilities while the decision
            is still yours to make.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to={startLink}>
              Start visualizing <ArrowRight size={15} />
            </Link>
            <a className="button button-secondary" href="#colours">
              Explore colours <ChevronRight size={15} />
            </a>
          </div>
          <div className="hero-note">
            <Check size={14} strokeWidth={2.5} />
            Thoughtful tools for more considered rooms
          </div>
        </div>

        <div className="room-visual" aria-label="PaintViz room preview">
          <img
            className="room-image"
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85"
            alt="Warm, modern living room with a painted accent wall"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
          <span className="room-label"><Sparkles size={13} /> Live preview</span>
          <div className="swatch-picker">
            <p>Try a new mood</p>
            <div className="picker-row">
              {colours.slice(0, 4).map((colour, index) => (
                <span
                  className={`picker-swatch ${index === 0 ? 'active' : ''}`}
                  key={colour.hex}
                  style={{ backgroundColor: colour.hex }}
                  title={`${colour.name} ${colour.hex}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="trust-row page-shell" aria-label="PaintViz benefits">
        <div className="trust-item"><span className="trust-icon"><Palette size={16} /></span><span><strong>Real paint colours</strong><span>Thoughtfully curated</span></span></div>
        <div className="trust-item"><span className="trust-icon"><Clock3 size={16} /></span><span><strong>Instant preview</strong><span>Ideas, in a moment</span></span></div>
        <div className="trust-item"><span className="trust-icon"><Save size={16} /></span><span><strong>Save designs</strong><span>Return when ready</span></span></div>
        <div className="trust-item"><span className="trust-icon"><Layers3 size={16} /></span><span><strong>Any room, any mood</strong><span>Made for your space</span></span></div>
      </section>

      <section className="section section-shell" id="features">
        <div className="section-heading">
          <div>
            <span className="eyebrow">The PaintViz approach</span>
            <h2>Less guesswork.<br />More feeling.</h2>
          </div>
          <p>Good colour decisions start with seeing an idea in context. We keep the process simple, visual and entirely yours.</p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <span className="feature-number">{feature.number}</span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section steps-section" id="how-it-works">
        <div className="section-shell">
          <div className="section-heading">
            <div>
              <span className="eyebrow">How it works</span>
              <h2>Your next room,<br />in three steps.</h2>
            </div>
            <p>From first thought to a shortlist you can trust, make the creative part of decorating feel effortless.</p>
          </div>
          <div className="steps-grid">
            {steps.map(({ icon: Icon, title, body }, index) => (
              <article className="step" key={title}>
                <div className="step-icon"><Icon size={19} /></div>
                <h3>0{index + 1} / {title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-shell" id="colours">
        <div className="section-heading">
          <div>
            <span className="eyebrow">The colour edit</span>
            <h2>Shades with<br />some soul.</h2>
          </div>
          <p>A starting point for rooms that feel warm, personal and lived in. Discover more colours inside the studio.</p>
        </div>
        <div className="palette-grid">
          {colours.map((colour) => (
            <PaintSwatch {...colour} key={colour.hex} />
          ))}
        </div>
        <Link className="palette-link" to={startLink}>
          Start with a colour <ArrowRight size={14} />
        </Link>
      </section>

      <section className="cta-section section-shell">
        <div className="cta-panel">
          <div>
            <span className="eyebrow">Make space for possibility</span>
            <h2>The right colour is already in your imagination.</h2>
          </div>
          <Link className="button button-light" to={startLink}>
            Create your studio <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  )
}

export default Home
