function MobileHeader({ go }) {
  return (
    <header className="mobile-header">
      <button className="brand mobile-brand" onClick={() => go('home')}>
        apnaghr
      </button>
      <div className="mobile-header-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </header>
  )
}

export default MobileHeader
