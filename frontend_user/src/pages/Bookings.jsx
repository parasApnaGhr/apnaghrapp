import './Bookings.css'

import {
  HiHome,
  HiOutlineClipboardList,
  HiOutlineShoppingCart,
  HiOutlineUser,
  HiPhone,
} from 'react-icons/hi'

const bookings = [
  {
    id: 1,
    status: 'Rider en route',
    active: true,
    rider: 'Suresh K.',
    eta: '4.9 · KA-01 BX 2841',
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
  },
  {
    id: 2,
    status: 'Finding rider...',
    active: false,
    rider: 'Looking for nearby rider...',
    eta: 'Avg pickup: 8 min',
    image:
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0',
  },
]

const Bookings = () => {
  return (
    <div className="bookings-container">
      {/* MOBILE */}

      <div className="mobile-bookings">
        <div className="mobile-status">
          <span>9:41</span>

          <div className="status-dots">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>

        <h1 className="mobile-title">
          My bookings
        </h1>

        <div className="booking-tabs">
          <button className="active-tab">
            Active (2)
          </button>

          <button>
            Completed (8)
          </button>
        </div>

        <div className="mobile-booking-list">
          {bookings.map((item) => (
            <div
              className="booking-card"
              key={item.id}
            >
              <div className="booking-top">
                <div>
                  <h3>
                    BK-2841 · SAT 15 MAY
                  </h3>

                  <span
                    className={
                      item.active
                        ? 'status-pill active-pill'
                        : 'status-pill pending-pill'
                    }
                  >
                    ● {item.status}
                  </span>
                </div>

                <button className="track-btn">
                  Track
                </button>
              </div>

              <div className="rider-card">
                <img
                  src={item.image}
                  alt=""
                />

                <div className="rider-info">
                  <h4>{item.rider}</h4>

                  <p>{item.eta}</p>

                  <span>
                    3 properties ·
                    Whitefield →
                    Marathahalli →
                    Sarjapur
                  </span>
                </div>

                <button className="call-btn">
                  <HiPhone />
                  Call
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM NAV */}

        <div className="bottom-nav">
          <div className="nav-item">
            <div className="nav-icon">
              <HiHome />
            </div>

            <span>Home</span>
          </div>

          <div className="nav-item active-nav">
            <div className="nav-icon">
              <HiOutlineClipboardList />
            </div>

            <span>Bookings</span>
          </div>

          <div className="nav-item">
            <div className="nav-icon">
              <HiOutlineShoppingCart />
            </div>

            <span>Cart</span>
          </div>

          <div className="nav-item">
            <div className="nav-icon">
              <HiOutlineUser />
            </div>

            <span>Profile</span>
          </div>
        </div>
      </div>

      {/* DESKTOP */}

      <div className="desktop-bookings">
        {/* SIDEBAR */}

        <div className="sidebar">
          <div className="logo">
            apnaghr
          </div>

          <div className="sidebar-menu">
            <div className="sidebar-item">
              • Home
            </div>

            <div className="sidebar-item active-side">
              • Bookings
            </div>

            <div className="sidebar-item">
              • Cart
            </div>

            <div className="sidebar-item">
              • Payments
            </div>

            <div className="sidebar-item">
              • Notifications
            </div>

            <div className="sidebar-item">
              • Profile
            </div>

            <div className="sidebar-item">
              • Support
            </div>
          </div>
        </div>

        {/* MAIN */}

        <div className="desktop-main">
          {/* TOPBAR */}

          <div className="desktop-topbar">
            <h2>My bookings</h2>

            <div className="booking-tabs">
              <button className="active-tab">
                Active (2)
              </button>

              <button>
                Completed (8)
              </button>
            </div>
          </div>

          {/* GRID */}

          <div className="desktop-booking-grid">
            {bookings.map((item) => (
              <div
                className="booking-card"
                key={item.id}
              >
                <div className="booking-top">
                  <div>
                    <h3>
                      BK-2841 · SAT 15 MAY
                    </h3>

                    <span
                      className={
                        item.active
                          ? 'status-pill active-pill'
                          : 'status-pill pending-pill'
                      }
                    >
                      ● {item.status}
                    </span>
                  </div>

                  <button className="track-btn">
                    Track
                  </button>
                </div>

                <div className="rider-card">
                  <img
                    src={item.image}
                    alt=""
                  />

                  <div className="rider-info">
                    <h4>{item.rider}</h4>

                    <p>{item.eta}</p>

                    <span>
                      3 properties ·
                      Whitefield →
                      Marathahalli →
                      Sarjapur
                    </span>
                  </div>

                  <button className="call-btn">
                    <HiPhone />
                    Call
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="notice">
            ℹ Finding-rider card has
            subtle pulse animation.
            Auto-promotes to “active”
            when matched.
          </div>
        </div>
      </div>
    </div>
  )
}

export default Bookings