import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Truck, Package, Shield, Crown, MapPin, Check, Plus, Phone, Calendar, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';
import { initiateCashfreePayment } from '../utils/cashfree';

const PackersMovers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [formData, setFormData] = useState({
    from_address: '',
    to_address: '',
    from_city: '',
    to_city: '',
    scheduled_date: '',
    contact_phone: user?.phone || '',
    items_description: '',
    add_ons: []
  });
  const [submitting, setSubmitting] = useState(false);

  const packageIcons = {
    basic: Package,
    standard: Truck,
    premium: Shield,
    elite: Crown,
    intercity: MapPin
  };

  const packageColors = {
    basic: 'package-basic',
    standard: 'package-standard',
    premium: 'package-premium',
    elite: 'package-elite',
    intercity: 'package-intercity'
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const response = await api.get('/packers/packages');
      setPackages(response.data.packages);
      setAddOns(response.data.add_ons);
    } catch (error) {
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setShowBookingForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleAddOn = (addOnId) => {
    setFormData(prev => ({
      ...prev,
      add_ons: prev.add_ons.includes(addOnId)
        ? prev.add_ons.filter(id => id !== addOnId)
        : [...prev.add_ons, addOnId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPackage) return;

    setSubmitting(true);
    try {
      // First create the booking
      const bookingResponse = await api.post('/packers/book', {
        ...formData,
        package_tier: selectedPackage.tier
      });
      
      const booking = bookingResponse.data.booking;
      
      // Then initiate payment
      const paymentResponse = await api.post('/packers/pay', {
        booking_id: booking.id,
        origin_url: window.location.origin
      });
      
      // Redirect to Cashfree checkout
      const paymentSessionId = paymentResponse.data.payment_session_id;
      const returnUrl = `${window.location.origin}/payment-success?order_id=${paymentResponse.data.order_id}`;
      
      if (paymentSessionId) {
        try {
          await initiateCashfreePayment(paymentSessionId, returnUrl);
        } catch (sdkError) {
          console.warn('Cashfree SDK error, falling back to redirect:', sdkError);
          if (paymentResponse.data.checkout_url) {
            window.location.href = paymentResponse.data.checkout_url;
          }
        }
      } else if (paymentResponse.data.checkout_url) {
        window.location.href = paymentResponse.data.checkout_url;
      } else {
        toast.success('Booking created! Redirecting to payment...');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit booking');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <div className="w-8 h-8 border-2 border-[#04473C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-8">
      {/* Premium Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-[#F5F3F0] transition-colors"
              data-testid="back-button"
            >
              <ArrowLeft className="w-6 h-6 text-[#1A1C20]" strokeWidth={1.5} />
            </button>
            <div>
              <h1 className="text-xl font-medium" style={{ fontFamily: 'Playfair Display, serif' }}>
                ApnaGhr Packers
              </h1>
              <p className="text-sm text-[#4A4D53]">Stress-free relocation</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#04473C]/10 to-[#C6A87C]/10"></div>
        <img 
          src="https://images.pexels.com/photos/7464510/pexels-photo-7464510.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
          alt="Movers"
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FDFCFB] via-transparent to-transparent"></div>
        <div className="absolute bottom-4 left-4 right-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E5E1DB] p-6"
          >
            <h2 className="text-2xl mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Moving Made Easy
            </h2>
            <p className="text-[#4A4D53]">
              Professional packers & movers at your service. Choose a package that fits your needs.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Booking Form */}
        {showBookingForm && selectedPackage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-white border border-[#E5E1DB] p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Book {selectedPackage.name}
                </h3>
                <button 
                  onClick={() => setShowBookingForm(false)}
                  className="text-sm font-medium text-[#04473C] hover:underline"
                >
                  Change Package
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="premium-label">From City</label>
                    <input
                      type="text"
                      required
                      className="premium-input"
                      placeholder="e.g., Mumbai"
                      value={formData.from_city}
                      onChange={(e) => setFormData({ ...formData, from_city: e.target.value })}
                      data-testid="from-city-input"
                    />
                  </div>
                  <div>
                    <label className="premium-label">To City</label>
                    <input
                      type="text"
                      required
                      className="premium-input"
                      placeholder="e.g., Pune"
                      value={formData.to_city}
                      onChange={(e) => setFormData({ ...formData, to_city: e.target.value })}
                      data-testid="to-city-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="premium-label">Pickup Address</label>
                  <textarea
                    required
                    rows={2}
                    className="premium-input resize-none"
                    placeholder="Full pickup address with landmarks"
                    value={formData.from_address}
                    onChange={(e) => setFormData({ ...formData, from_address: e.target.value })}
                    data-testid="from-address-input"
                  />
                </div>

                <div>
                  <label className="premium-label">Delivery Address</label>
                  <textarea
                    required
                    rows={2}
                    className="premium-input resize-none"
                    placeholder="Full delivery address with landmarks"
                    value={formData.to_address}
                    onChange={(e) => setFormData({ ...formData, to_address: e.target.value })}
                    data-testid="to-address-input"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="premium-label flex items-center gap-2">
                      <Calendar className="w-4 h-4" strokeWidth={1.5} />
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      required
                      className="premium-input"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                      data-testid="date-input"
                    />
                  </div>
                  <div>
                    <label className="premium-label flex items-center gap-2">
                      <Phone className="w-4 h-4" strokeWidth={1.5} />
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      required
                      className="premium-input"
                      placeholder="Your phone number"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      data-testid="phone-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="premium-label">Items Description (Optional)</label>
                  <textarea
                    rows={2}
                    className="premium-input resize-none"
                    placeholder="Describe major items: beds, sofa, AC, fridge..."
                    value={formData.items_description}
                    onChange={(e) => setFormData({ ...formData, items_description: e.target.value })}
                    data-testid="items-input"
                  />
                </div>

                {/* Add-ons */}
                <div>
                  <label className="premium-label">Add Extra Services</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {addOns.map((addon) => (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => toggleAddOn(addon.id)}
                        className={`px-4 py-2 border font-medium text-sm transition-all ${
                          formData.add_ons.includes(addon.id)
                            ? 'bg-[#04473C] text-white border-[#04473C]'
                            : 'bg-white border-[#E5E1DB] hover:border-[#D0C9C0]'
                        }`}
                        data-testid={`addon-${addon.id}`}
                      >
                        {formData.add_ons.includes(addon.id) && <Check className="w-4 h-4 inline mr-1" />}
                        {addon.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                    data-testid="submit-booking-btn"
                  >
                    {submitting ? (
                      <div className="kinetic-loader" style={{ transform: 'scale(0.5)' }}>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    ) : (
                      <>
                        Request Quote
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  <p className="text-center text-sm text-[#52525B] mt-3">
                    Est. Price: ₹{selectedPackage.price_min.toLocaleString()} - ₹{selectedPackage.price_max.toLocaleString()}
                  </p>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Packages Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-black tracking-tight mb-6" style={{ fontFamily: 'Outfit' }}>
            Choose Your Package
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg, index) => {
              const Icon = packageIcons[pkg.tier] || Package;
              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`package-card ${packageColors[pkg.tier]} cursor-pointer ${
                    selectedPackage?.tier === pkg.tier ? 'ring-4 ring-[#111111]' : ''
                  }`}
                  onClick={() => handleSelectPackage(pkg)}
                  data-testid={`package-${pkg.tier}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111]">
                      <Icon className="w-6 h-6" />
                    </div>
                    {pkg.tier === 'standard' && (
                      <span className="badge badge-hot">Popular</span>
                    )}
                  </div>

                  <h3 className="text-xl font-black mb-2" style={{ fontFamily: 'Outfit' }}>
                    {pkg.name}
                  </h3>

                  <div className="text-2xl font-black mb-4" style={{ fontFamily: 'Outfit' }}>
                    ₹{pkg.price_min.toLocaleString()} - ₹{pkg.price_max.toLocaleString()}
                  </div>

                  <ul className="space-y-2 mb-4">
                    {pkg.includes.slice(0, 4).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t-2 border-[#111111]/20">
                    <p className="text-sm font-medium text-[#52525B]">
                      Best for: {pkg.best_for.join(', ')}
                    </p>
                  </div>

                  {pkg.bonus && pkg.bonus.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {pkg.bonus.map((b, i) => (
                        <span key={i} className="text-xs bg-white/50 px-2 py-1 rounded-full border border-[#111111]/20">
                          + {b}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* How it Works */}
        <div className="neo-card p-6">
          <h3 className="text-xl font-black mb-6" style={{ fontFamily: 'Outfit' }}>
            How It Works
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { num: '01', title: 'Select Package', desc: 'Choose based on your needs' },
              { num: '02', title: 'Get Quote', desc: 'We call with final pricing' },
              { num: '03', title: 'Schedule', desc: 'Pick your moving date' },
              { num: '04', title: 'Relax', desc: 'We handle everything' }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#FFD166] border-2 border-[#111111] flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_#111111]">
                  {step.num}
                </div>
                <h4 className="font-bold mb-1">{step.title}</h4>
                <p className="text-sm text-[#52525B]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackersMovers;
