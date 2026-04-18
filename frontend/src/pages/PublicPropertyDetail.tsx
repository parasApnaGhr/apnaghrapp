// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../utils/api';
import { ArrowLeft, MapPin, Bed, Sofa, Home, Calendar, Play, X, ChevronLeft, ChevronRight, ZoomIn, User, Phone, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const PublicPropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  
  // Get referral code from URL if present
  const refCode = searchParams.get('ref');

  const loadProperty = useCallback(async () => {
    try {
      // Use public endpoint that doesn't require auth
      const API_URL = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${API_URL}/api/public/property/${id}`);
      if (!response.ok) throw new Error('Property not found');
      const data = await response.json();
      setProperty(data);
    } catch (error) {
      console.error('Failed to load property:', error);
      toast.error('Failed to load property');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProperty();
  }, [loadProperty]);

  const handleBookVisit = () => {
    if (!user) {
      // Show auth prompt - store the intended action
      setShowAuthPrompt(true);
      // Store property and referral in localStorage for after login
      localStorage.setItem('pendingBookProperty', JSON.stringify({
        propertyId: id,
        refCode: refCode
      }));
    } else {
      // User is logged in, navigate to booking
      navigate(`/customer/property/${id}${refCode ? `?ref=${refCode}` : ''}`);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/property/${id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title || 'Property on ApnaGhr',
          text: `Check out this ${property?.bhk} BHK in ${property?.area_name} for ₹${property?.rent?.toLocaleString()}/month on ApnaGhr`,
          url: shareUrl
        });
      } catch (error) {
        // User cancelled or error
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
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
          <button 
            onClick={() => navigate('/')} 
            className="mt-4 btn-primary"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32">
      {/* Auth Prompt Modal */}
      {showAuthPrompt && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 max-w-md w-full"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-[#E6F0EE] mx-auto mb-4 flex items-center justify-center">
                <User className="w-8 h-8 text-[#04473C]" />
              </div>
              <h3 className="text-xl mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                Sign in to Book Visit
              </h3>
              <p className="text-[#4A4D53] text-sm mb-6">
                Create an account or sign in to book a visit to this property
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/login?redirect=/customer/property/${id}${refCode ? `&ref=${refCode}` : ''}`)}
                  className="btn-primary w-full"
                  data-testid="auth-prompt-signin-button"
                >
                  Sign In / Register
                </button>
                <button
                  onClick={() => setShowAuthPrompt(false)}
                  className="btn-secondary w-full"
                  data-testid="auth-prompt-continue-button"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

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
        </div>
      )}

      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-[#F5F3F0] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#1A1C20]" strokeWidth={1.5} />
            </button>
            <div>
              <h1 className="text-xl tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                Apna<span className="text-[#04473C]">Ghr</span>
              </h1>
              <p className="text-[10px] text-[#C6A87C] font-medium">Premium Property Visits</p>
            </div>
          </div>
          
          <button
            onClick={handleShare}
            className="p-3 border border-[#E5E1DB] hover:border-[#04473C] transition-colors"
          >
            <Share2 className="w-5 h-5 text-[#1A1C20]" strokeWidth={1.5} />
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
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <ZoomIn className="w-10 h-10 text-white" strokeWidth={1.5} />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Home className="w-16 h-16 text-[#D0C9C0]" strokeWidth={1} />
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

            {/* Image counter */}
            {property.images && property.images.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1">
                {selectedImage + 1} / {property.images.length}
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {property.images && property.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {property.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-shrink-0 w-20 h-20 overflow-hidden ${
                    idx === selectedImage ? 'ring-2 ring-[#04473C]' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={getMediaUrl(img)}
                    alt={`View ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200&q=80';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Property Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-2xl mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            {property.title}
          </h1>
          
          <div className="flex items-center gap-2 text-[#4A4D53] mb-4">
            <MapPin className="w-4 h-4" strokeWidth={1.5} />
            <span>{property.area_name}, {property.city}</span>
          </div>

          {/* Price */}
          <div className="bg-[#04473C] text-white p-6 mb-6">
            <p className="text-sm text-white/70 mb-1">Monthly Rent</p>
            <p className="text-3xl font-medium" style={{ fontFamily: 'Playfair Display, serif' }}>
              ₹{property.rent?.toLocaleString()}
              <span className="text-lg font-normal">/month</span>
            </p>
          </div>

          {/* Key Details */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#F5F3F0] p-4 text-center">
              <Bed className="w-6 h-6 mx-auto mb-2 text-[#04473C]" strokeWidth={1.5} />
              <p className="font-medium">{property.bhk} BHK</p>
              <p className="text-xs text-[#4A4D53]">Bedrooms</p>
            </div>
            <div className="bg-[#F5F3F0] p-4 text-center">
              <Sofa className="w-6 h-6 mx-auto mb-2 text-[#04473C]" strokeWidth={1.5} />
              <p className="font-medium text-sm">{property.furnishing}</p>
              <p className="text-xs text-[#4A4D53]">Furnishing</p>
            </div>
            <div className="bg-[#F5F3F0] p-4 text-center">
              <Home className="w-6 h-6 mx-auto mb-2 text-[#04473C]" strokeWidth={1.5} />
              <p className="font-medium text-sm">{property.property_type}</p>
              <p className="text-xs text-[#4A4D53]">Type</p>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">About this property</h3>
              <p className="text-[#4A4D53] text-sm leading-relaxed">{property.description}</p>
            </div>
          )}

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1.5 bg-[#E6F0EE] text-[#04473C] text-sm"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Video */}
          {property.video_url && (
            <div className="mb-6">
              <h3 className="font-medium mb-3">Property Video</h3>
              <div className="aspect-video bg-black">
                <video
                  src={getMediaUrl(property.video_url)}
                  controls
                  className="w-full h-full"
                  poster={property.images?.[0] ? getMediaUrl(property.images[0]) : undefined}
                />
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E1DB] p-4 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[#4A4D53]">Starting from</p>
            <p className="text-xl font-medium text-[#04473C]" style={{ fontFamily: 'Playfair Display, serif' }}>
              ₹{property.rent?.toLocaleString()}/mo
            </p>
          </div>
          <button
            onClick={handleBookVisit}
            className="btn-primary flex items-center gap-2 px-8"
          >
            <Calendar className="w-5 h-5" strokeWidth={1.5} />
            Book Visit
          </button>
        </div>
      </div>

      {/* Trust Badge */}
      <div className="fixed bottom-20 left-0 right-0 text-center">
        <p className="text-[10px] text-[#C6A87C] font-medium">
          Powered by ApnaGhr • India's Trusted Property Platform
        </p>
      </div>
    </div>
  );
};

export default PublicPropertyDetail;
