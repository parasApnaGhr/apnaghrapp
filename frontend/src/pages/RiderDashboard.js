import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { visitAPI, riderAPI } from '../utils/api';
import { 
  MapPin, Phone, Camera, CheckCircle, Clock, IndianRupee, LogOut, 
  Navigation, User, Home, ChevronRight, Power, AlertCircle,
  Play, Square, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import VisitProofUpload from '../components/VisitProofUpload';

const RiderDashboard = () => {
  const { user, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [availableVisits, setAvailableVisits] = useState([]);
  const [activeVisit, setActiveVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [earnings, setEarnings] = useState({ today: 0, thisWeek: 0 });
  const [showProofUpload, setShowProofUpload] = useState(false);
  const [currentProofPropertyId, setCurrentProofPropertyId] = useState(null);

  // Load initial data
  useEffect(() => {
    loadShiftStatus();
    loadActiveVisit();
  }, []);

  // Poll for visits when online
  useEffect(() => {
    if (isOnline && !activeVisit) {
      loadAvailableVisits();
      const interval = setInterval(loadAvailableVisits, 10000);
      return () => clearInterval(interval);
    }
  }, [isOnline, activeVisit]);

  const loadShiftStatus = async () => {
    try {
      const response = await riderAPI.getShift();
      setIsOnline(response.data.is_online);
    } catch (error) {
      console.error('Failed to load shift status');
    }
  };

  const loadActiveVisit = async () => {
    try {
      const response = await riderAPI.getActiveVisit();
      if (response.data) {
        setActiveVisit(response.data);
      }
    } catch (error) {
      console.error('Failed to load active visit');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableVisits = async () => {
    try {
      const response = await visitAPI.getAvailableVisits();
      setAvailableVisits(response.data);
    } catch (error) {
      console.error('Failed to load visits');
    } finally {
      setLoading(false);
    }
  };

  const toggleShift = async () => {
    setShiftLoading(true);
    try {
      // Try to get current location
      let lat = null, lng = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch (e) {
          console.log('Could not get location');
        }
      }

      await riderAPI.updateShift(!isOnline, lat, lng);
      setIsOnline(!isOnline);
      toast.success(isOnline ? 'You are now offline' : 'You are now online! Ready to receive visits');
      
      if (!isOnline) {
        loadAvailableVisits();
      } else {
        setAvailableVisits([]);
      }
    } catch (error) {
      toast.error('Failed to update shift status');
    } finally {
      setShiftLoading(false);
    }
  };

  const handleAcceptVisit = async (visitId) => {
    try {
      const response = await visitAPI.acceptVisit(visitId);
      setActiveVisit(response.data);
      setAvailableVisits([]);
      toast.success('Visit accepted! Navigate to customer pickup location');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to accept visit');
    }
  };

  const handleUpdateStep = async (action) => {
    if (!activeVisit) return;
    
    try {
      const response = await visitAPI.updateVisitStep(activeVisit.visit.id, action);
      setActiveVisit(prev => ({ ...prev, visit: response.data }));
      
      const messages = {
        start_pickup: 'Started! Navigate to customer',
        arrived_customer: 'Arrived at customer. Verify OTP',
        start_property: 'OTP verified! Navigate to property',
        arrived_property: 'Arrived at property',
        complete_property: 'Property visit completed!',
        complete_visit: 'Visit completed! Great job!'
      };
      
      toast.success(messages[action] || 'Progress updated');
      
      if (action === 'complete_visit' || response.data.status === 'completed') {
        setActiveVisit(null);
        loadAvailableVisits();
      }
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const openNavigation = (address, lat, lng) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
    }
  };

  const getCurrentStepInfo = () => {
    if (!activeVisit?.visit) return null;
    
    const visit = activeVisit.visit;
    const properties = activeVisit.properties || [];
    const currentIdx = visit.current_property_index || 0;
    const currentProperty = properties[currentIdx];
    
    const step = visit.current_step || 'go_to_customer';
    
    if (step === 'go_to_customer') {
      return {
        title: 'Go to Customer',
        subtitle: 'Navigate to pickup location',
        location: visit.pickup_location,
        lat: visit.pickup_lat,
        lng: visit.pickup_lng,
        action: 'arrived_customer',
        actionText: 'Arrived at Customer',
        icon: User
      };
    }
    
    if (step === 'at_customer') {
      return {
        title: 'At Customer Location',
        subtitle: 'Verify OTP with customer',
        showOTP: true,
        otp: visit.otp,
        action: 'start_property',
        actionText: 'OTP Verified - Start Tour',
        icon: CheckCircle
      };
    }
    
    if (step.startsWith('go_to_property_')) {
      return {
        title: `Navigate to Property ${currentIdx + 1}`,
        subtitle: currentProperty?.title || 'Property',
        location: currentProperty?.exact_address,
        lat: currentProperty?.latitude,
        lng: currentProperty?.longitude,
        property: currentProperty,
        action: 'arrived_property',
        actionText: 'Arrived at Property',
        icon: Home
      };
    }
    
    if (step.startsWith('at_property_')) {
      return {
        title: `At Property ${currentIdx + 1}`,
        subtitle: currentProperty?.title || 'Property',
        property: currentProperty,
        showUploadProof: true,
        action: 'complete_property',
        actionText: currentIdx < properties.length - 1 ? 'Complete & Go to Next' : 'Complete Visit',
        icon: Camera
      };
    }
    
    return null;
  };

  const stepInfo = getCurrentStepInfo();

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E3D8] sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>Rider Dashboard</h1>
              <p className="text-sm text-[#4A626C]">Welcome, {user?.name}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Shift Toggle */}
              <button
                onClick={toggleShift}
                disabled={shiftLoading}
                data-testid="shift-toggle"
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                  isOnline 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Power className={`w-4 h-4 ${shiftLoading ? 'animate-spin' : ''}`} />
                {isOnline ? 'Online' : 'Offline'}
              </button>
              
              <button
                onClick={logout}
                className="p-2 hover:bg-[#F3F2EB] rounded-lg"
                data-testid="logout-button"
              >
                <LogOut className="w-5 h-5 text-[#4A626C]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Offline Banner */}
        {!isOnline && !activeVisit && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">You're currently offline</p>
              <p className="text-sm text-amber-600">Go online to receive visit requests</p>
            </div>
          </div>
        )}

        {/* Earnings Card */}
        <div className="bg-gradient-to-r from-[#E07A5F] to-[#F4A261] rounded-xl p-6 mb-6 text-white">
          <h3 className="text-sm font-medium mb-2 opacity-90">Today's Earnings</h3>
          <p className="text-4xl font-bold mb-4" style={{ fontFamily: 'Outfit' }}>
            ₹{earnings.today}
          </p>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="opacity-75">This Week</p>
              <p className="font-bold">₹{earnings.thisWeek}</p>
            </div>
            <div>
              <p className="opacity-75">Per Property</p>
              <p className="font-bold">₹100</p>
            </div>
          </div>
        </div>

        {/* Active Visit - Uber Eats Style Navigation */}
        {activeVisit && stepInfo && (
          <div className="bg-white rounded-xl border-2 border-[#2A9D8F] shadow-lg mb-6 overflow-hidden">
            {/* Progress Steps */}
            <div className="bg-[#2A9D8F] px-6 py-3">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <stepInfo.icon className="w-5 h-5" />
                  <span className="font-bold">{stepInfo.title}</span>
                </div>
                <span className="text-sm opacity-90">
                  {activeVisit.properties?.length || 0} properties
                </span>
              </div>
            </div>

            {/* Step Content */}
            <div className="p-6">
              <p className="text-[#4A626C] mb-4">{stepInfo.subtitle}</p>

              {/* OTP Display */}
              {stepInfo.showOTP && (
                <div className="bg-[#F0FDF9] rounded-xl p-4 mb-4">
                  <p className="text-sm font-medium mb-1">Customer OTP:</p>
                  <p className="text-3xl font-bold text-[#2A9D8F] tracking-widest" style={{ fontFamily: 'Outfit' }}>
                    {stepInfo.otp}
                  </p>
                </div>
              )}

              {/* Location & Navigate */}
              {stepInfo.location && (
                <div className="bg-[#F3F2EB] rounded-xl p-4 mb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-[#4A626C] mb-1">Navigate to:</p>
                      <p className="font-medium">{stepInfo.location}</p>
                    </div>
                    <button
                      onClick={() => openNavigation(stepInfo.location, stepInfo.lat, stepInfo.lng)}
                      className="flex-shrink-0 bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
                      data-testid="navigate-button"
                    >
                      <Navigation className="w-4 h-4" />
                      Navigate
                    </button>
                  </div>
                </div>
              )}

              {/* Property Details */}
              {stepInfo.property && (
                <div className="bg-[#FFF5F2] rounded-xl p-4 mb-4">
                  <div className="flex gap-4">
                    {stepInfo.property.images?.[0] && (
                      <img 
                        src={stepInfo.property.images[0]} 
                        alt="" 
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h4 className="font-bold">{stepInfo.property.title}</h4>
                      <p className="text-sm text-[#4A626C]">{stepInfo.property.bhk} BHK • {stepInfo.property.furnishing}</p>
                      <p className="text-[#E07A5F] font-bold">₹{stepInfo.property.rent?.toLocaleString()}/mo</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Proof */}
              {stepInfo.showUploadProof && (
                <div className="mb-4">
                  <button
                    onClick={() => {
                      setCurrentProofPropertyId(stepInfo.property?.id);
                      setShowProofUpload(true);
                    }}
                    className="w-full bg-[#F3F2EB] text-[#264653] px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#E5E3D8] mb-2"
                    data-testid="upload-proof-button"
                  >
                    <Camera className="w-5 h-5" />
                    Upload Selfie & Video Proof
                  </button>
                  <p className="text-xs text-[#4A626C] text-center">Required before completing property visit</p>
                </div>
              )}

              {/* Call Customer */}
              {activeVisit.customer && (
                <button
                  onClick={() => window.open(`tel:${activeVisit.customer.phone}`, '_self')}
                  className="w-full bg-[#F3F2EB] text-[#264653] px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#E5E3D8] mb-4"
                  data-testid="call-customer-button"
                >
                  <Phone className="w-5 h-5" />
                  Call Customer ({activeVisit.customer.phone})
                </button>
              )}

              {/* Action Button */}
              <button
                onClick={() => handleUpdateStep(stepInfo.action)}
                className="w-full bg-[#2A9D8F] text-white px-4 py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#238b7e] font-bold text-lg"
                data-testid="step-action-button"
              >
                {stepInfo.actionText}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Property Progress Bar */}
            <div className="px-6 pb-4">
              <p className="text-sm text-[#4A626C] mb-2">Properties Progress:</p>
              <div className="flex gap-2">
                {activeVisit.properties?.map((prop, idx) => (
                  <div
                    key={prop.id}
                    className={`flex-1 h-2 rounded-full ${
                      (activeVisit.visit.properties_completed || []).includes(prop.id)
                        ? 'bg-green-500'
                        : idx === activeVisit.visit.current_property_index
                        ? 'bg-[#E07A5F]'
                        : 'bg-gray-200'
                    }`}
                    title={prop.title}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Proof Upload Modal */}
        {showProofUpload && activeVisit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">Upload Visit Proof</h3>
                <VisitProofUpload
                  visitId={activeVisit.visit?.id}
                  propertyId={currentProofPropertyId}
                  onComplete={() => {
                    toast.success('Proof uploaded successfully!');
                    setShowProofUpload(false);
                  }}
                  onCancel={() => setShowProofUpload(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Available Visits */}
        {isOnline && !activeVisit && (
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit' }}>
              Available Visits ({availableVisits.length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-[#E07A5F] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-[#4A626C]">Loading visits...</p>
                </div>
              </div>
            ) : availableVisits.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#E5E3D8] p-12 text-center">
                <Clock className="w-12 h-12 text-[#4A626C] mx-auto mb-3 opacity-50" />
                <p className="text-[#4A626C]">No visits available right now</p>
                <p className="text-sm text-[#4A626C] mt-2">New requests will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="bg-white rounded-xl border border-[#E5E3D8] p-6 hover:border-[#E07A5F] transition-colors"
                    data-testid={`visit-request-${visit.id}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-lg mb-1">
                          Multi-Property Visit
                        </h4>
                        <p className="text-sm text-[#4A626C]">
                          {visit.property_ids?.length || 1} properties • {visit.estimated_duration}
                        </p>
                      </div>
                      <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                        Pending
                      </span>
                    </div>

                    {/* Property List Preview */}
                    <div className="space-y-2 mb-4">
                      {visit.properties?.slice(0, 3).map((prop, idx) => (
                        <div key={prop.id} className="flex items-center gap-3 bg-[#F3F2EB] rounded-lg p-3">
                          <div className="w-8 h-8 bg-[#E07A5F] text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{prop.title}</p>
                            <p className="text-xs text-[#4A626C]">{prop.area_name}</p>
                          </div>
                        </div>
                      ))}
                      {visit.properties?.length > 3 && (
                        <p className="text-sm text-[#4A626C] text-center">
                          +{visit.properties.length - 3} more properties
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-4 py-3 border-y border-[#E5E3D8]">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-[#4A626C]" />
                        <span>{visit.scheduled_date} at {visit.scheduled_time}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#2A9D8F] font-bold">
                        <IndianRupee className="w-4 h-4" />
                        <span>{visit.total_earnings || (visit.property_ids?.length || 1) * 100}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcceptVisit(visit.id)}
                      data-testid={`accept-visit-${visit.id}`}
                      className="w-full bg-[#E07A5F] text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#d06a4f] font-bold"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Accept Visit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-[#FFF5F2] rounded-xl p-6 border border-[#E07A5F]/20">
          <h3 className="font-bold mb-3">Visit Flow (Uber Eats Style)</h3>
          <ol className="space-y-2 text-sm text-[#4A626C]">
            <li className="flex gap-2">
              <span className="font-bold text-[#E07A5F]">1.</span>
              <span>Accept visit request to see customer pickup location</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-[#E07A5F]">2.</span>
              <span>Navigate to customer and verify OTP</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-[#E07A5F]">3.</span>
              <span>Navigate to each property one by one</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-[#E07A5F]">4.</span>
              <span>Upload selfie & video proof at each property</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-[#E07A5F]">5.</span>
              <span>Complete all properties to finish the visit</span>
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
};

export default RiderDashboard;
