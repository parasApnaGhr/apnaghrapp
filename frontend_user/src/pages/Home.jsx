import './Home.css'
import {
  HiHome,
  HiOutlineClipboardList,
  HiOutlineShoppingCart,
  HiOutlineUser,
} from 'react-icons/hi'

const properties = [1, 2, 3, 4]

const Home = () => {
  return (
    <div className="home-container">
      {/* MOBILE VIEW */}
      <div className="mobile-home">
        {/* STATUS BAR */}
       
        {/* SEARCH */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search localities, BHK, builder..."
          />

          <div className="search-actions">
            <button>📍</button>

            <button>⚙ Filters</button>
          </div>
        </div>

        {/* ACTIVE VISIT */}
        <div className="active-card">
          <div>
            <h3>
              ACTIVE VISIT · BK-2841
            </h3>

            <div className="visit-row">
              <span className="green-pill">
                ● Rider en route
              </span>

              <span>ETA 12 min</span>
            </div>
          </div>

          <button className="track-btn">
            Track
          </button>
        </div>

        {/* SPONSORED */}
        <div className="sponsored-card">
          <span className="sponsored-pill">
            SPONSORED
          </span>

          <p>
            Lakeview Residences · 20%
            off booking fee →
          </p>
        </div>

        {/* HEADER */}
        <div className="section-header">
          <h2>
            Featured properties
          </h2>

          <button>See all</button>
        </div>

        {/* GRID */}
        <div className="property-grid mobile-grid">
          {properties.map((item) => (
            <div
              key={item}
              className="property-card"
            >
              <img
                src="https://images.unsplash.com/photo-1568605114967-8130f3a36994"
                alt="property"
              />

              <div className="property-content">
                <div className="property-top">
                  <h3>
                    3 BHK · Whitefield
                  </h3>

                  <span>New</span>
                </div>

                <p>
                  ₹ 1.45 Cr · 1,820 sqft
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* REVIEW */}
        <div className="review-card">
          <div className="review-pill">
            ★★★★★
          </div>

          <p>
            “Found my home in 3
            visits.” — Riya, BLR
          </p>
        </div>

        {/* BOTTOM NAV */}
        {/* BOTTOM NAV */}
<div className="bottom-nav">
  <div className="nav-item active-nav">
    <div className="nav-icon">
      <HiHome />
    </div>

    <span>Home</span>
  </div>

  <div className="nav-item">
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

      {/* DESKTOP VIEW */}
      <div className="desktop-home">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="logo">
            apnaghr
          </div>

          <div className="sidebar-menu">
            <div className="sidebar-item active-side">
              • Home
            </div>

            <div className="sidebar-item">
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
            <input
              type="text"
              placeholder="Search localities, properties..."
            />

            <div className="desktop-icons">
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>

          {/* SEARCH */}
          <div className="desktop-search">
            <input
              type="text"
              placeholder="Search localities, BHK, builder..."
            />

            <div className="desktop-search-actions">
              <button>📍</button>

              <button>⚙ Filters</button>

              <button>
                ⚙ Advanced filters
              </button>
            </div>
          </div>

          {/* ACTIVE */}
          <div className="active-card">
            <div>
              <h3>
                ACTIVE VISIT · BK-2841
              </h3>

              <div className="visit-row">
                <span className="green-pill">
                  ● Rider en route
                </span>

                <span>ETA 12 min</span>
              </div>
            </div>

            <button className="track-btn">
              Track
            </button>
          </div>

          {/* SPONSORED */}
          <div className="sponsored-card">
            <span className="sponsored-pill">
              SPONSORED
            </span>

            <p>
              Lakeview Residences ·
              Whitefield · 20% off
              booking fee →
            </p>

            <span>→</span>
          </div>

          {/* HEADER */}
          <div className="desktop-header">
            <h2>
              Featured properties
            </h2>

            <div className="category-tabs">
              <button className="active-tab">
                All
              </button>

              <button>
                Apartment
              </button>

              <button>Villa</button>

              <button>Plot</button>
            </div>
          </div>

          {/* GRID */}
          <div className="property-grid desktop-grid">
            {properties.map((item) => (
              <div
                key={item}
                className="property-card"
              >
                <img
                  src="https://images.unsplash.com/photo-1568605114967-8130f3a36994"
                  alt="property"
                />

                <div className="property-content">
                  <div className="property-top">
                    <h3>
                      3 BHK · Whitefield
                    </h3>

                    <span>New</span>
                  </div>

                  <p>
                    ₹ 1.45 Cr · 1,820
                    sqft
                  </p>

                  <div className="property-bottom">
                    <span>★ 4.6 (28)</span>

                    <button>
                      + Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* INFO ROW */}
          <div className="info-row">
            <div className="info-pill">
              ★★★★★ “Found my home in
              3 visits.”
            </div>

            <div className="info-pill green-info">
              ✓ Verified
            </div>

            <div className="info-pill">
              ₹ Transparent pricing
            </div>
          </div>

          {/* NOTICE */}
          <div className="notice">
            ℹ Marquee auto-scrolls.
            Voice search opens mic
            permission sheet.
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home