import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { sellerAPI, getMediaUrl } from '../utils/api';
import api from '../utils/api';
import { 
  Users, Home, DollarSign, LogOut, Share2, MessageCircle, 
  MapPin, Phone, Clock, TrendingUp, Wallet, Search, 
  Filter, Send, X, ExternalLink, CheckCircle, AlertCircle,
  Navigation, RefreshCw, Copy, Eye, ClipboardList, Plus, Calendar,
  PhoneCall, UserCheck, XCircle, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

const FOLLOWUP_STATUSES = [
  { value: 'new_lead', label: 'New Lead', color: 'bg-blue-100 text-blue-800' },
  { value: 'contacted', label: 'Contacted', color: 'bg-purple-100 text-purple-800' },
  { value: 'interested', label: 'Interested', color: 'bg-green-100 text-green-800' },
  { value: 'not_interested', label: 'Not Interested', color: 'bg-red-100 text-red-800' },
  { value: 'callback', label: 'Callback', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'negotiating', label: 'Negotiating', color: 'bg-orange-100 text-orange-800' },
  { value: 'site_visit_scheduled', label: 'Visit Scheduled', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'site_visit_done', label: 'Visit Done', color: 'bg-teal-100 text-teal-800' },
  { value: 'deal_in_progress', label: 'Deal in Progress', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'closed_won', label: 'Closed Won', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'closed_lost', label: 'Closed Lost', color: 'bg-gray-100 text-gray-800' },
];

const SellerDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Dashboard data
  const [dashboard, setDashboard] = useState(null);
  
  // Properties
  const [properties, setProperties] = useState([]);
  const [propertyFilters, setPropertyFilters] = useState({ city: '', min_rent: '', max_rent: '', bhk: '' });
  
  // Referrals
  const [referrals, setReferrals] = useState([]);
  
  // Visits
  const [visits, setVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  
  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef(null);
  
  // Commissions
  const [commissions, setCommissions] = useState(null);

  // Share modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareProperty, setShareProperty] = useState(null);
  const [shareData, setShareData] = useState(null);
  
  // Follow-ups
  const [followups, setFollowups] = useState([]);
  const [followupStats, setFollowupStats] = useState(null);
  const [showAddFollowup, setShowAddFollowup] = useState(false);
  const [showUpdateFollowup, setShowUpdateFollowup] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [newFollowup, setNewFollowup] = useState({
    client_name: '',
    client_phone: '',
    status: 'new_lead',
    notes: '',
    next_followup_date: '',
    call_duration_mins: '',
    client_budget: '',
    client_requirements: ''
  });
  const [updateData, setUpdateData] = useState({
    status: '',
    notes: '',
    next_followup_date: '',
    call_duration_mins: ''
  });
  const [closeData, setCloseData] = useState({
    outcome: '',
    final_notes: '',
    brokerage_amount: '',
    loss_reason: ''
  });
  
  useEffect(() => {
    if (user?.approval_status === 'approved') {
      loadDashboard();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'properties') loadProperties();
    if (activeTab === 'referrals') loadReferrals();
    if (activeTab === 'visits') loadVisits();
    if (activeTab === 'earnings') loadCommissions();
    if (activeTab === 'followups') loadFollowups();
  }, [activeTab]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await sellerAPI.getDashboard();
      setDashboard(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      if (error.response?.status === 403) {
        toast.error('Account pending approval');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      const cleanFilters = {};
      if (propertyFilters.city) cleanFilters.city = propertyFilters.city;
      if (propertyFilters.min_rent) cleanFilters.min_rent = propertyFilters.min_rent;
      if (propertyFilters.max_rent) cleanFilters.max_rent = propertyFilters.max_rent;
      if (propertyFilters.bhk) cleanFilters.bhk = propertyFilters.bhk;
      
      const response = await sellerAPI.getProperties(cleanFilters);
      setProperties(response.data || []);
    } catch (error) {
      toast.error('Failed to load properties');
    }
  };

  const loadReferrals = async () => {
    try {
      const response = await sellerAPI.getReferrals();
      setReferrals(response.data || []);
    } catch (error) {
      toast.error('Failed to load referrals');
    }
  };

  const loadVisits = async () => {
    try {
      const response = await sellerAPI.getVisits();
      setVisits(response.data || []);
    } catch (error) {
      toast.error('Failed to load visits');
    }
  };

  const loadCommissions = async () => {
    try {
      const response = await sellerAPI.getCommissions();
      setCommissions(response.data);
    } catch (error) {
      toast.error('Failed to load commissions');
    }
  };

  // Follow-up functions
  const loadFollowups = async () => {
    try {
      const response = await api.get('/seller/followups');
      setFollowups(response.data.followups || []);
      setFollowupStats(response.data.stats);
    } catch (error) {
      toast.error('Failed to load follow-ups');
    }
  };

  const handleCreateFollowup = async () => {
    if (!newFollowup.client_name || !newFollowup.client_phone || !newFollowup.notes) {
      toast.error('Please fill in client name, phone and notes');
      return;
    }
    if (newFollowup.notes.length < 10) {
      toast.error('Notes must be at least 10 characters');
      return;
    }

    try {
      await api.post('/seller/followups', {
        ...newFollowup,
        client_budget: newFollowup.client_budget ? parseFloat(newFollowup.client_budget) : null,
        call_duration_mins: newFollowup.call_duration_mins ? parseInt(newFollowup.call_duration_mins) : null
      });
      toast.success('Follow-up created successfully');
      setShowAddFollowup(false);
      setNewFollowup({
        client_name: '',
        client_phone: '',
        status: 'new_lead',
        notes: '',
        next_followup_date: '',
        call_duration_mins: '',
        client_budget: '',
        client_requirements: ''
      });
      loadFollowups();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create follow-up');
    }
  };

  const handleUpdateFollowup = async () => {
    if (!updateData.notes || updateData.notes.length < 10) {
      toast.error('Notes must be at least 10 characters');
      return;
    }

    try {
      await api.put(`/seller/followups/${selectedFollowup.id}`, {
        ...updateData,
        call_duration_mins: updateData.call_duration_mins ? parseInt(updateData.call_duration_mins) : null
      });
      toast.success('Follow-up updated successfully');
      setShowUpdateFollowup(false);
      setSelectedFollowup(null);
      loadFollowups();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update follow-up');
    }
  };

  const handleCloseLead = async () => {
    if (!closeData.final_notes || closeData.final_notes.length < 20) {
      toast.error('Final notes must be at least 20 characters');
      return;
    }
    if (closeData.outcome === 'closed_won' && !closeData.brokerage_amount) {
      toast.error('Brokerage amount is required for won deals');
      return;
    }
    if (closeData.outcome === 'closed_lost' && (!closeData.loss_reason || closeData.loss_reason.length < 10)) {
      toast.error('Loss reason (min 10 chars) is required for lost deals');
      return;
    }

    try {
      const response = await api.post(`/seller/followups/${selectedFollowup.id}/close`, {
        followup_id: selectedFollowup.id,
        outcome: closeData.outcome,
        final_notes: closeData.final_notes,
        brokerage_amount: closeData.outcome === 'closed_won' ? parseFloat(closeData.brokerage_amount) : null,
        loss_reason: closeData.outcome === 'closed_lost' ? closeData.loss_reason : null
      });
      
      if (closeData.outcome === 'closed_won') {
        toast.success(`Deal closed! Commission: ₹${response.data.commission_amount}`);
      } else {
        toast.info('Lead marked as lost');
      }
      
      setShowCloseModal(false);
      setSelectedFollowup(null);
      setCloseData({ outcome: '', final_notes: '', brokerage_amount: '', loss_reason: '' });
      loadFollowups();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to close lead');
    }
  };

  const getStatusBadge = (status) => {
    const statusObj = FOLLOWUP_STATUSES.find(s => s.value === status);
    return statusObj || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const handleShareProperty = async (property) => {
    try {
      const response = await sellerAPI.shareProperty({ property_id: property.id });
      setShareData(response.data);
      setShareProperty(property);
      setShowShareModal(true);
    } catch (error) {
      toast.error('Failed to generate share link');
    }
  };

  const getShareLink = () => {
    if (shareData && shareProperty) {
      // Use public property URL (no auth required)
      return `${window.location.origin}/property/${shareProperty.id}${shareData.share_url}`;
    }
    return '';
  };

  const getShareMessage = () => {
    if (shareData) {
      const appUrl = window.location.origin;
      return shareData.whatsapp_message.replace('{APP_URL}', appUrl);
    }
    return '';
  };

  const handleNativeShare = async () => {
    const link = getShareLink();
    const message = getShareMessage();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareProperty?.title || 'Property on ApnaGhr',
          text: message,
          url: link
        });
        toast.success('Shared successfully!');
        setShowShareModal(false);
      } catch (error) {
        if (error.name !== 'AbortError') {
          // User cancelled, not an error
          console.log('Share cancelled');
        }
      }
    } else {
      // Fallback for browsers without native share
      openWhatsApp();
    }
  };

  const openWhatsApp = () => {
    const message = getShareMessage();
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
    setShowShareModal(false);
  };

  const openTelegram = () => {
    const link = getShareLink();
    const message = getShareMessage();
    window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`, '_blank');
    setShowShareModal(false);
  };

  const openSMS = () => {
    const message = getShareMessage();
    window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
    setShowShareModal(false);
  };

  const copyShareLink = () => {
    const link = getShareLink();
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  const handleTrackVisit = async (visit) => {
    try {
      setSelectedVisit(visit);
      const response = await sellerAPI.trackVisit(visit.id);
      setTrackingData(response.data);
    } catch (error) {
      toast.error('Failed to load tracking info');
    }
  };

  const openChat = async (visit) => {
    try {
      setSelectedVisit(visit);
      const response = await sellerAPI.getChatMessages(visit.id);
      setChatMessages(response.data || []);
      setShowChat(true);
    } catch (error) {
      toast.error('Failed to load chat');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedVisit) return;
    
    try {
      await sellerAPI.sendChatMessage(selectedVisit.id, newMessage);
      setChatMessages([...chatMessages, {
        id: Date.now(),
        sender_id: user.id,
        sender_role: 'seller',
        message: newMessage,
        created_at: new Date().toISOString()
      }]);
      setNewMessage('');
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  // Pending approval state
  if (user?.approval_status === 'pending') {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6">
        <div className="bg-white border border-[#E5E1DB] p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-[#C6A87C] mx-auto mb-4" />
          <h2 className="text-2xl mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Account Pending Approval</h2>
          <p className="text-[#4A4D53] mb-6">Your seller account is being reviewed by our team. You'll be notified once approved.</p>
          <button onClick={logout} className="btn-secondary">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (user?.approval_status === 'rejected') {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6">
        <div className="bg-white border border-[#E5E1DB] p-8 max-w-md text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Account Rejected</h2>
          <p className="text-[#4A4D53] mb-2">Your seller account application was not approved.</p>
          {user.rejection_reason && (
            <p className="text-sm text-red-600 mb-6">Reason: {user.rejection_reason}</p>
          )}
          <button onClick={logout} className="btn-secondary">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24">
      {/* Header with Seller Profile */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Seller Profile Photo */}
              <div className="relative">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#C6A87C] shadow-lg">
                  <img 
                    src={user?.profile_photo || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop`}
                    alt={user?.name || 'Seller'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'S')}&background=C6A87C&color=1A1C20&size=100`;
                    }}
                  />
                </div>
                {/* ApnaGhr Badge */}
                <div className="absolute -bottom-1 -right-1 bg-[#C6A87C] text-[#1A1C20] text-[8px] font-bold px-1.5 py-0.5 rounded-sm shadow-md">
                  PRO
                </div>
              </div>
              <div>
                <h1 className="text-xl tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Apna<span className="text-[#04473C]">Ghr</span>
                  <span className="ml-2 text-[10px] bg-[#C6A87C] text-[#1A1C20] px-2 py-0.5 tracking-wider align-middle">SELLER</span>
                </h1>
                <p className="text-sm text-[#4A4D53]">Welcome, <span className="font-medium text-[#04473C]">{user?.name}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="px-4 py-2 bg-gradient-to-r from-[#04473C] to-[#065F4E] text-white text-sm font-medium flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Code: <span className="font-bold">{user?.referral_code || dashboard?.referral_code}</span>
              </motion.div>
              <button onClick={logout} className="p-2 hover:bg-[#F5F3F0] transition-colors rounded-full" data-testid="logout-button">
                <LogOut className="w-5 h-5 text-[#4A4D53]" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-[#E5E1DB]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Overview', icon: TrendingUp },
              { id: 'followups', label: 'Follow-ups', icon: ClipboardList },
              { id: 'properties', label: 'Properties', icon: Home },
              { id: 'referrals', label: 'My Referrals', icon: Users },
              { id: 'visits', label: 'Client Visits', icon: MapPin },
              { id: 'earnings', label: 'Earnings', icon: Wallet },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-[#04473C] border-b-2 border-[#04473C]'
                    : 'text-[#4A4D53] hover:text-[#1A1C20]'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="w-4 h-4" strokeWidth={1.5} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Banner - Work From Home Earning */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden mb-6 rounded-2xl"
        >
          <div className="grid md:grid-cols-2 bg-gradient-to-br from-[#04473C] via-[#065f4e] to-[#087f5b]">
            {/* Left Side - Earnings Info */}
            <div className="p-8 text-white">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-white/80">Work From Home • Flexible Hours</span>
              </div>
              <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                Earn ₹50,000+ Monthly
              </h2>
              <p className="text-white/80 mb-6">Share properties with your network and earn commissions on every successful deal</p>
              
              {/* Earnings Breakdown */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-[#C6A87C]">₹5,000</div>
                  <div className="text-sm text-white/70">Per Rental Deal</div>
                  <div className="text-xs text-white/50 mt-1">After payment done</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-[#C6A87C]">₹10,000</div>
                  <div className="text-sm text-white/70">Per Sale Deal</div>
                  <div className="text-xs text-white/50 mt-1">After payment done</div>
                </div>
              </div>
              
              {/* How It Works */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-[#C6A87C] rounded-full flex items-center justify-center text-[#04473C] font-bold text-xs">1</div>
                  <span>Share property links with your contacts</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-[#C6A87C] rounded-full flex items-center justify-center text-[#04473C] font-bold text-xs">2</div>
                  <span>Client visits & finalizes the property</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-[#C6A87C] rounded-full flex items-center justify-center text-[#04473C] font-bold text-xs">3</div>
                  <span>Get paid when deal payment is complete</span>
                </div>
              </div>
            </div>
            
            {/* Right Side - Image */}
            <div className="hidden md:block relative">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80"
                alt="Work from home earning"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#04473C]/50" />
              
              {/* Floating Stats */}
              <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#04473C] rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#04473C]">500+</div>
                    <div className="text-xs text-gray-500">Active Sellers Earning</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-[#04473C] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : dashboard ? (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white border border-[#E5E1DB] p-6">
                    <p className="text-sm text-[#4A4D53] uppercase tracking-wide">Total Referrals</p>
                    <p className="text-3xl font-medium mt-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {dashboard.stats?.total_referrals || 0}
                    </p>
                  </div>
                  <div className="bg-white border border-[#E5E1DB] p-6">
                    <p className="text-sm text-[#4A4D53] uppercase tracking-wide">Converted</p>
                    <p className="text-3xl font-medium mt-2 text-[#04473C]" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {dashboard.stats?.converted_referrals || 0}
                    </p>
                  </div>
                  <div className="bg-white border border-[#E5E1DB] p-6">
                    <p className="text-sm text-[#4A4D53] uppercase tracking-wide">Deals Closed</p>
                    <p className="text-3xl font-medium mt-2 text-[#C6A87C]" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {dashboard.stats?.closed_deals || 0}
                    </p>
                  </div>
                  <div className="bg-white border border-[#E5E1DB] p-6">
                    <p className="text-sm text-[#4A4D53] uppercase tracking-wide">Conversion Rate</p>
                    <p className="text-3xl font-medium mt-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {dashboard.stats?.conversion_rate || 0}%
                    </p>
                  </div>
                </div>

                {/* Wallet Summary */}
                {dashboard.wallet && (
                  <div className="bg-[#04473C] text-white p-6 mb-8">
                    <h3 className="text-lg mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Your Earnings</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-white/70">Total Earned</p>
                        <p className="text-2xl font-medium">₹{dashboard.wallet.total_earnings?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Pending</p>
                        <p className="text-2xl font-medium text-[#C6A87C]">₹{dashboard.wallet.pending_earnings?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Approved</p>
                        <p className="text-2xl font-medium text-green-400">₹{dashboard.wallet.approved_earnings?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Paid Out</p>
                        <p className="text-2xl font-medium">₹{dashboard.wallet.paid_earnings?.toLocaleString() || 0}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Referrals */}
                <div className="bg-white border border-[#E5E1DB] p-6">
                  <h3 className="text-lg mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Recent Referrals</h3>
                  {dashboard.recent_referrals?.length > 0 ? (
                    <div className="space-y-3">
                      {dashboard.recent_referrals.slice(0, 5).map((ref) => (
                        <div key={ref.id} className="flex items-center justify-between p-3 bg-[#F5F3F0]">
                          <div>
                            <p className="font-medium">{ref.client_name || 'Pending'}</p>
                            <p className="text-sm text-[#4A4D53]">{ref.property?.title || 'Property'}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium ${
                            ref.status === 'deal_closed' ? 'bg-green-100 text-green-700' :
                            ref.status === 'booked' ? 'bg-blue-100 text-blue-700' :
                            ref.status === 'registered' ? 'bg-[#C6A87C]/20 text-[#C6A87C]' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {ref.status?.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#4A4D53] text-center py-8">No referrals yet. Start sharing properties!</p>
                  )}
                </div>
              </>
            ) : null}
          </motion.div>
        )}

        {/* Follow-ups Tab */}
        {activeTab === 'followups' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Stats Cards */}
            {followupStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-[#E5E1DB] p-4">
                  <p className="text-xs text-[#4A4D53] uppercase tracking-wide">Total Leads</p>
                  <p className="text-2xl font-bold text-[#1A1C20]">{followupStats.total}</p>
                </div>
                <div className="bg-white border border-[#E5E1DB] p-4">
                  <p className="text-xs text-[#4A4D53] uppercase tracking-wide">Active</p>
                  <p className="text-2xl font-bold text-blue-600">{followupStats.active}</p>
                </div>
                <div className="bg-white border border-[#E5E1DB] p-4">
                  <p className="text-xs text-[#4A4D53] uppercase tracking-wide">Won</p>
                  <p className="text-2xl font-bold text-green-600">{followupStats.closed_won}</p>
                </div>
                <div className="bg-white border border-[#E5E1DB] p-4">
                  <p className="text-xs text-[#4A4D53] uppercase tracking-wide">Conversion</p>
                  <p className="text-2xl font-bold text-[#04473C]">{followupStats.conversion_rate}%</p>
                </div>
              </div>
            )}

            {/* Add New Follow-up Button */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-[#1A1C20]">Client Follow-ups</h2>
              <button
                onClick={() => setShowAddFollowup(true)}
                className="btn-primary flex items-center gap-2"
                data-testid="add-followup-btn"
              >
                <Plus className="w-4 h-4" />
                Add New Lead
              </button>
            </div>

            {/* Follow-ups List */}
            <div className="space-y-4">
              {followups.length > 0 ? (
                followups.map((fu) => {
                  const statusBadge = getStatusBadge(fu.status);
                  return (
                    <div key={fu.id} className="bg-white border border-[#E5E1DB] p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-[#1A1C20]">{fu.client_name}</h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusBadge.color}`}>
                              {statusBadge.label}
                            </span>
                            {fu.is_closed && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                                CLOSED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-[#4A4D53]">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" />
                              {fu.client_phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <PhoneCall className="w-3.5 h-3.5" />
                              {fu.total_followups} calls
                            </span>
                            {fu.next_followup_date && (
                              <span className="flex items-center gap-1 text-orange-600">
                                <Calendar className="w-3.5 h-3.5" />
                                Next: {new Date(fu.next_followup_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {fu.client_budget && (
                            <p className="text-sm text-[#04473C] mt-1">Budget: ₹{fu.client_budget.toLocaleString()}</p>
                          )}
                        </div>
                        
                        {/* Actions */}
                        {!fu.is_closed && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedFollowup(fu);
                                setUpdateData({
                                  status: fu.status,
                                  notes: '',
                                  next_followup_date: fu.next_followup_date || '',
                                  call_duration_mins: ''
                                });
                                setShowUpdateFollowup(true);
                              }}
                              className="px-3 py-1.5 text-sm bg-[#04473C] text-white hover:bg-[#033830] transition-colors"
                              data-testid={`update-followup-${fu.id}`}
                            >
                              Add Update
                            </button>
                            <button
                              onClick={() => {
                                setSelectedFollowup(fu);
                                setCloseData({ outcome: '', final_notes: '', brokerage_amount: '', loss_reason: '' });
                                setShowCloseModal(true);
                              }}
                              className="px-3 py-1.5 text-sm border border-[#04473C] text-[#04473C] hover:bg-[#04473C] hover:text-white transition-colors"
                              data-testid={`close-lead-${fu.id}`}
                            >
                              Close Lead
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Recent History */}
                      {fu.history && fu.history.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[#E5E1DB]">
                          <p className="text-xs font-medium text-[#4A4D53] mb-2">RECENT ACTIVITY</p>
                          <div className="space-y-2">
                            {fu.history.slice(-3).reverse().map((entry, idx) => (
                              <div key={idx} className="text-sm flex items-start gap-2">
                                <div className={`w-2 h-2 mt-1.5 rounded-full ${
                                  entry.status === 'closed_won' ? 'bg-green-500' :
                                  entry.status === 'closed_lost' ? 'bg-red-500' :
                                  'bg-blue-500'
                                }`} />
                                <div>
                                  <span className="font-medium">{getStatusBadge(entry.status).label}</span>
                                  <span className="text-[#4A4D53]"> - {entry.notes?.slice(0, 100)}{entry.notes?.length > 100 ? '...' : ''}</span>
                                  <span className="text-xs text-[#9CA3AF] ml-2">
                                    {new Date(entry.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-white border border-[#E5E1DB] p-12 text-center">
                  <ClipboardList className="w-12 h-12 text-[#D0C9C0] mx-auto mb-3" />
                  <p className="text-[#4A4D53]">No follow-ups yet. Add your first lead!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Filters */}
            <div className="bg-white border border-[#E5E1DB] p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={propertyFilters.city}
                  onChange={(e) => setPropertyFilters({ ...propertyFilters, city: e.target.value })}
                  className="premium-input py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Min Rent"
                  value={propertyFilters.min_rent}
                  onChange={(e) => setPropertyFilters({ ...propertyFilters, min_rent: e.target.value })}
                  className="premium-input py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Max Rent"
                  value={propertyFilters.max_rent}
                  onChange={(e) => setPropertyFilters({ ...propertyFilters, max_rent: e.target.value })}
                  className="premium-input py-2 text-sm"
                />
                <select
                  value={propertyFilters.bhk}
                  onChange={(e) => setPropertyFilters({ ...propertyFilters, bhk: e.target.value })}
                  className="premium-input py-2 text-sm"
                >
                  <option value="">All BHK</option>
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4">4+ BHK</option>
                </select>
                <button onClick={loadProperties} className="btn-primary py-2 text-sm">
                  <Search className="w-4 h-4 mr-1" /> Search
                </button>
              </div>
            </div>

            {/* Property Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div key={property.id} className="bg-white border border-[#E5E1DB] overflow-hidden group">
                  <div 
                    className="aspect-[4/3] bg-[#F5F3F0] cursor-pointer relative"
                    onClick={() => window.open(`/property/${property.id}`, '_blank')}
                  >
                    {property.images?.[0] ? (
                      <img
                        src={getMediaUrl(property.images[0])}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-12 h-12 text-[#D0C9C0]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Eye className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 
                      className="font-medium text-lg mb-1 cursor-pointer hover:text-[#04473C]"
                      onClick={() => window.open(`/property/${property.id}`, '_blank')}
                    >
                      {property.title}
                    </h3>
                    <p className="text-sm text-[#4A4D53] mb-2">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {property.area_name}, {property.city}
                    </p>
                    <p className="text-sm text-[#4A4D53] mb-3">
                      {property.bhk} BHK | {property.furnishing}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="price-display">
                        <span className="price-currency text-sm">₹</span>
                        {property.rent?.toLocaleString()}/mo
                      </p>
                      <button
                        onClick={() => handleShareProperty(property)}
                        className="btn-primary py-2 px-4 text-sm flex items-center gap-1"
                        data-testid={`share-${property.id}`}
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Referrals Tab - Enhanced with Visit Tracking */}
        {activeTab === 'referrals' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-[#E5E1DB] p-4 text-center">
                <div className="text-2xl font-bold text-[#04473C]">{referrals.length}</div>
                <div className="text-xs text-[#4A4D53]">Total Leads</div>
              </div>
              <div className="bg-white border border-[#E5E1DB] p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{referrals.filter(r => r.status === 'booked').length}</div>
                <div className="text-xs text-[#4A4D53]">Visits Booked</div>
              </div>
              <div className="bg-white border border-[#E5E1DB] p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{referrals.filter(r => r.status === 'visited').length}</div>
                <div className="text-xs text-[#4A4D53]">Visits Done</div>
              </div>
              <div className="bg-white border border-[#E5E1DB] p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{referrals.filter(r => r.status === 'deal_closed').length}</div>
                <div className="text-xs text-[#4A4D53]">Deals Closed</div>
              </div>
            </div>

            <div className="space-y-4">
              {referrals.length === 0 ? (
                <div className="bg-white border border-[#E5E1DB] p-12 text-center">
                  <Users className="w-12 h-12 text-[#D0C9C0] mx-auto mb-3" />
                  <p className="text-[#4A4D53]">No referrals yet</p>
                  <p className="text-sm text-[#4A4D53] mt-1">Share properties to start tracking referrals</p>
                </div>
              ) : (
                referrals.map((ref) => (
                  <div key={ref.id} className="bg-white border border-[#E5E1DB] overflow-hidden">
                    {/* Status Progress Bar */}
                    <div className="h-1 bg-gray-100">
                      <div 
                        className={`h-full transition-all ${
                          ref.status === 'deal_closed' ? 'w-full bg-green-500' :
                          ref.status === 'visited' ? 'w-3/4 bg-blue-500' :
                          ref.status === 'booked' ? 'w-1/2 bg-[#C6A87C]' :
                          ref.status === 'registered' ? 'w-1/4 bg-purple-500' :
                          'w-[10%] bg-gray-300'
                        }`}
                      />
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#04473C] to-[#065f4e] text-white rounded-full flex items-center justify-center font-bold text-lg">
                              {ref.client_name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-bold text-lg">{ref.client_name || 'Pending Conversion'}</p>
                              {ref.client_phone && (
                                <a href={`tel:${ref.client_phone}`} className="text-sm text-[#04473C] hover:underline flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {ref.client_phone}
                                </a>
                              )}
                            </div>
                          </div>
                          
                          {ref.property && (
                            <div className="bg-[#F5F3F0] p-3 rounded-lg mb-3">
                              <p className="text-sm font-medium">
                                <Home className="w-4 h-4 inline mr-1 text-[#04473C]" />
                                {ref.property.title}
                              </p>
                              <p className="text-sm text-[#4A4D53]">
                                {ref.property.area_name}, {ref.property.city} • ₹{ref.property.rent?.toLocaleString()}/mo
                              </p>
                            </div>
                          )}
                          
                          {/* Visit Status Timeline */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                              ref.status === 'shared' || ref.status === 'clicked' ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-400'
                            }`}>
                              <Share2 className="w-3 h-3" /> Shared
                            </div>
                            <ArrowRight className="w-3 h-3 text-gray-300" />
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                              ref.status === 'registered' ? 'bg-purple-100 text-purple-700' : 
                              ['booked', 'visited', 'deal_closed'].includes(ref.status) ? 'bg-purple-50 text-purple-400' :
                              'bg-gray-50 text-gray-400'
                            }`}>
                              <UserCheck className="w-3 h-3" /> Registered
                            </div>
                            <ArrowRight className="w-3 h-3 text-gray-300" />
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                              ref.status === 'booked' ? 'bg-[#C6A87C]/30 text-[#8B6914] font-medium' : 
                              ['visited', 'deal_closed'].includes(ref.status) ? 'bg-[#C6A87C]/20 text-[#C6A87C]' :
                              'bg-gray-50 text-gray-400'
                            }`}>
                              <Calendar className="w-3 h-3" /> Visit Booked
                            </div>
                            <ArrowRight className="w-3 h-3 text-gray-300" />
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                              ref.status === 'visited' ? 'bg-blue-100 text-blue-700 font-medium' : 
                              ref.status === 'deal_closed' ? 'bg-blue-50 text-blue-400' :
                              'bg-gray-50 text-gray-400'
                            }`}>
                              <MapPin className="w-3 h-3" /> Visited
                            </div>
                            <ArrowRight className="w-3 h-3 text-gray-300" />
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                              ref.status === 'deal_closed' ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-50 text-gray-400'
                            }`}>
                              <CheckCircle className="w-3 h-3" /> Deal Closed
                            </div>
                          </div>
                          
                          {/* Visit Details if booked */}
                          {ref.visit_details && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm font-medium text-blue-800 mb-1">
                                📅 Visit Scheduled
                              </p>
                              <p className="text-sm text-blue-700">
                                {ref.visit_details.scheduled_date} at {ref.visit_details.scheduled_time}
                              </p>
                              {ref.visit_details.rider_name && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Rider: {ref.visit_details.rider_name}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right ml-4">
                          <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                            ref.status === 'deal_closed' ? 'bg-green-100 text-green-700' :
                            ref.status === 'visited' ? 'bg-blue-100 text-blue-700' :
                            ref.status === 'booked' ? 'bg-[#C6A87C]/30 text-[#8B6914]' :
                            ref.status === 'registered' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {ref.status?.replace('_', ' ').toUpperCase()}
                          </span>
                          {ref.commission_amount && (
                            <p className="text-xl font-bold text-green-600 mt-3">
                              +₹{ref.commission_amount.toLocaleString()}
                            </p>
                          )}
                          <p className="text-xs text-[#4A4D53] mt-2">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(ref.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Visits Tab */}
        {activeTab === 'visits' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Client Visits</h3>
              <button onClick={loadVisits} className="p-2 hover:bg-[#F5F3F0]">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {visits.length === 0 ? (
                <div className="bg-white border border-[#E5E1DB] p-12 text-center">
                  <MapPin className="w-12 h-12 text-[#D0C9C0] mx-auto mb-3" />
                  <p className="text-[#4A4D53]">No client visits yet</p>
                </div>
              ) : (
                visits.map((visit) => (
                  <div key={visit.id} className="bg-white border border-[#E5E1DB] p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium">{visit.customer?.name || 'Client'}</p>
                        <p className="text-sm text-[#4A4D53]">{visit.customer?.phone}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium ${
                        visit.status === 'completed' ? 'bg-green-100 text-green-700' :
                        visit.status === 'at_property' ? 'bg-blue-100 text-blue-700' :
                        visit.status === 'rider_assigned' ? 'bg-[#C6A87C]/20 text-[#C6A87C]' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {visit.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="text-sm text-[#4A4D53] mb-3">
                      <p><Clock className="w-3 h-3 inline mr-1" /> {visit.scheduled_date} at {visit.scheduled_time}</p>
                      <p><Home className="w-3 h-3 inline mr-1" /> {visit.properties?.length || 0} properties</p>
                    </div>

                    {visit.rider && (
                      <div className="bg-[#F5F3F0] p-3 mb-3">
                        <p className="text-sm font-medium">Rider: {visit.rider.name}</p>
                        <p className="text-xs text-[#4A4D53]">
                          {visit.rider.is_online ? '🟢 Online' : '⚫ Offline'}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTrackVisit(visit)}
                        className="btn-secondary py-2 px-3 text-sm flex items-center gap-1 flex-1"
                        data-testid={`track-${visit.id}`}
                      >
                        <Navigation className="w-4 h-4" />
                        Track
                      </button>
                      {visit.rider_id && (
                        <button
                          onClick={() => openChat(visit)}
                          className="btn-primary py-2 px-3 text-sm flex items-center gap-1 flex-1"
                          data-testid={`chat-${visit.id}`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          Chat with Rider
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {commissions && (
              <>
                {/* Wallet Card */}
                <div className="bg-[#04473C] text-white p-6 mb-6">
                  <h3 className="text-lg mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Wallet</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-white/70">Total Earned</p>
                      <p className="text-2xl font-medium">₹{commissions.wallet?.total_earnings?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Pending</p>
                      <p className="text-2xl font-medium text-[#C6A87C]">₹{commissions.wallet?.pending_earnings?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Approved</p>
                      <p className="text-2xl font-medium text-green-400">₹{commissions.wallet?.approved_earnings?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Paid</p>
                      <p className="text-2xl font-medium">₹{commissions.wallet?.paid_earnings?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Commission Structure */}
                <div className="bg-white border border-[#E5E1DB] p-6 mb-6">
                  <h3 className="text-lg mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Commission Structure</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {commissions.commission_structure?.map((tier, idx) => (
                      <div key={idx} className="p-3 bg-[#F5F3F0] text-center">
                        <p className="text-xs text-[#4A4D53]">₹{tier.min.toLocaleString()} - ₹{tier.max.toLocaleString()}</p>
                        <p className="text-lg font-medium text-[#04473C]">₹{tier.commission.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Commission History */}
                <div className="bg-white border border-[#E5E1DB] p-6">
                  <h3 className="text-lg mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Commission History</h3>
                  {commissions.commissions?.length > 0 ? (
                    <div className="space-y-3">
                      {commissions.commissions.map((comm) => (
                        <div key={comm.id} className="flex items-center justify-between p-3 bg-[#F5F3F0]">
                          <div>
                            <p className="font-medium">{comm.property?.title || 'Property'}</p>
                            <p className="text-sm text-[#4A4D53]">
                              Brokerage: ₹{comm.brokerage_amount?.toLocaleString()}
                            </p>
                            <p className="text-xs text-[#4A4D53]">
                              {new Date(comm.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-medium text-green-600">
                              +₹{comm.commission_amount?.toLocaleString()}
                            </p>
                            <span className={`text-xs px-2 py-0.5 ${
                              comm.status === 'paid' ? 'bg-green-100 text-green-700' :
                              comm.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                              'bg-[#C6A87C]/20 text-[#C6A87C]'
                            }`}>
                              {comm.status?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#4A4D53] text-center py-8">No commissions yet</p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </main>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && shareProperty && shareData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white w-full md:max-w-md md:mx-4 rounded-t-2xl md:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-[#E5E1DB]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl" style={{ fontFamily: 'Playfair Display, serif' }}>Share Property</h3>
                  <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-[#F5F3F0] rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                {/* Property Preview */}
                <div className="bg-[#F5F3F0] p-4 mb-6 flex gap-3">
                  {shareProperty.images?.[0] && (
                    <img 
                      src={getMediaUrl(shareProperty.images[0])} 
                      alt="" 
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <div>
                    <p className="font-medium">{shareProperty.title}</p>
                    <p className="text-sm text-[#4A4D53]">{shareProperty.area_name}, {shareProperty.city}</p>
                    <p className="text-sm font-medium text-[#04473C]">₹{shareProperty.rent?.toLocaleString()}/month</p>
                  </div>
                </div>
                
                {/* Share Options Grid */}
                <p className="text-sm text-[#4A4D53] mb-3">Share via</p>
                <div className="grid grid-cols-4 gap-3 mb-6">
                  <button
                    onClick={openWhatsApp}
                    className="flex flex-col items-center gap-2 p-3 hover:bg-[#F5F3F0] rounded-lg transition-colors"
                  >
                    <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    <span className="text-xs">WhatsApp</span>
                  </button>
                  
                  <button
                    onClick={openTelegram}
                    className="flex flex-col items-center gap-2 p-3 hover:bg-[#F5F3F0] rounded-lg transition-colors"
                  >
                    <div className="w-12 h-12 bg-[#0088cc] rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                    </div>
                    <span className="text-xs">Telegram</span>
                  </button>
                  
                  <button
                    onClick={openSMS}
                    className="flex flex-col items-center gap-2 p-3 hover:bg-[#F5F3F0] rounded-lg transition-colors"
                  >
                    <div className="w-12 h-12 bg-[#4A4D53] rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs">SMS</span>
                  </button>
                  
                  <button
                    onClick={handleNativeShare}
                    className="flex flex-col items-center gap-2 p-3 hover:bg-[#F5F3F0] rounded-lg transition-colors"
                  >
                    <div className="w-12 h-12 bg-[#04473C] rounded-full flex items-center justify-center">
                      <Share2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs">More</span>
                  </button>
                </div>
                
                {/* Copy Link */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={getShareLink()}
                    readOnly
                    className="flex-1 premium-input py-2 text-sm bg-[#F5F3F0]"
                  />
                  <button
                    onClick={copyShareLink}
                    className="btn-primary px-4 py-2 text-sm flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
                
                <p className="text-xs text-[#4A4D53] text-center mt-4">
                  Your referral code <span className="font-medium text-[#04473C]">{user?.referral_code}</span> is included
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && selectedVisit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50"
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full md:max-w-md md:mx-4 h-[70vh] md:h-[500px] flex flex-col"
            >
              <div className="p-4 border-b border-[#E5E1DB] flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Chat with Rider</h3>
                  <p className="text-sm text-[#4A4D53]">Visit #{selectedVisit.id.slice(0, 8)}</p>
                </div>
                <button onClick={() => setShowChat(false)} className="p-2 hover:bg-[#F5F3F0]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-[80%] p-3 ${
                      msg.sender_role === 'seller'
                        ? 'ml-auto bg-[#04473C] text-white'
                        : 'bg-[#F5F3F0]'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              
              <div className="p-4 border-t border-[#E5E1DB] flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 premium-input py-2"
                />
                <button onClick={sendMessage} className="btn-primary px-4">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add New Follow-up Modal */}
      <AnimatePresence>
        {showAddFollowup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-4 border-b border-[#E5E1DB] flex items-center justify-between">
                <h3 className="font-semibold text-lg">Add New Lead</h3>
                <button onClick={() => setShowAddFollowup(false)} className="p-2 hover:bg-[#F5F3F0]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4A4D53] mb-1">Client Name *</label>
                    <input
                      type="text"
                      value={newFollowup.client_name}
                      onChange={(e) => setNewFollowup({...newFollowup, client_name: e.target.value})}
                      className="premium-input w-full"
                      placeholder="Enter name"
                      data-testid="followup-client-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4A4D53] mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={newFollowup.client_phone}
                      onChange={(e) => setNewFollowup({...newFollowup, client_phone: e.target.value})}
                      className="premium-input w-full"
                      placeholder="10-digit number"
                      data-testid="followup-client-phone"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#4A4D53] mb-1">Status</label>
                  <select
                    value={newFollowup.status}
                    onChange={(e) => setNewFollowup({...newFollowup, status: e.target.value})}
                    className="premium-input w-full"
                  >
                    {FOLLOWUP_STATUSES.filter(s => !s.value.startsWith('closed')).map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4A4D53] mb-1">Budget (₹)</label>
                    <input
                      type="number"
                      value={newFollowup.client_budget}
                      onChange={(e) => setNewFollowup({...newFollowup, client_budget: e.target.value})}
                      className="premium-input w-full"
                      placeholder="e.g. 25000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4A4D53] mb-1">Call Duration (mins)</label>
                    <input
                      type="number"
                      value={newFollowup.call_duration_mins}
                      onChange={(e) => setNewFollowup({...newFollowup, call_duration_mins: e.target.value})}
                      className="premium-input w-full"
                      placeholder="e.g. 15"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#4A4D53] mb-1">Requirements</label>
                  <input
                    type="text"
                    value={newFollowup.client_requirements}
                    onChange={(e) => setNewFollowup({...newFollowup, client_requirements: e.target.value})}
                    className="premium-input w-full"
                    placeholder="e.g. 2BHK near metro, furnished"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#4A4D53] mb-1">Next Follow-up Date</label>
                  <input
                    type="datetime-local"
                    value={newFollowup.next_followup_date}
                    onChange={(e) => setNewFollowup({...newFollowup, next_followup_date: e.target.value})}
                    className="premium-input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#4A4D53] mb-1">Notes * (min 10 chars)</label>
                  <textarea
                    value={newFollowup.notes}
                    onChange={(e) => setNewFollowup({...newFollowup, notes: e.target.value})}
                    className="premium-input w-full h-24 resize-none"
                    placeholder="Enter call notes, client requirements, discussion summary..."
                    data-testid="followup-notes"
                  />
                  <p className="text-xs text-[#9CA3AF] mt-1">{newFollowup.notes.length}/10 characters</p>
                </div>
              </div>
              
              <div className="p-4 border-t border-[#E5E1DB] flex gap-3">
                <button
                  onClick={() => setShowAddFollowup(false)}
                  className="flex-1 py-2 border border-[#E5E1DB] text-[#4A4D53] hover:bg-[#F5F3F0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFollowup}
                  className="flex-1 btn-primary py-2"
                  data-testid="save-followup-btn"
                >
                  Save Lead
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Follow-up Modal */}
      <AnimatePresence>
        {showUpdateFollowup && selectedFollowup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg"
            >
              <div className="p-4 border-b border-[#E5E1DB] flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Add Follow-up Update</h3>
                  <p className="text-sm text-[#4A4D53]">{selectedFollowup.client_name} - {selectedFollowup.client_phone}</p>
                </div>
                <button onClick={() => setShowUpdateFollowup(false)} className="p-2 hover:bg-[#F5F3F0]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4A4D53] mb-1">New Status</label>
                  <select
                    value={updateData.status}
                    onChange={(e) => setUpdateData({...updateData, status: e.target.value})}
                    className="premium-input w-full"
                  >
                    {FOLLOWUP_STATUSES.filter(s => !s.value.startsWith('closed')).map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4A4D53] mb-1">Call Duration (mins)</label>
                    <input
                      type="number"
                      value={updateData.call_duration_mins}
                      onChange={(e) => setUpdateData({...updateData, call_duration_mins: e.target.value})}
                      className="premium-input w-full"
                      placeholder="e.g. 10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4A4D53] mb-1">Next Follow-up</label>
                    <input
                      type="datetime-local"
                      value={updateData.next_followup_date}
                      onChange={(e) => setUpdateData({...updateData, next_followup_date: e.target.value})}
                      className="premium-input w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#4A4D53] mb-1">Notes * (min 10 chars)</label>
                  <textarea
                    value={updateData.notes}
                    onChange={(e) => setUpdateData({...updateData, notes: e.target.value})}
                    className="premium-input w-full h-24 resize-none"
                    placeholder="What was discussed? Any updates from client?"
                  />
                  <p className="text-xs text-[#9CA3AF] mt-1">{updateData.notes.length}/10 characters</p>
                </div>
              </div>
              
              <div className="p-4 border-t border-[#E5E1DB] flex gap-3">
                <button
                  onClick={() => setShowUpdateFollowup(false)}
                  className="flex-1 py-2 border border-[#E5E1DB] text-[#4A4D53] hover:bg-[#F5F3F0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateFollowup}
                  className="flex-1 btn-primary py-2"
                >
                  Save Update
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close Lead Modal */}
      <AnimatePresence>
        {showCloseModal && selectedFollowup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg"
            >
              <div className="p-4 border-b border-[#E5E1DB]">
                <h3 className="font-semibold text-lg">Close Lead</h3>
                <p className="text-sm text-[#4A4D53]">{selectedFollowup.client_name}</p>
                {selectedFollowup.total_followups < 2 && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    You need at least 2 follow-ups to close this lead
                  </p>
                )}
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4A4D53] mb-2">Outcome *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setCloseData({...closeData, outcome: 'closed_won'})}
                      className={`p-4 border-2 flex flex-col items-center gap-2 transition-colors ${
                        closeData.outcome === 'closed_won' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-[#E5E1DB] hover:border-green-300'
                      }`}
                    >
                      <UserCheck className={`w-8 h-8 ${closeData.outcome === 'closed_won' ? 'text-green-600' : 'text-[#4A4D53]'}`} />
                      <span className={`font-medium ${closeData.outcome === 'closed_won' ? 'text-green-700' : 'text-[#1A1C20]'}`}>
                        Deal Won
                      </span>
                    </button>
                    <button
                      onClick={() => setCloseData({...closeData, outcome: 'closed_lost'})}
                      className={`p-4 border-2 flex flex-col items-center gap-2 transition-colors ${
                        closeData.outcome === 'closed_lost' 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-[#E5E1DB] hover:border-red-300'
                      }`}
                    >
                      <XCircle className={`w-8 h-8 ${closeData.outcome === 'closed_lost' ? 'text-red-600' : 'text-[#4A4D53]'}`} />
                      <span className={`font-medium ${closeData.outcome === 'closed_lost' ? 'text-red-700' : 'text-[#1A1C20]'}`}>
                        Deal Lost
                      </span>
                    </button>
                  </div>
                </div>
                
                {closeData.outcome === 'closed_won' && (
                  <div>
                    <label className="block text-sm font-medium text-[#4A4D53] mb-1">Brokerage Amount (₹) *</label>
                    <input
                      type="number"
                      value={closeData.brokerage_amount}
                      onChange={(e) => setCloseData({...closeData, brokerage_amount: e.target.value})}
                      className="premium-input w-full"
                      placeholder="e.g. 25000"
                    />
                    <p className="text-xs text-[#04473C] mt-1">Your commission will be calculated based on this amount</p>
                  </div>
                )}
                
                {closeData.outcome === 'closed_lost' && (
                  <div>
                    <label className="block text-sm font-medium text-[#4A4D53] mb-1">Loss Reason * (min 10 chars)</label>
                    <input
                      type="text"
                      value={closeData.loss_reason}
                      onChange={(e) => setCloseData({...closeData, loss_reason: e.target.value})}
                      className="premium-input w-full"
                      placeholder="e.g. Client found another property, Budget issues"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-[#4A4D53] mb-1">Final Notes * (min 20 chars)</label>
                  <textarea
                    value={closeData.final_notes}
                    onChange={(e) => setCloseData({...closeData, final_notes: e.target.value})}
                    className="premium-input w-full h-24 resize-none"
                    placeholder="Provide detailed closing notes about this deal..."
                  />
                  <p className="text-xs text-[#9CA3AF] mt-1">{closeData.final_notes.length}/20 characters</p>
                </div>
              </div>
              
              <div className="p-4 border-t border-[#E5E1DB] flex gap-3">
                <button
                  onClick={() => {
                    setShowCloseModal(false);
                    setSelectedFollowup(null);
                  }}
                  className="flex-1 py-2 border border-[#E5E1DB] text-[#4A4D53] hover:bg-[#F5F3F0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseLead}
                  disabled={!closeData.outcome || selectedFollowup.total_followups < 2}
                  className={`flex-1 py-2 font-medium transition-colors ${
                    closeData.outcome === 'closed_won' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : closeData.outcome === 'closed_lost'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {closeData.outcome === 'closed_won' ? 'Mark as Won' : 
                   closeData.outcome === 'closed_lost' ? 'Mark as Lost' : 'Select Outcome'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SellerDashboard;
