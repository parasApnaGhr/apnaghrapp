import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Home, User, Phone, Mail, Lock, ChevronRight, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
import api from '../utils/api';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: enter phone, 2: enter OTP, 3: new password
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'customer',
  });
  const [forgotData, setForgotData] = useState({
    phone: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
    method: 'sms'
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!validatePhone(formData.phone)) {
      toast.error('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    
    if (!validatePassword(formData.password)) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (isRegister && !formData.name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await register(formData);
        toast.success('Account created successfully! Please login.');
        setIsRegister(false);
        setFormData({ ...formData, name: '', password: '' });
      } else {
        const user = await login(formData.phone, formData.password);
        toast.success(`Welcome back, ${user.name || 'User'}!`);

        if (user.role === 'customer' || user.role === 'advertiser') {
          navigate('/customer');
        } else if (user.role === 'rider') {
          navigate('/rider');
        } else if (['admin', 'support_admin', 'inventory_admin', 'rider_admin'].includes(user.role)) {
          navigate('/admin');
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Something went wrong. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!validatePhone(forgotData.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', {
        phone: forgotData.phone,
        method: forgotData.method
      });
      toast.success('OTP sent to your phone!');
      setForgotStep(2);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (forgotData.otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', {
        phone: forgotData.phone,
        otp: forgotData.otp
      });
      toast.success('OTP verified!');
      setForgotStep(3);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (forgotData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (forgotData.newPassword !== forgotData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        phone: forgotData.phone,
        otp: forgotData.otp,
        new_password: forgotData.newPassword
      });
      toast.success('Password reset successfully! Please login.');
      setIsForgotPassword(false);
      setForgotStep(1);
      setForgotData({ phone: '', otp: '', newPassword: '', confirmPassword: '', method: 'sms' });
      setFormData({ ...formData, phone: forgotData.phone, password: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF9F6]">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-[#FFD166]/20 rounded-full"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-[#4ECDC4]/15 rounded-full"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#FF5A5F] border-3 border-[#111111] rounded-2xl shadow-[4px_4px_0px_#111111] mb-4">
            <Home className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter mb-2" style={{ fontFamily: 'Outfit' }}>
            Apna<span className="text-[#FF5A5F]">Ghr</span>
          </h1>
          <p className="text-[#52525B] font-medium">
            {isForgotPassword 
              ? 'Reset your password' 
              : isRegister 
                ? 'Create your account to get started' 
                : 'Book property visits, pay only ₹200'}
          </p>
        </motion.div>

        {/* Forgot Password Flow */}
        <AnimatePresence mode="wait">
          {isForgotPassword ? (
            <motion.div
              key="forgot-password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="neo-card p-8"
            >
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setForgotStep(1);
                }}
                className="flex items-center gap-2 text-[#52525B] hover:text-[#111111] mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>

              <h2 className="text-2xl font-black mb-6 tracking-tight flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
                <KeyRound className="w-6 h-6 text-[#FF5A5F]" />
                {forgotStep === 1 && 'Forgot Password'}
                {forgotStep === 2 && 'Enter OTP'}
                {forgotStep === 3 && 'New Password'}
              </h2>

              {forgotStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[#111111] mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={forgotData.phone}
                      onChange={(e) => setForgotData({ ...forgotData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      placeholder="Enter your registered phone"
                      className="input-field"
                      data-testid="forgot-phone-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#111111] mb-2">Send OTP via</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setForgotData({ ...forgotData, method: 'sms' })}
                        className={`flex-1 p-3 rounded-xl border-2 font-bold transition-all ${
                          forgotData.method === 'sms'
                            ? 'border-[#111111] bg-[#4ECDC4] text-white shadow-[2px_2px_0px_#111111]'
                            : 'border-[#E5E3D8] hover:border-[#111111]'
                        }`}
                      >
                        SMS
                      </button>
                      <button
                        type="button"
                        onClick={() => setForgotData({ ...forgotData, method: 'email' })}
                        className={`flex-1 p-3 rounded-xl border-2 font-bold transition-all ${
                          forgotData.method === 'email'
                            ? 'border-[#111111] bg-[#4ECDC4] text-white shadow-[2px_2px_0px_#111111]'
                            : 'border-[#E5E3D8] hover:border-[#111111]'
                        }`}
                      >
                        Email
                      </button>
                    </div>
                  </div>

                  <motion.button
                    onClick={handleForgotPassword}
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="btn-primary w-full mt-4"
                    data-testid="send-otp-button"
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </motion.button>
                </div>
              )}

              {forgotStep === 2 && (
                <div className="space-y-4">
                  <p className="text-[#52525B] text-sm mb-4">
                    Enter the 6-digit OTP sent to your {forgotData.method === 'sms' ? 'phone' : 'email'}
                  </p>
                  <div>
                    <label className="block text-sm font-bold text-[#111111] mb-2">OTP Code</label>
                    <input
                      type="text"
                      value={forgotData.otp}
                      onChange={(e) => setForgotData({ ...forgotData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      placeholder="Enter 6-digit OTP"
                      className="input-field text-center text-2xl tracking-widest"
                      maxLength={6}
                      data-testid="otp-input"
                    />
                  </div>

                  <motion.button
                    onClick={handleVerifyOTP}
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="btn-primary w-full"
                    data-testid="verify-otp-button"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </motion.button>

                  <button
                    onClick={() => setForgotStep(1)}
                    className="w-full text-center text-[#FF5A5F] font-bold mt-2"
                  >
                    Didn't receive OTP? Try again
                  </button>
                </div>
              )}

              {forgotStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[#111111] mb-2">
                      <Lock className="w-4 h-4 inline mr-1" />
                      New Password
                    </label>
                    <input
                      type="password"
                      value={forgotData.newPassword}
                      onChange={(e) => setForgotData({ ...forgotData, newPassword: e.target.value })}
                      placeholder="Enter new password (min 6 characters)"
                      className="input-field"
                      data-testid="new-password-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#111111] mb-2">
                      <Lock className="w-4 h-4 inline mr-1" />
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={forgotData.confirmPassword}
                      onChange={(e) => setForgotData({ ...forgotData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className="input-field"
                      data-testid="confirm-password-input"
                    />
                  </div>

                  <motion.button
                    onClick={handleResetPassword}
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="btn-primary w-full"
                    data-testid="reset-password-button"
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </motion.button>
                </div>
              )}
            </motion.div>
          ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="neo-card p-8"
        >
          <h2 className="text-2xl font-black mb-6 tracking-tight" style={{ fontFamily: 'Outfit' }}>
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-sm font-bold text-[#111111] mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Full Name *
                </label>
                <input
                  type="text"
                  data-testid="register-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Enter your full name"
                  required
                />
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-bold text-[#111111] mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone Number *
              </label>
              <input
                type="tel"
                data-testid="login-phone-input"
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, phone: value });
                }}
                placeholder="10-digit mobile number"
                className="input-field"
                maxLength={10}
                required
              />
              {formData.phone && !validatePhone(formData.phone) && (
                <p className="text-xs text-[#FF5A5F] mt-1">Enter valid 10-digit number starting with 6-9</p>
              )}
            </div>

            {isRegister && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-sm font-bold text-[#111111] mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email (optional)
                </label>
                <input
                  type="email"
                  data-testid="register-email-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  placeholder="your@email.com"
                />
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-bold text-[#111111] mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  data-testid="login-password-input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={isRegister ? "Create a password (min 6 characters)" : "Enter your password"}
                  className="input-field pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#52525B] hover:text-[#111111]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {isRegister && formData.password && !validatePassword(formData.password) && (
                <p className="text-xs text-[#FF5A5F] mt-1">Password must be at least 6 characters</p>
              )}
            </div>

            {isRegister && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-sm font-bold text-[#111111] mb-2">I want to</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'customer', label: 'Find a Home', desc: 'Browse & book visits', icon: '🏠' },
                    { value: 'rider', label: 'Join as Rider', desc: 'Earn with visits', icon: '🚴' },
                    { value: 'advertiser', label: 'Advertise', desc: 'Promote your business', icon: '📢' },
                    { value: 'builder', label: 'List Properties', desc: 'Builder/Owner account', icon: '🏗️' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: option.value })}
                      className={`p-4 rounded-xl border-2 border-[#111111] text-left transition-all ${
                        formData.role === option.value
                          ? 'bg-[#FFD166] shadow-[2px_2px_0px_#111111]'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                      data-testid={`role-${option.value}`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="font-bold">{option.label}</div>
                      <div className="text-xs text-[#52525B]">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.button
              type="submit"
              data-testid="login-submit-button"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <div className="kinetic-loader" style={{ transform: 'scale(0.5)' }}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                <>
                  {isRegister ? 'Create Account' : 'Sign In'}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {!isRegister && (
              <button
                onClick={() => setIsForgotPassword(true)}
                className="text-[#52525B] hover:text-[#FF5A5F] text-sm font-medium"
                data-testid="forgot-password-link"
              >
                Forgot Password?
              </button>
            )}
            <div>
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setFormData({ name: '', phone: '', email: '', password: '', role: 'customer' });
                }}
                className="text-[#FF5A5F] font-bold hover:underline"
              >
                {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
              </button>
            </div>
          </div>
        </motion.div>
          )}
        </AnimatePresence>

        {/* Terms & Privacy */}
        <p className="text-center text-xs text-[#52525B] mt-6">
          By continuing, you agree to our{' '}
          <span className="text-[#FF5A5F] cursor-pointer hover:underline">Terms of Service</span>
          {' '}and{' '}
          <span className="text-[#FF5A5F] cursor-pointer hover:underline">Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
