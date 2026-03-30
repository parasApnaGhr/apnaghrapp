import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  User, Phone, Mail, MapPin, Edit2, Save, LogOut, 
  ChevronRight, ArrowLeft, Shield, Bell, HelpCircle,
  CreditCard, Calendar, Home, Truck
} from 'lucide-react';
import { toast } from 'sonner';

const CustomerProfile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_visits: 0,
    total_spent: 0,
    properties_viewed: 0
  });
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    address: user?.address || ''
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const walletRes = await api.get('/customer/wallet');
      setStats({
        total_visits: walletRes.data?.total_visits || 0,
        total_spent: walletRes.data?.total_spent || 0,
        properties_viewed: walletRes.data?.properties_viewed || 0
      });
    } catch (error) {
      console.log('Could not load stats');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/customer/profile', formData);
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { icon: Calendar, label: 'My Bookings', path: '/customer/bookings', badge: null },
    { icon: CreditCard, label: 'Payment History', path: '/customer/payments', badge: null },
    { icon: Bell, label: 'Notifications', path: '/customer/notifications', badge: '3' },
    { icon: HelpCircle, label: 'Help & Support', path: '/customer/support', badge: null },
    { icon: Shield, label: 'Privacy & Security', path: '/customer/privacy', badge: null },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/customer')}
                className="p-2 hover:bg-[#F5F3F0] transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[#1A1C20]" strokeWidth={1.5} />
              </button>
              <h1 className="text-xl font-medium" style={{ fontFamily: 'Playfair Display, serif' }}>
                My Profile
              </h1>
            </div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="p-2 hover:bg-[#F5F3F0] transition-colors"
              >
                <Edit2 className="w-5 h-5 text-[#04473C]" strokeWidth={1.5} />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={loading}
                className="p-2 hover:bg-[#F5F3F0] transition-colors"
              >
                <Save className="w-5 h-5 text-[#04473C]" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#E5E1DB] p-6 mb-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-[#04473C] flex items-center justify-center">
              <span className="text-3xl font-medium text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              {editing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="premium-input text-xl font-medium mb-1"
                  placeholder="Your name"
                />
              ) : (
                <h2 className="text-xl font-medium text-[#1A1C20]" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {user?.name || 'User'}
                </h2>
              )}
              <p className="text-sm text-[#4A4D53] capitalize">{user?.role || 'Customer'}</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-[#F5F3F0]">
              <Phone className="w-5 h-5 text-[#04473C]" strokeWidth={1.5} />
              <div className="flex-1">
                <p className="text-xs text-[#4A4D53] uppercase tracking-wide">Phone</p>
                <p className="font-medium text-[#1A1C20]">{user?.phone || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[#F5F3F0]">
              <Mail className="w-5 h-5 text-[#04473C]" strokeWidth={1.5} />
              <div className="flex-1">
                <p className="text-xs text-[#4A4D53] uppercase tracking-wide">Email</p>
                {editing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="premium-input py-1"
                    placeholder="your@email.com"
                  />
                ) : (
                  <p className="font-medium text-[#1A1C20]">{user?.email || 'Not set'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[#F5F3F0]">
              <MapPin className="w-5 h-5 text-[#04473C]" strokeWidth={1.5} />
              <div className="flex-1">
                <p className="text-xs text-[#4A4D53] uppercase tracking-wide">Address</p>
                {editing ? (
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="premium-input py-1"
                    placeholder="Your address"
                  />
                ) : (
                  <p className="font-medium text-[#1A1C20]">{user?.address || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          <div className="bg-white border border-[#E5E1DB] p-4 text-center">
            <p className="text-2xl font-medium text-[#04473C]">{stats.total_visits}</p>
            <p className="text-xs text-[#4A4D53] uppercase tracking-wide">Visits</p>
          </div>
          <div className="bg-white border border-[#E5E1DB] p-4 text-center">
            <p className="text-2xl font-medium text-[#04473C]">₹{stats.total_spent}</p>
            <p className="text-xs text-[#4A4D53] uppercase tracking-wide">Spent</p>
          </div>
          <div className="bg-white border border-[#E5E1DB] p-4 text-center">
            <p className="text-2xl font-medium text-[#04473C]">{stats.properties_viewed}</p>
            <p className="text-xs text-[#4A4D53] uppercase tracking-wide">Viewed</p>
          </div>
        </motion.div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-[#E5E1DB] mb-6"
        >
          {menuItems.map((item, idx) => (
            <button
              key={item.label}
              onClick={() => toast.info('Coming soon!')}
              className={`w-full flex items-center justify-between p-4 hover:bg-[#F5F3F0] transition-colors ${
                idx !== menuItems.length - 1 ? 'border-b border-[#E5E1DB]' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-[#04473C]" strokeWidth={1.5} />
                <span className="font-medium text-[#1A1C20]">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className="w-5 h-5 bg-[#04473C] text-white text-xs font-medium flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                <ChevronRight className="w-5 h-5 text-[#D0C9C0]" strokeWidth={1.5} />
              </div>
            </button>
          ))}
        </motion.div>

        {/* Logout Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleLogout}
          className="w-full p-4 bg-[#8F2727]/10 border border-[#8F2727]/30 flex items-center justify-center gap-2 text-[#8F2727] font-medium hover:bg-[#8F2727]/20 transition-colors"
        >
          <LogOut className="w-5 h-5" strokeWidth={1.5} />
          Logout
        </motion.button>
      </main>
    </div>
  );
};

export default CustomerProfile;
