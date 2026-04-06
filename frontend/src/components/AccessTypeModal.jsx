import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Package, Lock, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

const AccessTypeModal = ({ isOpen, onAccessGranted }) => {
  const [step, setStep] = useState('select'); // 'select', 'verify'
  const [accessType, setAccessType] = useState(null);
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const handleAccessTypeSelect = (type) => {
    setAccessType(type);
    setStep('verify');
    setKey('');
    setError('');
  };

  const handleVerifyKey = async () => {
    if (!key.trim()) {
      setError('Please enter the access key');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/inventory/verify-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          access_type: accessType,
          key: key
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store access type in session
        sessionStorage.setItem('adminAccessType', accessType);
        onAccessGranted(accessType);
      } else {
        setError(data.detail || 'Invalid key. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('select');
    setAccessType(null);
    setKey('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        data-testid="access-type-modal"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#04473C] to-[#065F4E] text-white p-6">
            <h2 className="text-xl font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>
              Select Access Type
            </h2>
            <p className="text-white/80 text-sm mt-1">
              Choose your access level to continue
            </p>
          </div>

          <div className="p-6">
            {step === 'select' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* Admin Option */}
                <button
                  onClick={() => handleAccessTypeSelect('admin')}
                  className="w-full p-4 border-2 border-[#E5E1DB] rounded-lg hover:border-[#04473C] hover:bg-[#F8F7F5] transition-all group text-left flex items-start gap-4"
                  data-testid="select-admin-access"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#04473C] to-[#065F4E] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1A1C20] text-lg">Admin Access</h3>
                    <p className="text-sm text-[#4A4D53] mt-1">
                      Full unrestricted access to all modules including settings, payouts, and team management.
                    </p>
                  </div>
                </button>

                {/* Inventory Option */}
                <button
                  onClick={() => handleAccessTypeSelect('inventory')}
                  className="w-full p-4 border-2 border-[#E5E1DB] rounded-lg hover:border-[#C6A87C] hover:bg-[#FDF8F3] transition-all group text-left flex items-start gap-4"
                  data-testid="select-inventory-access"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C6A87C] to-[#B8956C] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1A1C20] text-lg">Inventory Access</h3>
                    <p className="text-sm text-[#4A4D53] mt-1">
                      Restricted access to Inventory and Property Analytics modules only.
                    </p>
                  </div>
                </button>
              </motion.div>
            )}

            {step === 'verify' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* Access Type Badge */}
                <div className="flex items-center gap-3 p-3 bg-[#F8F7F5] rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    accessType === 'admin' 
                      ? 'bg-gradient-to-br from-[#04473C] to-[#065F4E]' 
                      : 'bg-gradient-to-br from-[#C6A87C] to-[#B8956C]'
                  }`}>
                    {accessType === 'admin' ? (
                      <Shield className="w-5 h-5 text-white" />
                    ) : (
                      <Package className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#4A4D53]">Verifying for</p>
                    <p className="font-semibold text-[#1A1C20] capitalize">{accessType} Access</p>
                  </div>
                </div>

                {/* Key Input */}
                <div>
                  <label className="block text-sm font-medium text-[#1A1C20] mb-2">
                    <Lock className="w-4 h-4 inline mr-1" />
                    Enter {accessType === 'admin' ? 'Admin' : 'Inventory'} Key
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleVerifyKey()}
                      placeholder="Enter access key"
                      className="w-full px-4 py-3 border border-[#E5E1DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04473C]/20 focus:border-[#04473C] pr-12"
                      data-testid="access-key-input"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A4D53] hover:text-[#1A1C20]"
                    >
                      {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleBack}
                    className="flex-1 px-4 py-3 border border-[#E5E1DB] text-[#4A4D53] rounded-lg hover:bg-[#F8F7F5] transition-colors font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleVerifyKey}
                    disabled={loading || !key.trim()}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      accessType === 'admin'
                        ? 'bg-gradient-to-r from-[#04473C] to-[#065F4E] text-white hover:opacity-90'
                        : 'bg-gradient-to-r from-[#C6A87C] to-[#B8956C] text-white hover:opacity-90'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    data-testid="verify-key-button"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Verify & Continue
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AccessTypeModal;
