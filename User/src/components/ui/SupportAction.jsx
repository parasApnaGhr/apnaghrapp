function SupportAction({ icon, title, text }) {
  return (
    <div className="support-action">
      {icon}
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  )
}

export default SupportAction
