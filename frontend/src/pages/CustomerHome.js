import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { propertyAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Home, User, Heart, Calendar, LogOut, Truck, Megaphone, ShoppingCart, X, Flame, Eye } from 'lucide-react';
import { toast } from 'sonner';
import Marquee from 'react-fast-marquee';

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

  useEffect(() => {
    loadProperties();
    // Load cart count from localStorage
    const cart = JSON.parse(localStorage.getItem('visitCart') || '[]');
    setCartCount(cart.length);
  }, []);

  const loadProperties = async () => {
    try {
      const cleanFilters = {};
      if (filters.city) cleanFilters.city = filters.city;
      if (filters.min_rent) cleanFilters.min_rent = parseFloat(filters.min_rent);
      if (filters.max_rent) cleanFilters.max_rent = parseFloat(filters.max_rent);
      if (filters.bhk) cleanFilters.bhk = parseInt(filters.bhk);
      if (filters.furnishing) cleanFilters.furnishing = filters.furnishing;
      
      const response = await propertyAPI.getProperties(cleanFilters);
      setProperties(response.data);
    } catch (error) {
      console.error('Property load error:', error);
      toast.error(error.response?.data?.detail || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    loadProperties();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'bookings') navigate('/customer/bookings');
    if (tab === 'cart') navigate('/customer/cart');
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b-2 border-[#111111] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-3xl font-black tracking-tighter" style={{ fontFamily: 'Outfit' }}>
                Apna<span className="text-[#FF5A5F]">Ghr</span>
              </h1>
              <p className="text-sm text-[#52525B] font-medium">Find your perfect home</p>
            </motion.div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/customer/cart')}
                className="relative p-2 bg-[#FFD166] border-2 border-[#111111] rounded-full shadow-[2px_2px_0px_#111111]"
                data-testid="cart-button"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF5A5F] text-white text-xs font-bold rounded-full flex items-center justify-center border border-[#111111]">
                    {cartCount}
                  </span>
                )}
              </motion.button>
              <button
                onClick={logout}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                data-testid="logout-button"
              >
                <LogOut className="w-5 h-5 text-[#52525B]" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <motion.div 
              className="flex-1 relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Search className="w-5 h-5 text-[#52525B] absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                data-testid="search-input"
                placeholder="Search city or locality..."
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="input-field pl-12"
              />
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              data-testid="filter-button"
              className="px-4 bg-[#4ECDC4] border-2 border-[#111111] rounded-xl shadow-[2px_2px_0px_#111111] hover:shadow-[4px_4px_0px_#111111] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="p-4 bg-[#F3F4F6] rounded-xl border-2 border-[#111111] grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">Min Rent</label>
                    <input
                      type="number"
                      data-testid="min-rent-input"
                      placeholder="₹10,000"
                      value={filters.min_rent}
                      onChange={(e) => setFilters({ ...filters, min_rent: e.target.value })}
                      className="input-field py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">Max Rent</label>
                    <input
                      type="number"
                      data-testid="max-rent-input"
                      placeholder="₹50,000"
                      value={filters.max_rent}
                      onChange={(e) => setFilters({ ...filters, max_rent: e.target.value })}
                      className="input-field py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">BHK</label>
                    <select
                      data-testid="bhk-select"
                      value={filters.bhk}
                      onChange={(e) => setFilters({ ...filters, bhk: e.target.value })}
                      className="input-field py-2 text-sm"
                    >
                      <option value="">Any</option>
                      <option value="1">1 BHK</option>
                      <option value="2">2 BHK</option>
                      <option value="3">3 BHK</option>
                      <option value="4">4 BHK+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">Furnishing</label>
                    <select
                      data-testid="furnishing-select"
                      value={filters.furnishing}
                      onChange={(e) => setFilters({ ...filters, furnishing: e.target.value })}
                      className="input-field py-2 text-sm"
                    >
                      <option value="">Any</option>
                      <option value="Unfurnished">Unfurnished</option>
                      <option value="Semi-Furnished">Semi-Furnished</option>
                      <option value="Fully-Furnished">Fully-Furnished</option>
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-4 flex gap-2">
                    <button
                      onClick={handleSearch}
                      data-testid="apply-filters-button"
                      className="btn-primary flex-1"
                    >
                      Apply Filters
                    </button>
                    <button
                      onClick={() => {
                        setFilters({ city: '', min_rent: '', max_rent: '', bhk: '', furnishing: '' });
                        setShowFilters(false);
                      }}
                      className="px-4 py-2 border-2 border-[#111111] rounded-full font-bold"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Services Banner */}
      <div className="bg-[#111111] border-b-2 border-[#FFD166]">
        <Marquee speed={40} gradient={false} pauseOnHover>
          <span className="marquee-text text-white">PROPERTY VISITS</span>
          <span className="marquee-text text-[#FFD166]">PACKERS & MOVERS</span>
          <span className="marquee-text text-[#4ECDC4]">ADVERTISE WITH US</span>
          <span className="marquee-text text-[#FF5A5F]">TRUSTED SERVICE</span>
        </Marquee>
      </div>

      {/* Quick Services */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/customer/packers')}
            className="neo-card p-5 cursor-pointer bg-gradient-to-br from-[#4ECDC4]/20 to-[#4ECDC4]/5"
            data-testid="packers-service-card"
          >
            <div className="w-12 h-12 rounded-xl bg-[#4ECDC4] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center mb-3">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg mb-1" style={{ fontFamily: 'Outfit' }}>Packers & Movers</h3>
            <p className="text-sm text-[#52525B]">Stress-free relocation from ₹2,999</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/customer/advertise')}
            className="neo-card p-5 cursor-pointer bg-gradient-to-br from-[#FFD166]/20 to-[#FFD166]/5"
            data-testid="advertise-service-card"
          >
            <div className="w-12 h-12 rounded-xl bg-[#FFD166] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center mb-3">
              <Megaphone className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg mb-1" style={{ fontFamily: 'Outfit' }}>Advertise With Us</h3>
            <p className="text-sm text-[#52525B]">Reach 10,000+ home seekers</p>
          </motion.div>
        </div>

        {/* Properties Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Outfit' }}>
            Available Properties
          </h2>
          <span className="badge badge-info">{properties.length} found</span>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="kinetic-loader">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        ) : (
          <div className="property-grid">
            {properties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="property-card"
                onClick={() => navigate(`/customer/property/${property.id}`)}
                data-testid={`property-card-${property.id}`}
              >
                <div className="relative h-48 bg-[#F3F4F6]">
                  {property.images && property.images[0] ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-[#E5E7EB] to-[#D1D5DB]">
                      <Home className="w-12 h-12 text-[#9CA3AF]" />
                    </div>
                  )}
                  
                  {/* Hot Property Badge */}
                  {property.is_hot && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 left-3 badge badge-hot flex items-center gap-1"
                    >
                      <Flame className="w-4 h-4" />
                      HOT
                    </motion.span>
                  )}
                  
                  {property.premium_listing && !property.is_hot && (
                    <span className="absolute top-3 left-3 badge badge-warning">PREMIUM</span>
                  )}
                  
                  {property.verified_owner && (
                    <span className="absolute top-3 right-3 badge badge-success">VERIFIED</span>
                  )}
                  
                  {/* Weekly Views Badge */}
                  {property.weekly_visits > 0 && (
                    <span className="absolute bottom-3 left-3 bg-[#111111]/80 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {property.weekly_visits} this week
                    </span>
                  )}
                </div>
                
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-1 line-clamp-1">{property.title}</h3>
                  <p className="text-sm text-[#52525B] mb-3">
                    {property.bhk} BHK • {property.furnishing}
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-black text-[#FF5A5F]" style={{ fontFamily: 'Outfit' }}>
                        ₹{property.rent.toLocaleString()}
                      </p>
                      <p className="text-xs text-[#52525B]">{property.area_name}</p>
                    </div>
                    <span className="badge badge-info text-xs">Location hidden</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && properties.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#F3F4F6] border-2 border-[#111111] flex items-center justify-center">
              <Home className="w-10 h-10 text-[#9CA3AF]" />
            </div>
            <h3 className="text-xl font-bold mb-2">No properties found</h3>
            <p className="text-[#52525B] mb-4">Try adjusting your filters</p>
            <button 
              onClick={() => setFilters({ city: '', min_rent: '', max_rent: '', bhk: '', furnishing: '' })} 
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <div className="flex max-w-md mx-auto">
          <button
            className={activeTab === 'home' ? 'active' : ''}
            onClick={() => handleTabChange('home')}
            data-testid="nav-home"
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>
          <button
            className={activeTab === 'bookings' ? 'active' : ''}
            onClick={() => handleTabChange('bookings')}
            data-testid="nav-bookings"
          >
            <Calendar className="w-5 h-5" />
            <span>My Visits</span>
          </button>
          <button
            className={activeTab === 'cart' ? 'active' : ''}
            onClick={() => handleTabChange('cart')}
            data-testid="nav-cart"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Cart</span>
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
      </div>
    </div>
  );
};

export default CustomerHome;
