import { FiShield } from 'react-icons/fi'

function Notice({ text }) {
  return (
    <div className="notice">
      <FiShield />
      {text}
    </div>
  )
}

export default Notice
