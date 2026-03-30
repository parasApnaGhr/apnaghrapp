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
  const [forgotStep, setForgotStep] = useState(1);
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

        if (user.role === 'customer' || user.role === 'advertiser' || user.role === 'builder') {
          navigate('/customer');
        } else if (user.role === 'rider') {
          navigate('/rider');
        } else if (['admin', 'support_admin', 'inventory_admin', 'rider_admin'].includes(user.role)) {
          navigate('/admin');
        } else {
          navigate('/customer');
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
      
      if (response.data.dev_mode && response.data.otp_for_testing) {
        toast.success(
          <div>
            <p>OTP sent! (Dev Mode)</p>
            <p className="text-lg font-bold mt-1">OTP: {response.data.otp_for_testing}</p>
          </div>,
          { duration: 15000 }
        );
      } else {
        toast.success(`OTP sent to your ${forgotData.method === 'email' ? 'email' : 'phone'}!`);
      }
      
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

  const roleOptions = [
    { value: 'customer', label: 'Find a Home', desc: 'Browse & book visits', icon: Home },
    { value: 'rider', label: 'Join as Rider', desc: 'Earn with visits', icon: User },
    { value: 'advertiser', label: 'Advertise', desc: 'Promote your business', icon: Mail },
    { value: 'builder', label: 'List Properties', desc: 'Builder/Owner account', icon: Home }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FDFCFB] relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80')] bg-cover bg-center opacity-[0.03]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#04473C]/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#C6A87C]/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#04473C] mb-6">
            <Home className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl tracking-tight mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Apna<span className="text-[#04473C]">Ghr</span>
          </h1>
          <p className="text-[#4A4D53] text-sm tracking-wide">
            {isForgotPassword 
              ? 'Reset your password' 
              : isRegister 
                ? 'Create your account' 
                : 'Premium Property Visits'}
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
              className="bg-white border border-[#E5E1DB] p-8"
            >
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setForgotStep(1);
                }}
                className="flex items-center gap-2 text-[#4A4D53] hover:text-[#04473C] mb-6 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                Back to Login
              </button>

              <h2 className="text-xl mb-6 flex items-center gap-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                <KeyRound className="w-5 h-5 text-[#04473C]" strokeWidth={1.5} />
                {forgotStep === 1 && 'Forgot Password'}
                {forgotStep === 2 && 'Enter OTP'}
                {forgotStep === 3 && 'New Password'}
              </h2>

              {forgotStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="premium-label">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#4A4D53] absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
                      <input
                        type="tel"
                        value={forgotData.phone}
                        onChange={(e) => setForgotData({ ...forgotData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        placeholder="Enter your registered phone"
                        className="premium-input pl-12"
                        data-testid="forgot-phone-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="premium-label">Send OTP via</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setForgotData({ ...forgotData, method: 'sms' })}
                        className={`flex-1 p-4 border text-sm font-medium tracking-wide transition-all ${
                          forgotData.method === 'sms'
                            ? 'border-[#04473C] bg-[#E6F0EE] text-[#04473C]'
                            : 'border-[#E5E1DB] hover:border-[#D0C9C0]'
                        }`}
                      >
                        SMS
                      </button>
                      <button
                        type="button"
                        onClick={() => setForgotData({ ...forgotData, method: 'email' })}
                        className={`flex-1 p-4 border text-sm font-medium tracking-wide transition-all ${
                          forgotData.method === 'email'
                            ? 'border-[#04473C] bg-[#E6F0EE] text-[#04473C]'
                            : 'border-[#E5E1DB] hover:border-[#D0C9C0]'
                        }`}
                      >
                        Email
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="btn-primary w-full"
                    data-testid="send-otp-button"
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>
              )}

              {forgotStep === 2 && (
                <div className="space-y-5">
                  <p className="text-[#4A4D53] text-sm">
                    Enter the 6-digit OTP sent to your {forgotData.method === 'sms' ? 'phone' : 'email'}
                  </p>
                  <div>
                    <label className="premium-label">OTP Code</label>
                    <input
                      type="text"
                      value={forgotData.otp}
                      onChange={(e) => setForgotData({ ...forgotData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      placeholder="000000"
                      className="premium-input text-center text-2xl tracking-[0.5em]"
                      maxLength={6}
                      data-testid="otp-input"
                    />
                  </div>

                  <button
                    onClick={handleVerifyOTP}
                    disabled={loading}
                    className="btn-primary w-full"
                    data-testid="verify-otp-button"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>

                  <button
                    onClick={() => setForgotStep(1)}
                    className="w-full text-center text-[#04473C] text-sm font-medium hover:underline"
                  >
                    Didn't receive OTP? Try again
                  </button>
                </div>
              )}

              {forgotStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <label className="premium-label">New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#4A4D53] absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
                      <input
                        type="password"
                        value={forgotData.newPassword}
                        onChange={(e) => setForgotData({ ...forgotData, newPassword: e.target.value })}
                        placeholder="Min 6 characters"
                        className="premium-input pl-12"
                        data-testid="new-password-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="premium-label">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#4A4D53] absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
                      <input
                        type="password"
                        value={forgotData.confirmPassword}
                        onChange={(e) => setForgotData({ ...forgotData, confirmPassword: e.target.value })}
                        placeholder="Confirm password"
                        className="premium-input pl-12"
                        data-testid="confirm-password-input"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="btn-primary w-full"
                    data-testid="reset-password-button"
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="login-register"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white border border-[#E5E1DB] p-8"
            >
              <h2 className="text-xl mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {isRegister && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <label className="premium-label">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#4A4D53] absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
                      <input
                        type="text"
                        data-testid="register-name-input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="premium-input pl-12"
                        placeholder="Your full name"
                        required
                      />
                    </div>
                  </motion.div>
                )}

                <div>
                  <label className="premium-label">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A4D53] text-sm font-medium">+91</span>
                    <input
                      type="tel"
                      data-testid="login-phone-input"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, phone: value });
                      }}
                      placeholder="Enter mobile number"
                      className="premium-input pl-14"
                      maxLength={10}
                      required
                    />
                  </div>
                  {formData.phone && !validatePhone(formData.phone) && (
                    <p className="text-xs text-[#8F2727] mt-2">Enter valid 10-digit number starting with 6-9</p>
                  )}
                </div>

                {isRegister && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <label className="premium-label">Email (Optional)</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#4A4D53] absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
                      <input
                        type="email"
                        data-testid="register-email-input"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="premium-input pl-12"
                        placeholder="your@email.com"
                      />
                    </div>
                  </motion.div>
                )}

                <div>
                  <label className="premium-label">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      data-testid="login-password-input"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={isRegister ? "Create a password (min 6 chars)" : "Enter your password"}
                      className="premium-input pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4A4D53] hover:text-[#1A1C20]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                    </button>
                  </div>
                  {isRegister && formData.password && !validatePassword(formData.password) && (
                    <p className="text-xs text-[#8F2727] mt-2">Password must be at least 6 characters</p>
                  )}
                </div>

                {isRegister && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <label className="premium-label">I want to</label>
                    <div className="grid grid-cols-2 gap-3">
                      {roleOptions.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, role: option.value })}
                            className={`p-4 border text-left transition-all ${
                              formData.role === option.value
                                ? 'border-[#04473C] bg-[#E6F0EE]'
                                : 'border-[#E5E1DB] hover:border-[#D0C9C0]'
                            }`}
                            data-testid={`role-${option.value}`}
                          >
                            <IconComponent className={`w-5 h-5 mb-2 ${formData.role === option.value ? 'text-[#04473C]' : 'text-[#4A4D53]'}`} strokeWidth={1.5} />
                            <div className="font-medium text-sm">{option.label}</div>
                            <div className="text-xs text-[#4A4D53] mt-1">{option.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                <button
                  type="submit"
                  data-testid="login-submit-button"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
                >
                  {loading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {isRegister ? 'Create Account' : 'Sign In'}
                      <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center space-y-3">
                {!isRegister && (
                  <button
                    onClick={() => setIsForgotPassword(true)}
                    className="text-[#4A4D53] hover:text-[#04473C] text-sm transition-colors"
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
                    className="text-[#04473C] text-sm font-medium hover:underline"
                  >
                    {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Terms & Privacy */}
        <p className="text-center text-xs text-[#4A4D53] mt-8">
          By continuing, you agree to our{' '}
          <span className="text-[#04473C] cursor-pointer hover:underline">Terms of Service</span>
          {' '}and{' '}
          <span className="text-[#04473C] cursor-pointer hover:underline">Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
