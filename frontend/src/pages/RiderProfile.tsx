// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  ArrowLeft, User, Phone, Mail, MapPin, Edit2, Save, LogOut,
  Car, CreditCard, Building2, AlertTriangle, Check, Wallet, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

const RiderProfile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [bankAccount, setBankAccount] = useState(null);
  const [showBankForm, setShowBankForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    vehicle_type: '',
    vehicle_number: ''
  });
  
  const [bankData, setBankData] = useState({
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    upi_id: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/rider/profile');
      setProfileData(response.data.profile);
      setBankAccount(response.data.bank_account);
      setFormData({
        name: response.data.profile?.name || '',
        email: response.data.profile?.email || '',
        address: response.data.profile?.address || '',
        vehicle_type: response.data.profile?.vehicle_type || '',
        vehicle_number: response.data.profile?.vehicle_number || ''
      });
      if (response.data.bank_account) {
        setBankData({
          account_holder_name: response.data.bank_account.account_holder_name || '',
          account_number: '',
          ifsc_code: response.data.bank_account.ifsc_code || '',
          bank_name: response.data.bank_account.bank_name || '',
          upi_id: response.data.bank_account.upi_id || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await api.put('/rider/profile', formData);
      toast.success('Profile updated successfully');
      setEditing(false);
      loadProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBankAccount = async (e) => {
    e.preventDefault();
    
    if (!bankData.account_holder_name || !bankData.account_number || !bankData.ifsc_code || !bankData.bank_name) {
      toast.error('Please fill all required bank details');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/rider/bank-account', bankData);
      toast.success('Bank account added successfully');
      setShowBankForm(false);
      loadProfile();
    } catch (error) {
      toast.error('Failed to add bank account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isProfileComplete = profileData?.name && profileData?.vehicle_type && profileData?.vehicle_number;

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/rider')}
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
                onClick={handleSaveProfile}
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
        {/* Profile Completion Warning */}
        {!isProfileComplete && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 p-4 mb-6 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Complete Your Profile</p>
              <p className="text-sm text-amber-700">Add vehicle details and bank account to start accepting visits</p>
            </div>
          </motion.div>
        )}

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#E5E1DB] p-6 mb-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-[#04473C] flex items-center justify-center">
              <span className="text-3xl font-medium text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                {profileData?.name?.charAt(0)?.toUpperCase() || 'R'}
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
                  {profileData?.name || 'Rider'}
                </h2>
              )}
              <p className="text-sm text-[#04473C] font-medium">RIDER</p>
            </div>
          </div>

          {/* Contact & Vehicle Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-[#F5F3F0]">
              <Phone className="w-5 h-5 text-[#04473C]" strokeWidth={1.5} />
              <div className="flex-1">
                <p className="text-xs text-[#4A4D53] uppercase tracking-wide">Phone</p>
                <p className="font-medium text-[#1A1C20]">{profileData?.phone || 'Not set'}</p>
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
                  <p className="font-medium text-[#1A1C20]">{profileData?.email || 'Not set'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[#F5F3F0]">
              <Car className="w-5 h-5 text-[#04473C]" strokeWidth={1.5} />
              <div className="flex-1">
                <p className="text-xs text-[#4A4D53] uppercase tracking-wide">Vehicle</p>
                {editing ? (
                  <div className="flex gap-2 mt-1">
                    <select
                      value={formData.vehicle_type}
                      onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                      className="premium-input py-1 flex-1"
                    >
                      <option value="">Select type</option>
                      <option value="bike">Bike</option>
                      <option value="scooter">Scooter</option>
                      <option value="car">Car</option>
                    </select>
                    <input
                      type="text"
                      value={formData.vehicle_number}
                      onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
                      className="premium-input py-1 flex-1"
                      placeholder="PB10XX1234"
                    />
                  </div>
                ) : (
                  <p className="font-medium text-[#1A1C20]">
                    {profileData?.vehicle_type && profileData?.vehicle_number 
                      ? `${profileData.vehicle_type.charAt(0).toUpperCase() + profileData.vehicle_type.slice(1)} - ${profileData.vehicle_number}`
                      : 'Not set'}
                  </p>
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
                  <p className="font-medium text-[#1A1C20]">{profileData?.address || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bank Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-[#E5E1DB] p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              <Building2 className="w-5 h-5 text-[#04473C]" />
              Bank Account
            </h2>
            {!showBankForm && (
              <button
                onClick={() => setShowBankForm(true)}
                className="text-[#04473C] text-sm font-medium hover:underline"
              >
                {bankAccount ? 'Update' : 'Add'}
              </button>
            )}
          </div>

          {showBankForm ? (
            <form onSubmit={handleSaveBankAccount} className="space-y-4">
              <div>
                <label className="premium-label">Account Holder Name *</label>
                <input
                  type="text"
                  value={bankData.account_holder_name}
                  onChange={(e) => setBankData(prev => ({ ...prev, account_holder_name: e.target.value }))}
                  className="premium-input"
                  placeholder="As per bank records"
                  required
                />
              </div>
              
              <div>
                <label className="premium-label">Account Number *</label>
                <input
                  type="text"
                  value={bankData.account_number}
                  onChange={(e) => setBankData(prev => ({ ...prev, account_number: e.target.value }))}
                  className="premium-input"
                  placeholder="Enter account number"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="premium-label">IFSC Code *</label>
                  <input
                    type="text"
                    value={bankData.ifsc_code}
                    onChange={(e) => setBankData(prev => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))}
                    className="premium-input"
                    placeholder="SBIN0001234"
                    required
                  />
                </div>
                <div>
                  <label className="premium-label">Bank Name *</label>
                  <input
                    type="text"
                    value={bankData.bank_name}
                    onChange={(e) => setBankData(prev => ({ ...prev, bank_name: e.target.value }))}
                    className="premium-input"
                    placeholder="State Bank of India"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="premium-label">UPI ID (Optional)</label>
                <input
                  type="text"
                  value={bankData.upi_id}
                  onChange={(e) => setBankData(prev => ({ ...prev, upi_id: e.target.value }))}
                  className="premium-input"
                  placeholder="yourname@upi"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBankForm(false)}
                  className="flex-1 py-3 border border-[#E5E1DB] text-[#4A4D53] font-medium hover:bg-[#F5F3F0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Bank Account'}
                </button>
              </div>
            </form>
          ) : bankAccount ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200">
                <Check className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">{bankAccount.bank_name}</p>
                  <p className="text-sm text-green-700">
                    {bankAccount.account_number_masked} • {bankAccount.account_holder_name}
                  </p>
                </div>
              </div>
              {bankAccount.upi_id && (
                <p className="text-sm text-[#4A4D53]">UPI: {bankAccount.upi_id}</p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-[#D0C9C0]" strokeWidth={1} />
              <p className="text-[#4A4D53] mb-2">No bank account linked</p>
              <p className="text-sm text-[#9A9A9A]">Add your bank details to receive payouts</p>
            </div>
          )}
        </motion.div>

        {/* Wallet Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => navigate('/rider')}
            className="w-full bg-white border border-[#E5E1DB] p-4 flex items-center justify-between hover:border-[#04473C] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-[#04473C]" />
              <span className="font-medium text-[#1A1C20]">View Wallet & Earnings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#4A4D53]" />
          </button>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
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

export default RiderProfile;
