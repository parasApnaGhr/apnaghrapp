import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogIn, Bike } from 'lucide-react';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(phone, password);
      toast.success('Login successful!');

      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'city_manager') {
        navigate('/city-manager');
      } else if (user.role === 'call_center') {
        navigate('/call-center');
      } else if (user.role === 'rider') {
        navigate('/rider');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1733565823567-ca12618dec46?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NjZ8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBkZWxpdmVyeSUyMHJpZGVyJTIwbW90b3JiaWtlJTIwaGFwcHl8ZW58MHx8fHwxNzczNjQ4OTY5fDA&ixlib=rb-4.1.0&q=85)',
        }}
      >
        <div className="absolute inset-0 bg-indigo-900 bg-opacity-40"></div>
        <div className="relative z-10 p-12 text-white flex flex-col justify-end">
          <h1 className="text-6xl font-black mb-4" style={{ fontFamily: 'Barlow Condensed' }}>
            ApnaGhr Field Ops
          </h1>
          <p className="text-xl font-medium">Operating System for Field Riders</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Bike className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Barlow Condensed' }}>
                  Sign In
                </h2>
                <p className="text-sm text-slate-500">Access your dashboard</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Phone Number
                </label>
                <input
                  type="tel"
                  data-testid="login-phone-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Password
                </label>
                <input
                  type="password"
                  data-testid="login-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="input-field"
                  required
                />
              </div>

              <button
                type="submit"
                data-testid="login-submit-button"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Signing in...'
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500 text-center">
                Demo accounts available for testing
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;