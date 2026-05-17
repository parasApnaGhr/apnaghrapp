import { navItems } from '../../config/navigation'

function Sidebar({ active, go }) {
  return (
    <aside className="sidebar">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={active === id ? 'side-link active' : 'side-link'}
          onClick={() => go(id)}
        >
          <Icon />
          {label}
        </button>
      ))}
    </aside>
  )
}

export default Sidebar
