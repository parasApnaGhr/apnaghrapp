// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Package, Clock, Target, Award, AlertTriangle, 
  RefreshCw, Calendar, Eye, TrendingUp, CheckCircle, XCircle,
  Settings, UserPlus, Trash2, Save
} from 'lucide-react';
import { toast } from 'sonner';

const InventoryTeamPerformance = () => {
  const [activeTab, setActiveTab] = useState('tracking');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  
  // Settings
  const [predefinedUsers, setPredefinedUsers] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [inventoryKey, setInventoryKey] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const fetchTeamData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/inventory/admin/inventory-team?date=${selectedDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setTeamData(data);
      }
    } catch (err) {
      console.error('Failed to fetch team data:', err);
      toast.error('Failed to load inventory team data');
    } finally {
      setLoading(false);
    }
  }, [API_URL, selectedDate]);

  const fetchSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/inventory/predefined-users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.users) {
        setPredefinedUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab, fetchSettings]);

  const viewSessionDetail = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/inventory/admin/inventory-user-detail/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSelectedSession(data);
      }
    } catch (err) {
      console.error('Failed to fetch session detail:', err);
    }
  };

  const addUser = () => {
    if (!newUserName.trim()) return;
    if (predefinedUsers.includes(newUserName.trim())) {
      toast.error('User already exists');
      return;
    }
    setPredefinedUsers([...predefinedUsers, newUserName.trim()]);
    setNewUserName('');
  };

  const removeUser = (user) => {
    setPredefinedUsers(predefinedUsers.filter(u => u !== user));
  };

  const saveUsers = async () => {
    setSavingSettings(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/inventory/predefined-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(predefinedUsers)
      });
      if (response.ok) {
        toast.success('User list updated');
      }
    } catch (err) {
      toast.error('Failed to save users');
    } finally {
      setSavingSettings(false);
    }
  };

  const updateInventoryKey = async () => {
    if (!inventoryKey.trim() || inventoryKey.length < 4) {
      toast.error('Key must be at least 4 characters');
      return;
    }
    setSavingSettings(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/inventory/admin/update-inventory-key?new_key=${inventoryKey}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('Inventory key updated');
        setInventoryKey('');
      }
    } catch (err) {
      toast.error('Failed to update key');
    } finally {
      setSavingSettings(false);
    }
  };

  const formatTime = (minutes) => {
    if (!minutes) return '-';
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  };

  const tabs = [
    { id: 'tracking', label: 'Daily Tracking', icon: Clock },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--stitch-ink)]" >
            Inventory Team Performance
          </h2>
          <p className="text-sm text-[var(--stitch-muted)] mt-1">Track and manage inventory team activities</p>
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-[var(--stitch-line)] rounded-lg text-sm"
          />
          <button
            onClick={fetchTeamData}
            className="p-2 hover:bg-[var(--stitch-soft)] rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-[var(--stitch-muted)]" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[var(--stitch-line)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
              activeTab === tab.id
                ? 'text-[var(--stitch-muted)] border-[var(--stitch-muted)]'
                : 'text-[var(--stitch-muted)] border-transparent hover:text-[var(--stitch-ink)]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      {activeTab !== 'settings' && teamData && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-[var(--stitch-line)] rounded-xl p-4">
            <div className="flex items-center gap-2 text-[var(--stitch-muted)] text-sm mb-1">
              <Users className="w-4 h-4" />
              Users Logged
            </div>
            <p className="text-2xl font-bold text-[var(--stitch-ink)]">{teamData.summary?.total_users_logged || 0}</p>
          </div>
          
          <div className="bg-white border border-[var(--stitch-line)] rounded-xl p-4">
            <div className="flex items-center gap-2 text-[var(--stitch-muted)] text-sm mb-1">
              <Clock className="w-4 h-4" />
              Active Now
            </div>
            <p className="text-2xl font-bold text-green-600">{teamData.summary?.active_sessions || 0}</p>
          </div>
          
          <div className="bg-white border border-[var(--stitch-line)] rounded-xl p-4">
            <div className="flex items-center gap-2 text-[var(--stitch-muted)] text-sm mb-1">
              <Package className="w-4 h-4" />
              Total Added
            </div>
            <p className="text-2xl font-bold text-[var(--stitch-muted)]">{teamData.summary?.total_properties_added || 0}</p>
          </div>
          
          <div className="bg-white border border-[var(--stitch-line)] rounded-xl p-4">
            <div className="flex items-center gap-2 text-[var(--stitch-muted)] text-sm mb-1">
              <CheckCircle className="w-4 h-4" />
              Good Performers
            </div>
            <p className="text-2xl font-bold text-green-600">{teamData.summary?.good_performers || 0}</p>
          </div>
          
          <div className="bg-white border border-[var(--stitch-line)] rounded-xl p-4">
            <div className="flex items-center gap-2 text-[var(--stitch-muted)] text-sm mb-1">
              <AlertTriangle className="w-4 h-4" />
              Needs Attention
            </div>
            <p className="text-2xl font-bold text-orange-500">{teamData.summary?.needs_attention || 0}</p>
          </div>
        </div>
      )}

      {/* Daily Tracking Tab */}
      {activeTab === 'tracking' && (
        <div className="bg-white border border-[var(--stitch-line)] rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-[var(--stitch-muted)]/30 border-t-[var(--stitch-muted)] rounded-full animate-spin" />
            </div>
          ) : teamData?.sessions?.length === 0 ? (
            <div className="text-center py-12 text-[var(--stitch-muted)]">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No inventory sessions found for this date</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--stitch-soft)] border-b border-[var(--stitch-line)]">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-[var(--stitch-muted)]">User</th>
                    <th className="text-left px-4 py-3 font-medium text-[var(--stitch-muted)]">Login</th>
                    <th className="text-left px-4 py-3 font-medium text-[var(--stitch-muted)]">Logout</th>
                    <th className="text-left px-4 py-3 font-medium text-[var(--stitch-muted)]">Hours</th>
                    <th className="text-left px-4 py-3 font-medium text-[var(--stitch-muted)]">Cities</th>
                    <th className="text-left px-4 py-3 font-medium text-[var(--stitch-muted)]">Target</th>
                    <th className="text-left px-4 py-3 font-medium text-[var(--stitch-muted)]">Added</th>
                    <th className="text-left px-4 py-3 font-medium text-[var(--stitch-muted)]">Points</th>
                    <th className="text-left px-4 py-3 font-medium text-[var(--stitch-muted)]">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-[var(--stitch-muted)]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teamData.sessions?.map((session) => (
                    <tr key={session.session_id} className="border-b border-[var(--stitch-line)] hover:bg-[var(--stitch-soft)]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {session.photo_base64 ? (
                            <img 
                              src={session.photo_base64} 
                              alt={session.inventory_user_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[var(--stitch-muted)]/20 flex items-center justify-center">
                              <span className="text-xs font-medium text-[var(--stitch-muted)]">
                                {session.inventory_user_name?.[0]}
                              </span>
                            </div>
                          )}
                          <span className="font-medium text-[var(--stitch-ink)]">{session.inventory_user_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--stitch-muted)]">{formatDateTime(session.login_time)}</td>
                      <td className="px-4 py-3 text-[var(--stitch-muted)]">
                        {session.is_active ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Active
                          </span>
                        ) : formatDateTime(session.logout_time)}
                      </td>
                      <td className="px-4 py-3 text-[var(--stitch-muted)]">{formatTime(session.total_active_minutes)}</td>
                      <td className="px-4 py-3 text-[var(--stitch-muted)]">{session.selected_cities?.length || 0}</td>
                      <td className="px-4 py-3 text-[var(--stitch-muted)]">{session.total_target || 0}</td>
                      <td className="px-4 py-3 font-medium text-[var(--stitch-muted)]">{session.properties_added || 0}</td>
                      <td className="px-4 py-3 font-medium text-green-600">{session.points_earned || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          session.is_active 
                            ? 'bg-blue-100 text-blue-700'
                            : session.performance_status === 'Good Performance'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                        }`}>
                          {session.is_active ? 'In Progress' : session.performance_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => viewSessionDetail(session.session_id)}
                          className="p-1.5 hover:bg-[var(--stitch-line)] rounded transition-colors"
                        >
                          <Eye className="w-4 h-4 text-[var(--stitch-muted)]" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-white border border-[var(--stitch-line)] rounded-xl p-6">
            <h3 className="font-semibold text-[var(--stitch-ink)] mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-[var(--stitch-muted)]" />
              Top Performers Today
            </h3>
            
            {teamData?.sessions?.filter(s => s.performance_status === 'Good Performance').length === 0 ? (
              <p className="text-[var(--stitch-muted)] text-sm">No top performers yet today</p>
            ) : (
              <div className="space-y-3">
                {teamData?.sessions
                  ?.filter(s => s.performance_status === 'Good Performance')
                  ?.sort((a, b) => (b.properties_added || 0) - (a.properties_added || 0))
                  ?.slice(0, 5)
                  ?.map((session, idx) => (
                    <div key={session.session_id} className="flex items-center justify-between p-3 bg-[var(--stitch-soft)] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                          idx === 1 ? 'bg-gray-300 text-gray-700' :
                          idx === 2 ? 'bg-orange-300 text-orange-900' :
                          'bg-[var(--stitch-line)] text-[var(--stitch-muted)]'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--stitch-ink)]">{session.inventory_user_name}</p>
                          <p className="text-xs text-[var(--stitch-muted)]">{session.selected_cities?.join(', ')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[var(--stitch-muted)]">{session.properties_added}</p>
                        <p className="text-xs text-[var(--stitch-muted)]">properties</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Needs Attention */}
          <div className="bg-white border border-[var(--stitch-line)] rounded-xl p-6">
            <h3 className="font-semibold text-[var(--stitch-ink)] mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Needs Attention
            </h3>
            
            {teamData?.sessions?.filter(s => s.performance_status === 'Needs Attention' && !s.is_active).length === 0 ? (
              <p className="text-[var(--stitch-muted)] text-sm">No attention needed currently</p>
            ) : (
              <div className="space-y-3">
                {teamData?.sessions
                  ?.filter(s => s.performance_status === 'Needs Attention' && !s.is_active)
                  ?.map((session) => (
                    <div key={session.session_id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div>
                        <p className="font-medium text-[var(--stitch-ink)]">{session.inventory_user_name}</p>
                        <p className="text-xs text-orange-600">
                          Added {session.properties_added || 0} / {session.total_target || 30} ({30 - (session.properties_added || 0)} short)
                        </p>
                      </div>
                      <XCircle className="w-5 h-5 text-orange-500" />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Manage Users */}
          <div className="bg-white border border-[var(--stitch-line)] rounded-xl p-6">
            <h3 className="font-semibold text-[var(--stitch-ink)] mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[var(--stitch-ink)]" />
              Manage Inventory Users
            </h3>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Enter new user name"
                className="flex-1 px-3 py-2 border border-[var(--stitch-line)] rounded-lg text-sm"
              />
              <button
                onClick={addUser}
                className="px-4 py-2 bg-[var(--stitch-ink)] text-white rounded-lg text-sm font-medium hover:bg-[var(--stitch-ink)] transition-colors"
              >
                Add
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {predefinedUsers.map((user) => (
                <div key={user} className="flex items-center justify-between p-2 bg-[var(--stitch-soft)] rounded-lg">
                  <span className="text-sm">{user}</span>
                  <button
                    onClick={() => removeUser(user)}
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={saveUsers}
              disabled={savingSettings}
              className="w-full mt-4 px-4 py-2 bg-[var(--stitch-ink)] text-white rounded-lg text-sm font-medium hover:bg-[var(--stitch-ink)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingSettings ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save User List
            </button>
          </div>

          {/* Update Inventory Key */}
          <div className="bg-white border border-[var(--stitch-line)] rounded-xl p-6">
            <h3 className="font-semibold text-[var(--stitch-ink)] mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[var(--stitch-muted)]" />
              Inventory Access Key
            </h3>
            
            <p className="text-sm text-[var(--stitch-muted)] mb-4">
              Update the access key that inventory users need to enter to access the system.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={inventoryKey}
                onChange={(e) => setInventoryKey(e.target.value)}
                placeholder="Enter new inventory key"
                className="flex-1 px-3 py-2 border border-[var(--stitch-line)] rounded-lg text-sm"
              />
              <button
                onClick={updateInventoryKey}
                disabled={savingSettings || inventoryKey.length < 4}
                className="px-4 py-2 bg-[var(--stitch-muted)] text-white rounded-lg text-sm font-medium hover:bg-[var(--stitch-muted)] transition-colors disabled:opacity-50"
              >
                Update
              </button>
            </div>
            
            <p className="text-xs text-[var(--stitch-muted)] mt-2">
              Default key: inventory2024 (minimum 4 characters)
            </p>
          </div>
        </div>
      )}

      {/* Session Detail Modal */}
      {selectedSession && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSession(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[var(--stitch-muted)] to-[var(--stitch-muted)] text-white p-6">
              <h3 className="text-lg font-semibold">Session Details</h3>
              <p className="text-white/80 text-sm">{selectedSession.inventory_user_name}</p>
            </div>
            
            <div className="p-6 space-y-4">
              {selectedSession.photo_full && (
                <div className="text-center">
                  <img 
                    src={selectedSession.photo_full} 
                    alt="Login Photo"
                    className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-[var(--stitch-muted)]"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[var(--stitch-muted)]">Session ID</p>
                  <p className="font-mono text-xs">{selectedSession.session_id?.slice(0, 8)}...</p>
                </div>
                <div>
                  <p className="text-[var(--stitch-muted)]">Login Time</p>
                  <p className="font-medium">{formatDateTime(selectedSession.login_time)}</p>
                </div>
                <div>
                  <p className="text-[var(--stitch-muted)]">Logout Time</p>
                  <p className="font-medium">{selectedSession.is_active ? 'Still Active' : formatDateTime(selectedSession.logout_time)}</p>
                </div>
                <div>
                  <p className="text-[var(--stitch-muted)]">Working Hours</p>
                  <p className="font-medium">{formatTime(selectedSession.total_active_minutes)}</p>
                </div>
                <div>
                  <p className="text-[var(--stitch-muted)]">Target</p>
                  <p className="font-medium">{selectedSession.total_target}</p>
                </div>
                <div>
                  <p className="text-[var(--stitch-muted)]">Achieved</p>
                  <p className="font-medium text-[var(--stitch-muted)]">{selectedSession.properties_added}</p>
                </div>
              </div>
              
              <div>
                <p className="text-[var(--stitch-muted)] text-sm mb-2">Cities</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSession.selected_cities?.map((city) => (
                    <span key={city} className="px-2 py-1 bg-[var(--stitch-soft)] rounded text-xs">
                      {city}: {selectedSession.properties_added_by_city?.[city] || 0}/{selectedSession.city_targets?.[city] || 0}
                    </span>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => setSelectedSession(null)}
                className="w-full py-2 bg-[var(--stitch-soft)] text-[var(--stitch-muted)] rounded-lg font-medium hover:bg-[var(--stitch-line)] transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default InventoryTeamPerformance;
