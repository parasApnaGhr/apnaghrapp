import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  MapPin, User, Navigation, Clock, Phone, Eye,
  Activity, Circle
} from 'lucide-react';
import { toast } from 'sonner';

const LiveTrackingPanel = () => {
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState(null);
  const [trackingDetails, setTrackingDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRiders();
    const interval = setInterval(loadRiders, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadRiders = async () => {
    try {
      const response = await api.get('/admin/riders/live-locations');
      setRiders(response.data);
    } catch (error) {
      console.error('Failed to load riders');
    } finally {
      setLoading(false);
    }
  };

  const loadTrackingDetails = async (visitId) => {
    try {
      const response = await api.get(`/admin/visits/${visitId}/tracking`);
      setTrackingDetails(response.data);
    } catch (error) {
      toast.error('Failed to load tracking details');
    }
  };

  const openGoogleMaps = (lat, lng) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#E07A5F] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>
          Live Tracking
          <span className="ml-2 text-sm font-normal text-[#4A626C]">
            ({riders.length} online)
          </span>
        </h2>
        <div className="flex items-center gap-2 text-sm text-[#4A626C]">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Auto-refreshing every 10s
        </div>
      </div>

      {riders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#E5E3D8]">
          <Activity className="w-12 h-12 text-[#4A626C] mx-auto mb-3 opacity-50" />
          <p className="text-[#4A626C]">No riders currently online</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {riders.map(rider => {
            const hasLocation = rider.current_lat && rider.current_lng;
            const hasActiveWork = rider.active_visit || rider.active_task;
            
            return (
              <div 
                key={rider.id} 
                className={`bg-white rounded-xl border-2 p-4 transition ${
                  hasActiveWork ? 'border-[#E07A5F]' : 'border-[#E5E3D8]'
                }`}
              >
                {/* Rider Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-[#E07A5F] text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {rider.name?.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">{rider.name}</p>
                    <p className="text-sm text-[#4A626C]">{rider.phone}</p>
                  </div>
                  {hasActiveWork && (
                    <span className="px-2 py-1 bg-[#E07A5F] text-white text-xs rounded-full">
                      Active
                    </span>
                  )}
                </div>

                {/* Location */}
                <div className="mb-4">
                  {hasLocation ? (
                    <button
                      onClick={() => openGoogleMaps(rider.current_lat, rider.current_lng)}
                      className="w-full bg-[#F3F2EB] rounded-lg p-3 flex items-center gap-2 hover:bg-[#E5E3D8] transition text-left"
                      data-testid={`view-location-${rider.id}`}
                    >
                      <MapPin className="w-5 h-5 text-[#E07A5F]" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">View on Map</p>
                        <p className="text-xs text-[#4A626C]">
                          {rider.current_lat?.toFixed(4)}, {rider.current_lng?.toFixed(4)}
                        </p>
                      </div>
                      <Navigation className="w-4 h-4 text-[#4A626C]" />
                    </button>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-3 text-center text-sm text-[#4A626C]">
                      Location not available
                    </div>
                  )}
                </div>

                {/* Last Update */}
                {rider.last_location_update && (
                  <div className="flex items-center gap-2 text-xs text-[#4A626C] mb-3">
                    <Clock className="w-3 h-3" />
                    Last update: {new Date(rider.last_location_update).toLocaleTimeString()}
                  </div>
                )}

                {/* Active Visit */}
                {rider.active_visit && (
                  <div className="bg-[#FFF5F2] rounded-lg p-3 mb-3">
                    <p className="text-xs text-[#E07A5F] font-medium mb-1">Active Visit</p>
                    <p className="text-sm font-medium">
                      {rider.active_visit.property_ids?.length || 1} properties
                    </p>
                    <p className="text-xs text-[#4A626C]">
                      Status: {rider.active_visit.current_step?.replace(/_/g, ' ')}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedRider(rider);
                        loadTrackingDetails(rider.active_visit.id);
                      }}
                      className="mt-2 text-xs text-[#E07A5F] hover:underline flex items-center gap-1"
                      data-testid={`track-visit-${rider.id}`}
                    >
                      <Eye className="w-3 h-3" />
                      View Details
                    </button>
                  </div>
                )}

                {/* Active ToLet Task */}
                {rider.active_task && (
                  <div className="bg-[#F0FDF9] rounded-lg p-3">
                    <p className="text-xs text-[#2A9D8F] font-medium mb-1">Active ToLet Task</p>
                    <p className="text-sm font-medium">{rider.active_task.title}</p>
                    <p className="text-xs text-[#4A626C]">{rider.active_task.location}</p>
                  </div>
                )}

                {/* Call Button */}
                <a
                  href={`tel:${rider.phone}`}
                  className="mt-3 w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Call Rider
                </a>
              </div>
            );
          })}
        </div>
      )}

      {/* Tracking Details Modal */}
      {trackingDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Live Tracking</h3>
                <button 
                  onClick={() => { setTrackingDetails(null); setSelectedRider(null); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Rider Location */}
              <div className="bg-[#264653] text-white rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold">{trackingDetails.rider?.name}</p>
                    <p className="text-sm opacity-80">{trackingDetails.rider?.phone}</p>
                  </div>
                </div>
                
                {trackingDetails.rider_location?.lat && (
                  <button
                    onClick={() => openGoogleMaps(trackingDetails.rider_location.lat, trackingDetails.rider_location.lng)}
                    className="w-full bg-white/20 rounded-lg p-3 flex items-center gap-2 hover:bg-white/30 transition"
                  >
                    <MapPin className="w-5 h-5" />
                    <span>Open in Google Maps</span>
                  </button>
                )}
              </div>

              {/* Visit Progress */}
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Visit Progress</p>
                <div className="bg-[#F3F2EB] rounded-lg p-3">
                  <p className="text-sm">
                    <span className="font-medium">Status:</span>{' '}
                    {trackingDetails.visit?.current_step?.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="font-medium">Properties:</span>{' '}
                    {trackingDetails.visit?.properties_completed?.length || 0} / {trackingDetails.properties?.length || 0} completed
                  </p>
                </div>
              </div>

              {/* Route */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Route</p>
                
                {/* Customer Pickup */}
                <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Customer Pickup</p>
                    <p className="text-xs text-[#4A626C]">{trackingDetails.visit?.pickup_location}</p>
                  </div>
                  {trackingDetails.visit?.current_step === 'at_customer' && (
                    <Circle className="w-3 h-3 text-blue-500 fill-blue-500" />
                  )}
                </div>

                {/* Properties */}
                {trackingDetails.properties?.map((prop, idx) => {
                  const isCompleted = trackingDetails.visit?.properties_completed?.includes(prop.id);
                  const isCurrent = trackingDetails.visit?.current_property_index === idx;
                  
                  return (
                    <div 
                      key={prop.id} 
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        isCompleted ? 'bg-green-50' : isCurrent ? 'bg-amber-50' : 'bg-[#F3F2EB]'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-amber-500 text-white' : 'bg-[#E07A5F] text-white'
                      }`}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{prop.title}</p>
                        <p className="text-xs text-[#4A626C]">{prop.area_name}</p>
                      </div>
                      {isCurrent && !isCompleted && (
                        <Circle className="w-3 h-3 text-amber-500 fill-amber-500" />
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => { setTrackingDetails(null); setSelectedRider(null); }}
                className="w-full mt-6 btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTrackingPanel;
