// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminSellerAPI } from '../utils/api';
import api from '../utils/api';
import { 
  Users, CheckCircle, X, DollarSign, TrendingUp, 
  Phone, Mail, MapPin, Clock, Plus, Eye, CreditCard, UserPlus, Bell, BellOff
} from 'lucide-react';
import { toast } from 'sonner';

const SellerManagementPanel = () => {
  const [sellers, setSellers] = useState([]);
  const [pendingSellers, setPendingSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(null);
  const [showPayoutModal, setShowPayoutModal] = useState(null);
  
  // Create seller form
  const [newSeller, setNewSeller] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    city: '',
    experience_years: 0
  });
  
  // Deal closure form
  const [dealForm, setDealForm] = useState({
    brokerage_amount: '',
    notes: ''
  });
  
  // Payout form
  const [payoutAmount, setPayoutAmount] = useState('');

  useEffect(() => {
    loadSellers();
    loadPendingSellers();
  }, []);

  const loadSellers = async () => {
    try {
      setLoading(true);
      const response = await adminSellerAPI.getAllSellers();
      setSellers(response.data || []);
    } catch (error) {
      console.error('Failed to load sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingSellers = async () => {
    try {
      const response = await adminSellerAPI.getPendingSellers();
      setPendingSellers(response.data || []);
    } catch (error) {
      console.error('Failed to load pending sellers:', error);
    }
  };

  const handleApprove = async (sellerId, approved, reason = '') => {
    try {
      await adminSellerAPI.approveSeller(sellerId, approved, reason);
      toast.success(approved ? 'Seller approved!' : 'Seller rejected');
      loadSellers();
      loadPendingSellers();
    } catch (error) {
      toast.error('Failed to update seller status');
    }
  };

  const handleCreateSeller = async () => {
    if (!newSeller.name || !newSeller.phone || !newSeller.password) {
      toast.error('Please fill required fields');
      return;
    }
    
    try {
      const response = await adminSellerAPI.createSeller(newSeller);
      toast.success(`Seller created! Referral code: ${response.data.referral_code}`);
      setShowCreateModal(false);
      setNewSeller({ name: '', phone: '', email: '', password: '', city: '', experience_years: 0 });
      loadSellers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create seller');
    }
  };

  const handleCloseDeal = async (visitId) => {
    if (!dealForm.brokerage_amount || dealForm.brokerage_amount < 10000) {
      toast.error('Brokerage amount must be at least ₹10,000');
      return;
    }
    
    try {
      const response = await adminSellerAPI.closeDeal(visitId, parseFloat(dealForm.brokerage_amount), dealForm.notes);
      toast.success(`Deal closed! Commission: ₹${response.data.commission}`);
      setShowDealModal(null);
      setDealForm({ brokerage_amount: '', notes: '' });
      loadSellers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to close deal');
    }
  };

  const handlePayout = async (sellerId) => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      toast.error('Enter valid payout amount');
      return;
    }
    
    try {
      await adminSellerAPI.processSellerPayout(sellerId, parseFloat(payoutAmount));
      toast.success('Payout processed!');
      setShowPayoutModal(null);
      setPayoutAmount('');
      loadSellers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to process payout');
    }
  };

  const stats = {
    total: sellers.length,
    approved: sellers.filter(s => s.approval_status === 'approved').length,
    pending: pendingSellers.length,
    totalEarnings: sellers.reduce((sum, s) => sum + (s.wallet?.total_earnings || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border border-[var(--stitch-line)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl" >
          Seller Management
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="stitch-button flex items-center gap-2"
          data-testid="create-seller-btn"
        >
          <Plus className="w-4 h-4" />
          Add Seller
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[var(--stitch-line)] p-4">
          <p className="text-sm text-[var(--stitch-muted)]">Total Sellers</p>
          <p className="text-2xl font-medium">{stats.total}</p>
        </div>
        <div className="bg-white border border-[var(--stitch-line)] p-4">
          <p className="text-sm text-[var(--stitch-muted)]">Active</p>
          <p className="text-2xl font-medium text-green-600">{stats.approved}</p>
        </div>
        <div className="bg-white border border-[var(--stitch-line)] p-4">
          <p className="text-sm text-[var(--stitch-muted)]">Pending Approval</p>
          <p className="text-2xl font-medium text-[var(--stitch-muted)]">{stats.pending}</p>
        </div>
        <div className="bg-white border border-[var(--stitch-line)] p-4">
          <p className="text-sm text-[var(--stitch-muted)]">Total Commissions</p>
          <p className="text-2xl font-medium text-[var(--stitch-ink)]">₹{stats.totalEarnings.toLocaleString()}</p>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveView('all')}
          className={`px-4 py-2 text-sm font-medium border ${
            activeView === 'all' ? 'bg-[var(--stitch-ink)] text-white border-[var(--stitch-ink)]' : 'border-[var(--stitch-line)]'
          }`}
        >
          All Sellers ({sellers.length})
        </button>
        <button
          onClick={() => setActiveView('pending')}
          className={`px-4 py-2 text-sm font-medium border ${
            activeView === 'pending' ? 'bg-[var(--stitch-muted)] text-white border-[var(--stitch-muted)]' : 'border-[var(--stitch-line)]'
          }`}
        >
          Pending Approval ({pendingSellers.length})
        </button>
      </div>

      {/* Pending Approvals */}
      {activeView === 'pending' && (
        <div className="space-y-4">
          {pendingSellers.length === 0 ? (
            <div className="bg-white border border-[var(--stitch-line)] p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-[var(--stitch-muted)]">No pending approvals</p>
            </div>
          ) : (
            pendingSellers.map((seller) => (
              <motion.div
                key={seller.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-[var(--stitch-line)] p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-lg">{seller.name}</h3>
                    <p className="text-sm text-[var(--stitch-muted)] flex items-center gap-2">
                      <Phone className="w-3 h-3" /> {seller.phone}
                    </p>
                    {seller.email && (
                      <p className="text-sm text-[var(--stitch-muted)] flex items-center gap-2">
                        <Mail className="w-3 h-3" /> {seller.email}
                      </p>
                    )}
                    <p className="text-sm text-[var(--stitch-muted)] flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> {seller.city || 'Not specified'}
                    </p>
                    <p className="text-xs text-[var(--stitch-muted)] mt-2">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Applied: {new Date(seller.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(seller.id, true)}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium hover:bg-green-700"
                      data-testid={`approve-${seller.id}`}
                    >
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason:');
                        if (reason) handleApprove(seller.id, false, reason);
                      }}
                      className="px-4 py-2 border border-red-500 text-red-600 text-sm font-medium hover:bg-red-50"
                      data-testid={`reject-${seller.id}`}
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* All Sellers */}
      {activeView === 'all' && (
        <div className="space-y-4">
          {sellers.filter(s => s.approval_status === 'approved').map((seller) => (
            <motion.div
              key={seller.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white border border-[var(--stitch-line)] p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[var(--stitch-ink)] text-white flex items-center justify-center text-lg font-medium">
                    {seller.name?.[0] || 'S'}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{seller.name}</h3>
                    <p className="text-sm text-[var(--stitch-muted)]">{seller.phone}</p>
                    <p className="text-xs text-[var(--stitch-ink)] font-medium">Code: {seller.referral_code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium">
                    ACTIVE
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 mb-3 p-3 bg-[var(--stitch-soft)]">
                <div>
                  <p className="text-xs text-[var(--stitch-muted)]">Referrals</p>
                  <p className="font-medium">{seller.stats?.total_referrals || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--stitch-muted)]">Converted</p>
                  <p className="font-medium text-[var(--stitch-ink)]">{seller.stats?.converted || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--stitch-muted)]">Deals</p>
                  <p className="font-medium text-[var(--stitch-muted)]">{seller.stats?.deals_closed || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--stitch-muted)]">Earnings</p>
                  <p className="font-medium text-green-600">₹{seller.wallet?.total_earnings?.toLocaleString() || 0}</p>
                </div>
              </div>

              {/* Lead Access Toggle */}
              <div className="flex items-center justify-between py-2 border-t border-[var(--stitch-line)]">
                <div className="flex items-center gap-2">
                  {seller.admin_lead_enabled ? (
                    <Bell className="w-4 h-4 text-green-600" />
                  ) : (
                    <BellOff className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm text-[var(--stitch-muted)]">Receive Leads</span>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await api.patch(`/admin/sellers/${seller.id}/lead-access`, null, {
                        params: { enable: !seller.admin_lead_enabled }
                      });
                      toast.success(seller.admin_lead_enabled ? 'Lead access disabled' : 'Lead access enabled');
                      loadSellers();
                    } catch (error) {
                      toast.error('Failed to update lead access');
                    }
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    seller.admin_lead_enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-[var(--stitch-muted)]'
                  }`}
                >
                  {seller.admin_lead_enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPayoutModal(seller)}
                  disabled={!seller.wallet?.approved_earnings}
                  className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1 ${
                    seller.wallet?.approved_earnings > 0
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 text-[var(--stitch-muted)] cursor-not-allowed'
                  }`}
                  data-testid={`payout-${seller.id}`}
                >
                  <CreditCard className="w-4 h-4" />
                  Payout (₹{seller.wallet?.approved_earnings?.toLocaleString() || 0})
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Seller Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md">
            <div className="p-4 border-b border-[var(--stitch-line)] flex items-center justify-between">
              <h3 className="text-lg font-medium">Create New Seller</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-[var(--stitch-soft)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="stitch-eyebrow">Name *</label>
                <input
                  type="text"
                  value={newSeller.name}
                  onChange={(e) => setNewSeller({ ...newSeller, name: e.target.value })}
                  className="stitch-input"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="stitch-eyebrow">Phone *</label>
                <input
                  type="text"
                  value={newSeller.phone}
                  onChange={(e) => setNewSeller({ ...newSeller, phone: e.target.value })}
                  className="stitch-input"
                  placeholder="10-digit phone"
                />
              </div>
              <div>
                <label className="stitch-eyebrow">Email</label>
                <input
                  type="email"
                  value={newSeller.email}
                  onChange={(e) => setNewSeller({ ...newSeller, email: e.target.value })}
                  className="stitch-input"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="stitch-eyebrow">Password *</label>
                <input
                  type="password"
                  value={newSeller.password}
                  onChange={(e) => setNewSeller({ ...newSeller, password: e.target.value })}
                  className="stitch-input"
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div>
                <label className="stitch-eyebrow">City</label>
                <input
                  type="text"
                  value={newSeller.city}
                  onChange={(e) => setNewSeller({ ...newSeller, city: e.target.value })}
                  className="stitch-input"
                  placeholder="City name"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateSeller}
                  className="stitch-button flex-1"
                >
                  Create Seller
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="stitch-button stitch-button-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm">
            <div className="p-4 border-b border-[var(--stitch-line)]">
              <h3 className="text-lg font-medium">Process Payout</h3>
              <p className="text-sm text-[var(--stitch-muted)]">Seller: {showPayoutModal.name}</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-[var(--stitch-soft)] p-3">
                <p className="text-sm text-[var(--stitch-muted)]">Available for payout</p>
                <p className="text-2xl font-medium text-green-600">
                  ₹{showPayoutModal.wallet?.approved_earnings?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <label className="stitch-eyebrow">Payout Amount</label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  max={showPayoutModal.wallet?.approved_earnings || 0}
                  className="stitch-input"
                  placeholder="Enter amount"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handlePayout(showPayoutModal.id)}
                  className="stitch-button flex-1"
                >
                  Process Payout
                </button>
                <button
                  onClick={() => { setShowPayoutModal(null); setPayoutAmount(''); }}
                  className="stitch-button stitch-button-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerManagementPanel;
