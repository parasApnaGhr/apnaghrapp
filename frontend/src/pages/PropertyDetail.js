import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { propertyAPI, paymentAPI, getMediaUrl } from '../utils/api';
import api from '../utils/api';
import { ArrowLeft, MapPin, Bed, Sofa, Home, Lock, Video, ShoppingCart, Plus, Check, Play, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [explainerVideo, setExplainerVideo] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);
  
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('visitCart');
    return saved ? JSON.parse(saved) : [];
  });

  const isInCart = cart.some(item => item.id === id);

  useEffect(() => {
    loadProperty();
    loadExplainerVideo();
  }, [id]);

  useEffect(() => {
    localStorage.setItem('visitCart', JSON.stringify(cart));
  }, [cart]);

  const loadProperty = async () => {
    try {
      const response = await propertyAPI.getProperty(id);
      setProperty(response.data);
    } catch (error) {
      toast.error('Failed to load property');
    } finally {
      setLoading(false);
    }
  };

  const loadExplainerVideo = async () => {
    try {
      const response = await api.get('/settings/explainer-video');
      if (response.data.video_url) {
        setExplainerVideo(response.data.video_url);
      }
    } catch (error) {
      console.log('No explainer video set');
    }
  };

  const addToCart = () => {
    if (!isInCart && property) {
      const newCart = [...cart, {
        id: property.id,
        title: property.title,
        rent: property.rent,
        area_name: property.area_name,
        bhk: property.bhk,
        furnishing: property.furnishing,
        images: property.images
      }];
      setCart(newCart);
      toast.success('Property added to visit cart!');
    }
  };

  const removeFromCart = () => {
    const newCart = cart.filter(item => item.id !== id);
    setCart(newCart);
    toast.success('Property removed from cart');
  };

  const handleBookVisit = async (packageId) => {
    setProcessingPayment(true);
    try {
      const originUrl = window.location.origin;
      const response = await paymentAPI.createCheckout(packageId, originUrl, id);
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create payment');
      setProcessingPayment(false);
    }
  };

  const handleLockProperty = async () => {
    setProcessingPayment(true);
    try {
      const originUrl = window.location.origin;
      const response = await paymentAPI.createCheckout('property_lock', originUrl, id);
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create payment');
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#04473C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#4A4D53] text-sm">Loading property...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <div className="text-center">
          <Home className="w-12 h-12 text-[#D0C9C0] mx-auto mb-4" strokeWidth={1} />
          <p className="text-[#4A4D53]">Property not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32">
      {/* Image Lightbox Modal */}
      {showLightbox && property?.images && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setShowLightbox(false)}
        >
          <button 
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setShowLightbox(false)}
          >
            <X className="w-6 h-6 text-white" strokeWidth={1.5} />
          </button>
          
          {property.images.length > 1 && (
            <>
              <button 
                className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage((prev) => (prev - 1 + property.images.length) % property.images.length);
                }}
              >
                <ChevronLeft className="w-8 h-8 text-white" strokeWidth={1.5} />
              </button>
              <button 
                className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage((prev) => (prev + 1) % property.images.length);
                }}
              >
                <ChevronRight className="w-8 h-8 text-white" strokeWidth={1.5} />
              </button>
            </>
          )}
          
          <img
            src={getMediaUrl(property.images[selectedImage])}
            alt={property.title}
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';
            }}
          />
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {property.images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(idx);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === selectedImage ? 'bg-white w-6' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
          
          <p className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {selectedImage + 1} / {property.images.length}
          </p>
        </div>
      )}

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
              <h1 className="font-medium text-lg text-[#1A1C20]" style={{ fontFamily: 'Outfit, sans-serif' }}>{property.title}</h1>
              <p className="text-sm text-[#4A4D53]">{property.area_name}</p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/customer/cart')}
            className="relative p-3 border border-[#E5E1DB] hover:border-[#04473C] transition-colors"
            data-testid="cart-button"
          >
            <ShoppingCart className="w-5 h-5 text-[#1A1C20]" strokeWidth={1.5} />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#04473C] text-white text-xs font-medium flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Image Gallery */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div 
            className="relative aspect-[16/10] bg-[#F5F3F0] overflow-hidden mb-4 cursor-pointer group"
            onClick={() => property?.images?.length > 0 && setShowLightbox(true)}
          >
            {property.images && property.images[selectedImage] ? (
              <>
                <img
                  src={getMediaUrl(property.images[selectedImage])}
                  alt={property.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-3">
                    <ZoomIn className="w-6 h-6 text-[#04473C]" strokeWidth={1.5} />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Home className="w-16 h-16 text-[#D0C9C0]" strokeWidth={1} />
              </div>
            )}
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              {property.premium_listing && (
                <span className="premium-badge">Premium</span>
              )}
              {property.verified_owner && (
                <span className="verified-badge">Verified Owner</span>
              )}
            </div>
            
            {/* Image count indicator */}
            {property.images && property.images.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1.5 font-medium">
                {selectedImage + 1} / {property.images.length}
              </div>
            )}
          </div>

          {property.images && property.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {property.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-shrink-0 w-20 h-20 overflow-hidden border transition-all ${
                    selectedImage === idx 
                      ? 'border-[#04473C] ring-1 ring-[#04473C]' 
                      : 'border-[#E5E1DB] hover:border-[#D0C9C0]'
                  }`}
                >
                  <img 
                    src={getMediaUrl(img)} 
                    alt="" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Property Info */}
        <motion.div 
          className="bg-white border border-[#E5E1DB] p-8 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="overline text-[#C6A87C] mb-2">Monthly Rent</p>
              <h2 className="price-display text-3xl">
                <span className="price-currency text-lg">₹</span>
                {property.rent?.toLocaleString('en-IN')}
              </h2>
            </div>
            <span className="px-4 py-2 bg-[#F5F3F0] text-[#4A4D53] text-sm font-medium">
              {property.property_type}
            </span>
          </div>

          <div className="flex gap-8 mb-6 pb-6 border-b border-[#E5E1DB]">
            <div className="flex items-center gap-3">
              <Bed className="w-5 h-5 text-[#04473C]" strokeWidth={1.5} />
              <span className="font-medium">{property.bhk} BHK</span>
            </div>
            <div className="flex items-center gap-3">
              <Sofa className="w-5 h-5 text-[#04473C]" strokeWidth={1.5} />
              <span className="font-medium">{property.furnishing}</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium tracking-wide uppercase text-[#4A4D53] mb-3">Description</h3>
            <p className="text-[#4A4D53] leading-relaxed">{property.description}</p>
          </div>

          {property.amenities && property.amenities.length > 0 && (
            <div>
              <h3 className="text-sm font-medium tracking-wide uppercase text-[#4A4D53] mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity, idx) => (
                  <span 
                    key={idx} 
                    className="px-3 py-1.5 bg-[#F5F3F0] text-[#4A4D53] text-sm"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Location - Blurred */}
        <motion.div 
          className="bg-white border border-[#E5E1DB] p-8 mb-6 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-medium tracking-wide uppercase text-[#4A4D53] mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#04473C]" strokeWidth={1.5} />
            Location
          </h3>
          <div className="h-48 bg-[#F5F3F0] mb-2 blur-sm"></div>
          <p className="text-sm text-[#4A4D53] blur-sm">Exact address available after booking</p>
          
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-[#E6F0EE] flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-[#04473C]" strokeWidth={1.5} />
              </div>
              <h4 className="text-lg font-medium mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Location Hidden</h4>
              <p className="text-sm text-[#4A4D53]">Book a visit to see exact location</p>
            </div>
          </div>
        </motion.div>

        {/* Video Tour */}
        {property.video_url && (
          <motion.div 
            className="bg-white border border-[#E5E1DB] p-8 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-sm font-medium tracking-wide uppercase text-[#4A4D53] mb-4 flex items-center gap-2">
              <Video className="w-4 h-4 text-[#04473C]" strokeWidth={1.5} />
              Video Tour
            </h3>
            <div className="aspect-video bg-[#F5F3F0]">
              <video controls className="w-full h-full">
                <source src={getMediaUrl(property.video_url)} type="video/mp4" />
              </video>
            </div>
          </motion.div>
        )}

        {/* Booking Options */}
        <motion.div 
          className="bg-white border border-[#E5E1DB] p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xl mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
            Book Your Visit
          </h3>

          {/* Add to Cart Button */}
          <div className="mb-8">
            {isInCart ? (
              <div className="flex gap-4">
                <button
                  onClick={removeFromCart}
                  className="flex-1 btn-outline flex items-center justify-center gap-2"
                  data-testid="remove-from-cart-button"
                >
                  <Check className="w-5 h-5" strokeWidth={1.5} />
                  In Cart
                </button>
                <button
                  onClick={() => navigate('/customer/cart')}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                  data-testid="view-cart-button"
                >
                  <ShoppingCart className="w-5 h-5" strokeWidth={1.5} />
                  View Cart ({cart.length})
                </button>
              </div>
            ) : (
              <button
                onClick={addToCart}
                className="w-full btn-gold flex items-center justify-center gap-2"
                data-testid="add-to-cart-button"
              >
                <Plus className="w-5 h-5" strokeWidth={1.5} />
                Add to Visit Cart
              </button>
            )}
            <p className="text-xs text-center text-[#4A4D53] mt-3">
              Add multiple properties and book one visit for all
            </p>
          </div>

          <div className="border-t border-[#E5E1DB] pt-8">
            <p className="text-sm text-[#4A4D53] mb-6 text-center">Or purchase visit credits</p>
            
            <div className="space-y-4 mb-8">
              {/* Single Visit */}
              <div
                className={`border p-5 cursor-pointer transition-all ${processingPayment ? 'opacity-50' : 'hover:border-[#04473C] hover:shadow-lg'}`}
                onClick={() => !processingPayment && handleBookVisit('single_visit')}
                data-testid="single-visit-button"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#1A1C20]">1 Visit</p>
                    <p className="text-sm text-[#4A4D53]">Valid for 3 days</p>
                  </div>
                  <p className="price-display text-2xl">
                    <span className="price-currency text-base">₹</span>200
                  </p>
                </div>
              </div>

              {/* 3 Visits Package */}
              <div
                className={`border border-[#C6A87C] p-5 cursor-pointer transition-all relative ${processingPayment ? 'opacity-50' : 'hover:shadow-lg'}`}
                onClick={() => !processingPayment && handleBookVisit('three_visits')}
                data-testid="three-visits-button"
              >
                <span className="absolute -top-3 right-4 premium-badge">Popular</span>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#1A1C20]">3 Visits</p>
                    <p className="text-sm text-[#4A4D53]">Valid for 7 days</p>
                  </div>
                  <div className="text-right">
                    <p className="price-display text-2xl">
                      <span className="price-currency text-base">₹</span>350
                    </p>
                    <p className="text-xs text-[#4A4D53]">₹117 per visit</p>
                  </div>
                </div>
              </div>

              {/* 5 Visits Package */}
              <div
                className={`border border-[#04473C] bg-[#E6F0EE] p-5 cursor-pointer transition-all relative ${processingPayment ? 'opacity-50' : 'hover:shadow-lg'}`}
                onClick={() => !processingPayment && handleBookVisit('five_visits')}
                data-testid="five-visits-button"
              >
                <span className="absolute -top-3 right-4 verified-badge">Best Value</span>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#1A1C20]">5 Visits</p>
                    <p className="text-sm text-[#4A4D53]">Valid for 10 days</p>
                  </div>
                  <div className="text-right">
                    <p className="price-display text-2xl">
                      <span className="price-currency text-base">₹</span>500
                    </p>
                    <p className="text-xs text-[#4A4D53]">₹100 per visit</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#E5E1DB] pt-6">
              <button
                onClick={() => !processingPayment && handleLockProperty()}
                disabled={processingPayment}
                data-testid="lock-property-button"
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" strokeWidth={1.5} />
                Lock Property - ₹999
              </button>
              <p className="text-xs text-center text-[#4A4D53] mt-3">
                Lock this property exclusively. Amount adjusted in final brokerage.
              </p>
            </div>
          </div>
        </motion.div>

        {/* How It Works Section */}
        <motion.div 
          className="bg-[#1A1C20] p-8 mt-6 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-xl mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
            How ApnaGhr Works
          </h3>
          
          {/* Video Section */}
          <div className="bg-white/10 aspect-video mb-8 overflow-hidden relative">
            {explainerVideo ? (
              <video 
                controls 
                className="w-full h-full object-cover"
              >
                <source src={explainerVideo} type="video/mp4" />
              </video>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 flex items-center justify-center mx-auto mb-3">
                    <Play className="w-8 h-8 ml-1" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm opacity-80">Video coming soon</p>
                </div>
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {[
              { step: 1, title: 'Book Your Visit', desc: 'Select properties, pay for visit credits, and schedule your preferred date & time.' },
              { step: 2, title: 'Our Agent Arrives', desc: 'A verified ApnaGhr rider will come to your pickup location. Share OTP only after verification.' },
              { step: 3, title: 'Property Visit', desc: 'The rider will take you to each property. They ensure a safe, reliable visit experience.' },
              { step: 4, title: 'Negotiations & Deal', desc: 'All negotiations handled by ApnaGhr team. Contact our support for pricing and deal finalization.' }
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="w-10 h-10 bg-[#04473C] flex items-center justify-center flex-shrink-0 font-medium">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium mb-1">{item.title}</p>
                  <p className="text-sm text-white/70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Note */}
          <div className="bg-white/10 p-4 mt-8">
            <p className="text-sm text-white/80">
              <span className="font-medium text-[#C6A87C]">Note:</span> Our rider's role is to make your property visit easy and reliable. For negotiations or deal queries, contact our Customer Support team.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PropertyDetail;
