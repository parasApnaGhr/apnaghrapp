import { FiEdit2, FiMapPin } from 'react-icons/fi'
import ListLink from '../components/ui/ListLink'
import Metric from '../components/ui/Metric'
import Panel from '../components/ui/Panel'
import { FiCamera } from "react-icons/fi";

function ProfileScreen({ go }) {
  return (
    <div className="screen">
      <div className="profile-head">
      <div className="avatar-wrapper">
    <div className="avatar large">
      <FiCamera className="avatar-icon" />
    </div>
  </div>
        <div>
          <h1>Riya Sharma</h1>
          <p>+91 *****421 - riya@example.com</p>
          <span className="status success">Phone verified</span>
          <span className="status">Customer</span>
        </div>
        <button className="secondary">
          <FiEdit2 /> Edit profile
        </button>
        <button className="secondary">
          <FiMapPin /> Capture GPS
        </button>
      </div>
      <div className="metric-row four">
        <Metric label="Visits booked" value="14" />
       
        <Metric label="Properties viewed" value="62" />
        <Metric label="Shortlisted" value="9" />
      </div>
      <div className="profile-grid">
        <Panel title="Account">
          <ListLink label="My bookings" text="14 total - 2 active" go={() => go('bookings')} />
          <ListLink label="Payments" text="Rs 8,240 lifetime" go={() => go('payments')} />
          <ListLink label="Notifications" text="2 unread" go={() => go('notifications')} />
        </Panel>
        <Panel title="Other">
          <ListLink label="Privacy & security" text="All checks passed" go={() => go('privacy')} />
          <ListLink label="Support" text="FAQ - chat - call" go={() => go('support')} />
          <ListLink label="Legal & policies" text="" go={() => go('support')} />
        </Panel>
      </div>
      <button className="secondary full">Log out</button>
    </div>
  )
}

export default ProfileScreen
