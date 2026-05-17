import { bottomItems } from '../../config/navigation'

function BottomNav({ active, go }) {
  return (
    <nav className="bottom-nav">
      {bottomItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={active === id ? 'bottom-link active' : 'bottom-link'}
          onClick={() => go(id)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

export default BottomNav
