import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { visitAPI, paymentAPI } from '../utils/api';
import { 
  ArrowLeft, Trash2, MapPin, Home, Calendar, Clock, 
  IndianRupee, ShoppingCart, CreditCard, AlertCircle
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
  const [hasCredits, setHasCredits] = useState(true);

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

  const handleBookVisit = async () => {
    if (cart.length === 0) {
      toast.error('Add properties to your cart first');
      return;
    }
    
    if (!bookingData.scheduled_date || !bookingData.scheduled_time || !bookingData.pickup_location) {
      toast.error('Please fill in all booking details');
      return;
    }
    
    setLoading(true);
    try {
      const response = await visitAPI.bookVisit({
        property_ids: cart.map(p => p.id),
        scheduled_date: bookingData.scheduled_date,
        scheduled_time: bookingData.scheduled_time,
        pickup_location: bookingData.pickup_location
      });
      
      toast.success(`Visit booked for ${cart.length} properties!`);
      
      // Clear cart after successful booking
      setCart([]);
      localStorage.removeItem('visitCart');
      
      // Navigate to bookings page
      navigate('/customer/bookings');
    } catch (error) {
      const detail = error.response?.data?.detail || 'Failed to book visit';
      toast.error(detail);
      
      if (detail.includes('No available visit credits') || detail.includes('Not enough visit credits')) {
        setHasCredits(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCredits = async (packageId) => {
    setLoading(true);
    try {
      const originUrl = window.location.origin;
      const response = await paymentAPI.createCheckout(packageId, originUrl, null);
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create payment');
      setLoading(false);
    }
  };

  // Calculate estimated duration
  const estimatedMinutes = cart.length * 15 + (cart.length - 1) * 20 + 30;
  const hours = Math.floor(estimatedMinutes / 60);
  const mins = estimatedMinutes % 60;
  const estimatedDuration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-32">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E3D8] sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/customer')}
              className="p-2 hover:bg-[#F3F2EB] rounded-lg"
              data-testid="back-button"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-lg">Visit Cart</h1>
              <p className="text-sm text-[#4A626C]">{cart.length} properties selected</p>
            </div>
          </div>
          
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-500 text-sm hover:underline"
              data-testid="clear-cart-button"
            >
              Clear All
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {cart.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-16 h-16 text-[#4A626C] mx-auto mb-4 opacity-50" />
            <p className="text-[#4A626C] mb-4">Your visit cart is empty</p>
            <button 
              onClick={() => navigate('/customer')} 
              className="btn-primary"
              data-testid="browse-properties-button"
            >
              Browse Properties
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cart.map((property, index) => (
                <div
                  key={property.id}
                  className="bg-white rounded-xl border border-[#E5E3D8] p-4 flex gap-4"
                  data-testid={`cart-item-${property.id}`}
                >
                  <div className="w-10 h-10 bg-[#E07A5F] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-4">
                      {property.images?.[0] ? (
                        <img 
                          src={property.images[0]} 
                          alt="" 
                          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-[#F3F2EB] rounded-lg flex items-center justify-center flex-shrink-0">
                          <Home className="w-8 h-8 text-[#4A626C]" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate">{property.title}</h3>
                        <p className="text-sm text-[#4A626C]">
                          {property.bhk} BHK • {property.furnishing}
                        </p>
                        <p className="text-sm text-[#4A626C] flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {property.area_name}
                        </p>
                        <p className="text-[#E07A5F] font-bold mt-1">
                          ₹{property.rent?.toLocaleString()}/mo
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeFromCart(property.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg self-start"
                    data-testid={`remove-${property.id}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Visit Summary */}
            <div className="bg-[#F0FDF9] rounded-xl p-6 mb-6 border border-[#2A9D8F]/20">
              <h3 className="font-bold mb-4 text-[#2A9D8F]">Visit Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#4A626C]">Properties</span>
                  <span className="font-medium">{cart.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4A626C]">Est. Duration</span>
                  <span className="font-medium">{estimatedDuration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4A626C]">Visit Credits Needed</span>
                  <span className="font-medium">{cart.length}</span>
                </div>
              </div>
            </div>

            {/* No Credits Warning */}
            {!hasCredits && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">You need visit credits</p>
                    <p className="text-sm text-amber-600 mb-3">
                      Purchase a visit package to book your property visits.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleBuyCredits('single_visit')}
                        disabled={loading}
                        className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-700"
                        data-testid="buy-single-visit"
                      >
                        1 Visit - ₹200
                      </button>
                      <button
                        onClick={() => handleBuyCredits('five_visits')}
                        disabled={loading}
                        className="bg-[#2A9D8F] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#238b7e]"
                        data-testid="buy-five-visits"
                      >
                        5 Visits - ₹500
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Form */}
            <div className="bg-white rounded-xl border border-[#E5E3D8] p-6 mb-6">
              <h3 className="font-bold text-lg mb-4">Schedule Your Visit</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
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
                  <label className="block text-sm font-medium mb-2">
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
                  <label className="block text-sm font-medium mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Pickup Location
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your pickup address"
                    value={bookingData.pickup_location}
                    onChange={(e) => setBookingData(prev => ({ ...prev, pickup_location: e.target.value }))}
                    className="input-field"
                    data-testid="pickup-location-input"
                  />
                  <p className="text-xs text-[#4A626C] mt-1">
                    The rider will pick you up from this location
                  </p>
                </div>
              </div>
            </div>

            {/* Book Button */}
            <button
              onClick={handleBookVisit}
              disabled={loading || cart.length === 0}
              className="w-full bg-[#E07A5F] text-white px-4 py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#d06a4f] font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="book-visit-button"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Book Visit for {cart.length} Properties
                </>
              )}
            </button>
            
            <p className="text-xs text-center text-[#4A626C] mt-3">
              Uses {cart.length} visit credit{cart.length > 1 ? 's' : ''} from your package
            </p>
          </>
        )}
      </main>
    </div>
  );
};

export default VisitCart;
