import { FiLock } from 'react-icons/fi'
import Notice from '../components/ui/Notice'
import Panel from '../components/ui/Panel'
import Pill from '../components/ui/Pill'
import VisitSteps from '../components/property/VisitSteps'

const selectedProperty = {
  id: 'whitefield-3bhk',
  title: '3 BHK - Whitefield',
  distance: '4.2 km from previous',
  price: 'Rs 1.45 Cr',
}

function PropertyDetailScreen({ go, onAddVisit, isPublic = false }) {
  const handlePrimaryVisit = () => {
    if (isPublic) {
      go('auth')
      return
    }

    onAddVisit(selectedProperty)
  }

  return (
    <div className="screen detail-layout">
      <section className="detail-main">
        <button className="link" onClick={() => go('home')}>
          ‹ Back to results - Whitefield
        </button>
        <div className="gallery-hero">hero gallery - click for lightbox</div>
        <div className="thumb-row">
          {[1, 2, 3, 4, 5].map((item) => (
            <div className="thumb" key={item} />
          ))}
          <button className="primary compact">Video tour</button>
        </div>
        <div className="tag-row">
          <Pill>RERA ✓</Pill>
          <Pill>2 BHK - 3 BHK</Pill>
          <Pill tone="success">Ready to move</Pill>
          <Pill>EMI Rs 95k/mo</Pill>
        </div>
        <Panel title="How it works">
          <VisitSteps />
        </Panel>
        {/* <Panel title="EMI calculator" action="Expand">
          <div className="field-grid">
            <FormField label="Loan amount" placeholder="Rs 1.15 Cr" />
            <FormField label="Tenure" placeholder="20 yrs" />
            <FormField label="Rate" placeholder="8.5%" />
          </div>
        </Panel> */}
      </section>
      <aside className="checkout-card">
        <h2>Rs 1.45 Cr</h2>
        <p>3 BHK - 1,820 sqft - Whitefield</p>
        <div className="warning">
          Location hidden
          <br />
          {isPublic ? 'Sign in to book visit or view exact pin' : 'Revealed after booking confirmation'}
        </div>
        <button className="primary" onClick={handlePrimaryVisit}>
          {isPublic ? 'Book visit' : 'Book single visit'}
        </button>
        {!isPublic && (
          <button className="secondary" onClick={() => onAddVisit(selectedProperty)}>
            + Add to multi-visit cart
          </button>
        )}
        {!isPublic && (
          <button className="green-btn">
            <FiLock /> Lock property (24h)
          </button>
        )}
        {isPublic && (
          <Notice text="CTA stays fixed on mobile. Tapping it pre-login opens the auth modal then resumes booking." />
        )}
      </aside>
    </div>
  )
}

export default PropertyDetailScreen
