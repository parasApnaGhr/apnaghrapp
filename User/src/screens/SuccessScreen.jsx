import { FiCheck } from 'react-icons/fi'
import Notice from '../components/ui/Notice'
import PriceRow from '../components/ui/PriceRow'

function SuccessScreen({ go }) {
  return (
    <div className="success-screen">
      <div className="success-card">
        <div className="success-mark">
          <FiCheck />
        </div>
        <h1>Payment successful</h1>
        <p>Your visit is confirmed. Redirecting to Bookings...</p>
        <div className="receipt">
          <PriceRow label="Booking" value="BK-2841" />
          <PriceRow label="Amount" value="Rs 670" />
          <PriceRow label="Method" value="UPI - HDFC **4421" />
          <PriceRow label="Time" value="15 May - 10:18" />
        </div>
        <div className="button-row">
          <button className="primary" onClick={() => go('bookings')}>
            View booking
          </button>
          <button className="secondary" onClick={() => go('home')}>
            Back to home
          </button>
        </div>
        <Notice text="Async polls payment gateway. Has states for success, pending, expired, timeout/error retry CTA." />
      </div>
    </div>
  )
}

export default SuccessScreen
