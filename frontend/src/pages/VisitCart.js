import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { paymentAPI, getMediaUrl } from '../utils/api';
import { initiateCashfreePayment } from '../utils/cashfree';
import { 
  ArrowLeft, Trash2, MapPin, Home, Calendar, Clock, 
  ShoppingCart, CreditCard, Check, ChevronRight, AlertTriangle, FileText, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import TermsAcceptanceModal from '../components/TermsAcceptanceModal';

const VisitCart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('visitCart');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [bookingData, setBookingData] = useState({
    scheduled_date: '',
    scheduled_time: '',
    pickup_location: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('visitCart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingData(prev => ({
      ...prev,
      scheduled_date: tomorrow.toISOString().split('T')[0]
    }));
  }, []);

  useEffect(() => {
    if (cart.length === 1) {
      setSelectedPackage('single_visit');
    } else if (cart.length <= 3) {
      setSelectedPackage('three_visits');
    } else {
      setSelectedPackage('five_visits');
    }
  }, [cart.length]);

  const removeFromCart = (propertyId) => {
    const newCart = cart.filter(item => item.id !== propertyId);
    setCart(newCart);
    toast.success('Property removed from cart');
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('visitCart');
    toast.success('Cart cleared');
  };

  const packages = [
    { id: 'single_visit', visits: 1, price: 200, validity: '3 days', popular: false },
    { id: 'three_visits', visits: 3, price: 350, validity: '7 days', popular: true },
    { id: 'five_visits', visits: 5, price: 500, validity: '10 days', popular: false }
  ];

  const handlePayAndBook = async () => {
    if (cart.length === 0) {
      toast.error('Add properties to your cart first');
      return;
    }
    
    if (!selectedPackage) {
      toast.error('Please select a visit package');
      return;
    }

    if (!bookingData.scheduled_date || !bookingData.scheduled_time || !bookingData.pickup_location) {
      toast.error('Please fill in all booking details');
      return;
    }

    if (!termsAccepted) {
      setShowTermsModal(true);
      return;
    }

    // Store booking data and proceed to payment

    localStorage.setItem('pendingVisitBooking', JSON.stringify({
      property_ids: cart.map(p => p.id),
      ...bookingData
    }));

    setLoading(true);
    try {
      const originUrl = window.location.origin;
      const response = await paymentAPI.createCheckout(selectedPackage, originUrl, null);
      
      // Use Cashfree SDK for payment
      const paymentSessionId = response.data.payment_session_id;
      const returnUrl = `${originUrl}/payment-success?order_id=${response.data.order_id}`;
      
      if (paymentSessionId) {
        // Try Cashfree SDK first
        try {
          await initiateCashfreePayment(paymentSessionId, returnUrl);
        } catch (sdkError) {
          console.warn('Cashfree SDK error, falling back to redirect:', sdkError);
          // Fallback to direct redirect if SDK fails
          if (response.data.checkout_url) {
            window.location.href = response.data.checkout_url;
          } else {
            throw new Error('Payment initialization failed');
          }
        }
      } else if (response.data.checkout_url) {
        // Fallback to checkout URL
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error('No payment session received');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Failed to create payment');
      setLoading(false);
    }
  };

  const estimatedMinutes = cart.length > 0 ? cart.length * 15 + (cart.length - 1) * 20 + 30 : 0;
  const hours = Math.floor(estimatedMinutes / 60);
  const mins = estimatedMinutes % 60;
  const estimatedDuration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const selectedPkg = packages.find(p => p.id === selectedPackage);

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32">
      {/* Premium Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/customer')}
              className="p-2 hover:bg-[#F5F3F0] transition-colors"
              data-testid="back-button"
            >
              <ArrowLeft className="w-5 h-5 text-[#1A1C20]" strokeWidth={1.5} />
            </button>
            <div>
              <h1 className="text-xl font-medium" style={{ fontFamily: 'Playfair Display, serif' }}>Visit Cart</h1>
              <p className="text-sm text-[#4A4D53]">{cart.length} properties selected</p>
            </div>
          </div>
          
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[#8F2727] text-sm font-medium hover:underline"
              data-testid="clear-cart-button"
            >
              Clear All
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {cart.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-[#F5F3F0] flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-[#D0C9C0]" strokeWidth={1} />
            </div>
            <h2 className="text-xl mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Your cart is empty</h2>
            <p className="text-[#4A4D53] mb-6">Add properties to schedule visits</p>
            <button 
              onClick={() => navigate('/customer')} 
              className="btn-primary"
              data-testid="browse-properties-button"
            >
              Browse Properties
            </button>
          </motion.div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-4 mb-8">
              {cart.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border border-[#E5E1DB] p-5 flex gap-4"
                  data-testid={`cart-item-${property.id}`}
                >
                  <div className="w-10 h-10 bg-[#04473C] text-white flex items-center justify-center font-medium flex-shrink-0">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-4">
                      {property.images?.[0] ? (
                        <img 
                          src={getMediaUrl(property.images[0])} 
                          alt="" 
                          className="w-20 h-20 object-cover flex-shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-20 h-20 bg-[#F5F3F0] flex items-center justify-center flex-shrink-0">
                          <Home className="w-8 h-8 text-[#D0C9C0]" strokeWidth={1} />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate text-[#1A1C20]">{property.title}</h3>
                        <p className="text-sm text-[#4A4D53]">
                          {property.bhk} BHK · {property.furnishing}
                        </p>
                        <p className="text-sm text-[#4A4D53] flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" strokeWidth={1.5} />
                          {property.area_name}
                        </p>
                        <p className="price-display text-lg mt-2">
                          <span className="price-currency text-sm">₹</span>
                          {property.rent?.toLocaleString('en-IN')}
                          <span className="text-[#4A4D53] text-sm font-normal">/mo</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeFromCart(property.id)}
                    className="p-2 text-[#8F2727] hover:bg-red-50 self-start"
                    data-testid={`remove-${property.id}`}
                  >
                    <Trash2 className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Visit Summary */}
            <div className="bg-[#E6F0EE] border border-[#04473C]/20 p-6 mb-8">
              <h3 className="text-sm font-medium tracking-wide uppercase text-[#04473C] mb-4">Visit Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#4A4D53]">Properties</span>
                  <span className="font-medium text-[#1A1C20]">{cart.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4A4D53]">Est. Duration</span>
                  <span className="font-medium text-[#1A1C20]">{estimatedDuration}</span>
                </div>
              </div>
            </div>

            {/* Visit Packages */}
            <div className="bg-white border border-[#E5E1DB] p-6 mb-8">
              <h3 className="text-lg mb-2 flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                <CreditCard className="w-5 h-5 text-[#04473C]" strokeWidth={1.5} />
                Select Visit Package
              </h3>
              <p className="text-sm text-[#4A4D53] mb-6">
                Payment required before booking visits
              </p>
              
              <div className="space-y-3">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    disabled={pkg.visits < cart.length}
                    className={`w-full p-5 border text-left transition-all relative ${
                      selectedPackage === pkg.id
                        ? 'border-[#04473C] bg-[#E6F0EE]'
                        : pkg.visits < cart.length
                          ? 'border-[#E5E1DB] bg-[#F5F3F0] opacity-50 cursor-not-allowed'
                          : 'border-[#E5E1DB] hover:border-[#D0C9C0]'
                    }`}
                    data-testid={`package-${pkg.id}`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-3 right-4 premium-badge">Popular</span>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-5 h-5 border flex items-center justify-center ${
                          selectedPackage === pkg.id 
                            ? 'border-[#04473C] bg-[#04473C]' 
                            : 'border-[#D0C9C0]'
                        }`}>
                          {selectedPackage === pkg.id && <Check className="w-3 h-3 text-white" strokeWidth={2} />}
                        </div>
                        <div>
                          <span className="font-medium text-[#1A1C20]">{pkg.visits} Visit{pkg.visits > 1 ? 's' : ''}</span>
                          <span className="text-sm text-[#4A4D53] ml-2">· Valid for {pkg.validity}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="price-display text-xl">
                          <span className="price-currency text-sm">₹</span>{pkg.price}
                        </span>
                        {pkg.visits > 1 && (
                          <p className="text-xs text-[#4A4D53]">₹{Math.round(pkg.price / pkg.visits)}/visit</p>
                        )}
                      </div>
                    </div>
                    {pkg.visits < cart.length && (
                      <p className="text-xs text-[#8F2727] mt-2">
                        Not enough visits for {cart.length} properties
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Booking Details Form */}
            <div className="bg-white border border-[#E5E1DB] p-6 mb-8">
              <h3 className="text-lg mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>Schedule Your Visit</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="premium-label flex items-center gap-2">
                    <Calendar className="w-4 h-4" strokeWidth={1.5} />
                    Visit Date
                  </label>
                  <input
                    type="date"
                    value={bookingData.scheduled_date}
                    onChange={(e) => setBookingData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="premium-input"
                    data-testid="scheduled-date-input"
                  />
                </div>
                
                <div>
                  <label className="premium-label flex items-center gap-2">
                    <Clock className="w-4 h-4" strokeWidth={1.5} />
                    Preferred Time
                  </label>
                  <select
                    value={bookingData.scheduled_time}
                    onChange={(e) => setBookingData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    className="premium-input"
                    data-testid="scheduled-time-input"
                  >
                    <option value="">Select a time</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                  </select>
                </div>
                
                <div>
                  <label className="premium-label flex items-center gap-2">
                    <MapPin className="w-4 h-4" strokeWidth={1.5} />
                    Pickup Location
                  </label>
                  <input
                    type="text"
                    value={bookingData.pickup_location}
                    onChange={(e) => setBookingData(prev => ({ ...prev, pickup_location: e.target.value }))}
                    placeholder="Where should we pick you up?"
                    className="premium-input"
                    data-testid="pickup-location-input"
                  />
                </div>
              </div>
            </div>

            {/* Terms Acceptance Section */}
            <div className="bg-white border border-[#E5E1DB] p-6 mb-8">
              <h3 className="text-lg mb-4 flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                <Shield className="w-5 h-5 text-[#04473C]" strokeWidth={1.5} />
                Legal Agreement
              </h3>
              
              {termsAccepted ? (
                <div className="flex items-center gap-3 p-4 bg-[#E6F0EE] border border-[#04473C]/20 rounded-lg">
                  <div className="w-8 h-8 bg-[#04473C] rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-medium text-[#04473C]">Terms & Conditions Accepted</p>
                    <p className="text-sm text-[#4A4D53]">You agreed to anti-circumvention and privacy policies</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">Action Required</p>
                        <p className="text-sm text-amber-700 mt-1">
                          You must accept our Terms & Conditions including the <strong>Anti-Circumvention Policy</strong> before proceeding with payment.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowTermsModal(true)}
                    className="w-full p-4 border-2 border-dashed border-[#04473C] bg-[#E6F0EE]/50 text-[#04473C] font-medium flex items-center justify-center gap-2 hover:bg-[#E6F0EE] transition-colors"
                    data-testid="view-terms-button"
                  >
                    <FileText className="w-5 h-5" strokeWidth={1.5} />
                    View & Accept Terms
                  </button>
                </div>
              )}
            </div>

            {/* Pay & Book Button - Fixed Bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E1DB] p-4 z-40">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#4A4D53] uppercase tracking-wide">Total Payment</p>
                  <p className="price-display text-2xl">
                    <span className="price-currency text-base">₹</span>
                    {selectedPkg?.price || 0}
                  </p>
                </div>
                <button
                  onClick={handlePayAndBook}
                  disabled={loading || !selectedPackage || cart.length === 0 || !termsAccepted}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  data-testid="pay-and-book-button"
                >
                  {loading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Pay & Book
                      <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Terms Acceptance Modal */}
      <TermsAcceptanceModal
        isOpen={showTermsModal}
        onAccept={() => {
          setTermsAccepted(true);
          setShowTermsModal(false);
          toast.success('Terms accepted! You can now proceed with payment.');
        }}
        onDecline={() => {
          setShowTermsModal(false);
          toast.error('You must accept terms to book visits');
        }}
        userType="customer"
        context="booking"
      />
    </div>
  );
};

export default VisitCart;
