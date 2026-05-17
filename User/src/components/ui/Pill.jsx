function Pill({ children, tone }) {
  return <span className={tone ? `pill ${tone}` : 'pill'}>{children}</span>
}

export default Pill
