// Customer Visit Tracking Component
// Allows customers to track their rider in real-time

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, Phone, User, Navigation, 
  Bell, X, CheckCircle, Loader, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useTrackingWebSocket } from '../hooks/useTrackingWebSocket';
import LiveTrackingMap from './LiveTrackingMap';
import api from '../utils/api';

const CustomerVisitTracker = ({ 
  customerId, 
  visitId, 
  visitDetails,
  onClose 
}) => {
  const [riderInfo, setRiderInfo] = useState(null);
  const [eta, setEta] = useState(null);
  const [visitStatus, setVisitStatus] = useState(visitDetails?.status || 'pending');
  const [showFullMap, setShowFullMap] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const {
    isConnected,
    riderLocations,
    visitStatuses,
    trackVisit,
    stopTrackingVisit
  } = useTrackingWebSocket('customer', customerId);

  // Start tracking when component mounts
  useEffect(() => {
    if (isConnected && visitId) {
      trackVisit(visitId);
    }
    return () => {
      if (visitId) {
        stopTrackingVisit(visitId);
      }
    };
  }, [isConnected, visitId, trackVisit, stopTrackingVisit]);

  // Get rider location for this visit
  const riderLocation = Object.values(riderLocations)[0]; // First rider tracking this visit

  // Update visit status from WebSocket
  useEffect(() => {
    if (visitStatuses[visitId]) {
      const newStatus = visitStatuses[visitId].status;
      if (newStatus !== visitStatus) {
        setVisitStatus(newStatus);
        
        // Show notification
        const message = getStatusMessage(newStatus);
        if (message) {
          addNotification(message);
          toast.success(message);
        }
      }
    }
  }, [visitStatuses, visitId, visitStatus]);

  // Calculate ETA when rider location updates
  useEffect(() => {
    const calculateETA = async () => {
      if (!riderLocation?.location || !visitDetails?.property) return;

      try {
        const response = await api.post('/tracking/calculate-eta', {
          origin_lat: riderLocation.location.lat,
          origin_lng: riderLocation.location.lng,
          dest_lat: visitDetails.property.lat,
          dest_lng: visitDetails.property.lng,
          current_speed: riderLocation.location.speed
        });
        setEta(response.data);

        // Notify when rider is close
        if (response.data.eta_minutes <= 5 && visitStatus === 'on_the_way') {
          addNotification('Rider arriving in 5 minutes!');
        }
      } catch (error) {
        console.error('ETA calculation error:', error);
      }
    };

    calculateETA();
  }, [riderLocation, visitDetails, visitStatus]);

  const getStatusMessage = (status) => {
    switch (status) {
      case 'accepted': return 'Rider has accepted your visit request';
      case 'on_the_way': return 'Rider is on the way to the property';
      case 'reached': return 'Rider has reached the property';
      case 'completed': return 'Visit has been completed';
      default: return null;
    }
  };

  const addNotification = (message) => {
    const notification = {
      id: Date.now(),
      message,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-500 bg-green-50';
      case 'reached': return 'text-[#C6A87C] bg-[#C6A87C]/10';
      case 'on_the_way': return 'text-[#04473C] bg-[#04473C]/10';
      case 'accepted': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      case 'reached': return <MapPin className="w-5 h-5" />;
      case 'on_the_way': return <Navigation className="w-5 h-5" />;
      case 'accepted': return <User className="w-5 h-5" />;
      default: return <Loader className="w-5 h-5 animate-spin" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[#E5E1DB] overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-[#04473C] text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium">Track Your Visit</h3>
            <p className="text-sm opacity-80">
              {isConnected ? 'Live tracking active' : 'Connecting...'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mini Map Preview */}
      <div className="h-48 relative">
        <LiveTrackingMap
          riderLocation={riderLocation?.location}
          riderName={riderLocation?.rider_name}
          destinations={visitDetails?.property ? [{
            id: visitDetails.property.id,
            lat: visitDetails.property.lat,
            lng: visitDetails.property.lng,
            title: visitDetails.property.title
          }] : []}
          eta={eta}
          visitStatus={visitStatus}
        />
        <button
          onClick={() => setShowFullMap(true)}
          className="absolute bottom-4 right-4 px-3 py-2 bg-white rounded-lg shadow-lg text-sm font-medium text-[#04473C] hover:bg-[#F5F3F0] transition-colors flex items-center gap-2"
        >
          Expand Map
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Status Timeline */}
      <div className="p-4 border-b border-[#E5E1DB]">
        <h4 className="text-sm font-medium text-[#4A4D53] mb-3">Visit Status</h4>
        <div className="flex items-center justify-between">
          {['pending', 'accepted', 'on_the_way', 'reached', 'completed'].map((status, index) => {
            const isActive = ['pending', 'accepted', 'on_the_way', 'reached', 'completed'].indexOf(visitStatus) >= index;
            const isCurrent = visitStatus === status;
            
            return (
              <React.Fragment key={status}>
                <div className={`flex flex-col items-center ${isActive ? 'text-[#04473C]' : 'text-gray-300'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCurrent ? 'bg-[#04473C] text-white' : isActive ? 'bg-[#04473C]/20' : 'bg-gray-100'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-xs mt-1 capitalize hidden sm:block">
                    {status.replace('_', ' ')}
                  </span>
                </div>
                {index < 4 && (
                  <div className={`flex-1 h-0.5 mx-1 ${
                    ['pending', 'accepted', 'on_the_way', 'reached', 'completed'].indexOf(visitStatus) > index
                      ? 'bg-[#04473C]'
                      : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Current Status Card */}
      <div className={`p-4 ${getStatusColor(visitStatus)}`}>
        <div className="flex items-center gap-3">
          {getStatusIcon(visitStatus)}
          <div>
            <p className="font-medium capitalize">{visitStatus.replace('_', ' ')}</p>
            {eta && visitStatus === 'on_the_way' && (
              <p className="text-sm">
                Arriving in approximately {eta.eta_text} ({eta.distance_km} km away)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Rider Info */}
      {riderLocation && (
        <div className="p-4 border-t border-[#E5E1DB]">
          <h4 className="text-sm font-medium text-[#4A4D53] mb-3">Your Rider</h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#04473C] rounded-full flex items-center justify-center text-white font-medium">
                {riderLocation.rider_name?.[0] || 'R'}
              </div>
              <div>
                <p className="font-medium text-[#04473C]">{riderLocation.rider_name || 'Rider'}</p>
                <p className="text-sm text-[#4A4D53]">Field Agent</p>
              </div>
            </div>
            {riderInfo?.phone && (
              <a
                href={`tel:${riderInfo.phone}`}
                className="w-10 h-10 bg-[#04473C] rounded-full flex items-center justify-center text-white hover:bg-[#033830] transition-colors"
              >
                <Phone className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Property Info */}
      {visitDetails?.property && (
        <div className="p-4 border-t border-[#E5E1DB]">
          <h4 className="text-sm font-medium text-[#4A4D53] mb-3">Property</h4>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#C6A87C] mt-0.5" />
            <div>
              <p className="font-medium text-[#04473C]">{visitDetails.property.title}</p>
              <p className="text-sm text-[#4A4D53]">{visitDetails.property.address}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="p-4 border-t border-[#E5E1DB]">
          <h4 className="text-sm font-medium text-[#4A4D53] mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Recent Updates
          </h4>
          <div className="space-y-2">
            {notifications.slice(0, 3).map(notification => (
              <div key={notification.id} className="text-sm p-2 bg-[#F5F3F0] rounded">
                {notification.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Map Modal */}
      <AnimatePresence>
        {showFullMap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-4xl h-[80vh] bg-white rounded-lg overflow-hidden"
            >
              <LiveTrackingMap
                riderLocation={riderLocation?.location}
                riderName={riderLocation?.rider_name}
                riderPhone={riderInfo?.phone}
                destinations={visitDetails?.property ? [{
                  id: visitDetails.property.id,
                  lat: visitDetails.property.lat,
                  lng: visitDetails.property.lng,
                  title: visitDetails.property.title,
                  address: visitDetails.property.address
                }] : []}
                eta={eta}
                visitStatus={visitStatus}
                onClose={() => setShowFullMap(false)}
                isCustomerView={true}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerVisitTracker;
