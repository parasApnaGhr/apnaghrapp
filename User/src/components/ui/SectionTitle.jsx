function SectionTitle({ title, action }) {
  return (
    <div className="section-title">
      <h1>{title}</h1>
      {action && <button className="link">{action}</button>}
    </div>
  )
}

export default SectionTitle
