// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, Target, MapPin, Clock, TrendingUp, Award, AlertTriangle, LogOut, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const InventoryUserDashboard = ({ sessionId, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/inventory/my-inventory-stats?session_id=${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, sessionId]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to end your session?')) return;

    setLoggingOut(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/inventory/inventory-logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ session_id: sessionId })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        sessionStorage.removeItem('inventorySession');
        toast.success('Session ended successfully!');
        onLogout();
      } else {
        toast.error(data.detail || 'Failed to end session');
      }
    } catch (err) {
      toast.error('Connection error');
    } finally {
      setLoggingOut(false);
    }
  };

  const formatTime = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-[#C6A87C]/30 border-t-[#C6A87C] rounded-full animate-spin" />
      </div>
    );
  }

  const achievementPercentage = stats?.achievement_percentage || 0;
  const isGoodPerformance = stats?.performance_status === 'Good Performance';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with User Info */}
      <div className="bg-gradient-to-r from-[#C6A87C] to-[#B8956C] text-white p-6 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className="text-white/80 text-sm">Inventory Session</p>
            <h2 className="text-2xl font-semibold mt-1" style={{ fontFamily: 'Playfair Display, serif' }}>
              Welcome, {stats?.user_name}!
            </h2>
            <div className="flex items-center gap-4 mt-3 text-sm text-white/90">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Active: {formatTime(stats?.current_active_minutes || 0)}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                isGoodPerformance ? 'bg-green-500/30' : stats?.properties_added > 0 ? 'bg-yellow-500/30' : 'bg-white/20'
              }`}>
                {stats?.performance_status || 'In Progress'}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
            data-testid="inventory-logout-btn"
          >
            {loggingOut ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            End Session
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-[#E5E1DB] rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#04473C]/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-[#04473C]" />
            </div>
            <div>
              <p className="text-xs text-[#4A4D53]">Added Today</p>
              <p className="text-2xl font-bold text-[#1A1C20]">{stats?.properties_added || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-[#E5E1DB] rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C6A87C]/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-[#C6A87C]" />
            </div>
            <div>
              <p className="text-xs text-[#4A4D53]">Target</p>
              <p className="text-2xl font-bold text-[#1A1C20]">{stats?.total_target || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-[#E5E1DB] rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-[#4A4D53]">Points Earned</p>
              <p className="text-2xl font-bold text-green-600">{stats?.points_earned || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-[#E5E1DB] rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-[#4A4D53]">Cities</p>
              <p className="text-2xl font-bold text-[#1A1C20]">{stats?.selected_cities?.length || 0}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Progress Section */}
      <div className="bg-white border border-[#E5E1DB] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1A1C20]">Target Progress</h3>
          <button
            onClick={fetchStats}
            className="text-[#4A4D53] hover:text-[#1A1C20] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="relative h-4 bg-[#F5F3F0] rounded-full overflow-hidden mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(achievementPercentage, 100)}%` }}
            transition={{ duration: 0.5 }}
            className={`absolute inset-y-0 left-0 rounded-full ${
              achievementPercentage >= 100 ? 'bg-green-500' : achievementPercentage >= 50 ? 'bg-[#C6A87C]' : 'bg-orange-400'
            }`}
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-[#4A4D53]">
            {stats?.properties_added || 0} / {stats?.total_target || 0} properties
          </span>
          <span className={`font-medium ${
            achievementPercentage >= 100 ? 'text-green-600' : 'text-[#C6A87C]'
          }`}>
            {achievementPercentage.toFixed(0)}%
          </span>
        </div>

        {/* Performance Status Alert */}
        {stats?.properties_added < 30 && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Keep Going!</p>
              <p className="text-xs text-yellow-700">
                Add {30 - (stats?.properties_added || 0)} more properties to achieve "Good Performance" status
              </p>
            </div>
          </div>
        )}

        {isGoodPerformance && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Award className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Great Job!</p>
              <p className="text-xs text-green-700">
                You've achieved "Good Performance" status with 30+ properties
              </p>
            </div>
          </div>
        )}
      </div>

      {/* City Breakdown */}
      <div className="bg-white border border-[#E5E1DB] rounded-xl p-6">
        <h3 className="font-semibold text-[#1A1C20] mb-4">City-wise Breakdown</h3>
        
        <div className="space-y-3">
          {stats?.selected_cities?.map((city) => {
            const target = stats?.city_targets?.[city] || 0;
            const added = stats?.properties_added_by_city?.[city] || 0;
            const progress = target > 0 ? (added / target * 100) : 0;

            return (
              <div key={city} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium text-[#1A1C20] truncate">{city}</div>
                <div className="flex-1 h-2 bg-[#F5F3F0] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      progress >= 100 ? 'bg-green-500' : 'bg-[#C6A87C]'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="text-sm text-[#4A4D53] w-16 text-right">
                  {added} / {target}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default InventoryUserDashboard;
