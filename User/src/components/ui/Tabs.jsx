function Tabs({ tabs }) {
  return (
    <div className="tabs">
      {tabs.map((tab, index) => (
        <button className={index === 0 ? 'chip dark' : 'chip'} key={tab}>
          {tab}
        </button>
      ))}
    </div>
  )
}

export default Tabs
