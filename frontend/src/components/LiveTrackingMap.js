// High-Performance Live Tracking Map Component
// Supports 5000+ markers with clustering and smooth interpolation

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, MapPin, Clock, Phone } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Cache for rider icons
const iconCache = new Map();

// Create rider icon with rotation
const createRiderIcon = (heading = 0, isOnline = true, status = 'online') => {
  const cacheKey = `${Math.round(heading / 10) * 10}-${isOnline}-${status}`;
  
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey);
  }
  
  const color = status === 'on_duty' ? '#04473C' : isOnline ? '#3B82F6' : '#6B7280';
  const pulseColor = status === 'on_duty' ? '#22C55E' : '#3B82F6';
  
  const icon = L.divIcon({
    className: 'rider-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: ${color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(${heading}deg);
        transition: transform 0.3s ease-out;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
        </svg>
      </div>
      ${isOnline ? `<div style="
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 10px;
        height: 10px;
        background: ${pulseColor};
        border-radius: 50%;
        border: 2px solid white;
        animation: pulse 2s infinite;
      "></div>` : ''}
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
  
  iconCache.set(cacheKey, icon);
  return icon;
};

// Destination marker icon
const createDestinationIcon = (order = null) => {
  return L.divIcon({
    className: 'destination-marker',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background: #C6A87C;
        border-radius: 50% 50% 50% 0;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 12px;">
          ${order || '📍'}
        </span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
};

// Cluster icon creator
const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  let size = 'small';
  let radius = 30;
  
  if (count > 100) {
    size = 'large';
    radius = 50;
  } else if (count > 50) {
    size = 'medium';
    radius = 40;
  }
  
  return L.divIcon({
    html: `<div style="
      width: ${radius}px;
      height: ${radius}px;
      background: linear-gradient(135deg, #04473C 0%, #065446 100%);
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: ${count > 99 ? '11px' : '13px'};
    ">${count > 999 ? '999+' : count}</div>`,
    className: `marker-cluster marker-cluster-${size}`,
    iconSize: [radius, radius],
  });
};

// Animated marker with smooth transitions
const AnimatedMarker = React.memo(({ position, icon, riderId, children }) => {
  const markerRef = useRef(null);
  const animationRef = useRef(null);
  const prevPosition = useRef(position);
  
  useEffect(() => {
    if (!markerRef.current || !position) return;
    
    const marker = markerRef.current;
    const start = prevPosition.current;
    const end = position;
    
    // Cancel previous animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    const duration = 1500; // 1.5 second animation
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const lat = start[0] + (end[0] - start[0]) * eased;
      const lng = start[1] + (end[1] - start[1]) * eased;
      
      marker.setLatLng([lat, lng]);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        prevPosition.current = position;
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [position]);
  
  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      {children}
    </Marker>
  );
});

// Map bounds updater
const FitBounds = ({ positions }) => {
  const map = useMap();
  
  useEffect(() => {
    if (positions?.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [positions, map]);
  
  return null;
};

// Main component
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
  allRiders = [],
  enableClustering = true
}) => {
  const [mapReady, setMapReady] = useState(false);
  const defaultCenter = [30.7333, 76.7794]; // Chandigarh

  // Memoize center calculation
  const center = useMemo(() => {
    if (riderLocation?.lat && riderLocation?.lng) {
      return [riderLocation.lat, riderLocation.lng];
    }
    if (destinations.length > 0) {
      return [destinations[0].lat, destinations[0].lng];
    }
    return defaultCenter;
  }, [riderLocation, destinations]);

  // Memoize positions for bounds
  const allPositions = useMemo(() => {
    const positions = [];
    if (riderLocation?.lat && riderLocation?.lng) {
      positions.push([riderLocation.lat, riderLocation.lng]);
    }
    destinations.forEach(d => {
      if (d.lat && d.lng) positions.push([d.lat, d.lng]);
    });
    if (showAllRiders) {
      allRiders.forEach(r => {
        if (r.location?.lat && r.location?.lng) {
          positions.push([r.location.lat, r.location.lng]);
        }
      });
    }
    return positions;
  }, [riderLocation, destinations, showAllRiders, allRiders]);

  // Memoize rider markers for performance
  const riderMarkers = useMemo(() => {
    if (!showAllRiders) return null;
    
    return allRiders
      .filter(r => r.location?.lat && r.location?.lng)
      .map(rider => (
        <AnimatedMarker
          key={rider.rider_id}
          riderId={rider.rider_id}
          position={[rider.location.lat, rider.location.lng]}
          icon={createRiderIcon(
            rider.location.heading,
            rider.status !== 'offline',
            rider.status
          )}
        >
          <Popup>
            <div className="text-center min-w-[120px]">
              <p className="font-semibold">{rider.rider_name || rider.name}</p>
              <p className="text-sm text-gray-500 capitalize">{rider.status}</p>
              {rider.location.speed && (
                <p className="text-xs text-gray-400">{Math.round(rider.location.speed)} km/h</p>
              )}
            </div>
          </Popup>
        </AnimatedMarker>
      ));
  }, [showAllRiders, allRiders]);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden">
      {/* Add pulse animation CSS */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      
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
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg">
                  {visitStatus === 'completed' ? '✓' :
                   visitStatus === 'reached' ? '📍' :
                   visitStatus === 'on_the_way' ? '🚗' : '⏳'}
                </div>
                <div>
                  <p className="font-semibold text-lg capitalize">
                    {visitStatus.replace('_', ' ')}
                  </p>
                  {riderName && <p className="text-sm opacity-90">Rider: {riderName}</p>}
                </div>
              </div>
              {riderPhone && (
                <a
                  href={`tel:${riderPhone}`}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
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
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route polyline */}
        {routeGeometry?.coordinates && (
          <Polyline
            positions={routeGeometry.coordinates.map(c => [c[1], c[0]])}
            color="#04473C"
            weight={4}
            opacity={0.8}
            dashArray="10, 10"
          />
        )}

        {/* Single rider marker (for customer view) */}
        {riderLocation?.lat && riderLocation?.lng && !showAllRiders && (
          <AnimatedMarker
            riderId="single"
            position={[riderLocation.lat, riderLocation.lng]}
            icon={createRiderIcon(riderLocation.heading, true, 'on_duty')}
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

        {/* All riders with clustering (for admin view) */}
        {showAllRiders && enableClustering && allRiders.length > 50 ? (
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
            maxClusterRadius={60}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
          >
            {riderMarkers}
          </MarkerClusterGroup>
        ) : (
          riderMarkers
        )}

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

        {/* Auto-fit bounds */}
        {mapReady && allPositions.length > 1 && (
          <FitBounds positions={allPositions} />
        )}
      </MapContainer>

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[1000] w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100"
        >
          ×
        </button>
      )}

      {/* Performance indicator (admin view) */}
      {showAllRiders && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-black/70 text-white text-xs px-2 py-1 rounded">
          {allRiders.filter(r => r.location?.lat).length} riders visible
        </div>
      )}
    </div>
  );
};

export default React.memo(LiveTrackingMap);
