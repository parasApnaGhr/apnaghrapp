import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, riderAPI } from '../utils/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin, Users, ClipboardList, TrendingUp, Building2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashResponse, ridersResponse] = await Promise.all([
        dashboardAPI.getAdminDashboard(),
        riderAPI.getRiders(),
      ]);
      setStats(dashResponse.data);
      setRiders(ridersResponse.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const totalStats = stats?.cities.reduce(
    (acc, city) => ({
      riders: acc.riders + city.riders,
      boards: acc.boards + city.boards,
      brokers: acc.brokers + city.brokers,
      visits: acc.visits + city.visits,
    }),
    { riders: 0, boards: 0, brokers: 0, visits: 0 }
  ) || { riders: 0, boards: 0, brokers: 0, visits: 0 };

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
              ADMIN CONTROL CENTER
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card" data-testid="total-riders-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Total Riders</p>
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="metric-value text-indigo-600">{totalStats.riders}</p>
          </div>

          <div className="stat-card" data-testid="total-boards-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">To-Let Boards</p>
              <ClipboardList className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="metric-value text-emerald-500">{totalStats.boards}</p>
          </div>

          <div className="stat-card" data-testid="total-brokers-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Broker Visits</p>
              <Building2 className="w-5 h-5 text-orange-500" />
            </div>
            <p className="metric-value text-orange-500">{totalStats.brokers}</p>
          </div>

          <div className="stat-card" data-testid="total-visits-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Site Visits</p>
              <TrendingUp className="w-5 h-5 text-sky-500" />
            </div>
            <p className="metric-value text-sky-500">{totalStats.visits}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Barlow Condensed' }}>
              CITY PERFORMANCE
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.cities || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="city" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="boards" fill="#10b981" />
                <Bar dataKey="visits" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Barlow Condensed' }}>
              CITY OVERVIEW
            </h2>
            <div className="space-y-3">
              {stats?.cities.map((city, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                  data-testid={`city-card-${city.city}`}
                >
                  <div>
                    <p className="font-bold text-slate-900">{city.city}</p>
                    <p className="text-sm text-slate-500">{city.riders} Riders Active</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Boards: {city.boards}</p>
                    <p className="text-sm text-slate-500">Visits: {city.visits}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Barlow Condensed' }}>
              LIVE RIDER LOCATIONS
            </h2>
          </div>
          <div className="h-96 rounded-lg overflow-hidden" data-testid="rider-map">
            <MapContainer
              center={[30.7333, 76.7794]}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {riders
                .filter((r) => r.current_lat && r.current_lng)
                .map((rider) => (
                  <Marker key={rider.id} position={[rider.current_lat, rider.current_lng]}>
                    <Popup>
                      <strong>Rider: {rider.id}</strong>
                      <br />
                      City: {rider.city}
                      <br />
                      Status: {rider.on_duty ? 'On Duty' : 'Off Duty'}
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;