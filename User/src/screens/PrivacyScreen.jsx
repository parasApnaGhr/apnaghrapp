import { FiCheck, FiEye } from 'react-icons/fi'
import FormField from '../components/ui/FormField'
import Notice from '../components/ui/Notice'
import Panel from '../components/ui/Panel'

const securityItems = [
  'Terms accepted',
  'Account verified',
  'Phone verified',
  '2-factor authentication',
  'Email verified',
]

function PrivacyScreen() {
  return (
    <div className="screen privacy-layout">
      <Panel title="Security status">
        {securityItems.map((item, index) => (
          <div className="security-row" key={item}>
            <span className={index === 3 ? 'warn-circle' : 'check-circle'}>
              {index === 3 ? '!' : <FiCheck />}
            </span>
            <div>
              <strong>{item}</strong>
              <p>{index === 3 ? 'Action needed' : 'Verified'}</p>
            </div>
            {index === 3 && <span className="status pending">Fix</span>}
          </div>
        ))}
      </Panel>
      <Panel title="Change password">
        <FormField label="Current password" placeholder="current password" type="password" />
        <FormField label="New password" placeholder="new password" type="password" />
        <FormField label="Confirm new password" placeholder="confirm password" type="password" />
        <button className="primary compact">Update password</button>
        <button className="link">
          <FiEye /> Show
        </button>
        <Notice text="Visibility toggle and inline state show the form state on mobile." />
      </Panel>
    </div>
  )
}

export default PrivacyScreen
