import { FiX } from 'react-icons/fi'
import { FaCarSide, FaMotorcycle } from 'react-icons/fa'
import FormField from '../components/ui/FormField'
import Pill from '../components/ui/Pill'
import PriceRow from '../components/ui/PriceRow'
import SectionTitle from '../components/ui/SectionTitle'

function CartScreen({ go, cartVisits }) {
  const visitCount = cartVisits.length
  const visitFee = visitCount * 150
  const riderFee = visitCount > 0 ? 220 : 0
  const total = visitFee + riderFee

  return (
    <div className="screen cart-layout">
      <section>
        <SectionTitle title={`Visit cart - ${visitCount} ${visitCount === 1 ? 'property' : 'properties'}`} action="Clear all" />
        {visitCount === 0 ? (
          <div className="empty-cart">
            <h2>No visits added yet</h2>
            <p>Add properties from the detail page, then come back here to book them together.</p>
            <button className="primary compact" onClick={() => go('home')}>
              Browse properties
            </button>
          </div>
        ) : (
          <>
            {cartVisits.map((item, index) => (
              <div className="cart-item" key={item.cartId}>
                <div className="cart-img" />
                <div>
                  <strong>{index + 1}. {item.title}</strong>
                  <p>{item.distance} - {item.price}</p>
                </div>
                <button>
                  <FiX />
                </button>
              </div>
            ))}
            <div className="route-card">
              <strong>Smart route - 14.2 km - saves 22 min</strong>
              <span>Indiranagar - Whitefield - Marathahalli - Sarjapur</span>
              <button>Reorder</button>
            </div>
            <div className="field-grid">
              <FormField label="Date" placeholder="Sat 15 May" />
              <FormField label="Time" placeholder="10:30 AM" />
              <FormField label="Pickup" placeholder="Indiranagar, 100ft Rd" />
            </div>
            <div className="vehicle-row">
              <Pill>Navigate</Pill>
              <Pill tone="dark">
                <FaMotorcycle /> Bike
              </Pill>
              <Pill>
                <FaCarSide /> Car + Rs120
              </Pill>
            </div>
          </>
        )}
      </section>
      <aside className="checkout-card">
        <h3>Price breakdown</h3>
        <PriceRow label={`Visit fee x ${visitCount}`} value={`Rs ${visitFee}`} />
        <PriceRow label="Rider (bike)" value={`Rs ${riderFee}`} />
        <PriceRow label="Add-ons" value="+ Add" link />
        <hr />
        <PriceRow label="Total" value={`Rs ${total}`} strong />
        <label className="small">
          <input type="checkbox" /> I accept the visit terms
        </label>
        <button className="primary" disabled={visitCount === 0} onClick={() => go('success')}>
          Pay & book
        </button>
      </aside>
    </div>
  )
}

export default CartScreen
