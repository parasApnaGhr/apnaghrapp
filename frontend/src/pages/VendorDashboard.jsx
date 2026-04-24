import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Copy, Check, RefreshCw, Users, MapPin, Phone,
  LogOut, Loader2, Bike, BadgeCheck, IndianRupee, CalendarClock, MessageSquareWarning
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';

// ------------------------------------------------------------------
// Hero daily-code card
// ------------------------------------------------------------------
const DailyCodeCard = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success('Code copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-gradient-to-br from-[#04473C] via-[#065F4E] to-[#04473C] text-white rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="relative z-10">
        <p className="text-xs text-white tracking-[0.3em] uppercase mb-4">Today's Vendor Code</p>
        <p className="font-mono font-extrabold text-6xl text-white tracking-[0.4em] mb-6 drop-shadow-lg">{code}</p>
        <p className="text-white text-xs mb-6">Share this code with new riders during onboarding · Resets daily at midnight</p>
        <button
          onClick={copy}
          className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors px-5 py-2.5 rounded-full text-sm font-medium"
        >
          {copied ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Rider card
// ------------------------------------------------------------------
const RiderCard = ({ rider }) => (
  <div className="flex items-center gap-4 bg-white border border-[#E5E1DB] rounded-2xl p-4 hover:shadow-sm transition-shadow">
    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#04473C] to-[#065F4E] flex items-center justify-center text-white font-bold text-base flex-shrink-0">
      {(rider.name || '?')[0].toUpperCase()}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-[#1A1C20] truncate">{rider.name}</p>
      <div className="flex items-center gap-3 text-xs text-[#4A4D53] mt-0.5">
        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{rider.phone}</span>
        {rider.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{rider.city}</span>}
      </div>
    </div>
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
      rider.status === 'active' || !rider.status
        ? 'bg-green-100 text-green-700'
        : 'bg-gray-100 text-gray-500'
    }`}>
      {rider.is_online ? '● Online' : (rider.status || 'active')}
    </span>
  </div>
);

// ------------------------------------------------------------------
// Main dashboard
// ------------------------------------------------------------------
const VendorDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resolvingConcernId, setResolvingConcernId] = useState(null);

  const fetchProfile = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await api.get('/vendor/me');
      setProfile(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error('Session expired. Please log in again.');
        logout();
        navigate('/');
      } else {
        toast.error('Failed to load profile');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Clear any admin session state so vendors can never accidentally reach the admin panel
    sessionStorage.removeItem('adminAccessType');
    sessionStorage.removeItem('inventorySession');
    fetchProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const resolveConcern = async (concernId) => {
    setResolvingConcernId(concernId);
    try {
      await api.patch(`/vendor/concerns/${concernId}/resolve`, { resolution_note: '' });
      await fetchProfile(true);
      toast.success('Concern marked as resolved');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to resolve concern');
    } finally {
      setResolvingConcernId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <Loader2 className="w-10 h-10 animate-spin text-[#04473C]" />
      </div>
    );
  }

  const riders = profile?.riders || [];
  const earnings = profile?.earnings_summary || {};
  const recentVisits = profile?.recent_completed_visits || [];
  const concerns = profile?.concerns || [];
  const concernSummary = profile?.concern_summary || {};
  const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E1DB] shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#04473C] to-[#065F4E] flex items-center justify-center text-white font-bold">
              {(profile?.name || 'V')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-[#1A1C20] text-sm">{profile?.name}</p>
              <p className="text-xs text-[#4A4D53]">Vendor · {profile?.city}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchProfile(true)}
              className="p-2 hover:bg-[#F5F3F0] rounded-full transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-[#4A4D53] ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-[#F5F3F0] rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-[#4A4D53]" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Daily Code — hero */}
        <DailyCodeCard code={profile?.daily_code || '------'} />

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-[#E5E1DB] rounded-2xl p-4 text-center">
            <Bike className="w-5 h-5 text-[#04473C] mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#1A1C20]">{riders.length}</p>
            <p className="text-xs text-[#4A4D53]">Total Riders</p>
          </div>
          <div className="bg-white border border-[#E5E1DB] rounded-2xl p-4 text-center">
            <BadgeCheck className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#1A1C20]">
              {riders.filter(r => r.status === 'active' || !r.status).length}
            </p>
            <p className="text-xs text-[#4A4D53]">Active Riders</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-[#E5E1DB] rounded-2xl p-4 text-center">
            <IndianRupee className="w-5 h-5 text-[#04473C] mx-auto mb-1" />
            <p className="text-xl font-bold text-[#1A1C20]">{formatMoney(earnings.total_vendor_earnings)}</p>
            <p className="text-xs text-[#4A4D53]">Your Earnings</p>
          </div>
          <div className="bg-white border border-[#E5E1DB] rounded-2xl p-4 text-center">
            <CalendarClock className="w-5 h-5 text-[#04473C] mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#1A1C20]">{earnings.completed_visit_count || 0}</p>
            <p className="text-xs text-[#4A4D53]">Completed Visits</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-[#E5E1DB] rounded-2xl p-4 text-center">
            <MessageSquareWarning className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#1A1C20]">{concernSummary.open_count || 0}</p>
            <p className="text-xs text-[#4A4D53]">Open Concerns</p>
          </div>
          <div className="bg-white border border-[#E5E1DB] rounded-2xl p-4 text-center">
            <BadgeCheck className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#1A1C20]">{concernSummary.resolved_count || 0}</p>
            <p className="text-xs text-[#4A4D53]">Resolved Concerns</p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E1DB] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1A1C20]">Earnings Breakdown</h2>
            <span className="text-xs text-[#4A4D53]">{earnings.active_visit_count || 0} active visits</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-[#F5F3F0] p-3">
              <p className="text-[#4A4D53]">Gross Amount</p>
              <p className="font-semibold text-[#1A1C20] mt-1">{formatMoney(earnings.total_gross_amount)}</p>
            </div>
            <div className="rounded-xl bg-[#F5F3F0] p-3">
              <p className="text-[#4A4D53]">Platform Cut</p>
              <p className="font-semibold text-[#1A1C20] mt-1">{formatMoney(earnings.total_platform_fee)}</p>
            </div>
            <div className="rounded-xl bg-[#F5F3F0] p-3">
              <p className="text-[#4A4D53]">Vendor Total</p>
              <p className="font-semibold text-[#1A1C20] mt-1">{formatMoney(earnings.total_vendor_earnings)}</p>
            </div>
            <div className="rounded-xl bg-[#F5F3F0] p-3">
              <p className="text-[#4A4D53]">Rider Total</p>
              <p className="font-semibold text-[#1A1C20] mt-1">{formatMoney(earnings.total_rider_earnings)}</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-[#1A1C20]">Recent Completed Visits</h2>
          </div>

          {recentVisits.length === 0 ? (
            <div className="bg-[#F5F3F0] rounded-2xl p-6 text-center">
              <p className="text-sm text-[#4A4D53]">No completed visits yet for your riders.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentVisits.map((visit) => (
                <div key={visit.id} className="bg-white border border-[#E5E1DB] rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#1A1C20]">{visit.visit_purpose_label}</p>
                      <p className="text-xs text-[#4A4D53] mt-1">
                        {visit.rider_name} · {visit.property_count} {visit.property_count === 1 ? 'property' : 'properties'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#4A4D53]">Vendor Earned</p>
                      <p className="font-semibold text-[#04473C]">{formatMoney(visit.vendor_earning)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                    <div className="bg-[#F5F3F0] rounded-xl p-2">
                      <p className="text-[#4A4D53]">Gross</p>
                      <p className="font-medium text-[#1A1C20] mt-1">{formatMoney(visit.gross_amount)}</p>
                    </div>
                    <div className="bg-[#F5F3F0] rounded-xl p-2">
                      <p className="text-[#4A4D53]">Platform</p>
                      <p className="font-medium text-[#1A1C20] mt-1">{formatMoney(visit.platform_fee)}</p>
                    </div>
                    <div className="bg-[#F5F3F0] rounded-xl p-2">
                      <p className="text-[#4A4D53]">Rider</p>
                      <p className="font-medium text-[#1A1C20] mt-1">{formatMoney(visit.rider_earning)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-[#1A1C20] flex items-center gap-2">
              <MessageSquareWarning className="w-4 h-4 text-amber-600" />
              Rider Concerns
            </h2>
          </div>

          {concerns.length === 0 ? (
            <div className="bg-[#F5F3F0] rounded-2xl p-6 text-center">
              <p className="text-sm text-[#4A4D53]">No concerns raised by admin yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {concerns.map((concern) => (
                <div key={concern.id} className="bg-white border border-[#E5E1DB] rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#1A1C20]">{concern.concern_type}</p>
                      <p className="text-xs text-[#4A4D53] mt-1">{concern.rider_name} · {concern.rider_phone}</p>
                      {concern.notes ? <p className="text-sm text-[#4A4D53] mt-2">{concern.notes}</p> : null}
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      concern.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {concern.status}
                    </span>
                  </div>
                  {concern.status !== 'resolved' ? (
                    <div className="mt-3">
                      <button
                        onClick={() => resolveConcern(concern.id)}
                        disabled={resolvingConcernId === concern.id}
                        className="px-3 py-2 bg-[#04473C] text-white rounded-lg text-xs font-medium hover:bg-[#03352D] transition-colors disabled:opacity-50"
                      >
                        {resolvingConcernId === concern.id ? 'Resolving...' : 'Mark Resolved'}
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Riders list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-[#1A1C20] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#04473C]" />
              Your Riders
            </h2>
          </div>

          {riders.length === 0 ? (
            <div className="bg-[#F5F3F0] rounded-2xl p-8 text-center space-y-2">
              <Bike className="w-10 h-10 text-[#C6A87C] mx-auto" />
              <p className="text-[#1A1C20] font-semibold">No riders yet</p>
              <p className="text-sm text-[#4A4D53]">
                Share your daily code with new riders when they fill out the onboarding form.
              </p>
              <p className="text-xs text-[#4A4D53] bg-white border border-[#E5E1DB] rounded-xl px-4 py-2 inline-block">
                Riders appear here <strong>only after the admin approves</strong> their application
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {riders.map(rider => (
                <RiderCard key={rider.id} rider={rider} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VendorDashboard;
