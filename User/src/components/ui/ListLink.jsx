import { FiChevronRight } from 'react-icons/fi'

function ListLink({ label, text, go }) {
  return (
    <button className="list-link" onClick={go}>
      <span>
        <strong>{label}</strong>
        {text && <small>{text}</small>}
      </span>
      <FiChevronRight />
    </button>
  )
}

export default ListLink
