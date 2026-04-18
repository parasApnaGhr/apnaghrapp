// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Marquee from 'react-fast-marquee';
import { ArrowLeft, Zap, TrendingUp, Star, Crown, Check, Building2, Phone, Mail, ChevronRight, Users, Eye, MousePointer, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';
import { initiateCashfreePayment } from '../utils/cashfree';
import AIAdGenerator from '../components/AIAdGenerator';

const AdvertiseWithUs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [step, setStep] = useState(1); // 1: packages, 2: profile form, 3: ad details
  const [activeTab, setActiveTab] = useState('packages'); // packages, ai-generator
  const [profileData, setProfileData] = useState({
    company_name: '',
    business_type: '',
    contact_email: '',
    contact_phone: user?.phone || '',
    gst_number: '',
    address: ''
  });
  const [adData, setAdData] = useState({
    description: '',
    target_url: '',
    placement: ['home'],
    start_date: '',
    end_date: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const packageIcons = {
    starter: Zap,
    growth: TrendingUp,
    premium: Star,
    elite: Crown
  };

  const packageColors = {
    starter: 'ad-starter',
    growth: 'ad-growth',
    premium: 'ad-premium',
    elite: 'ad-elite'
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const response = await api.get('/advertising/packages');
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
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/advertising/profile', profileData);
      setStep(3);
      toast.success('Profile created!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // First create the ad
      const adResponse = await api.post('/advertising/ads', {
        company_name: profileData.company_name,
        package_tier: selectedPackage.tier,
        poster_images: [],
        ...adData
      });
      
      const ad = adResponse.data.ad;
      
      // Then initiate payment
      const paymentResponse = await api.post('/advertising/pay', {
        ad_id: ad.id,
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
        toast.success('Ad created! Redirecting to payment...');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit ad');
      setSubmitting(false);
    }
  };

  const togglePlacement = (place) => {
    setAdData(prev => ({
      ...prev,
      placement: prev.placement.includes(place)
        ? prev.placement.filter(p => p !== place)
        : [...prev.placement, place]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="kinetic-loader">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b-2 border-[#111111]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              data-testid="back-button"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Outfit' }}>
                Advertise With Us
              </h1>
              <p className="text-sm text-[#52525B]">Reach thousands of home seekers</p>
            </div>
          </div>
        </div>
      </header>

      {/* Marquee Banner */}
      <div className="bg-[#111111] text-white py-3 border-b-2 border-[#FFD166]">
        <Marquee speed={50} gradient={false}>
          <span className="marquee-text text-[#FFD166]">GROW YOUR BUSINESS</span>
          <span className="marquee-text">PREMIUM AD PLACEMENT</span>
          <span className="marquee-text text-[#4ECDC4]">REACH ACTIVE RENTERS</span>
          <span className="marquee-text">AESTHETIC CREATIVES</span>
          <span className="marquee-text text-[#FF5A5F]">BOOST VISIBILITY</span>
        </Marquee>
      </div>

      {/* Hero Section */}
      {step === 1 && (
        <section className="relative overflow-hidden">
          <img 
            src="https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
            alt="Advertising"
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6] via-transparent to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="neo-card p-6"
            >
              <h2 className="text-3xl font-black tracking-tight mb-2" style={{ fontFamily: 'Outfit' }}>
                Put Your Brand In Front
              </h2>
              <p className="text-[#52525B]">
                Showcase your business to people actively searching for homes. We create aesthetic ads that convert.
              </p>
            </motion.div>
          </div>
        </section>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tab Navigation for Step 1 */}
        {step === 1 && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-white rounded-xl border-2 border-[#111111] p-1">
              <button
                onClick={() => setActiveTab('packages')}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  activeTab === 'packages'
                    ? 'bg-[#FFD166] shadow-[2px_2px_0px_#111111]'
                    : 'hover:bg-gray-100'
                }`}
                data-testid="tab-packages"
              >
                <Star className="w-4 h-4 inline mr-2" />
                Ad Packages
              </button>
              <button
                onClick={() => setActiveTab('ai-generator')}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  activeTab === 'ai-generator'
                    ? 'bg-[#4ECDC4] text-white shadow-[2px_2px_0px_#111111]'
                    : 'hover:bg-gray-100'
                }`}
                data-testid="tab-ai-generator"
              >
                <Wand2 className="w-4 h-4 inline mr-2" />
                AI Ad Generator
              </button>
            </div>
          </div>
        )}

        {/* Step Indicator - Only show for packages flow */}
        {step > 1 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-10 h-10 rounded-full border-2 border-[#111111] flex items-center justify-center font-bold transition-all ${
                  step >= s 
                    ? 'bg-[#FFD166] shadow-[2px_2px_0px_#111111]' 
                    : 'bg-white'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
        )}

        {/* AI Ad Generator Tab */}
        {step === 1 && activeTab === 'ai-generator' && (
          <AIAdGenerator />
        )}

        {/* Step 1: Package Selection */}
        {step === 1 && activeTab === 'packages' && (
          <>
            {/* Stats Banner */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: Users, value: '10,000+', label: 'Monthly Users' },
                { icon: Eye, value: '50,000+', label: 'Ad Impressions' },
                { icon: MousePointer, value: '8%', label: 'Avg. CTR' }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="neo-card p-4 text-center"
                >
                  <stat.icon className="w-6 h-6 mx-auto mb-2 text-[#FF5A5F]" />
                  <div className="text-2xl font-black" style={{ fontFamily: 'Outfit' }}>{stat.value}</div>
                  <div className="text-xs text-[#52525B]">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            <h2 className="text-2xl font-black tracking-tight mb-6" style={{ fontFamily: 'Outfit' }}>
              Choose Your Ad Package
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {packages.map((pkg, index) => {
                const Icon = packageIcons[pkg.tier] || Zap;
                return (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`package-card ${packageColors[pkg.tier]} cursor-pointer`}
                    onClick={() => handleSelectPackage(pkg)}
                    data-testid={`ad-package-${pkg.tier}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-white rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111]">
                        <Icon className="w-6 h-6" />
                      </div>
                      {pkg.tier === 'growth' && (
                        <span className="badge badge-hot">Popular</span>
                      )}
                    </div>

                    <h3 className="text-xl font-black mb-1" style={{ fontFamily: 'Outfit' }}>
                      {pkg.name}
                    </h3>

                    <div className="text-3xl font-black mb-4" style={{ fontFamily: 'Outfit' }}>
                      ₹{pkg.price_monthly.toLocaleString()}
                      <span className="text-base font-normal text-[#52525B]">/month</span>
                    </div>

                    <ul className="space-y-2 mb-4">
                      {pkg.includes.map((item, i) => (
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

                    <button className="btn-secondary w-full mt-4 flex items-center justify-center gap-2">
                      Get Started <ChevronRight className="w-5 h-5" />
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Ad Placements Preview */}
            <div className="neo-card p-6">
              <h3 className="text-xl font-black mb-4" style={{ fontFamily: 'Outfit' }}>
                Where Your Ads Appear
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: 'Home Screen', desc: 'Top banner & scroll section' },
                  { name: 'Property Pages', desc: 'Sidebar & inline placements' },
                  { name: 'Featured Section', desc: '"Recommended by ApnaGhr" badge' }
                ].map((place, i) => (
                  <div key={i} className="p-4 bg-[#F3F4F6] rounded-xl border-2 border-[#111111]/20">
                    <h4 className="font-bold mb-1">{place.name}</h4>
                    <p className="text-sm text-[#52525B]">{place.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Step 2: Business Profile */}
        {step === 2 && selectedPackage && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="neo-card p-6 mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-xl ${packageColors[selectedPackage.tier]} border-2 border-[#111111]`}>
                  {React.createElement(packageIcons[selectedPackage.tier] || Zap, { className: 'w-6 h-6' })}
                </div>
                <div>
                  <h3 className="font-bold">{selectedPackage.name}</h3>
                  <p className="text-sm text-[#52525B]">₹{selectedPackage.price_monthly.toLocaleString()}/month</p>
                </div>
              </div>

              <h2 className="text-2xl font-black mb-6" style={{ fontFamily: 'Outfit' }}>
                <Building2 className="w-7 h-7 inline mr-2" />
                Business Profile
              </h2>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">Company Name *</label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      placeholder="Your business name"
                      value={profileData.company_name}
                      onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })}
                      data-testid="company-name-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Business Type *</label>
                    <select
                      required
                      className="input-field"
                      value={profileData.business_type}
                      onChange={(e) => setProfileData({ ...profileData, business_type: e.target.value })}
                      data-testid="business-type-select"
                    >
                      <option value="">Select type</option>
                      <option value="packers_movers">Packers & Movers</option>
                      <option value="furniture">Furniture Shop</option>
                      <option value="broker">Real Estate Broker</option>
                      <option value="builder">Builder/Developer</option>
                      <option value="home_services">Home Services</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      required
                      className="input-field"
                      placeholder="business@example.com"
                      value={profileData.contact_email}
                      onChange={(e) => setProfileData({ ...profileData, contact_email: e.target.value })}
                      data-testid="email-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      className="input-field"
                      placeholder="Phone number"
                      value={profileData.contact_phone}
                      onChange={(e) => setProfileData({ ...profileData, contact_phone: e.target.value })}
                      data-testid="phone-input"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">GST Number (Optional)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="GST number if available"
                      value={profileData.gst_number}
                      onChange={(e) => setProfileData({ ...profileData, gst_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Business Address</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Your business address"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  data-testid="submit-profile-btn"
                >
                  {submitting ? 'Creating...' : 'Continue to Ad Details'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Step 3: Ad Details */}
        {step === 3 && selectedPackage && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="neo-card p-6">
              <h2 className="text-2xl font-black mb-6" style={{ fontFamily: 'Outfit' }}>
                Campaign Details
              </h2>

              <form onSubmit={handleAdSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Ad Description *</label>
                  <textarea
                    required
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Describe your business and what you want to promote"
                    value={adData.description}
                    onChange={(e) => setAdData({ ...adData, description: e.target.value })}
                    data-testid="ad-description-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Website URL (Optional)</label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://your-website.com"
                    value={adData.target_url}
                    onChange={(e) => setAdData({ ...adData, target_url: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-3">Ad Placement *</label>
                  <div className="flex flex-wrap gap-2">
                    {['home', 'property_detail', 'featured'].map((place) => (
                      <button
                        key={place}
                        type="button"
                        onClick={() => togglePlacement(place)}
                        className={`px-4 py-2 rounded-full border-2 border-[#111111] font-medium text-sm transition-all ${
                          adData.placement.includes(place)
                            ? 'bg-[#4ECDC4] shadow-[2px_2px_0px_#111111]'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        {adData.placement.includes(place) && <Check className="w-4 h-4 inline mr-1" />}
                        {place.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">Start Date *</label>
                    <input
                      type="date"
                      required
                      className="input-field"
                      value={adData.start_date}
                      onChange={(e) => setAdData({ ...adData, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">End Date *</label>
                    <input
                      type="date"
                      required
                      className="input-field"
                      value={adData.end_date}
                      onChange={(e) => setAdData({ ...adData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-[#111111]/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold">Total</span>
                    <span className="text-2xl font-black" style={{ fontFamily: 'Outfit' }}>
                      ₹{selectedPackage.price_monthly.toLocaleString()}/month
                    </span>
                  </div>
                  <p className="text-sm text-[#52525B] mb-4">
                    Our team will create aesthetic creatives for your brand. You'll receive a preview before going live.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                    data-testid="submit-ad-btn"
                  >
                    {submitting ? 'Submitting...' : 'Submit for Review'}
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdvertiseWithUs;
