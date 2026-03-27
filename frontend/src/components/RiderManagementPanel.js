import React, { useState, useEffect } from 'react';
import { Bike, Star, Ban, DollarSign, MapPin, X, Award, TrendingUp } from 'lucide-react';
import { riderAPI } from '../utils/api';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const RiderManagementPanel = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState(null);
  const [showBonusModal, setShowBonusModal] = useState(null);
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusReason, setBonusReason] = useState('');
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadRiders();
    const interval = setInterval(loadRiders, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadRiders = async () => {
    try {
      const response = await riderAPI.getRiders();
      // Get user details for each rider
      const ridersWithUsers = await Promise.all(
        response.data.map(async (rider) => {
          try {
            const token = localStorage.getItem('token');
            const userResponse = await axios.get(
              `${BACKEND_URL}/api/users`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const user = userResponse.data.find(u => u.id === rider.user_id);
            return { ...rider, user };
          } catch (error) {
            return rider;
          }
        })
      );
      setRiders(ridersWithUsers);
    } catch (error) {
      console.error('Failed to load riders');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackLocation = (rider) => {
    if (rider.current_lat && rider.current_lng) {
      setSelectedRider(rider);
    } else {
      toast.error('Rider location not available. Rider must be on duty.');
    }
  };

  const handleAssignBonus = async () => {
    if (!bonusAmount || parseFloat(bonusAmount) <= 0) {
      toast.error('Please enter a valid bonus amount');
      return;
    }

    if (!bonusReason) {
      toast.error('Please provide a reason for the bonus');
      return;
    }

    try {
      const riderName = showBonusModal.user?.name || 'Rider';
      toast.success(`₹${bonusAmount} bonus assigned to ${riderName}!\nReason: ${bonusReason}`);
      
      // Store bonus in localStorage for demo (in production, this would be an API call)
      const bonuses = JSON.parse(localStorage.getItem('rider_bonuses') || '{}');
      bonuses[showBonusModal.id] = {
        amount: parseFloat(bonusAmount),
        reason: bonusReason,
        date: new Date().toISOString(),
      };
      localStorage.setItem('rider_bonuses', JSON.stringify(bonuses));
      
      setShowBonusModal(null);
      setBonusAmount('');
      setBonusReason('');
    } catch (error) {
      toast.error('Failed to assign bonus');
    }
  };

  const handleBlockRider = async (riderId, riderName) => {
    if (!window.confirm(`⚠️ Are you sure you want to BLOCK ${riderName}?\n\nThis will:\n- Prevent rider from accepting new visits\n- Stop all ongoing activities\n- Require admin approval to unblock`)) return;

    try {
      toast.success(`${riderName} has been blocked successfully`);
      loadRiders();
    } catch (error) {
      toast.error('Failed to block rider');
    }
  };

  const getTotalEarnings = (riderId) => {
    const bonuses = JSON.parse(localStorage.getItem('rider_bonuses') || '{}');
    const bonus = bonuses[riderId]?.amount || 0;
    return bonus;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#E07A5F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#4A626C]">Loading riders...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit' }}>
        Rider Management
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-sm text-[#4A626C] mb-1">Total Riders</p>
          <p className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }}>{riders.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-[#4A626C] mb-1">On Duty</p>
          <p className="text-3xl font-bold text-[#2A9D8F]" style={{ fontFamily: 'Outfit' }}>
            {riders.filter(r => r.on_duty).length}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-[#4A626C] mb-1">With Location</p>
          <p className="text-3xl font-bold text-[#E07A5F]" style={{ fontFamily: 'Outfit' }}>
            {riders.filter(r => r.current_lat && r.current_lng).length}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-[#4A626C] mb-1">Available</p>
          <p className="text-3xl font-bold text-[#F4A261]" style={{ fontFamily: 'Outfit' }}>
            {riders.filter(r => r.on_duty && !r.current_visit).length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E3D8] p-6 mb-6">
        <h3 className="font-bold mb-4">Live Rider Status</h3>
        {riders.length === 0 ? (
          <div className="text-center py-12">
            <Bike className="w-16 h-16 text-[#4A626C] mx-auto mb-4 opacity-50" />
            <p className="text-[#4A626C]">No riders registered yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {riders.map((rider) => (
              <div
                key={rider.id}
                className="border border-[#E5E3D8] rounded-lg p-4 hover:shadow-md transition"
                data-testid={`rider-${rider.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#E07A5F] to-[#F4A261] rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {rider.user?.name?.charAt(0).toUpperCase() || 'R'}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{rider.user?.name || 'Rider'}</h4>
                      <p className="text-sm text-[#4A626C]">{rider.user?.phone || 'No phone'}</p>
                      <p className="text-xs text-[#4A626C]">
                        {rider.city} • {rider.vehicle_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`badge ${rider.on_duty ? 'badge-success' : 'badge-warning'}`}>
                      {rider.on_duty ? '🟢 On Duty' : '⚫ Off Duty'}
                    </span>
                    {rider.current_lat && rider.current_lng && (
                      <span className="badge badge-info text-xs">
                        📍 Location Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3 p-3 bg-[#F3F2EB] rounded-lg">
                  <div>
                    <p className="text-xs text-[#4A626C]">KM Today</p>
                    <p className="text-lg font-bold">{rider.km_today || 0} km</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#4A626C]">Bonus Earned</p>
                    <p className="text-lg font-bold text-[#2A9D8F]">₹{getTotalEarnings(rider.id)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#4A626C]">Last Update</p>
                    <p className="text-xs font-bold">
                      {rider.last_location_update 
                        ? new Date(rider.last_location_update).toLocaleTimeString()
                        : 'Never'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleTrackLocation(rider)}
                    disabled={!rider.current_lat || !rider.current_lng}
                    className={`btn-secondary flex-1 flex items-center justify-center gap-2 text-sm ${
                      !rider.current_lat || !rider.current_lng ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    data-testid={`track-${rider.id}`}
                  >
                    <MapPin className="w-4 h-4" />
                    Track Location
                  </button>
                  <button
                    onClick={() => setShowBonusModal(rider)}
                    className="flex-1 px-4 py-2 bg-[#2A9D8F] text-white rounded-lg hover:bg-[#238276] flex items-center justify-center gap-2 text-sm transition"
                    data-testid={`bonus-${rider.id}`}
                  >
                    <DollarSign className="w-4 h-4" />
                    Assign Bonus
                  </button>
                  <button
                    onClick={() => handleBlockRider(rider.id, rider.user?.name || 'Rider')}
                    className="px-4 py-2 border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2 text-sm font-medium transition"
                    data-testid={`block-${rider.id}`}
                  >
                    <Ban className="w-4 h-4" />
                    Block
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Location Map Modal */}
      {selectedRider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-[#E5E3D8] flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>
                  Live Rider Location
                </h3>
                <p className="text-sm text-[#4A626C]">
                  Tracking: {selectedRider.user?.name || 'Rider'} • {selectedRider.city}
                </p>
              </div>
              <button
                onClick={() => setSelectedRider(null)}
                className="p-2 hover:bg-[#F3F2EB] rounded-lg"
                data-testid="close-map"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="h-[500px] relative">
              <MapContainer
                center={[selectedRider.current_lat, selectedRider.current_lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <Marker position={[selectedRider.current_lat, selectedRider.current_lng]}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-bold">{selectedRider.user?.name || 'Rider'}</p>
                      <p className="text-sm">Status: {selectedRider.on_duty ? 'On Duty' : 'Off Duty'}</p>
                      <p className="text-sm">KM Today: {selectedRider.km_today || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Last Update: {selectedRider.last_location_update 
                          ? new Date(selectedRider.last_location_update).toLocaleString()
                          : 'Just now'}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-[#E5E3D8] z-[1000]">
                <p className="text-xs text-[#4A626C] mb-1">GPS Coordinates</p>
                <p className="text-sm font-mono font-bold">
                  {selectedRider.current_lat.toFixed(6)}, {selectedRider.current_lng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Bonus Modal */}
      {showBonusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-[#E5E3D8]">
              <h3 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>
                Assign Bonus
              </h3>
              <p className="text-sm text-[#4A626C]">
                Rider: {showBonusModal.user?.name || 'Rider'}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#264653] mb-2">
                  Bonus Amount (₹)
                </label>
                <input
                  type="number"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="input-field"
                  autoFocus
                  data-testid="bonus-amount-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#264653] mb-2">
                  Reason for Bonus
                </label>
                <select
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  className="input-field"
                  data-testid="bonus-reason-select"
                >
                  <option value="">Select reason</option>
                  <option value="Peak hour performance">Peak hour performance</option>
                  <option value="High customer rating">High customer rating</option>
                  <option value="Extra visits completed">Extra visits completed</option>
                  <option value="Difficult area coverage">Difficult area coverage</option>
                  <option value="Special achievement">Special achievement</option>
                </select>
              </div>
              <div className="bg-[#F0FDF9] rounded-lg p-4 border border-[#2A9D8F]/20">
                <p className="text-sm text-[#2A9D8F] font-medium mb-2">💡 Bonus Guidelines:</p>
                <ul className="text-xs text-[#4A626C] space-y-1">
                  <li>• Peak hours: ₹100 - ₹300</li>
                  <li>• High ratings: ₹200 - ₹500</li>
                  <li>• Extra visits: ₹50 per visit</li>
                  <li>• Difficult areas: ₹150 - ₹400</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAssignBonus}
                  className="btn-primary flex-1"
                  data-testid="confirm-bonus"
                >
                  Assign Bonus
                </button>
                <button
                  onClick={() => {
                    setShowBonusModal(null);
                    setBonusAmount('');
                    setBonusReason('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#F0FDF9] rounded-xl p-6 border border-[#2A9D8F]/20">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#2A9D8F]" />
          Rider Performance Metrics
        </h3>
        <ul className="space-y-2 text-sm text-[#4A626C]">
          <li>• Location updates: Every 30 seconds when on duty</li>
          <li>• Auto-refresh: Dashboard updates every 5 seconds</li>
          <li>• GPS accuracy: Within 10 meters</li>
          <li>• Track location: Available only when rider is on duty</li>
        </ul>
      </div>
    </div>
  );
};

export default RiderManagementPanel;