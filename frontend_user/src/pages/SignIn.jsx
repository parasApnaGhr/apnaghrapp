import './SignIn.css'
import { useState } from 'react'
import { HiOutlineEye } from 'react-icons/hi'

const roles = [
  'Customer',
  'Seller',
  'Builder',
  'Advertiser',
]

const SignIn = () => {
  const [selectedRole, setSelectedRole] =
    useState('Customer')

  return (
    <div className="signin-container">
      {/* MOBILE VIEW */}
      <div className="mobile-view">
       

        <h1 className="mobile-title">
          Welcome to ApnaGhr
        </h1>

        <p className="mobile-subtitle">
          Sign in to book property visits
        </p>

        <div className="role-card">
          <h3>I AM A...</h3>

          <div className="roles">
            {roles.map((role) => (
              <button
                key={role}
                className={
                  selectedRole === role
                    ? 'role-btn active'
                    : 'role-btn'
                }
                onClick={() =>
                  setSelectedRole(role)
                }
              >
                ○ {role}
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label>PHONE</label>

          <input
            type="text"
            placeholder="+91 ••••• •••••"
          />
        </div>

        <div className="input-group">
          <label>PASSWORD</label>

          <div className="password-wrapper">
            <input
              type="password"
              placeholder="••••••••"
            />

            <HiOutlineEye className="eye-icon" />
          </div>
        </div>

        <div className="remember-row">
          <div className="remember-left">
            <input type="checkbox" />
            <span>Remember me</span>
          </div>

          <button>
            Forgot password?
          </button>
        </div>

        <div className="button-group">
          <button className="signin-btn">
            Sign in
          </button>

          <button className="create-btn">
            Create account
          </button>
        </div>

        <p className="terms">
          By continuing you accept our
          Terms & Privacy
        </p>
      </div>

      {/* DESKTOP VIEW */}
      <div className="desktop-view">
        {/* LEFT */}
        <div className="desktop-left">
          <div className="logo">
            apnaghr
          </div>

          <div className="left-content">
            <h1>
              Book a property visit.
              <br />
              Skip the chase.
            </h1>

            <p>
              Verified properties · live rider
              tracking · transparent pricing
            </p>

            <div className="badges">
              <div>
                ★ 4.8 · 56k visits
              </div>

              <div>✓ Verified</div>
            </div>
          </div>

         
        </div>

        {/* RIGHT */}
        <div className="desktop-right">
          <div className="form-box">
            <h2>Sign in</h2>

            <p>
              Continue to your ApnaGhr
              account
            </p>

            <div className="desktop-role-card">
              <div className="roles">
                {roles.map((role) => (
                  <button
                    key={role}
                    className={
                      selectedRole === role
                        ? 'role-btn active'
                        : 'role-btn'
                    }
                    onClick={() =>
                      setSelectedRole(role)
                    }
                  >
                    ○ {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>PHONE</label>

              <input
                type="text"
                placeholder="+91 ••••• •••••"
              />
            </div>

            <div className="input-group">
              <label>PASSWORD</label>

              <div className="password-wrapper">
                <input
                  type="password"
                  placeholder="••••••••"
                />

                <HiOutlineEye className="eye-icon" />
              </div>
            </div>

            <div className="remember-row">
              <div className="remember-left">
                <input type="checkbox" />
                <span>Remember me</span>
              </div>

              <button>
                Forgot password?
              </button>
            </div>

            <div className="desktop-buttons">
              <button className="signin-btn">
                Sign in
              </button>

              <button className="create-btn">
                Create account
              </button>
            </div>

            <div className="info-box">
              ℹ Forgot password = phone +
              OTP + new password.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignIn