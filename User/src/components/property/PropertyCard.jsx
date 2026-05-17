function PropertyCard({ property, go }) {
  return (
    <article className="property-card" onClick={() => go('detail')}>
      <img src={property.image} alt={property.title} />
      <div className="property-body">
        <div className="row-between">
          <h3>{property.title}</h3>
          <span className="status success">{property.tag}</span>
        </div>
        <p>{property.price} - {property.meta}</p>
        <div className="row-between">
          <span>★ 4.6 (28)</span>
          <button
            className="primary compact"
            onClick={(event) => {
              event.stopPropagation()
              go('cart')
            }}
          >
            + Cart
          </button>
        </div>
      </div>
    </article>
  )
}

export default PropertyCard
