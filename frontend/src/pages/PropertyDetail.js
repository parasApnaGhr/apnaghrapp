import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { propertyAPI, paymentAPI } from '../utils/api';
import { ArrowLeft, MapPin, Bed, Sofa, Home, Lock, Video, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    loadProperty();
  }, [id]);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#E07A5F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#4A626C]">Loading property...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#4A626C]">Property not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-32">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E3D8] sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/customer')}
            className="p-2 hover:bg-[#F3F2EB] rounded-lg"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-lg">{property.title}</h1>
            <p className="text-sm text-[#4A626C]">{property.area_name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Image Gallery */}
        <div className="mb-6">
          <div className="relative h-64 md:h-96 bg-[#F3F2EB] rounded-xl overflow-hidden mb-3">
            {property.images && property.images[selectedImage] ? (
              <img
                src={property.images[selectedImage]}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Home className="w-16 h-16 text-[#4A626C]" />
              </div>
            )}
            {property.premium_listing && (
              <span className="absolute top-4 left-4 badge badge-warning">Premium</span>
            )}
            {property.verified_owner && (
              <span className="absolute top-4 right-4 badge badge-success">Verified Owner</span>
            )}
          </div>

          {property.images && property.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {property.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === idx ? 'border-[#E07A5F]' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Property Info */}
        <div className="bg-white rounded-xl border border-[#E5E3D8] p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-[#E07A5F] mb-1" style={{ fontFamily: 'Outfit' }}>
                ₹{property.rent.toLocaleString()}/month
              </h2>
              <p className="text-[#4A626C]">{property.property_type}</p>
            </div>
          </div>

          <div className="flex gap-6 mb-4">
            <div className="flex items-center gap-2">
              <Bed className="w-5 h-5 text-[#E07A5F]" />
              <span className="font-medium">{property.bhk} BHK</span>
            </div>
            <div className="flex items-center gap-2">
              <Sofa className="w-5 h-5 text-[#E07A5F]" />
              <span className="font-medium">{property.furnishing}</span>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-bold mb-2">Description</h3>
            <p className="text-[#4A626C]">{property.description}</p>
          </div>

          {property.amenities && property.amenities.length > 0 && (
            <div>
              <h3 className="font-bold mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity, idx) => (
                  <span key={idx} className="badge badge-info">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Location - Blurred */}
        <div className="bg-white rounded-xl border border-[#E5E3D8] p-6 mb-6 relative">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#E07A5F]" />
            Location
          </h3>
          <div className="location-blur">
            <div className="h-48 bg-[#F3F2EB] rounded-lg mb-2"></div>
            <p className="text-sm text-[#4A626C]">Exact address: Hidden for privacy</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 text-center border border-[#E5E3D8] shadow-lg">
              <Lock className="w-12 h-12 text-[#E07A5F] mx-auto mb-3" />
              <h4 className="font-bold text-lg mb-2">Location Hidden</h4>
              <p className="text-sm text-[#4A626C] mb-4">
                Book a visit to see exact location
              </p>
            </div>
          </div>
        </div>

        {/* Video Tour */}
        {property.video_url && (
          <div className="bg-white rounded-xl border border-[#E5E3D8] p-6 mb-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Video className="w-5 h-5 text-[#E07A5F]" />
              Video Tour
            </h3>
            <div className="aspect-video bg-[#F3F2EB] rounded-lg">
              <video controls className="w-full h-full rounded-lg">
                <source src={property.video_url} type="video/mp4" />
              </video>
            </div>
          </div>
        )}

        {/* Booking Options */}
        <div className="bg-white rounded-xl border border-[#E5E3D8] p-6">
          <h3 className="font-bold text-xl mb-4" style={{ fontFamily: 'Outfit' }}>
            Book Your Visit
          </h3>

          <div className="space-y-3 mb-6">
            <div
              className="border-2 border-[#E07A5F] rounded-xl p-4 cursor-pointer hover:bg-[#FFF5F2] transition"
              onClick={() => !processingPayment && handleBookVisit('single_visit')}
              data-testid="single-visit-button"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">Single Visit</p>
                  <p className="text-sm text-[#4A626C]">Book one property visit</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#E07A5F]" style={{ fontFamily: 'Outfit' }}>
                    ₹200
                  </p>
                  <p className="text-xs text-[#4A626C]">Adjusted in brokerage</p>
                </div>
              </div>
            </div>

            <div
              className="border-2 border-[#2A9D8F] rounded-xl p-4 cursor-pointer hover:bg-[#F0FDF9] transition relative overflow-hidden"
              onClick={() => !processingPayment && handleBookVisit('five_visits')}
              data-testid="five-visits-button"
            >
              <span className="absolute top-2 right-2 badge badge-success text-xs">Best Value</span>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">5 Visit Package</p>
                  <p className="text-sm text-[#4A626C]">Valid for 10 days</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#2A9D8F]" style={{ fontFamily: 'Outfit' }}>
                    ₹500
                  </p>
                  <p className="text-xs text-[#4A626C]">₹100 per visit</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#E5E3D8] pt-4">
            <button
              onClick={() => !processingPayment && handleLockProperty()}
              disabled={processingPayment}
              data-testid="lock-property-button"
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" />
              Lock Property - ₹999
            </button>
            <p className="text-xs text-center text-[#4A626C] mt-2">
              Lock this property exclusively. Amount adjusted in final brokerage.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PropertyDetail;