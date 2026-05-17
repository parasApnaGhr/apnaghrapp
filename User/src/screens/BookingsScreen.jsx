import { FiPhone } from 'react-icons/fi'
import Notice from '../components/ui/Notice'
import SectionTitle from '../components/ui/SectionTitle'
import Tabs from '../components/ui/Tabs'
import { bookings } from '../data/mockData'

function BookingsScreen({ go }) {
  return (
    <div className="screen">
      <SectionTitle title="My bookings" />
      <Tabs tabs={['Active (2)', 'Completed (8)']} />
      <div className="booking-grid">
        {bookings.map((booking) => (
          <article className="booking-card" key={booking.id}>
            <div className="row-between">
              <strong>{booking.id} - SAT 15 MAY</strong>
              <button className="primary compact" onClick={() => go('trip')}>
                {booking.cta}
              </button>
            </div>
            <span className={`status ${booking.tone}`}>{booking.status}</span>
            <div className="rider-line">
              <div className="avatar" />
              <div>
                <strong>{booking.rider}</strong>
                <p>4.9 - {booking.eta}</p>
              </div>
              <button className="call">
                <FiPhone /> Call
              </button>
            </div>
            <p>3 properties - Whitefield - Marathahalli - Sarjapur</p>
          </article>
        ))}
      </div>
      <Notice text="Finding-rider card has subtle pulse animation. Auto-promotes to active when matched." />
    </div>
  )
}

export default BookingsScreen
