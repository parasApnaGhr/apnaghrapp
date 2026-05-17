import { FaRupeeSign } from 'react-icons/fa'
import SectionTitle from '../components/ui/SectionTitle'
import Tabs from '../components/ui/Tabs'
import { paymentStatuses } from '../data/mockData'

function PaymentsScreen() {
  return (
    <div className="screen">
      <SectionTitle title="Transaction history" />
      <Tabs tabs={['All (24)', 'Success (21)', 'Pending (2)', 'Failed (1)']} />
      <div className="table-card">
        {paymentStatuses.map((status, index) => (
          <div className="payment-row" key={`${status}-${index}`}>
            <div className="pay-icon">
              <FaRupeeSign />
            </div>
            <div>
              <strong>Visit booking - BK-2841</strong>
              <p>15 May - UPI - **4421</p>
            </div>
            <strong>Rs 670</strong>
            <span className={`status ${status.toLowerCase()}`}>{status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PaymentsScreen
