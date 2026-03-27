import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { paymentAPI } from '../utils/api';
import { 
  ArrowLeft, Trash2, MapPin, Home, Calendar, Clock, 
  IndianRupee, ShoppingCart, CreditCard, Check, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

const VisitCart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get cart from localStorage
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

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('visitCart', JSON.stringify(cart));
  }, [cart]);

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingData(prev => ({
      ...prev,
      scheduled_date: tomorrow.toISOString().split('T')[0]
    }));
  }, []);

  // Auto-select package based on cart size
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

    // Store booking data for after payment
    localStorage.setItem('pendingVisitBooking', JSON.stringify({
      property_ids: cart.map(p => p.id),
      ...bookingData
    }));

    setLoading(true);
    try {
      const originUrl = window.location.origin;
      const response = await paymentAPI.createCheckout(selectedPackage, originUrl, null);
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create payment');
      setLoading(false);
    }
  };

  // Calculate estimated duration
  const estimatedMinutes = cart.length > 0 ? cart.length * 15 + (cart.length - 1) * 20 + 30 : 0;
  const hours = Math.floor(estimatedMinutes / 60);
  const mins = estimatedMinutes % 60;
  const estimatedDuration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const selectedPkg = packages.find(p => p.id === selectedPackage);

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b-2 border-[#111111]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/customer')}
              className="p-2 hover:bg-gray-100 rounded-full"
              data-testid="back-button"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black" style={{ fontFamily: 'Outfit' }}>Visit Cart</h1>
              <p className="text-sm text-[#52525B]">{cart.length} properties selected</p>
            </div>
          </div>
          
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[#FF5A5F] text-sm font-bold hover:underline"
              data-testid="clear-cart-button"
            >
              Clear All
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {cart.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#F3F4F6] border-2 border-[#111111] flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-[#9CA3AF]" />
            </div>
            <p className="text-[#52525B] mb-4 text-lg">Your visit cart is empty</p>
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
            <div className="space-y-4 mb-6">
              {cart.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="neo-card p-4 flex gap-4"
                  data-testid={`cart-item-${property.id}`}
                >
                  <div className="w-10 h-10 bg-[#FF5A5F] text-white rounded-full border-2 border-[#111111] flex items-center justify-center font-bold flex-shrink-0 shadow-[2px_2px_0px_#111111]">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-4">
                      {property.images?.[0] ? (
                        <img 
                          src={property.images[0]} 
                          alt="" 
                          className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border-2 border-[#111111]"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-[#F3F4F6] rounded-xl border-2 border-[#111111] flex items-center justify-center flex-shrink-0">
                          <Home className="w-8 h-8 text-[#9CA3AF]" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate">{property.title}</h3>
                        <p className="text-sm text-[#52525B]">
                          {property.bhk} BHK • {property.furnishing}
                        </p>
                        <p className="text-sm text-[#52525B] flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {property.area_name}
                        </p>
                        <p className="text-[#FF5A5F] font-bold mt-1">
                          ₹{property.rent?.toLocaleString()}/mo
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeFromCart(property.id)}
                    className="p-2 text-[#FF5A5F] hover:bg-red-50 rounded-lg self-start"
                    data-testid={`remove-${property.id}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Visit Summary */}
            <div className="neo-card p-6 mb-6 bg-gradient-to-br from-[#4ECDC4]/10 to-white">
              <h3 className="font-bold mb-4 text-[#111111]">Visit Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#52525B]">Properties</span>
                  <span className="font-bold">{cart.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52525B]">Est. Duration</span>
                  <span className="font-bold">{estimatedDuration}</span>
                </div>
              </div>
            </div>

            {/* Visit Packages - PAYMENT REQUIRED */}
            <div className="neo-card p-6 mb-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Select Visit Package
              </h3>
              <p className="text-sm text-[#52525B] mb-4">
                Payment is required before booking visits
              </p>
              
              <div className="space-y-3">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    disabled={pkg.visits < cart.length}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedPackage === pkg.id
                        ? 'border-[#111111] bg-[#FFD166] shadow-[3px_3px_0px_#111111]'
                        : pkg.visits < cart.length
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-[#111111] bg-white hover:shadow-[3px_3px_0px_#111111]'
                    }`}
                    data-testid={`package-${pkg.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 border-[#111111] flex items-center justify-center ${
                          selectedPackage === pkg.id ? 'bg-[#111111]' : 'bg-white'
                        }`}>
                          {selectedPackage === pkg.id && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{pkg.visits} Visit{pkg.visits > 1 ? 's' : ''}</span>
                            {pkg.popular && (
                              <span className="badge badge-hot text-xs px-2 py-0.5">POPULAR</span>
                            )}
                          </div>
                          <span className="text-sm text-[#52525B]">Valid for {pkg.validity}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black" style={{ fontFamily: 'Outfit' }}>₹{pkg.price}</span>
                        {pkg.visits > 1 && (
                          <p className="text-xs text-[#52525B]">₹{Math.round(pkg.price / pkg.visits)}/visit</p>
                        )}
                      </div>
                    </div>
                    {pkg.visits < cart.length && (
                      <p className="text-xs text-red-500 mt-2">
                        Not enough visits for {cart.length} properties
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Booking Details Form */}
            <div className="neo-card p-6 mb-6">
              <h3 className="font-bold text-lg mb-4">Schedule Your Visit</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Visit Date
                  </label>
                  <input
                    type="date"
                    value={bookingData.scheduled_date}
                    onChange={(e) => setBookingData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field"
                    data-testid="scheduled-date-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Preferred Time
                  </label>
                  <select
                    value={bookingData.scheduled_time}
                    onChange={(e) => setBookingData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    className="input-field"
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
                  <label className="block text-sm font-bold mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Pickup Location
                  </label>
                  <input
                    type="text"
                    value={bookingData.pickup_location}
                    onChange={(e) => setBookingData(prev => ({ ...prev, pickup_location: e.target.value }))}
                    placeholder="Where should we pick you up?"
                    className="input-field"
                    data-testid="pickup-location-input"
                  />
                </div>
              </div>
            </div>

            {/* Pay & Book Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#111111] p-4">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#52525B]">Total Payment</p>
                  <p className="text-2xl font-black" style={{ fontFamily: 'Outfit' }}>
                    ₹{selectedPkg?.price || 0}
                  </p>
                </div>
                <button
                  onClick={handlePayAndBook}
                  disabled={loading || !selectedPackage || cart.length === 0}
                  className="btn-primary flex items-center gap-2"
                  data-testid="pay-and-book-button"
                >
                  {loading ? (
                    <div className="kinetic-loader" style={{ transform: 'scale(0.4)' }}>
                      <span></span><span></span><span></span>
                    </div>
                  ) : (
                    <>
                      Pay & Book
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default VisitCart;
