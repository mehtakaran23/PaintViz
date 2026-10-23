function LoadingIndicator({ fullPage = false, label = 'Loading...' }) {
  return (
    <div className={fullPage ? 'loading-screen' : 'loading-inline'} role="status">
      <span className="loading-dot" />
      <span>{label}</span>
    </div>
  )
}

export default LoadingIndicator
