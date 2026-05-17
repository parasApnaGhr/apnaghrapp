import Notice from '../components/ui/Notice'
import Pill from '../components/ui/Pill'
import SectionTitle from '../components/ui/SectionTitle'
import PropertyCard from '../components/property/PropertyCard'
import SearchStrip from '../components/property/SearchStrip'
import { properties } from '../data/mockData'

function HomeScreen({ go }) {
  return (
    <div className="screen">
      <SearchStrip />
      <div className="active-visit">
        <div>
          <strong>Active visit - BK-2841</strong>
          <p>
            <span className="status success">Rider en route</span> ETA 12 min
          </p>
        </div>
        <button className="primary compact" onClick={() => go('trip')}>
          Track
        </button>
      </div>
      <div className="sponsored">
        <b>Sponsored</b>
        <span>Lakeview Residences - Whitefield - 20% off booking fee</span>
      </div>
      <SectionTitle title="Featured properties" action="See all" />
      <div className="property-grid">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} go={go} />
        ))}
      </div>
      <div className="info-row">
        <Pill>★★★★★ Found my home in 3 visits.</Pill>
        <Pill tone="success">Verified RERA listings only</Pill>
        <Pill>Transparent pricing, no broker fee</Pill>
      </div>
      <Notice text="Marquee auto-scrolls. Voice search opens mic permission sheet." />
    </div>
  )
}

export default HomeScreen
