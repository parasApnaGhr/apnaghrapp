import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Home, LogIn, User, Phone, Mail, Lock, ChevronRight } from 'lucide-react';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'customer',
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        await register(formData);
        toast.success('Registration successful! Please login.');
        setIsRegister(false);
      } else {
        const user = await login(formData.phone, formData.password);
        toast.success('Login successful!');

        if (user.role === 'customer' || user.role === 'advertiser') {
          navigate('/customer');
        } else if (user.role === 'rider') {
          navigate('/rider');
        } else if (['admin', 'support_admin', 'inventory_admin', 'rider_admin'].includes(user.role)) {
          navigate('/admin');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
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
          <p className="text-[#52525B] font-medium">Book property visits, pay only ₹200</p>
        </motion.div>

        {/* Form Card */}
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
                  Full Name
                </label>
                <input
                  type="text"
                  data-testid="register-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Your full name"
                  required
                />
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-bold text-[#111111] mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone Number
              </label>
              <input
                type="tel"
                data-testid="login-phone-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="10-digit mobile number"
                className="input-field"
                required
              />
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
                Password
              </label>
              <input
                type="password"
                data-testid="login-password-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Your password"
                className="input-field"
                required
              />
            </div>

            {isRegister && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-sm font-bold text-[#111111] mb-2">Register as</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'customer', label: 'Customer', desc: 'Find homes' },
                    { value: 'rider', label: 'Rider', desc: 'Field work' }
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

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-[#FF5A5F] font-bold hover:underline"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </div>
        </motion.div>

        {/* Demo Credentials */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 bg-[#111111] text-white rounded-xl border-2 border-[#111111]"
        >
          <p className="text-sm font-bold mb-2 text-[#FFD166]">Demo Accounts:</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-[#4ECDC4]">Customer</span>
              <br />9999999999
            </div>
            <div>
              <span className="text-[#4ECDC4]">Rider</span>
              <br />8888888888
            </div>
            <div>
              <span className="text-[#4ECDC4]">Admin</span>
              <br />7777777777
            </div>
          </div>
          <p className="text-xs mt-2 text-gray-400">Password: test123 / admin123</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
