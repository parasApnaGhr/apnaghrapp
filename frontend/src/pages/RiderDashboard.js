import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { visitAPI } from '../utils/api';
import { MapPin, Phone, Camera, CheckCircle, Clock, IndianRupee, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import VisitProofUpload from '../components/VisitProofUpload';

const RiderDashboard = () => {
  const { user, logout } = useAuth();
  const [availableVisits, setAvailableVisits] = useState([]);
  const [activeVisit, setActiveVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({ today: 0, thisWeek: 0 });
  const [showProofUpload, setShowProofUpload] = useState(false);

  useEffect(() => {
    loadAvailableVisits();
    const interval = setInterval(loadAvailableVisits, 10000);
    return () => clearInterval(interval);
  }, []);

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

  const handleAcceptVisit = async (visitId) => {
    try {
      const response = await visitAPI.acceptVisit(visitId);
      setActiveVisit(response.data);
      toast.success('Visit accepted! Navigate to customer location');
      loadAvailableVisits();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to accept visit');
    }
  };

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
            <button
              onClick={logout}
              className="p-2 hover:bg-[#F3F2EB] rounded-lg"
              data-testid="logout-button"
            >
              <LogOut className="w-5 h-5 text-[#4A626C]" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
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
              <p className="opacity-75">Per Visit</p>
              <p className="font-bold">₹100-150</p>
            </div>
          </div>
        </div>

        {/* Active Visit */}
        {activeVisit && (
          <div className="bg-[#2A9D8F] rounded-xl p-6 mb-6 text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Active Visit
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm opacity-75">Property</p>
                <p className="font-bold">{activeVisit.property?.title}</p>
                <p className="text-sm">{activeVisit.property?.exact_address}</p>
              </div>
              <div>
                <p className="text-sm opacity-75">OTP to verify</p>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>
                  {activeVisit.visit?.otp}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button className="btn-secondary bg-white text-[#2A9D8F] hover:bg-gray-50 flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  Call Customer
                </button>
                <button
                  onClick={() => setShowProofUpload(!showProofUpload)}
                  className="btn-secondary bg-white text-[#2A9D8F] hover:bg-gray-50 flex items-center justify-center gap-2"
                  data-testid="upload-proof-toggle"
                >
                  <Camera className="w-4 h-4" />
                  Upload Proof
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Proof Upload Modal */}
        {showProofUpload && activeVisit && (
          <div className="bg-white rounded-xl border border-[#E5E3D8] p-6 mb-6">
            <VisitProofUpload
              visitId={activeVisit.visit?.id}
              onComplete={() => {
                toast.success('Visit completed successfully!');
                setShowProofUpload(false);
                setActiveVisit(null);
                loadAvailableVisits();
              }}
            />
          </div>
        )}

        {/* Available Visits */}
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
                  className="visit-request-card"
                  data-testid={`visit-request-${visit.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-lg mb-1">New Visit Request</h4>
                      <p className="text-sm text-[#4A626C]">Property ID: {visit.property_id.substring(0, 8)}...</p>
                    </div>
                    <span className="badge badge-warning">Pending</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-[#4A626C]" />
                      <span>
                        {visit.scheduled_date} at {visit.scheduled_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <IndianRupee className="w-4 h-4 text-[#4A626C]" />
                      <span className="font-medium text-[#2A9D8F]">Earn ₹100-150</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAcceptVisit(visit.id)}
                    data-testid={`accept-visit-${visit.id}`}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Accept Visit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-[#FFF5F2] rounded-xl p-6 border border-[#E07A5F]/20">
          <h3 className="font-bold mb-3">Visit Guidelines</h3>
          <ul className="space-y-2 text-sm text-[#4A626C]">
            <li className="flex gap-2">
              <span>•</span>
              <span>Verify OTP with customer before starting visit</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Capture selfie with customer and property video</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Stay present during entire visit (min 15 minutes)</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Use "Connect to Support" if customer needs negotiation help</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Upload all proof before marking visit complete</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default RiderDashboard;