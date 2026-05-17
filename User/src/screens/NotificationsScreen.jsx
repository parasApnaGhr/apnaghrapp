import { FiBell, FiHome } from 'react-icons/fi'
import { FaCarSide, FaRupeeSign } from 'react-icons/fa'
import SectionTitle from '../components/ui/SectionTitle'
import Tabs from '../components/ui/Tabs'
import { notifications } from '../data/mockData'

function NotificationIcon({ type }) {
  if (type === 'pay') return <FaRupeeSign />
  if (type === 'warn') return <FiBell />
  if (type === 'home') return <FiHome />
  return <FaCarSide />
}

function NotificationsScreen() {
  return (
    <div className="screen">
      <SectionTitle title="Notifications" action="Mark all read" />
      <Tabs tabs={['All (42)', 'Trips', 'Payments', 'Offers']} />
      <div className="table-card">
        {notifications.map(({ type, title, time }, index) => (
          <div className="notification-row" key={`${title}-${index}`}>
            <div className="pay-icon">
              <NotificationIcon type={type} />
            </div>
            <div>
              <strong>{title}</strong>
              <p>{time}</p>
            </div>
            {index < 3 && <span className="dot" />}
          </div>
        ))}
      </div>
    </div>
  )
}

export default NotificationsScreen
