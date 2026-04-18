// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { visitAPI } from '../utils/api';
import { 
  ArrowLeft, Calendar, MapPin, User, Clock, Home, Phone, Navigation, 
  RefreshCw, X, Locate, Star, MessageCircle, Shield, CheckCircle,
  Car, Route, Zap, ChevronRight, Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const CustomerBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadBookings = async () => {
    try {
      const response = await visitAPI.getMyBookings();
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  // Track rider live location and ETA
  const handleTrackRider = async (booking) => {
    setTrackingLoading(true);
    setShowTrackingModal(true);
    try {
      const response = await visitAPI.trackVisit(booking.id);
      setTrackingData({
        ...response.data,
        booking: booking
      });
    } catch (error) {
      console.error('Track rider error:', error);
      toast.error('Unable to get tracking info');
      setTrackingData({ error: true, booking: booking });
    } finally {
      setTrackingLoading(false);
    }
  };

  // Refresh tracking data
  const refreshTracking = async () => {
    if (!trackingData?.booking) return;
    setTrackingLoading(true);
    try {
      const response = await visitAPI.trackVisit(trackingData.booking.id);
      setTrackingData({
        ...response.data,
        booking: trackingData.booking
      });
      toast.success('Location updated!', { duration: 1500 });
    } catch (error) {
      console.error('Refresh tracking error:', error);
    } finally {
      setTrackingLoading(false);
    }
  };

  // Get status info with Uber-like messaging
  const getStatusInfo = (status) => {
    const statuses = {
      pending: { 
        color: 'amber', 
        text: 'Finding Your Rider', 
        subtext: 'Hang tight! We\'re matching you with the best rider nearby',
        icon: Clock,
        pulse: true
      },
      rider_assigned: { 
        color: 'blue', 
        text: 'Rider Accepted!', 
        subtext: 'Your rider is preparing to pick you up',
        icon: CheckCircle,
        pulse: false
      },
      pickup_started: { 
        color: 'purple', 
        text: 'Rider On The Way', 
        subtext: 'Your rider is heading to your pickup location',
        icon: Car,
        pulse: true
      },
      at_customer: { 
        color: 'indigo', 
        text: 'Rider Has Arrived!', 
        subtext: 'Your rider is waiting at the pickup point',
        icon: MapPin,
        pulse: true
      },
      navigating: { 
        color: 'cyan', 
        text: 'Property Tour Started', 
        subtext: 'Enjoy your property visits!',
        icon: Route,
        pulse: false
      },
      at_property: { 
        color: 'teal', 
        text: 'At Property', 
        subtext: 'Currently viewing property',
        icon: Home,
        pulse: false
      },
      completed: { 
        color: 'green', 
        text: 'Visit Completed', 
        subtext: 'Thank you for using ApnaGhr!',
        icon: CheckCircle,
        pulse: false
      },
      cancelled: { 
        color: 'red', 
        text: 'Cancelled', 
        subtext: 'This visit was cancelled',
        icon: X,
        pulse: false
      },
    };
    return statuses[status] || { color: 'gray', text: status, subtext: '', icon: Clock, pulse: false };
  };

  // Filter bookings by tab
  const activeBookings = bookings.filter(b => !['completed', 'cancelled'].includes(b.status));
  const completedBookings = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));
  const displayedBookings = activeTab === 'active' ? activeBookings : completedBookings;

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#04473C] to-[#065f4e] text-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/customer')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              data-testid="back-button"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-xl">My Visits</h1>
              <p className="text-sm text-white/70">Track your property tours</p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'active' 
                  ? 'bg-white text-[#04473C]' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Active ({activeBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'completed' 
                  ? 'bg-white text-[#04473C]' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Completed ({completedBookings.length})
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-[#04473C] border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-[#4A626C]">Loading your visits...</p>
            </div>
          </div>
        ) : displayedBookings.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-[#F3F2EB] rounded-full flex items-center justify-center mx-auto mb-6">
              {activeTab === 'active' ? (
                <Car className="w-12 h-12 text-[#4A626C]" />
              ) : (
                <CheckCircle className="w-12 h-12 text-[#4A626C]" />
              )}
            </div>
            <h3 className="text-xl font-bold text-[#264653] mb-2">
              {activeTab === 'active' ? 'No Active Visits' : 'No Completed Visits'}
            </h3>
            <p className="text-[#4A626C] mb-6">
              {activeTab === 'active' 
                ? 'Book a property visit to get started!' 
                : 'Your completed visits will appear here'}
            </p>
            {activeTab === 'active' && (
              <button 
                onClick={() => navigate('/customer')} 
                className="bg-[#04473C] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#033530] transition-colors"
              >
                Browse Properties
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {displayedBookings.map((booking, index) => {
                const statusInfo = getStatusInfo(booking.status);
                const StatusIcon = statusInfo.icon;
                const numProperties = booking.property_ids?.length || 1;
                const numCompleted = booking.properties_completed?.length || 0;
                const isActive = !['completed', 'cancelled'].includes(booking.status);
                
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white rounded-2xl overflow-hidden shadow-sm border ${
                      isActive ? 'border-[#04473C]/20' : 'border-[#E5E3D8]'
                    }`}
                    data-testid={`booking-${booking.id}`}
                  >
                    {/* Status Header - Uber Style */}
                    <div className={`p-4 ${
                      statusInfo.color === 'amber' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                      statusInfo.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                      statusInfo.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                      statusInfo.color === 'indigo' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' :
                      statusInfo.color === 'cyan' ? 'bg-gradient-to-r from-cyan-500 to-cyan-600' :
                      statusInfo.color === 'teal' ? 'bg-gradient-to-r from-teal-500 to-teal-600' :
                      statusInfo.color === 'green' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                      statusInfo.color === 'red' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                      'bg-gradient-to-r from-gray-500 to-gray-600'
                    } text-white`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-white/20 rounded-full flex items-center justify-center ${
                          statusInfo.pulse ? 'animate-pulse' : ''
                        }`}>
                          <StatusIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{statusInfo.text}</h3>
                          <p className="text-sm text-white/80">{statusInfo.subtext}</p>
                        </div>
                        {isActive && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-3 h-3 bg-white rounded-full"
                          />
                        )}
                      </div>
                      
                      {/* Progress for multi-property */}
                      {isActive && numProperties > 1 && (
                        <div className="mt-4 pt-3 border-t border-white/20">
                          <div className="flex justify-between text-sm mb-2">
                            <span>Property Progress</span>
                            <span className="font-bold">{numCompleted} of {numProperties}</span>
                          </div>
                          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(numCompleted / numProperties) * 100}%` }}
                              className="h-full bg-white rounded-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Rider Card - Uber Style */}
                    {booking.rider_id && (
                      <div className="p-4 border-b border-[#E5E3D8]">
                        <div className="flex items-center gap-4">
                          {/* Rider Avatar with status ring */}
                          <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#04473C] to-[#2A9D8F] rounded-full flex items-center justify-center">
                              <User className="w-8 h-8 text-white" />
                            </div>
                            {booking.rider_is_online && (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"
                              />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-lg text-[#264653]">
                                {booking.rider_name || 'Your Rider'}
                              </h4>
                              <div className="flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-full">
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                <span className="text-xs font-medium text-amber-700">4.9</span>
                              </div>
                            </div>
                            <p className="text-sm text-[#4A626C]">Property Visit Expert</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Shield className="w-3 h-3 text-green-600" />
                              <span className="text-xs text-green-600">Verified Rider</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            {booking.rider_phone && (
                              <a
                                href={`tel:${booking.rider_phone}`}
                                className="w-12 h-12 bg-[#04473C] rounded-full flex items-center justify-center hover:bg-[#033530] transition-colors"
                                data-testid="call-rider-btn"
                              >
                                <Phone className="w-5 h-5 text-white" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Track Rider Button - Big & Prominent */}
                        {['rider_assigned', 'pickup_started', 'at_customer', 'navigating', 'at_property'].includes(booking.status) && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleTrackRider(booking)}
                            className="w-full mt-4 py-4 bg-gradient-to-r from-[#1a73e8] to-[#4285f4] text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg"
                            data-testid={`track-rider-btn-${booking.id}`}
                          >
                            <motion.div
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <Locate className="w-6 h-6" />
                            </motion.div>
                            <span className="text-lg">Track Rider Live</span>
                            <ChevronRight className="w-5 h-5" />
                          </motion.button>
                        )}
                      </div>
                    )}

                    {/* Finding Rider Animation */}
                    {!booking.rider_id && booking.status === 'pending' && (
                      <div className="p-6 border-b border-[#E5E3D8]">
                        <div className="flex items-center justify-center mb-4">
                          <div className="relative">
                            {/* Radar animation */}
                            <motion.div
                              className="absolute inset-0 border-2 border-[#04473C] rounded-full"
                              animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              style={{ width: 80, height: 80 }}
                            />
                            <motion.div
                              className="absolute inset-0 border-2 border-[#04473C] rounded-full"
                              animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                              style={{ width: 80, height: 80 }}
                            />
                            <motion.div
                              className="absolute inset-0 border-2 border-[#04473C] rounded-full"
                              animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                              style={{ width: 80, height: 80 }}
                            />
                            <div className="w-20 h-20 bg-[#04473C] rounded-full flex items-center justify-center relative z-10">
                              <Car className="w-10 h-10 text-white" />
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <h4 className="font-bold text-lg text-[#264653] mb-1">Searching for Riders</h4>
                          <p className="text-sm text-[#4A626C]">
                            We're finding the best rider near your area...
                          </p>
                          <div className="flex items-center justify-center gap-1 mt-3">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-2 h-2 bg-[#04473C] rounded-full"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Visit Details */}
                    <div className="p-4">
                      {/* Date & Time */}
                      <div className="flex items-center gap-3 mb-4 p-3 bg-[#F3F2EB] rounded-xl">
                        <Calendar className="w-5 h-5 text-[#04473C]" />
                        <div>
                          <p className="font-medium text-[#264653]">{booking.scheduled_date}</p>
                          <p className="text-sm text-[#4A626C]">{booking.scheduled_time}</p>
                        </div>
                      </div>

                      {/* Pickup Location */}
                      {booking.pickup_location && (
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-[#4A626C] uppercase tracking-wider">Pickup Point</p>
                            <p className="font-medium text-[#264653]">{booking.pickup_location}</p>
                          </div>
                        </div>
                      )}

                      {/* Properties List */}
                      <div className="space-y-2">
                        <p className="text-xs text-[#4A626C] uppercase tracking-wider mb-2">
                          {numProperties === 1 ? 'Property to Visit' : `${numProperties} Properties to Visit`}
                        </p>
                        {booking.properties?.slice(0, 3).map((prop, idx) => (
                          <div 
                            key={prop.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border ${
                              booking.properties_completed?.includes(prop.id)
                                ? 'bg-green-50 border-green-200'
                                : 'bg-[#F9FAFB] border-[#E5E7EB]'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              booking.properties_completed?.includes(prop.id)
                                ? 'bg-green-500 text-white'
                                : 'bg-[#FF5A5F] text-white'
                            }`}>
                              {booking.properties_completed?.includes(prop.id) ? '✓' : idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#264653] truncate">{prop.title}</p>
                              <p className="text-sm text-[#4A626C] truncate">{prop.location || prop.area_name}</p>
                            </div>
                            {booking.properties_completed?.includes(prop.id) && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Visited</span>
                            )}
                          </div>
                        ))}
                        {booking.properties?.length > 3 && (
                          <p className="text-sm text-[#4A626C] text-center">
                            +{booking.properties.length - 3} more properties
                          </p>
                        )}
                      </div>

                      {/* Completed Badge */}
                      {booking.status === 'completed' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-4 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white text-center"
                        >
                          <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                          <p className="font-bold">Visit Completed Successfully!</p>
                          <p className="text-sm text-white/80">Thank you for using ApnaGhr</p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Live Tracking Modal - Full Screen Uber Style */}
        <AnimatePresence>
          {showTrackingModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#04473C] z-[100] overflow-hidden"
            >
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 p-4 z-20">
                <button
                  onClick={() => setShowTrackingModal(false)}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <X className="w-5 h-5 text-[#264653]" />
                </button>
              </div>

              {/* Content */}
              <div className="h-full flex flex-col justify-end">
                {/* Map Placeholder / Animation */}
                <div className="flex-1 relative overflow-hidden">
                  {/* Animated background */}
                  <div className="absolute inset-0">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white/20 rounded-full"
                        initial={{ 
                          x: Math.random() * 500,
                          y: Math.random() * 500,
                        }}
                        animate={{ 
                          x: Math.random() * 500,
                          y: Math.random() * 500,
                        }}
                        transition={{ 
                          duration: 10 + Math.random() * 10,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      />
                    ))}
                  </div>

                  {/* Rider location pulse */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <motion.div
                      className="absolute inset-0 border-4 border-[#4ECDC4] rounded-full"
                      animate={{ scale: [1, 3], opacity: [0.5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ width: 80, height: 80, marginLeft: -40, marginTop: -40 }}
                    />
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-20 h-20 bg-[#4ECDC4] rounded-full flex items-center justify-center shadow-2xl"
                    >
                      <Car className="w-10 h-10 text-white" />
                    </motion.div>
                  </div>
                </div>

                {/* Bottom Card */}
                <motion.div
                  initial={{ y: 100 }}
                  animate={{ y: 0 }}
                  className="bg-white rounded-t-3xl p-6 shadow-2xl"
                >
                  {trackingLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-[#04473C] border-t-transparent rounded-full"
                      />
                    </div>
                  ) : trackingData?.error ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-amber-600" />
                      </div>
                      <p className="font-bold text-[#264653] mb-2">Location Unavailable</p>
                      <p className="text-sm text-[#4A626C]">The rider's location is not available right now</p>
                    </div>
                  ) : trackingData ? (
                    <div className="space-y-4">
                      {/* Rider Info */}
                      <div className="flex items-center gap-4 pb-4 border-b border-[#E5E3D8]">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-[#04473C] to-[#2A9D8F] rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-white" />
                          </div>
                          {trackingData.rider?.is_online && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-[#264653]">
                            {trackingData.rider?.name || trackingData.booking?.rider_name || 'Your Rider'}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-sm text-[#4A626C]">4.9 Rating</span>
                          </div>
                        </div>
                        {(trackingData.rider?.phone || trackingData.booking?.rider_phone) && (
                          <a
                            href={`tel:${trackingData.rider?.phone || trackingData.booking?.rider_phone}`}
                            className="w-14 h-14 bg-[#04473C] rounded-full flex items-center justify-center"
                          >
                            <Phone className="w-6 h-6 text-white" />
                          </a>
                        )}
                      </div>

                      {/* ETA Card */}
                      {trackingData.eta && (
                        <motion.div
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                          className="bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] text-white p-5 rounded-2xl"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-white/80 uppercase tracking-wider">Arriving In</p>
                              <div className="flex items-baseline gap-1">
                                <motion.span
                                  key={trackingData.eta.eta_minutes}
                                  initial={{ scale: 1.2 }}
                                  animate={{ scale: 1 }}
                                  className="text-5xl font-black"
                                >
                                  {Math.round(trackingData.eta.eta_minutes)}
                                </motion.span>
                                <span className="text-2xl">min</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-white/80">Distance</p>
                              <p className="text-3xl font-bold">{trackingData.eta.distance_km} km</p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Current Location */}
                      {trackingData.rider?.current_lat && trackingData.rider?.current_lng && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-4 bg-[#F3F2EB] rounded-xl">
                            <Locate className="w-6 h-6 text-[#04473C]" />
                            <div className="flex-1">
                              <p className="font-medium text-[#264653]">Live Location</p>
                              <p className="text-sm text-[#4A626C]">
                                {trackingData.rider.current_lat.toFixed(4)}, {trackingData.rider.current_lng.toFixed(4)}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              window.open(`https://www.google.com/maps?q=${trackingData.rider.current_lat},${trackingData.rider.current_lng}`, '_blank');
                            }}
                            className="w-full py-4 bg-[#1a73e8] text-white rounded-xl font-bold flex items-center justify-center gap-2"
                          >
                            <Navigation className="w-5 h-5" />
                            Open in Google Maps
                          </button>
                        </div>
                      )}

                      {/* Status */}
                      <div className="flex items-center gap-3 p-4 border border-[#E5E3D8] rounded-xl">
                        <Zap className="w-5 h-5 text-[#04473C]" />
                        <div>
                          <p className="text-sm text-[#4A626C]">Current Status</p>
                          <p className="font-bold text-[#264653] capitalize">
                            {trackingData.visit?.current_step?.replace(/_/g, ' ') || trackingData.booking?.status?.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>

                      {/* Refresh Button */}
                      <button
                        onClick={refreshTracking}
                        disabled={trackingLoading}
                        className="w-full py-4 border-2 border-[#04473C] text-[#04473C] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#04473C] hover:text-white transition-all"
                      >
                        <RefreshCw className={`w-5 h-5 ${trackingLoading ? 'animate-spin' : ''}`} />
                        Refresh Location
                      </button>
                    </div>
                  ) : null}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default CustomerBookings;
