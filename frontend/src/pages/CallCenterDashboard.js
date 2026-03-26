import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { riderAPI, siteVisitAPI } from '../utils/api';
import { Users, MapPin, UserPlus, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const CallCenterDashboard = () => {
  const { user, logout } = useAuth();
  const [riders, setRiders] = useState([]);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    property_address: '',
    property_type: '2BHK',
    scheduled_time: '',
    assigned_rider_id: '',
    city: user?.city || '',
  });

  useEffect(() => {
    loadRiders();
  }, []);

  const loadRiders = async () => {
    try {
      const response = await riderAPI.getRiders(user?.city);
      setRiders(response.data);
    } catch (error) {
      toast.error('Failed to load riders');
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await siteVisitAPI.createSiteVisit(formData);
      toast.success('Site visit assigned successfully!');
      setShowAssignForm(false);
      setFormData({
        client_name: '',
        property_address: '',
        property_type: '2BHK',
        scheduled_time: '',
        assigned_rider_id: '',
        city: user?.city || '',
      });
    } catch (error) {
      toast.error('Failed to assign visit');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black" style={{ fontFamily: 'Barlow Condensed' }}>
              CALL CENTER
            </h1>
            <p className="text-sm text-slate-500">Assign site visits to riders</p>
          </div>
          <button
            onClick={logout}
            data-testid="logout-button"
            className="btn-secondary flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <button
            onClick={() => setShowAssignForm(!showAssignForm)}
            data-testid="assign-visit-button"
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Assign New Site Visit
          </button>
        </div>

        {showAssignForm && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Barlow Condensed' }}>
              ASSIGN SITE VISIT
            </h2>
            <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Client Name
                </label>
                <input
                  type="text"
                  data-testid="client-name-input"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Property Address
                </label>
                <input
                  type="text"
                  data-testid="property-address-input"
                  value={formData.property_address}
                  onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Property Type
                </label>
                <select
                  data-testid="property-type-select"
                  value={formData.property_type}
                  onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                  className="input-field"
                >
                  <option value="1BHK">1BHK</option>
                  <option value="2BHK">2BHK</option>
                  <option value="3BHK">3BHK</option>
                  <option value="4BHK">4BHK</option>
                  <option value="Villa">Villa</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Scheduled Time
                </label>
                <input
                  type="time"
                  data-testid="scheduled-time-input"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Assign to Rider
                </label>
                <select
                  data-testid="rider-select"
                  value={formData.assigned_rider_id}
                  onChange={(e) => setFormData({ ...formData, assigned_rider_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select Rider</option>
                  {riders
                    .filter((r) => r.on_duty)
                    .map((rider) => (
                      <option key={rider.id} value={rider.id}>
                        Rider {rider.id.substring(0, 8)} - {rider.city}
                      </option>
                    ))}
                </select>
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button type="submit" data-testid="submit-assign-button" className="btn-primary">
                  Assign Visit
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Barlow Condensed' }}>
            RIDER AVAILABILITY
          </h2>
          <div className="space-y-3">
            {riders.map((rider) => (
              <div
                key={rider.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                data-testid={`rider-card-${rider.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Rider {rider.id.substring(0, 8)}</p>
                    <p className="text-sm text-slate-500">{rider.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {rider.on_duty && rider.current_lat && (
                    <MapPin className="w-4 h-4 text-emerald-500" />
                  )}
                  <span
                    className={rider.on_duty ? 'badge-success' : 'badge-neutral'}
                    data-testid={`rider-status-${rider.id}`}
                  >
                    {rider.on_duty ? 'Available' : 'Off Duty'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CallCenterDashboard;