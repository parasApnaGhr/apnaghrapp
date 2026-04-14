import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { propertyAPI, getMediaUrl, authAPI, visitAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Home, User, Heart, Calendar, LogOut, Truck, Megaphone, ShoppingCart, X, MapPin, Bath, BedDouble, Square, ChevronRight, Sparkles, Car, Clock, CheckCircle, Phone, Navigation, Star, Shield } from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';
import AIChatbot from '../components/AIChatbot';
import TermsAcceptanceModal from '../components/TermsAcceptanceModal';
import VoiceSearch from '../components/VoiceSearch';

const CustomerHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(user?.terms_accepted || false);
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
  const [myBookings, setMyBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  // Track lead when user interacts with property
  const trackLead = async (source, propertyId = null) => {
    try {
      await api.post('/leads/track', {
        source,
        property_id: propertyId,
        user_id: user?.id,
        device_info: navigator.userAgent,
        page_url: window.location.pathname
      });
    } catch (error) {
      // Silent fail - don't interrupt user experience
      console.log('Lead tracking error:', error);
    }
  };

  // Track property click
  const handlePropertyClick = (property) => {
    trackLead('property_click', property.id);
    navigate(`/customer/property/${property.id}`);
  };

  useEffect(() => {
    loadProperties();
    loadAppSettings();
    loadActiveAds();
    loadMyBookings();
    const cart = JSON.parse(localStorage.getItem('visitCart') || '[]');
    setCartCount(cart.length);
    
    // Refresh bookings every 30 seconds
    const bookingsInterval = setInterval(loadMyBookings, 30000);
    
    // Check terms acceptance from database
    const checkTerms = async () => {
      if (!user?.terms_accepted) {
        try {
          const response = await authAPI.getTermsStatus();
          if (!response.data.terms_accepted) {
            setShowTermsModal(true);
          } else {
            setTermsAccepted(true);
          }
        } catch (error) {
          console.error('Error checking terms:', error);
          // If error, assume not accepted for customers
          setShowTermsModal(true);
        }
      } else {
        setTermsAccepted(true);
      }
    };
    if (user) checkTerms();
    
    return () => clearInterval(bookingsInterval);
  }, [user]);

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

  const loadMyBookings = async () => {
    try {
      const response = await visitAPI.getMyBookings();
      // Filter to show only active bookings (not completed/cancelled)
      const activeBookings = (response.data || []).filter(
        b => !['completed', 'cancelled'].includes(b.status)
      );
      setMyBookings(activeBookings.slice(0, 3)); // Show max 3 on home
    } catch (error) {
      console.log('Error loading bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  // Get status display info
  const getStatusInfo = (status) => {
    const statuses = {
      pending: { color: 'amber', text: 'Finding Rider', icon: Clock },
      rider_assigned: { color: 'blue', text: 'Rider Assigned', icon: User },
      pickup_started: { color: 'purple', text: 'Rider On Way', icon: Car },
      at_customer: { color: 'indigo', text: 'Rider Arrived', icon: MapPin },
      navigating: { color: 'cyan', text: 'Tour In Progress', icon: Navigation },
      at_property: { color: 'teal', text: 'At Property', icon: Home },
    };
    return statuses[status] || { color: 'gray', text: status, icon: Clock };
  };

  const loadProperties = async () => {
    setLoading(true);
    try {
      // Clean up filters - only include non-empty values
      const cleanFilters = {};
      if (filters.city && filters.city.trim()) cleanFilters.city = filters.city.trim();
      if (filters.min_rent && filters.min_rent !== '') cleanFilters.min_rent = filters.min_rent;
      if (filters.max_rent && filters.max_rent !== '') cleanFilters.max_rent = filters.max_rent;
      if (filters.bhk && filters.bhk !== '') cleanFilters.bhk = filters.bhk;
      if (filters.furnishing && filters.furnishing !== '') cleanFilters.furnishing = filters.furnishing;
      
      const response = await propertyAPI.getProperties(cleanFilters);
      const available = (response.data || []).filter(p => p.is_available !== false);
      setProperties(available);
    } catch (error) {
      console.error('Error loading properties:', error);
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
              <p className="text-[10px] tracking-[0.1em] uppercase text-[#C6A87C] font-medium">Powered by ApnaGhr</p>
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
            <VoiceSearch
              onSearch={(voiceFilters, rawText) => {
                const newFilters = {
                  ...filters,
                  city: voiceFilters.city || filters.city,
                  min_rent: voiceFilters.min_rent || filters.min_rent,
                  max_rent: voiceFilters.max_rent || filters.max_rent,
                  bhk: voiceFilters.bhk || filters.bhk,
                  furnishing: voiceFilters.furnishing || filters.furnishing
                };
                setFilters(newFilters);
                // Use timeout to ensure state is updated before search
                setTimeout(() => loadProperties(), 200);
              }}
              placeholder="Try: 'Show Patiala flats' or '2BHK under 15k'"
            />
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
                      <option value="1">1 BHK</option>
                      <option value="2">2 BHK</option>
                      <option value="3">3 BHK</option>
                      <option value="4">4+ BHK</option>
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

      {/* Hero Banner with ApnaGhr Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"
          alt="ApnaGhr - Find Your Home"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#04473C]/80 to-transparent flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-white/80 text-sm uppercase tracking-wider">Welcome to</p>
              <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                Apna<span className="text-[#C6A87C]">Ghr</span>
              </h2>
              <p className="text-white/70 text-sm mt-2">Find your perfect rental home with guided visits</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* My Active Bookings - Uber Style */}
        {myBookings.length > 0 && (
          <motion.section 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="overline text-[#04473C] mb-1">Your Visits</p>
                <h2 className="text-2xl" style={{ fontFamily: 'Playfair Display, serif' }}>Active Bookings</h2>
              </div>
              <button 
                onClick={() => navigate('/customer/bookings')}
                className="text-sm text-[#04473C] font-medium flex items-center gap-1 hover:underline"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {myBookings.map((booking, index) => {
                const statusInfo = getStatusInfo(booking.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => navigate('/customer/bookings')}
                    className="bg-white border border-[#E5E1DB] rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    data-testid={`home-booking-${booking.id}`}
                  >
                    {/* Status Banner */}
                    <div className={`px-4 py-3 flex items-center gap-3 ${
                      statusInfo.color === 'amber' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                      statusInfo.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                      statusInfo.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                      statusInfo.color === 'indigo' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' :
                      statusInfo.color === 'cyan' ? 'bg-gradient-to-r from-cyan-500 to-cyan-600' :
                      statusInfo.color === 'teal' ? 'bg-gradient-to-r from-teal-500 to-teal-600' :
                      'bg-gradient-to-r from-gray-500 to-gray-600'
                    } text-white`}>
                      <div className={`w-8 h-8 bg-white/20 rounded-full flex items-center justify-center ${
                        booking.status === 'pending' ? 'animate-pulse' : ''
                      }`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{statusInfo.text}</p>
                        <p className="text-xs text-white/80">
                          {booking.property_ids?.length || 1} {(booking.property_ids?.length || 1) === 1 ? 'property' : 'properties'}
                        </p>
                      </div>
                      {booking.status === 'pending' && (
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-1.5 h-1.5 bg-white rounded-full"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Booking Content */}
                    <div className="p-4">
                      {/* Rider Info - if assigned */}
                      {booking.rider_id && (
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[#E5E1DB]">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#04473C] to-[#2A9D8F] rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-white" />
                            </div>
                            {booking.rider_is_online && (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-[#264653]">{booking.rider_name || 'Your Rider'}</p>
                              <div className="flex items-center gap-0.5 bg-amber-100 px-1.5 py-0.5 rounded">
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                <span className="text-xs font-medium text-amber-700">4.9</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <Shield className="w-3 h-3" />
                              <span>Verified Rider</span>
                            </div>
                          </div>
                          {booking.rider_phone && (
                            <a
                              href={`tel:${booking.rider_phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="w-10 h-10 bg-[#04473C] rounded-full flex items-center justify-center"
                            >
                              <Phone className="w-4 h-4 text-white" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Finding Rider Animation */}
                      {!booking.rider_id && booking.status === 'pending' && (
                        <div className="flex items-center gap-4 mb-3 pb-3 border-b border-[#E5E1DB]">
                          <div className="relative">
                            <motion.div
                              className="absolute inset-0 border-2 border-[#04473C] rounded-full"
                              animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              style={{ width: 48, height: 48 }}
                            />
                            <div className="w-12 h-12 bg-[#04473C] rounded-full flex items-center justify-center relative z-10">
                              <Car className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-[#264653]">Searching for riders...</p>
                            <p className="text-xs text-[#4A626C]">We'll notify you when matched</p>
                          </div>
                        </div>
                      )}

                      {/* Date & Location */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-[#4A626C]">
                          <Calendar className="w-4 h-4" />
                          <span>{booking.scheduled_date}</span>
                        </div>
                        {booking.pickup_location && (
                          <div className="flex items-center gap-1 text-sm text-[#4A626C] max-w-[50%]">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{booking.pickup_location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* View All Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate('/customer/bookings')}
              className="w-full mt-4 py-3 bg-[#04473C] text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              View All My Bookings
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.section>
        )}

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
                  onClick={() => handlePropertyClick(property)}
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

                    {/* Location - Show city and area */}
                    <div className="flex items-center gap-2 text-[#4A4D53] text-sm mb-4">
                      <MapPin className="w-4 h-4" strokeWidth={1.5} />
                      <span className="truncate">
                        {property.area_name}{property.city ? `, ${property.city}` : ''}
                      </span>
                    </div>

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

        {/* Testimonials & Trust Section */}
        <section className="mt-12 mb-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="overline text-[#C6A87C] mb-2">Customer Stories</p>
              <h2 className="text-2xl mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                What Our Customers Say
              </h2>
              <p className="text-sm text-[#4A4D53]">Join thousands of happy homeowners</p>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Priya Sharma', city: 'Chandigarh', text: 'Found my dream home in just 2 visits! The rider was very professional and the entire process was seamless.', rating: 5, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
              { name: 'Rahul Verma', city: 'Mohali', text: 'ApnaGhr made house hunting so easy. No more dealing with fake brokers! Genuine properties only.', rating: 5, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
              { name: 'Anita Kaur', city: 'Kharar', text: 'Transparent pricing and genuine properties. The field rider was punctual and helpful. Highly recommended!', rating: 5, image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' }
            ].map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15, duration: 0.5 }}
                whileHover={{ y: -5 }}
                className="bg-white border border-[#E5E1DB] p-6 hover:shadow-xl transition-all duration-300 hover:border-[#C6A87C]/30"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 + i * 0.05 }}
                    >
                      <Sparkles className="w-4 h-4 text-[#C6A87C]" fill="#C6A87C" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-sm text-[#4A4D53] mb-5 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-[#E5E1DB]">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#C6A87C]/30"
                  />
                  <div>
                    <p className="font-medium text-sm text-[#1A1C20]">{testimonial.name}</p>
                    <p className="text-xs text-[#4A4D53] flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {testimonial.city}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Animated Trust Badges */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 py-8 px-6 bg-gradient-to-r from-[#04473C] to-[#065F4E] text-white"
          >
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {[
                  { value: '1000+', label: 'Happy Customers', icon: '🏠' },
                  { value: '500+', label: 'Verified Properties', icon: '✓' },
                  { value: '50+', label: 'Field Riders', icon: '🛵' },
                  { value: '4.8★', label: 'Average Rating', icon: '⭐' }
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4"
                  >
                    <motion.p 
                      className="text-3xl md:text-4xl font-bold mb-1"
                      style={{ fontFamily: 'Playfair Display, serif' }}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 + 0.2 }}
                    >
                      {stat.value}
                    </motion.p>
                    <p className="text-xs md:text-sm text-white/80 tracking-wide">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-xs text-[#C6A87C] mt-6 font-medium tracking-wide"
          >
            ✦ Powered by ApnaGhr • India's Most Trusted Property Visit Platform ✦
          </motion.p>
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

      {/* Terms Acceptance Modal */}
      <TermsAcceptanceModal
        isOpen={showTermsModal}
        onAccept={async () => {
          try {
            await authAPI.acceptTerms({
              accepted_terms: true,
              accepted_privacy: true,
              accepted_anti_circumvention: true
            });
            setTermsAccepted(true);
            setShowTermsModal(false);
            toast.success('Terms accepted! Welcome to ApnaGhr.');
          } catch (error) {
            toast.error('Failed to save terms. Please try again.');
          }
        }}
        onDecline={() => {
          toast.error('You must accept terms to continue. Logging out...');
          logout();
        }}
        userType="customer"
        context="dashboard"
      />
    </div>
  );
};

export default CustomerHome;
