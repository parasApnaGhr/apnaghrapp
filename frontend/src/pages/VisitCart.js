import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { paymentAPI, getMediaUrl, authAPI, visitAPI } from '../utils/api';
import { initiateCashfreePayment } from '../utils/cashfree';
import {
  ArrowLeft, Trash2, MapPin, Home, Calendar, Clock,
  ShoppingCart, CreditCard, Check, ChevronRight, AlertTriangle, FileText, Shield, Bike, Car,
  Navigation
} from 'lucide-react';
import { toast } from 'sonner';
import TermsAcceptanceModal from '../components/TermsAcceptanceModal';
import LocationAutocomplete from '../components/LocationAutocomplete';

// Convert a date (yyyy-mm-dd) + time label ("03:00 PM") into an IST ISO8601
// string. Matches how the backend parses `scheduled_at`.
const buildScheduledIso = (dateStr, timeLabel) => {
  if (!dateStr || !timeLabel) return null;
  const match = timeLabel.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${dateStr}T${hh}:${mm}:00+05:30`;
};

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
    pickup_location: '',
    pickup_lat: null,
    pickup_lng: null,
    visit_purpose: 'navigate_only'
  });
  
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [checkingTerms, setCheckingTerms] = useState(true);
  const [sortingRoute, setSortingRoute] = useState(false);
  const [distanceMap, setDistanceMap] = useState({});
  const [estimate, setEstimate] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState(null);
  const sortedKeyRef = useRef(null);
  const estimateKeyRef = useRef(null);
  const useFakePaymentFlow =
    process.env.REACT_APP_FAKE_PAYMENT_FLOW === 'true' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  // Check terms status from database on mount
  useEffect(() => {
    const checkTermsStatus = async () => {
      try {
        // Check from user object first (comes from login response)
        if (user?.terms_accepted) {
          setTermsAccepted(true);
          setCheckingTerms(false);
          return;
        }
        
        // Otherwise check via API
        const response = await authAPI.getTermsStatus();
        setTermsAccepted(response.data.terms_accepted || false);
      } catch (error) {
        console.error('Error checking terms status:', error);
        setTermsAccepted(false);
      } finally {
        setCheckingTerms(false);
      }
    };
    
    if (user) {
      checkTermsStatus();
    } else {
      setCheckingTerms(false);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('visitCart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const today = new Date();
    setBookingData(prev => ({
      ...prev,
      scheduled_date: today.toISOString().split('T')[0]
    }));
  }, []);

  // Smart routing: reorder cart so the property nearest to the pickup is visited first.
  // Runs whenever pickup coordinates or the set of cart property IDs changes.
  useEffect(() => {
    const { pickup_lat, pickup_lng } = bookingData;
    if (!pickup_lat || !pickup_lng || cart.length < 2) return;

    const cartIds = cart.map(p => p.id).sort().join('|');
    const key = `${pickup_lat.toFixed(5)}:${pickup_lng.toFixed(5)}|${cartIds}`;
    if (sortedKeyRef.current === key) return;

    let cancelled = false;
    setSortingRoute(true);

    visitAPI
      .sortByPickup(cart.map(p => p.id), pickup_lat, pickup_lng)
      .then(response => {
        if (cancelled) return;
        const sortedIds = response.data?.sorted_property_ids || [];
        const distances = response.data?.distances_km || {};
        const idToItem = Object.fromEntries(cart.map(p => [p.id, p]));
        const reordered = sortedIds.map(id => idToItem[id]).filter(Boolean);
        // Keep any items the backend didn't return at the end, preserving cart integrity
        cart.forEach(item => {
          if (!sortedIds.includes(item.id)) reordered.push(item);
        });
        const reorderedIds = reordered.map(p => p.id).join('|');
        const currentIds = cart.map(p => p.id).join('|');
        if (reorderedIds !== currentIds) {
          setCart(reordered);
        }
        setDistanceMap(distances);
        sortedKeyRef.current = key;
      })
      .catch(err => {
        console.warn('Smart-distance sort failed:', err);
      })
      .finally(() => {
        if (!cancelled) setSortingRoute(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookingData.pickup_lat, bookingData.pickup_lng, cart]);

  // Live dynamic-price estimate. Re-runs whenever the inputs that affect price
  // change (cart, pickup coords, schedule, visit purpose). Debounced so rapid
  // typing / reorders don't hammer the backend.
  useEffect(() => {
    const { pickup_lat, pickup_lng, scheduled_date, scheduled_time, visit_purpose } = bookingData;
    if (cart.length === 0 || !pickup_lat || !pickup_lng) {
      setEstimate(null);
      setEstimateError(null);
      estimateKeyRef.current = null;
      return;
    }

    const propertyIds = cart.map(p => p.id);
    const scheduledIso = scheduled_date && scheduled_time
      ? buildScheduledIso(scheduled_date, scheduled_time)
      : null;
    const key = JSON.stringify({
      propertyIds,
      pickup_lat: Number(pickup_lat).toFixed(5),
      pickup_lng: Number(pickup_lng).toFixed(5),
      scheduledIso,
      visit_purpose,
    });
    if (estimateKeyRef.current === key && estimate) return;

    let cancelled = false;
    setEstimating(true);
    setEstimateError(null);

    const handle = setTimeout(() => {
      visitAPI
        .estimatePrice({
          property_ids: propertyIds,
          pickup_lat,
          pickup_lng,
          visit_purpose: visit_purpose || 'navigate_only',
          scheduled_at: scheduledIso || undefined,
        })
        .then(res => {
          if (cancelled) return;
          setEstimate(res.data);
          estimateKeyRef.current = key;
        })
        .catch(err => {
          if (cancelled) return;
          console.warn('Price estimate failed:', err);
          setEstimate(null);
          setEstimateError(err.response?.data?.detail || 'Could not calculate price');
        })
        .finally(() => {
          if (!cancelled) setEstimating(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [
    cart,
    bookingData.pickup_lat,
    bookingData.pickup_lng,
    bookingData.scheduled_date,
    bookingData.scheduled_time,
    bookingData.visit_purpose,
  ]);

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

  const handlePayAndBook = async () => {
    if (cart.length === 0) {
      toast.error('Add properties to your cart first');
      return;
    }

    if (!bookingData.scheduled_date || !bookingData.scheduled_time || !bookingData.pickup_location) {
      toast.error('Please fill in all booking details');
      return;
    }

    if (!bookingData.pickup_lat || !bookingData.pickup_lng) {
      toast.error('Please pick a pickup location with a valid address');
      return;
    }

    const finalAmount = payableAmount;
    if (!estimate || !finalAmount) {
      toast.error('Please wait for the fare to be calculated');
      return;
    }

    if (!termsAccepted) {
      setShowTermsModal(true);
      return;
    }

    const scheduledIso = buildScheduledIso(bookingData.scheduled_date, bookingData.scheduled_time);
    const checkoutPayload = {
      property_ids: cart.map(p => p.id),
      pickup_lat: bookingData.pickup_lat,
      pickup_lng: bookingData.pickup_lng,
      visit_purpose: bookingData.visit_purpose || 'navigate_only',
      scheduled_at: scheduledIso,
      origin_url: window.location.origin,
    };

    localStorage.setItem('pendingVisitBooking', JSON.stringify({
      property_ids: cart.map(p => p.id),
      visit_amount: finalAmount,
      total_distance_km: estimate.total_distance_km,
      checkout_payload: checkoutPayload,
      ...bookingData,
    }));

    if (useFakePaymentFlow) {
      toast.info('Local test mode: skipping Cashfree and opening payment success directly');
      navigate(`/payment-success?mock=1&order_id=mock_${Date.now()}&type=visit`);
      return;
    }

    setLoading(true);
    try {
      const response = await paymentAPI.createVisitDynamicCheckout(checkoutPayload);

      const paymentSessionId = response.data.payment_session_id;
      const returnUrl = `${window.location.origin}/payment-success?order_id=${response.data.order_id}`;

      if (paymentSessionId) {
        try {
          await initiateCashfreePayment(paymentSessionId, returnUrl);
        } catch (sdkError) {
          console.warn('Cashfree SDK error, falling back to redirect:', sdkError);
          if (response.data.checkout_url) {
            window.location.href = response.data.checkout_url;
          } else {
            throw new Error('Payment initialization failed');
          }
        }
      } else if (response.data.checkout_url) {
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

  // Payable falls back to gross_amount for back-compat with older backend
  // responses that didn't include the discount/payable fields.
  const payableAmount = estimate
    ? (estimate.payable_amount ?? estimate.gross_amount ?? 0)
    : null;

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
                        {distanceMap[property.id] != null && (
                          <p className="text-xs text-[#04473C] mt-1 flex items-center gap-1">
                            <Navigation className="w-3 h-3" strokeWidth={1.5} />
                            {distanceMap[property.id]} km from pickup
                          </p>
                        )}
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
                <div className="flex justify-between items-center">
                  <span className="text-[#4A4D53]">Smart Route</span>
                  <span className="font-medium text-[#1A1C20] flex items-center gap-2">
                    {sortingRoute ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-[#04473C] border-t-transparent rounded-full animate-spin" />
                        Optimising…
                      </>
                    ) : bookingData.pickup_lat && bookingData.pickup_lng && cart.length > 1 ? (
                      'Nearest first ✓'
                    ) : (
                      'Set pickup to sort'
                    )}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#04473C]/15 text-xs text-[#04473C] flex items-start gap-2">
                <Navigation className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                <span>
                  You'll be picked up from your pickup location, taken to each property in the optimised order, then dropped back at the same spot.
                </span>
              </div>
            </div>

            {/* Dynamic Price Breakdown */}
            <div className="bg-white border border-[#E5E1DB] p-6 mb-8">
              <h3 className="text-lg mb-2 flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                <CreditCard className="w-5 h-5 text-[#04473C]" strokeWidth={1.5} />
                Visit Fare
              </h3>
              <p className="text-sm text-[#4A4D53] mb-6">
                Priced by round-trip distance, time of day, and number of properties. Bulk-visit discount applied automatically.
              </p>

              {!bookingData.pickup_lat || !bookingData.pickup_lng ? (
                <div className="p-4 bg-[#F5F3F0] border border-[#E5E1DB] text-sm text-[#4A4D53]">
                  Set a pickup location below to calculate your fare.
                </div>
              ) : estimating && !estimate ? (
                <div className="p-4 bg-[#F5F3F0] border border-[#E5E1DB] text-sm text-[#4A4D53] flex items-center gap-2">
                  <span className="inline-block w-3 h-3 border-2 border-[#04473C] border-t-transparent rounded-full animate-spin" />
                  Calculating fare…
                </div>
              ) : estimateError ? (
                <div className="p-4 bg-red-50 border border-red-200 text-sm text-[#8F2727]">
                  {estimateError}
                </div>
              ) : estimate ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#4A4D53]">Round-trip distance</span>
                    <span className="font-medium text-[#1A1C20]">{estimate.total_distance_km} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4A4D53]">Base fare</span>
                    <span className="font-medium text-[#1A1C20]">₹{estimate.base_fare}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4A4D53]">Distance charge</span>
                    <span className="font-medium text-[#1A1C20]">₹{estimate.distance_fare}</span>
                  </div>
                  {estimate.distance_tier_fee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#4A4D53]">
                        Distance tier
                        {estimate.breakdown?.distance_tier ? ` (${estimate.breakdown.distance_tier})` : ''}
                      </span>
                      <span className="font-medium text-[#1A1C20]">₹{estimate.distance_tier_fee}</span>
                    </div>
                  )}
                  {estimate.time_of_week_fee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#4A4D53]">Time-of-week</span>
                      <span className="font-medium text-[#1A1C20]">₹{estimate.time_of_week_fee}</span>
                    </div>
                  )}
                  {estimate.peak_multiplier && estimate.peak_multiplier !== 1 && (
                    <div className="flex justify-between">
                      <span className="text-[#4A4D53]">Peak ({estimate.peak_label})</span>
                      <span className="font-medium text-[#1A1C20]">×{estimate.peak_multiplier}</span>
                    </div>
                  )}
                  {estimate.waiting_allowance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#4A4D53]">Waiting allowance</span>
                      <span className="font-medium text-[#1A1C20]">₹{estimate.waiting_allowance}</span>
                    </div>
                  )}
                  {estimate.traffic_surcharge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#4A4D53]">Traffic surcharge</span>
                      <span className="font-medium text-[#1A1C20]">₹{estimate.traffic_surcharge}</span>
                    </div>
                  )}
                  {estimate.extra_property_fee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#4A4D53]">Extra-property fee ({cart.length - 1})</span>
                      <span className="font-medium text-[#1A1C20]">₹{estimate.extra_property_fee}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-3 border-t border-[#E5E1DB]">
                    <span className="text-[#4A4D53]">Subtotal</span>
                    <span className="font-medium text-[#1A1C20]">₹{estimate.gross_amount}</span>
                  </div>
                  {estimate.discount_amount > 0 && (
                    <div className="flex justify-between text-[#04473C]">
                      <span>
                        Bulk-visit discount
                        {estimate.discount_percent ? ` (${estimate.discount_percent}% off)` : ''}
                      </span>
                      <span className="font-medium">-₹{estimate.discount_amount}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-3 border-t border-[#04473C]/20 text-base">
                    <span className="font-medium text-[#1A1C20]">Total Payment</span>
                    <span className="price-display text-xl">
                      <span className="price-currency text-sm">₹</span>{payableAmount}
                    </span>
                  </div>

                  {estimate.platform_cut > 0 && (
                    <p className="text-xs text-[#4A4D53] pt-1">
                      Includes a{' '}
                      {estimate.breakdown?.platform_cut_pct
                        ? `${estimate.breakdown.platform_cut_pct}% `
                        : ''}
                      platform fee of ₹{estimate.platform_cut} that supports ride matching, support, and safety.
                    </p>
                  )}

                  {estimating && (
                    <div className="pt-2 text-xs text-[#4A4D53] flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 border-2 border-[#04473C] border-t-transparent rounded-full animate-spin" />
                      Updating…
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-[#F5F3F0] border border-[#E5E1DB] text-sm text-[#4A4D53]">
                  Enter your pickup location to see the fare.
                </div>
              )}
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
                  <label className="premium-label">Vehicle / Assistance Type</label>
                  <p className="text-xs text-[#4A4D53] mb-3">
                    Tell us whether you need only navigation, bike pickup, or car pickup.
                  </p>
                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      {
                        id: 'navigate_only',
                        label: 'Only Navigation',
                        note: 'You already have your own vehicle and only want someone to guide you to the property',
                        icon: MapPin
                      },
                      {
                        id: 'bike_pickup',
                        label: 'Bike Pickup',
                        note: 'You want to be picked up on a bike and taken to the property',
                        icon: Bike
                      },
                      {
                        id: 'car_pickup',
                        label: 'Car Pickup',
                        note: 'You want to be picked up in a car and taken to the property',
                        icon: Car
                      }
                    ].map((option) => {
                      const Icon = option.icon;
                      const selected = bookingData.visit_purpose === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setBookingData(prev => ({ ...prev, visit_purpose: option.id }))}
                          className={`border p-4 text-left transition-colors ${
                            selected ? 'border-[#04473C] bg-[#E6F0EE]' : 'border-[#E5E1DB] bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4 text-[#04473C]" />
                            <span className="font-medium text-[#1A1C20]">{option.label}</span>
                          </div>
                          <p className="text-xs text-[#4A4D53]">{option.note}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="premium-label flex items-center gap-2">
                    <MapPin className="w-4 h-4" strokeWidth={1.5} />
                    Pickup / Starting Location
                  </label>
                  <p className="text-xs text-[#4A4D53] mb-2">
                    Start typing an address to see suggestions, pick a recent location, or tap "Use Current" to auto-fill.
                  </p>
                  <LocationAutocomplete
                    value={bookingData.pickup_location}
                    onChange={({ label, lat, lng }) => setBookingData(prev => ({
                      ...prev,
                      pickup_location: label,
                      pickup_lat: lat,
                      pickup_lng: lng
                    }))}
                    hasCoords={!!(bookingData.pickup_lat && bookingData.pickup_lng)}
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
                    {payableAmount != null ? payableAmount : '—'}
                  </p>
                  {estimate?.discount_amount > 0 && (
                    <p className="text-xs text-[#04473C]">
                      {estimate.discount_percent}% bulk-visit discount applied
                    </p>
                  )}
                </div>
                <button
                  onClick={handlePayAndBook}
                  disabled={
                    loading ||
                    cart.length === 0 ||
                    !termsAccepted ||
                    !estimate ||
                    estimating
                  }
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
        onAccept={async () => {
          try {
            // Save to database permanently
            await authAPI.acceptTerms({
              accepted_terms: true,
              accepted_privacy: true,
              accepted_anti_circumvention: true
            });
            setTermsAccepted(true);
            setShowTermsModal(false);
            toast.success('Terms accepted! You can now proceed with payment.');
          } catch (error) {
            toast.error('Failed to save terms acceptance. Please try again.');
            console.error('Terms acceptance error:', error);
          }
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
