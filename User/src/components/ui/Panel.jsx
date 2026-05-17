function Panel({ title, action, children }) {
  return (
    <section className="panel">
      <div className="row-between">
        <h2>{title}</h2>
        {action && <button className="link">{action}</button>}
      </div>
      {children}
    </section>
  )
}

export default Panel
