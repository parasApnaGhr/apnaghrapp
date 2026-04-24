import React, { useState, useEffect, useCallback } from 'react';
import {
  Store, Plus, RefreshCw, Copy, Check, Users, MapPin,
  Eye, EyeOff, X, Loader2, Trash2,
  Phone, Mail, Shield, BadgeCheck, AlertCircle, MessageSquareWarning
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';

const DEFAULT_CONCERN_TYPES = [
  'Rider Not Available',
  'Rider Not Responding',
  'Reached Late',
  'Misbehaviour',
  'Wrong Location Update',
];

// ------------------------------------------------------------------
// Daily Code Badge — big prominent display
// ------------------------------------------------------------------
const DailyCodeBadge = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="inline-flex items-center gap-3 bg-[#04473C] text-white px-4 py-2 rounded-lg">
      <span className="text-xs text-white/60 tracking-widest uppercase">Today's Code</span>
      <span className="font-mono font-bold text-xl text-white tracking-[0.25em]">{code}</span>
      <button onClick={copy} className="p-1 hover:bg-white/20 rounded transition-colors">
        {copied ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
};

// ------------------------------------------------------------------
// Create Vendor Modal
// ------------------------------------------------------------------
const CreateVendorModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', city: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.phone.trim() || form.phone.length < 10) e.phone = 'Valid phone required';
    if (!form.password || form.password.length < 6) e.password = 'Min 6 characters';
    if (!form.city.trim()) e.city = 'City is required';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await api.post('/admin/vendors', form);
      toast.success(`Vendor "${res.data.vendor.name}" created`);
      onCreated(res.data.vendor);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create vendor');
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, type = 'text', extra = {}) => (
    <div>
      <label className="block text-xs font-medium text-[#4A4D53] mb-1">{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={e => { setForm(p => ({ ...p, [name]: e.target.value })); setErrors(p => ({ ...p, [name]: '' })); }}
        className={`w-full border ${errors[name] ? 'border-red-400' : 'border-[#E5E1DB]'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#04473C]`}
        {...extra}
      />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-[#E5E1DB]">
          <h2 className="text-lg font-semibold text-[#1A1C20]">Create Vendor Account</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F5F3F0] rounded-full transition-colors">
            <X className="w-5 h-5 text-[#4A4D53]" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {field('name', 'Full Name')}
          {field('email', 'Email Address', 'email')}
          {field('phone', 'Phone Number', 'tel', { maxLength: 10, placeholder: '10-digit mobile' })}

          <div>
            <label className="block text-xs font-medium text-[#4A4D53] mb-1">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })); }}
                className={`w-full border ${errors.password ? 'border-red-400' : 'border-[#E5E1DB]'} rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[#04473C]`}
              />
              <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A4D53]">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          {field('city', 'City')}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">Share these credentials with the vendor. They will use phone + password to log in to their portal.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-[#E5E1DB] rounded-lg text-sm text-[#4A4D53] hover:bg-[#F5F3F0] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-[#04473C] text-white rounded-lg text-sm font-medium hover:bg-[#03352D] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Vendor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Vendor Detail Drawer
// ------------------------------------------------------------------
const VendorDetailDrawer = ({ vendor, onClose, onDeleted }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [concernDrafts, setConcernDrafts] = useState({});
  const [submittingConcernId, setSubmittingConcernId] = useState(null);
  const [selectedConcernRider, setSelectedConcernRider] = useState(null);
  const concernTypes = detail?.concern_types?.length ? detail.concern_types : DEFAULT_CONCERN_TYPES;

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/admin/vendors/${vendor.id}`);
        setDetail(res.data);
      } catch {
        toast.error('Failed to load vendor details');
      } finally {
        setLoading(false);
      }
    })();
  }, [vendor.id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/vendors/${vendor.id}`);
      toast.success(`Vendor "${vendor.name}" removed`);
      onDeleted(vendor.id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to remove vendor');
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const submitConcern = async (riderId) => {
    const draft = concernDrafts[riderId] || {};
    if (!draft.concern_type) {
      toast.error('Select a concern first');
      return false;
    }

    setSubmittingConcernId(riderId);
    try {
      const res = await api.post(`/admin/vendors/${vendor.id}/concerns`, {
        rider_id: riderId,
        concern_type: draft.concern_type,
        notes: draft.notes || ''
      });
      setDetail(prev => ({
        ...prev,
        concerns: [res.data.concern, ...(prev?.concerns || [])]
      }));
      setConcernDrafts(prev => ({
        ...prev,
        [riderId]: { concern_type: '', notes: '' }
      }));
      toast.success('Concern sent to vendor');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to raise concern');
      return false;
    } finally {
      setSubmittingConcernId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-[#E5E1DB] px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-[#1A1C20]">{vendor.name}</h2>
          <div className="flex items-center gap-2">
            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-medium">Confirm remove?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Yes, remove
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs font-medium border border-[#E5E1DB] rounded-lg hover:bg-[#F5F3F0] transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            <button onClick={onClose} className="p-2 hover:bg-[#F5F3F0] rounded-full transition-colors">
              <X className="w-5 h-5 text-[#4A4D53]" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#04473C]" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Daily Code — hero block */}
            <div className="bg-gradient-to-r from-[#04473C] to-[#065F4E] rounded-2xl p-6 text-white text-center">
              <p className="text-xs text-white/60 tracking-widest uppercase mb-2">Today's Vendor Code</p>
              <p className="font-mono font-bold text-4xl text-white tracking-[0.3em] mb-1">{detail.daily_code}</p>
              <p className="text-xs text-white/50">Resets daily at midnight</p>
            </div>

            {/* Contact */}
            <div className="bg-[#F5F3F0] rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-semibold text-[#1A1C20] mb-3">Contact Details</h4>
              <div className="flex items-center gap-2 text-sm text-[#4A4D53]">
                <Phone className="w-4 h-4" /> {detail.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-[#4A4D53]">
                <Mail className="w-4 h-4" /> {detail.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-[#4A4D53]">
                <MapPin className="w-4 h-4" /> {detail.city}
              </div>
            </div>

            {/* Riders */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[#1A1C20]">
                  Riders Under This Vendor ({detail.riders?.length || 0})
                </h4>
              </div>
              {!detail.riders?.length ? (
                <div className="bg-[#F5F3F0] rounded-xl p-4 text-center space-y-1">
                  <p className="text-sm font-medium text-[#1A1C20]">No approved riders yet</p>
                  <p className="text-xs text-[#4A4D53]">Riders who apply with this vendor's daily code will appear here <strong>only after the admin approves</strong> their application.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {detail.riders.map(rider => (
                    <div key={rider.id} className="bg-[#F5F3F0] rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#04473C] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {(rider.name || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1A1C20] truncate">{rider.name}</p>
                          <p className="text-xs text-[#4A4D53]">{rider.phone} · {rider.city}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          rider.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {rider.status || 'active'}
                        </span>
                        <button
                          onClick={() => setSelectedConcernRider(rider)}
                          className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#E5E1DB] hover:bg-amber-50 hover:border-amber-300 transition-colors"
                          title={`Raise concern for ${rider.name}`}
                        >
                          <span className="text-base" aria-hidden="true">⚠️</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[#1A1C20]">Raised Concerns</h4>
              </div>
              {!detail.concerns?.length ? (
                <div className="bg-[#F5F3F0] rounded-xl p-4 text-xs text-[#4A4D53]">
                  No concerns raised for this vendor yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {detail.concerns.slice(0, 10).map(concern => (
                    <div key={concern.id} className="border border-[#E5E1DB] rounded-xl p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[#1A1C20]">{concern.concern_type}</p>
                          <p className="text-xs text-[#4A4D53] mt-1">{concern.rider_name} · {concern.rider_phone}</p>
                          {concern.notes ? <p className="text-xs text-[#4A4D53] mt-2">{concern.notes}</p> : null}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          concern.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {concern.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedConcernRider && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E1DB] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#1A1C20]">Raise Concern</h3>
                <p className="text-xs text-[#4A4D53] mt-1">
                  {selectedConcernRider.name} · {selectedConcernRider.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedConcernRider(null)}
                className="p-2 hover:bg-[#F5F3F0] rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-[#4A4D53]" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <select
                value={concernDrafts[selectedConcernRider.id]?.concern_type || ''}
                onChange={(e) => setConcernDrafts(prev => ({
                  ...prev,
                  [selectedConcernRider.id]: { ...prev[selectedConcernRider.id], concern_type: e.target.value }
                }))}
                className="w-full border border-[#E5E1DB] rounded-lg bg-white text-[#1A1C20] px-3 py-2 text-sm focus:outline-none focus:border-[#04473C]"
              >
                <option value="" className="bg-white text-[#1A1C20]">Select concern</option>
                {concernTypes.map((type) => (
                  <option key={type} value={type} className="bg-white text-[#1A1C20]">{type}</option>
                ))}
              </select>

              <textarea
                value={concernDrafts[selectedConcernRider.id]?.notes || ''}
                onChange={(e) => setConcernDrafts(prev => ({
                  ...prev,
                  [selectedConcernRider.id]: { ...prev[selectedConcernRider.id], notes: e.target.value }
                }))}
                placeholder="Optional note for vendor"
                rows={3}
                className="w-full border border-[#E5E1DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#04473C] resize-none"
              />

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setSelectedConcernRider(null)}
                  className="px-4 py-2 border border-[#E5E1DB] rounded-lg text-sm text-[#4A4D53] hover:bg-[#F5F3F0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const ok = await submitConcern(selectedConcernRider.id);
                    if (ok) setSelectedConcernRider(null);
                  }}
                  disabled={submittingConcernId === selectedConcernRider.id}
                  className="px-4 py-2 bg-[#04473C] text-white rounded-lg text-sm font-medium hover:bg-[#03352D] transition-colors disabled:opacity-50"
                >
                  {submittingConcernId === selectedConcernRider.id ? 'Sending...' : 'Send To Vendor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------
// Main Panel
// ------------------------------------------------------------------
const VendorManagementPanel = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [modalKey, setModalKey] = useState(0); // increment on each open to force fresh remount
  const [selectedVendor, setSelectedVendor] = useState(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/vendors');
      setVendors(res.data.vendors || []);
    } catch {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const handleCreated = (newVendor) => {
    setVendors(prev => [{ ...newVendor, rider_count: 0 }, ...prev]);
  };

  const handleDeleted = (vendorId) => {
    setVendors(prev => prev.filter(v => v.id !== vendorId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#1A1C20]" style={{ fontFamily: 'Playfair Display, serif' }}>
            Vendor Management
          </h2>
          <p className="text-sm text-[#4A4D53] mt-1">
            Vendors distribute daily codes to new riders during onboarding
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchVendors}
            className="p-2 border border-[#E5E1DB] rounded-lg hover:bg-[#F5F3F0] transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-[#4A4D53] ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setModalKey(k => k + 1); setShowCreate(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#04473C] text-white rounded-lg text-sm font-medium hover:bg-[#03352D] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Vendor
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">How vendor codes work</p>
          <p className="text-blue-700">Each vendor has a unique 6-character alphanumeric code that changes every day at midnight. When a new rider applies, they enter their vendor's code. After the admin approves the application, the rider is automatically listed under that vendor.</p>
        </div>
      </div>

      {/* Vendor list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-[#04473C]" />
        </div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-16 bg-[#F5F3F0] rounded-2xl">
          <Store className="w-12 h-12 text-[#C6A87C] mx-auto mb-3" />
          <p className="text-[#1A1C20] font-medium mb-1">No vendors yet</p>
          <p className="text-sm text-[#4A4D53]">Create the first vendor account to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map(vendor => (
            <div
              key={vendor.id}
              className="bg-white border border-[#E5E1DB] rounded-2xl p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedVendor(vendor)}
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#04473C] to-[#065F4E] flex items-center justify-center text-white font-bold">
                    {vendor.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1C20] text-sm">{vendor.name}</p>
                    <p className="text-xs text-[#4A4D53]">{vendor.city}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  vendor.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {vendor.status}
                </span>
              </div>

              {/* Daily code */}
              <div className="bg-[#F5F3F0] rounded-xl p-3 mb-4">
                <p className="text-[10px] text-[#4A4D53] tracking-widest uppercase mb-1">Today's Code</p>
                <p className="font-mono font-bold text-xl text-[#04473C] tracking-[0.2em]">{vendor.daily_code}</p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-[#4A4D53]">
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{vendor.rider_count || 0} riders</span>
                </div>
                <span className="text-[#04473C] font-medium">View details →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateVendorModal key={modalKey} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
      {selectedVendor && (
        <VendorDetailDrawer
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
};

export default VendorManagementPanel;
