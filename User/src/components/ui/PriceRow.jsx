function PriceRow({ label, value, strong, link }) {
  return (
    <div className={strong ? 'price-row strong' : link ? 'price-row linkish' : 'price-row'}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  )
}

export default PriceRow
