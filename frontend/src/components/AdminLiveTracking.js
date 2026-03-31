// Admin Live Tracking Dashboard
// Shows all riders on map with real-time location updates

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Navigation, Users, MapPin, Clock, 
  Activity, Filter, RefreshCw, Eye,
  Phone, ChevronRight, Bike
} from 'lucide-react';
import { useTrackingWebSocket } from '../hooks/useTrackingWebSocket';
import LiveTrackingMap from './LiveTrackingMap';
import api from '../utils/api';

const AdminLiveTracking = () => {
  const [selectedRider, setSelectedRider] = useState(null);
  const [filter, setFilter] = useState('all'); // all, online, on_duty
  const [showMap, setShowMap] = useState(true);
  const [riderDetails, setRiderDetails] = useState({});

  const {
    isConnected,
    riderLocations,
    lastMessage
  } = useTrackingWebSocket('admin', 'admin');

  // Get riders list from WebSocket data
  const riders = Object.values(riderLocations);

  // Filter riders
  const filteredRiders = riders.filter(rider => {
    if (filter === 'all') return true;
    if (filter === 'online') return rider.status !== 'offline';
    if (filter === 'on_duty') return rider.status === 'on_duty';
    return true;
  });

  // Fetch additional rider details
  const fetchRiderDetails = async (riderId) => {
    try {
      const response = await api.get(`/tracking/rider/${riderId}/location`);
      setRiderDetails(prev => ({
        ...prev,
        [riderId]: response.data
      }));
    } catch (error) {
      console.error('Error fetching rider details:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'on_duty':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">On Duty</span>;
      case 'online':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Online</span>;
      case 'break':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">Break</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">Offline</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#04473C]" style={{ fontFamily: 'Playfair Display, serif' }}>
            Live Tracking
          </h2>
          <p className="text-[#4A4D53]">Real-time rider locations and status</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>

          {/* Toggle Map */}
          <button
            onClick={() => setShowMap(!showMap)}
            className={`p-2 rounded-lg border transition-colors ${
              showMap ? 'bg-[#04473C] text-white border-[#04473C]' : 'bg-white text-[#04473C] border-[#E5E1DB]'
            }`}
          >
            <Navigation className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-[#E5E1DB]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#4A4D53]">Total Riders</p>
              <p className="text-2xl font-semibold text-[#04473C]">{riders.length}</p>
            </div>
            <Users className="w-8 h-8 text-[#C6A87C]" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-[#E5E1DB]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#4A4D53]">On Duty</p>
              <p className="text-2xl font-semibold text-green-600">
                {riders.filter(r => r.status === 'on_duty').length}
              </p>
            </div>
            <Bike className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-[#E5E1DB]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#4A4D53]">Online</p>
              <p className="text-2xl font-semibold text-blue-600">
                {riders.filter(r => r.status === 'online').length}
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-[#E5E1DB]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#4A4D53]">Active Visits</p>
              <p className="text-2xl font-semibold text-[#C6A87C]">
                {riders.filter(r => r.current_visit_id).length}
              </p>
            </div>
            <MapPin className="w-8 h-8 text-[#C6A87C]" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Map Section */}
        {showMap && (
          <div className="col-span-2 bg-white rounded-lg border border-[#E5E1DB] overflow-hidden">
            <div className="p-4 border-b border-[#E5E1DB]">
              <h3 className="font-medium text-[#04473C]">Live Map</h3>
            </div>
            <div className="h-[500px]">
              <LiveTrackingMap
                showAllRiders={true}
                allRiders={filteredRiders}
                destinations={[]}
              />
            </div>
          </div>
        )}

        {/* Riders List */}
        <div className={`${showMap ? 'col-span-1' : 'col-span-3'} bg-white rounded-lg border border-[#E5E1DB]`}>
          <div className="p-4 border-b border-[#E5E1DB] flex items-center justify-between">
            <h3 className="font-medium text-[#04473C]">Riders ({filteredRiders.length})</h3>
            
            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#4A4D53]" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-sm border border-[#E5E1DB] rounded px-2 py-1"
              >
                <option value="all">All</option>
                <option value="online">Online</option>
                <option value="on_duty">On Duty</option>
              </select>
            </div>
          </div>

          <div className={`overflow-y-auto ${showMap ? 'max-h-[440px]' : 'max-h-[600px]'}`}>
            {filteredRiders.length === 0 ? (
              <div className="p-8 text-center text-[#4A4D53]">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No riders {filter !== 'all' ? `${filter.replace('_', ' ')}` : 'connected'}</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E1DB]">
                {filteredRiders.map(rider => (
                  <motion.div
                    key={rider.rider_id}
                    layout
                    className={`p-4 hover:bg-[#F5F3F0] cursor-pointer transition-colors ${
                      selectedRider?.rider_id === rider.rider_id ? 'bg-[#F5F3F0]' : ''
                    }`}
                    onClick={() => setSelectedRider(rider)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                          rider.status === 'on_duty' ? 'bg-green-500' :
                          rider.status === 'online' ? 'bg-blue-500' :
                          'bg-gray-400'
                        }`}>
                          {rider.rider_name?.[0] || 'R'}
                        </div>
                        <div>
                          <p className="font-medium text-[#04473C]">
                            {rider.rider_name || `Rider ${rider.rider_id.slice(0, 8)}`}
                          </p>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(rider.status)}
                            {rider.location?.speed && (
                              <span className="text-xs text-[#4A4D53]">
                                {Math.round(rider.location.speed)} km/h
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {rider.current_visit_id && (
                          <span className="text-xs px-2 py-1 bg-[#C6A87C]/20 text-[#C6A87C] rounded">
                            On Visit
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-[#4A4D53]" />
                      </div>
                    </div>

                    {/* Location info */}
                    {rider.location?.lat && (
                      <div className="mt-2 text-xs text-[#4A4D53] flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {rider.location.lat.toFixed(4)}, {rider.location.lng.toFixed(4)}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Rider Details Modal */}
      <AnimatePresence>
        {selectedRider && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setSelectedRider(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-lg w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-[#04473C]">
                    {selectedRider.rider_name || 'Rider Details'}
                  </h3>
                  <button
                    onClick={() => setSelectedRider(null)}
                    className="p-2 hover:bg-[#F5F3F0] rounded-full"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-medium ${
                      selectedRider.status === 'on_duty' ? 'bg-green-500' :
                      selectedRider.status === 'online' ? 'bg-blue-500' :
                      'bg-gray-400'
                    }`}>
                      {selectedRider.rider_name?.[0] || 'R'}
                    </div>
                    <div>
                      <p className="text-lg font-medium text-[#04473C]">
                        {selectedRider.rider_name}
                      </p>
                      {getStatusBadge(selectedRider.status)}
                    </div>
                  </div>

                  {selectedRider.location && (
                    <div className="bg-[#F5F3F0] p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-[#4A4D53] mb-2">Current Location</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-[#4A4D53]">Coordinates</p>
                          <p className="font-mono text-sm">
                            {selectedRider.location.lat?.toFixed(6)}, {selectedRider.location.lng?.toFixed(6)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#4A4D53]">Speed</p>
                          <p className="font-medium">
                            {selectedRider.location.speed ? `${Math.round(selectedRider.location.speed)} km/h` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedRider.assigned_visits?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-[#4A4D53] mb-2">
                        Assigned Visits ({selectedRider.assigned_visits.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedRider.assigned_visits.map((visitId, idx) => (
                          <div key={visitId} className="p-2 bg-[#F5F3F0] rounded flex items-center gap-2">
                            <span className="w-6 h-6 bg-[#04473C] text-white rounded-full flex items-center justify-center text-xs">
                              {idx + 1}
                            </span>
                            <span className="text-sm">{visitId}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLiveTracking;
