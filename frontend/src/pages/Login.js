import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Home, LogIn } from 'lucide-react';

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

        if (user.role === 'customer') {
          navigate('/customer');
        } else if (user.role === 'rider') {
          navigate('/rider');
        } else if (user.role === 'admin' || user.role === 'support_admin' || user.role === 'inventory_admin' || user.role === 'rider_admin') {
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #FAF9F6 0%, #F3F2EB 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E07A5F] rounded-2xl mb-4">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit' }}>ApnaGhr</h1>
          <p className="text-[#4A626C]">Book property visits, pay only ₹200</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E3D8] p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit' }}>
            {isRegister ? 'Create Account' : 'Sign In'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-[#264653] mb-1.5">Full Name</label>
                <input
                  type="text"
                  data-testid="register-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#264653] mb-1.5">Phone Number</label>
              <input
                type="tel"
                data-testid="login-phone-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter your phone"
                className="input-field"
                required
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-[#264653] mb-1.5">Email (optional)</label>
                <input
                  type="email"
                  data-testid="register-email-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#264653] mb-1.5">Password</label>
              <input
                type="password"
                data-testid="login-password-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                className="input-field"
                required
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-[#264653] mb-1.5">Register as</label>
                <select
                  data-testid="role-select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input-field"
                >
                  <option value="customer">Customer (Looking for property)</option>
                  <option value="rider">Rider (Field Executive)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              data-testid="login-submit-button"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
              {!loading && <LogIn className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-[#E07A5F] font-medium hover:underline"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-[#4A626C]">
          <p>Demo: Customer - 9999999999 / test123</p>
          <p>Rider - 8888888888 / test123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;