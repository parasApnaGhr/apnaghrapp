import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { propertyAPI, getMediaUrl } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Home, User, Heart, Calendar, LogOut, Truck, Megaphone, ShoppingCart, X, MapPin, Bath, BedDouble, Square, ChevronRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';
import AIChatbot from '../components/AIChatbot';

const CustomerHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    min_rent: '',
    max_rent: '',
    bhk: '',
    furnishing: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [cartCount, setCartCount] = useState(0);
  const [appSettings, setAppSettings] = useState(null);
  const [activeAds, setActiveAds] = useState([]);

  useEffect(() => {
    loadProperties();
    loadAppSettings();
    loadActiveAds();
    const cart = JSON.parse(localStorage.getItem('visitCart') || '[]');
    setCartCount(cart.length);
  }, []);

  const loadAppSettings = async () => {
    try {
      const response = await api.get('/settings/app-customization');
      if (response.data && response.data.seasonal_active) {
        setAppSettings(response.data);
      }
    } catch (error) {
      console.log('No seasonal settings');
    }
  };

  const loadActiveAds = async () => {
    try {
      const response = await api.get('/advertising/active?placement=home');
      setActiveAds(response.data || []);
    } catch (error) {
      console.log('No active ads');
    }
  };

  const loadProperties = async () => {
    setLoading(true);
    try {
      const response = await propertyAPI.getAll();
      const available = (response.data || []).filter(p => p.is_available !== false);
      setProperties(available);
    } catch (error) {
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadProperties();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'visits') navigate('/customer/cart');
    if (tab === 'packers') navigate('/customer/packers');
    if (tab === 'advertise') navigate('/customer/advertise');
    if (tab === 'profile') navigate('/customer/profile');
  };

  const addToCart = (property) => {
    const cart = JSON.parse(localStorage.getItem('visitCart') || '[]');
    if (cart.find(p => p.id === property.id)) {
      toast.error('Property already in cart');
      return;
    }
    cart.push(property);
    localStorage.setItem('visitCart', JSON.stringify(cart));
    setCartCount(cart.length);
    toast.success('Added to visit list');
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24">
      {/* Premium Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-2xl tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                Apna<span className="text-[#04473C]">Ghr</span>
              </h1>
              <p className="text-xs tracking-[0.15em] uppercase text-[#4A4D53] font-medium">Premium Rentals</p>
            </motion.div>
            
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/customer/cart')}
                className="relative flex items-center gap-2 px-4 py-2 bg-[#04473C] text-white text-sm font-medium tracking-wide"
                data-testid="cart-button"
              >
                <ShoppingCart className="w-4 h-4" strokeWidth={1.5} />
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#C6A87C] text-[#1A1C20] text-xs font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </motion.button>
              <button
                onClick={logout}
                className="p-2 hover:bg-[#F5F3F0] transition-colors"
                data-testid="logout-button"
              >
                <LogOut className="w-5 h-5 text-[#4A4D53]" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Premium Search Bar */}
          <motion.div 
            className="mt-4 flex gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-[#4A4D53] absolute left-4 top-1/2 transform -translate-y-1/2" strokeWidth={1.5} />
              <input
                type="text"
                data-testid="search-input"
                placeholder="Search by city, locality, or landmark..."
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="premium-input pl-12"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              data-testid="filter-button"
              className="px-5 border border-[#E5E1DB] hover:border-[#04473C] hover:bg-[#E6F0EE] transition-all"
            >
              <SlidersHorizontal className="w-5 h-5 text-[#1A1C20]" strokeWidth={1.5} />
            </button>
          </motion.div>

          {/* Premium Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="p-6 bg-[#F5F3F0] border border-[#E5E1DB] grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="premium-label">Min Rent</label>
                    <input
                      type="number"
                      data-testid="min-rent-input"
                      placeholder="₹10,000"
                      value={filters.min_rent}
                      onChange={(e) => setFilters({ ...filters, min_rent: e.target.value })}
                      className="premium-input py-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="premium-label">Max Rent</label>
                    <input
                      type="number"
                      data-testid="max-rent-input"
                      placeholder="₹50,000"
                      value={filters.max_rent}
                      onChange={(e) => setFilters({ ...filters, max_rent: e.target.value })}
                      className="premium-input py-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="premium-label">BHK Type</label>
                    <select
                      data-testid="bhk-select"
                      value={filters.bhk}
                      onChange={(e) => setFilters({ ...filters, bhk: e.target.value })}
                      className="premium-input py-3 text-sm"
                    >
                      <option value="">All Types</option>
                      <option value="1BHK">1 BHK</option>
                      <option value="2BHK">2 BHK</option>
                      <option value="3BHK">3 BHK</option>
                      <option value="4BHK">4+ BHK</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleSearch}
                      data-testid="apply-filters"
                      className="btn-primary w-full"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Featured Sponsors - Premium Style */}
        {activeAds.length > 0 && (
          <motion.section 
            className="mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="overline text-[#C6A87C] mb-1">Featured Partners</p>
                <h2 className="text-2xl" style={{ fontFamily: 'Playfair Display, serif' }}>Trusted Brands</h2>
              </div>
              <ChevronRight className="w-5 h-5 text-[#4A4D53]" strokeWidth={1.5} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {activeAds.slice(0, 4).map((ad, index) => (
                <motion.div
                  key={ad.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="group relative aspect-[4/3] overflow-hidden border border-[#E5E1DB] bg-white cursor-pointer"
                  onClick={() => ad.redirect_url && window.open(ad.redirect_url, '_blank')}
                >
                  <img 
                    src={ad.image_url || ad.banner_image} 
                    alt={ad.company_name || ad.business_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white text-sm font-medium truncate">{ad.company_name || ad.business_name}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Properties Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="overline text-[#04473C] mb-1">Available Now</p>
              <h2 className="text-3xl" style={{ fontFamily: 'Playfair Display, serif' }}>
                Premium Properties
              </h2>
            </div>
            <p className="text-sm text-[#4A4D53]">{properties.length} listings</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/3] bg-[#F5F3F0]" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-[#F5F3F0] w-3/4" />
                    <div className="h-3 bg-[#F5F3F0] w-1/2" />
                    <div className="h-6 bg-[#F5F3F0] w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {properties.map((property) => (
                <motion.div
                  key={property.id}
                  variants={itemVariants}
                  className="property-card group cursor-pointer"
                  onClick={() => navigate(`/property/${property.id}`)}
                  data-testid={`property-card-${property.id}`}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#F5F3F0]">
                    {property.images && property.images[0] ? (
                      <img
                        src={getMediaUrl(property.images[0])}
                        alt={property.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Home className="w-12 h-12 text-[#D0C9C0]" strokeWidth={1} />
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      {property.is_hot && (
                        <span className="premium-badge">Hot</span>
                      )}
                      {property.verified_owner && (
                        <span className="verified-badge">Verified</span>
                      )}
                    </div>

                    {/* Quick Add Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(property);
                      }}
                      className="absolute bottom-4 right-4 p-3 bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#04473C] hover:text-white"
                      data-testid={`add-to-cart-${property.id}`}
                    >
                      <Calendar className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-medium text-lg text-[#1A1C20] line-clamp-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {property.title}
                      </h3>
                    </div>

                    {property.location && (
                      <div className="flex items-center gap-2 text-[#4A4D53] text-sm mb-4">
                        <MapPin className="w-4 h-4" strokeWidth={1.5} />
                        <span className="truncate">{property.location}</span>
                      </div>
                    )}

                    {/* Property Features */}
                    {property.amenities && property.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {property.amenities.slice(0, 3).map((amenity, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 bg-[#F5F3F0] text-[#4A4D53] text-xs font-medium"
                          >
                            {amenity}
                          </span>
                        ))}
                        {property.amenities.length > 3 && (
                          <span className="px-2 py-1 text-[#4A4D53] text-xs font-medium">
                            +{property.amenities.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline justify-between pt-4 border-t border-[#E5E1DB]">
                      <div className="price-display text-xl">
                        <span className="price-currency text-sm">₹</span>
                        {property.rent?.toLocaleString('en-IN')}
                        <span className="text-[#4A4D53] text-sm font-normal">/month</span>
                      </div>
                      <span className="text-xs text-[#4A4D53] tracking-wide uppercase">
                        {property.views || 0} views
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {!loading && properties.length === 0 && (
            <div className="text-center py-16">
              <Home className="w-16 h-16 text-[#D0C9C0] mx-auto mb-4" strokeWidth={1} />
              <h3 className="text-xl mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>No Properties Found</h3>
              <p className="text-[#4A4D53]">Try adjusting your search filters</p>
            </div>
          )}
        </section>
      </main>

      {/* Premium Bottom Navigation */}
      <nav className="mobile-nav fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          <button
            className={activeTab === 'home' ? 'active' : ''}
            onClick={() => handleTabChange('home')}
            data-testid="nav-home"
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>
          <button
            className={activeTab === 'visits' ? 'active' : ''}
            onClick={() => handleTabChange('visits')}
            data-testid="nav-visits"
          >
            <Calendar className="w-5 h-5" />
            <span>Visits</span>
          </button>
          <button
            className={activeTab === 'packers' ? 'active' : ''}
            onClick={() => handleTabChange('packers')}
            data-testid="nav-packers"
          >
            <Truck className="w-5 h-5" />
            <span>Packers</span>
          </button>
          <button
            className={activeTab === 'advertise' ? 'active' : ''}
            onClick={() => handleTabChange('advertise')}
            data-testid="nav-advertise"
          >
            <Megaphone className="w-5 h-5" />
            <span>Advertise</span>
          </button>
          <button
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => handleTabChange('profile')}
            data-testid="nav-profile"
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
        </div>
      </nav>
      
      {/* AI Chatbot */}
      <AIChatbot />
    </div>
  );
};

export default CustomerHome;
