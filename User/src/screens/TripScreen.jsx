import { FiCheck, FiPhone } from 'react-icons/fi'
import { FaCarSide } from 'react-icons/fa'
import Metric from '../components/ui/Metric'
import Panel from '../components/ui/Panel'

function TripScreen() {
  return (
    <div className="screen trip-layout">
      <section>
        <div className="row-between">
          <div>
            <h1>Live trip - BK-2841</h1>
            <p>3 properties - started 10:18 AM</p>
          </div>
          <span className="status success">Live - polling 8s</span>
        </div>
        <div className="map-panel">
          <span className="pin p1">1</span>
          <span className="pin p2">2</span>
          <span className="pin p3">3</span>
          <span className="car-pin">
            <FaCarSide />
          </span>
          <span className="map-note">map - poll 8s</span>
        </div>
        <div className="metric-row">
          <Metric label="ETA" value="12 min" />
          <Metric label="Distance" value="3.4 km" />
          <Metric label="Next stop" value="Whitefield" />
        </div>
      </section>
      <aside className="checkout-card">
        <Panel title="Progress">
          {['Accepted', 'Pickup', 'En route', 'At property', 'Completed'].map((item, index) => (
            <p className={index < 3 ? 'done' : 'pending'} key={item}>
              <FiCheck /> {item}
            </p>
          ))}
        </Panel>
        <div className="pin-card">
          <span>Trip PIN</span>
          <strong>4 8 2 9</strong>
        </div>
        <div className="rider-line">
          <div className="avatar" />
          <div>
            <strong>Suresh K.</strong>
            <p>4.9 - KA-01 BX 2841</p>
          </div>
        </div>
        <button className="primary">
          <FiPhone /> Call rider
        </button>
      </aside>
    </div>
  )
}

export default TripScreen
