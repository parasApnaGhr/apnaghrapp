import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../utils/api';
import { Users, ClipboardList, Building2, MapPin, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const CityManagerDashboard = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await dashboardAPI.getCityManagerDashboard();
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black" style={{ fontFamily: 'Barlow Condensed' }}>
              {data?.city} - CITY MANAGER
            </h1>
            <p className="text-sm text-slate-500">Welcome back, {user?.name}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Total Riders</p>
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="metric-value text-indigo-600">{data?.riders.length || 0}</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Active Riders</p>
              <MapPin className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="metric-value text-emerald-500">
              {data?.riders.filter((r) => r.on_duty).length || 0}
            </p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Total Boards</p>
              <ClipboardList className="w-5 h-5 text-orange-500" />
            </div>
            <p className="metric-value text-orange-500">
              {data?.riders.reduce((sum, r) => sum + r.boards_found, 0) || 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Barlow Condensed' }}>
            RIDER PERFORMANCE
          </h2>
          <div className="space-y-3">
            {data?.riders.map((rider, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                data-testid={`rider-row-${rider.rider_id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{rider.rider}</p>
                    <span
                      className={rider.on_duty ? 'badge-success' : 'badge-neutral'}
                      data-testid={`rider-status-${rider.rider_id}`}
                    >
                      {rider.on_duty ? 'On Duty' : 'Off Duty'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-slate-500">Boards</p>
                    <p className="font-bold text-emerald-600">{rider.boards_found}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500">Brokers</p>
                    <p className="font-bold text-orange-600">{rider.brokers_visited}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500">Visits</p>
                    <p className="font-bold text-sky-600">{rider.visits}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CityManagerDashboard;