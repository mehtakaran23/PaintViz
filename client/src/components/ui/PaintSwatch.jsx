function PaintSwatch({ name, hex, className = '' }) {
  return (
    <div className={`paint-card ${className}`}>
      <div className="paint-color-block" style={{ backgroundColor: hex }} />
      <div className="paint-card-copy">
        <div>
          <strong>{name}</strong>
          <span>{hex}</span>
        </div>
      </div>
    </div>
  )
}

export default PaintSwatch
