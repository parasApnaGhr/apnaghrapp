import { FiBell, FiSearch, FiUser } from 'react-icons/fi'

function Topbar({ go }) {
  return (
    <header className="topbar">
      <button className="brand" onClick={() => go('home')}>
        apnaghr
      </button>
      <div className="global-search">
        <FiSearch />
        <input placeholder="Search localities, properties..." />
      </div>
      <div className="top-actions">
        <button aria-label="notifications" onClick={() => go('notifications')}>
          <FiBell />
        </button>
        <button aria-label="profile" onClick={() => go('profile')}>
          <FiUser />
        </button>
      </div>
    </header>
  )
}

export default Topbar
