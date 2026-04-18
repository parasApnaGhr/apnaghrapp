// @ts-nocheck
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  ArrowLeft, Shield, Lock, Eye, EyeOff, Key, 
  Smartphone, Check, AlertTriangle, LogOut
} from 'lucide-react';
import { toast } from 'sonner';

const CustomerPrivacy = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      toast.success('Password changed successfully');
      setShowPasswordForm(false);
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const privacySettings = [
    {
      icon: Shield,
      title: 'Terms Accepted',
      description: user?.terms_accepted ? 'You have accepted the Terms & Conditions' : 'Terms not yet accepted',
      status: user?.terms_accepted ? 'active' : 'pending',
      action: () => navigate('/legal')
    },
    {
      icon: Lock,
      title: 'Account Security',
      description: 'Your account is protected',
      status: 'active'
    },
    {
      icon: Smartphone,
      title: 'Phone Verified',
      description: user?.phone || 'Not set',
      status: 'active'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/customer/profile')}
              className="p-2 hover:bg-[#F5F3F0] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#1A1C20]" strokeWidth={1.5} />
            </button>
            <h1 className="text-xl font-medium" style={{ fontFamily: 'Playfair Display, serif' }}>
              Privacy & Security
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Security Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#E5E1DB] p-6 mb-6"
        >
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            <Shield className="w-5 h-5 text-[#04473C]" />
            Security Status
          </h2>
          
          <div className="space-y-4">
            {privacySettings.map((setting, index) => (
              <div
                key={index}
                onClick={setting.action}
                className={`flex items-center gap-4 p-4 bg-[#F5F3F0] ${setting.action ? 'cursor-pointer hover:bg-[#E5E1DB] transition-colors' : ''}`}
              >
                <div className={`w-10 h-10 flex items-center justify-center ${
                  setting.status === 'active' ? 'bg-green-100' : 'bg-amber-100'
                }`}>
                  <setting.icon className={`w-5 h-5 ${
                    setting.status === 'active' ? 'text-green-600' : 'text-amber-600'
                  }`} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#1A1C20]">{setting.title}</p>
                  <p className="text-sm text-[#4A4D53]">{setting.description}</p>
                </div>
                {setting.status === 'active' ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-[#E5E1DB] p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              <Key className="w-5 h-5 text-[#04473C]" />
              Change Password
            </h2>
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="text-[#04473C] text-sm font-medium hover:underline"
              >
                Change
              </button>
            )}
          </div>

          {showPasswordForm ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="premium-label">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                    className="premium-input pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A4D53]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="premium-label">New Password</label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                  className="premium-input"
                  required
                  minLength={6}
                />
              </div>
              
              <div>
                <label className="premium-label">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  className="premium-input"
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                  }}
                  className="flex-1 py-3 border border-[#E5E1DB] text-[#4A4D53] font-medium hover:bg-[#F5F3F0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-[#4A4D53]">
              Keep your account secure by using a strong password
            </p>
          )}
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={handleLogout}
            className="w-full bg-white border border-red-200 p-4 flex items-center justify-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </motion.div>
      </main>
    </div>
  );
};

export default CustomerPrivacy;
