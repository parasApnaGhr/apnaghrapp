// @ts-nocheck
// Rider Location Tracker Component
// Handles GPS tracking and sends updates via WebSocket + Database

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Navigation, MapPin, Clock, Battery, Signal, 
  Play, Pause, CheckCircle, AlertCircle, Loader,
  Phone, ChevronRight, Database
} from 'lucide-react';
import { toast } from 'sonner';
import { useTrackingWebSocket } from '../hooks/useTrackingWebSocket';
import LiveTrackingMap from './LiveTrackingMap';
import api from '../utils/api';

const LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds
const REACH_RADIUS_METERS = 100;

const RiderLocationTracker = ({ 
  riderId, 
  riderName, 
  assignedVisits = [],
  onVisitStatusChange 
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [currentVisit, setCurrentVisit] = useState(null);
  const [visitStatuses, setVisitStatuses] = useState({});
  const [showMap, setShowMap] = useState(false);
  const [eta, setEta] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [trackingSessionId, setTrackingSessionId] = useState(null);
  const [dbSyncStatus, setDbSyncStatus] = useState('idle'); // idle, syncing, synced, error
  
  const watchIdRef = useRef(null);
  const updateIntervalRef = useRef(null);

  const { 
    isConnected, 
    sendLocation, 
    updateStatus, 
    updateVisitStatus 
  } = useTrackingWebSocket('rider', riderId, riderName);

  // Use ref to store current location for interval callback
  const currentLocationRef = useRef(null);
  const trackingSessionIdRef = useRef(null);

  // Update ref when location changes
  useEffect(() => {
    currentLocationRef.current = currentLocation;
  }, [currentLocation]);

  useEffect(() => {
    trackingSessionIdRef.current = trackingSessionId;
  }, [trackingSessionId]);

  // Start GPS tracking with database session
  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsTracking(true);
    setLocationError(null);

    // Start database tracking session
    let sessionId = null;
    try {
      const sessionResponse = await api.post(`/tracking/session/start?rider_id=${riderId}`, {
        visit_id: currentVisit?.id || null
      });
      sessionId = sessionResponse.data.session_id;
      setTrackingSessionId(sessionId);
      trackingSessionIdRef.current = sessionId;
      setDbSyncStatus('synced');
      toast.success('GPS tracking started');
    } catch (error) {
      console.error('Failed to start DB session:', error);
      setDbSyncStatus('error');
    }

    // High accuracy watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, heading, accuracy } = position.coords;
        const newLocation = {
          lat: latitude,
          lng: longitude,
          speed: speed ? speed * 3.6 : null,
          heading: heading,
          accuracy: accuracy,
          timestamp: new Date().toISOString()
        };
        setCurrentLocation(newLocation);
        currentLocationRef.current = newLocation;
        setLocationError(null);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError(error.message);
        // Don't stop tracking on timeout, just log the error
        if (error.code !== error.TIMEOUT) {
          toast.error(`GPS Error: ${error.message}`);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 30000
      }
    );

    // Send location updates at interval (using refs to avoid stale closures)
    updateIntervalRef.current = setInterval(async () => {
      const loc = currentLocationRef.current;
      const sessId = trackingSessionIdRef.current;
      
      if (loc) {
        // Send via WebSocket (real-time)
        sendLocation(loc.lat, loc.lng, loc.speed, loc.heading);
        
        // Also save to database (persistent)
        if (sessId) {
          try {
            await api.post(`/tracking/session/${sessId}/location?rider_id=${riderId}`, {
              lat: loc.lat,
              lng: loc.lng,
              speed: loc.speed,
              heading: loc.heading,
              accuracy: loc.accuracy
            });
            setDbSyncStatus('synced');
          } catch (error) {
            console.error('DB sync error:', error);
            setDbSyncStatus('error');
          }
        }
      }
    }, LOCATION_UPDATE_INTERVAL);

    updateStatus('on_duty');
  }, [sendLocation, updateStatus, riderId, currentVisit]);

  // Stop GPS tracking and save session
  const stopTracking = useCallback(async () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    
    // Stop database session
    if (trackingSessionId) {
      try {
        const result = await api.post(`/tracking/session/${trackingSessionId}/stop?rider_id=${riderId}`);
        toast.success(`Tracking stopped. Distance: ${result.data.total_distance_km} km, Duration: ${Math.round(result.data.duration_minutes)} min`);
        setTrackingSessionId(null);
      } catch (error) {
        console.error('Failed to stop DB session:', error);
      }
    }
    
    setIsTracking(false);
    setDbSyncStatus('idle');
    updateStatus('online');
  }, [updateStatus, trackingSessionId, riderId]);

  // Optimize route when visits are assigned
  const optimizeRoute = useCallback(async () => {
    if (!currentLocation || assignedVisits.length === 0) return;

    try {
      const response = await api.post('/tracking/optimize-route', {
        visits: assignedVisits.map(v => ({
          id: v.id,
          lat: v.property?.lat || v.lat,
          lng: v.property?.lng || v.lng,
          title: v.property?.title || v.title
        })),
        start_lat: currentLocation.lat,
        start_lng: currentLocation.lng
      });

      setOptimizedRoute(response.data.visits);
      toast.success(`Route optimized! ${response.data.total_distance_km} km, ~${Math.round(response.data.total_time_minutes)} min`);
    } catch (error) {
      console.error('Route optimization error:', error);
    }
  }, [currentLocation, assignedVisits]);

  // Calculate ETA to current visit
  const calculateETA = useCallback(async () => {
    if (!currentLocation || !currentVisit) return;

    const destLat = currentVisit.property?.lat || currentVisit.lat;
    const destLng = currentVisit.property?.lng || currentVisit.lng;

    if (!destLat || !destLng) return;

    try {
      const response = await api.post('/tracking/calculate-eta', {
        origin_lat: currentLocation.lat,
        origin_lng: currentLocation.lng,
        dest_lat: destLat,
        dest_lng: destLng,
        current_speed: currentLocation.speed
      });
      setEta(response.data);
    } catch (error) {
      console.error('ETA calculation error:', error);
    }
  }, [currentLocation, currentVisit]);

  // Check if rider has reached destination
  const handleVisitStatusUpdate = useCallback((visitId, status) => {
    setVisitStatuses(prev => ({ ...prev, [visitId]: status }));
    updateVisitStatus(visitId, status);
    
    if (onVisitStatusChange) {
      onVisitStatusChange(visitId, status);
    }

    if (status === 'on_the_way') {
      setCurrentVisit(assignedVisits.find(v => v.id === visitId));
    }
  }, [assignedVisits, onVisitStatusChange, updateVisitStatus]);

  const checkReached = useCallback(async () => {
    if (!currentLocation || !currentVisit) return;

    const destLat = currentVisit.property?.lat || currentVisit.lat;
    const destLng = currentVisit.property?.lng || currentVisit.lng;

    if (!destLat || !destLng) return;

    try {
      const response = await api.post('/tracking/check-reached', {
        rider_lat: currentLocation.lat,
        rider_lng: currentLocation.lng,
        dest_lat: destLat,
        dest_lng: destLng,
        radius_meters: REACH_RADIUS_METERS
      });

      if (response.data.reached && visitStatuses[currentVisit.id] !== 'reached') {
        // Auto-update status to reached
        handleVisitStatusUpdate(currentVisit.id, 'reached');
        toast.success('You have reached the destination!');
      }
    } catch (error) {
      console.error('Reach check error:', error);
    }
  }, [currentLocation, currentVisit, visitStatuses, handleVisitStatusUpdate]);

  // Effect to calculate ETA and check reach periodically
  useEffect(() => {
    if (isTracking && currentVisit) {
      calculateETA();
      checkReached();
    }
  }, [currentLocation, isTracking, currentVisit, calculateETA, checkReached]);

  // Cleanup on unmount ONLY - don't stop tracking on re-renders
  useEffect(() => {
    // Only cleanup refs when component is truly unmounting
    return () => {
      // Clear intervals but don't call stopTracking API
      // This prevents tracking from stopping when component re-renders
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, []); // Empty deps - only on unmount

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'reached': return 'bg-[#C6A87C]';
      case 'on_the_way': return 'bg-[#04473C]';
      case 'accepted': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-[#E5E1DB]">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm text-[#4A4D53]">
            {isConnected ? 'Connected to server' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* Database Sync Status */}
          {isTracking && (
            <div className="flex items-center gap-2 text-sm">
              <Database className={`w-4 h-4 ${
                dbSyncStatus === 'synced' ? 'text-green-500' : 
                dbSyncStatus === 'syncing' ? 'text-yellow-500 animate-pulse' : 
                dbSyncStatus === 'error' ? 'text-red-500' : 'text-gray-400'
              }`} />
              <span className={`${
                dbSyncStatus === 'synced' ? 'text-green-600' : 
                dbSyncStatus === 'error' ? 'text-red-600' : 'text-[#4A4D53]'
              }`}>
                {dbSyncStatus === 'synced' ? 'DB Synced' : 
                 dbSyncStatus === 'syncing' ? 'Syncing...' : 
                 dbSyncStatus === 'error' ? 'Sync Error' : ''}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-[#4A4D53]">
            <Signal className="w-4 h-4" />
            <span>GPS {currentLocation ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </div>

      {/* Tracking Control */}
      <div className="p-4 bg-white rounded-lg border border-[#E5E1DB]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-[#04473C]">Location Tracking</h3>
            <p className="text-sm text-[#4A4D53]">
              {isTracking ? (
                <>
                  Sharing your location
                  {trackingSessionId && (
                    <span className="ml-2 text-xs text-green-600">(Session: {trackingSessionId.slice(-8)})</span>
                  )}
                </>
              ) : 'Not tracking'}
            </p>
          </div>
          <button
            onClick={isTracking ? stopTracking : startTracking}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              isTracking 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-[#04473C] text-white hover:bg-[#033830]'
            }`}
            data-testid="tracking-toggle-button"
          >
            {isTracking ? (
              <>
                <Pause className="w-4 h-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start
              </>
            )}
          </button>
        </div>

        {locationError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{locationError}</span>
          </div>
        )}

        {currentLocation && (
          <div className="mt-3 p-3 bg-[#F5F3F0] rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-[#4A4D53]">
                <MapPin className="w-4 h-4" />
                <span>{currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</span>
              </div>
              {currentLocation.speed && (
                <span className="text-sm font-medium text-[#04473C]">
                  {Math.round(currentLocation.speed)} km/h
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Assigned Visits */}
      {assignedVisits.length > 0 && (
        <div className="bg-white rounded-lg border border-[#E5E1DB]">
          <div className="p-4 border-b border-[#E5E1DB] flex items-center justify-between">
            <h3 className="font-medium text-[#04473C]">
              Assigned Visits ({assignedVisits.length})
            </h3>
            {currentLocation && (
              <button
                onClick={optimizeRoute}
                className="text-sm text-[#04473C] hover:underline flex items-center gap-1"
              >
                <Navigation className="w-4 h-4" />
                Optimize Route
              </button>
            )}
          </div>

          <div className="divide-y divide-[#E5E1DB]">
            {(optimizedRoute.length > 0 ? optimizedRoute : assignedVisits).map((visit, index) => {
              const status = visitStatuses[visit.id] || 'assigned';
              const isCurrentVisit = currentVisit?.id === visit.id;

              return (
                <motion.div
                  key={visit.id}
                  layout
                  className={`p-4 ${isCurrentVisit ? 'bg-[#F5F3F0]' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${getStatusColor(status)}`}>
                      {visit.order || index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#04473C]">
                        {visit.property?.title || visit.title || `Visit ${index + 1}`}
                      </p>
                      <p className="text-sm text-[#4A4D53]">
                        {visit.property?.address || visit.address}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(status)} text-white capitalize`}>
                          {status.replace('_', ' ')}
                        </span>
                        {isCurrentVisit && eta && (
                          <span className="text-xs text-[#4A4D53] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            ETA: {eta.eta_text}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      {status === 'assigned' && (
                        <button
                          onClick={() => handleVisitStatusUpdate(visit.id, 'accepted')}
                          className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Accept
                        </button>
                      )}
                      {status === 'accepted' && (
                        <button
                          onClick={() => handleVisitStatusUpdate(visit.id, 'on_the_way')}
                          className="text-xs px-3 py-1 bg-[#04473C] text-white rounded hover:bg-[#033830]"
                        >
                          Start
                        </button>
                      )}
                      {status === 'on_the_way' && (
                        <button
                          onClick={() => handleVisitStatusUpdate(visit.id, 'reached')}
                          className="text-xs px-3 py-1 bg-[#C6A87C] text-white rounded hover:bg-[#B89A6E]"
                        >
                          Reached
                        </button>
                      )}
                      {status === 'reached' && (
                        <button
                          onClick={() => handleVisitStatusUpdate(visit.id, 'completed')}
                          className="text-xs px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* View Map Button */}
      <button
        onClick={() => setShowMap(true)}
        className="w-full p-4 bg-[#04473C] text-white rounded-lg flex items-center justify-center gap-2 hover:bg-[#033830] transition-colors"
      >
        <Navigation className="w-5 h-5" />
        View Live Map
      </button>

      {/* Map Modal */}
      <AnimatePresence>
        {showMap && (
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
                riderLocation={currentLocation}
                riderName={riderName}
                destinations={optimizedRoute.length > 0 ? optimizedRoute : assignedVisits}
                eta={eta}
                visitStatus={currentVisit ? visitStatuses[currentVisit.id] : null}
                onClose={() => setShowMap(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RiderLocationTracker;
