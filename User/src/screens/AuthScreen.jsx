import { useState } from 'react'
import { FiEye } from 'react-icons/fi'
import FormField from '../components/ui/FormField'
import Notice from '../components/ui/Notice'
import { roles } from '../data/mockData'

function AuthScreen({ go, authMode, setAuthMode }) {
  const [role, setRole] = useState('Customer')
  const title =
    authMode === 'register'
      ? 'Create account'
      : authMode === 'otp'
        ? 'Verify OTP'
        : authMode === 'forgot'
          ? 'Reset password'
          : 'Sign in'

  return (
    <div className="auth-layout">
      <section className="auth-hero">
        <button className="brand light">apnaghr</button>
        <div>
          <h1>Book a property visit. Skip the chase.</h1>
          <p>Verified properties, live rider tracking, transparent pricing.</p>
          <div className="mini-badges">
            <span>4.8 - 56k visits</span>
            <span>Verified</span>
          </div>
        </div>
        <span>Hero / rider illustration</span>
      </section>
      <section className="auth-card">
        <button className="brand auth-mobile-logo" onClick={() => go('home')}>
          apnaghr
        </button>
        <h1>{title}</h1>
        <p>Continue to your ApnaGhr account</p>
        <div className="role-box">
          <strong>I am a...</strong>
          <div className="role-grid">
            {roles.map((item) => (
              <button
                key={item}
                className={role === item ? 'chip dark' : 'chip'}
                onClick={() => setRole(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <FormField label="Phone" placeholder="+91 99999 99999" />
        {authMode === 'otp' && <FormField label="OTP" placeholder="6 digit code" />}
        {authMode !== 'otp' && (
          <FormField label="Password" placeholder="password" type="password" icon={<FiEye />} />
        )}
        {authMode === 'register' && (
          <FormField label="Confirm password" placeholder="confirm password" type="password" />
        )}
        <div className="row-between small">
          <label>
            <input type="checkbox" /> Remember me
          </label>
          <button className="link" onClick={() => setAuthMode('forgot')}>
            Forgot password?
          </button>
        </div>
        <div className="button-row">
          <button className="primary" onClick={() => go('home')}>
            {authMode === 'otp' ? 'Verify & continue' : title}
          </button>
          <button
            className="secondary"
            onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}
          >
            {authMode === 'register' ? 'Back to sign in' : 'Create account'}
          </button>
        </div>
        <Notice text="Forgot password uses phone, OTP, and new password. Same flow doubles as registration verification." />
      </section>
    </div>
  )
}

export default AuthScreen
