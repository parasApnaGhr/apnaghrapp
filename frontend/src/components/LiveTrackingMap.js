// Live Tracking Map Component
// Uses Leaflet + OpenStreetMap for real-time rider tracking

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, MapPin, Clock, Bike, Phone, User } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom rider icon
const createRiderIcon = (heading = 0, isOnline = true) => {
  return L.divIcon({
    className: 'custom-rider-marker',
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background: ${isOnline ? '#04473C' : '#6B7280'};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(${heading}deg);
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
        </svg>
      </div>
      ${isOnline ? '<div style="position: absolute; bottom: -4px; right: -4px; width: 12px; height: 12px; background: #22C55E; border-radius: 50%; border: 2px solid white;"></div>' : ''}
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Custom destination icon
const createDestinationIcon = (order = null) => {
  return L.divIcon({
    className: 'custom-destination-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: #C6A87C;
        border-radius: 50% 50% 50% 0;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 14px;">
          ${order || '📍'}
        </span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

// Component to smoothly animate marker position
const AnimatedMarker = ({ position, icon, children }) => {
  const markerRef = useRef(null);
  const previousPosition = useRef(position);

  useEffect(() => {
    if (markerRef.current && position) {
      const marker = markerRef.current;
      const startPos = previousPosition.current;
      const endPos = position;
      
      // Animate over 1 second
      const duration = 1000;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        const lat = startPos[0] + (endPos[0] - startPos[0]) * easeProgress;
        const lng = startPos[1] + (endPos[1] - startPos[1]) * easeProgress;
        
        marker.setLatLng([lat, lng]);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          previousPosition.current = position;
        }
      };

      requestAnimationFrame(animate);
    }
  }, [position]);

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      {children}
    </Marker>
  );
};

// Component to fit map bounds
const FitBounds = ({ positions }) => {
  const map = useMap();
  
  useEffect(() => {
    if (positions && positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);
  
  return null;
};

// Main Live Tracking Map Component
const LiveTrackingMap = ({
  riderLocation,
  riderName,
  riderPhone,
  destinations = [],
  routeGeometry = null,
  eta = null,
  visitStatus = null,
  onClose,
  isCustomerView = false,
  showAllRiders = false,
  allRiders = []
}) => {
  const [mapReady, setMapReady] = useState(false);
  const defaultCenter = [30.7333, 76.7794]; // Chandigarh

  // Calculate center position
  const getCenter = () => {
    if (riderLocation?.lat && riderLocation?.lng) {
      return [riderLocation.lat, riderLocation.lng];
    }
    if (destinations.length > 0) {
      return [destinations[0].lat, destinations[0].lng];
    }
    return defaultCenter;
  };

  // Get all positions for bounds
  const getAllPositions = () => {
    const positions = [];
    if (riderLocation?.lat && riderLocation?.lng) {
      positions.push([riderLocation.lat, riderLocation.lng]);
    }
    destinations.forEach(d => {
      if (d.lat && d.lng) {
        positions.push([d.lat, d.lng]);
      }
    });
    if (showAllRiders) {
      allRiders.forEach(r => {
        if (r.location?.lat && r.location?.lng) {
          positions.push([r.location.lat, r.location.lng]);
        }
      });
    }
    return positions;
  };

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden">
      {/* ETA Banner */}
      <AnimatePresence>
        {eta && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute top-4 left-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#04473C] rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-[#4A4D53]">Estimated Arrival</p>
                  <p className="text-xl font-semibold text-[#04473C]">{eta.eta_text}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#4A4D53]">Distance</p>
                <p className="text-lg font-medium">{eta.distance_km} km</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visit Status Banner */}
      <AnimatePresence>
        {visitStatus && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className={`absolute bottom-4 left-4 right-4 z-[1000] rounded-lg shadow-lg p-4 ${
              visitStatus === 'completed' ? 'bg-green-500' :
              visitStatus === 'reached' ? 'bg-[#C6A87C]' :
              visitStatus === 'on_the_way' ? 'bg-[#04473C]' :
              'bg-gray-500'
            } text-white`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  {visitStatus === 'completed' ? '✓' :
                   visitStatus === 'reached' ? '📍' :
                   visitStatus === 'on_the_way' ? '🚗' : '⏳'}
                </div>
                <div>
                  <p className="font-semibold text-lg capitalize">
                    {visitStatus.replace('_', ' ')}
                  </p>
                  {riderName && (
                    <p className="text-sm opacity-90">Rider: {riderName}</p>
                  )}
                </div>
              </div>
              {riderPhone && (
                <a
                  href={`tel:${riderPhone}`}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <MapContainer
        center={getCenter()}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route polyline */}
        {routeGeometry && (
          <Polyline
            positions={routeGeometry.coordinates?.map(c => [c[1], c[0]]) || []}
            color="#04473C"
            weight={4}
            opacity={0.8}
            dashArray="10, 10"
          />
        )}

        {/* Single rider marker */}
        {riderLocation?.lat && riderLocation?.lng && (
          <AnimatedMarker
            position={[riderLocation.lat, riderLocation.lng]}
            icon={createRiderIcon(riderLocation.heading, true)}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{riderName || 'Rider'}</p>
                {riderLocation.speed && (
                  <p className="text-sm text-gray-500">{Math.round(riderLocation.speed)} km/h</p>
                )}
              </div>
            </Popup>
          </AnimatedMarker>
        )}

        {/* All riders markers (for admin view) */}
        {showAllRiders && allRiders.map(rider => (
          rider.location?.lat && rider.location?.lng && (
            <Marker
              key={rider.rider_id}
              position={[rider.location.lat, rider.location.lng]}
              icon={createRiderIcon(rider.location.heading, rider.status === 'online')}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">{rider.rider_name || rider.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{rider.status}</p>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Destination markers */}
        {destinations.map((dest, index) => (
          <Marker
            key={dest.id || index}
            position={[dest.lat, dest.lng]}
            icon={createDestinationIcon(dest.order || index + 1)}
          >
            <Popup>
              <div>
                <p className="font-semibold">{dest.title || `Visit ${index + 1}`}</p>
                {dest.address && <p className="text-sm text-gray-500">{dest.address}</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Fit bounds to all markers */}
        {mapReady && getAllPositions().length > 1 && (
          <FitBounds positions={getAllPositions()} />
        )}
      </MapContainer>

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[1000] w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default LiveTrackingMap;
